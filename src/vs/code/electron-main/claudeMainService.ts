/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../base/common/lifecycle.js';
import { ILogService } from '../../platform/log/common/log.js';
import { createDecorator } from '../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../platform/instantiation/common/extensions.js';

export const IClaudeMainService = createDecorator<IClaudeMainService>('claudeMainService');

export interface IClaudeConfiguration {
	apiKey: string;
	baseUrl?: string;
	model?: string;
	maxTokens?: number;
	temperature?: number;
}

export interface IClaudeMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface IClaudeResponse {
	content: Array<{ text: string; type: string }>;
	usage?: {
		input_tokens: number;
		output_tokens: number;
	};
}

export interface IClaudeMainService {
	readonly _serviceBrand: undefined;

	/**
	 * Test connection to Claude API
	 */
	testConnection(config: IClaudeConfiguration): Promise<boolean>;

	/**
	 * Send message to Claude API
	 */
	sendMessage(
		config: IClaudeConfiguration,
		messages: IClaudeMessage[],
		options?: {
			maxTokens?: number;
			temperature?: number;
			tools?: any[];
			toolChoice?: any;
		}
	): Promise<IClaudeResponse>;

	/**
	 * Send streaming message to Claude API
	 */
	sendStreamingMessage(
		config: IClaudeConfiguration,
		messages: IClaudeMessage[],
		onProgress: (chunk: string) => void,
		options?: {
			maxTokens?: number;
			temperature?: number;
			tools?: any[];
			toolChoice?: any;
		}
	): Promise<IClaudeResponse>;
}

export class ClaudeMainService extends Disposable implements IClaudeMainService {
	declare readonly _serviceBrand: undefined;

	constructor(
		@ILogService private readonly logService: ILogService
	) {
		super();
		this.logService.info('Claude Main Service initialized');
	}

	async testConnection(config: IClaudeConfiguration): Promise<boolean> {
		if (!config.apiKey) {
			throw new Error('API key is required');
		}

		try {
			const response = await this._makeRequest(config, {
				model: config.model || 'claude-3-5-sonnet-20241220',
				max_tokens: 10,
				messages: [{ role: 'user', content: 'Hello' }]
			});

			return response.ok;
		} catch (error) {
			this.logService.error('Claude connection test failed:', error);
			return false;
		}
	}

	async sendMessage(
		config: IClaudeConfiguration,
		messages: IClaudeMessage[],
		options: {
			maxTokens?: number;
			temperature?: number;
			tools?: any[];
			toolChoice?: any;
		} = {}
	): Promise<IClaudeResponse> {
		if (!config.apiKey) {
			throw new Error('API key is required');
		}

		const requestBody = {
			model: config.model || 'claude-3-5-sonnet-20241220',
			max_tokens: options.maxTokens || config.maxTokens || 4096,
			temperature: options.temperature ?? config.temperature ?? 0.7,
			messages: messages.filter(m => m.role !== 'system'),
			system: messages.find(m => m.role === 'system')?.content,
			stream: false,
			...(options.tools && { tools: options.tools }),
			...(options.toolChoice && { tool_choice: options.toolChoice })
		};

		this.logService.info(`Claude API request: ${requestBody.model}, tokens: ${requestBody.max_tokens}`);

		try {
			const response = await this._makeRequest(config, requestBody);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
			}

			const result = await response.json() as IClaudeResponse;

			this.logService.info(`Claude response completed. Tokens used: ${result.usage?.input_tokens || 0} input, ${result.usage?.output_tokens || 0} output`);

			return result;
		} catch (error) {
			this.logService.error('Claude API request failed:', error);
			throw error;
		}
	}

	async sendStreamingMessage(
		config: IClaudeConfiguration,
		messages: IClaudeMessage[],
		onProgress: (chunk: string) => void,
		options: {
			maxTokens?: number;
			temperature?: number;
			tools?: any[];
			toolChoice?: any;
		} = {}
	): Promise<IClaudeResponse> {
		if (!config.apiKey) {
			throw new Error('API key is required');
		}

		const requestBody = {
			model: config.model || 'claude-3-5-sonnet-20241220',
			max_tokens: options.maxTokens || config.maxTokens || 4096,
			temperature: options.temperature ?? config.temperature ?? 0.7,
			messages: messages.filter(m => m.role !== 'system'),
			system: messages.find(m => m.role === 'system')?.content,
			stream: true,
			...(options.tools && { tools: options.tools }),
			...(options.toolChoice && { tool_choice: options.toolChoice })
		};

		this.logService.info(`Claude streaming API request: ${requestBody.model}`);

		try {
			const response = await this._makeRequest(config, requestBody);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
			}

			return await this._handleStreamingResponse(response, onProgress);
		} catch (error) {
			this.logService.error('Claude streaming API request failed:', error);
			throw error;
		}
	}

	private async _makeRequest(config: IClaudeConfiguration, requestBody: any): Promise<Response> {
		const baseUrl = config.baseUrl || 'https://api.anthropic.com';
		const url = `${baseUrl}/v1/messages`;

		const headers = {
			'Content-Type': 'application/json',
			'x-api-key': config.apiKey,
			'anthropic-version': '2023-06-01'
		};

		// Use Node.js fetch (available in Node 18+)
		const fetch = globalThis.fetch || await import('node-fetch').then(m => m.default);

		return fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify(requestBody)
		}) as Promise<Response>;
	}

	private async _handleStreamingResponse(
		response: Response,
		onProgress: (chunk: string) => void
	): Promise<IClaudeResponse> {
		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('No response body reader available');
		}

		const decoder = new TextDecoder();
		let fullContent = '';
		let usage: any = undefined;

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') {
							continue;
						}

						try {
							const parsed = JSON.parse(data);
							if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
								const text = parsed.delta.text;
								fullContent += text;
								onProgress(text);
							} else if (parsed.type === 'message_delta' && parsed.usage) {
								usage = parsed.usage;
							}
						} catch (parseError) {
							// Ignore parsing errors for malformed chunks
						}
					}
				}
			}
		} finally {
			reader.releaseLock();
		}

		this.logService.info(`Claude streaming response completed. Content length: ${fullContent.length}`);

		return {
			content: [{ text: fullContent, type: 'text' }],
			usage
		};
	}
}

registerSingleton(IClaudeMainService, ClaudeMainService, InstantiationType.Delayed);
