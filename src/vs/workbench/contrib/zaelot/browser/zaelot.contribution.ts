/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from '../../../../platform/registry/common/platform.js';
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from '../../../common/contributions.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { IWorkbenchLayoutService } from '../../../services/layout/browser/layoutService.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { ZaelotSplashService } from './zaelotSplash.js';
import { mainWindow } from '../../../../base/browser/window.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { IMigrationService, MigrationService } from './migrationService.js';

// Import theme colors
import './zaelotTheme.js';

// Import migration commands
import './migrationCommands.js';

class ZaelotWorkbenchContribution extends Disposable implements IWorkbenchContribution {

	constructor(
		@IThemeService private readonly themeService: IThemeService,
		@ILogService private readonly logService: ILogService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService
	) {
		super();

		this._initialize();
	}

	private _initialize(): void {
		this.logService.info('Zaelot Developer Studio theme and styling initialized');

		// Initialize splash screen
		this._register(new ZaelotSplashService(
			this.themeService,
			this.layoutService,
			this.lifecycleService,
			this.logService
		));

		// Migration service is available via dependency injection

		// Apply Zaelot branding enhancements
		this._applyZaelotStyling();

		// Listen for theme changes
		this._register(this.themeService.onDidColorThemeChange(() => {
			this._applyZaelotStyling();
		}));
	}

	private _applyZaelotStyling(): void {
		// Add Zaelot-specific CSS classes to the body
		const body = mainWindow.document.body;

		if (!body.classList.contains('zaelot-studio')) {
			body.classList.add('zaelot-studio');
		}

		// Add theme-specific classes
		const currentTheme = this.themeService.getColorTheme();
		const isDark = currentTheme.type === 'dark';

		body.classList.toggle('zaelot-dark', isDark);
		body.classList.toggle('zaelot-light', !isDark);

		// Apply custom styling to welcome page if it exists
		this._enhanceWelcomePage();

		// Apply custom styling to activity bar
		this._enhanceActivityBar();

		// Apply custom styling to status bar
		this._enhanceStatusBar();
	}

	private _enhanceWelcomePage(): void {
		// Find welcome page container
		const welcomeContainer = mainWindow.document.querySelector('.gettingStartedContainer');
		if (welcomeContainer && !welcomeContainer.classList.contains('zaelot-enhanced')) {
			welcomeContainer.classList.add('zaelot-enhanced');

			// Remove any existing zaelot branding to prevent duplicates
			const existingBranding = welcomeContainer.querySelector('.zaelot-branding');
			if (existingBranding) {
				existingBranding.remove();
			}

			// Add Zaelot branding to welcome page
			const brandingDiv = mainWindow.document.createElement('div');
			brandingDiv.className = 'zaelot-branding';

			// Create header structure with DOM elements instead of innerHTML
			const headerDiv = mainWindow.document.createElement('div');
			headerDiv.className = 'zaelot-welcome-header';

			const logoDiv = mainWindow.document.createElement('div');
			logoDiv.className = 'zaelot-logo';

			// For now, use styled Z as logo since SVG path needs to be fixed
			logoDiv.textContent = 'Z';
			logoDiv.style.background = 'linear-gradient(135deg, var(--zaelot-zaelow) 0%, var(--zaelot-zaelow-30) 100%)';
			logoDiv.style.color = 'var(--zaelot-thunder)';
			logoDiv.style.fontWeight = 'bold';
			logoDiv.style.fontSize = '20px';
			logoDiv.style.borderRadius = '50%';

			const textContainer = mainWindow.document.createElement('div');

			const title = mainWindow.document.createElement('h1');
			title.className = 'zaelot-welcome-title';
			title.textContent = 'Zaelot Developer Studio';

			const subtitle = mainWindow.document.createElement('p');
			subtitle.className = 'zaelot-welcome-subtitle';
			subtitle.textContent = 'Powered by Claude AI';

			textContainer.appendChild(title);
			textContainer.appendChild(subtitle);
			headerDiv.appendChild(logoDiv);
			headerDiv.appendChild(textContainer);
			brandingDiv.appendChild(headerDiv);

			// Insert at the beginning of welcome container
			welcomeContainer.insertBefore(brandingDiv, welcomeContainer.firstChild);
		}
	}

	private _enhanceActivityBar(): void {
		const activityBar = mainWindow.document.querySelector('.activitybar');
		if (activityBar && !activityBar.classList.contains('zaelot-enhanced')) {
			activityBar.classList.add('zaelot-enhanced');

			// Add Zaelot styling to activity bar items
			const activityItems = activityBar.querySelectorAll('.action-item');
			activityItems.forEach(item => {
				if (!item.classList.contains('zaelot-activity-item')) {
					item.classList.add('zaelot-activity-item');
				}
			});
		}
	}

	private _enhanceStatusBar(): void {
		const statusBar = mainWindow.document.querySelector('.statusbar');
		if (statusBar && !statusBar.classList.contains('zaelot-enhanced')) {
			statusBar.classList.add('zaelot-enhanced');

			// Add Claude status indicator
			this._addClaudeStatusIndicator();
		}
	}

	private _addClaudeStatusIndicator(): void {
		const statusBar = mainWindow.document.querySelector('.statusbar-item.right');
		if (statusBar) {
			const claudeIndicator = mainWindow.document.createElement('div');
			claudeIndicator.className = 'statusbar-item zaelot-claude-status';
			// Create status content with DOM elements instead of innerHTML
			const statusSpan = mainWindow.document.createElement('span');
			statusSpan.className = 'zaelot-status-connected';
			statusSpan.textContent = 'Claude AI Ready';
			claudeIndicator.appendChild(statusSpan);
			claudeIndicator.title = 'Claude AI Integration Status';

			// Insert at the beginning of right status bar
			statusBar.insertBefore(claudeIndicator, statusBar.firstChild);
		}
	}
}

// Register services
registerSingleton(IMigrationService, MigrationService, InstantiationType.Delayed);

// Register the workbench contribution
const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchRegistry.registerWorkbenchContribution(ZaelotWorkbenchContribution, LifecyclePhase.Restored);
