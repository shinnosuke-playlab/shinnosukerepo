
class Game {
    constructor() {
        this.animals = [];
        this.lastTime = 0;
        this.hp = 1000;
        this.maxHp = 1000;
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
        
        this.updateStats();
    }

    // ゲームループ
    gameLoop(currentTime = 0) {

        // 経過時間を管理
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 動物たちを更新
        this.animals.forEach(animal => {
            animal.update(deltaTime);
        });
        
        // マイキーのセリフ更新
        this.updateMikey(deltaTime);
        
        // HP更新
        this.updateHp();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // カウント表示の更新
    updateStats() {
        const eggCount = this.animals.filter(a => a.type === 'egg').length;
        const chickCount = this.animals.filter(a => a.type === 'chick').length;
        const chickenCount = this.animals.filter(a => a.type === 'chicken').length;
        const totalCount = eggCount + chickCount + chickenCount;
        
        document.getElementById('egg-count').textContent = eggCount;
        document.getElementById('chick-count').textContent = chickCount;
        document.getElementById('chicken-count').textContent = chickenCount;
        document.getElementById('total-count').textContent = totalCount;
    }

    // マイキーのセリフ更新
    updateMikey(deltaTime) {
        this.mikeyTimer += deltaTime;
        const currentPhase = this.mikeyPhases[this.mikeyPhase];
        
        // 叫んでいる状態を更新
        this.isMikeyShouting = currentPhase.isShouting || false;
        
        if (this.mikeyTimer >= currentPhase.duration) {
            this.mikeyTimer = 0;
            this.mikeyPhase++;
            
            // 最後のセリフ「いねえよなぁ！」
            if (this.mikeyPhase >= this.mikeyPhases.length) {
                this.attackChicks();
                this.mikeyPhase = 0; // リセット
                this.isMikeyShouting = false;
                this.hasShownPunchEffects = false; // フラグをリセット
            }
        }
        
        // セリフを更新
        const speechElement = document.getElementById('mikey-speech');
        if (speechElement) {
            speechElement.textContent = currentPhase.text;
        }
        
        // 叫んでいる時に画面をシェイク
        if (this.isMikeyShouting) {
            this.shakeScreen();
            // 叫んでいる時に殴られるエフェクトを表示（1回だけ）
            if (!this.hasShownPunchEffects) {
                this.showPunchEffects();
                this.hasShownPunchEffects = true;
            }
        }
    }
    
    // ひよこが存在したらダメージ
    attackChicks() {
        const chickCount = this.animals.filter(a => a.type === 'chick').length;
        if (chickCount > 0) {
            // HPの減算はshowPunchEffects()で個別に行う
            this.updateStats();
        }
    }
    
    // HPの更新
    updateHp() {
        const hpFill = document.getElementById('hp-fill');
        if (hpFill) {
            const percentage = (this.hp / this.maxHp) * 100;
            hpFill.style.width = percentage + '%';
            
            // HPが低いと色を変える
            if (percentage > 50) {
                hpFill.style.background = '#00FF00';
            } else if (percentage > 25) {
                hpFill.style.background = '#FFFF00';
            } else {
                hpFill.style.background = '#FF0000';
            }
        }
    }
    
    // 画面を揺らす
    shakeScreen() {
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer && !gameContainer.classList.contains('screen-shake')) {
            gameContainer.classList.add('screen-shake');
            setTimeout(() => {
                gameContainer.classList.remove('screen-shake');
            }, 500);
        }
    }
    
    // 殴りエフェクト
    showPunchEffects() {
        const chickCount = this.animals.filter(a => a.type === 'chick').length;
        if (chickCount > 0) {
            // 最大10個までに制限
            const effectCount = Math.min(chickCount, 10);
            
            // 殴られるエフェクトを表示（位置をランダムに）
            for (let i = 0; i < effectCount; i++) {
                setTimeout(() => {
                    this.showImpactEffect();
                    // 殴られた瞬間にHPを減らす
                    this.hp -= 20;
                    this.hp = Math.max(0, this.hp);
                    this.updateHp();
                    
                    if (this.hp <= 0) {
                        this.gameOver();
                    }
                }, i * 150); // 0.15秒間隔で表示
            }
        }
    }
    
    // 殴りエフェクト表示
    showImpactEffect() {
        const effect = document.createElement('div');
        effect.className = 'impact-effect';
        effect.textContent = '💥';
        
        // 画面中央固定
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 500);
    }
    
    // ゲームオーバーになった
    gameOver() {
        const gameOverElement = document.getElementById('game-over');
        if (gameOverElement) {
            gameOverElement.style.display = 'flex';
        }
    }

    // リサイズ時の処理（必要に応じて実装）
    handleResize() {
    }
}
