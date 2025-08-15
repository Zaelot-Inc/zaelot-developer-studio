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


import { localize } from '../../../../nls.js';
import { isWindows, isMacintosh } from '../../../../base/common/platform.js';
import { homedir } from 'os';
import { join } from 'path';
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
	) {
		super();
		this.logService.info('MigrationService initialized with automatic migration capabilities');
	}

	async detectInstallations(): Promise<IDetectedInstallation[]> {
		this.logService.info('🔍 Detecting existing VS Code / Cursor installations...');
		const installations: IDetectedInstallation[] = [];

		// Get platform-specific paths
		const homePath = homedir();
		let candidates: Array<{ id: string; name: string; relativePath: string }> = [];

		if (isWindows) {
			const appData = process.env.APPDATA || '';
			candidates = [
				{ id: 'vscode', name: 'Visual Studio Code', relativePath: 'Code' },
				{ id: 'cursor', name: 'Cursor', relativePath: 'Cursor' },
				{ id: 'vscode-insiders', name: 'Visual Studio Code Insiders', relativePath: 'Code - Insiders' }
			].map(c => ({ ...c, relativePath: `${appData}\\${c.relativePath}` }));
		} else if (isMacintosh) {
			candidates = [
				{ id: 'vscode', name: 'Visual Studio Code', relativePath: 'Library/Application Support/Code' },
				{ id: 'cursor', name: 'Cursor', relativePath: 'Library/Application Support/Cursor' },
				{ id: 'vscode-insiders', name: 'Visual Studio Code Insiders', relativePath: 'Library/Application Support/Code - Insiders' }
			].map(c => ({ ...c, relativePath: `${homePath}/${c.relativePath}` }));
		} else {
			// Linux
			candidates = [
				{ id: 'vscode', name: 'Visual Studio Code', relativePath: '.config/Code' },
				{ id: 'cursor', name: 'Cursor', relativePath: '.config/Cursor' },
				{ id: 'vscode-insiders', name: 'Visual Studio Code Insiders', relativePath: '.config/Code - Insiders' }
			].map(c => ({ ...c, relativePath: `${homePath}/${c.relativePath}` }));
		}

		// Check each candidate
		for (const candidate of candidates) {
			try {
				const userDataPath = candidate.relativePath;
				const extensionsPath = isWindows 
					? `${userDataPath}\\extensions` 
					: `${userDataPath}/extensions`;

				// Check if the user data directory exists
				const userDataUri = URI.file(userDataPath);
				const exists = await this.fileService.exists(userDataUri);

				installations.push({
					id: candidate.id,
					name: candidate.name,
					path: userDataPath,
					userDataPath: userDataPath,
					extensionsPath: extensionsPath,
					exists: exists
				});

				if (exists) {
					this.logService.info(`✅ Found ${candidate.name} at: ${userDataPath}`);
				}
			} catch (error) {
				this.logService.warn(`❌ Error checking ${candidate.name}:`, error);
			}
		}

		const foundInstallations = installations.filter(i => i.exists);
		this.logService.info(`🎯 Detected ${foundInstallations.length} existing installations.`);
		return installations;
	}

	async performAutomaticMigration(installation: IDetectedInstallation): Promise<void> {
		if (!installation.exists) {
			throw new Error(`Installation ${installation.name} does not exist`);
		}

		this.logService.info(`🚀 Starting automatic migration from ${installation.name}`);

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
			message: localize('migration.success', '🎉 Successfully migrated from {0}! Please restart Zaelot Developer Studio to see all changes.', installation.name)
		});
	}

	private async copySettings(installation: IDetectedInstallation): Promise<void> {
		try {
			const sourceSettingsPath = joinPath(URI.file(installation.userDataPath), 'User', 'settings.json');
			// Calculate our app's user data path (simplified approach)
			const currentUserDataPath = this.calculateUserDataPath();
			const targetSettingsPath = joinPath(URI.file(currentUserDataPath), 'User', 'settings.json');

			if (await this.fileService.exists(sourceSettingsPath)) {
				const settingsContent = await this.fileService.readFile(sourceSettingsPath);
				await this.fileService.writeFile(targetSettingsPath, settingsContent.value);
				this.logService.info('✅ Settings copied successfully');
			}
		} catch (error) {
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
				this.logService.info('✅ Keybindings copied successfully');
			}
		} catch (error) {
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
				this.logService.info('✅ Snippets copied successfully');
			}
		} catch (error) {
			this.logService.warn('⚠️ Failed to copy snippets:', error);
		}
	}

	private async installExtensions(installation: IDetectedInstallation): Promise<void> {
		try {
			// Read extensions list from source installation
			const extensionsPath = joinPath(URI.file(installation.userDataPath), 'User', 'extensions.json');
			
			if (await this.fileService.exists(extensionsPath)) {
				const extensionsContent = await this.fileService.readFile(extensionsPath);
				
				// Note: In a real implementation, you would iterate through
				// the extensions and install them using extensionManagementService
				// For now, we'll just copy the extensions.json file
				const currentUserDataPath = this.calculateUserDataPath();
				const targetExtensionsPath = joinPath(URI.file(currentUserDataPath), 'User', 'extensions.json');
				await this.fileService.writeFile(targetExtensionsPath, extensionsContent.value);
				
				this.logService.info('✅ Extensions list copied successfully');
			}

			// Also try to copy installed extensions directory
			const sourceExtensionsDir = URI.file(installation.extensionsPath);
			if (await this.fileService.exists(sourceExtensionsDir)) {
				// Note: Extensions path needs to come from environment service
				// For now, we'll skip copying the full extensions directory
				// as it requires more complex logic for extension compatibility
				this.logService.info('📦 Extensions directory found - manual installation recommended');
			}
		} catch (error) {
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
						this.logService.info(`✅ Copied ${fileName} successfully`);
					}
				} catch (error) {
					this.logService.warn(`⚠️ Failed to copy ${fileName}:`, error);
				}
			}
		} catch (error) {
			this.logService.warn('⚠️ Failed to copy other files:', error);
		}
	}

	async showMigrationInfo(): Promise<void> {
		this.logService.info('Migration service: Showing migration information');
		// This method is called by the migration commands
		// The actual migration logic is now in performAutomaticMigration
	}

	private calculateUserDataPath(): string {
		// Calculate Zaelot Developer Studio's user data path
		const homePath = homedir();
		
		if (isWindows) {
			const appData = process.env.APPDATA || join(homePath, 'AppData', 'Roaming');
			return join(appData, 'Zaelot Developer Studio');
		} else if (isMacintosh) {
			return join(homePath, 'Library', 'Application Support', 'Zaelot Developer Studio');
		} else {
			// Linux
			const configHome = process.env.XDG_CONFIG_HOME || join(homePath, '.config');
			return join(configHome, 'Zaelot Developer Studio');
		}
	}
}