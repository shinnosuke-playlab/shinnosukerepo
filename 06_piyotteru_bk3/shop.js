// shop.js
// ショップ UI を動的に生成して game.shopItems() と同期します
(function () {
    window.Shop = {
        init: function (game) {
            this.game = game;
            this.container = document.getElementById('shop-panel');
            if (!this.container) return;
            this.render();

            // 定期的にボタンの有効/無効を更新（肉の数に応じて）
            this._interval = setInterval(() => this.refresh(), 500);
        },

        render: function () {
            const items = this.game.shopItems();
            // clear
            this.container.innerHTML = '';

            const title = document.createElement('h3');
            title.textContent = 'ショップ';
            this.container.appendChild(title);

            const list = document.createElement('div');
            list.className = 'shop-list';

            Object.keys(items).forEach(key => {
                const it = items[key];
                const row = document.createElement('div');
                row.className = 'shop-item';

                const btn = document.createElement('button');
                btn.textContent = `${it.name} (肉 ${it.cost})`;
                btn.setAttribute('data-item', it.id);
                btn.id = `buy-${it.id}`;
                btn.addEventListener('click', () => {
                    if (this.game && typeof this.game.buyItem === 'function') this.game.buyItem(it.id);
                });

                row.appendChild(btn);
                list.appendChild(row);
            });

            this.container.appendChild(list);

            // メッセージ領域
            const msg = document.createElement('div');
            msg.id = 'shop-message';
            msg.className = 'shop-message';
            msg.style.opacity = 0;
            msg.style.transition = 'opacity .3s';
            this.container.appendChild(msg);

            // 効果表示領域
            const eff = document.createElement('div');
            eff.id = 'shop-effect';
            eff.className = 'shop-effect';
            eff.style.display = 'none';
            eff.style.marginTop = '8px';
            eff.style.fontWeight = 'bold';
            eff.style.color = '#800';
            this.container.appendChild(eff);

            // 初回 refresh
            this.refresh();
        },

        refresh: function () {
            const items = this.game.shopItems();
            Object.keys(items).forEach(key => {
                const it = items[key];
                const btn = document.getElementById(`buy-${it.id}`);
                if (!btn) return;
                // 肉が足りなければ無効化
                const have = this.game.meatCollected || 0;
                btn.disabled = have < it.cost;
                // 発動中であればボタンに active クラスを付与（game に _<id>Active フラグがある想定）
                try {
                    const activeFlag = this.game[`_${it.id}Active`];
                    if (activeFlag) btn.classList.add('active'); else btn.classList.remove('active');
                } catch (e) {}
            });
            // shop-message と shop-effect は UI モジュールと共通の id を使う
            // nothing else
        }
    };
})();
