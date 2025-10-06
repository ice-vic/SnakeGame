// 游戏主逻辑

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const restartGameOverBtn = document.getElementById('restartGameOverBtn');
const gameOverScreen = document.getElementById('gameOver');
const scoreValue = document.getElementById('scoreValue');
const highScoreValue = document.getElementById('highScoreValue');
const finalScore = document.getElementById('finalScore');
const mapSizeSelect = document.getElementById('mapSize');
const gameSpeedSlider = document.getElementById('gameSpeed');
const speedValueDisplay = document.getElementById('speedValue');

// 游戏状态和配置
let snake = [];
let food = {};
let direction = '';
let nextDirection = '';
let score = 0;
let highScore = localStorage.getItem('snakeGameHighScore') || 0;
let gameInterval = null;
let gameRunning = false;
let gridSize = 20;
let canvasWidth = 400;
let canvasHeight = 400;
let gameSpeed = 150; // 默认速度值
let isPaused = false;
let isAccelerating = false; // 加速状态标志

// 赛博朋克风格颜色主题
const colors = {
    background: '#0a0a12',
    snakeHead: '#ff9500', // 橙青色主题
    snakeBody: '#00ccff', // 橙青色主题
    food: '#d300c5',
    grid: 'rgba(255, 255, 255, 0.7)', // 透明度70%的浅白色网格线
    glow: {
        head: '#ff950080',
        body: '#00ccff80',
        food: '#d300c580'
    }
};

// 获取额外的DOM元素
const startGameOverlay = document.getElementById('startGameOverlay');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const continueBtn = document.getElementById('continueBtn');

// 初始化游戏
function initGame() {
    // 设置最高分显示
    highScoreValue.textContent = highScore;
    
    // 根据选择的地图大小设置画布尺寸和网格大小
    updateMapSize();
    
    // 重置游戏状态
    resetGame();
    
    // 绘制初始界面
    drawGame();
    
    // 获取额外的DOM元素
    const mobileSpeedBtn = document.getElementById('mobileSpeedBtn');
    
    // 绑定事件监听
    bindEvents();
    
    // 修复地图大小更新问题：确保在DOM加载完成后设置画布样式
    setTimeout(() => {
        updateMapSize();
        resetGame();
        drawGame();
    }, 10);
}

