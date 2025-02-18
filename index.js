document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const $score = document.getElementById("score");
    const $highScore = document.getElementById("highScore");
    const $startBtn = document.getElementById("startBtn");
    const $pauseBtn = document.getElementById("pauseBtn");
    const $resetBtn = document.getElementById("resetBtn");
    const $gameOver = document.getElementById("gameOverScreen");
    const $finalScore = document.getElementById("finalScore");
    const $highMsg = document.getElementById("highScoreMessage");
    const $restartBtn = document.getElementById("restartBtn");
    const $difficulty = document.getElementById("difficultySelect");
    const $speedSlider = document.getElementById("speedSlider");
    const $speedValue = document.getElementById("speedValue");
    const $wallCb = document.getElementById("wallCollision");
    const $gridCb = document.getElementById("gridLines");

    const [$up, $left, $right, $down] = [
        "upBtn",
        "leftBtn",
        "rightBtn",
        "downBtn",
    ].map((id) => document.getElementById(id));

    const CELL = 20;
    const GRID_W = canvas.width / CELL;
    const GRID_H = canvas.height / CELL;

    let snake = [];
    let food = {};
    let direction = "right";
    let nextDirection = "right";
    let score = 0;
    let highScore = localStorage.getItem("snakeHighScore") || 0;
    let gameSpeed = 5;
    let gameInterval;
    let isPaused = false;
    let isGameOver = true;
    let wallCollision = true;
    let showGrid = false;

    const DIFFICULTIES = {
        easy: { initialSpeed: 3, growthFactor: 0.2 },
        medium: { initialSpeed: 5, growthFactor: 0.3 },
        hard: { initialSpeed: 7, growthFactor: 0.4 },
        extreme: { initialSpeed: 9, growthFactor: 0.5 },
    };

    $highScore.textContent = highScore;

    function startGame() {
        if (isGameOver) {
            initGame();
        } else if (isPaused) {
            togglePause();
            return;
        }
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 1000 / (gameSpeed * 2));
        $startBtn.disabled = true;
        $pauseBtn.disabled = false;
        isGameOver = false;
        isPaused = false;
    }

    function togglePause() {
        if (isGameOver) return;
        isPaused = !isPaused;

        if (isPaused) {
            clearInterval(gameInterval);
            $pauseBtn.textContent = "Resume";
            $startBtn.disabled = false;
        } else {
            gameInterval = setInterval(gameLoop, 1000 / (gameSpeed * 2));
            $pauseBtn.textContent = "Pause";
            $startBtn.disabled = true;
        }
    }

    function resetGame() {
        clearInterval(gameInterval);
        isGameOver = true;
        isPaused = false;
        $startBtn.disabled = false;
        $pauseBtn.disabled = true;
        $pauseBtn.textContent = "Pause";
        $gameOver.style.display = "none";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (showGrid) drawGrid();
    }

    function initGame() {
        snake = [
            { x: 6, y: 10 },
            { x: 5, y: 10 },
            { x: 4, y: 10 },
        ];
        generateFood();
        score = 0;
        direction = nextDirection = "right";
        isGameOver = false;
        $score.textContent = score;
        updateDifficulty();
        draw();
    }

    function gameLoop() {
        update();
        draw();
    }

    function update() {
        direction = nextDirection;
        const head = { ...snake[0] };

        switch (direction) {
            case "up":
                head.y--;
                break;
            case "down":
                head.y++;
                break;
            case "left":
                head.x--;
                break;
            case "right":
                head.x++;
                break;
        }

        if (wallCollision) {
            if (
                head.x < 0 ||
                head.x >= GRID_W ||
                head.y < 0 ||
                head.y >= GRID_H
            ) {
                gameOver();
                return;
            }
        } else {
            head.x = (head.x + GRID_W) % GRID_W;
            head.y = (head.y + GRID_H) % GRID_H;
        }

        for (let i = 0; i < snake.length - 1; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver();
                return;
            }
        }

        const ateFood = head.x === food.x && head.y === food.y;
        snake.unshift(head);

        if (ateFood) {
            score += 10;
            $score.textContent = score;
            generateFood();
            increaseSpeed();
        } else {
            snake.pop();
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (showGrid) drawGrid();
        drawFood();
        drawSnake();
    }

    function drawGrid() {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= canvas.width; x += CELL) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y += CELL) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function drawSnake() {
        snake.forEach((segment, index) => {
            if (index === 0) {
                ctx.fillStyle = "#70d44b";
            } else {
                const greenValue = 200 - index * 2;
                ctx.fillStyle = `rgb(60, ${Math.max(greenValue, 120)}, 70)`;
            }

            drawRoundedRect(
                segment.x * CELL,
                segment.y * CELL,
                CELL,
                CELL,
                index === 0 ? 8 : 4
            );

            if (index === 0) drawEyes(segment.x, segment.y);
        });
    }

    function drawRoundedRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }

    function drawEyes(x, y) {
        const eyeSize = CELL / 6;
        ctx.fillStyle = "white";

        let eyePositions = [];
        const third = CELL / 3;
        const twoThirds = (CELL * 2) / 3;

        switch (direction) {
            case "up":
                eyePositions = [
                    x * CELL + third - eyeSize / 2,
                    y * CELL + third,
                    x * CELL + twoThirds - eyeSize / 2,
                    y * CELL + third,
                ];
                break;
            case "down":
                eyePositions = [
                    x * CELL + third - eyeSize / 2,
                    y * CELL + twoThirds,
                    x * CELL + twoThirds - eyeSize / 2,
                    y * CELL + twoThirds,
                ];
                break;
            case "left":
                eyePositions = [
                    x * CELL + third,
                    y * CELL + third - eyeSize / 2,
                    x * CELL + third,
                    y * CELL + twoThirds - eyeSize / 2,
                ];
                break;
            case "right":
                eyePositions = [
                    x * CELL + twoThirds,
                    y * CELL + third - eyeSize / 2,
                    x * CELL + twoThirds,
                    y * CELL + twoThirds - eyeSize / 2,
                ];
                break;
        }

        for (let i = 0; i < 2; i++) {
            const [eyeX, eyeY] = [eyePositions[i * 2], eyePositions[i * 2 + 1]];

            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawFood() {
        const centerX = food.x * CELL + CELL / 2;
        const centerY = food.y * CELL + CELL / 2;
        const radius = CELL / 2 - 2;

        ctx.fillStyle = "#ff3b30";
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#8e6c3f";
        ctx.fillRect(centerX - 1, centerY - radius - 3, 2, 4);

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(
            centerX - radius / 3,
            centerY - radius / 3,
            radius / 4,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    function generateFood() {
        let newFood, foodOnSnake;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_W),
                y: Math.floor(Math.random() * GRID_H),
            };
            foodOnSnake = snake.some(
                (seg) => seg.x === newFood.x && seg.y === newFood.y
            );
        } while (foodOnSnake);

        food = newFood;
    }

    function handleKeyPress(e) {
        if (e.code === "Space" && !isGameOver) {
            togglePause();
            return;
        }

        if (e.code === "KeyR") {
            resetGame();
            return;
        }

        if (isPaused || isGameOver) return;

        const dirMap = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
        };

        changeDirection(dirMap[e.code]);
    }

    function changeDirection(newDir) {
        if (!newDir) return;

        const opposites = {
            up: "down",
            down: "up",
            left: "right",
            right: "left",
        };

        if (opposites[direction] === newDir) return;
        nextDirection = newDir;
    }

    function gameOver() {
        clearInterval(gameInterval);
        isGameOver = true;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
            $highScore.textContent = highScore;
            $highMsg.textContent = "New High Score!";
        } else {
            $highMsg.textContent = "";
        }

        $finalScore.textContent = `Score: ${score}`;
        $gameOver.style.display = "flex";
        $startBtn.disabled = false;
        $pauseBtn.disabled = true;
    }

    function updateDifficulty() {
        const difficulty = $difficulty.value;
        const settings = DIFFICULTIES[difficulty];

        $speedSlider.value = settings.initialSpeed;
        gameSpeed = settings.initialSpeed;
        $speedValue.textContent = gameSpeed;

        if (!isGameOver && !isPaused) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 1000 / (gameSpeed * 2));
        }
    }

    function updateSpeed() {
        gameSpeed = parseInt($speedSlider.value);
        $speedValue.textContent = gameSpeed;

        if (!isGameOver && !isPaused) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 1000 / (gameSpeed * 2));
        }
    }

    function increaseSpeed() {
        const difficulty = $difficulty.value;
        const growthFactor = DIFFICULTIES[difficulty].growthFactor;

        if (gameSpeed < 10 && score % (50 / growthFactor) === 0) {
            gameSpeed = Math.min(10, gameSpeed + 0.5);
            $speedSlider.value = gameSpeed;
            $speedValue.textContent = gameSpeed;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 1000 / (gameSpeed * 2));
        }
    }

    $startBtn.addEventListener("click", startGame);
    $pauseBtn.addEventListener("click", togglePause);
    $resetBtn.addEventListener("click", resetGame);
    $restartBtn.addEventListener("click", () => {
        $gameOver.style.display = "none";
        resetGame();
        startGame();
    });

    $difficulty.addEventListener("change", updateDifficulty);
    $speedSlider.addEventListener("input", updateSpeed);
    $wallCb.addEventListener("change", function () {
        wallCollision = this.checked;
    });
    $gridCb.addEventListener("change", function () {
        showGrid = this.checked;
        if (!isGameOver) draw();
        else drawGrid();
    });

    document.addEventListener("keydown", handleKeyPress);

    const directions = ["up", "left", "right", "down"];
    [$up, $left, $right, $down].forEach((btn, i) => {
        btn.addEventListener("click", () => changeDirection(directions[i]));
    });

    if (showGrid) drawGrid();
});

