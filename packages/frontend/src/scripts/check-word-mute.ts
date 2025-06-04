export function checkWordMute(note: Record<string, any>, me: Record<string, any> | null | undefined, mutedWords: Array<string | string[]>): boolean {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length > 0) {
		const text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();

		if (text === '') return false;

		const matched = mutedWords.some(filter => {
			if (Array.isArray(filter)) {
				// Clean up
				const filteredFilter = filter.filter(keyword => keyword !== '');
				if (filteredFilter.length === 0) return false;

				return filteredFilter.every(keyword => text.includes(keyword));
			} else if (typeof filter === 'string' && filter.startsWith('{') && filter.endsWith('}')) {
				// 単語判定分岐: 囲い文字 {} でくくられた単語一致
				const word = filter.slice(1, -1);
				// 区切り考慮の正規表現：文字/数字/アンダースコア以外を単語の境界とみなす
				try {
					const boundaryRegex = new RegExp(`(?:^|[^\\p{L}\\p{N}_])${word}(?:[^\\p{L}\\p{N}_]|$)`, 'u');
					return boundaryRegex.test(text);
				} catch (err) {
					// フォールバック（誤検出防止）
					return false;
				}
			} else {
				// 正規表現
				const regexp = filter.match(/^\/(.+)\/(.*)$/);

				// This should never happen due to input sanitisation.
				if (!regexp) return false;

				try {
					return new RegExp(regexp[1], regexp[2]).test(text);
				} catch (err) {
					// This should never happen due to input sanitisation.
					return false;
				}
			}
		});

		if (matched) return true;
	}

	return false;
}
