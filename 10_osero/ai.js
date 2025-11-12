// ai.js
// CPU (黒) の手を決めるシンプルな評価ロジック。
// このプロジェクトでは「難易度選択を廃止して」hard 固定の戦略を使っています。
// 目的: 簡潔でそれなりに強い手を選ぶ（コーナー優先 → エッジ重視 → 最大反転数）

/**
 * selectCPUMove(validMoves)
 * 外部から呼ばれるエントリポイント。現在は hard 戦略に委譲。
 * validMoves: 既に盤面のルールに基づき合法と判定された [row,col] の配列
 */
OthelloGame.prototype.selectCPUMove = function(validMoves) {
    return this.selectHardMove(validMoves);
};


/**
 * selectHardMove(moves)
 * - まずコーナーがあればランダムに取る（コーナーは最も強力な位置）
 * - 次に盤の端（縁）にある手のうち、反転数が最大となるものを選ぶ
 * - それ以外は全手の中から反転数が最大の手を選ぶ
 +
 * 戦略の意図:
 * - コーナーは安全でゲーム展開に有利なので最優先
 * - エッジは比較的安全かつ得点になりやすい
 * - 単純な反転数評価は短期的に有利だが中長期的には欠点がある（角を与えるなど）
 *   ここでは簡潔さを優先しているため、そのトレードオフを受け入れている。
 */
OthelloGame.prototype.selectHardMove = function(moves) {
    // コーナー優先（0,0 0,7 7,0 7,7）
    const corners = moves.filter(([r, c]) => (r === 0 || r === 7) && (c === 0 || c === 7));
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    // エッジ（盤の端）の手のうち反転数が最大のものを選ぶ
    const edges = moves.filter(([r, c]) => r === 0 || r === 7 || c === 0 || c === 7);
    if (edges.length > 0) {
        let best = edges[0];
        let maxFlips = -1;
        for (const [r, c] of edges) {
            const flips = this.countFlips(r, c, 'black');
            if (flips > maxFlips) { maxFlips = flips; best = [r, c]; }
        }
        return best;
    }

    // 上記以外は「反転枚数が最大」の手を選択
    let best = moves[0];
    let maxFlips = -1;
    for (const [r, c] of moves) {
        const flips = this.countFlips(r, c, 'black');
        if (flips > maxFlips) { maxFlips = flips; best = [r, c]; }
    }
    return best;
};


/**
 * countFlips(row, col, player)
 * - 指定の (row,col) に player が石を置いた場合に "即時に" 何枚返せるかを数えるヘルパー。
 * - これは AI の評価用であり、実際に盤面を変更するものではない。
 * - 実装は othello.js の反転判定ロジックと同じく 8 方向を走査する。
 */
OthelloGame.prototype.countFlips = function(row, col, player) {
    const opponent = player === 'black' ? 'white' : 'black';
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    let total = 0;
    for (const [dRow, dCol] of directions) {
        let r = row + dRow;
        let c = col + dCol;
        let count = 0;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (this.board[r][c] === opponent) count++;
            else if (this.board[r][c] === player) { total += count; break; }
            else break;
            r += dRow; c += dCol;
        }
    }
    return total;
};
