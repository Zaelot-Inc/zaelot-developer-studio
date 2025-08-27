/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import {
	ILanguageModelChatProvider,
	ILanguageModelChatMetadataAndIdentifier,
	ILanguageModelChatResponse,
	ChatMessageRole,
	IChatMessage
} from '../../chat/common/languageModels.js';
import { ExtensionIdentifier } from '../../../../platform/extensions/common/extensions.js';
import { IClaudeApiClient, CLAUDE_MODELS, ClaudeModelId, IClaudeMessage } from './claudeTypes.js';

export class ClaudeLanguageModelProvider extends Disposable implements ILanguageModelChatProvider {

	private readonly _onDidChange = this._register(new Emitter<void>());
	readonly onDidChange = this._onDidChange.event;

	constructor(
		private readonly claudeApiClient: IClaudeApiClient,
		private readonly logService: ILogService,
		private readonly vendorId: string = 'claude' // Accept vendor as parameter
	) {
		super();

		// Listen for Claude configuration changes
		this._register(claudeApiClient.onDidChangeConfiguration(() => {
			this._onDidChange.fire();
		}));
	}

	async prepareLanguageModelChat(options: {
		silent: boolean;
	}, token: CancellationToken): Promise<ILanguageModelChatMetadataAndIdentifier[]> {
		if (!this.claudeApiClient.isConfigured()) {
			if (!options.silent) {
				this.logService.warn('Claude API client is not configured');
			}
			return [];
		}

		// Test connection if not silent
		if (!options.silent) {
			try {
				const isConnected = await this.claudeApiClient.testConnection(token);
				if (!isConnected) {
					this.logService.error('Failed to connect to Claude API');
					return [];
				}
			} catch (error) {
				this.logService.error('Error testing Claude API connection:', error);
				return [];
			}
		}

		// Return available Claude models - use the vendor passed in constructor
		return Object.entries(CLAUDE_MODELS).map(([id, modelInfo]) => ({
			identifier: `claude-${id}`,
			metadata: {
				extension: new ExtensionIdentifier('internal.claude'),
				id: id as ClaudeModelId,
				name: modelInfo.name,
				family: modelInfo.family,
				vendor: this.vendorId, // Use the vendor ID passed to constructor
				description: `${modelInfo.name} - Advanced AI assistant by Anthropic`,
				version: id.split('-').pop() || '1.0',
				maxInputTokens: modelInfo.maxInputTokens,
				maxOutputTokens: modelInfo.maxOutputTokens,
				isDefault: id === 'claude-sonnet-4-20250514',
				isUserSelectable: true,
				modelPickerCategory: { label: 'Claude', order: 1 }
			}
		}));
	}

	async sendChatRequest(
		modelId: string,
		messages: IChatMessage[],
		from: ExtensionIdentifier,
		options: { [name: string]: any },
		token: CancellationToken
	): Promise<ILanguageModelChatResponse> {
		this.logService.info(`Claude chat request for model ${modelId}`);

		try {
			// Extract actual Claude model ID from the identifier
			const actualModelId = modelId.replace('claude-', '') as ClaudeModelId;

			// Convert VS Code messages to Claude format
			const claudeMessages = this._convertMessagesToClaude(messages);

			// Extract tools if provided
			const tools = options.tools?.map((tool: any) => ({
				name: tool.name,
				description: tool.description,
				input_schema: tool.inputSchema || {}
			}));

			const claudeResponse = await this.claudeApiClient.sendMessage(
				claudeMessages,
				actualModelId,
				{
					maxTokens: options.maxTokens || 4096,
					temperature: options.temperature || 0.7,
					tools,
					toolChoice: options.toolMode ? { type: 'auto' } : undefined
				},
				undefined, // No streaming callback - not supported in browser context
				token
			);

			this.logService.info(`Claude response completed. Tokens used: ${claudeResponse.usage?.input_tokens || 0} input, ${claudeResponse.usage?.output_tokens || 0} output`);

			// Create a simple response stream that immediately yields the complete response
			const responseText = claudeResponse.content?.[0]?.text || '';

			return {
				stream: this._createResponseStream(responseText),
				result: Promise.resolve(responseText)
			};

		} catch (error) {
			this.logService.error('Error in Claude chat response:', error);
			throw error;
		}
	}

	async provideTokenCount(
		modelId: string,
		message: string | IChatMessage,
		token: CancellationToken
	): Promise<number> {
		// For now, use simple estimation
		// In the future, we could use Claude's token counting API if available
		const textToCount = typeof message === 'string' ? message : this._extractTextFromMessage(message);
		return this.claudeApiClient.estimateTokens(textToCount);
	}

	private _convertMessagesToClaude(messages: IChatMessage[]): IClaudeMessage[] {
		return messages.map(msg => {
			const role = this._convertRole(msg.role);

			// Handle array of content parts
			if (Array.isArray(msg.content)) {
				const content = msg.content.map((part: any) => {
					if ('type' in part) {
						switch (part.type) {
							case 'text':
								return { type: 'text' as const, text: part.value };
							case 'image_url':
								// Handle image content for vision models
								if ('data' in part.value && 'mimeType' in part.value) {
									return {
										type: 'image' as const,
										source: {
											type: 'base64' as const,
											media_type: part.value.mimeType,
											data: part.value.data.toString('base64')
										}
									};
								}
								break;
						}
					}
					return { type: 'text' as const, text: String(part) };
				});

				return { role, content };
			}

			// Fallback to string conversion - msg.content should be an array
			const contentArray = Array.isArray(msg.content) ? msg.content : [];
			return {
				role,
				content: contentArray.map((p: any) => p.type === 'text' ? p.value : '').join('')
			};
		});
	}

	private _convertRole(role: ChatMessageRole): 'system' | 'user' | 'assistant' {
		switch (role) {
			case ChatMessageRole.System:
				return 'system';
			case ChatMessageRole.User:
				return 'user';
			case ChatMessageRole.Assistant:
				return 'assistant';
			default:
				return 'user';
		}
	}

	private _extractTextFromMessage(message: IChatMessage): string {
		if (Array.isArray(message.content)) {
			return message.content
				.map((part: any) => {
					if (part.type === 'text') {
						return part.value;
					}
					return '';
				})
				.join(' ');
		}

		return '';
	}

	private _createResponseStream(text: string): any {
		// Simple implementation that yields the complete text
		// In a real implementation, this would be a proper async iterator
		return {
			[Symbol.asyncIterator]: async function* () {
				yield { type: 'text', value: text };
			}
		};
	}
}
