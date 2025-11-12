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
        // mp3 ファイルを使って音を再生（ファイル名はプロジェクトルート相対）
        this.placeSound = new Audio('puton.mp3');
        this.flipSound = new Audio('flip.mp3');
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


// -----------------------------------------------------------------------------
// setupEventListeners
// - 最低限の DOM イベントをセットアップする（新規ゲームボタン等）。
// - 初回描画を行う（renderBoard 呼び出し）。
// -----------------------------------------------------------------------------
OthelloGame.prototype.setupEventListeners = function() {
    // 新規ゲームは簡易にリロード
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) newGameBtn.addEventListener('click', () => location.reload());

    // 初回描画
    this.renderBoard();
};


// -----------------------------------------------------------------------------
// renderBoard(animatingCells)
// - board DOM を再生成する軽量実装。
// - animatingCells: { "r,c": "className" } の形で渡すと、そのセルの piece に
//   指定クラス（'placing' / 'flipping' 等）を付与して CSS アニメーションを発火させる。
// - 注意: 描画中に this.currentPlayer を参照してクリック可能なセルを判定しているため、
//   CPU 側のアニメーションで描画を行う際にプレイヤーの有効手表示が出ないように
//   currentPlayer を適切に設定してから renderBoard を呼ぶ設計にしている。
// -----------------------------------------------------------------------------
OthelloGame.prototype.renderBoard = function(animatingCells = {}) {
    const boardDiv = document.getElementById('board');
    if (!boardDiv) return; // テスト環境や非 DOM 環境に配慮
    boardDiv.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            const piece = this.board[row][col];
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = `piece ${piece}`; // 例: 'piece white' or 'piece black'

                // アニメーション情報があれば追加クラスを付与（CSS 側で定義された animation が走る）
                const key = `${row},${col}`;
                if (animatingCells && animatingCells[key]) {
                    pieceDiv.classList.add(animatingCells[key]);
                }

                cell.appendChild(pieceDiv);
            }

            // プレイヤー（white）の手番のみ、合法手にクリックリスナを付与する。
            // （CPU のターンに合法手を表示しないため）
            if (this.currentPlayer === 'white' && this.isValidMove(row, col, 'white')) {
                cell.classList.add('valid-move');
                cell.addEventListener('click', () => this.playerMove(row, col));
            } else {
                cell.classList.add('disabled');
            }

            boardDiv.appendChild(cell);
        }
    }
};


// -----------------------------------------------------------------------------
// flipPiecesAnimated(row, col, player)
// - 裏返すべき石を収集し、1 枚ずつ順に盤面を更新してアニメーションを見せる。
// - ここでは描画ごとに animatingCells を渡して部分的なアニメーションを発火させる。
// - player === 'black'（CPU）で呼ばれた場合は最後に continueAfterCPUMove を呼び次の処理へ繋げる。
// 注意:
// - この関数は盤面状態（this.board）を直接書き換える。UI の描画は renderBoard に委譲。
// -----------------------------------------------------------------------------
OthelloGame.prototype.flipPiecesAnimated = function(row, col, player) {
    const opponent = player === 'black' ? 'white' : 'black';
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    const toFlipList = [];

    // すべての反転対象を収集（flipPieces と同じ判定）
    for (const [dRow, dCol] of directions) {
        let r = row + dRow;
        let c = col + dCol;
        const toFlip = [];
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (this.board[r][c] === opponent) toFlip.push([r, c]);
            else if (this.board[r][c] === player) { toFlipList.push(...toFlip); break; }
            else break;
            r += dRow; c += dCol;
        }
    }

    // 反転対象がない場合は描画だけして次へ（CPU の場合は続行処理）
    if (toFlipList.length === 0) {
        this.renderBoard();
        if (player === 'black') this.continueAfterCPUMove();
        return;
    }

    // 順次反転（視認性のため 100ms ごとに 1 枚ずつ更新）
    let index = 0;
    const flipInterval = setInterval(() => {
        if (index < toFlipList.length) {
            const [r, c] = toFlipList[index];
            this.board[r][c] = player;
            // 当該セルだけに 'flipping' クラスを付与してアニメーションさせる
            const animatingCells = {};
            animatingCells[`${r},${c}`] = 'flipping';
            this.renderBoard(animatingCells);
            soundManager.playFlipSound(); // 1 枚めくるごとに音
            index++;
        } else {
            clearInterval(flipInterval);
            // 最終的な盤面を描画して次の処理へ
            this.renderBoard();
            if (player === 'black') this.continueAfterCPUMove();
        }
    }, 100);
};


