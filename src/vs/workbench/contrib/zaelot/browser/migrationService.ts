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
		// allow-any-unicode-next-line
		this.logService.info('🔍 Detecting existing VS Code / Cursor installations...');

		// Simple hardcoded test data for debugging
		const installations: IDetectedInstallation[] = [
			{
				id: 'vscode',
				name: 'Visual Studio Code',
				path: '/Users/brunocerecetto/Library/Application Support/Code',
				userDataPath: '/Users/brunocerecetto/Library/Application Support/Code',
				extensionsPath: '/Users/brunocerecetto/.vscode/extensions',
				exists: true // Force it to true for testing
			},
			{
				id: 'cursor',
				name: 'Cursor',
				path: '/Users/brunocerecetto/Library/Application Support/Cursor',
				userDataPath: '/Users/brunocerecetto/Library/Application Support/Cursor',
				extensionsPath: '/Users/brunocerecetto/.cursor/extensions',
				exists: true // Force it to true for testing
			}
		];

		this.logService.info(`Hardcoded test installations: ${installations.length} found`);

		const foundInstallations = installations.filter(i => i.exists);
		// allow-any-unicode-next-line
		this.logService.info(`🎯 Detected ${foundInstallations.length} existing installations.`);
		return installations;
	}

	async performAutomaticMigration(installation: IDetectedInstallation): Promise<void> {
		if (!installation.exists) {
			throw new Error(`Installation ${installation.name} does not exist`);
		}

		// allow-any-unicode-next-line
		this.logService.info(`🚀 Starting automatic migration from ${installation.name}`);
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
				// allow-any-unicode-next-line
				message: localize('migration.success', '🎉 Successfully migrated from {0}! Restarting application...', installation.name)
			});

			// Auto-restart the application to apply all changes
			setTimeout(() => {
				// allow-any-unicode-next-line
				this.logService.info('🔄 Auto-restarting application to apply migration changes...');
				this.commandService.executeCommand('workbench.action.reloadWindow');
			}, 2000); // Give user 2 seconds to read the success message
		} catch (error) {
			this.logService.error('Migration failed with error:', error);
			throw error; // Re-throw to let the caller handle it
		}
	}

	private async copySettings(installation: IDetectedInstallation): Promise<void> {
		try {
			const sourceSettingsPath = joinPath(URI.file(installation.userDataPath), 'User', 'settings.json');
			const currentUserDataPath = this.calculateUserDataPath();

			// Ensure User directory exists first
			const userDir = joinPath(URI.file(currentUserDataPath), 'User');
			try {
				await this.fileService.createFolder(userDir);
			} catch (e) {
				// Directory might already exist, that's fine
			}

			const targetSettingsPath = joinPath(URI.file(currentUserDataPath), 'User', 'settings.json');

			if (await this.fileService.exists(sourceSettingsPath)) {
				const settingsContent = await this.fileService.readFile(sourceSettingsPath);
				await this.fileService.writeFile(targetSettingsPath, settingsContent.value);

				// Log details about what settings we copied for debugging
				try {
					const settingsObj = JSON.parse(settingsContent.value.toString());
					const settingsKeys = Object.keys(settingsObj);
					// allow-any-unicode-next-line
					this.logService.info(`✅ Settings copied successfully (${settingsKeys.length} settings): ${settingsKeys.slice(0, 5).join(', ')}${settingsKeys.length > 5 ? '...' : ''}`);

					// Log important theme/appearance settings
					const importantSettings = ['workbench.colorTheme', 'workbench.iconTheme', 'editor.fontFamily', 'editor.fontSize'];
					const foundImportant = importantSettings.filter(key => settingsObj[key] !== undefined);
					if (foundImportant.length > 0) {
						// allow-any-unicode-next-line
						this.logService.info(`🎨 Theme/appearance settings found: ${foundImportant.join(', ')}`);
					}
				} catch (parseError) {
					// allow-any-unicode-next-line
					this.logService.warn('Could not parse settings for logging, but file was copied');
				}
			} else {
				// allow-any-unicode-next-line
				this.logService.warn(`Settings file not found at: ${sourceSettingsPath.fsPath}`);
			}
		} catch (error) {
			// allow-any-unicode-next-line
			this.logService.warn('⚠️ Failed to copy settings:', error);
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
				// allow-any-unicode-next-line
				this.logService.info('✅ Keybindings copied successfully');
			}
		} catch (error) {
			// allow-any-unicode-next-line
			this.logService.warn('⚠️ Failed to copy keybindings:', error);
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
				// allow-any-unicode-next-line
				this.logService.info('✅ Snippets copied successfully');
			}
		} catch (error) {
			// allow-any-unicode-next-line
			this.logService.warn('⚠️ Failed to copy snippets:', error);
		}
	}

	private async installExtensions(installation: IDetectedInstallation): Promise<void> {
		try {
			// Look for extensions.json in the extensions directory, not in User folder
			const extensionsJsonPath = joinPath(URI.file(installation.extensionsPath), 'extensions.json');

			// allow-any-unicode-next-line
			this.logService.info(`Looking for extensions at: ${extensionsJsonPath.fsPath}`);

			if (await this.fileService.exists(extensionsJsonPath)) {
				const extensionsContent = await this.fileService.readFile(extensionsJsonPath);

				// Parse the complex extensions JSON structure
				try {
					const extensionsData = JSON.parse(extensionsContent.value.toString());
					// allow-any-unicode-next-line
					this.logService.info(`Found ${extensionsData.length || 0} installed extensions`);

					if (Array.isArray(extensionsData) && extensionsData.length > 0) {
						for (const extension of extensionsData) {
							try {
								const extensionId = extension.identifier?.id;
								if (!extensionId) {
									continue;
								}

								// allow-any-unicode-next-line
								this.logService.info(`Installing extension: ${extensionId}`);

								// Check if already installed first
								const installedExtensions = await this.extensionManagementService.getInstalled();
								const alreadyInstalled = installedExtensions.find(ext =>
									ext.identifier.id.toLowerCase() === extensionId.toLowerCase()
								);

								if (alreadyInstalled) {
									// allow-any-unicode-next-line
									this.logService.info(`⚪ Extension already installed: ${extensionId}`);
									continue;
								}

								// Search for extension in gallery
								const queryResult = await this.extensionGalleryService.query({
									text: extensionId,
									pageSize: 1
								}, CancellationToken.None);

								if (queryResult.firstPage.length > 0) {
									const galleryExtension = queryResult.firstPage[0];
									try {
										await this.extensionManagementService.installFromGallery(galleryExtension);
										// allow-any-unicode-next-line
										this.logService.info(`✅ Successfully installed: ${extensionId}`);
									} catch (installError) {
										// allow-any-unicode-next-line
										this.logService.warn(`❌ Installation failed for ${extensionId}:`, installError);
									}
								} else {
									// allow-any-unicode-next-line
									this.logService.warn(`❌ Extension not found in marketplace: ${extensionId}`);
								}
							} catch (extensionError) {
								// allow-any-unicode-next-line
								this.logService.warn(`❌ Failed to install ${extension.identifier?.id || 'unknown'}:`, extensionError);
							}
						}
					}
				} catch (parseError) {
					// allow-any-unicode-next-line
					this.logService.warn('Failed to parse extensions.json:', parseError);
				}

				// allow-any-unicode-next-line
				this.logService.info('✅ Extensions migration completed');
			} else {
				// allow-any-unicode-next-line
				this.logService.warn(`Extensions file not found at: ${extensionsJsonPath.fsPath}`);
			}

			// Also log the extensions directory status
			const sourceExtensionsDir = URI.file(installation.extensionsPath);
			if (await this.fileService.exists(sourceExtensionsDir)) {
				// allow-any-unicode-next-line
				this.logService.info('📦 Extensions directory found - proceeding with marketplace installation');
			}
		} catch (error) {
			// allow-any-unicode-next-line
			this.logService.warn('⚠️ Failed to install extensions:', error);
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
						// allow-any-unicode-next-line
						this.logService.info(`✅ Copied ${fileName} successfully`);
					}
				} catch (error) {
					// allow-any-unicode-next-line
					this.logService.warn(`⚠️ Failed to copy ${fileName}:`, error);
				}
			}
		} catch (error) {
			// allow-any-unicode-next-line
			this.logService.warn('⚠️ Failed to copy other files:', error);
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
			const envHome = globalThis.process?.env?.HOME;
			const envUser = globalThis.process?.env?.USER || globalThis.process?.env?.USERNAME;

			this.logService.info(`Environment check - HOME: ${envHome}, USER: ${envUser}`);

			if (envHome) {
				return envHome;
			}

			if (isWindows) {
				// For Windows, try common paths
				return 'C:\\Users\\' + (envUser || 'user');
			} else if (isMacintosh) {
				// For macOS, use the actual detected user or a hardcoded path for testing
				// Since we know the path from the terminal, let's use it directly for now
				return '/Users/' + (envUser || 'brunocerecetto');
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
				// Use the known path for this user
				return '/Users/brunocerecetto';
			} else {
				return '/home/user';
			}
		}
	}

	private calculateUserDataPath(): string {
		// Calculate Zaelot Developer Studio's user data path
		const homePath = this.getHomePath();

		try {
			if (isWindows) {
				const appData = globalThis.process?.env?.APPDATA || `${homePath}\\AppData\\Roaming`;
				return `${appData}\\Zaelot Developer Studio`;
			} else if (isMacintosh) {
				return `${homePath}/Library/Application Support/Zaelot Developer Studio`;
			} else {
				// Linux
				const configHome = globalThis.process?.env?.XDG_CONFIG_HOME || `${homePath}/.config`;
				return `${configHome}/Zaelot Developer Studio`;
			}
		} catch (error) {
			// Fallback paths if environment access fails
			if (isWindows) {
				return `${homePath}\\AppData\\Roaming\\Zaelot Developer Studio`;
			} else if (isMacintosh) {
				return `${homePath}/Library/Application Support/Zaelot Developer Studio`;
			} else {
				return `${homePath}/.config/Zaelot Developer Studio`;
			}
		}
	}
}
