/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Emitter } from '../../../../base/common/event.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js';
import {
	IClaudeConfiguration, IClaudeMessage, IClaudeResponse, IClaudeStreamResponse, ClaudeModelId, IClaudeApiClient
} from '../common/claudeTypes.js';



export class ClaudeApiClient implements IClaudeApiClient {
	readonly _serviceBrand: undefined;

	private _configuration: IClaudeConfiguration | undefined;
	private readonly _onDidChangeConfiguration = new Emitter<void>();
	readonly onDidChangeConfiguration = this._onDidChangeConfiguration.event;

	constructor(
		@ILogService private readonly logService: ILogService,
		@IMainProcessService private readonly mainProcessService: IMainProcessService
	) {
	}

	configure(config: IClaudeConfiguration): void {
		this._configuration = { ...config };
		this.logService.trace('[Claude] API client configured', {
			hasApiKey: !!config.apiKey,
			baseUrl: config.baseUrl || 'https://api.anthropic.com',
			model: config.model,
			maxTokens: config.maxTokens,
			temperature: config.temperature
		});
		this._onDidChangeConfiguration.fire();
	}

	isConfigured(): boolean {
		const configured = !!this._configuration?.apiKey;
		this.logService.trace('[Claude] Configuration check:', { configured });
		return configured;
	}

	async sendMessage(
		messages: IClaudeMessage[],
		model: ClaudeModelId,
		options: {
			maxTokens?: number;
			temperature?: number;
			tools?: any[];
			toolChoice?: any;
		} = {},
		onProgress?: (chunk: IClaudeStreamResponse) => void,
		token?: CancellationToken
	): Promise<IClaudeResponse> {
		if (!this._configuration) {
			this.logService.error('[Claude] API client is not configured');
			throw new Error('Claude API client is not configured');
		}

		this.logService.info('[Claude] Sending message via IPC', {
			model,
			messageCount: messages.length,
			hasTools: !!options.tools,
			streaming: !!onProgress,
			maxTokens: options.maxTokens || this._configuration.maxTokens || 4096,
			temperature: options.temperature ?? this._configuration.temperature ?? 0.7
		});

		try {
			// Use IPC to call main process instead of direct fetch
			if (onProgress) {
				return await this._sendStreamingMessage(messages, model, options, onProgress, token);
			} else {
				const channel = this.mainProcessService.getChannel('claude');
				return await channel.call('sendMessage', [
					this._configuration,
					messages,
					{
						...options,
						maxTokens: options.maxTokens || this._configuration.maxTokens || 4096,
						temperature: options.temperature ?? this._configuration.temperature ?? 0.7
					}
				]) as IClaudeResponse;
			}
		} catch (error) {
			this.logService.error('[Claude] IPC sendMessage failed:', error);
			if (token?.isCancellationRequested) {
				throw new Error('Request was cancelled');
			}
			throw error;
		}
	}

	private async _sendStreamingMessage(
		messages: IClaudeMessage[],
		model: ClaudeModelId,
		options: {
			maxTokens?: number;
			temperature?: number;
			tools?: any[];
			toolChoice?: any;
		},
		onProgress: (chunk: IClaudeStreamResponse) => void,
		token?: CancellationToken
	): Promise<IClaudeResponse> {
		this.logService.info('[Claude] Sending streaming message via IPC');

		if (!this._configuration) {
			throw new Error('Claude API client is not configured');
		}

		// Setup streaming progress listener
		const progressListener = (_event: unknown, chunk: string) => {
			onProgress({
				type: 'content_block_delta',
				delta: {
					type: 'text_delta',
					text: chunk
				}
			});
		};

		// Add listener for streaming progress
		const ipcRenderer = (globalThis as any).electronBridge?.ipcRenderer;
		if (ipcRenderer) {
			ipcRenderer.on('claude:streamingProgress', progressListener);
		}

		try {
			// Use direct IPC for streaming messages since callbacks can't be passed through channels
			if (ipcRenderer) {
				const result = await ipcRenderer.invoke('claude:sendStreamingMessage',
					this._configuration,
					messages,
					{
						...options,
						maxTokens: options.maxTokens || this._configuration.maxTokens || 4096,
						temperature: options.temperature ?? this._configuration.temperature ?? 0.7
					}
				) as IClaudeResponse;
				return result;
			} else {
				// Fallback to channel system without streaming
				const channel = this.mainProcessService.getChannel('claude');
				const result = await channel.call('sendMessage', [
					this._configuration,
					messages,
					{
						...options,
						maxTokens: options.maxTokens || this._configuration.maxTokens || 4096,
						temperature: options.temperature ?? this._configuration.temperature ?? 0.7
					}
				]) as IClaudeResponse;
				return result;
			}
		} finally {
			// Cleanup listener
			if (ipcRenderer) {
				ipcRenderer.removeListener('claude:streamingProgress', progressListener);
			}
		}
	}



	estimateTokens(text: string): number {
		// Rough estimation: ~4 characters per token for English text
		const estimate = Math.ceil(text.length / 4);
		this.logService.trace('[Claude] Token estimation', {
			textLength: text.length,
			estimatedTokens: estimate
		});
		return estimate;
	}

	async testConnection(token?: CancellationToken): Promise<boolean> {
		if (!this._configuration) {
			this.logService.error('[Claude] API client is not configured');
			return false;
		}

		this.logService.info('[Claude] Testing API connection via IPC');

		try {
			const channel = this.mainProcessService.getChannel('claude');
			const result = await channel.call('testConnection', [this._configuration]) as boolean;
			this.logService.info('[Claude] Connection test successful');
			return result;
		} catch (error) {
			this.logService.error('[Claude] Connection test failed', error);
			return false;
		}
	}
}
