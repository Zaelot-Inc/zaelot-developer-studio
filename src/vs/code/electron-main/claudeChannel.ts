/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IChannel, IServerChannel } from '../../base/parts/ipc/common/ipc.js';
import { Event } from '../../base/common/event.js';
import { IClaudeMainService } from './claudeMainService.js';

export class ClaudeChannel implements IServerChannel {

	constructor(private readonly claudeService: IClaudeMainService) { }

	listen<T>(_: unknown, event: string): Event<T> {
		throw new Error(`Event not found: ${event}`);
	}

	call(_: unknown, command: string, arg?: any): Promise<any> {
		// Validate that arg exists and is an array
		if (!Array.isArray(arg)) {
			throw new Error(`Invalid arguments for command: ${command}`);
		}

		switch (command) {
			case 'testConnection':
				if (arg.length < 1) {
					throw new Error('testConnection requires config argument');
				}
				return this.claudeService.testConnection(arg[0]);

			case 'sendMessage':
				if (arg.length < 2) {
					throw new Error('sendMessage requires config and messages arguments');
				}
				// arg[0] = config, arg[1] = messages, arg[2] = options (optional)
				return this.claudeService.sendMessage(arg[0], arg[1], arg[2]);

			case 'sendStreamingMessage': {
				if (arg.length < 2) {
					throw new Error('sendStreamingMessage requires config and messages arguments');
				}
				// arg[0] = config, arg[1] = messages, arg[2] = options (optional)
				// Note: Streaming progress is handled via IPC events, not as a callback parameter
				// Since channels can't directly send events, fallback to non-streaming version
				return this.claudeService.sendMessage(arg[0], arg[1], arg[2]); // Use non-streaming version
			}
		}

		throw new Error(`Call not found: ${command}`);
	}
}

export class ClaudeChannelClient implements IChannel {

	constructor(private readonly channel: IChannel) { }

	call<T>(command: string, arg?: any): Promise<T> {
		return this.channel.call(command, arg);
	}

	listen<T>(event: string, arg?: any): Event<T> {
		return this.channel.listen(event, arg);
	}
}