// -----------------------------------------------------------------------------
// flipPiecesAnimatedForPlayer(row, col, player)
// - プレイヤーの着手に特化したアニメーション処理。
// - 駒を置く時に 'placing' アニメを表示し、続いて順次 'flipping' で反転を見せる。
// - 最後に CPU のターンへ移す（currentPlayer を 'black' にして continue / cpuMove を呼ぶ）。
// -----------------------------------------------------------------------------
OthelloGame.prototype.flipPiecesAnimatedForPlayer = function(row, col, player) {
    const opponent = player === 'black' ? 'white' : 'black';
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    const toFlipList = [];

    // すべての反転対象を収集
    for (const [dRow, dCol] of directions) {
        let r = row + dRow;
        let c = col + dCol;
        const toFlip = [];
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (this.board[r][c] === opponent) toFlip.push([r, c]);
            else if (this.board[r][c] === player) { toFlipList.push(...toFlip); break; }
            else break;
            r += dRow; c += dCol;
        }
    }

    // 反転対象がなければ設置アニメだけ表示して CPU へ
    if (toFlipList.length === 0) {
        this.board[row][col] = player;
        const animatingCells = {};
        animatingCells[`${row},${col}`] = 'placing';
        this.renderBoard(animatingCells);
        soundManager.playPlaceSound();
        // placing のアニメーション時間に合わせて遅延して CPU へ
        setTimeout(() => {
            this.currentPlayer = 'black';
            this.consecutivePass = 0;
            this.updateUI();
            this.renderBoard();
            setTimeout(() => this.cpuMove(), 800);
        }, 300); // CSS 側の placing アニメ時間に合わせる
        return;
    }

    // 駒を置いて設置アニメーションを表示（視覚的効果）
    this.board[row][col] = player;
    const animatingCells = {};
    animatingCells[`${row},${col}`] = 'placing';
    this.renderBoard(animatingCells);
    soundManager.playPlaceSound();

    // 順次反転表示（1 枚ずつ）
    let index = 0;
    const flipInterval = setInterval(() => {
        if (index < toFlipList.length) {
            const [r, c] = toFlipList[index];
            this.board[r][c] = player;
            const animatingCells = {};
            animatingCells[`${r},${c}`] = 'flipping';
            this.renderBoard(animatingCells);
            soundManager.playFlipSound();
            index++;
        } else {
            clearInterval(flipInterval);
            // プレイヤーの反転が終わったら CPU ターンへ移行
            this.currentPlayer = 'black';
            this.consecutivePass = 0;
            this.updateUI();
            this.renderBoard();
            setTimeout(() => this.cpuMove(), 800);
        }
    }, 100);
};


// -----------------------------------------------------------------------------
// continueAfterCPUMove
// - CPU の反転アニメが終わった後に呼ばれ、次のプレイヤー（white）の合法手を確認して
//   次の行動（パス or 次の CPU ターン or プレイヤーターン）に移す。
// -----------------------------------------------------------------------------
OthelloGame.prototype.continueAfterCPUMove = function() {
    const playerMoves = this.getValidMoves('white');

    if (playerMoves.length === 0) {
        const cpuMoves = this.getValidMoves('black');
        if (cpuMoves.length === 0) {
            this.endGame();
        } else {
            // プレイヤーがパスした場合は CPU のまま続行
            this.consecutivePass++;
            this.currentPlayer = 'black';
            this.updateUI();
            this.renderBoard();
            setTimeout(() => this.cpuMove(), 800);
        }
    } else {
        // 通常の手番交代（白プレイヤーへ）
        this.currentPlayer = 'white';
        this.consecutivePass = 0;
        this.updateUI();
        this.renderBoard();
    }
};


// -----------------------------------------------------------------------------
// playerMove / cpuMove
// - playerMove: ユーザーがクリックしたときに呼ばれる。盤面に石を置き、
//   プレイヤー用のアニメーション関数へ委譲する。
// - cpuMove: AI により選ばれた手を盤面に置き、placing アニメ後に flipPiecesAnimated を呼ぶ。
// -----------------------------------------------------------------------------
OthelloGame.prototype.playerMove = function(row, col) {
    if (this.currentPlayer !== 'white' || !this.gameActive) return;

    this.board[row][col] = 'white';
    soundManager.playPlaceSound(); // 置いた音を先に鳴らす
    this.flipPiecesAnimatedForPlayer(row, col, 'white');
};

OthelloGame.prototype.cpuMove = function() {
    const validMoves = this.getValidMoves('black');
    if (validMoves.length === 0) {
        const playerMoves = this.getValidMoves('white');
        if (playerMoves.length === 0) { this.endGame(); return; }
        // CPU パス: プレイヤーへ
        this.consecutivePass++;
        this.currentPlayer = 'white';
        this.updateUI();
        this.renderBoard();
        return;
    }

    const [row, col] = this.selectCPUMove(validMoves);
    this.board[row][col] = 'black';
    
    // CPU も設置アニメーションを表示して位置を知らせる
    const animatingCells = {};
    animatingCells[`${row},${col}`] = 'placing';
    this.renderBoard(animatingCells);

    // 少し間を置いてから反転アニメを開始（ユーザーが置いた位置が視認できるように）
    setTimeout(() => {
        soundManager.playPlaceSound();
        this.flipPiecesAnimated(row, col, 'black');
    }, 600);
};


// -----------------------------------------------------------------------------
// updateUI
// - スコア等の簡易 UI を更新するヘルパー
// -----------------------------------------------------------------------------
OthelloGame.prototype.updateUI = function() {
    const score = this.getScore();
    const playerScore = document.getElementById('playerScore');
    const cpuScore = document.getElementById('cpuScore');
    if (playerScore) playerScore.textContent = score.white;
    if (cpuScore) cpuScore.textContent = score.black;
};


// DOM 準備が整ったらゲームを開始
document.addEventListener('DOMContentLoaded', () => {
    window.othelloGame = new OthelloGame();
});
