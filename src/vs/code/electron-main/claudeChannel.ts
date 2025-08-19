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
		switch (command) {
			case 'testConnection': return this.claudeService.testConnection(arg[0]);
			case 'sendMessage': return this.claudeService.sendMessage(arg[0], arg[1], arg[2]);
			case 'sendStreamingMessage': return this.claudeService.sendStreamingMessage(arg[0], arg[1], () => { }, arg[2]);
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
