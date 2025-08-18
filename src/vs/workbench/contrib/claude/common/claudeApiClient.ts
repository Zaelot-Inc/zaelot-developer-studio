/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Emitter } from '../../../../base/common/event.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { IRequestService } from '../../../../platform/request/common/request.js';
import {
	IClaudeConfiguration, IClaudeMessage, IClaudeResponse, IClaudeStreamResponse, ClaudeModelId
} from './claudeTypes.js';

export const IClaudeApiClient = createDecorator<IClaudeApiClient>('claudeApiClient');

export interface IClaudeApiClient {
	readonly _serviceBrand: undefined;

	/**
	 * Event fired when the API client configuration changes
	 */
	readonly onDidChangeConfiguration: import('../../../../base/common/event.js').Event<void>;

	/**
	 * Configure the API client with API key and other settings
	 */
	configure(config: IClaudeConfiguration): void;

	/**
	 * Check if the API client is properly configured
	 */
	isConfigured(): boolean;

	/**
	 * Send a message to Claude and get a streaming response
	 */
	sendMessage(
		messages: IClaudeMessage[],
		model: ClaudeModelId,
		options?: {
			maxTokens?: number;
			temperature?: number;
			tools?: any[];
			toolChoice?: any;
		},
		onProgress?: (chunk: IClaudeStreamResponse) => void,
		token?: CancellationToken
	): Promise<IClaudeResponse>;

	/**
	 * Count tokens in a message (estimation)
	 */
	estimateTokens(text: string): number;

	/**
	 * Test the API connection
	 */
	testConnection(token?: CancellationToken): Promise<boolean>;
}

export class ClaudeApiClient implements IClaudeApiClient {
	readonly _serviceBrand: undefined;

	private _configuration: IClaudeConfiguration | undefined;
	private readonly _onDidChangeConfiguration = new Emitter<void>();
	readonly onDidChangeConfiguration = this._onDidChangeConfiguration.event;

	constructor(
		@ILogService private readonly logService: ILogService,
		@IRequestService private readonly requestService: IRequestService
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

		const requestBody = {
			model,
			max_tokens: options.maxTokens || this._configuration.maxTokens || 4096,
			temperature: options.temperature ?? this._configuration.temperature ?? 0.7,
			messages: messages.filter(m => m.role !== 'system'),
			system: messages.find(m => m.role === 'system')?.content,
			stream: false, // Force non-streaming to avoid CORS issues
			...(options.tools && { tools: options.tools }),
			...(options.toolChoice && { tool_choice: options.toolChoice })
		};

		const baseUrl = this._configuration.baseUrl || 'https://api.anthropic.com';
		const url = `${baseUrl}/v1/messages`;

		const headers = {
			'Content-Type': 'application/json',
			'x-api-key': this._configuration.apiKey,
			'anthropic-version': '2023-06-01'
		};

		this.logService.info('[Claude] Sending request to Claude API', {
			url,
			model,
			messageCount: messages.length,
			hasTools: !!options.tools,
			stream: false, // Always false now
			maxTokens: requestBody.max_tokens,
			temperature: requestBody.temperature
		});

		try {
			// Always use non-streaming to avoid CORS issues
			if (onProgress) {
				this.logService.warn('[Claude] Streaming not available in browser context, using non-streaming');
			}

			return this._handleNonStreamingRequest(url, headers, requestBody, token);
		} catch (error) {
			if (token?.isCancellationRequested) {
				this.logService.warn('[Claude] Request was cancelled');
				throw new Error('Request was cancelled');
			}
			this.logService.error('[Claude] Request failed', error);
			throw error;
		}
	}

	private async _handleNonStreamingRequest(
		url: string,
		headers: Record<string, string>,
		requestBody: any,
		token?: CancellationToken
	): Promise<IClaudeResponse> {
		const response = await this.requestService.request({
			type: 'POST',
			url,
			data: JSON.stringify(requestBody),
			headers,
			timeout: 30000
		}, token || CancellationToken.None);

		// Check for cancellation after network request
		if (token?.isCancellationRequested) {
			throw new Error('Request was cancelled');
		}

		// Read response stream once
		const responseText = response.stream.toString();

		if (response.res.statusCode && response.res.statusCode >= 400) {
			this.logService.error('[Claude] API error', {
				status: response.res.statusCode,
				error: responseText
			});
			throw new Error(`Claude API error: ${response.res.statusCode} - ${responseText}`);
		}

		// Parse JSON with error handling
		let parsedResponse: any;
		try {
			parsedResponse = JSON.parse(responseText);
		} catch (error) {
			this.logService.error('[Claude] Failed to parse response as JSON', {
				error: error instanceof Error ? error.message : String(error),
				responseText: responseText.substring(0, 500) // Log first 500 chars for debugging
			});
			throw new Error(`Invalid JSON response from Claude API: ${error instanceof Error ? error.message : String(error)}`);
		}

		// Validate response structure
		if (!this._isValidClaudeResponse(parsedResponse)) {
			this.logService.error('[Claude] Invalid response format', { parsedResponse });
			throw new Error('Invalid response format from Claude API');
		}

		const result = parsedResponse as IClaudeResponse;

		this.logService.info('[Claude] Request completed', {
			inputTokens: result.usage?.input_tokens || 0,
			outputTokens: result.usage?.output_tokens || 0,
			model: result.model
		});

		return result;
	}

	private _isValidClaudeResponse(obj: any): obj is IClaudeResponse {
		return obj &&
			typeof obj.id === 'string' &&
			obj.type === 'message' &&
			obj.role === 'assistant' &&
			Array.isArray(obj.content) &&
			typeof obj.model === 'string' &&
			obj.usage &&
			typeof obj.usage.input_tokens === 'number' &&
			typeof obj.usage.output_tokens === 'number';
	}


	// Remove or comment out these methods that use fetch()
	/*
	private async _handleStreamingWithFetch(...) { ... }
	private async _getFetchImplementation(...) { ... }
	private async _handleStreamingResponse(...) { ... }
	*/

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
		this.logService.info('[Claude] Testing API connection');

		try {
			const testMessage: IClaudeMessage = {
				role: 'user',
				content: 'Hello'
			};

			await this.sendMessage([testMessage], 'claude-sonnet-4-20250514', { maxTokens: 10 }, undefined, token);
			this.logService.info('[Claude] Connection test successful');
			return true;
		} catch (error) {
			this.logService.error('[Claude] Connection test failed', error);
			return false;
		}
	}
}
