const board = document.querySelector('.board');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const timeElement = document.getElementById('time');

const blockHeight = 50;
const blockWidth = 50;

// Global game state
let blocks = {};
let snake = [];
let food = null;
let direction = 'right';
let nextDirection = 'right';
let cols = 0;
let rows = 0;
let gameInterval = null;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let startTime = null;
let timeInterval = null;
let gameSpeed = 200;

highScoreElement.textContent = highScore;

const buildGrid = () => {
    cols = Math.floor(board.clientWidth / blockWidth);
    rows = Math.floor(board.clientHeight / blockHeight);

    board.innerHTML = '';
    blocks = {};

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const block = document.createElement('div');
            block.classList.add('block');
            board.appendChild(block);
            blocks[`${row}-${col}`] = block;
        }
    }

    // Reset game after grid rebuild
    initGame();
};

const initGame = () => {
    // Clear any existing intervals
    if (gameInterval) clearInterval(gameInterval);
    if (timeInterval) clearInterval(timeInterval);

    // Initialize snake in the middle
    const midRow = Math.floor(rows / 2);
    const midCol = Math.floor(cols / 2);
    
    snake = [
        { row: midRow, col: midCol - 2 },
        { row: midRow, col: midCol - 1 },
        { row: midRow, col: midCol }
    ];
    
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
    startTime = Date.now();
    gameRunning = true;
    gameSpeed = 200;

    generateFood();
    render();
    
    // Start game loop
    gameInterval = setInterval(gameLoop, gameSpeed);
    
    // Start timer
    timeInterval = setInterval(updateTime, 100);
};

const generateFood = () => {
    let foodRow, foodCol;
    
    do {
        foodRow = Math.floor(Math.random() * rows);
        foodCol = Math.floor(Math.random() * cols);
    } while (snake.some(segment => segment.row === foodRow && segment.col === foodCol));
    
    food = { row: foodRow, col: foodCol };
};

const updateTime = () => {
    if (!gameRunning) return;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    timeElement.textContent = `${minutes}:${seconds}`;
};

const render = () => {
    // Clear all blocks
    Object.values(blocks).forEach(block => {
        block.classList.remove('fill');
        block.style.backgroundColor = '';
        block.textContent = '';
    });

    // Render snake
    snake.forEach((segment, index) => {
        const key = `${segment.row}-${segment.col}`;
        if (blocks[key]) {
            blocks[key].classList.add('fill');
        }
    });

    // Render food
    if (food) {
        const key = `${food.row}-${food.col}`;
        if (blocks[key]) {
            blocks[key].style.backgroundColor = '#ff4444';
        }
    }
};

const showGameOver = () => {
    // Display game over message in the center of the board
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);
    
    // Clear board and show game over text
    Object.values(blocks).forEach(block => {
        block.classList.remove('fill');
        block.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        block.style.fontSize = '0';
    });
    
    const gameOverText = 'GAME OVER';
    const restartText = 'Press SPACE to restart';
    const scoreText = `Score: ${score}`;
    
    // Display GAME OVER
    const startCol = Math.floor(centerCol - gameOverText.length / 2);
    for (let i = 0; i < gameOverText.length; i++) {
        const key = `${centerRow - 2}-${startCol + i}`;
        if (blocks[key]) {
            blocks[key].textContent = gameOverText[i];
            blocks[key].style.fontSize = '24px';
            blocks[key].style.color = '#ff4444';
            blocks[key].style.fontWeight = 'bold';
        }
    }
    
    // Display Score
    const scoreStartCol = Math.floor(centerCol - scoreText.length / 2);
    for (let i = 0; i < scoreText.length; i++) {
        const key = `${centerRow}-${scoreStartCol + i}`;
        if (blocks[key]) {
            blocks[key].textContent = scoreText[i];
            blocks[key].style.fontSize = '18px';
            blocks[key].style.color = '#e8e047';
        }
    }
    
    // Display restart instruction
    const restartStartCol = Math.floor(centerCol - restartText.length / 2);
    for (let i = 0; i < restartText.length; i++) {
        const key = `${centerRow + 2}-${restartStartCol + i}`;
        if (blocks[key]) {
            blocks[key].textContent = restartText[i];
            blocks[key].style.fontSize = '14px';
            blocks[key].style.color = '#d88911';
        }
    }
};

const gameLoop = () => {
    if (!gameRunning) return;

    // Update direction
    direction = nextDirection;

    // Calculate new head position
    const head = snake[snake.length - 1];
    let newHead = { ...head };

    switch (direction) {
        case 'up':
            newHead.row--;
            break;
        case 'down':
            newHead.row++;
            break;
        case 'left':
            newHead.col--;
            break;
        case 'right':
            newHead.col++;
            break;
    }

    // Check wall collision
    if (newHead.row < 0 || newHead.row >= rows || newHead.col < 0 || newHead.col >= cols) {
        gameOver();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.row === newHead.row && segment.col === newHead.col)) {
        gameOver();
        return;
    }

    // Add new head
    snake.push(newHead);

    // Check food collision
    if (food && newHead.row === food.row && newHead.col === food.col) {
        score++;
        scoreElement.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        generateFood();
        
        // Increase speed based on score (max speed at 50ms)
        gameSpeed = Math.max(50, 200 - (score * 5));
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    } else {
        // Remove tail if no food eaten
        snake.shift();
    }

    render();
};

const gameOver = () => {
    gameRunning = false;
    clearInterval(gameInterval);
    clearInterval(timeInterval);
    
    showGameOver();
};

// Keyboard controls
document.addEventListener('keydown', (e) => {
    // Restart game with space when game is over
    if (!gameRunning && e.key === ' ') {
        initGame();
        e.preventDefault();
        return;
    }
    
    if (!gameRunning) return;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            e.preventDefault();
            break;
    }
});

buildGrid();

let resizeTimer = null;
window.addEventListener('resize', () => {
    if (resizeTimer) {
        clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
        buildGrid();
    }, 1000);
});