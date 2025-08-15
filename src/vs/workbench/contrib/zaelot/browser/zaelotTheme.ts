/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerColor, transparent, contrastBorder } from '../../../../platform/theme/common/colorRegistry.js';
import { Color } from '../../../../base/common/color.js';

// Zaelot Brand Colors
export const zaelotPrimary = Color.fromHex('#007ACC'); // Zaelot Blue
export const zaelotSecondary = Color.fromHex('#0E4B7A'); // Darker Blue
export const zaelotAccent = Color.fromHex('#00D4FF'); // Light Blue
export const zaelotSuccess = Color.fromHex('#28A745'); // Green
export const zaelotWarning = Color.fromHex('#FFC107'); // Yellow
export const zaelotError = Color.fromHex('#DC3545'); // Red

// Register Zaelot-specific colors
export const zaelotWelcomeBackground = registerColor(
	'zaelot.welcome.background',
	{ dark: '#1E1E1E', light: '#F8F9FA', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot Developer Studio welcome screen background'
);

export const zaelotWelcomeForeground = registerColor(
	'zaelot.welcome.foreground',
	{ dark: '#CCCCCC', light: '#333333', hcDark: '#FFFFFF', hcLight: '#000000' },
	'Zaelot Developer Studio welcome screen foreground'
);

export const zaelotBrandPrimary = registerColor(
	'zaelot.brand.primary',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: zaelotAccent, hcLight: zaelotPrimary },
	'Zaelot primary brand color'
);

export const zaelotBrandSecondary = registerColor(
	'zaelot.brand.secondary',
	{ dark: zaelotSecondary, light: zaelotSecondary, hcDark: zaelotSecondary, hcLight: zaelotSecondary },
	'Zaelot secondary brand color'
);

export const zaelotBrandAccent = registerColor(
	'zaelot.brand.accent',
	{ dark: zaelotAccent, light: zaelotAccent, hcDark: zaelotAccent, hcLight: zaelotAccent },
	'Zaelot accent brand color'
);

export const zaelotChatBackground = registerColor(
	'zaelot.chat.background',
	{ dark: '#252526', light: '#F3F3F3', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot chat interface background'
);

export const zaelotChatBorder = registerColor(
	'zaelot.chat.border',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: contrastBorder, hcLight: contrastBorder },
	'Zaelot chat interface border'
);

export const zaelotButtonBackground = registerColor(
	'zaelot.button.background',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: zaelotPrimary, hcLight: zaelotPrimary },
	'Zaelot button background'
);

export const zaelotButtonForeground = registerColor(
	'zaelot.button.foreground',
	{ dark: '#FFFFFF', light: '#FFFFFF', hcDark: '#FFFFFF', hcLight: '#FFFFFF' },
	'Zaelot button foreground'
);

export const zaelotButtonHoverBackground = registerColor(
	'zaelot.button.hoverBackground',
	{ dark: zaelotSecondary, light: zaelotSecondary, hcDark: zaelotSecondary, hcLight: zaelotSecondary },
	'Zaelot button hover background'
);

export const zaelotStatusBarBackground = registerColor(
	'zaelot.statusBar.background',
	{ dark: zaelotSecondary, light: zaelotPrimary, hcDark: zaelotSecondary, hcLight: zaelotPrimary },
	'Zaelot status bar background'
);

