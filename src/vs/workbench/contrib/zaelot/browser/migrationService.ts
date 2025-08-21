/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { URI } from '../../../../base/common/uri.js';
import { joinPath } from '../../../../base/common/resources.js';
import { IExtensionManagementService, IExtensionGalleryService } from '../../../../platform/extensionManagement/common/extensionManagement.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';

import { localize } from '../../../../nls.js';
import { isWindows, isMacintosh } from '../../../../base/common/platform.js';

import { IProgressService, ProgressLocation } from '../../../../platform/progress/common/progress.js';

export const IMigrationService = createDecorator<IMigrationService>('migrationService');

export interface IDetectedInstallation {
	id: string;
	name: string;
	path: string;
	userDataPath: string;
	extensionsPath: string;
	exists: boolean;
}

export interface IMigrationService {
	readonly _serviceBrand: undefined;

	detectInstallations(): Promise<IDetectedInstallation[]>;
	performAutomaticMigration(installation: IDetectedInstallation): Promise<void>;
	showMigrationInfo(): Promise<void>;
}

export class MigrationService extends Disposable implements IMigrationService {
	readonly _serviceBrand: undefined;

	constructor(
		@ILogService private readonly logService: ILogService,
		@INotificationService private readonly notificationService: INotificationService,
		@IFileService private readonly fileService: IFileService,
		@IProgressService private readonly progressService: IProgressService,
		@IExtensionManagementService private readonly extensionManagementService: IExtensionManagementService,
		@IExtensionGalleryService private readonly extensionGalleryService: IExtensionGalleryService,
		@ICommandService private readonly commandService: ICommandService,
	) {
		super();
		this.logService.info('MigrationService initialized with automatic migration capabilities');
	}

	async detectInstallations(): Promise<IDetectedInstallation[]> {

		this.logService.info('[Migration] Detecting existing VS Code / Cursor installations...');

		// Check if installations actually exist before declaring them
		const homeDir = this.getHomePath();
		const candidates = [
			{
				id: 'vscode',
				name: 'Visual Studio Code',
				path: isMacintosh
					? `${homeDir}/Library/Application Support/Code`
					: isWindows
						? `${homeDir}\\AppData\\Roaming\\Code`
						: `${homeDir}/.config/Code`,
				userDataPath: isMacintosh
					? `${homeDir}/Library/Application Support/Code`
					: isWindows
						? `${homeDir}\\AppData\\Roaming\\Code`
						: `${homeDir}/.config/Code`,
				extensionsPath: isMacintosh
					? `${homeDir}/.vscode/extensions`
					: isWindows
						? `${homeDir}\\.vscode\\extensions`
						: `${homeDir}/.vscode/extensions`
			},
			{
				id: 'cursor',
				name: 'Cursor',
				path: isMacintosh
					? `${homeDir}/Library/Application Support/Cursor`
					: isWindows
						? `${homeDir}\\AppData\\Roaming\\Cursor`
						: `${homeDir}/.config/Cursor`,
				userDataPath: isMacintosh
					? `${homeDir}/Library/Application Support/Cursor`
					: isWindows
						? `${homeDir}\\AppData\\Roaming\\Cursor`
						: `${homeDir}/.config/Cursor`,
				extensionsPath: isMacintosh
					? `${homeDir}/.cursor/extensions`
					: isWindows
						? `${homeDir}\\.cursor\\extensions`
						: `${homeDir}/.cursor/extensions`
			}
		];

		const installations: IDetectedInstallation[] = [];

		for (const candidate of candidates) {

			this.logService.info(`[SEARCH] Checking ${candidate.name}:`);
			this.logService.info(`  - User data path: ${candidate.userDataPath}`);
			this.logService.info(`  - Extensions path: ${candidate.extensionsPath}`);

			// Check if user data path exists
			const userDataExists = await this.fileService.exists(URI.file(candidate.userDataPath));
			this.logService.info(`  - User data exists: ${userDataExists}`);

			// Check if extensions path exists
			const extensionsExists = await this.fileService.exists(URI.file(candidate.extensionsPath));
			this.logService.info(`  - Extensions dir exists: ${extensionsExists}`);

			// Check if settings.json exists
			const settingsPath = joinPath(URI.file(candidate.userDataPath), 'User', 'settings.json');
			const settingsExists = await this.fileService.exists(settingsPath);
			this.logService.info(`  - Settings file exists: ${settingsExists}`);

			// Check if extensions.json exists
			const extensionsJsonPath = joinPath(URI.file(candidate.extensionsPath), 'extensions.json');
			const extensionsJsonExists = await this.fileService.exists(extensionsJsonPath);
			this.logService.info(`  - Extensions.json exists: ${extensionsJsonExists}`);

			const exists = userDataExists && extensionsExists && settingsExists;
			this.logService.info(`  - [OK] Installation valid: ${exists}`);

			installations.push({
				...candidate,
				exists
			});
		}

		const foundInstallations = installations.filter(i => i.exists);

		this.logService.info(`[TARGET] Detected ${foundInstallations.length} valid installations out of ${installations.length} candidates.`);

		return installations;
	}

