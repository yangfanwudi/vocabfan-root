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

// 逻辑求解：只用裸单/隐单，推不动就判定“需要猜”
function solveLogically(puzzle) {
    const board = puzzle.map(row => [...row]);

    function candidates(r, c) {
        const nums = [];
        for (let n = 1; n <= 9; n++) {
            if (isValid(board, r, c, n)) nums.push(n);
        }
        return nums;
    }

    while (true) {
        let progress = false;

        // 裸单
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] !== 0) continue;
                const nums = candidates(r, c);
                if (nums.length === 0) return false;
                if (nums.length === 1) {
                    board[r][c] = nums[0];
                    progress = true;
                }
            }
        }
        if (progress) continue;

        // 隐单：行 / 列 / 宫
        const units = [];
        for (let i = 0; i < 9; i++) {
            const row = [], col = [], box = [];
            for (let j = 0; j < 9; j++) {
                row.push([i, j]);
                col.push([j, i]);
                const br = Math.floor(i / 3) * 3 + Math.floor(j / 3);
                const bc = (i % 3) * 3 + (j % 3);
                box.push([br, bc]);
            }
            units.push(row, col, box);
        }
        for (const unit of units) {
            for (let n = 1; n <= 9; n++) {
                if (unit.some(([r, c]) => board[r][c] === n)) continue;
                const places = unit.filter(([r, c]) => board[r][c] === 0 && isValid(board, r, c, n));
                if (places.length === 0) continue;
                if (places.length === 1) {
                    board[places[0][0]][places[0][1]] = n;
                    progress = true;
                }
            }
        }

        if (!progress) break;
    }

    return board.every(row => row.every(v => v !== 0));
}

// 从完整解中挖空，生成唯一解题目（不再直接返回，交给 generatePuzzle 做无猜重试）
function buildPuzzle(difficulty) {
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

// 生成无猜题目：唯一解 + 只用裸单/隐单可推完
function generatePuzzle(difficulty) {
    const maxAttempts = difficulty === '17' ? 6 : 16;
    let fallback = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = buildPuzzle(difficulty);
        if (!fallback) fallback = candidate;
        if (solveLogically(candidate.puzzle)) {
            candidate.noGuess = true;
            return candidate;
        }
    }

    fallback = fallback || buildPuzzle(difficulty);
    fallback.noGuess = false;
    return fallback;
}

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
function randomMineMap(puzzle, mineCount) {
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

// 同宫 8 邻格（不含自己）
function getBoxNeighbors(row, col) {
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    const out = [];
    for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
            if (r !== row || c !== col) out.push([r, c]);
        }
    }
    return out;
}

// 每颗雷必须至少有 3 个同宫非雷邻格，保证可通过铲雷条件
function allMinesShovelable(puzzle, mineMap) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (!mineMap[r][c]) continue;
            let safe = 0;
            for (const [nr, nc] of getBoxNeighbors(r, c)) {
                if (!mineMap[nr][nc]) safe++;
            }
            if (safe < 3) return false;
        }
    }
    return true;
}

// 用完整雷数约束检查雷布局是否唯一；唯一才说明玩家能推出来
function isUniqueMineLayout(puzzle, mineMap, hintMap, mineCount) {
    const assign = new Int8Array(81).fill(-1); // -1 未知 / 0 安全 / 1 雷
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (puzzle[r][c] !== 0) assign[r * 9 + c] = 0;
        }
    }

    const constraints = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            constraints.push({
                target: hintMap[r][c],
                idxs: getNeighbors(r, c).map(([nr, nc]) => nr * 9 + nc)
            });
        }
    }

    let solutions = 0;
    let nodes = 0;
    const deadline = Date.now() + 450;

    function propagate() {
        let changed = true;
        while (changed) {
            changed = false;
            let mines = 0, unknown = 0;
            for (let i = 0; i < 81; i++) {
                if (assign[i] === 1) mines++;
                else if (assign[i] === -1) unknown++;
            }
            if (mines > mineCount || mines + unknown < mineCount) return false;

            for (const con of constraints) {
                let need = con.target;
                const unknownList = [];
                for (const idx of con.idxs) {
                    if (assign[idx] === 1) need--;
                    else if (assign[idx] === -1) unknownList.push(idx);
                }
                if (need < 0 || need > unknownList.length) return false;
                if (need === 0 || need === unknownList.length) {
                    const val = need === 0 ? 0 : 1;
                    for (const idx of unknownList) {
                        if (assign[idx] === -1) {
                            assign[idx] = val;
                            changed = true;
                        }
                    }
                }
            }
        }
        return true;
    }

    function search() {
        if (solutions >= 2 || nodes++ > 30000 || Date.now() > deadline) return;
        if (!propagate()) return;

        let idx = -1;
        for (let i = 0; i < 81; i++) {
            if (assign[i] === -1) { idx = i; break; }
        }
        if (idx < 0) {
            let mines = 0;
            for (let i = 0; i < 81; i++) if (assign[i] === 1) mines++;
            if (mines === mineCount) solutions++;
            return;
        }

        for (const val of [1, 0]) {
            assign[idx] = val;
            search();
            assign[idx] = -1;
            if (solutions >= 2) return;
        }
    }

    search();
    return solutions === 1;
}

// 生成地雷布局：优先唯一且每颗雷可铲；失败时退回随机布局
function placeMines(puzzle, mineCount) {
    const attempts = 30;
    const deadline = Date.now() + 1600;
    let fallback = null;

    for (let i = 0; i < attempts && Date.now() < deadline; i++) {
        const mineMap = randomMineMap(puzzle, mineCount);
        const hintMap = calculateHints(mineMap);
        if (!fallback) fallback = mineMap;
        if (!allMinesShovelable(puzzle, mineMap)) continue;
        if (!isUniqueMineLayout(puzzle, mineMap, hintMap, mineCount)) continue;
        mineMap.noGuess = true;
        return mineMap;
    }

    fallback = fallback || randomMineMap(puzzle, mineCount);
    fallback.noGuess = false;
    return fallback;
}

// 计算每个格子周围的雷数（雷格也计算，用于全格徽标，避免暴露雷位）
function calculateHints(mineMap) {
    const hintMap = Array.from({ length: 9 }, () => Array(9).fill(0));
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let count = 0;
            const neighbors = getNeighbors(r, c);
            for (const [nr, nc] of neighbors) {
                if (mineMap[nr][nc]) count++;
            }
            hintMap[r][c] = count;
        }
    }
    return hintMap;
}

// 判断某个格子是否应该显示红色提示
// 只对题目给定数字生效；玩家填写的数字绝不生成雷提示，避免假线索
function shouldShowHint(row, col, puzzle, playerGrid, hintMap) {
    if (puzzle[row][col] === 0) return false;
    const hintCount = hintMap[row][col];
    if (hintCount <= 0) return false;
    return puzzle[row][col] === hintCount;
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