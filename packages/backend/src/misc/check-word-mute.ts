import RE2 from 're2';
import type { Note } from '@/models/entities/Note.js';
import type { User } from '@/models/entities/User.js';

type NoteLike = {
	userId: Note['userId'];
	text: Note['text'];
	cw?: Note['cw'];
};

type UserLike = {
	id: User['id'];
};

export async function checkWordMute(note: NoteLike, me: UserLike | null | undefined, mutedWords: Array<string | string[]>): Promise<boolean> {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length > 0) {
		let text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();

		if (text === '') return false;

		text = await replaceSingleCustomEmojiToText(text);

		const matched = mutedWords.some(filter => {
			if (Array.isArray(filter)) {
				// 通常判定
				return filter.every(keyword => text.includes(keyword));
			} else if (typeof filter === 'string' && filter.startsWith('{') && filter.endsWith('}')) {
				// 単語判定分岐: 囲い文字 {} でくくられた単語一致
				const word = filter.slice(1, -1);
				// 区切り考慮の正規表現：文字/数字/アンダースコア以外を単語の境界とみなす
				try {
					const boundaryRegex = new RE2(`(?:^|[^\\p{L}\\p{N}_])${word}(?:[^\\p{L}\\p{N}_]|$)`, 'u');
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
					return new RE2(regexp[1], regexp[2]).test(text);
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

export async function checkWordMuteText(noteText: string, mutedWords: Array<string | string[]>): Promise<boolean> {
	if (mutedWords.length > 0) {
		let text = (noteText ?? '').trim();

		if (text === '') return false;

		text = await replaceSingleCustomEmojiToText(text);

		const matched = mutedWords.some(filter => {
			if (Array.isArray(filter)) {
				return filter.every(keyword => text.includes(keyword));
			} else {
				// represents RegExp
				const regexp = filter.match(/^\/(.+)\/(.*)$/);

				// This should never happen due to input sanitisation.
				if (!regexp) return false;

				try {
					return new RE2(regexp[1], regexp[2]).test(text);
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

async function replaceSingleCustomEmojiToText(text: string): Promise<string> {
	const emojiToTextDic: Record<string, string> = {
		// ひらがな
		':_a:': 'あ', ':_i:': 'い', ':_u:': 'う', ':_e:': 'え', ':_o:': 'お',
		':_ka:': 'か', ':_ki:': 'き', ':_ku:': 'く', ':_ke:': 'け', ':_ko:': 'こ',
		':_sa:': 'さ', ':_shi:': 'し', ':_su:': 'す', ':_se:': 'せ', ':_so:': 'そ',
		':_ta:': 'た', ':_chi:': 'ち', ':_tsu:': 'つ', ':_te:': 'て', ':_to:': 'と',
		':_na:': 'な', ':_ni:': 'に', ':_nu:': 'ぬ', ':_ne:': 'ね', ':_no:': 'の',
		':_ha:': 'は', ':_hi:': 'ひ', ':_fu:': 'ふ', ':_he:': 'へ', ':_ho:': 'ほ',
		':_ma:': 'ま', ':_mi:': 'み', ':_mu:': 'む', ':_me:': 'め', ':_mo:': 'も',
		':_ya:': 'や', ':_yu:': 'ゆ', ':_yo:': 'よ',
		':_ra:': 'ら', ':_ri:': 'り', ':_ru:': 'る', ':_re:': 'れ', ':_ro:': 'ろ',
		':_wa:': 'わ', ':_wo:': 'を', ':_n:': 'ん',
		
		// 小さいひらがな
		':_xa:': 'ぁ', ':_xi:': 'ぃ', ':_xu:': 'ぅ', ':_xe:': 'ぇ', ':_xo:': 'ぉ',
		':_xtu:': 'っ',
		':_xya:': 'ゃ', ':_xyu:': 'ゅ', ':_xyo:': 'ょ',

		// カタカナ
		':_a2:': 'ア', ':_i2:': 'イ', ':_u2:': 'ウ', ':_e2:': 'エ', ':_o2:': 'オ',
		':_ka2:': 'カ', ':_ki2:': 'キ', ':_ku2:': 'ク', ':_ke2:': 'ケ', ':_ko2:': 'コ',
		':_sa2:': 'サ', ':_shi2:': 'シ', ':_su2:': 'ス', ':_se2:': 'セ', ':_so2:': 'ソ',
		':_ta2:': 'タ', ':_chi2:': 'チ', ':_tsu2:': 'ツ', ':_te2:': 'テ', ':_to2:': 'ト',
		':_na2:': 'ナ', ':_ni2:': 'ニ', ':_nu2:': 'ヌ', ':_ne2:': 'ネ', ':_no2:': 'ノ',
		':_ha2:': 'ハ', ':_hi2:': 'ヒ', ':_fu2:': 'フ', ':_he2:': 'ヘ', ':_ho2:': 'ホ',
		':_ma2:': 'マ', ':_mi2:': 'ミ', ':_mu2:': 'ム', ':_me2:': 'メ', ':_mo2:': 'モ',
		':_ya2:': 'ヤ', ':_yu2:': 'ユ', ':_yo2:': 'ヨ',
		':_ra2:': 'ラ', ':_ri2:': 'リ', ':_ru2:': 'ル', ':_re2:': 'レ', ':_ro2:': 'ロ',
		':_wa2:': 'ワ', ':_wo2:': 'ヲ', ':_n2:': 'ン',
		
		// 小さいカタカナ
		':_xa2:': 'ァ', ':_xi2:': 'ィ', ':_xu2:': 'ゥ', ':_xe2:': 'ェ', ':_xo2:': 'ォ',
		':_xtu2:': 'ッ',
		':_xya2:': 'ャ', ':_xyu2:': 'ュ', ':_xyo2:': 'ョ',
	};

	return text.replace(/(:_[a-zA-Z0-9]+:)/g, (match) => emojiToTextDic[match] || match);
}
