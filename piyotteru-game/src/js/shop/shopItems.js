const shopItems = [
    {
        id: 1,
        name: "オオカミ",
        description: "一定時間後に無作為にニワトリを食い殺す。",
        price: 100,
        effect: function(game) {
            // オオカミを放つ処理
            game.releaseWolf();
        }
    },
    {
        id: 2,
        name: "スピードアップ",
        description: "一定時間、ゲームの進行速度を上げる。",
        price: 150,
        effect: function(game) {
            // スピードアップの処理
            game.increaseSpeed();
        }
    },
    {
        id: 3,
        name: "HP回復",
        description: "マイキーのHPを回復する。",
        price: 200,
        effect: function(game) {
            // HP回復の処理
            game.restoreHP();
        }
    },
    {
        id: 4,
        name: "肉の倍増",
        description: "肉を取得した際の数を倍にする。",
        price: 250,
        effect: function(game) {
            // 肉の倍増の処理
            game.doubleMeat();
        }
    }
];

export default shopItems;