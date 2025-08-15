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
				// allow-any-unicode-next-line
				message: localize('migration.detecting', '🔍 Detecting existing VS Code / Cursor installations...')
			});

			const installations = await migrationService.detectInstallations();
			const availableInstallations = installations.filter(i => i.exists);

			if (availableInstallations.length === 0) {
				// No installations found - show manual guide
				const result = await dialogService.prompt({
					type: Severity.Warning,
					message: localize('migration.noInstallations.title', 'No VS Code/Cursor installations found'),
					detail: localize('migration.noInstallations.detail', 'No VS Code or Cursor installations found. Browse extensions or configure settings manually.'),
					buttons: [
						{
							// allow-any-unicode-next-line
							label: localize('openExtensions', '🔌 Browse Extensions'),
							run: () => 'extensions'
						},
						{
							// allow-any-unicode-next-line
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
					// allow-any-unicode-next-line
					message: localize('migration.singleInstallation.title', '🎉 Found {0}!', installation.name),
					detail: localize('migration.singleInstallation.detail', 'Found {0} installation. Migrate settings, extensions, and configurations automatically. Safe operation.', installation.name),
					buttons: [
						{
							// allow-any-unicode-next-line
							label: localize('startAutoMigration', '🚀 Start Automatic Migration'),
							run: () => 'migrate'
						},
						{
							// allow-any-unicode-next-line
							label: localize('browseManually', '🔍 Browse Manually'),
							run: () => 'manual'
						}
					],
					cancelButton: localize('skipMigration', 'Skip Migration')
				});

				if (result.result === 'migrate') {
					await migrationService.performAutomaticMigration(installation);
				} else if (result.result === 'manual') {
					await commandService.executeCommand('workbench.view.extensions');
				}
			} else {
				// Multiple installations found - let user choose
				interface InstallationPickItem {
					label: string;
					description: string;
					installation: IDetectedInstallation;
				}

				const pickItems: InstallationPickItem[] = availableInstallations.map(installation => ({
					// allow-any-unicode-next-line
					label: `🎯 ${installation.name}`,
					description: installation.path,
					installation
				}));

				const selectedPick = await quickInputService.pick(pickItems, {
					// allow-any-unicode-next-line
					title: localize('migration.multipleInstallations.title', '🎉 Multiple editors found!'),
					// allow-any-unicode-next-line
					placeHolder: localize('migration.multipleInstallations.placeholder', '✨ Choose which installation to migrate from'),
					ignoreFocusLost: true
				});

				if (selectedPick) {
					const result = await dialogService.prompt({
						type: Severity.Info,
						// allow-any-unicode-next-line
						message: localize('migration.confirm.title', '🎉 Migrate from {0}?', selectedPick.installation.name),
						detail: localize('migration.confirm.detail', 'Copy settings, extensions, and configurations from {0}. Safe operation.', selectedPick.installation.name),
						buttons: [
							{
								// allow-any-unicode-next-line
								label: localize('confirmMigration', '✅ Yes, Migrate Everything'),
								run: () => 'migrate'
							}
						],
						cancelButton: localize('cancelMigration', 'Cancel')
					});

					if (result.result === 'migrate') {
						await migrationService.performAutomaticMigration(selectedPick.installation);
					}
				}
			}
		} catch (error) {
			notificationService.notify({
				severity: Severity.Error,
				// allow-any-unicode-next-line
				message: localize('migration.error', '❌ Migration failed: {0}', String(error))
			});
		}
	}
}

registerAction2(ImportFromOtherEditorsAction);
