// ============================================================
// 数独生成算法 + 地雷逻辑
// ============================================================

// ---------- 工具函数 ----------
let rng = Math.random;
function setRng(fn) { rng = (typeof fn === 'function') ? fn : Math.random; }
function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}
function dailySeed() {
    const d = new Date(Date.now() + 8 * 3600 * 1000);
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}


function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---------- 数独生成 ----------

// 检查在 board[row][col] 放置 num 是否合法
function isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) return false;
        if (board[i][col] === num) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
            if (board[r][c] === num) return false;
        }
    }
    return true;
}

// 用回溯法生成完整数独解（返回解的个数，用于检测唯一解）
function solveSudokuCount(board, count, limit) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        count = solveSudokuCount(board, count, limit);
                        board[row][col] = 0;
                        if (count > limit) return count;
                    }
                }
                return count;
            }
        }
    }
    return count + 1;
}

// 用回溯法生成一个随机完整数独解
function solveSudokuRandom(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of nums) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudokuRandom(board)) return true;
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// 生成一个完整的数独解
function generateCompleteSudoku() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    solveSudokuRandom(board);
    return board;
}

// 检查挖掉某个格子后是否仍有唯一解（限制搜索深度）
function canRemove(board, row, col) {
    const backup = board[row][col];
    board[row][col] = 0;
    const count = solveSudokuCount(board, 0, 2);
    board[row][col] = backup;
    return count === 1;
}

// 从完整解中挖空，生成题目（保证唯一解）
// difficulty: 'easy' | 'hard' | '17'
function generatePuzzle(difficulty) {
    const solution = generateCompleteSudoku();
    const puzzle = solution.map(row => [...row]);

    let cellsToRemove;
    switch (difficulty) {
        case 'easy':
            cellsToRemove = 30; // 剩51个提示
            break;
        case 'hard':
            cellsToRemove = 45; // 剩36个提示
            break;
        case '17':
            cellsToRemove = 64; // 剩17个提示
            break;
        case 'classic':
            cellsToRemove = 40;
            break;
        case 'daily':
            cellsToRemove = 45;
            break;
        default:
            cellsToRemove = 30;
    }

    // 生成所有位置并随机打乱
    const positions = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            positions.push([r, c]);
        }
    }
    shuffleArray(positions);

    // 逐个挖空，每次检查唯一解
    let removed = 0;
    for (const [r, c] of positions) {
        if (removed >= cellsToRemove) break;
        if (canRemove(puzzle, r, c)) {
            puzzle[r][c] = 0;
            removed++;
        }
    }

    return { puzzle, solution };
}

// ---------- 地雷逻辑 ----------

// 获取某个格子周围8格的所有坐标
function getNeighbors(row, col) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                neighbors.push([nr, nc]);
            }
        }
    }
    return neighbors;
}

// 在空格中随机放置地雷
function placeMines(puzzle, mineCount) {
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (puzzle[r][c] === 0) {
                emptyCells.push([r, c]);
            }
        }
    }

    shuffleArray(emptyCells);
    const mineMap = Array.from({ length: 9 }, () => Array(9).fill(false));

    const selected = emptyCells.slice(0, Math.min(mineCount, emptyCells.length));
    for (const [r, c] of selected) {
        mineMap[r][c] = true;
    }

    return mineMap;
}

// 计算每个格子周围的雷数
function calculateHints(mineMap) {
    const hintMap = Array.from({ length: 9 }, () => Array(9).fill(0));
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (mineMap[r][c]) {
                hintMap[r][c] = -1; // 雷
            } else {
                let count = 0;
                const neighbors = getNeighbors(r, c);
                for (const [nr, nc] of neighbors) {
                    if (mineMap[nr][nc]) count++;
                }
                hintMap[r][c] = count;
            }
        }
    }
    return hintMap;
}

// 判断某个格子是否应该显示红色提示
// 条件：该格有数字（提示数字或玩家已填），且该数字恰好等于它周围的雷数
function shouldShowHint(row, col, puzzle, playerGrid, hintMap) {
    const hintCount = hintMap[row][col];
    if (hintCount <= 0) return false; // 周围没雷或本身就是雷

    // 获取该格的数字（提示数字或玩家填的数字）
    let cellValue;
    if (puzzle[row][col] !== 0) {
        cellValue = puzzle[row][col]; // 提示数字
    } else if (playerGrid[row][col] !== 0) {
        cellValue = playerGrid[row][col]; // 玩家填的数字
    } else {
        return false; // 空格不显示
    }

    // 数字恰好等于周围雷数时才显示红色
    return cellValue === hintCount;
}

// 检查是否胜利（数独完成 + 没有踩到雷）
function checkVictory(puzzle, solution, playerGrid, mineMap) {
    // 所有空格都填了正确数字
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (puzzle[r][c] === 0) {
                if (playerGrid[r][c] !== solution[r][c]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 根据难度获取地雷数量
function getMineCount(difficulty) {
    switch (difficulty) {
        case 'classic': return 0;
        case 'daily': return 10;
        case 'easy': return 5;
        case 'hard': return 10;
        case '17': return 12;
        default: return 5;
    }
}