/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { localize } from '../../../../nls.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { IMigrationService, IDetectedInstallation } from './migrationService.js';

class ImportFromOtherEditorsAction extends Action2 {
	constructor() {
		super({
			id: 'zaelot.importFromOtherEditors',
			title: {
				value: localize('importFromOtherEditors', 'Import from VS Code / Cursor'),
				original: 'Import from VS Code / Cursor'
			},
			category: Categories.File,
			f1: true
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const migrationService = accessor.get(IMigrationService);
		const notificationService = accessor.get(INotificationService);
		const dialogService = accessor.get(IDialogService);
		const commandService = accessor.get(ICommandService);
		const quickInputService = accessor.get(IQuickInputService);

		try {
			// First, detect available installations
			notificationService.notify({
				severity: Severity.Info,
				message: localize('migration.detecting', '🔍 Detecting existing VS Code / Cursor installations...')
			});

			const installations = await migrationService.detectInstallations();
			const availableInstallations = installations.filter(i => i.exists);

			if (availableInstallations.length === 0) {
				// No installations found - show manual guide
				const result = await dialogService.prompt({
					type: Severity.Warning,
					message: localize('migration.noInstallations.title', 'No VS Code/Cursor installations found'),
					detail: localize('migration.noInstallations.detail', 
						'We couldn\'t find any existing VS Code or Cursor installations on your system.\n\n' +
						'If you have these editors installed in a custom location, you can:\n' +
						'• Manually copy your settings\n' +
						'• Install extensions from the marketplace\n' +
						'• Configure Zaelot Developer Studio from scratch\n\n' +
						'Would you like to browse extensions or open settings?'
					),
					buttons: [
						{
							label: localize('openExtensions', '🔌 Browse Extensions'),
							run: () => 'extensions'
						},
						{
							label: localize('openSettings', '⚙️ Open Settings'),
							run: () => 'settings'
						}
					],
					cancelButton: localize('cancel', 'Cancel')
				});

				if (result.result === 'extensions') {
					await commandService.executeCommand('workbench.view.extensions');
				} else if (result.result === 'settings') {
					await commandService.executeCommand('workbench.action.openSettings');
				}
				return;
			}

			// Show available installations for automatic migration
			if (availableInstallations.length === 1) {
				// Only one installation found - offer to migrate automatically
				const installation = availableInstallations[0];
				const result = await dialogService.prompt({
					type: Severity.Info,
					message: localize('migration.singleInstallation.title', '🎉 Found {0}!', installation.name),
					detail: localize('migration.singleInstallation.detail', 
						'We found your {0} installation with all your settings and extensions.\n\n' +
						'✨ **Automatic Migration includes:**\n' +
						'• All your settings and preferences\n' +
						'• Custom keyboard shortcuts\n' +
						'• Code snippets\n' +
						'• Installed extensions\n' +
						'• Workspace configurations\n\n' +
						'This process is completely automatic and safe. Your original installation won\'t be modified.\n\n' +
						'Would you like to start the automatic migration?', installation.name
					),
					buttons: [
						{
							label: localize('startAutoMigration', '🚀 Start Automatic Migration'),
							run: () => 'migrate'
						},
						{
							label: localize('browseManually', '🔍 Browse Manually'),
							run: () => 'manual'
						}
					],
					cancelButton: localize('cancel', 'Skip Migration')
				});

				if (result.result === 'migrate') {
					await migrationService.performAutomaticMigration(installation);
				} else if (result.result === 'manual') {
					await commandService.executeCommand('workbench.view.extensions');
					notificationService.notify({
						severity: Severity.Info,
						message: localize('manualBrowsing', '💡 Browse extensions and configure settings manually. Your {0} settings are at: {1}', installation.name, installation.userDataPath)
					});
				}
			} else {
				// Multiple installations found - let user choose
				interface InstallationPickItem {
					label: string;
					description: string;
					installation: IDetectedInstallation;
				}

				const picks: InstallationPickItem[] = availableInstallations.map(installation => ({
					label: `🚀 ${installation.name}`,
					description: installation.userDataPath,
					installation: installation
				}));

				const selectedPick = await quickInputService.pick(picks, {
					title: localize('migration.multipleInstallations.title', 'Multiple editors found'),
					placeHolder: localize('migration.multipleInstallations.placeholder', 'Select which installation to migrate from'),
					ignoreFocusLost: true
				});

				if (selectedPick) {
					const result = await dialogService.prompt({
						type: Severity.Info,
						message: localize('migration.confirm.title', '🎉 Migrate from {0}?', selectedPick.installation.name),
						detail: localize('migration.confirm.detail', 
							'This will automatically copy all your settings, extensions, and configurations from {0}.\n\n' +
							'✨ **What will be migrated:**\n' +
							'• Settings and preferences\n' +
							'• Keyboard shortcuts\n' +
							'• Code snippets\n' +
							'• Installed extensions\n' +
							'• Other configurations\n\n' +
							'This is completely safe and won\'t modify your original installation.', selectedPick.installation.name
						),
						buttons: [
							{
								label: localize('confirmMigration', '✅ Yes, Migrate Everything'),
								run: () => 'migrate'
							}
						],
						cancelButton: localize('cancel', 'Cancel')
					});

					if (result.result === 'migrate') {
						await migrationService.performAutomaticMigration(selectedPick.installation);
					}
				}
			}

		} catch (error) {
			notificationService.notify({
				severity: Severity.Error,
				message: localize('migrationError', 'Migration service error: {0}', error)
			});
		}
	}
}

registerAction2(ImportFromOtherEditorsAction);
