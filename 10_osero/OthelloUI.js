// OthelloUI.js
// UI を担当するクラス。1 ファイル 1 クラスで管理するために分離しました。
// 依存: グローバルに定義された `OthelloGame` と `soundManager` を利用します。

class OthelloUI {
    /**
     * OthelloUI のインスタンスを生成します。
     * @param {OthelloGame} game - この UI が参照・操作するゲームロジックのインスタンス。
     * 副作用: DOM イベントリスナを設定し、初回の盤面描画を実行します。
     */
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
        this.renderBoard();
    }

    /**
     * UI レベルの DOM イベントリスナを登録します。
     * 現状では「新しいゲーム」ボタンをページリロードに結びつけるのみです。
     * 戻り値はありません。複数回呼んでも安全です（リスナは加算されます）。
     */
    setupEventListeners() {
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) newGameBtn.addEventListener('click', () => location.reload());
        // 初回描画はコンストラクタで行っている
    }

    /**
     * 現在のゲーム状態から盤面の DOM を描画します。
     * @param {Object} animatingCells - "row,col" をキーにして当該セルに付与する CSS クラスを指定します（例: 'placing' / 'flipping'）。
     * 副作用: `#board` 配下の DOM を更新します。合法手にはクリックリスナを追加します。
     */
    renderBoard(animatingCells = {}) {
        const boardDiv = document.getElementById('board');
        if (!boardDiv) return;
        boardDiv.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const piece = this.game.board[row][col];
                if (piece) {
                    const pieceDiv = document.createElement('div');
                    pieceDiv.className = `piece ${piece}`;
                    const key = `${row},${col}`;
                    if (animatingCells && animatingCells[key]) {
                        pieceDiv.classList.add(animatingCells[key]);
                    }
                    cell.appendChild(pieceDiv);
                }

                // プレイヤーの手番かつ合法手のみクリックを許可します。
                if (this.game.currentPlayer === 'white' && this.game.isValidMove(row, col, 'white')) {
                    cell.classList.add('valid-move');
                    cell.addEventListener('click', () => this.playerMove(row, col));
                } else {
                    cell.classList.add('disabled');
                }

                boardDiv.appendChild(cell);
            }
        }
    }

    /**
     * 駒を裏返すアニメーションを行います（主に CPU の手で使用）。
     * 裏返す対象を収集し、1 枚ずつ盤面を更新して描画します。
     * @param {number} row - 置かれた駒の行
     * @param {number} col - 置かれた駒の列
     * @param {'black'|'white'} player - 駒を置いたプレイヤー
     * 副作用: `this.game.board` を更新し再描画・効果音を再生します。完了後、CPU の流れであれば `continueAfterCPUMove()` を呼ぶことがあります。
     */
    flipPiecesAnimated(row, col, player) {
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        const toFlipList = [];

        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;
            const toFlip = [];
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.game.board[r][c] === opponent) toFlip.push([r, c]);
                else if (this.game.board[r][c] === player) { toFlipList.push(...toFlip); break; }
                else break;
                r += dRow; c += dCol;
            }
        }

        // 反転対象がない場合は描画だけ行い、CPU の手なら次の処理へ進めます。
        if (toFlipList.length === 0) {
            this.renderBoard();
            if (player === 'black') this.continueAfterCPUMove();
            return;
        }

        let index = 0;
        const flipInterval = setInterval(() => {
            if (index < toFlipList.length) {
                const [r, c] = toFlipList[index];
                // ゲーム状態に反映して該当セルの 'flipping' アニメを再描画、効果音を鳴らす。
                this.game.board[r][c] = player;
                const animatingCells = {};
                animatingCells[`${r},${c}`] = 'flipping';
                this.renderBoard(animatingCells);
                soundManager.playFlipSound();
                index++;
            } else {
                // すべての反転が終わったらタイマーをクリアして最終描画、必要なら CPU 続行処理へ。
                clearInterval(flipInterval);
                this.renderBoard();
                if (player === 'black') this.continueAfterCPUMove();
            }
        }, OthelloGame.TIMING.FLIP_ANIMATION_INTERVAL);
    }

    /**
     * プレイヤーの着手処理（設置アニメ → 順次反転）を行います。
     * 駒を視覚的に置き、設置音を鳴らした後、捕獲した駒を順次反転し、最後に CPU へ制御を移します。
     * @param {number} row
     * @param {number} col
     * @param {'black'|'white'} player
     */
    flipPiecesAnimatedForPlayer(row, col, player) {
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        const toFlipList = [];

        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;
            const toFlip = [];
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.game.board[r][c] === opponent) toFlip.push([r, c]);
                else if (this.game.board[r][c] === player) { toFlipList.push(...toFlip); break; }
                else break;
                r += dRow; c += dCol;
            }
        }

        // 反転対象がない場合は置くだけのアニメを見せて CPU に移行します。
        if (toFlipList.length === 0) {
            this.game.board[row][col] = player;
            const animatingCells = {};
            animatingCells[`${row},${col}`] = 'placing';
            this.renderBoard(animatingCells);
            soundManager.playPlaceSound();
            setTimeout(() => {
                this.game.currentPlayer = 'black';
                this.game.consecutivePass = 0;
                this.updateUI();
                this.renderBoard();
                setTimeout(() => this.cpuMove(), OthelloGame.TIMING.CPU_THINK_DELAY);
            }, 300);
            return;
        }

        this.game.board[row][col] = player;
        const animatingCells = {};
        animatingCells[`${row},${col}`] = 'placing';
        this.renderBoard(animatingCells);
        soundManager.playPlaceSound();

        // まず駒を置いて視覚フィードバックを行い、その後対象を順次反転します。
        let index = 0;
        const flipInterval = setInterval(() => {
            if (index < toFlipList.length) {
                const [r, c] = toFlipList[index];
                this.game.board[r][c] = player;
                const animatingCells = {};
                animatingCells[`${r},${c}`] = 'flipping';
                this.renderBoard(animatingCells);
                soundManager.playFlipSound();
                index++;
            } else {
                // 反転がすべて終わったら CPU のターンに切り替え、UI を更新して CPU の思考へ移します。
                clearInterval(flipInterval);
                this.game.currentPlayer = 'black';
                this.game.consecutivePass = 0;
                this.updateUI();
                this.renderBoard();
                setTimeout(() => this.cpuMove(), OthelloGame.TIMING.CPU_THINK_DELAY);
            }
        }, OthelloGame.TIMING.FLIP_ANIMATION_INTERVAL);
    }

    /**
     * CPU の反転アニメ終了後に次の手の流れを決めます。
     * - プレイヤーに合法手がなければ: ゲーム終了か CPU の継続（パス処理）。
     * - そうでなければプレイヤーに制御を戻します。
     */
    continueAfterCPUMove() {
        const playerMoves = this.game.getValidMoves('white');

        if (playerMoves.length === 0) {
            const cpuMoves = this.game.getValidMoves('black');
            if (cpuMoves.length === 0) {
                this.game.endGame();
            } else {
                this.game.consecutivePass++;
                this.game.currentPlayer = 'black';
                this.updateUI();
                this.renderBoard();
                setTimeout(() => this.cpuMove(), OthelloGame.TIMING.CPU_THINK_DELAY);
            }
        } else {
            this.game.currentPlayer = 'white';
            this.game.consecutivePass = 0;
            this.updateUI();
            this.renderBoard();
        }
    }

    /**
     * ユーザーのクリックによる着手を処理します。
     * プレイヤーの手番かつゲームが有効であることを確認し、盤面を更新、
     * 設置音を鳴らして `flipPiecesAnimatedForPlayer` に処理を委譲します。
     */
    playerMove(row, col) {
        if (this.game.currentPlayer !== 'white' || !this.game.gameActive) return;

        this.game.board[row][col] = 'white';
        soundManager.playPlaceSound();
        this.flipPiecesAnimatedForPlayer(row, col, 'white');
    }

    /**
     * CPU による手を選び実行します。
     * - CPU に合法手がない場合はパス／終了処理を行います。
     * - ある場合は駒を置いてから反転アニメを開始します。
     */
    cpuMove() {
        const validMoves = this.game.getValidMoves('black');
        if (validMoves.length === 0) {
            const playerMoves = this.game.getValidMoves('white');
            if (playerMoves.length === 0) { this.game.endGame(); return; }
            this.game.consecutivePass++;
            this.game.currentPlayer = 'white';
            this.updateUI();
            this.renderBoard();
            return;
        }

        const [row, col] = this.game.selectCPUMove(validMoves);
        this.game.board[row][col] = 'black';
        const animatingCells = {};
        animatingCells[`${row},${col}`] = 'placing';
        this.renderBoard(animatingCells);

        // プレイヤーが CPU の置いた位置を認識できるよう少し待ってから反転アニメを開始します。
        setTimeout(() => {
            soundManager.playPlaceSound();
            this.flipPiecesAnimated(row, col, 'black');
        }, OthelloGame.TIMING.CPU_FLIP_DELAY);
    }

    /**
     * スコアなどの最小限の UI 要素を更新します。
     * ゲームからスコアを取得して DOM に書き込みます。
     */
    updateUI() {
        const score = this.game.getScore();
        const playerScore = document.getElementById('playerScore');
        const cpuScore = document.getElementById('cpuScore');
        if (playerScore) playerScore.textContent = score.white;
        if (cpuScore) cpuScore.textContent = score.black;
    }
}

// 自動起動: DOMContentLoaded 時に OthelloGame と OthelloUI を生成する
document.addEventListener('DOMContentLoaded', () => {
    window.othelloGame = new OthelloGame();
    window.othelloUI = new OthelloUI(window.othelloGame);
});