// 更新地图大小（根据网格数量调整）
function updateMapSize() {
    const mapSize = mapSizeSelect.value;
    
    // 根据用户需求调整：小地图20*20，中地图30*30，大地图40*40
    switch(mapSize) {
        case 'small':
            gridSize = 20; // 网格大小（像素）
            canvasWidth = 400; // 20*20网格
            canvasHeight = 400;
            break;
        case 'medium':
            gridSize = 13; // 调整网格大小以适应30*30网格
            canvasWidth = 390;
            canvasHeight = 390;
            break;
        case 'large':
            gridSize = 10; // 调整网格大小以适应40*40网格
            canvasWidth = 400;
            canvasHeight = 400;
            break;
    }
    
    // 更新画布尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

// 重置游戏
function resetGame() {
    // 重置贪吃蛇位置和长度
    const centerX = Math.floor(canvasWidth / gridSize / 2) * gridSize;
    const centerY = Math.floor(canvasHeight / gridSize / 2) * gridSize;
    
    snake = [
        {x: centerX, y: centerY},
        {x: centerX - gridSize, y: centerY},
        {x: centerX - gridSize * 2, y: centerY}
    ];
    
    // 重置方向
    direction = 'right';
    nextDirection = 'right';
    
    // 重置分数
    score = 0;
    scoreValue.textContent = '0';
    
    // 生成食物
    generateFood();
    
    // 重置游戏状态
    gameRunning = false;
    isPaused = false;
    
    // 隐藏游戏结束界面和暂停界面
    gameOverScreen.style.display = 'none';
    continueBtn.style.display = 'none';
    
    // 显示开始游戏覆盖层
    startGameOverlay.style.display = 'flex';
}

// 生成食物
function generateFood() {
    // 确保食物不会出现在蛇身上
    let foodOnSnake;
    
    do {
        foodOnSnake = false;
        
        // 随机生成食物位置（对齐到网格）
        food.x = Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize;
        food.y = Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize;
        
        // 检查食物是否在蛇身上
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
}

// 开始游戏
function startGame() {
    if (!gameRunning && !isPaused) {
        // 隐藏开始游戏覆盖层
        startGameOverlay.style.display = 'none';
        gameRunning = true;
        
        // 清除之前的游戏间隔
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        
        // 设置新的游戏间隔（速度反向控制）
        gameInterval = setInterval(gameLoop, 400 - gameSpeed);
    } else if (isPaused) {
        // 从暂停状态恢复游戏
        isPaused = false;
        gameRunning = true;
        continueBtn.style.display = 'none';
        
        // 重新启动游戏循环
        gameInterval = setInterval(gameLoop, 400 - gameSpeed);
    }
}

// 暂停游戏
function pauseGame() {
    if (gameRunning) {
        gameRunning = false;
        isPaused = true;
        clearInterval(gameInterval);
        continueBtn.style.display = 'block';
    }
}

// 游戏主循环
function gameLoop() {
    // 更新方向
    direction = nextDirection;
    
    // 移动蛇
    moveSnake();
    
    // 检查碰撞
    if (checkCollision()) {
        endGame();
        return;
    }
    
    // 检查是否吃到食物
    if (checkFoodCollision()) {
        // 吃到食物，增加分数
        score += 10;
        scoreValue.textContent = score;
        
        // 生成新食物
        generateFood();
    } else {
        // 没吃到食物，移除尾部
        snake.pop();
    }
    
    // 绘制游戏
    drawGame();
}

// 移动蛇（带边界穿越功能）
function moveSnake() {
    // 获取蛇头位置
    const head = {x: snake[0].x, y: snake[0].y};
    
    // 根据方向移动蛇头
    switch(direction) {
        case 'up':
            head.y -= gridSize;
            // 边界穿越：从底部出现
            if (head.y < 0) head.y = canvasHeight - gridSize;
            break;
        case 'down':
            head.y += gridSize;
            // 边界穿越：从顶部出现
            if (head.y >= canvasHeight) head.y = 0;
            break;
        case 'left':
            head.x -= gridSize;
            // 边界穿越：从右侧出现
            if (head.x < 0) head.x = canvasWidth - gridSize;
            break;
        case 'right':
            head.x += gridSize;
            // 边界穿越：从左侧出现
            if (head.x >= canvasWidth) head.x = 0;
            break;
    }
    
    // 在蛇头添加新位置
    snake.unshift(head);
}

// 检查碰撞（边界穿越后只检查撞到自己）
function checkCollision() {
    const head = snake[0];
    
    // 检查是否撞到自己
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 检查是否吃到食物
function checkFoodCollision() {
    return snake[0].x === food.x && snake[0].y === food.y;
}

// 结束游戏
function endGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeGameHighScore', highScore);
        highScoreValue.textContent = highScore;
    }
    
    // 显示游戏结束界面
    finalScore.textContent = score;
    gameOverScreen.style.display = 'flex';
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制背景网格
    drawGrid();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
}

// 绘制网格背景
function drawGrid() {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
}

// 绘制蛇（赛博朋克风格带光效 - 填充整个方块）
function drawSnake() {
    // 绘制蛇身（从后往前绘制，确保蛇头在最上层）
    for (let i = snake.length - 1; i >= 1; i--) {
        // 赛博朋克光效
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.glow.body;
        
        // 绘制填充整个方块的矩形
        ctx.fillStyle = colors.snakeBody;
        ctx.fillRect(snake[i].x, snake[i].y, gridSize, gridSize);
        
        // 重置阴影
        ctx.shadowBlur = 0;
    }
    
    // 绘制蛇头（带更强的光效）
    ctx.shadowBlur = 25;
    ctx.shadowColor = colors.glow.head;
    
    // 绘制填充整个方块的矩形作为蛇头
    ctx.fillStyle = colors.snakeHead;
    ctx.fillRect(snake[0].x, snake[0].y, gridSize, gridSize);
    
    // 重置阴影
    ctx.shadowBlur = 0;
}

// 绘制食物（赛博朋克风格带光效）
function drawFood() {
    // 赛博朋克光效
    ctx.shadowBlur = 20;
    ctx.shadowColor = colors.glow.food;
    
    ctx.fillStyle = colors.food;
    ctx.beginPath();
    ctx.arc(
        food.x + gridSize/2,
        food.y + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // 添加脉动效果
    const pulseFactor = 1 + Math.sin(Date.now() * 0.005) * 0.1;
    ctx.strokeStyle = colors.glow.food;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        food.x + gridSize/2,
        food.y + gridSize/2,
        (gridSize/2 - 2) * pulseFactor,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    
    // 重置阴影
    ctx.shadowBlur = 0;
}

// 绑定事件监听
function bindEvents() {
    // 开始按钮点击事件
    startBtn.addEventListener('click', startGame);
    playBtn.addEventListener('click', startGame);
    
    // 重新开始按钮点击事件
    restartBtn.addEventListener('click', resetGame);
    restartGameOverBtn.addEventListener('click', resetGame);
    
    // 暂停按钮点击事件
    pauseBtn.addEventListener('click', pauseGame);
    
    // 继续按钮点击事件
    continueBtn.addEventListener('click', startGame);
    
    // 地图大小改变事件
    mapSizeSelect.addEventListener('change', () => {
        updateMapSize();
        resetGame();
        drawGame();
    });
    
    // 游戏速度改变事件
    gameSpeedSlider.addEventListener('input', (e) => {
        gameSpeed = parseInt(e.target.value);
        speedValueDisplay.textContent = gameSpeed;
        
        // 设置滑块进度条样式
        const percent = ((gameSpeed - gameSpeedSlider.min) / (gameSpeedSlider.max - gameSpeedSlider.min)) * 100;
        gameSpeedSlider.style.setProperty('--value', `${percent}%`);
        
        // 如果游戏正在运行且没有加速，更新游戏速度
        if (gameRunning && !isAccelerating) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 400 - gameSpeed);
        }
    });
    
    // 初始化滑块进度条
    const initialPercent = ((gameSpeed - gameSpeedSlider.min) / (gameSpeedSlider.max - gameSpeedSlider.min)) * 100;
    gameSpeedSlider.style.setProperty('--value', `${initialPercent}%`);
    
    // 移动端加速按钮长按事件
    mobileSpeedBtn.addEventListener('mousedown', startMobileAcceleration);
    mobileSpeedBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 防止触摸事件触发鼠标事件
        startMobileAcceleration();
    });
    
    // 释放加速按钮
    document.addEventListener('mouseup', stopMobileAcceleration);
    document.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopMobileAcceleration();
    });
    
    // 离开按钮区域时停止加速
    document.addEventListener('mouseleave', stopMobileAcceleration);
    

    
    // 键盘控制
        document.addEventListener('keydown', (e) => {
            // 防止方向键、WASD和空格键滚动页面
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Shift'].includes(e.key)) {
                e.preventDefault();
            }
            
            // 如果游戏未开始，按方向键或WASD开始游戏
            if (!gameRunning) {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                    startGame();
                }
            }
            
            // 控制方向，防止180度转向
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (direction !== 'down') {
                        nextDirection = 'up';
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (direction !== 'up') {
                        nextDirection = 'down';
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (direction !== 'right') {
                        nextDirection = 'left';
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (direction !== 'left') {
                        nextDirection = 'right';
                    }
                    break;
                case ' ': // 空格键暂停/继续
                    if (gameRunning) {
                        pauseGame();
                    } else if (isPaused) {
                        startGame();
                    } else if (snake.length > 0) {
                        startGame();
                    }
                    break;
                case 'Shift':
                    // Shift键加速功能
                    if (gameRunning && !isAccelerating) {
                        isAccelerating = true;
                        // 加速后速度变为350
                        clearInterval(gameInterval);
                        gameInterval = setInterval(gameLoop, 400 - 350);
                    }
                    break;
            }
        });
        
        // 监听Shift键释放事件，恢复正常速度
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift' && isAccelerating) {
                isAccelerating = false;
                // 恢复正常速度
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, 400 - gameSpeed);
            }
        });
    
    // 移动端触摸控制
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!gameRunning && !isPaused) {
            startGame();
            return;
        }
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // 判断滑动方向
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平滑动
            if (diffX > 0 && direction !== 'left') {
                nextDirection = 'right';
            } else if (diffX < 0 && direction !== 'right') {
                nextDirection = 'left';
            }
        } else {
            // 垂直滑动
            if (diffY > 0 && direction !== 'up') {
                nextDirection = 'down';
            } else if (diffY < 0 && direction !== 'down') {
                nextDirection = 'up';
            }
        }
    }, { passive: false });
}

// 移动端开始加速
function startMobileAcceleration() {
    if (gameRunning && !isAccelerating) {
        isAccelerating = true;
        // 加速后速度变为350
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 400 - 350);
    }
}

// 移动端停止加速
function stopMobileAcceleration() {
    if (isAccelerating) {
        isAccelerating = false;
        // 恢复正常速度
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 400 - gameSpeed);
    }
}

// 初始化游戏
initGame();