	async performAutomaticMigration(installation: IDetectedInstallation): Promise<void> {
		if (!installation.exists) {
			throw new Error(`Installation ${installation.name} does not exist`);
		}


		this.logService.info(`[START] Starting automatic migration from ${installation.name}`);
		this.logService.info(`Source path: ${installation.path}`);
		this.logService.info(`User data path: ${installation.userDataPath}`);

		try {
			await this.progressService.withProgress({
				location: ProgressLocation.Notification,
				title: localize('migration.progress.title', 'Migrating from {0}', installation.name),
				cancellable: false
			}, async (progress) => {

				// Step 1: Copy settings
				progress.report({ message: localize('migration.step.settings', 'Copying settings...'), increment: 20 });
				await this.copySettings(installation);

				// Step 2: Copy keybindings
				progress.report({ message: localize('migration.step.keybindings', 'Copying keybindings...'), increment: 20 });
				await this.copyKeybindings(installation);

				// Step 3: Copy snippets
				progress.report({ message: localize('migration.step.snippets', 'Copying snippets...'), increment: 20 });
				await this.copySnippets(installation);

				// Step 4: Install extensions
				progress.report({ message: localize('migration.step.extensions', 'Installing extensions...'), increment: 20 });
				await this.installExtensions(installation);

				// Step 5: Copy other files
				progress.report({ message: localize('migration.step.others', 'Copying other settings...'), increment: 20 });
				await this.copyOtherFiles(installation);

				progress.report({ message: localize('migration.complete', 'Migration completed!'), increment: 0 });
			});

			this.notificationService.notify({
				severity: Severity.Info,

				message: localize('migration.success', '[SUCCESS] Successfully migrated from {0}! Restarting application...', installation.name)
			});

			// Auto-restart the application to apply all changes
			setTimeout(() => {

				this.logService.info('[RELOAD] Auto-restarting application to apply migration changes...');
				this.commandService.executeCommand('workbench.action.reloadWindow');
			}, 2000); // Give user 2 seconds to read the success message
		} catch (error) {
			this.logService.error('Migration failed with error:', error);
			throw error; // Re-throw to let the caller handle it
		}
	}

