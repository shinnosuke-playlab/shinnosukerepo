
/*
 * src/js/Game.js
 * Game core: maintains game state, animals, HP, shop interaction hooks.
 * Kept as a global `Game` class for compatibility with index.html.
 */

class Game {
	constructor() {
		this.animals = [];
		this.lastTime = 0;
		this.paused = false;
		this.hp = 1000;
		this.maxHp = 1000;
		// 肉（通貨）集計
		this.meatCollected = 0;
		// 集会（いねえよなぁ！）カウント
		this.gatherCount = 0;
		// 勝利条件は外部から設定可能にする（window.GAME_CONFIG.gatherTarget を参照）
		// 変更しやすくするため、グローバル設定があればそれを使い、なければデフォルト 10 を使う
		this.gatherTarget = (window.GAME_CONFIG && window.GAME_CONFIG.gatherTarget) || 10;
		this.mikeyPhase = 0;
		this.mikeyTimer = 0;
		this.isMikeyShouting = false;
		this.hasShownPunchEffects = false;
		this.mikeyPhases = [
			{ text: "この中に...", duration: 3000 },
			{ text: "ピヨってるやつ", duration: 3000 },
			{ text: "いるー？", duration: 3000 },
			{ text: "いねえよなぁ！！？", duration: 1500, isShouting: true }
		];
		this.init();
	}

	init() {
		// 初期のたまごを配置
		this.addInitialEggs();
        
		// ゲームループ開始
		this.gameLoop();
        
		// リサイズ対応
		window.addEventListener('resize', () => {
			this.handleResize();
		});

		// UI初期化（存在すれば）
		if (window.UI && typeof window.UI.init === 'function') {
			window.UI.init(this);
		}
	}

	// 初期のたまごを配置
	addInitialEggs() {
		const farmArea = document.getElementById('farm-area');
		const farmRect = farmArea.getBoundingClientRect();
        
		// 初期配置（ランダム）
		const num = 3;
		for (let i = 0; i < num; i++) {
			const rangeX = farmRect.width / 4
			const x = Math.random() * rangeX + ((farmRect.width - rangeX) / 2);
			const rangeY = farmRect.height / 4
			const y = Math.random() * rangeY + ((farmRect.height - rangeY) / 2);
			const egg = new Animal(x, y, 'egg');
			this.animals.push(egg);
		}
        
		// 統計はUIモジュールに委譲
		if (window.UI) window.UI.updateStats(this);
	}

	// ゲームループ
	gameLoop(currentTime = 0) {

		// 経過時間を管理
		const deltaTime = currentTime - this.lastTime;
		this.lastTime = currentTime;
        
		// 一時停止中は更新をスキップ（時間基準をずらさない）
		if (this.paused) {
			requestAnimationFrame((time) => this.gameLoop(time));
			return;
		}

		// 動物たちを更新
		this.animals.forEach(animal => {
			animal.update(deltaTime);
		});

	// マイキーのセリフ更新（mikey.js に分離）
	if (window.Mikey) window.Mikey.update(this, deltaTime);

	// HP更新（UIモジュールに委譲）
	if (window.UI) window.UI.updateHp(this);

		requestAnimationFrame((time) => this.gameLoop(time));
	}

	// カウント表示の更新
	updateStats() {
		const eggCount = this.animals.filter(a => a.type === 'egg').length;
		const chickCount = this.animals.filter(a => a.type === 'chick').length;
		const chickenCount = this.animals.filter(a => a.type === 'chicken').length;
		const totalCount = eggCount + chickCount + chickenCount;
        
		// 旧実装を残さず、UIモジュールに委譲する
		if (window.UI) {
			window.UI.updateStats(this);
			if (typeof window.UI.updateMeat === 'function') window.UI.updateMeat(this);
		}
	}

	// 肉（通貨）を増やす
	addMeat(n) {
		this.meatCollected = (this.meatCollected || 0) + n;
		if (window.UI && typeof window.UI.updateMeat === 'function') window.UI.updateMeat(this);
	}

	// 動物を配列から削除して要素を破棄
	removeAnimal(animal) {
		const idx = this.animals.indexOf(animal);
		if (idx !== -1) {
			this.animals.splice(idx, 1);
		}
		try { animal.destroy(); } catch (e) {}
		// 統計更新
		this.updateStats();
	}

	// --- ショップ周り（簡易） ---
	// ショップアイテム定義
	shopItems() {
		return {
			wolf: { id: 'wolf', name: 'オオカミを放つ', cost: 3, duration: 10000 },
			// 自動回収機: 画面上の肉を一定間隔で自動回収する
			autoCollector: { id: 'autoCollector', name: '自動回収機', cost: 5, duration: 15000, interval: 1000 }
			// 他のアイテムをここに追加可能
		};
	}

	// アイテム購入
	buyItem(itemId) {
		const item = this.shopItems()[itemId];
		if (!item) return;
		if (this.meatCollected < item.cost) {
			// 足りない
			if (window.UI && typeof window.UI.showBuyFailed === 'function') window.UI.showBuyFailed(item);
			return;
		}
		this.meatCollected -= item.cost;
		if (window.UI && typeof window.UI.updateMeat === 'function') window.UI.updateMeat(this);

		// 効果発動
		switch(itemId) {
			case 'wolf':
				this.startWolf(item.duration);
				break;
			case 'autoCollector':
				this.startAutoCollector(item.duration, item.interval);
				break;
			default:
				break;
		}
	}

