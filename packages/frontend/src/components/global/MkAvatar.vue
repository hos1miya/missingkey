<!-- eslint-disable vue/require-v-for-key -->
<template>
<component :is="link ? MkA : 'span'" v-user-preview="preview ? user.id : undefined" v-bind="bound" class="_noSelect" :class="[$style.root, { [$style.animation]: animation, [$style.cat]: user.isCat, [$style.square]: squareAvatars }]" :style="{ color }" :title="acct(user)" @click="onClick">
	<img :class="$style.inner" :src="url" decoding="async"/>
	<MkUserOnlineIndicator v-if="indicator" :class="$style.indicator" :user="user"/>
	<div v-if="user.isCat" :class="[$style.ears, { [$style.mask]: useBlurEffect }]">
		<div :class="$style.earLeft">
			<div v-if="false" :class="$style.layer">
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
			</div>
		</div>
		<div :class="$style.earRight">
			<div v-if="false" :class="$style.layer">
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
			</div>
		</div>
	</div>
	<template v-if="showDecoration">
		<img
			v-for="decoration in decorations ?? user.avatarDecorations"
			:class="[$style.decoration]"
			:src="defaultStore.state.disableShowingAnimatedImages
				? getStaticImageUrl(decoration.url)
				: getProxiedImageUrl(decoration.url)"
			:style="{
				rotate: getDecorationAngle(decoration),
				scale: getDecorationScale(decoration),
				translate: getDecorationOffset(decoration),
			}"
			alt=""
		>
	</template>
</component>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import * as misskey from 'misskey-js';
import MkA from './MkA.vue';
import { getStaticImageUrl, getProxiedImageUrl } from '@/scripts/media-proxy';
import { extractAvgColorFromBlurhash } from '@/scripts/extract-avg-color-from-blurhash';
import { acct, userPage } from '@/filters/user';
import MkUserOnlineIndicator from '@/components/MkUserOnlineIndicator.vue';
import { defaultStore } from '@/store';

const animation = $ref(defaultStore.state.animation);
const squareAvatars = $ref(defaultStore.state.squareAvatars);
const useBlurEffect = $ref(defaultStore.state.useBlurEffect);

const props = withDefaults(defineProps<{
	user: misskey.entities.UserDetailed;
	target?: string | null;
	link?: boolean;
	preview?: boolean;
	indicator?: boolean;
	decorations?: Omit<misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>[];
}>(), {
	target: null,
	link: false,
	preview: false,
	indicator: false,
	decorations: undefined,
	forceShowDecoration: false,
});

const emit = defineEmits<{
	(ev: 'click', v: MouseEvent): void;
}>();

const showDecoration = defaultStore.state.showAvatarDecorations;

const bound = $computed(() => props.link
	? { to: userPage(props.user), target: props.target }
	: {});

const url = $computed(() => defaultStore.state.disableShowingAnimatedImages
	? getStaticImageUrl(props.user.avatarUrl)
	: props.user.avatarUrl);

function onClick(ev: MouseEvent): void {
	if (props.link) return;
	emit('click', ev);
}

function getDecorationAngle(decoration: Omit<misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) : string | undefined {
	const angle = decoration.angle ?? 0;
	return angle === 0 ? undefined : `${angle * 360}deg`;
}
function getDecorationScale(decoration: Omit<misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) : string | undefined {
	const scaleX = decoration.flipH ? -1 : 1;
	return scaleX === 1 ? undefined : `${scaleX} 1`;
}

function getDecorationOffset(decoration: Omit<misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) : string | undefined {
	const offsetX = decoration.offsetX ?? 0;
	const offsetY = decoration.offsetY ?? 0;
	return offsetX === 0 && offsetY === 0 ? undefined : `${offsetX * 100}% ${offsetY * 100}%`;
}

let color = $ref<string | undefined>();

watch(() => props.user.avatarBlurhash, () => {
	color = extractAvgColorFromBlurhash(props.user.avatarBlurhash);
}, {
	immediate: true,
});
</script>

<style lang="scss" module>
@keyframes earwiggleleft {
	from { transform: rotate(37.6deg) skew(30deg); }
	25% { transform: rotate(10deg) skew(30deg); }
	50% { transform: rotate(20deg) skew(30deg); }
	75% { transform: rotate(0deg) skew(30deg); }
	to { transform: rotate(37.6deg) skew(30deg); }
}

@keyframes earwiggleright {
	from { transform: rotate(-37.6deg) skew(-30deg); }
	30% { transform: rotate(-10deg) skew(-30deg); }
	55% { transform: rotate(-20deg) skew(-30deg); }
	75% { transform: rotate(0deg) skew(-30deg); }
	to { transform: rotate(-37.6deg) skew(-30deg); }
}

