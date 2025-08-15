/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IWorkbenchLayoutService } from '../../../services/layout/browser/layoutService.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { mainWindow } from '../../../../base/browser/window.js';

export class ZaelotSplashService extends Disposable {

	private static readonly SPLASH_ELEMENT_ID = 'zaelot-splash-screen';

	constructor(
		@IThemeService private readonly themeService: IThemeService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
		@ILogService private readonly logService: ILogService
	) {
		super();

		this._createSplashScreen();
		this._setupRemovalListeners();
	}

	private _createSplashScreen(): void {
		const existingSplash = mainWindow.document.getElementById(ZaelotSplashService.SPLASH_ELEMENT_ID);
		if (existingSplash) {
			return; // Already exists
		}

		const splashElement = mainWindow.document.createElement('div');
		splashElement.id = ZaelotSplashService.SPLASH_ELEMENT_ID;
		splashElement.className = 'zaelot-splash-container';

		const currentTheme = this.themeService.getColorTheme();
		const isDark = currentTheme.type === 'dark';

		this._createSplashContent(splashElement, isDark);
		splashElement.style.cssText = this._getSplashCSS(isDark);

		// Insert splash screen
		mainWindow.document.body.appendChild(splashElement);

		this.logService.info('Zaelot splash screen created');
	}

	private _createSplashContent(splashElement: HTMLElement, isDark: boolean): void {
		// Create splash content with DOM elements instead of innerHTML
		const contentDiv = mainWindow.document.createElement('div');
		contentDiv.className = 'zaelot-splash-content';

		// Logo section
		const logoDiv = mainWindow.document.createElement('div');
		logoDiv.className = 'zaelot-splash-logo';
		const logoCircle = mainWindow.document.createElement('div');
		logoCircle.className = 'zaelot-logo-circle';
		const logoText = mainWindow.document.createElement('span');
		logoText.className = 'zaelot-logo-text';
		logoText.textContent = 'Z';
		logoCircle.appendChild(logoText);
		logoDiv.appendChild(logoCircle);

		// Title section
		const titleDiv = mainWindow.document.createElement('div');
		titleDiv.className = 'zaelot-splash-title';
		const title = mainWindow.document.createElement('h1');
		title.textContent = 'Zaelot Developer Studio';
		const subtitle = mainWindow.document.createElement('p');
		subtitle.textContent = 'Powered by Claude AI';
		titleDiv.appendChild(title);
		titleDiv.appendChild(subtitle);

		// Loading section
		const loadingDiv = mainWindow.document.createElement('div');
		loadingDiv.className = 'zaelot-splash-loading';
		const loadingBar = mainWindow.document.createElement('div');
		loadingBar.className = 'zaelot-loading-bar';
		const loadingProgress = mainWindow.document.createElement('div');
		loadingProgress.className = 'zaelot-loading-progress';
		loadingBar.appendChild(loadingProgress);
		const loadingText = mainWindow.document.createElement('p');
		loadingText.className = 'zaelot-loading-text';
		loadingText.textContent = 'Initializing your AI-powered development environment...';
		loadingDiv.appendChild(loadingBar);
		loadingDiv.appendChild(loadingText);

		// Footer section
		const footerDiv = mainWindow.document.createElement('div');
		footerDiv.className = 'zaelot-splash-footer';
		const footerText = mainWindow.document.createElement('p');
		footerText.textContent = '© 2025 Zaelot Inc. All rights reserved.';
		footerDiv.appendChild(footerText);

		// Assemble everything
		contentDiv.appendChild(logoDiv);
		contentDiv.appendChild(titleDiv);
		contentDiv.appendChild(loadingDiv);
		contentDiv.appendChild(footerDiv);
		splashElement.appendChild(contentDiv);
	}