	// オオカミを発動：一定時間ランダムにニワトリを消す（肉にしない）
	startWolf(duration) {
		if (this._wolfActive) return; // 多重発動を防ぐ
		this._wolfActive = true;
		const killInterval = 800;
		const killFn = () => {
			// ランダムににわとりを選ぶ（まだオオカミに狙われていないもの）
			const chickens = this.animals.filter(a => a.type === 'chicken' && !a.isWolfed);
			if (chickens.length === 0) return;
			const target = chickens[Math.floor(Math.random() * chickens.length)];

			// 視覚的にわかるようにオオカミにされる（3秒）
			try {
				target.isWolfed = true;
				// バックアップして移動を止める
				target._wolfBackup = { speed: target.speed, moveInterval: target.moveInterval };
				target.speed = 0;
				target.moveInterval = Infinity;

				if (target.element && target.element.firstChild) {
					target.element.firstChild.textContent = '🐺';
					target.element.classList.add('wolf-target');
				}
			} catch (e) {}

			// 3秒後に消去（肉にはしない）
			setTimeout(() => {
				try {
					// クラスは外す（要素削除前のクリーンアップ）
					if (target.element) target.element.classList.remove('wolf-target');
				} catch (e) {}
				this.removeAnimal(target);
			}, 3000);
		};

		const timerId = setInterval(killFn, killInterval);
		// UIに通知
		if (window.UI && typeof window.UI.showShopEffect === 'function') window.UI.showShopEffect({id:'wolf',name:'オオカミ'});

		setTimeout(() => {
			clearInterval(timerId);
			this._wolfActive = false;
			if (window.UI && typeof window.UI.hideShopEffect === 'function') window.UI.hideShopEffect({id:'wolf',name:'オオカミ'});
		}, duration);
	}

	// 自動回収機を開始：画面上の肉を定期的に収集する（肉を増やす）
	startAutoCollector(duration, interval = 1000) {
		if (this._autoCollectorActive) return;
		this._autoCollectorActive = true;
		const collectFn = () => {
			// 画面上の肉アイテムをすべて回収
			const meats = this.animals.filter(a => a.type === 'meat');
			if (meats.length === 0) return;
			// copyしてループ
			const toCollect = meats.slice();
			toCollect.forEach(m => {
				try {
					// 収集時は1個ずつカウント
					this.addMeat(1);
					this.removeAnimal(m);
				} catch (e) {}
			});
		};

		const timerId = setInterval(collectFn, interval);
		if (window.UI && typeof window.UI.showShopEffect === 'function') window.UI.showShopEffect({id:'autoCollector', name:'自動回収機'});

		setTimeout(() => {
			clearInterval(timerId);
			this._autoCollectorActive = false;
			if (window.UI && typeof window.UI.hideShopEffect === 'function') window.UI.hideShopEffect({id:'autoCollector', name:'自動回収機'});
		}, duration);
	}

	// マイキーのセリフ更新
	updateMikey(deltaTime) {
		// updateMikey は mikey.js に移しました。ここは参照のためのダミーにしてあります。
		// 実行時は window.Mikey.update(this, deltaTime) を使用してください。
	}
    
	// ひよこが存在したらダメージ
	attackChicks() {
		const chickCount = this.animals.filter(a => a.type === 'chick').length;
		if (chickCount > 0) {
			// HPの減算はshowPunchEffects()で個別に行う
			if (window.UI) window.UI.updateStats(this);
		}
	}
    
	// HPの更新
	updateHp() {
		// HPの更新は UI モジュールに委譲（後方互換のため空実装は残す）
		if (window.UI) window.UI.updateHp(this);
	}

	// 一時停止トグル
	togglePause() {
		this.paused = !this.paused;
		const pauseBtn = document.getElementById('pause-btn');
		if (pauseBtn) {
			pauseBtn.textContent = this.paused ? '再開' : '一時停止';
		}
	}
    
	// 画面を揺らす
	shakeScreen() {
		// 画面揺れは mikey.js に移動しました。
	}
    
	// 殴りエフェクト
	showPunchEffects() {
		// 殴りエフェクトは mikey.js に移動しました。
	}
    
	// 殴りエフェクト表示
	showImpactEffect() {
		// インパクトエフェクトは mikey.js に移動しました。
	}
    
	// ゲームオーバーになった
	gameOver() {
		const gameOverElement = document.getElementById('game-over');
		if (gameOverElement) {
			gameOverElement.style.display = 'flex';
		}
	}

	// ゲームクリア（集会を生き残った）
	gameClear() {
		// 表示用のリザルト画面を出す
		const resultEl = document.getElementById('result-screen');
		if (resultEl) {
			// HP に応じた回復表記
			const recovery = this.getRecoveryText();
			const scoreText = resultEl.querySelector('.result-text');
			if (scoreText) scoreText.textContent = `おめでとう！ ${this.gatherCount}/${this.gatherTarget} 集会を生き残った\\nHP 残り: ${this.hp}/${this.maxHp} (${recovery})`;
			resultEl.style.display = 'flex';
		}
	}

	// HPに応じた回復テキストを返す（簡易マッピング）
	getRecoveryText() {
		const ratio = this.hp / this.maxHp;
		if (ratio >= 0.9) return '全治 1 週間';
		if (ratio >= 0.7) return '全治 2 週間';
		if (ratio >= 0.5) return '全治 1 ヶ月';
		if (ratio >= 0.3) return '全治 2 ヶ月';
		return '全治 半年';
	}

	// リサイズ時の処理（必要に応じて実装）
	handleResize() {
	}
}