	private async copySettings(installation: IDetectedInstallation): Promise<void> {
		this.logService.info('[SETTINGS] Starting settings migration...');

		try {
			const sourceSettingsPath = joinPath(URI.file(installation.userDataPath), 'User', 'settings.json');
			const currentUserDataPath = this.calculateUserDataPath();

			this.logService.info(`[FOLDER] Source settings path: ${sourceSettingsPath.fsPath}`);
			this.logService.info(`[FOLDER] Target user data path: ${currentUserDataPath}`);

			// Ensure User directory exists first
			const userDir = joinPath(URI.file(currentUserDataPath), 'User');
			this.logService.info(`[DIR] Creating User directory: ${userDir.fsPath}`);

			try {
				await this.fileService.createFolder(userDir);
				this.logService.info('[OK] User directory created/exists');
			} catch (e) {
				this.logService.info('[INFO] User directory already exists');
			}

			const targetSettingsPath = joinPath(URI.file(currentUserDataPath), 'User', 'settings.json');
			this.logService.info(`[FILE] Target settings path: ${targetSettingsPath.fsPath}`);

			// Check if source settings exist
			const sourceExists = await this.fileService.exists(sourceSettingsPath);
			this.logService.info(`[SEARCH] Source settings exist: ${sourceExists}`);

			if (!sourceExists) {
				this.logService.warn(`[ERROR] Settings file not found at: ${sourceSettingsPath.fsPath}`);
				return;
			}

			// Read source settings
			this.logService.info('[READ] Reading source settings...');
			const settingsContent = await this.fileService.readFile(sourceSettingsPath);
			this.logService.info(`[SIZE] Settings file size: ${settingsContent.value.byteLength} bytes`);

			// Parse and analyze settings
			let settingsObj: any = {};
			try {
				settingsObj = JSON.parse(settingsContent.value.toString());
				const settingsKeys = Object.keys(settingsObj);
				this.logService.info(`[STATS] Found ${settingsKeys.length} settings`);
				this.logService.info(`[CONFIG] First 10 settings: ${settingsKeys.slice(0, 10).join(', ')}${settingsKeys.length > 10 ? '...' : ''}`);

				// Log important theme/appearance settings
				const importantSettings = ['workbench.colorTheme', 'workbench.iconTheme', 'editor.fontFamily', 'editor.fontSize', 'editor.theme'];
				const foundImportant = importantSettings.filter(key => settingsObj[key] !== undefined);
				if (foundImportant.length > 0) {
					this.logService.info(`[THEME] Theme/appearance settings found: ${foundImportant.length}`);
					foundImportant.forEach(key => {
						this.logService.info(`  - ${key}: ${JSON.stringify(settingsObj[key])}`);
					});
				} else {
					this.logService.warn('[WARN] No theme/appearance settings found');
				}

			} catch (parseError) {
				this.logService.warn('[WARN] Could not parse settings for analysis:', parseError);
			}

			// Write to target
			this.logService.info('[SAVE] Writing settings to target location...');
			await this.fileService.writeFile(targetSettingsPath, settingsContent.value);

			// Verify target file was written
			const targetExists = await this.fileService.exists(targetSettingsPath);
			this.logService.info(`[OK] Settings copied successfully. Target exists: ${targetExists}`);

			if (targetExists) {
				const targetContent = await this.fileService.readFile(targetSettingsPath);
				this.logService.info(`[BYTES] Target file size: ${targetContent.value.byteLength} bytes`);
			}

		} catch (error) {
			this.logService.error('[ERROR] Failed to copy settings:', error);
		}
	}

	private async copyKeybindings(installation: IDetectedInstallation): Promise<void> {
		try {
			const sourceKeybindingsPath = joinPath(URI.file(installation.userDataPath), 'User', 'keybindings.json');
			const currentUserDataPath = this.calculateUserDataPath();
			const targetKeybindingsPath = joinPath(URI.file(currentUserDataPath), 'User', 'keybindings.json');

			if (await this.fileService.exists(sourceKeybindingsPath)) {
				const keybindingsContent = await this.fileService.readFile(sourceKeybindingsPath);
				await this.fileService.writeFile(targetKeybindingsPath, keybindingsContent.value);

				this.logService.info('[OK] Keybindings copied successfully');
			}
		} catch (error) {

			this.logService.warn('[WARN] Failed to copy keybindings:', error);
		}
	}

	private async copySnippets(installation: IDetectedInstallation): Promise<void> {
		try {
			const sourceSnippetsPath = joinPath(URI.file(installation.userDataPath), 'User', 'snippets');
			const currentUserDataPath = this.calculateUserDataPath();
			const targetSnippetsPath = joinPath(URI.file(currentUserDataPath), 'User', 'snippets');

			if (await this.fileService.exists(sourceSnippetsPath)) {
				// Copy entire snippets directory
				await this.fileService.copy(sourceSnippetsPath, targetSnippetsPath, true);

				this.logService.info('[OK] Snippets copied successfully');
			}
		} catch (error) {

			this.logService.warn('[WARN] Failed to copy snippets:', error);
		}
	}