	private _getSplashCSS(isDark: boolean): string {
		const backgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
		const textColor = isDark ? '#CCCCCC' : '#333333';
		const primaryColor = '#007ACC';
		const secondaryColor = '#0E4B7A';
		const accentColor = '#00D4FF';

		return `
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: linear-gradient(135deg, ${backgroundColor} 0%, ${isDark ? '#252526' : '#F8F9FA'} 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;

			.zaelot-splash-content {
				text-align: center;
				max-width: 400px;
				padding: 40px;
			}

			.zaelot-splash-logo {
				margin-bottom: 30px;
			}

			.zaelot-logo-circle {
				width: 80px;
				height: 80px;
				background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
				border-radius: 50%;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 8px 32px rgba(0, 122, 204, 0.3);
				animation: zaelot-logo-pulse 2s ease-in-out infinite;
			}

			.zaelot-logo-text {
				color: white;
				font-size: 36px;
				font-weight: 700;
				letter-spacing: 2px;
			}

			.zaelot-splash-title h1 {
				color: ${textColor};
				font-size: 32px;
				font-weight: 600;
				margin: 0 0 8px 0;
				letter-spacing: -0.5px;
			}

			.zaelot-splash-title p {
				color: ${primaryColor};
				font-size: 16px;
				font-weight: 500;
				margin: 0 0 40px 0;
				opacity: 0.9;
			}

			.zaelot-splash-loading {
				margin-bottom: 40px;
			}

			.zaelot-loading-bar {
				width: 100%;
				height: 4px;
				background: ${isDark ? '#3C3C3C' : '#E0E0E0'};
				border-radius: 2px;
				overflow: hidden;
				margin-bottom: 16px;
			}

			.zaelot-loading-progress {
				height: 100%;
				background: linear-gradient(90deg, ${primaryColor}, ${accentColor});
				border-radius: 2px;
				animation: zaelot-loading 2s ease-in-out infinite;
			}

			.zaelot-loading-text {
				color: ${textColor};
				font-size: 14px;
				margin: 0;
				opacity: 0.8;
				animation: zaelot-fade 1.5s ease-in-out infinite;
			}

			.zaelot-splash-footer {
				opacity: 0.6;
			}

			.zaelot-splash-footer p {
				color: ${textColor};
				font-size: 12px;
				margin: 0;
			}

			@keyframes zaelot-logo-pulse {
				0%, 100% {
					transform: scale(1);
					box-shadow: 0 8px 32px rgba(0, 122, 204, 0.3);
				}
				50% {
					transform: scale(1.05);
					box-shadow: 0 12px 40px rgba(0, 122, 204, 0.5);
				}
			}

			@keyframes zaelot-loading {
				0% {
					width: 0%;
					transform: translateX(-100%);
				}
				50% {
					width: 100%;
					transform: translateX(0%);
				}
				100% {
					width: 100%;
					transform: translateX(100%);
				}
			}

			@keyframes zaelot-fade {
				0%, 100% {
					opacity: 0.8;
				}
				50% {
					opacity: 0.4;
				}
			}

			@media (max-width: 768px) {
				.zaelot-splash-content {
					padding: 20px;
				}

				.zaelot-logo-circle {
					width: 60px;
					height: 60px;
				}

				.zaelot-logo-text {
					font-size: 28px;
				}

				.zaelot-splash-title h1 {
					font-size: 24px;
				}
			}
		`;
	}

	private _setupRemovalListeners(): void {
		// Remove splash screen when workbench is ready
		this.lifecycleService.when(LifecyclePhase.Ready).then(() => {
			setTimeout(() => this._removeSplashScreen(), 1500); // Keep it for a bit to show the animation
		});

		// Also remove on layout ready as a fallback
		this._register(this.layoutService.onDidLayoutMainContainer(() => {
			setTimeout(() => this._removeSplashScreen(), 2000);
		}));
	}

	private _removeSplashScreen(): void {
		const splashElement = mainWindow.document.getElementById(ZaelotSplashService.SPLASH_ELEMENT_ID);
		if (splashElement) {
			// Add fade out animation
			splashElement.style.transition = 'opacity 0.5s ease-out';
			splashElement.style.opacity = '0';

			setTimeout(() => {
				if (splashElement.parentNode) {
					splashElement.parentNode.removeChild(splashElement);
					this.logService.info('Zaelot splash screen removed');
				}
			}, 500);
		}
	}
}
