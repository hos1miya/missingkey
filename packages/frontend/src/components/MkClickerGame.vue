<template>
<div>
	<div v-if="game.ready" :class="$style.game">
		<!-- クッキー数表示 -->
		<div :class="$style.count">
			<i class="ti ti-cookie" style="font-size: 70%;"></i> {{ number(cookiesInt) }}
			<!-- ボーナス表示 -->
			<div v-if="bonusActive" :class="$style.bonus">
				<span>{{ bonusMessage }}</span>
			</div>
		</div>
      
		<!-- クッキーボタン -->
		<button v-click-anime :class="$style.cookieButton" @click="onClick">
			<img src="/client-assets/cookie.png" :class="$style.img" />
		</button>
      
		<!-- アップグレードボタン -->
		<button v-if="cookiesInt >= upgradeCost" :class="$style._upgradeButton" @click="buyUpgrade">
			アップグレード - {{ upgradeCost }}クッキー
		</button>
	</div>
    
	<div v-else>
		<MkLoading />
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import MkReactionEffect from '@/components/MkReactionEffect.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import * as game from '@/scripts/clicker-game';
import number from '@/filters/number';
import { claimAchievement } from '@/scripts/achievements';

defineProps<{
}>();

// saveDataから値を読み込み、必要な情報を取得
const saveData = game.saveData;
const cookies = computed(() => saveData.value?.cookies);
const cookiesInt = computed(() => Math.floor(cookies.value)); // 小数点以下を切り捨て

// 初期化: saveDataに保存されている値を使う
const upgradeCost = ref(50); // 初期値として50を設定
const upgradeLevel = ref(0); // 初期レベル
const cookiesPerClick = ref(1); // クリックあたりのクッキー増加量
const bonusActive = ref(false);
const bonusMessage = ref('');
const cookiesMultiplierActive = ref(false); // クッキー増加ボーナスの有無
const bonusEndTime = ref(0); // ボーナス終了時間（3秒後）を追跡

// ゲームが開始されたときにデータを読み込み
onMounted(async () => {
	await game.load(); // saveDataをロード
	upgradeCost.value = saveData.value?.upgradeCost ?? 50; // 保存されたアップグレードコストを設定
	upgradeLevel.value = saveData.value?.upgradeLevel ?? 0; // 保存されたアップグレードレベルを設定
	cookiesPerClick.value = saveData.value?.cookiesPerClick ?? 1; // 保存されたクリックあたりのクッキー数を設定
	bonusActive.value = false; // ボーナスが最初は無効
	bonusMessage.value = '';
	bonusEndTime.value = 0; // ボーナスの終了時間をリセット
});

// ボーナスをランダムに発動
function activateBonus(): void {
	bonusActive.value = true;
	const bonusType = Math.random() < 0.5 ? 'クリックブースト' : 'クッキー増加(10%)';
	bonusMessage.value = `ボーナス: ${bonusType}`;

	// ボーナスの種類によって処理を分ける
	if (bonusType === 'クリックブースト') {
		// クリックで得られるクッキー数を10倍にするボーナス
		bonusEndTime.value = Date.now() + 8000; // 8秒後にボーナスが終了
	} else if (bonusType === 'クッキー増加(10%)') {
    // クッキー増加ボーナス: 現在のクッキー量を1.1倍に
    saveData.value!.cookies *= 1.1; // 現在のクッキー量を1.1倍に
	}
}

// クリック時の挙動
function onClick(ev: MouseEvent): void {
	const x = ev.clientX;
	const y = ev.clientY;
	os.popup(MkReactionEffect, { reaction: '🍪', x, y }, {}, 'end');

	// ボーナス効果がアクティブなら、クリックあたりのクッキー数は10倍
	const actualCookiesPerClick = (bonusActive.value && Date.now() < bonusEndTime.value)
		? cookiesPerClick.value * 10
		: cookiesPerClick.value; // ボーナスが有効なら10倍

  saveData.value!.cookies += actualCookiesPerClick;
  saveData.value!.totalCookies++;
  saveData.value!.totalHandmadeCookies++;
  saveData.value!.clicked++;

  // ボーナス発動のチェック
  if (Math.random() < 0.02) {
		activateBonus();
  }

  // 初めてのクリックでアチーブメント
  if (cookies.value === 1) {
		claimAchievement('cookieClicked');
  }
}

// アップグレード機能
function buyUpgrade(): void {
	if (cookiesInt.value >= upgradeCost.value) {
    saveData.value!.cookies -= upgradeCost.value;
    upgradeLevel.value++;
    cookiesPerClick.value += upgradeLevel.value; // アップグレードごとに1クリックあたりのクッキー増加量を増やす
    upgradeCost.value = Math.floor(upgradeCost.value * 1.5); // 次のアップグレードコストを1.5倍に
    //claimAchievement('upgradePurchased');
	}
}

// ボーナスの終了をチェックし、時間切れでボーナスを無効にする
useInterval(() => {
	if (bonusActive.value && Date.now() > bonusEndTime.value) {
		bonusActive.value = false; // 8秒経過後にボーナス終了
		bonusMessage.value = ''; // メッセージをクリア
	}
}, 1000, { immediate: false, afterMounted: true });

// セーブデータを5秒ごとに保存
useInterval(() => {
	game.save(); // 保存するタイミングでsaveDataを更新
  saveData.value!.upgradeCost = upgradeCost.value;
  saveData.value!.upgradeLevel = upgradeLevel.value;
  saveData.value!.cookiesPerClick = cookiesPerClick.value;
}, 1000 * 5, { immediate: false, afterMounted: true });

onUnmounted(() => {
	game.save();
});
</script>

<style lang="scss" module>
  .game {
    padding: 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .count {
    font-size: 1.4em;
    margin-bottom: 10px;
    height: 60px;
  }

  .button {
    margin: 10px;
    padding: 20px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }

  .button:hover {
    transform: scale(1.1);
  }

  .img {
    max-width: 90px;
  }

  .cookieButton {
    background: none; /* クッキー画像ボタンには背景色を適用しない */
    border: none; /* ボーダーなし */
    padding: 0; /* 余白なし */
    cursor: pointer; /* カーソルをポインターに */
  }

  .bonus {
    font-size: 1.2em;
    color: #ff0000;
    margin-top: 10px; /* ボーナスの位置を少し下げる */
    padding: 10px 0; /* ボーナス表示用に上下の余白を確保 */
    width: 100%;
    text-align: center; /* ボーナスメッセージの中央揃え */
  }

  ._upgradeButton {
    margin-top: 20px;
    padding: 15px;
    background-color: #5eaf5e;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 1.1em;
    transition: background-color 0.3s;
    display: block; /* これでボタンを縦並びに */
    width: auto; /* 横に広がりすぎないように調整 */
    text-align: center; /* ボタン内テキストの位置調整 */
  }

  ._upgradeButton:hover {
    background-color: #4d8f4d;
  }
</style>
