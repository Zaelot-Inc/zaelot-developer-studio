/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Event } from '../../../../base/common/event.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';

export interface IClaudeConfiguration {
	apiKey: string;
	baseUrl?: string;
	model: string;
	maxTokens?: number;
	temperature?: number;
}

export interface IClaudeMessage {
	role: 'system' | 'user' | 'assistant';
	content: string | Array<{
		type: 'text' | 'image';
		text?: string;
		source?: {
			type: 'base64';
			media_type: string;
			data: string;
		};
	}>;
}

export interface IClaudeResponse {
	id: string;
	type: 'message';
	role: 'assistant';
	content: Array<{
		type: 'text';
		text: string;
	}>;
	model: string;
	stop_reason: string | null;
	stop_sequence: string | null;
	usage: {
		input_tokens: number;
		output_tokens: number;
	};
}

export interface IClaudeStreamResponse {
	type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
	message?: Partial<IClaudeResponse>;
	content_block?: {
		type: 'text';
		text: string;
	};
	delta?: {
		type: 'text_delta';
		text: string;
	};
	usage?: {
		input_tokens: number;
		output_tokens: number;
	};
}

export const CLAUDE_MODELS = {
	'claude-sonnet-4-20250514': {
		name: 'Claude Sonnet 4',
		family: 'claude-4-0',
		maxInputTokens: 200000,
		maxOutputTokens: 64000,
		supportsVision: true,
		supportsTools: true
	},
	'claude-opus-4-20250514': {
		name: 'Claude Opus 4',
		family: 'claude-4-0',
		maxInputTokens: 200000,
		maxOutputTokens: 32000,
		supportsVision: true,
		supportsTools: true
	},
	'claude-3-7-sonnet-20250219': {
		name: 'Claude Sonnet 3.7',
		family: 'claude-3-7',
		maxInputTokens: 200000,
		maxOutputTokens: 64000,
		supportsVision: true,
		supportsTools: true
	},
	'claude-3-5-haiku-20241022': {
		name: 'Claude 3.5 Haiku',
		family: 'claude-3-5',
		maxInputTokens: 200000,
		maxOutputTokens: 8192,
		supportsVision: true,
		supportsTools: true
	}
} as const;

export type ClaudeModelId = keyof typeof CLAUDE_MODELS;

// Service interface and decorator
export const IClaudeApiClient = createDecorator<IClaudeApiClient>('claudeApiClient');

export interface IClaudeApiClient {
	readonly _serviceBrand: undefined;

	/**
	 * Event fired when the API client configuration changes
	 */
	readonly onDidChangeConfiguration: Event<void>;

	/**
	 * Configure the API client with API key and other settings
	 */
	configure(config: IClaudeConfiguration): void;

	/**
	 * Check if the API client is properly configured
	 */
	isConfigured(): boolean;

	/**
	 * Test the connection to Claude API
	 */
	testConnection(token?: CancellationToken): Promise<boolean>;

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
	 * Estimate token count for a given text
	 */
	estimateTokens(text: string): number;
}
