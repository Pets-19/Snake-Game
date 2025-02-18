document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreElement = document.getElementById("score");
    const highScoreElement = document.getElementById("highScore");
    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const resetBtn = document.getElementById("resetBtn");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScoreElement = document.getElementById("finalScore");
    const highScoreMessage = document.getElementById("highScoreMessage");
    const restartBtn = document.getElementById("restartBtn");
    const difficultySelect = document.getElementById("difficultySelect");
    const speedSlider = document.getElementById("speedSlider");
    const speedValue = document.getElementById("speedValue");
    const wallCollisionCheckbox = document.getElementById("wallCollision");
    const gridLinesCheckbox = document.getElementById("gridLines");

    // Mobile control buttons
    const upBtn = document.getElementById("upBtn");
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const downBtn = document.getElementById("downBtn");

    // Game constants
    const CELL_SIZE = 20;
    const GRID_WIDTH = canvas.width / CELL_SIZE;
    const GRID_HEIGHT = canvas.height / CELL_SIZE;

    // Game state
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
    let wallCollisionEnabled = true;
    let showGridLines = false;

    // Speed mappings
    const difficultySettings = {
        easy: { initialSpeed: 3, growthFactor: 0.2 },
        medium: { initialSpeed: 5, growthFactor: 0.3 },
        hard: { initialSpeed: 7, growthFactor: 0.4 },
        extreme: { initialSpeed: 9, growthFactor: 0.5 },
    };

    // Initialize high score display
    highScoreElement.textContent = highScore;

    // Event listeners for buttons
    startBtn.addEventListener("click", startGame);
    pauseBtn.addEventListener("click", togglePause);
    resetBtn.addEventListener("click", resetGame);
    restartBtn.addEventListener("click", function () {
        gameOverScreen.style.display = "none";
        resetGame();
        startGame();
    });

    // Event listeners for settings
    difficultySelect.addEventListener("change", updateDifficulty);
    speedSlider.addEventListener("input", updateSpeed);
    wallCollisionCheckbox.addEventListener("change", function () {
        wallCollisionEnabled = this.checked;
    });
    gridLinesCheckbox.addEventListener("change", function () {
        showGridLines = this.checked;
        if (!isGameOver) {
            draw();
        } else {
            drawGrid();
        }
    });

    // Keyboard controls
    document.addEventListener("keydown", handleKeyPress);

    // Mobile controls
    upBtn.addEventListener("click", () => changeDirection("up"));
    leftBtn.addEventListener("click", () => changeDirection("left"));
    rightBtn.addEventListener("click", () => changeDirection("right"));
    downBtn.addEventListener("click", () => changeDirection("down"));

    // Initialize the game
    function init() {
        // Set up the initial snake (3 segments in the middle)
        snake = [
            { x: 6, y: 10 },
            { x: 5, y: 10 },
            { x: 4, y: 10 },
        ];

        // Place initial food
        generateFood();

        // Reset game state
        score = 0;
        direction = "right";
        nextDirection = "right";
        isGameOver = false;
        scoreElement.textContent = score;

        // Set difficulty based on settings
        updateDifficulty();

        // Initial draw
        draw();
    }

    function startGame() {
        if (isGameOver) {
            init();
        } else if (isPaused) {
            togglePause();
            return;
        }

        // Clear any existing interval
        clearInterval(gameInterval);

        // Set the game interval based on speed
        const intervalSpeed = 1000 / (gameSpeed * 2);
        gameInterval = setInterval(gameLoop, intervalSpeed);

        // Update button states
        startBtn.disabled = true;
        pauseBtn.disabled = false;

        isGameOver = false;
        isPaused = false;
    }

    function togglePause() {
        if (isGameOver) return;

        isPaused = !isPaused;

        if (isPaused) {
            clearInterval(gameInterval);
            pauseBtn.textContent = "Resume";
            startBtn.disabled = false;
        } else {
            const intervalSpeed = 1000 / (gameSpeed * 2);
            gameInterval = setInterval(gameLoop, intervalSpeed);
            pauseBtn.textContent = "Pause";
            startBtn.disabled = true;
        }
    }

    function resetGame() {
        clearInterval(gameInterval);
        isGameOver = true;
        isPaused = false;

        // Reset UI
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.textContent = "Pause";
        gameOverScreen.style.display = "none";

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid if enabled
        if (showGridLines) {
            drawGrid();
        }
    }

    function gameLoop() {
        update();
        draw();
    }

    function update() {
        // Update direction (from next direction)
        direction = nextDirection;

        // Get the head position
        const head = { ...snake[0] };

        // Calculate new head position based on direction
        switch (direction) {
            case "up":
                head.y -= 1;
                break;
            case "down":
                head.y += 1;
                break;
            case "left":
                head.x -= 1;
                break;
            case "right":
                head.x += 1;
                break;
        }

        // Check wall collision or wrap around
        if (wallCollisionEnabled) {
            if (
                head.x < 0 ||
                head.x >= GRID_WIDTH ||
                head.y < 0 ||
                head.y >= GRID_HEIGHT
            ) {
                gameOver();
                return;
            }
        } else {
            // Wrap around the edges
            head.x = (head.x + GRID_WIDTH) % GRID_WIDTH;
            head.y = (head.y + GRID_HEIGHT) % GRID_HEIGHT;
        }

        // Check self collision (skip the last tail piece since it will move)
        for (let i = 0; i < snake.length - 1; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver();
                return;
            }
        }

        // Check food collision
        const ateFood = head.x === food.x && head.y === food.y;

        // Add new head
        snake.unshift(head);

        if (ateFood) {
            // Increase score
            score += 10;
            scoreElement.textContent = score;

            // Generate new food
            generateFood();

            // Increase speed slightly if not at max
            increaseSpeed();
        } else {
            // Remove tail (snake didn't grow)
            snake.pop();
        }
    }

    function draw() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid if enabled
        if (showGridLines) {
            drawGrid();
        }

        // Draw food
        drawFood();

        // Draw snake
        drawSnake();
    }

    function drawGrid() {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 0.5;

        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function drawSnake() {
        snake.forEach((segment, index) => {
            // Head color is different from body
            if (index === 0) {
                ctx.fillStyle = "#70d44b"; // Bright green for head
            } else {
                // Create gradient effect for body
                const greenValue = 200 - index * 2;
                ctx.fillStyle = `rgb(60, ${Math.max(greenValue, 120)}, 70)`;
            }

            // Draw rounded snake segment
            drawRoundedRect(
                segment.x * CELL_SIZE,
                segment.y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE,
                index === 0 ? 8 : 4 // Head has more rounding
            );

            // Draw eyes on the head
            if (index === 0) {
                drawEyes(segment.x, segment.y);
            }
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
        const eyeSize = CELL_SIZE / 6;
        ctx.fillStyle = "white";

        // Position eyes based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

        switch (direction) {
            case "up":
                leftEyeX = x * CELL_SIZE + CELL_SIZE / 3 - eyeSize / 2;
                leftEyeY = y * CELL_SIZE + CELL_SIZE / 3;
                rightEyeX = x * CELL_SIZE + (CELL_SIZE * 2) / 3 - eyeSize / 2;
                rightEyeY = y * CELL_SIZE + CELL_SIZE / 3;
                break;
            case "down":
                leftEyeX = x * CELL_SIZE + CELL_SIZE / 3 - eyeSize / 2;
                leftEyeY = y * CELL_SIZE + (CELL_SIZE * 2) / 3;
                rightEyeX = x * CELL_SIZE + (CELL_SIZE * 2) / 3 - eyeSize / 2;
                rightEyeY = y * CELL_SIZE + (CELL_SIZE * 2) / 3;
                break;
            case "left":
                leftEyeX = x * CELL_SIZE + CELL_SIZE / 3;
                leftEyeY = y * CELL_SIZE + CELL_SIZE / 3 - eyeSize / 2;
                rightEyeX = x * CELL_SIZE + CELL_SIZE / 3;
                rightEyeY = y * CELL_SIZE + (CELL_SIZE * 2) / 3 - eyeSize / 2;
                break;
            case "right":
                leftEyeX = x * CELL_SIZE + (CELL_SIZE * 2) / 3;
                leftEyeY = y * CELL_SIZE + CELL_SIZE / 3 - eyeSize / 2;
                rightEyeX = x * CELL_SIZE + (CELL_SIZE * 2) / 3;
                rightEyeY = y * CELL_SIZE + (CELL_SIZE * 2) / 3 - eyeSize / 2;
                break;
        }

        // Draw eyes
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw pupils
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawFood() {
        const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;

        // Draw apple body
        ctx.fillStyle = "#ff3b30";
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw apple stem
        ctx.fillStyle = "#8e6c3f";
        ctx.fillRect(centerX - 1, centerY - radius - 3, 2, 4);

        // Draw apple shine
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
        let newFood;
        let foodOnSnake;

        // Keep generating until food is not on snake
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * GRID_WIDTH),
                y: Math.floor(Math.random() * GRID_HEIGHT),
            };

            // Check if food is on snake
            for (let segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);

        food = newFood;
    }

    function handleKeyPress(e) {
        // Handle pause with space bar
        if (e.code === "Space" && !isGameOver) {
            togglePause();
            return;
        }

        // Handle reset with 'R' key
        if (e.code === "KeyR") {
            resetGame();
            return;
        }

        // Only change direction if game is active
        if (isPaused || isGameOver) return;

        changeDirection(getDirectionFromKey(e.code));
    }

    function getDirectionFromKey(keyCode) {
        switch (keyCode) {
            case "ArrowUp":
                return "up";
            case "ArrowDown":
                return "down";
            case "ArrowLeft":
                return "left";
            case "ArrowRight":
                return "right";
            default:
                return null;
        }
    }

    function changeDirection(newDirection) {
        if (!newDirection) return;

        // Prevent 180-degree turns (snake can't go backwards)
        if (
            (direction === "up" && newDirection === "down") ||
            (direction === "down" && newDirection === "up") ||
            (direction === "left" && newDirection === "right") ||
            (direction === "right" && newDirection === "left")
        ) {
            return;
        }

        nextDirection = newDirection;
    }

    function gameOver() {
        clearInterval(gameInterval);
        isGameOver = true;

        // Check if high score was beaten
        const isNewHighScore = score > highScore;
        if (isNewHighScore) {
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
            highScoreElement.textContent = highScore;
            highScoreMessage.textContent = "New High Score!";
        } else {
            highScoreMessage.textContent = "";
        }

        // Update game over screen
        finalScoreElement.textContent = `Score: ${score}`;
        gameOverScreen.style.display = "flex";

        // Reset button states
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    function updateDifficulty() {
        const difficulty = difficultySelect.value;
        const settings = difficultySettings[difficulty];

        // Update speed slider to match difficulty
        speedSlider.value = settings.initialSpeed;
        gameSpeed = settings.initialSpeed;
        speedValue.textContent = gameSpeed;

        // If game is running, update the interval
        if (!isGameOver && !isPaused) {
            clearInterval(gameInterval);
            const intervalSpeed = 1000 / (gameSpeed * 2);
            gameInterval = setInterval(gameLoop, intervalSpeed);
        }
    }

    function updateSpeed() {
        gameSpeed = parseInt(speedSlider.value);
        speedValue.textContent = gameSpeed;

        // If game is running, update the interval
        if (!isGameOver && !isPaused) {
            clearInterval(gameInterval);
            const intervalSpeed = 1000 / (gameSpeed * 2);
            gameInterval = setInterval(gameLoop, intervalSpeed);
        }
    }

    function increaseSpeed() {
        const difficulty = difficultySelect.value;
        const growthFactor = difficultySettings[difficulty].growthFactor;

        // Only increase speed if below the max (10)
        if (gameSpeed < 10) {
            // Calculate new speed based on score
            // More frequent increases at higher difficulties
            if (score % (50 / growthFactor) === 0) {
                gameSpeed = Math.min(10, gameSpeed + 0.5);
                speedSlider.value = gameSpeed;
                speedValue.textContent = gameSpeed;

                // Update game interval
                clearInterval(gameInterval);
                const intervalSpeed = 1000 / (gameSpeed * 2);
                gameInterval = setInterval(gameLoop, intervalSpeed);
            }
        }
    }

    // Initialize with grid if enabled
    if (showGridLines) {
        drawGrid();
    }
});
// Add this CSS to your existing styles
const additionalStyles = `
/* Simple directional controls */
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
box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
}

.control-btn:active {
transform: scale(0.95);
background-color: #45a049;
}

/* Add media query to only show on smaller screens */
@media (min-width: 769px) {
.direction-controls {
display: none;
}
}
`;

// Create style element and add to document
function addControlStyles() {
    const styleElement = document.createElement("style");
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
}

// Create the control buttons
function createDirectionControls() {
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "direction-controls";

    // Up button row
    const upRow = document.createElement("div");
    upRow.className = "control-row";
    const upBtn = document.createElement("button");
    upBtn.className = "control-btn";
    upBtn.innerHTML = "↑";
    upBtn.id = "upControl";
    upRow.appendChild(upBtn);

    // Middle row (left and right)
    const middleRow = document.createElement("div");
    middleRow.className = "control-row";
    const leftBtn = document.createElement("button");
    leftBtn.className = "control-btn";
    leftBtn.innerHTML = "←";
    leftBtn.id = "leftControl";

    const rightBtn = document.createElement("button");
    rightBtn.className = "control-btn";
    rightBtn.innerHTML = "→";
    rightBtn.id = "rightControl";

    middleRow.appendChild(leftBtn);
    middleRow.appendChild(rightBtn);

    // Down button row
    const downRow = document.createElement("div");
    downRow.className = "control-row";
    const downBtn = document.createElement("button");
    downBtn.className = "control-btn";
    downBtn.innerHTML = "↓";
    downBtn.id = "downControl";
    downRow.appendChild(downBtn);

    // Add rows to container
    controlsContainer.appendChild(upRow);
    controlsContainer.appendChild(middleRow);
    controlsContainer.appendChild(downRow);

    // Add to page after game controls
    const gameControls = document.querySelector(".game-controls");
    if (gameControls) {
        gameControls.parentNode.insertBefore(
            controlsContainer,
            gameControls.nextSibling
        );
    } else {
        document.body.appendChild(controlsContainer);
    }

    // Add event listeners
    upBtn.addEventListener("click", () => changeDirection("up"));
    leftBtn.addEventListener("click", () => changeDirection("left"));
    rightBtn.addEventListener("click", () => changeDirection("right"));
    downBtn.addEventListener("click", () => changeDirection("down"));

    // Add touch events for mobile
    [upBtn, leftBtn, rightBtn, downBtn].forEach((btn) => {
        btn.addEventListener("touchstart", (e) => {
            e.preventDefault(); // Prevent default to avoid double actions
            const direction = btn.id.replace("Control", "");
            changeDirection(direction);
        });
    });
}

// Initialize when document is loaded
document.addEventListener("DOMContentLoaded", function () {
    addControlStyles();
    createDirectionControls();
});
