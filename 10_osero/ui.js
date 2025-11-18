// ui.js
// UI 層: DOM の描画、イベントハンドラ、アニメーション、音再生を担当します。
// コアロジック（合法手判定／反転等）は othello.js にあり、AI は ai.js にあります。
// ui.js はそれらを利用して視覚的な演出（placing / flipping）や音を追加します。

// -----------------------------------------------------------------------------
// SoundManager
// - HTML5 Audio を使ってローカルの mp3 を再生する単純ラッパー。
// - 再生失敗時の例外を無視することでブラウザ差異（オートプレイ制限等）に耐性を持たせる。
// -----------------------------------------------------------------------------
class SoundManager {
    constructor() {
        // mp3 ファイルを使って音を再生（プロジェクト内の `sound/` フォルダを参照）
        this.placeSound = new Audio('sound/puton.mp3');
        this.flipSound = new Audio('sound/flip.mp3');
    }

    // 駒を置いたときの音
    playPlaceSound() {
        this.placeSound.currentTime = 0;
        this.placeSound.play().catch(() => {});
    }

    // ひっくり返るときの音（1 枚ごとに再生）
    playFlipSound() {
        this.flipSound.currentTime = 0;
        this.flipSound.play().catch(() => {});
    }
}

// シングルトン的に利用
const soundManager = new SoundManager();

