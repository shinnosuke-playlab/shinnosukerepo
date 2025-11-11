// othello.js
// コアのゲーム状態と基本ロジック（ボード、合法手判定、反転、スコア、終了判定）
class OthelloGame {
    constructor() {
        // ゲーム状態
        this.board = [];
        this.currentPlayer = 'white'; // プレイヤー: white, CPU: black
        this.playerColor = 'white';
        this.cpuColor = 'black';
        this.gameActive = true;
        this.difficulty = 'normal';
        this.consecutivePass = 0;

        // 初期化
        this.initializeBoard();

        // setupEventListeners / updateUI / renderBoard は ui.js で prototype に追加される
        if (typeof this.setupEventListeners === 'function') this.setupEventListeners();
        if (typeof this.updateUI === 'function') this.updateUI();
    }

    // 8x8 ボードの初期配置
    initializeBoard() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.board[3][3] = 'white';
        this.board[3][4] = 'black';
        this.board[4][3] = 'black';
        this.board[4][4] = 'white';
        this.currentPlayer = 'white';
        this.consecutivePass = 0;
    }

    // 指定マスがプレイヤーにとって有効手か判定する
    isValidMove(row, col, player) {
        if (this.board[row][col] !== null) return false;

        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;
            let foundOpponent = false;

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.board[r][c] === opponent) {
                    foundOpponent = true;
                } else if (this.board[r][c] === player && foundOpponent) {
                    return true;
                } else {
                    break;
                }
                r += dRow;
                c += dCol;
            }
        }

        return false;
    }

    // あるプレイヤーの合法手一覧を返す
    getValidMoves(player) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(row, col, player)) moves.push([row, col]);
            }
        }
        return moves;
    }

    // 指定した場所に石を置いたときに反転処理（即時更新）
    flipPieces(row, col, player) {
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;
            const toFlip = [];

            // この方向に沿って相手の色のピースを収集
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.board[r][c] === opponent) {
                    toFlip.push([r, c]);
                } else if (this.board[r][c] === player) {
                    // 自分の色に到達したら収集した分を反転
                    toFlip.forEach(([fr, fc]) => this.board[fr][fc] = player);
                    break;
                } else {
                    break;
                }
                r += dRow;
                c += dCol;
            }
        }
    }

    // スコアを計算して返す
    getScore() {
        let blackCount = 0;
        let whiteCount = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === 'black') blackCount++;
                else if (this.board[row][col] === 'white') whiteCount++;
            }
        }
        return { black: blackCount, white: whiteCount };
    }

    // ゲーム終了処理（UI は ui.js のメソッドを利用）
    endGame() {
        this.gameActive = false;
        const score = this.getScore();

        if (typeof document !== 'undefined') {
            document.getElementById('finalPlayerScore').textContent = score.white;
            document.getElementById('finalCpuScore').textContent = score.black;

            let result = '';
            if (score.white > score.black) result = `🎉 あなたの勝利です！`;
            else if (score.black > score.white) result = `😔 CPUの勝利です。`;
            else result = `🤝 同点です。`;

            document.getElementById('winner').textContent = result;
            const modal = document.getElementById('gameOverModal');
            modal.classList.add('active');

            document.getElementById('turn').textContent = 'ゲーム終了';
            document.getElementById('status').textContent = result;
            document.getElementById('status').className = 'status success';
        }
    }
}
