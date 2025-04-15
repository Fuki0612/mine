// ゲームの設定
const DIFFICULTY_SETTINGS = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 }
};

// ゲームの状態
let gameState = {
    board: [],
    rows: 0,
    cols: 0,
    mines: 0,
    minesLeft: 0,
    cellsToReveal: 0,
    isGameStarted: false,
    isGameOver: false,
    timer: 0,
    timerInterval: null
};

// DOM要素
const gameBoard = document.getElementById('game-board');
const difficultySelect = document.getElementById('difficulty');
const newGameBtn = document.getElementById('new-game-btn');
const minesCount = document.getElementById('mines-count');
const timer = document.getElementById('timer');
const gameStatus = document.getElementById('game-status');

// イベントリスナー
window.addEventListener('load', () => {
    initGame();
});

difficultySelect.addEventListener('change', () => {
    initGame();
});

newGameBtn.addEventListener('click', () => {
    initGame();
});

// ゲームの初期化
function initGame() {
    // 前のゲームのタイマーをクリア
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // 難易度の設定を取得
    const difficulty = difficultySelect.value;
    const settings = DIFFICULTY_SETTINGS[difficulty];
    
    // ゲーム状態の初期化
    gameState.rows = settings.rows;
    gameState.cols = settings.cols;
    gameState.mines = settings.mines;
    gameState.minesLeft = settings.mines;
    gameState.cellsToReveal = (settings.rows * settings.cols) - settings.mines;
    gameState.isGameStarted = false;
    gameState.isGameOver = false;
    gameState.timer = 0;
    
    // ステータス表示の更新
    minesCount.textContent = gameState.minesLeft;
    timer.textContent = '0';
    gameStatus.textContent = '';
    gameBoard.classList.remove('game-over', 'game-clear');
    
    // ボードのグリッドを設定
    gameBoard.style.gridTemplateColumns = `repeat(${settings.cols}, 1fr)`;
    
    // ボードの生成
    createBoard();
}

// ボードの生成
function createBoard() {
    // ボードをクリア
    gameBoard.innerHTML = '';
    
    // ボード配列の初期化
    gameState.board = [];
    
    // 行と列でボードを作成
    for (let row = 0; row < gameState.rows; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < gameState.cols; col++) {
            // セルの状態を初期化
            gameState.board[row][col] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            };
            
            // セル要素を作成
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // セルのイベントリスナー
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleRightClick);
            
            // ボードにセルを追加
            gameBoard.appendChild(cell);
        }
    }
}

// 地雷を配置
function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;
    
    while (minesPlaced < gameState.mines) {
        const row = Math.floor(Math.random() * gameState.rows);
        const col = Math.floor(Math.random() * gameState.cols);
        
        // 最初にクリックしたセルとその周囲には地雷を配置しない
        const isFirstClickArea = Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;
        
        if (!gameState.board[row][col].isMine && !isFirstClickArea) {
            gameState.board[row][col].isMine = true;
            minesPlaced++;
        }
    }
    
    // 各セルの隣接する地雷の数を計算
    calculateAdjacentMines();
}

// 隣接する地雷の数を計算
function calculateAdjacentMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col].isMine) continue;
            
            let count = 0;
            // 周囲8方向をチェック
            for (let r = Math.max(0, row - 1); r <= Math.min(gameState.rows - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(gameState.cols - 1, col + 1); c++) {
                    if (r === row && c === col) continue;
                    if (gameState.board[r][c].isMine) count++;
                }
            }
            
            gameState.board[row][col].adjacentMines = count;
        }
    }
}

// セルのクリックハンドラ
function handleCellClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // ゲームオーバーの場合は何もしない
    if (gameState.isGameOver) return;
    
    // フラグが立っている場合は何もしない
    if (gameState.board[row][col].isFlagged) return;
    
    // すでに開いているセルの場合は何もしない
    if (gameState.board[row][col].isRevealed) return;
    
    // 最初のクリック時
    if (!gameState.isGameStarted) {
        startGame(row, col);
    }
    
    // セルを開く
    revealCell(row, col);
}

