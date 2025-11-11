/* mikey.js
   マイキー（NPC）の振る舞いと殴りエフェクトをまとめたファイル
   - update(game, deltaTime): セリフフェーズ管理、叫び判定、画面揺れ
   - showPunchEffects(game): ひよこがいるときのダメージ演出（HP減少含む）
   - showImpactEffect(): 画面中央の一瞬のエフェクト表示

   依存: window.UI を使ってUI表示（殴られメッセージ）を行う
*/

window.Mikey = (function () {
    return {
        // フェーズの駆動（Game側の mikeyPhases, mikeyTimer, mikeyPhase を使用）
        update: function (game, deltaTime) {
            if (!game) return;
            game.mikeyTimer += deltaTime;
            const currentPhase = game.mikeyPhases[game.mikeyPhase];

            game.isMikeyShouting = currentPhase.isShouting || false;

            if (game.mikeyTimer >= currentPhase.duration) {
                game.mikeyTimer = 0;
                game.mikeyPhase++;

                if (game.mikeyPhase >= game.mikeyPhases.length) {
                    // 最後のフェーズ終了時の攻撃判定
                    // 集会カウントを増やす（「いねえよなぁ！」が行われた回数）
                    game.gatherCount = (game.gatherCount || 0) + 1;
                    // 生き残っていたらクリア
                    if (game.gatherCount >= (game.gatherTarget || 5) && game.hp > 0) {
                        game.gameClear();
                    }
                    game.attackChicks();
                    game.mikeyPhase = 0;
                    game.isMikeyShouting = false;
                    game.hasShownPunchEffects = false;
                }
            }

            // セリフ更新
            const speechElement = document.getElementById('mikey-speech');
            if (speechElement) {
                speechElement.textContent = currentPhase.text;
            }

            // 叫んでいる時の挙動
            if (game.isMikeyShouting) {
                this.shakeScreen();
                if (!game.hasShownPunchEffects) {
                    this.showPunchEffects(game);
                    game.hasShownPunchEffects = true;
                }
            }
        },

        // 画面を揺らす
        shakeScreen: function () {
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer && !gameContainer.classList.contains('screen-shake')) {
                gameContainer.classList.add('screen-shake');
                setTimeout(() => {
                    gameContainer.classList.remove('screen-shake');
                }, 500);
            }
        },

        // 殴り演出（HP減少とUIメッセージの表示）
        showPunchEffects: function (game) {
            const chickCount = game.animals.filter(a => a.type === 'chick').length;
            if (chickCount > 0) {
                const effectCount = Math.min(chickCount, 10);
                for (let i = 0; i < effectCount; i++) {
                    setTimeout(() => {
                        this.showImpactEffect();
                        game.hp -= 20;
                        game.hp = Math.max(0, game.hp);
                        if (window.UI) window.UI.updateHp(game);

                        if (game.hp <= 0) {
                            game.gameOver();
                        }
                    }, i * 150);
                }

                // 殴られメッセージはUIに委譲
                if (window.UI) window.UI.showHitMessage(chickCount);
            }
        },

        // 画面中央に一瞬だけ出るエフェクト
        showImpactEffect: function () {
            const effect = document.createElement('div');
            effect.className = 'impact-effect';
            effect.textContent = '💥';
            effect.style.left = '50%';
            effect.style.top = '50%';
            effect.style.transform = 'translate(-50%, -50%)';
            document.body.appendChild(effect);
            setTimeout(() => {
                if (effect.parentNode) effect.parentNode.removeChild(effect);
            }, 500);
        }
    };
})();
