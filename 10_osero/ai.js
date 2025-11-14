// ai.js
// CPU (黒) の手を決める評価ロジック（シンプルなヒューリスティック）
// 戦略の要点: コーナー優先 -> エッジを重視 -> 反転枚数最大を選択


/**
 * selectCPUMove(validMoves)
 * - エントリポイント。与えられた合法手から CPU の手を選ぶ
 * - 引数: validMoves - [[row, col], ...]
 * - 戻り値: [row, col]
 */
OthelloGame.prototype.selectCPUMove = function(validMoves) {
    // 現在は hard 戦略を使う（ファイル内の戦略関数に委譲）
    return this.selectHardMove(validMoves);
};


/**
 * selectHardMove(moves)
 * - コーナーがあれば優先して取る
 * - 次に盤の端（エッジ）の中で反転数が最大の手を選ぶ
 * - それ以外は全手の中から反転数が最大の手を選ぶ
 * - 引数: moves - [[row, col], ...]
 * - 戻り値: [row, col]
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
 * - 指定の (row,col) に player が石を置いた場合に何枚返せるかを数える
 * - AI の評価用ヘルパー（盤面は変更しない）
 * - 戻り値: number
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
