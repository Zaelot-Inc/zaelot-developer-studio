/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { localize } from '../../../../nls.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { IMigrationService } from './migrationService.js';

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

		try {
			await migrationService.showMigrationInfo();
			
			// Show comprehensive migration dialog
			const result = await dialogService.prompt({
				type: Severity.Info,
				message: localize('migrationWizardTitle', '🚀 Migrate from VS Code / Cursor'),
				detail: localize('migrationWizardDetail', 
					'Welcome to Zaelot Developer Studio! Let\'s help you migrate from your previous editor.\n\n' +
					'🔄 **Quick Migration Steps:**\n' +
					'1. Install your favorite extensions from the marketplace\n' +
					'2. Copy your settings manually (we\'ll show you how)\n' +
					'3. Set up your Claude AI API key\n\n' +
					'📁 **Your old settings are located at:**\n' +
					'• macOS: ~/Library/Application Support/Code/ or ~/Library/Application Support/Cursor/\n' +
					'• Windows: %APPDATA%\\Code\\ or %APPDATA%\\Cursor\\\n' +
					'• Linux: ~/.config/Code/ or ~/.config/Cursor/\n\n' +
					'What would you like to do first?'
				),
				buttons: [
					{
						label: localize('openExtensions', '🔌 Browse Extensions'),
						run: () => 'extensions'
					},
					{
						label: localize('openSettings', '⚙️ Open Settings'),
						run: () => 'settings'
					},
					{
						label: localize('viewGuide', '📚 View Migration Guide'),
						run: () => 'guide'
					}
				],
				cancelButton: localize('cancel', 'Cancel')
			});

			switch (result.result) {
				case 'extensions': // Browse Extensions
					await commandService.executeCommand('workbench.view.extensions');
					notificationService.notify({
						severity: Severity.Info,
						message: localize('extensionsOpened', '💡 Tip: Most VS Code extensions work perfectly in Zaelot Developer Studio!')
					});
					break;
				case 'settings': // Open Settings
					await commandService.executeCommand('workbench.action.openSettings');
					notificationService.notify({
						severity: Severity.Info,
						message: localize('settingsOpened', '⚙️ Copy your settings from your old editor. Check MIGRATION.md for detailed paths!')
					});
					break;
				case 'guide': // View Guide
					notificationService.notify({
						severity: Severity.Info,
						message: localize('migrationGuideInfo', '📚 Check MIGRATION.md in your project root for complete step-by-step instructions!')
					});
					break;
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
