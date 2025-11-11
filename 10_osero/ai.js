// ai.js
// CPU の手を決めるロジックを OthelloGame の prototype に追加

/**
 * CPU が打つ手を選択する（難易度別）
 * - easy: ランダム
 * - normal: コーナー > 端 > 返せる枚数
 * - hard: コーナー優先、端の中では最大反転数
 */
OthelloGame.prototype.selectCPUMove = function(validMoves) {
    if (this.difficulty === 'easy') return this.selectRandomMove(validMoves);
    if (this.difficulty === 'normal') return this.selectNormalMove(validMoves);
    return this.selectHardMove(validMoves);
};

OthelloGame.prototype.selectRandomMove = function(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
};

OthelloGame.prototype.selectNormalMove = function(moves) {
    // コーナー優先
    const corners = moves.filter(([r, c]) => (r === 0 || r === 7) && (c === 0 || c === 7));
    if (corners.length > 0) return this.selectRandomMove(corners);

    // 端優先
    const edges = moves.filter(([r, c]) => r === 0 || r === 7 || c === 0 || c === 7);
    if (edges.length > 0) return this.selectRandomMove(edges);

    // 返せる枚数が多い手を選ぶ
    let best = moves[0];
    let maxFlips = -1;
    for (const [r, c] of moves) {
        const flips = this.countFlips(r, c, 'black');
        if (flips > maxFlips) { maxFlips = flips; best = [r, c]; }
    }
    return best;
};

OthelloGame.prototype.selectHardMove = function(moves) {
    // コーナー優先
    const corners = moves.filter(([r, c]) => (r === 0 || r === 7) && (c === 0 || c === 7));
    if (corners.length > 0) return this.selectRandomMove(corners);

    // 端の中で最も多く返せる手を選択
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

    // 返せる枚数が多い手を選ぶ
    let best = moves[0];
    let maxFlips = -1;
    for (const [r, c] of moves) {
        const flips = this.countFlips(r, c, 'black');
        if (flips > maxFlips) { maxFlips = flips; best = [r, c]; }
    }
    return best;
};

/**
 * 指定の手で何枚返せるかを数える（評価用）
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
