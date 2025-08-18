/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
