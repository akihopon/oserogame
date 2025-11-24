const BOARD_SIZE = 8;
const BLACK = 'black';
const WHITE = 'white';
const EMPTY = null;

let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let scores = { [BLACK]: 2, [WHITE]: 2 };

const boardElement = document.getElementById('board');
const scoreBlackEl = document.getElementById('score-val-black');
const scoreWhiteEl = document.getElementById('score-val-white');
const cardBlackEl = document.getElementById('score-black');
const cardWhiteEl = document.getElementById('score-white');
const statusMessageEl = document.getElementById('status-message');
const resetBtn = document.getElementById('reset-btn');

// Directions for checking neighbors (row, col)
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

function initGame() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    currentPlayer = BLACK;
    gameOver = false;
    
    // Initial setup
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;

    renderBoard();
    updateScore();
    updateStatus();
    highlightValidMoves();
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleCellClick);

            if (board[r][c]) {
                const disc = document.createElement('div');
                disc.classList.add('disc', board[r][c]);
                
                const front = document.createElement('div');
                front.classList.add('face', 'front');
                
                const back = document.createElement('div');
                back.classList.add('face', 'back');
                
                disc.appendChild(front);
                disc.appendChild(back);
                cell.appendChild(disc);
            }
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(e) {
    if (gameOver) return;
    // If playing against AI, prevent click during AI turn
    // For now, let's do local multiplayer or simple AI. 
    // Let's implement simple AI for White.
    if (currentPlayer === WHITE) return; 

    const row = parseInt(e.currentTarget.dataset.row);
    const col = parseInt(e.currentTarget.dataset.col);

    if (isValidMove(row, col, currentPlayer)) {
        makeMove(row, col, currentPlayer);
    }
}

function isValidMove(row, col, player) {
    if (board[row][col] !== EMPTY) return false;

    const opponent = player === BLACK ? WHITE : BLACK;
    
    for (let [dr, dc] of DIRECTIONS) {
        let r = row + dr;
        let c = col + dc;
        let foundOpponent = false;

        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === opponent) {
                foundOpponent = true;
            } else if (board[r][c] === player) {
                if (foundOpponent) return true;
                break;
            } else {
                break;
            }
            r += dr;
            c += dc;
        }
    }
    return false;
}

function getValidMoves(player) {
    const moves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (isValidMove(r, c, player)) {
                moves.push({ r, c });
            }
        }
    }
    return moves;
}

function makeMove(row, col, player) {
    board[row][col] = player;
    
    // Add disc to DOM immediately for visual feedback
    const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    const disc = document.createElement('div');
    disc.classList.add('disc', player);
    // Start with 0 scale or some animation? 
    // Actually, just adding it is fine, but let's add faces
    const front = document.createElement('div');
    front.classList.add('face', 'front');
    const back = document.createElement('div');
    back.classList.add('face', 'back');
    disc.appendChild(front);
    disc.appendChild(back);
    cell.appendChild(disc);

    // Flip discs
    const discsToFlip = getDiscsToFlip(row, col, player);
    discsToFlip.forEach(({ r, c }) => {
        board[r][c] = player;
        const discEl = document.querySelector(`.cell[data-row='${r}'][data-col='${c}'] .disc`);
        if (discEl) {
            // Force reflow or just change class
            // We need to handle the transition.
            // If it was white (rotated 180), becoming black (0), we remove white class add black.
            // But we want smooth transition.
            // If current is white, it has transform: rotateY(180deg).
            // We want to go to 0deg.
            // If we just change class, it will animate.
            discEl.className = `disc ${player}`;
        }
    });

    updateScore();
    switchTurn();
}

function getDiscsToFlip(row, col, player) {
    const opponent = player === BLACK ? WHITE : BLACK;
    const discs = [];

    for (let [dr, dc] of DIRECTIONS) {
        let r = row + dr;
        let c = col + dc;
        let potentialFlips = [];

        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === opponent) {
                potentialFlips.push({ r, c });
            } else if (board[r][c] === player) {
                if (potentialFlips.length > 0) {
                    discs.push(...potentialFlips);
                }
                break;
            } else {
                break;
            }
            r += dr;
            c += dc;
        }
    }
    return discs;
}

function updateScore() {
    let blackCount = 0;
    let whiteCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === BLACK) blackCount++;
            if (board[r][c] === WHITE) whiteCount++;
        }
    }
    scores[BLACK] = blackCount;
    scores[WHITE] = whiteCount;
    scoreBlackEl.textContent = blackCount;
    scoreWhiteEl.textContent = whiteCount;
}

function switchTurn() {
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    updateStatus();
    
    const validMoves = getValidMoves(currentPlayer);
    if (validMoves.length === 0) {
        // No moves, pass
        statusMessageEl.textContent = `${currentPlayer === BLACK ? "Black" : "White"} has no moves! Passing...`;
        currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
        
        const nextMoves = getValidMoves(currentPlayer);
        if (nextMoves.length === 0) {
            endGame();
            return;
        }
        
        setTimeout(() => {
            updateStatus();
            highlightValidMoves();
            if (currentPlayer === WHITE) {
                setTimeout(aiMove, 1000);
            }
        }, 2000);
    } else {
        highlightValidMoves();
        if (currentPlayer === WHITE) {
            setTimeout(aiMove, 800);
        }
    }
}

function updateStatus() {
    if (currentPlayer === BLACK) {
        cardBlackEl.classList.add('active');
        cardWhiteEl.classList.remove('active');
        statusMessageEl.textContent = "Black's Turn";
    } else {
        cardWhiteEl.classList.add('active');
        cardBlackEl.classList.remove('active');
        statusMessageEl.textContent = "White's Turn (AI)";
    }
}

function highlightValidMoves() {
    // Clear previous highlights
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('valid-move'));
    
    if (currentPlayer === WHITE) return; // Don't show hints for AI

    const moves = getValidMoves(currentPlayer);
    moves.forEach(({ r, c }) => {
        const cell = document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
        if (cell) cell.classList.add('valid-move');
    });
}

function aiMove() {
    if (gameOver) return;
    
    const moves = getValidMoves(WHITE);
    if (moves.length === 0) return;

    // Simple Greedy Strategy: maximize flipped discs
    let bestMove = moves[0];
    let maxFlips = -1;

    // Corner priority
    const corners = [[0,0], [0,7], [7,0], [7,7]];
    
    for (let move of moves) {
        // Check if corner
        if (corners.some(c => c[0] === move.r && c[1] === move.c)) {
            bestMove = move;
            break; // Always take corner
        }

        const flips = getDiscsToFlip(move.r, move.c, WHITE).length;
        if (flips > maxFlips) {
            maxFlips = flips;
            bestMove = move;
        }
    }

    makeMove(bestMove.r, bestMove.c, WHITE);
}

function endGame() {
    gameOver = true;
    let msg = "";
    if (scores[BLACK] > scores[WHITE]) {
        msg = "Black Wins!";
    } else if (scores[WHITE] > scores[BLACK]) {
        msg = "White Wins!";
    } else {
        msg = "Draw!";
    }
    statusMessageEl.textContent = msg;
    statusMessageEl.style.color = "#4ade80";
    statusMessageEl.style.fontWeight = "800";
    statusMessageEl.style.fontSize = "1.5rem";
}

resetBtn.addEventListener('click', initGame);

// Start
initGame();