// 右クリックハンドラ（フラグの設置/解除）
function handleRightClick(event) {
    event.preventDefault();
    
    // ゲームが始まっていない、またはゲームオーバーの場合は何もしない
    if (!gameState.isGameStarted || gameState.isGameOver) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // すでに開いているセルの場合は何もしない
    if (gameState.board[row][col].isRevealed) return;
    
    // フラグの切り替え
    gameState.board[row][col].isFlagged = !gameState.board[row][col].isFlagged;
    
    // フラグの数を更新
    if (gameState.board[row][col].isFlagged) {
        gameState.minesLeft--;
    } else {
        gameState.minesLeft++;
    }
    
    // 表示を更新
    updateCell(row, col);
    minesCount.textContent = gameState.minesLeft;
}

// ゲームの開始
function startGame(firstRow, firstCol) {
    // 地雷を配置
    placeMines(firstRow, firstCol);
    
    // ゲーム状態を更新
    gameState.isGameStarted = true;
    
    // タイマーを開始
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        timer.textContent = gameState.timer;
    }, 1000);
}

// セルを開く
function revealCell(row, col) {
    // 範囲外、既に開いている、またはフラグが立っている場合は何もしない
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols ||
        gameState.board[row][col].isRevealed || gameState.board[row][col].isFlagged) {
        return;
    }
    
    // セルを開く
    gameState.board[row][col].isRevealed = true;
    
    // 地雷の場合はゲームオーバー
    if (gameState.board[row][col].isMine) {
        gameOver(false);
        return;
    }
    
    // 残りのセル数を減らす
    gameState.cellsToReveal--;
    
    // セルの表示を更新
    updateCell(row, col);
    
    // すべての安全なセルを開いたらゲームクリア
    if (gameState.cellsToReveal === 0) {
        gameOver(true);
        return;
    }
    
    // 周囲に地雷がない場合は周囲のセルも開く
    if (gameState.board[row][col].adjacentMines === 0) {
        for (let r = Math.max(0, row - 1); r <= Math.min(gameState.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(gameState.cols - 1, col + 1); c++) {
                if (r === row && c === col) continue;
                revealCell(r, c);
            }
        }
    }
}

// セルの表示を更新
function updateCell(row, col) {
    const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cellElement.classList.remove('revealed', 'flagged', 'mine');
    
    // フラグが立っている場合
    if (gameState.board[row][col].isFlagged) {
        cellElement.classList.add('flagged');
        return;
    }
    
    // 開いている場合
    if (gameState.board[row][col].isRevealed) {
        cellElement.classList.add('revealed');
        
        // 地雷の場合
        if (gameState.board[row][col].isMine) {
            cellElement.classList.add('mine');
        } 
        // 数字を表示
        else if (gameState.board[row][col].adjacentMines > 0) {
            cellElement.textContent = gameState.board[row][col].adjacentMines;
            cellElement.dataset.value = gameState.board[row][col].adjacentMines;
        } else {
            cellElement.textContent = '';
        }
    } else {
        cellElement.textContent = '';
        cellElement.removeAttribute('data-value');
    }
}

// ゲームオーバー処理
function gameOver(isWin) {
    // タイマーを停止
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    gameState.isGameOver = true;
    
    // すべての地雷を表示
    if (!isWin) {
        revealAllMines();
        gameBoard.classList.add('game-over');
        gameStatus.textContent = 'ゲームオーバー！';
    } else {
        gameBoard.classList.add('game-clear');
        gameStatus.textContent = 'クリア！おめでとう！';
    }
}

// すべての地雷を表示
function revealAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col].isMine) {
                gameState.board[row][col].isRevealed = true;
                updateCell(row, col);
            }
        }
    }
}