	private async installExtensions(installation: IDetectedInstallation): Promise<void> {
		this.logService.info('[CONFIG] Starting extension installation process...');

		try {
			// Check if extension gallery service is available
			if (!this.extensionGalleryService) {
				this.logService.error('[ERROR] Extension Gallery Service is not available!');
				return;
			}

			this.logService.info('[OK] Extension Gallery Service is available');

			// Check if gallery service is enabled
			const isEnabled = this.extensionGalleryService.isEnabled();
			this.logService.info(`[SEARCH] Gallery service enabled: ${isEnabled}`);

			if (!isEnabled) {
				this.logService.error('[ERROR] Extension Gallery Service is not enabled in product configuration');
				return;
			}

			// Look for extensions.json in the extensions directory
			const extensionsJsonPath = joinPath(URI.file(installation.extensionsPath), 'extensions.json');
			this.logService.info(`[SEARCH] Looking for extensions at: ${extensionsJsonPath.fsPath}`);

			const extensionsJsonExists = await this.fileService.exists(extensionsJsonPath);
			this.logService.info(`[DIR] Extensions.json exists: ${extensionsJsonExists}`);

			if (!extensionsJsonExists) {
				this.logService.warn(`[ERROR] Extensions file not found at: ${extensionsJsonPath.fsPath}`);
				return;
			}

			this.logService.info('[READ] Reading extensions.json file...');
			const extensionsContent = await this.fileService.readFile(extensionsJsonPath);
			this.logService.info(`[SIZE] Extensions file size: ${extensionsContent.value.byteLength} bytes`);

			// Parse the complex extensions JSON structure
			let extensionsData;
			try {
				extensionsData = JSON.parse(extensionsContent.value.toString());
				this.logService.info(`[OK] Successfully parsed extensions.json`);
				this.logService.info(`[STATS] Found ${extensionsData.length || 0} installed extensions`);
			} catch (parseError) {
				this.logService.error('[ERROR] Failed to parse extensions.json:', parseError);
				return;
			}

			if (!Array.isArray(extensionsData) || extensionsData.length === 0) {
				this.logService.warn('[WARN] No extensions found in extensions.json');
				return;
			}

			// Get currently installed extensions for comparison
			this.logService.info('[SEARCH] Getting currently installed extensions...');
			const installedExtensions = await this.extensionManagementService.getInstalled();
			this.logService.info(`[LIST] Currently installed: ${installedExtensions.length} extensions`);

			let successCount = 0;
			let skippedCount = 0;
			let errorCount = 0;

			for (let i = 0; i < extensionsData.length; i++) {
				const extension = extensionsData[i];
				this.logService.info(`\n[CONFIG] Processing extension ${i + 1}/${extensionsData.length}:`);

				try {
					const extensionId = extension.identifier?.id;
					if (!extensionId) {
						this.logService.warn('[WARN] Extension has no identifier, skipping');
						skippedCount++;
						continue;
					}

					this.logService.info(`  [PKG] Extension ID: ${extensionId}`);
					this.logService.info(`  [VER]  Version: ${extension.version || 'unknown'}`);

					// Check if already installed
					const alreadyInstalled = installedExtensions.find(ext =>
						ext.identifier.id.toLowerCase() === extensionId.toLowerCase()
					);

					if (alreadyInstalled) {
						this.logService.info(`  [SKIP] Already installed: ${extensionId} (v${alreadyInstalled.manifest.version})`);
						skippedCount++;
						continue;
					}

					// Search for extension in gallery
					this.logService.info(`  [SEARCH] Searching marketplace for: ${extensionId}`);

					const queryResult = await this.extensionGalleryService.query({
						text: extensionId,
						pageSize: 1
					}, CancellationToken.None);

					this.logService.info(`  [STATS] Marketplace search results: ${queryResult.firstPage.length} found`);

					if (queryResult.firstPage.length === 0) {
						this.logService.warn(`  [ERROR] Extension not found in marketplace: ${extensionId}`);
						errorCount++;
						continue;
					}

					const galleryExtension = queryResult.firstPage[0];
					this.logService.info(`  [OK] Found in marketplace: ${galleryExtension.displayName || extensionId}`);
					this.logService.info(`  [DL] Downloads: ${(galleryExtension as any).statistics?.find((s: any) => s.statisticName === 'install')?.value || 'unknown'}`);

					// Install the extension
					this.logService.info(`  [INSTALL] Installing ${extensionId}...`);

					try {
						await this.extensionManagementService.installFromGallery(galleryExtension);
						this.logService.info(`  [OK] Successfully installed: ${extensionId}`);
						successCount++;
					} catch (installError) {
						this.logService.error(`  [ERROR] Installation failed for ${extensionId}:`, installError);
						errorCount++;
					}

				} catch (extensionError) {
					this.logService.error(`  [ERROR] Error processing ${extension.identifier?.id || 'unknown'}:`, extensionError);
					errorCount++;
				}
			}

			// Summary
			this.logService.info(`\n[STATS] Extension migration summary:`);
			this.logService.info(`  [OK] Successfully installed: ${successCount}`);
			this.logService.info(`  [SKIP] Already installed (skipped): ${skippedCount}`);
			this.logService.info(`  [ERROR] Failed: ${errorCount}`);
			this.logService.info(`  [PKG] Total processed: ${extensionsData.length}`);

		} catch (error) {
			this.logService.error('[ERROR] Critical error in extension installation:', error);
		}
	}