export const zaelotActivityBarBackground = registerColor(
	'zaelot.activityBar.background',
	{ dark: '#2C2C2C', light: '#2C2C2C', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot activity bar background'
);

export const zaelotTabActiveBackground = registerColor(
	'zaelot.tab.activeBackground',
	{ dark: '#1E1E1E', light: '#FFFFFF', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot active tab background'
);

export const zaelotTabActiveBorder = registerColor(
	'zaelot.tab.activeBorder',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: zaelotAccent, hcLight: zaelotPrimary },
	'Zaelot active tab border'
);

export const zaelotNotificationBackground = registerColor(
	'zaelot.notification.background',
	{ dark: '#383838', light: '#F8F9FA', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot notification background'
);

export const zaelotNotificationBorder = registerColor(
	'zaelot.notification.border',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: contrastBorder, hcLight: contrastBorder },
	'Zaelot notification border'
);

export const zaelotSidebarBackground = registerColor(
	'zaelot.sidebar.background',
	{ dark: '#252526', light: '#F3F3F3', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot sidebar background'
);

export const zaelotEditorBackground = registerColor(
	'zaelot.editor.background',
	{ dark: '#1E1E1E', light: '#FFFFFF', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot editor background'
);

export const zaelotMenuBackground = registerColor(
	'zaelot.menu.background',
	{ dark: '#383838', light: '#F8F9FA', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot menu background'
);

export const zaelotMenuBorder = registerColor(
	'zaelot.menu.border',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: contrastBorder, hcLight: contrastBorder },
	'Zaelot menu border'
);

export const zaelotTitleBarBackground = registerColor(
	'zaelot.titleBar.background',
	{ dark: zaelotSecondary, light: zaelotPrimary, hcDark: zaelotSecondary, hcLight: zaelotPrimary },
	'Zaelot title bar background'
);

export const zaelotTitleBarForeground = registerColor(
	'zaelot.titleBar.foreground',
	{ dark: '#FFFFFF', light: '#FFFFFF', hcDark: '#FFFFFF', hcLight: '#FFFFFF' },
	'Zaelot title bar foreground'
);

export const zaelotProgressBarBackground = registerColor(
	'zaelot.progressBar.background',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: zaelotAccent, hcLight: zaelotPrimary },
	'Zaelot progress bar background'
);

export const zaelotLinkForeground = registerColor(
	'zaelot.link.foreground',
	{ dark: zaelotAccent, light: zaelotPrimary, hcDark: zaelotAccent, hcLight: zaelotPrimary },
	'Zaelot link foreground'
);

export const zaelotLinkHoverForeground = registerColor(
	'zaelot.link.hoverForeground',
	{ dark: '#FFFFFF', light: zaelotSecondary, hcDark: '#FFFFFF', hcLight: zaelotSecondary },
	'Zaelot link hover foreground'
);

export const zaelotBadgeBackground = registerColor(
	'zaelot.badge.background',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: zaelotPrimary, hcLight: zaelotPrimary },
	'Zaelot badge background'
);

export const zaelotBadgeForeground = registerColor(
	'zaelot.badge.foreground',
	{ dark: '#FFFFFF', light: '#FFFFFF', hcDark: '#FFFFFF', hcLight: '#FFFFFF' },
	'Zaelot badge foreground'
);

export const zaelotScrollbarSliderBackground = registerColor(
	'zaelot.scrollbarSlider.background',
	{ dark: transparent(zaelotPrimary, 0.3), light: transparent(zaelotPrimary, 0.3), hcDark: transparent(zaelotAccent, 0.3), hcLight: transparent(zaelotPrimary, 0.3) },
	'Zaelot scrollbar slider background'
);

export const zaelotScrollbarSliderHoverBackground = registerColor(
	'zaelot.scrollbarSlider.hoverBackground',
	{ dark: transparent(zaelotPrimary, 0.5), light: transparent(zaelotPrimary, 0.5), hcDark: transparent(zaelotAccent, 0.5), hcLight: transparent(zaelotPrimary, 0.5) },
	'Zaelot scrollbar slider hover background'
);

export const zaelotScrollbarSliderActiveBackground = registerColor(
	'zaelot.scrollbarSlider.activeBackground',
	{ dark: transparent(zaelotPrimary, 0.7), light: transparent(zaelotPrimary, 0.7), hcDark: transparent(zaelotAccent, 0.7), hcLight: transparent(zaelotPrimary, 0.7) },
	'Zaelot scrollbar slider active background'
);

export const zaelotInputBackground = registerColor(
	'zaelot.input.background',
	{ dark: '#3C3C3C', light: '#FFFFFF', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot input background'
);

export const zaelotInputBorder = registerColor(
	'zaelot.input.border',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: contrastBorder, hcLight: contrastBorder },
	'Zaelot input border'
);

export const zaelotInputFocusBorder = registerColor(
	'zaelot.input.focusBorder',
	{ dark: zaelotAccent, light: zaelotAccent, hcDark: zaelotAccent, hcLight: zaelotAccent },
	'Zaelot input focus border'
);

export const zaelotDropdownBackground = registerColor(
	'zaelot.dropdown.background',
	{ dark: '#383838', light: '#F8F9FA', hcDark: '#000000', hcLight: '#FFFFFF' },
	'Zaelot dropdown background'
);

export const zaelotDropdownBorder = registerColor(
	'zaelot.dropdown.border',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: contrastBorder, hcLight: contrastBorder },
	'Zaelot dropdown border'
);

export const zaelotListActiveSelectionBackground = registerColor(
	'zaelot.list.activeSelectionBackground',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: zaelotPrimary, hcLight: zaelotPrimary },
	'Zaelot list active selection background'
);

export const zaelotListActiveSelectionForeground = registerColor(
	'zaelot.list.activeSelectionForeground',
	{ dark: '#FFFFFF', light: '#FFFFFF', hcDark: '#FFFFFF', hcLight: '#FFFFFF' },
	'Zaelot list active selection foreground'
);

export const zaelotListHoverBackground = registerColor(
	'zaelot.list.hoverBackground',
	{ dark: transparent(zaelotPrimary, 0.2), light: transparent(zaelotPrimary, 0.2), hcDark: transparent(zaelotAccent, 0.2), hcLight: transparent(zaelotPrimary, 0.2) },
	'Zaelot list hover background'
);

export const zaelotTreeIndentGuidesStroke = registerColor(
	'zaelot.tree.indentGuidesStroke',
	{ dark: zaelotPrimary, light: zaelotPrimary, hcDark: zaelotAccent, hcLight: zaelotPrimary },
	'Zaelot tree indent guides stroke'
);
