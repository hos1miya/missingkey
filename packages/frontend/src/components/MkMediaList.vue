<template>
<div>
	<XBanner v-for="media in mediaList.filter(media => !previewable(media))" :key="media.id" :media="media"/>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" :class="$style.container">
		<div ref="gallery" :class="[$style.medias, count <= 4 ? $style['n' + count] : $style.nMany]">
			<template v-for="media in mediaList.filter(media => previewable(media))">
				<XVideo v-if="media.type.startsWith('video')" :key="media.id" :class="$style.media" :video="media"/>
				<XImage v-else-if="media.type.startsWith('image')" :key="media.id" :class="$style.media" class="image" :data-id="media.id" :image="media" :raw="raw"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as pleaides from 'pleaides-lib';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import XBanner from '@/components/MkMediaBanner.vue';
import XImage from '@/components/MkMediaImage.vue';
import XVideo from '@/components/MkMediaVideo.vue';
import { FILE_TYPE_BROWSERSAFE } from '@/const';

const props = defineProps<{
	mediaList: pleaides.entities.DriveFile[];
	mediaUser: pleaides.entities.UserLite[];
	raw?: boolean;
}>();

const gallery = ref(null);
const count = $computed(() => props.mediaList.filter(media => previewable(media)).length);

onMounted(() => {
	const lightbox = new PhotoSwipeLightbox({
		dataSource: props.mediaList
			.filter(media => {
				if (media.type === 'image/svg+xml') return true; // svgのwebpublicはpngなのでtrue
				return media.type.startsWith('image') && FILE_TYPE_BROWSERSAFE.includes(media.type);
			})
			.map(media => {
				const item = {
					src: media.url,
					w: media.properties.width,
					h: media.properties.height,
					alt: media.comment || media.name,
					comment: media.comment || media.name,
				};
				if (media.properties.orientation != null && media.properties.orientation >= 5) {
					[item.w, item.h] = [item.h, item.w];
				}
				return item;
			}),
		gallery: gallery.value ?? undefined,
		children: '.image',
		thumbSelector: '.image',
		loop: false,
		padding: window.innerWidth > 500 ? {
			top: 32,
			bottom: 32,
			left: 32,
			right: 32,
		} : {
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
		},
		imageClickAction: 'close',
		tapAction: 'toggle-controls',
		bgOpacity: 1,
		pswpModule: PhotoSwipe,
	});

	lightbox.on('itemData', (ev) => {
		const { itemData } = ev;

		// element is children
		const { element } = itemData;

		const id = element!.dataset.id;
		const file = props.mediaList.find(media => media.id === id);

		const lastDotIndex = file!.name.lastIndexOf('.');

		itemData.src = file!.url;
		itemData.w = Number(file!.properties.width);
		itemData.h = Number(file!.properties.height);
		if (file!.properties.orientation != null && file!.properties.orientation >= 5) {
			[itemData.w, itemData.h] = [itemData.h, itemData.w];
		}
		itemData.msrc = file!.thumbnailUrl;
		itemData.alt = file!.comment || file!.name;
		itemData.comment = file!.comment || file!.name;
		itemData.userId = props.mediaUser[0].username;
		itemData.host = props.mediaUser[0].host || window.location.hostname;
		itemData.fileId = file!.id;
		if (lastDotIndex !== -1) {
			itemData.extension = "." + file!.name.substring(lastDotIndex + 1).toLowerCase();
		} else {
			itemData.extension = "";
		}
		itemData.thumbCropped = true;
	});

	lightbox.on('uiRegister', () => {
		let downloadTitle, downloadUrl;
		lightbox.pswp.ui.registerElement({
			name: 'altText',
			className: 'pswp__alt-text-container',
			appendTo: 'wrapper',
			onInit: (el, pswp) => {
				let textBox = document.createElement('p');
				textBox.className = 'pwsp__alt-text _acrylic';
				el.appendChild(textBox);

				pswp.on('change', (a) => {
					textBox.textContent = pswp.currSlide.data.comment;
				});
			},
		});
		lightbox.pswp.ui.registerElement({
			name: 'download-button',
			order: 9,
			isButton: true,
			tagName: 'button',

			// SVG with outline
			html: {
				isCustomSVG: true,
				inner: '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
				outlineID: 'pswp__icn-download'
			},

			onInit: (el, pswp) => {
				el.setAttribute('title', '');
				el.setAttribute('value', '');
				//el.setAttribute('target', '_blank');
				//el.setAttribute('rel', 'noopener');

				pswp.on('change', () => {
					el.title = pswp.currSlide.data.userId + "." + pswp.currSlide.data.host + "_" + pswp.currSlide.data.fileId + pswp.currSlide.data.extension;
					el.value = pswp.currSlide.data.src;
					downloadTitle = el.title;
					downloadUrl = el.value;
				});
			},
						
			onClick: function (el, pswp) {
				fetch(downloadUrl)
				.then((response) => response.blob())
				.then((blob) => {
					const downloadLink = document.createElement('a');
					downloadLink.href = window.URL.createObjectURL(blob);
					downloadLink.download = downloadTitle;
					downloadLink.click();
				})
				.catch((error) => {
					console.error('ダウンロードエラー:', error);
				});
			}
		});
	});

	lightbox.init();
	
	window.addEventListener('popstate', () => {
		if (lightbox.pswp && lightbox.pswp.isOpen === true) {
			lightbox.pswp.close();
			return;
		}
	});
	lightbox.on('beforeOpen', () => {
		history.pushState(null, '', '#pswp');
	});
	lightbox.on('close', () => {
		if (window.location.hash === '#pswp') {
			history.back();
		}
	});
});