@keyframes eartightleft {
	from { transform: rotate(37.6deg) skew(30deg); }
	50% { transform: rotate(37.4deg) skew(30deg); }
	to { transform: rotate(37.6deg) skew(30deg); }
}

@keyframes eartightright {
	from { transform: rotate(-37.6deg) skew(-30deg); }
	50% { transform: rotate(-37.4deg) skew(-30deg); }
	to { transform: rotate(-37.6deg) skew(-30deg); }
}

.root {
	position: relative;
	display: inline-block;
	vertical-align: bottom;
	flex-shrink: 0;
	border-radius: 100%;
	line-height: 16px;
}

.inner {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	top: 0;
	border-radius: 100%;
	z-index: 1;
	overflow: clip;
	object-fit: cover;
	width: 100%;
	height: 100%;
}

.indicator {
	position: absolute;
	z-index: 2;
	bottom: 0;
	left: 0;
	width: 20%;
	height: 20%;
}

.square {
	border-radius: 20%;

	> .inner {
		border-radius: 20%;
	}
}

.cat {
	> .ears {
		contain: strict;
		position: absolute;
		top: -50%;
		left: -50%;
		width: 100%;
		height: 100%;
		padding: 50%;
		pointer-events: none;

		&.mask {
			-webkit-mask:
				url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><filter id="a"><feGaussianBlur in="SourceGraphic" stdDeviation="1"/></filter><circle cx="16" cy="16" r="15" filter="url(%23a)"/></svg>') center / 50% 50%,
				linear-gradient(#fff, #fff);
			-webkit-mask-composite: destination-out, source-over;
			mask-composite: destination-out, source-over;
			mask:
				url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><filter id="a"><feGaussianBlur in="SourceGraphic" stdDeviation="1"/></filter><circle cx="16" cy="16" r="15" filter="url(%23a)"/></svg>') exclude center / 50% 50%,
				linear-gradient(#fff, #fff); // polyfill of `image(#fff)`

			> .earLeft {
				animation: eartightleft 6s infinite;
			}

			> .earRight {
				animation: eartightright 6s infinite;
			}
		}

		> .earLeft,
		> .earRight {
			contain: strict;
			display: inline-block;
			height: 50%;
			width: 50%;
			background: currentColor;

			&::after {
				contain: strict;
				content: '';
				display: block;
				width: 60%;
				height: 60%;
				margin: 20%;
				background: #df548f;
			}

			> .layer {
				contain: strict;
				position: absolute;
				top: 0;
				width: 280%;
				height: 280%;

				> .plot {
					contain: strict;
					position: absolute;
					width: 100%;
					height: 100%;
					clip-path: path('M0 0H1V1H0z');
					transform: scale(32767);
					transform-origin: 0 0;
					opacity: 0.5;

					&:first-child {
						opacity: 1;
					}

					&:last-child {
						opacity: calc(1 / 3);
					}
				}
			}
		}

		> .earLeft {
			transform: rotate(37.5deg) skew(30deg);

			&, &::after {
				border-radius: 25% 75% 75%;
			}

			> .layer {
				left: 0;
				transform:
					skew(-30deg)
					rotate(-37.5deg)
					translate(-2.82842712475%, /* -2 * sqrt(2) */
										-38.5857864376%); /* 40 - 2 * sqrt(2) */

				> .plot {
					background-position: 20% 10%; /* ~= 37.5deg */

					&:first-child {
						background-position-x: 21%;
					}

					&:last-child {
						background-position-y: 11%;
					}
				}
			}
		}

		> .earRight {
			transform: rotate(-37.5deg) skew(-30deg);

			&, &::after {
				border-radius: 75% 25% 75% 75%;
			}

			> .layer {
				right: 0;
				transform:
					skew(30deg)
					rotate(37.5deg)
					translate(2.82842712475%, /* 2 * sqrt(2) */
										-38.5857864376%); /* 40 - 2 * sqrt(2) */

				> .plot {
					position: absolute;
					background-position: 80% 10%; /* ~= 37.5deg */

					&:first-child {
						background-position-x: 79%;
					}

					&:last-child {
						background-position-y: 11%;
					}
				}
			}
		}
	}

	&.animation:hover {
		> .ears {
			> .earLeft {
				animation: earwiggleleft 1s infinite;
			}

			> .earRight {
				animation: earwiggleright 1s infinite;
			}
		}
	}
}

.decoration {
	position: absolute;
	z-index: 1;
	top: -50%;
	left: -50%;
	width: 200%;
	pointer-events: none;
}
</style>
