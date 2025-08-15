/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
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

		try {
			await migrationService.showMigrationInfo();
			
			notificationService.notify({
				severity: Severity.Info,
				message: localize('migrationInfo', 
					'Migration guide available! Check MIGRATION.md in the project root for detailed instructions.'
				)
			});

		} catch (error) {
			notificationService.notify({
				severity: Severity.Error,
				message: localize('migrationError', 'Migration service error: {0}', error)
			});
		}
	}
}

registerAction2(ImportFromOtherEditorsAction);