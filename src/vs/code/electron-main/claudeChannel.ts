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
				return this.claudeService.sendMessage(arg[0], arg[1], arg[2]);

			case 'sendStreamingMessage':
				if (arg.length < 3) {
					throw new Error('sendStreamingMessage requires config, messages, and onProgress arguments');
				}
				// arg[2] should be the onProgress callback, arg[3] should be options
				return this.claudeService.sendStreamingMessage(arg[0], arg[1], arg[2], arg[3]);
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
