/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from '../../../common/contributions.js';
import { LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';

import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from '../../../../platform/configuration/common/configurationRegistry.js';
import { IClaudeApiClient, ClaudeApiClient } from '../common/claudeApiClient.js';
import { IClaudeConfigurationService, ClaudeConfigurationService } from './claudeConfigurationService.js';
import { ClaudeLanguageModelProvider } from '../common/claudeLanguageModelProvider.js';

import { ILogService } from '../../../../platform/log/common/log.js';
import { ILanguageModelsService } from '../../chat/common/languageModels.js';
import './claudeCommands.js';

class ClaudeWorkbenchContribution extends Disposable implements IWorkbenchContribution {

	private claudeProvider: ClaudeLanguageModelProvider | undefined;

	constructor(
		@IClaudeApiClient private readonly claudeApiClient: IClaudeApiClient,
		@IClaudeConfigurationService private readonly claudeConfigurationService: IClaudeConfigurationService,
		@ILogService private readonly logService: ILogService,
		@ILanguageModelsService private readonly languageModelsService: ILanguageModelsService
	) {
		super();

		this._initialize();
	}

	private async _initialize(): Promise<void> {
		try {
			// Initialize Claude API client with current configuration
			this._updateClaudeConfiguration();

			// Listen for configuration changes
			this._register(this.claudeConfigurationService.onDidChangeConfiguration(() => {
				this._updateClaudeConfiguration();
			}));

			// Register Claude language model provider
			this._registerClaudeProvider();

			this.logService.info('Claude integration initialized');
		} catch (error) {
			// Claude initialization failed, but don't break the application
			this.logService.warn('Claude integration failed to initialize, but application will continue without Claude:', error);
		}
	}

	private _updateClaudeConfiguration(): void {
		try {
			const config = this.claudeConfigurationService.getConfiguration();
			this.claudeApiClient.configure(config);
		} catch (error) {
			this.logService.warn('Failed to update Claude configuration:', error);
		}
	}

	private _registerClaudeProvider(): void {
		try {
			if (this.claudeProvider) {
				this.claudeProvider.dispose();
			}

			this.claudeProvider = new ClaudeLanguageModelProvider(
				this.claudeApiClient,
				this.logService
			);

			// Register with the language models service
			this._register(this.languageModelsService.registerLanguageModelProvider('claude', this.claudeProvider));

			this.logService.info('Claude language model provider registered');
		} catch (error) {
			this.logService.warn('Failed to register Claude language model provider:', error);
		}
	}
}

// Register services
registerSingleton(IClaudeApiClient, ClaudeApiClient, InstantiationType.Delayed);
registerSingleton(IClaudeConfigurationService, ClaudeConfigurationService, InstantiationType.Delayed);

// Register configuration schema
const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);
configurationRegistry.registerConfiguration({
	id: 'claude',
	title: 'Claude AI Assistant',
	type: 'object',
	properties: {
		'claude.apiKey': {
			type: 'string',
			description: 'API key for Claude AI service. Can also be set via CLAUDE_API_KEY environment variable.'
		},
		'claude.baseUrl': {
			type: 'string',
			default: 'https://api.anthropic.com',
			description: 'Base URL for Claude API service'
		},
		'claude.model': {
			type: 'string',
			default: 'claude-3-5-sonnet-20241022',
			enum: [
				'claude-3-5-sonnet-20241022',
				'claude-3-5-haiku-20241022',
				'claude-3-opus-20240229'
			],
			enumDescriptions: [
				'Claude 3.5 Sonnet - Most capable model',
				'Claude 3.5 Haiku - Fastest model',
				'Claude 3 Opus - Most powerful model'
			],
			description: 'Default Claude model to use'
		},
		'claude.maxTokens': {
			type: 'number',
			default: 4096,
			minimum: 1,
			maximum: 8192,
			description: 'Maximum number of tokens to generate in responses'
		},
		'claude.temperature': {
			type: 'number',
			default: 0.7,
			minimum: 0,
			maximum: 1,
			description: 'Controls randomness in responses (0 = more focused, 1 = more creative)'
		}
	}
});

// Register workbench contribution
const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchRegistry.registerWorkbenchContribution(ClaudeWorkbenchContribution, LifecyclePhase.Restored);
