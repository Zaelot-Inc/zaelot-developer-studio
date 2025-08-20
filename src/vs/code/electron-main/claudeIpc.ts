/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ipcMain } from 'electron';
import { IInstantiationService, createDecorator } from '../../platform/instantiation/common/instantiation.js';
import { IClaudeMainService, IClaudeConfiguration, IClaudeMessage } from './claudeMainService.js';
import { ILogService } from '../../platform/log/common/log.js';
import { Disposable } from '../../base/common/lifecycle.js';

export const IClaudeIpcChannels = createDecorator<IClaudeIpcChannels>('claudeIpcChannels');

export interface IClaudeIpcChannels {
	readonly _serviceBrand: undefined;
}

export class ClaudeIpcChannels extends Disposable implements IClaudeIpcChannels {
	declare readonly _serviceBrand: undefined;

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@ILogService private readonly logService: ILogService
	) {
		super();
		this.setupIpcHandlers();
		this.logService.info('Claude IPC channels initialized');
	}

	private setupIpcHandlers(): void {
		// Test Claude connection
		this._register({
			dispose: () => {
				ipcMain.removeHandler('claude:testConnection');
			}
		});

		ipcMain.handle('claude:testConnection', async (event, config: IClaudeConfiguration) => {
			try {
				const claudeService = this.instantiationService.invokeFunction(accessor =>
					accessor.get(IClaudeMainService)
				);
				return await claudeService.testConnection(config);
			} catch (error) {
				this.logService.error('IPC claude:testConnection error:', error);
				throw error;
			}
		});

		// Send message to Claude
		this._register({
			dispose: () => {
				ipcMain.removeHandler('claude:sendMessage');
			}
		});

		ipcMain.handle('claude:sendMessage', async (
			event,
			config: IClaudeConfiguration,
			messages: IClaudeMessage[],
			options?: {
				maxTokens?: number;
				temperature?: number;
				tools?: any[];
				toolChoice?: any;
			}
		) => {
			try {
				const claudeService = this.instantiationService.invokeFunction(accessor =>
					accessor.get(IClaudeMainService)
				);
				return await claudeService.sendMessage(config, messages, options);
			} catch (error) {
				this.logService.error('IPC claude:sendMessage error:', error);
				throw error;
			}
		});

		// Send streaming message to Claude
		this._register({
			dispose: () => {
				ipcMain.removeHandler('claude:sendStreamingMessage');
			}
		});

		ipcMain.handle('claude:sendStreamingMessage', async (
			event,
			config: IClaudeConfiguration,
			messages: IClaudeMessage[],
			options?: {
				maxTokens?: number;
				temperature?: number;
				tools?: any[];
				toolChoice?: any;
			}
		) => {
			try {
				const claudeService = this.instantiationService.invokeFunction(accessor =>
					accessor.get(IClaudeMainService)
				);

				// For streaming, we need to send progress updates back to renderer
				return await claudeService.sendStreamingMessage(
					config,
					messages,
					(chunk: string) => {
						// Send progress chunk back to renderer
						event.sender.send('claude:streamingProgress', chunk);
					},
					options
				);
			} catch (error) {
				this.logService.error('IPC claude:sendStreamingMessage error:', error);
				throw error;
			}
		});
	}
}