document.addEventListener("DOMContentLoaded", function () {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      .direction-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 20px;
        user-select: none;
      }
      .control-row { 
        display: flex; 
        margin: 5px 0; 
      }
      .control-btn {
        width: 60px;
        height: 60px;
        background-color: #4CAF50;
        color: white;
        font-size: 24px;
        border: none;
        border-radius: 50%;
        margin: 0 5px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 3px 5px rgba(0,0,0,0.2);
      }
      .control-btn:active {
        transform: scale(0.95);
        background-color: #45a049;
      }
      @media (min-width: 769px) {
        .direction-controls { display: none; }
      }
    `;
    document.head.appendChild(styleEl);

    const container = document.createElement("div");
    container.className = "direction-controls";

    const createButton = (arrow, id, dir) => {
        const btn = document.createElement("button");
        btn.className = "control-btn";
        btn.id = id;
        btn.innerHTML = arrow;
        btn.addEventListener("click", () => changeDirection(dir));
        btn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            changeDirection(dir);
        });
        return btn;
    };

    const upRow = document.createElement("div");
    upRow.className = "control-row";
    upRow.appendChild(createButton("↑", "upControl", "up"));

    const middleRow = document.createElement("div");
    middleRow.className = "control-row";
    middleRow.appendChild(createButton("←", "leftControl", "left"));
    middleRow.appendChild(createButton("→", "rightControl", "right"));

    const downRow = document.createElement("div");
    downRow.className = "control-row";
    downRow.appendChild(createButton("↓", "downControl", "down"));

    [upRow, middleRow, downRow].forEach((row) => container.appendChild(row));

    const gameControls = document.querySelector(".game-controls");
    if (gameControls) {
        gameControls.parentNode.insertBefore(
            container,
            gameControls.nextSibling
        );
    } else {
        document.body.appendChild(container);
    }
});
