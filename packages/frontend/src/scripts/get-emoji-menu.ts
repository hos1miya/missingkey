import { $i } from '@/account';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { Ref } from 'vue';

export function getEmojiMenu(props: {
	emojiName: string;
	hide: Ref<boolean>;
}) : any {

	let emojiMutes = $i!.mutedEmojis;

	async function mute() : Promise<void> {
		if (!emojiMutes) return;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.t('muteAreYouSure', { name: props.emojiName }),
		});
		if (canceled) return;

		emojiMutes.push(props.emojiName);
		os.apiWithDialog('i/update', {
			mutedEmojis: emojiMutes,
		});

		props.hide.value = true;
	}

	let menu;
	if ($i && !props.hide.value) {
		menu = [{
				icon: 'ti ti-abc',
				text: props.emojiName,
				action: () : void => {},
			}, {
				icon: 'ti ti-mood-off',
				text: i18n.ts.muteThisEmoji,
				action: () => mute(),
			}]
			.filter(x => x !== undefined);
	} else {
		menu = [{
			icon: 'ti ti-abc',
			text: props.emojiName,
			action: () : void => {},
		}]
			.filter(x => x !== undefined);
	}

	return menu;
}