const previewable = (file: pleaides.entities.DriveFile): boolean => {
	if (file.type === 'image/svg+xml') return true; // svgのwebpublic/thumbnailはpngなのでtrue
	// FILE_TYPE_BROWSERSAFEに適合しないものはブラウザで表示するのに不適切
	return (file.type.startsWith('video') || file.type.startsWith('image')) && FILE_TYPE_BROWSERSAFE.includes(file.type);
};
</script>

<style lang="scss" module>
.container {
	position: relative;
	width: 100%;
	margin-top: 4px;
}

.medias {
	display: grid;
	grid-gap: 8px;

	// for webkit
	height: 100%;

	&.n1 {
		aspect-ratio: 16/9;
		grid-template-rows: 1fr;
	}

	&.n2 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}

	&.n3 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 0.5fr;
		grid-template-rows: 1fr 1fr;

		> .media:nth-child(1) {
			grid-row: 1 / 3;
		}

		> .media:nth-child(3) {
			grid-column: 2 / 3;
			grid-row: 2 / 3;
		}
	}

	&.n4 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}

	&.nMany {
		grid-template-columns: 1fr 1fr;

		> .media {
			aspect-ratio: 16/9;
		}
	}
}

.media {
	overflow: hidden; // clipにするとバグる
	border-radius: 8px;
}
</style>

<style lang="scss">
.pswp {
	// なぜか機能しない
  //z-index: v-bind(pswpZIndex);
	z-index: 2000000;
	--pswp-bg: var(--modalBg);
}

.pswp__bg {
	background: var(--modalBg);
	backdrop-filter: var(--modalBgFilter);
}

.pswp__alt-text-container {
	display: flex;
	flex-direction: row;
	align-items: center;

	position: absolute;
	bottom: 30px;
	left: 50%;
	transform: translateX(-50%);

	width: 75%;
	max-width: 800px;
}

.pwsp__alt-text {
	color: var(--fg);
	margin: 0 auto;
	text-align: center;
	padding: var(--margin);
	border-radius: var(--radius);
	max-height: 8em;
	overflow-y: auto;
	text-shadow: var(--bg) 0 0 10px, var(--bg) 0 0 3px, var(--bg) 0 0 3px;
}
</style>
