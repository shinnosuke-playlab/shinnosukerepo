// オセロゲームの実装
class OthelloGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white'; // white: プレイヤー, black: CPU
        this.playerColor = 'white';
        this.cpuColor = 'black';
        this.gameActive = true;
        this.difficulty = 'normal';
        this.consecutivePass = 0;

        this.initializeBoard();
        this.setupEventListeners();
        this.updateUI();
    }

    initializeBoard() {
        // 8x8のボードを初期化
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));

        // 初期配置
        this.board[3][3] = 'white';
        this.board[3][4] = 'black';
        this.board[4][3] = 'black';
        this.board[4][4] = 'white';

        this.currentPlayer = 'white';
        this.consecutivePass = 0;
    }

    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => {
            location.reload();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });

        // 難易度選択
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameActive) return;
                
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.difficulty;
            });
        });

        // ボードのセルクリック
        this.renderBoard();
    }

    renderBoard() {
        const boardDiv = document.getElementById('board');
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
                    pieceDiv.className = `piece ${piece}`;
                    cell.appendChild(pieceDiv);
                }

                // クリック可能な手を表示
                if (this.currentPlayer === 'white' && this.isValidMove(row, col, 'white')) {
                    cell.classList.add('valid-move');
                    cell.addEventListener('click', () => this.playerMove(row, col));
                } else {
                    cell.classList.add('disabled');
                }

                boardDiv.appendChild(cell);
            }
        }
    }

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

    getValidMoves(player) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(row, col, player)) {
                    moves.push([row, col]);
                }
            }
        }
        return moves;
    }

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

            // この方向に沿って相手の色のピースを探す
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.board[r][c] === opponent) {
                    toFlip.push([r, c]);
                } else if (this.board[r][c] === player) {
                    // 自分の色のピースに到達したら、その間のすべてのピースをひっくり返す
                    toFlip.forEach(([fr, fc]) => {
                        this.board[fr][fc] = player;
                    });
                    break; // この方向の処理は終了（return ではなく break）
                } else {
                    // 空いているマスに到達したらこの方向は有効な反転ではない
                    break;
                }
                r += dRow;
                c += dCol;
            }
        }
    }

    flipPiecesAnimated(row, col, player) {
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        const toFlipList = [];

        // すべての反転対象のピースを集める
        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;
            const toFlip = [];

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.board[r][c] === opponent) {
                    toFlip.push([r, c]);
                } else if (this.board[r][c] === player) {
                    toFlipList.push(...toFlip);
                    break;
                } else {
                    break;
                }
                r += dRow;
                c += dCol;
            }
        }

        // アニメーション付きでひっくり返す
        if (toFlipList.length === 0) {
            this.renderBoard();
            if (player === 'black') {
                this.continueAfterCPUMove();
            }
            return;
        }

        let index = 0;
        const flipInterval = setInterval(() => {
            if (index < toFlipList.length) {
                const [r, c] = toFlipList[index];
                this.board[r][c] = player;
                this.renderBoard();
                index++;
            } else {
                clearInterval(flipInterval);
                // CPUの手の場合は、アニメーション完了後に処理を継続
                if (player === 'black') {
                    this.continueAfterCPUMove();
                }
            }
        }, 100);
    }

    continueAfterCPUMove() {
        // プレイヤーが手を打てるか確認
        const playerMoves = this.getValidMoves('white');

        if (playerMoves.length === 0) {
            // プレイヤーが手を打てない場合
            const cpuMoves = this.getValidMoves('black');
            if (cpuMoves.length === 0) {
                // ゲーム終了
                this.endGame();
            } else {
                // CPUのターンが続く
                this.consecutivePass++;
                this.currentPlayer = 'black';
                this.updateUI();
                this.renderBoard();
                setTimeout(() => this.cpuMove(), 800);
            }
        } else {
            // プレイヤーのターン
            this.currentPlayer = 'white';
            this.consecutivePass = 0;
            this.updateUI();
            this.renderBoard();
        }
    }    playerMove(row, col) {
        if (this.currentPlayer !== 'white' || !this.gameActive) return;

        this.board[row][col] = 'white';
        this.flipPiecesAnimated(row, col, 'white');

        this.currentPlayer = 'black';
        this.consecutivePass = 0;
        this.updateUI();

        // CPUの手を少し遅延させる
        setTimeout(() => this.cpuMove(), 800);
    }

    cpuMove() {
        const validMoves = this.getValidMoves('black');

        if (validMoves.length === 0) {
            // CPUが手を打てない場合
            const playerMoves = this.getValidMoves('white');
            if (playerMoves.length === 0) {
                // ゲーム終了
                this.endGame();
            } else {
                // プレイヤーのターンに戻る
                this.consecutivePass++;
                this.currentPlayer = 'white';
                this.updateUI();
                this.renderBoard();
            }
            return;
        }

        // CPU戦略に基づいて手を選択
        const [row, col] = this.selectCPUMove(validMoves);

        this.board[row][col] = 'black';
        this.renderBoard();

        // ピース配置後、少し待ってからひっくり返し開始
        setTimeout(() => {
            this.flipPiecesAnimated(row, col, 'black');
        }, 600);
    }

    selectCPUMove(validMoves) {
        // 難易度に応じた戦略
        if (this.difficulty === 'easy') {
            return this.selectRandomMove(validMoves);
        } else if (this.difficulty === 'normal') {
            return this.selectNormalMove(validMoves);
        } else { // hard
            return this.selectHardMove(validMoves);
        }
    }

    selectRandomMove(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    selectNormalMove(moves) {
        // コーナーを優先、次に端を優先
        const corners = moves.filter(([r, c]) => 
            (r === 0 || r === 7) && (c === 0 || c === 7)
        );
        if (corners.length > 0) return this.selectRandomMove(corners);

        const edges = moves.filter(([r, c]) => 
            r === 0 || r === 7 || c === 0 || c === 7
        );
        if (edges.length > 0) return this.selectRandomMove(edges);

        // 返せる枚数が多い手を優先
        let bestMove = moves[0];
        let maxFlips = 0;

        for (const [r, c] of moves) {
            const flips = this.countFlips(r, c, 'white');
            if (flips > maxFlips) {
                maxFlips = flips;
                bestMove = [r, c];
            }
        }

        return bestMove;
    }

    selectHardMove(moves) {
        // 1. コーナーを優先
        const corners = moves.filter(([r, c]) => 
            (r === 0 || r === 7) && (c === 0 || c === 7)
        );
        if (corners.length > 0) return this.selectRandomMove(corners);

        // 2. 端を優先
        const edges = moves.filter(([r, c]) => 
            r === 0 || r === 7 || c === 0 || c === 7
        );
        if (edges.length > 0) {
            // 端の中でも返せる枚数が多い手を選ぶ
            let bestMove = edges[0];
            let maxFlips = 0;

            for (const [r, c] of edges) {
                const flips = this.countFlips(r, c, 'white');
                if (flips > maxFlips) {
                    maxFlips = flips;
                    bestMove = [r, c];
                }
            }
            return bestMove;
        }

        // 3. 返せる枚数が多い手を選ぶ
        let bestMove = moves[0];
        let maxFlips = 0;

        for (const [r, c] of moves) {
            const flips = this.countFlips(r, c, 'white');
            if (flips > maxFlips) {
                maxFlips = flips;
                bestMove = [r, c];
            }
        }

        return bestMove;
    }

    countFlips(row, col, player) {
        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        let totalFlips = 0;

        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;
            let count = 0;

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.board[r][c] === opponent) {
                    count++;
                } else if (this.board[r][c] === player) {
                    totalFlips += count;
                    break;
                } else {
                    break;
                }
                r += dRow;
                c += dCol;
            }
        }

        return totalFlips;
    }

    showHint() {
        const validMoves = this.getValidMoves('black');
        if (validMoves.length > 0) {
            const [row, col] = validMoves[0];
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.style.boxShadow = 'inset 0 0 15px #ff6600';
            setTimeout(() => {
                cell.style.boxShadow = '';
            }, 2000);
        }
    }

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

    updateUI() {
        const score = this.getScore();
        document.getElementById('playerScore').textContent = score.white;
        document.getElementById('cpuScore').textContent = score.black;

        const turnDiv = document.getElementById('turn');
        const statusDiv = document.getElementById('status');

        if (this.currentPlayer === 'white') {
            turnDiv.textContent = 'あなたのターンです';
            turnDiv.className = 'turn player';
            
            const validMoves = this.getValidMoves('white');
            if (validMoves.length === 0) {
                statusDiv.textContent = '手を打つ場所がありません。CPUがターンをスキップします。';
                statusDiv.className = 'status warning';
            } else {
                statusDiv.textContent = `有効な手: ${validMoves.length}手`;
                statusDiv.className = 'status message';
            }
        } else {
            turnDiv.textContent = 'CPU（黒）のターン中...';
            turnDiv.className = 'turn cpu';
            statusDiv.textContent = 'CPUが考え中...';
            statusDiv.className = 'status message';
        }

        // 難易度ボタンを無効化
        if (this.currentPlayer === 'black') {
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.6';
            });
        }
    }

    endGame() {
        this.gameActive = false;
        const score = this.getScore();

        document.getElementById('finalPlayerScore').textContent = score.white;
        document.getElementById('finalCpuScore').textContent = score.black;

        let result = '';
        if (score.white > score.black) {
            result = `🎉 あなたの勝利です！`;
        } else if (score.black > score.white) {
            result = `😔 CPUの勝利です。`;
        } else {
            result = `🤝 同点です。`;
        }

        document.getElementById('winner').textContent = result;

        const modal = document.getElementById('gameOverModal');
        modal.classList.add('active');

        document.getElementById('turn').textContent = 'ゲーム終了';
        document.getElementById('status').textContent = result;
        document.getElementById('status').className = 'status success';
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new OthelloGame();
});