	private async copyOtherFiles(installation: IDetectedInstallation): Promise<void> {
		try {
			// Copy other useful files like tasks.json, launch.json, etc.
			const filesToCopy = [
				'globalStorage',
				'workspaceStorage',
				'logs'
			];

			for (const fileName of filesToCopy) {
				try {
					const sourcePath = joinPath(URI.file(installation.userDataPath), fileName);
					const currentUserDataPath = this.calculateUserDataPath();
					const targetPath = joinPath(URI.file(currentUserDataPath), fileName);

					if (await this.fileService.exists(sourcePath)) {
						await this.fileService.copy(sourcePath, targetPath, true);

						this.logService.info(`[OK] Copied ${fileName} successfully`);
					}
				} catch (error) {

					this.logService.warn(`[WARN] Failed to copy ${fileName}:`, error);
				}
			}
		} catch (error) {

			this.logService.warn('[WARN] Failed to copy other files:', error);
		}
	}

	async showMigrationInfo(): Promise<void> {
		this.logService.info('Migration service: Showing migration information');
		// This method is called by the migration commands
		// The actual migration logic is now in performAutomaticMigration
	}

	private getHomePath(): string {
		// Get home directory using platform-specific environment variables
		// Note: In browser context, we need to access environment through a different mechanism
		try {
			// Try to get from global process first
			const envHome = (globalThis as any).process?.env?.HOME;
			const envUser = (globalThis as any).process?.env?.USER || (globalThis as any).process?.env?.USERNAME;

			this.logService.info(`Environment check - HOME: ${envHome}, USER: ${envUser}`);

			if (envHome) {
				return envHome;
			}

			if (isWindows) {
				// For Windows, try common paths
				return 'C:\\Users\\' + (envUser || 'user');
			} else if (isMacintosh) {
				// For macOS, use the actual detected user or a generic fallback
				return '/Users/' + (envUser || 'user');
			} else {
				// For Linux, use common home path
				return '/home/' + (envUser || 'user');
			}
		} catch (error) {
			this.logService.warn('Error accessing environment variables:', error);
			// Fallback paths if environment access fails
			if (isWindows) {
				return 'C:\\Users\\user';
			} else if (isMacintosh) {
				// Use generic fallback for macOS
				return '/Users/user';
			} else {
				return '/home/user';
			}
		}
	}

	private calculateUserDataPath(): string {
		// Calculate the actual user data path that the app is using
		const homePath = this.getHomePath();

		// In development, VSCode uses 'code-oss-dev' as the folder name
		// In production, it would use the actual product name
		const isDev = (globalThis as any).process?.env?.VSCODE_DEV;
		const folderName = isDev ? 'code-oss-dev' : 'Zaelot Developer Studio';

		try {
			if (isWindows) {
				const appData = (globalThis as any).process?.env?.APPDATA || `${homePath}\\AppData\\Roaming`;
				return `${appData}\\${folderName}`;
			} else if (isMacintosh) {
				return `${homePath}/Library/Application Support/${folderName}`;
			} else {
				// Linux
				const configHome = (globalThis as any).process?.env?.XDG_CONFIG_HOME || `${homePath}/.config`;
				return `${configHome}/${folderName}`;
			}
		} catch (error) {
			// Fallback paths if environment access fails
			if (isWindows) {
				return `${homePath}\\AppData\\Roaming\\${folderName}`;
			} else if (isMacintosh) {
				return `${homePath}/Library/Application Support/${folderName}`;
			} else {
				return `${homePath}/.config/${folderName}`;
			}
		}
	}
}
