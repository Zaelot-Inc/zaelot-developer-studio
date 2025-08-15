/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export interface IMigrationService {
	readonly _serviceBrand: undefined;

	showMigrationInfo(): Promise<void>;
}

export const IMigrationService = createDecorator<IMigrationService>('migrationService');

export class MigrationService extends Disposable implements IMigrationService {
	declare readonly _serviceBrand: undefined;

	constructor(
		@ILogService private readonly logService: ILogService
	) {
		super();
	}

	async showMigrationInfo(): Promise<void> {
		this.logService.info('Migration service: Showing migration information');
		// For now, just log that the service is working
		// In the future, this will contain the full migration logic
	}
}
