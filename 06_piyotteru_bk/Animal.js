class Animal {
    constructor(x, y, type = 'egg') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.element = null;
        this.progress = 0;
        this.maxProgress = this.getMaxProgress();
        this.moveTimer = 0;
        this.moveInterval = this.getMoveInterval();
        this.direction = Math.random() * Math.PI * 2;
        this.speed = this.getSpeed();
        this.lastEggTime = 0;
        this.eggInterval = 3000; // たまごを産む間隔
        
        this.createElement();
        this.updateDisplay();
    }

    // 進捗バーの最大値定義
    getMaxProgress() {
        switch(this.type) {
            case 'egg': return 10000;
            case 'chick': return 10000;
            case 'chicken': return 10000;
            case 'meat': return 0;
            default: return 10000;
        }
    }

    // 移動のインターバル定義
    getMoveInterval() {
        switch(this.type) {
            case 'egg': return 0; // たまごは動かない
            case 'chick': return 100;
            case 'chicken': return 20;
            case 'meat': return 0;
            default: return 0;
        }
    }

    // 移動スピード定義
    getSpeed() {
        switch(this.type) {
            case 'egg': return 0;
            case 'chick': return 2;
            case 'chicken': return 4;
            case 'meat': return 0;
            default: return 0;
        }
    }

    // 絵文字判定
    getEmoji() {
        const emoji = this.type === 'egg' ? '🥚' : 
                     this.type === 'chick' ? '🐤' :
                     this.type === 'chicken' ? '🐔' : '🍗';
        return emoji;
    }

    // 要素生成
    createElement() {
        this.element = document.createElement('div');
        this.element.className = `animal ${this.type}`;
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        
        // 絵文字を設定
        const emoji = this.getEmoji();
        this.element.textContent = emoji;
        
        // プログレスバーを追加
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);
        this.element.appendChild(progressBar);
        
        // タップイベント
        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onTap();
        });
        
        document.getElementById('farm-area').appendChild(this.element);
    }

    // 表示更新
    updateDisplay() {
        if (!this.element) return;
        
        // 移動
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        
        // プログレスバーの更新
        const progressFill = this.element.querySelector('.progress-fill');
        if (progressFill && this.maxProgress > 0) {
            const percentage = (this.progress / this.maxProgress) * 100;
            progressFill.style.width = percentage + '%';
        }
    }

    // 更新
    update(deltaTime) {
        // 進捗を更新（マイキーが叫んでいる時は停止）
        if (this.maxProgress > 0 && !window.game?.isMikeyShouting) {
            this.progress += deltaTime;
        }
        
        // 移動処理（マイキーが叫んでいる時は停止）
        if (this.maxProgress > 0 && !window.game?.isMikeyShouting) {
            if (this.speed > 0) {
                this.moveTimer += deltaTime;
                if (this.moveTimer >= this.moveInterval) {
                    this.moveTimer = 0;
                    this.move();
                }
            }
        }
        
        // にわとりのたまご産卵
        if (this.type === 'chicken') {
            const now = Date.now();
            if (now - this.lastEggTime >= this.eggInterval) {
                this.layEgg();
                this.lastEggTime = now;
            }
        }
        
        // 変化チェック
        if (this.progress >= this.maxProgress && this.maxProgress > 0) {
            this.evolve();
        }
        
        this.updateDisplay();
    }

    // 移動
    move() {
        const farmArea = document.getElementById('farm-area');
        const farmRect = farmArea.getBoundingClientRect();
        const maxX = farmRect.width - 40;
        const maxY = farmRect.height - 40;
        
        // ランダムに方向を変更（より頻繁に）
        if (Math.random() < 0.1) {
            this.direction = Math.random() * Math.PI * 2;
        }
        
        // 移動
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        
        // 境界チェック
        if (this.x < 0) {
            this.x = 0;
            this.direction = Math.PI - this.direction;
        } else if (this.x > maxX) {
            this.x = maxX;
            this.direction = Math.PI - this.direction;
        }
        
        if (this.y < 0) {
            this.y = 0;
            this.direction = -this.direction;
        } else if (this.y > maxY) {
            this.y = maxY;
            this.direction = -this.direction;
        }
    }

    // 進化
    evolve() {
        let newType;
        switch(this.type) {
            case 'egg':
                newType = 'chick';
                break;
            case 'chick':
                newType = 'chicken';
                break;
            case 'chicken':
                newType = 'meat';
                break;
            default:
                return;
        }
        
        this.type = newType;
        this.progress = 0;
        this.maxProgress = this.getMaxProgress();
        this.moveInterval = this.getMoveInterval();
        this.speed = this.getSpeed();
        
        // プログレスバーのアニメーションを一時的に無効化
        const progressFill = this.element.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.classList.add('no-transition');
            progressFill.style.width = '0%';
            // 次のフレームでアニメーションを再有効化
            requestAnimationFrame(() => {
                progressFill.classList.remove('no-transition');
            });
        }
        
        // 絵文字を更新（プログレスバーを保持）
        const emoji = this.getEmoji();
        // 最初の子要素（絵文字）のみを更新
        if (this.element.firstChild) {
            this.element.firstChild.textContent = emoji;
        }
        
        // クラス名を更新
        this.element.className = `animal ${this.type}`;
        
        // ゲームの統計を更新
        if (window.game) {
            window.game.updateStats();
        }
    }

    // 産卵
    layEgg() {
        const newEgg = new Animal(this.x + (Math.random() - 0.5) * 20, this.y + (Math.random() - 0.5) * 20, 'egg');
        if (window.game) {
            window.game.animals.push(newEgg);
            window.game.updateStats();
        }
    }

    // タップ
    onTap() {
        // 進捗を20%進める
        this.progress += this.maxProgress * 0.4;
        
        // タップエフェクト
        this.showTapEffect();
    }

    // タップエフェクト
    showTapEffect() {
        const effect = document.createElement('div');
        effect.className = 'tap-effect';
        effect.textContent = 'ピヨ';
        effect.style.left = this.x + 'px';
        effect.style.top = this.y + 'px';
        document.getElementById('farm-area').appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }

    // 破棄
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
