// ui.js
// UI とイベント、レンダリング、アニメーションを OthelloGame の prototype に追加

/**
 * イベントリスナーの初期化
 */
OthelloGame.prototype.setupEventListeners = function() {
    document.getElementById('newGameBtn').addEventListener('click', () => location.reload());
    document.getElementById('hintBtn').addEventListener('click', () => this.showHint());

    // 難易度ボタン
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!this.gameActive) return;
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.difficulty = e.target.dataset.difficulty;
        });
    });

    // 初回描画
    this.renderBoard();
};

/**
 * ボード描画（DOM を直接更新）
 * - この関数はゲーム状態（this.board）から DOM を再構築します。
 */
OthelloGame.prototype.renderBoard = function() {
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

            // プレイヤー（白）のターンであればクリック可能な手にイベントを付与
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

/**
 * ひっくり返しアニメーション（1枚ずつ順に反転）
 * 完了後に CPU の継続処理を呼ぶ場合がある
 */
OthelloGame.prototype.flipPiecesAnimated = function(row, col, player) {
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

    // 反転対象がなければ描画のみ
    if (toFlipList.length === 0) {
        this.renderBoard();
        if (player === 'black') this.continueAfterCPUMove();
        return;
    }

    // 順次反転（見やすくするため 100ms ごと）
    let index = 0;
    const flipInterval = setInterval(() => {
        if (index < toFlipList.length) {
            const [r, c] = toFlipList[index];
            this.board[r][c] = player;
            this.renderBoard();
            index++;
        } else {
            clearInterval(flipInterval);
            if (player === 'black') this.continueAfterCPUMove();
        }
    }, 100);
};

/**
 * CPU の手の後に続けて呼ばれる処理（アニメ完了後）
 */
OthelloGame.prototype.continueAfterCPUMove = function() {
    const playerMoves = this.getValidMoves('white');

    if (playerMoves.length === 0) {
        const cpuMoves = this.getValidMoves('black');
        if (cpuMoves.length === 0) {
            this.endGame();
        } else {
            this.consecutivePass++;
            this.currentPlayer = 'black';
            this.updateUI();
            this.renderBoard();
            setTimeout(() => this.cpuMove(), 800);
        }
    } else {
        this.currentPlayer = 'white';
        this.consecutivePass = 0;
        this.updateUI();
        this.renderBoard();
    }
};

/**
 * プレイヤーの手（白）
 */
OthelloGame.prototype.playerMove = function(row, col) {
    if (this.currentPlayer !== 'white' || !this.gameActive) return;

    this.board[row][col] = 'white';
    this.flipPiecesAnimated(row, col, 'white');

    this.currentPlayer = 'black';
    this.consecutivePass = 0;
    this.updateUI();

    // CPU を呼ぶのはアニメーション完了後（continueAfterCPUMove で処理される）
};

/**
 * CPU（黒）のターン
 */
OthelloGame.prototype.cpuMove = function() {
    const validMoves = this.getValidMoves('black');
    if (validMoves.length === 0) {
        const playerMoves = this.getValidMoves('white');
        if (playerMoves.length === 0) { this.endGame(); return; }
        this.consecutivePass++;
        this.currentPlayer = 'white';
        this.updateUI();
        this.renderBoard();
        return;
    }

    const [row, col] = this.selectCPUMove(validMoves);
    this.board[row][col] = 'black';
    this.renderBoard();

    // CPU が置いた位置が分かるようちょっと待ってから反転アニメーションを始める
    setTimeout(() => this.flipPiecesAnimated(row, col, 'black'), 600);
};

/**
 * ヒント表示（最初の有効手を強調）
 */
OthelloGame.prototype.showHint = function() {
    const validMoves = this.getValidMoves('white');
    if (validMoves.length === 0) return;
    const [row, col] = validMoves[0];
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    const prev = cell.style.boxShadow;
    cell.style.boxShadow = 'inset 0 0 15px #ff6600';
    setTimeout(() => cell.style.boxShadow = prev, 2000);
};

/**
 * UI の状態更新（スコア、ターン表示、難易度ボタン無効化など）
 */
OthelloGame.prototype.updateUI = function() {
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

    // 難易度ボタンを CPU のターン中は無効化
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        if (this.currentPlayer === 'black') {
            btn.style.pointerEvents = 'none'; btn.style.opacity = '0.6';
        } else { btn.style.pointerEvents = ''; btn.style.opacity = ''; }
    });
};

// DOM 準備が整ったらゲームを開始
document.addEventListener('DOMContentLoaded', () => {
    window.othelloGame = new OthelloGame();
});
