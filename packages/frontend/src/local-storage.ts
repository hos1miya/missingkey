/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type Keys =
	'v' |
	'lastVersion' |
	'instance' |
	'emojis' | // TODO: indexed db
	'lastEmojisFetchedAt' |
	'account' |
	'accounts' |
	'latestDonationInfoShownAt' |
	'neverShowDonationInfo' |
	'lastUsed' |
	'lang' |
	'drafts' |
	'hashtags' |
	'wallpaper' |
	'theme' |
	'colorSchema' |
	'useSystemFont' | 
	'fontSize' |
	'ui' |
	'ui_temp' |
	'locale' |
	'localeVersion' |
	'theme' |
	'customCss' |
	'message_drafts' |
	'scratchpad' |
	`miux:${string}` |
	`ui:folder:${string}` |
	`themes:${string}` |
	`aiscript:${string}`;

export const miLocalStorage = {
	getItem: (key: Keys) => window.localStorage.getItem(key),
	setItem: (key: Keys, value: string) => window.localStorage.setItem(key, value),
	removeItem: (key: Keys) => window.localStorage.removeItem(key),
	getItemAsJson: (key: Keys): any | undefined => {
		const item = miLocalStorage.getItem(key);
		if (item === null) {
			return undefined;
		}
		return JSON.parse(item);
	},
	setItemAsJson: (key: Keys, value: any): void => {
		miLocalStorage.setItem(key, JSON.stringify(value));
	},
};
