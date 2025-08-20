/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Editors } from './editors';
import { Code } from './code';
import { QuickAccess } from './quickaccess';

const SEARCH_BOX_TEXTAREA = '.settings-editor .suggest-input-container .monaco-editor textarea';

export class SettingsEditor {
	constructor(private code: Code, private editors: Editors, private quickaccess: QuickAccess) { }

	/**
	 * Write a single setting key value pair.
	 *
	 * Warning: You may need to set `editor.wordWrap` to `"on"` if this is called with a really long
	 * setting.
	 */
	async addUserSetting(setting: string, value: string): Promise<void> {
		await this.openUserSettingsFile();

		await this.editors.selectTab('settings.json');

		// Simplified approach: just click at the end and type
		const textAreaSelector = '.monaco-editor[data-uri$="settings.json"] textarea';
		await this.code.waitAndClick(textAreaSelector);
		await this.code.dispatchKeybinding('right', async () => { });

		// Wait a moment for cursor positioning
		await new Promise(resolve => setTimeout(resolve, 200));

		await this.code.waitForTypeInEditor(textAreaSelector, `"${setting}": ${value},`);
		await this.editors.saveOpenedFile();
	}

	/**
	 * Write several settings faster than multiple calls to {@link addUserSetting}.
	 *
	 * Warning: You will likely also need to set `editor.wordWrap` to `"on"` if `addUserSetting` is
	 * called after this in the test.
	 */
	async addUserSettings(settings: [key: string, value: string][]): Promise<void> {
		await this.openUserSettingsFile();

		await this.editors.selectTab('settings.json');

		// Simplified approach: just click at the end and type
		const textAreaSelector = '.monaco-editor[data-uri$="settings.json"] textarea';
		await this.code.waitAndClick(textAreaSelector);
		await this.code.dispatchKeybinding('right', async () => { });

		// Wait a moment for cursor positioning
		await new Promise(resolve => setTimeout(resolve, 200));

		await this.code.waitForTypeInEditor(textAreaSelector, settings.map(v => `"${v[0]}": ${v[1]},`).join(''));
		await this.editors.saveOpenedFile();
	}

	async clearUserSettings(): Promise<void> {
		await this.openUserSettingsFile();

		// Simplified approach: select all and replace with empty object
		const textAreaSelector = '.monaco-editor[data-uri$="settings.json"] textarea';
		await this.code.waitAndClick(textAreaSelector);
		await this.quickaccess.runCommand('editor.action.selectAll');

		// Wait a moment for selection
		await new Promise(resolve => setTimeout(resolve, 200));

		await this.code.waitForTypeInEditor(textAreaSelector, `{`); // will auto close }
		await this.editors.saveOpenedFile();
		await this.quickaccess.runCommand('workbench.action.closeActiveEditor');
	}

	async openUserSettingsFile(): Promise<void> {
		await this.quickaccess.runCommand('workbench.action.openSettingsJson');

		// Wait for the settings.json editor to be present without requiring specific focus
		const editor = '.monaco-editor[data-uri$="settings.json"]';
		await this.code.waitForElement(`${editor} .view-lines`);

		// Give a small delay for the editor to stabilize
		await new Promise(resolve => setTimeout(resolve, 300));
	}

	async openUserSettingsUI(): Promise<void> {
		await this.quickaccess.runCommand('workbench.action.openSettings2');

		// For smoke tests, always use textarea to avoid editContext issues
		await this.code.waitForElement(SEARCH_BOX_TEXTAREA);

		// Give a small delay for stability
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	async searchSettingsUI(query: string): Promise<void> {
		await this.openUserSettingsUI();

		// For smoke tests, always use textarea to avoid editContext issues
		const activeSelector = SEARCH_BOX_TEXTAREA;

		await this.code.waitAndClick(activeSelector);
		await this.code.dispatchKeybinding(process.platform === 'darwin' ? 'cmd+a' : 'ctrl+a', async () => { });
		await this.code.dispatchKeybinding('Delete', async () => {
			await this.code.waitForElements('.settings-editor .settings-count-widget', false, results => !results || (results?.length === 1 && !results[0].textContent));
		});
		await this.code.waitForTypeInEditor(activeSelector, query);
		await this.code.waitForElements('.settings-editor .settings-count-widget', false, results => results?.length === 1 && results[0].textContent.includes('Found'));
	}




}
