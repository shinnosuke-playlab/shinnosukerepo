/*
 * src/js/ui.js
 * UI 関連の機能をまとめたファイル（トップレベル版から移行）
 * - ステータス表示（たまご/ひよこ/にわとり/合計）
 * - HPの数値表示更新
 * - 一時停止ボタンの初期化
 * - 殴られメッセージの表示
 *
 * 依存: window.game が存在することを前提とする（Game インスタンス）
 */

window.UI = (function () {
    return {
        // 初期化（ボタンのイベントなど）
        init: function (game) {
            const pauseBtn = document.getElementById('pause-btn');
            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => game.togglePause());
            }
        },

        // 統計の更新（egg/chick/chicken および右上の合計）
        updateStats: function (game) {
            if (!game) return;
            const eggCount = game.animals.filter(a => a.type === 'egg').length;
            const chickCount = game.animals.filter(a => a.type === 'chick').length;
            const chickenCount = game.animals.filter(a => a.type === 'chicken').length;
            const totalCount = eggCount + chickCount + chickenCount;

            const eggEl = document.getElementById('egg-count');
            const chickEl = document.getElementById('chick-count');
            const chickenEl = document.getElementById('chicken-count');
            const topCount = document.getElementById('total-count-top');

            if (eggEl) eggEl.textContent = eggCount;
            if (chickEl) chickEl.textContent = chickCount;
            if (chickenEl) chickenEl.textContent = chickenCount;
            if (topCount) topCount.textContent = totalCount;
            // 肉の数を更新（存在する場合）
            const meatEl = document.getElementById('meat-count');
            if (meatEl && typeof game.meatCollected !== 'undefined') meatEl.textContent = game.meatCollected;
            // 集会（いねえよなぁ！）回数を表示
            const gatherEl = document.getElementById('gather-count');
            if (gatherEl) {
                gatherEl.textContent = `${game.gatherCount || 0}/${game.gatherTarget || 5} 集会`;
            }
        },

        // 肉の数だけ更新する専用メソッド
        updateMeat: function (game) {
            if (!game) return;
            const meatEl = document.getElementById('meat-count');
            if (meatEl) meatEl.textContent = game.meatCollected || 0;
        },

        // HPバーと数値の更新
        updateHp: function (game) {
            if (!game) return;
            const hpFill = document.getElementById('hp-fill');
            if (hpFill) {
                const percentage = (game.hp / game.maxHp) * 100;
                hpFill.style.width = percentage + '%';

                if (percentage > 50) {
                    hpFill.style.background = '#00FF00';
                } else if (percentage > 25) {
                    hpFill.style.background = '#FFFF00';
                } else {
                    hpFill.style.background = '#FF0000';
                }
            }

            const hpText = document.getElementById('hp-text');
            if (hpText) {
                hpText.textContent = `${game.hp}/${game.maxHp}`;
            }
        },

        // 殴られたときの独立メッセージ表示（UI側は表示のみを担当）
        showHitMessage: function (count) {
            const hitMsgEl = document.getElementById('hit-message');
            if (hitMsgEl) {
                hitMsgEl.textContent = `${count}匹いるじゃねえか！`;
                hitMsgEl.style.display = 'block';
                setTimeout(() => hitMsgEl.classList.add('show'), 10);
                setTimeout(() => {
                    hitMsgEl.classList.remove('show');
                    setTimeout(() => { if (hitMsgEl) hitMsgEl.style.display = 'none'; }, 250);
                }, 1800);
            }
        }
        ,
        // 購入に失敗したときの簡易フィードバック
        showBuyFailed: function (item) {
            const shopMsg = document.getElementById('shop-message');
            if (shopMsg) {
                shopMsg.textContent = `${item.name} を買うには 肉 ${item.cost} 個必要です`;
                shopMsg.style.opacity = '1';
                setTimeout(() => { shopMsg.style.opacity = '0'; }, 1800);
            }
        },

        // ショップ効果の表示
        showShopEffect: function (item) {
            const effectEl = document.getElementById('shop-effect');
            if (effectEl) {
                effectEl.textContent = `${item.name} 発動中`;
                effectEl.style.display = 'block';
            }
        },

        hideShopEffect: function (item) {
            const effectEl = document.getElementById('shop-effect');
            if (effectEl) {
                effectEl.style.display = 'none';
            }
        }
    };
})();
