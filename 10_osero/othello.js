// othello.js
// コアのゲーム状態と基本ロジック
// このファイルは「純粋にゲームルール（状態遷移・判定・反転・スコア）」のみを扱います。
// UI（描画・イベント）や AI の選択ロジックは別ファイル（ui.js / ai.js）で実装され、
// 必要に応じて prototype を介して補助的なメソッドが追加されます。

class OthelloGame {
    constructor() {
        // board: 8x8 の 2 次元配列。各セルは 'black' | 'white' | null のいずれか。
        // currentPlayer: 現在の手番（'white'=プレイヤー, 'black'=CPU）
        this.board = [];
        this.currentPlayer = 'white'; // 初期は白（プレイヤー）
        this.playerColor = 'white';
        this.cpuColor = 'black';
        this.gameActive = true;
        this.consecutivePass = 0; // 連続パスのカウント（2 連続でパスならゲーム終了）

        // 初期盤面をセット
        this.initializeBoard();

        // 注意: UI 側で setupEventListeners/updateUI/renderBoard 等を prototype に追加する設計。
        // ここでは存在する場合に呼び出す程度にとどめる（結合度を低くするため）。
        if (typeof this.setupEventListeners === 'function') this.setupEventListeners();
        if (typeof this.updateUI === 'function') this.updateUI();
    }

    // 8x8 の初期配置（中央に 4 つの石）
    initializeBoard() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.board[3][3] = 'white';
        this.board[3][4] = 'black';
        this.board[4][3] = 'black';
        this.board[4][4] = 'white';
        this.currentPlayer = 'white';
        this.consecutivePass = 0;
    }

    /**
     * isValidMove(row, col, player)
     * 指定のセル (row, col) が player にとって合法手か判定する。
     * 基本アルゴリズム（オセロの基本）:
     *  - 8 方向を走査し、まず相手色が 1 個以上続き、その後に自分の色が来れば合法。
     *  - 最初にセルが空でない場合は即座に false を返す。
     * 注意点:
     *  - 走査は盤外チェック（0..7）を行いながら進める。
     *  - 相手色が一つも無ければその方向は不成立。
     */
    isValidMove(row, col, player) {
        if (this.board[row][col] !== null) return false; // 既に石があるなら不可

        const opponent = player === 'black' ? 'white' : 'black';
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        // 8方向それぞれをチェック
        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;
            let foundOpponent = false; // 相手色が最低1つ続く必要がある

            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.board[r][c] === opponent) {
                    // 相手の石が続いている状態
                    foundOpponent = true;
                } else if (this.board[r][c] === player && foundOpponent) {
                    // 相手石が続いた後に自分の石に到達した => この方向で裏返せる
                    return true;
                } else {
                    // 空か自分の石のみ（相手が続いていない等） => この方向は不成立
                    break;
                }
                r += dRow;
                c += dCol;
            }
        }

        return false; // どの方向でも成立しなかった
    }

    // getValidMoves(player)
    // 指定プレイヤーが打てる全ての座標を [row,col] の配列で返す
    getValidMoves(player) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(row, col, player)) moves.push([row, col]);
            }
        }
        return moves;
    }

    /**
     * flipPieces(row, col, player)
     * 指定座標に石を置いた後に、裏返すべきすべての石を即時で反転する。
     * アルゴリズム:
     *  - 8 方向を走査し、その方向で連続する相手石を一旦収集。
     *  - 収集の先に自分の石が存在した場合、収集した座標をすべて自分の色に置き換える。
     * 注意:
     *  - この関数は UI のアニメーションとは独立しており、盤面状態だけを更新します。
     *  - アニメーションを付けたい場合は ui.js 側でこの関数の代わりに
     *    flipPiecesAnimated(...) のような逐次描画ロジックを使います。
     */
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
            const toFlip = []; // この方向で裏返す候補座標を一時的に保持

            // 相手色が続く間は toFlip に追加
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.board[r][c] === opponent) {
                    toFlip.push([r, c]);
                } else if (this.board[r][c] === player) {
                    // 自分の色が続いたら toFlip を裏返し（色を player に置き換え）
                    toFlip.forEach(([fr, fc]) => this.board[fr][fc] = player);
                    break;
                } else {
                    // 空セルや null にぶつかったらこの方向は無効
                    break;
                }
                r += dRow;
                c += dCol;
            }
        }
    }

    // 現在の盤面スコアをカウントして返す（黒・白それぞれの個数）
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

    /**
     * endGame()
     * ゲーム終了時の処理。UI 側の DOM 要素を直接更新しているが、
     * この部分は簡易実装（UI のある環境でのみ動作する）。
     * - 最終スコアを設定
     * - 勝敗メッセージを表示するモーダルを開く
     */
    endGame() {
        this.gameActive = false;
        const score = this.getScore();

        if (typeof document !== 'undefined') {
            // 最終スコアをモーダルに反映
            document.getElementById('finalPlayerScore').textContent = score.white;
            document.getElementById('finalCpuScore').textContent = score.black;

            let result = '';
            if (score.white > score.black) result = `🎉 あなたの勝利です！`;
            else if (score.black > score.white) result = `😔 CPUの勝利です。`;
            else result = `🤝 同点です。`;

            document.getElementById('winner').textContent = result;
            const modal = document.getElementById('gameOverModal');
            modal.classList.add('active');

            // 画面上の簡易ステータス表示も更新
            document.getElementById('turn').textContent = 'ゲーム終了';
            document.getElementById('status').textContent = result;
            document.getElementById('status').className = 'status success';
        }
    }
}
