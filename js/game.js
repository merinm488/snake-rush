/**
 * Game System for Snake Rush
 * Core game logic including game loop, collision detection, state management
 * Levels, obstacles, bonuses, and wait-for-input state
 */

const Game = (function() {
    // Game state
    let snake = [];
    let food = { x: 0, y: 0 };
    let goldenFruit = null;
    let goldenFruitTimer = null;
    let obstacles = [];
    let movingObstacles = [];
    let score = 0;
    let startingScore = 0; // Score carried over from previous level in levels mode
    let bonusPoints = 0;
    let highScore = 0;
    let level = 1;
    let unlockedLevels = 1;
    let isRunning = false;
    let isPaused = false;
    let waitingToStart = true;
    let waitingToResume = false;
    let gameLoopId = null;
    let lastUpdateTime = 0;
    let levelCompleted = false;
    let gameOver = false;
    let gameOverTimer = null;
    let gameMode = 'levels'; // 'endless' or 'levels'

    // Game settings
    let settings = {
        theme: 'classic',
        fruitType: 'apple',
        difficulty: 'easy'
    };

    // Difficulty settings (milliseconds per frame)
    const DIFFICULTY_SPEEDS = {
        easy: 280,
        medium: 220,
        hard: 170
    };

    let tileCountX = 20;
    let tileCountY = 20;

    // Level definitions
    const LEVELS = {
        1: { obstacles: [], movingObstacles: [], targetScore: 100 },
        2: { obstacles: [{ x: 5, y: 5 }, { x: 14, y: 14 }, { x: 10, y: 10 }], movingObstacles: [], targetScore: 100 },
        3: {
            obstacles: [
                { x: 3, y: 3 }, { x: 16, y: 3 },
                { x: 3, y: 16 }, { x: 16, y: 16 },
                { x: 9, y: 9 }, { x: 10, y: 10 }
            ],
            movingObstacles: [],
            targetScore: 100
        },
        4: {
            obstacles: [
                { x: 2, y: 5 }, { x: 17, y: 5 },
                { x: 2, y: 14 }, { x: 17, y: 14 },
                { x: 7, y: 10 }, { x: 12, y: 10 },
                { x: 9, y: 7 }, { x: 10, y: 13 }
            ],
            movingObstacles: [
                { x: 5, y: 10, dx: 1, dy: 0, minX: 5, maxX: 14 },
                { x: 14, y: 10, dx: -1, dy: 0, minX: 5, maxX: 14 }
            ],
            targetScore: 100
        },
        5: {
            obstacles: [
                { x: 1, y: 5 }, { x: 18, y: 5 },
                { x: 1, y: 14 }, { x: 18, y: 14 },
                { x: 5, y: 1 }, { x: 14, y: 1 },
                { x: 5, y: 18 }, { x: 14, y: 18 },
                { x: 9, y: 9 }, { x: 10, y: 10 },
                { x: 9, y: 10 }, { x: 10, y: 9 }
            ],
            movingObstacles: [
                { x: 5, y: 10, dx: 1, dy: 0, minX: 5, maxX: 14 },
                { x: 14, y: 10, dx: -1, dy: 0, minX: 5, maxX: 14 },
                { x: 10, y: 5, dx: 0, dy: 1, minY: 5, maxY: 14 }
            ],
            targetScore: 100
        }
    };

    // Game state callbacks
    let onGameOver = null;
    let onScoreUpdate = null;
    let onLevelUpdate = null;
    let onLevelComplete = null;

    /**
     * Initialize the game
     */
    function init() {
        loadSettings();
        loadLevelProgress();
        highScore = parseInt(localStorage.getItem('snakeRushHighScore')) || 0;
        updateHighScoreDisplay();
    }

    /**
     * Load settings from localStorage
     */
    function loadSettings() {
        const saved = localStorage.getItem('snakeRushSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            settings = {
                theme: parsed.theme || 'classic',
                fruitType: parsed.fruitType || 'apple',
                difficulty: parsed.difficulty || 'easy'
            };
        }
        applySettings();
    }

    /**
     * Load level progress
     */
    function loadLevelProgress() {
        const saved = localStorage.getItem('snakeRushUnlockedLevels');
        unlockedLevels = saved ? parseInt(saved) : 1;
    }

    /**
     * Save level progress
     */
    function saveLevelProgress() {
        localStorage.setItem('snakeRushUnlockedLevels', unlockedLevels.toString());
    }

    /**
     * Save settings to localStorage
     */
    function saveSettings() {
        localStorage.setItem('snakeRushSettings', JSON.stringify(settings));
    }

    /**
     * Apply current settings
     */
    function applySettings() {
        document.body.className = `theme-${settings.theme}`;
        Renderer.updateColors();
    }

    /**
     * Get current settings
     */
    function getSettings() {
        return { ...settings };
    }

    /**
     * Update a setting
     */
    function updateSetting(key, value) {
        settings[key] = value;
        saveSettings();
        applySettings();
    }

    /**
     * Get unlocked levels
     */
    function getUnlockedLevels() {
        return unlockedLevels;
    }

    /**
     * Get level info
     */
    function getLevelInfo(levelNum) {
        return LEVELS[levelNum] || LEVELS[5];
    }

    /**
     * Initialize a new game
     */
    function initGame(levelNum = 1, startingScoreParam = 0) {
        level = levelNum;
        const levelData = LEVELS[level] || LEVELS[1];

        // Force canvas to resize first, then get grid dimensions
        Renderer.resizeCanvas();
        tileCountX = Renderer.getTileCountX ? Renderer.getTileCountX() : 20;
        tileCountY = Renderer.getTileCountY ? Renderer.getTileCountY() : 20;

        // Initialize snake in the middle
        const startX = Math.floor(tileCountX / 2);
        const startY = Math.floor(tileCountY / 2);

        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        startingScore = startingScoreParam;
        score = startingScoreParam;
        bonusPoints = 0;
        isPaused = false;
        waitingToStart = true;
        levelCompleted = false;
        gameOver = false;

        // Clear any pending game over timer
        if (gameOverTimer) {
            clearTimeout(gameOverTimer);
            gameOverTimer = null;
        }

        // Set obstacles
        obstacles = [...(levelData.obstacles || [])];
        movingObstacles = (levelData.movingObstacles || []).map(obs => ({ ...obs }));

        // Reset input direction
        InputSystem.reset();

        // Place initial food
        placeFood();

        // Start golden fruit spawner
        startGoldenFruitSpawner();

        // Calculate cumulative target score for levels mode
        const cumulativeTarget = gameMode === 'levels' ? (level * levelData.targetScore) : levelData.targetScore;

        // Update displays
        if (onScoreUpdate) onScoreUpdate(score);
        // Only update level display in levels mode
        if (onLevelUpdate && gameMode === 'levels') onLevelUpdate(level, cumulativeTarget);
    }

    /**
     * Start golden fruit spawner
     */
    function startGoldenFruitSpawner() {
        if (goldenFruitTimer) clearInterval(goldenFruitTimer);

        goldenFruitTimer = setInterval(() => {
            if (!isRunning || isPaused || waitingToStart || goldenFruit) return;

            // 5% chance to spawn golden fruit
            if (Math.random() < 0.05) {
                placeGoldenFruit();

                // Remove after 5 seconds
                setTimeout(() => {
                    goldenFruit = null;
                }, 5000);
            }
        }, 3000);
    }

    /**
     * Place food at a random position
     */
    function placeFood() {
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < 100) {
            food = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };

            validPosition = !isPositionOccupied(food.x, food.y);
            attempts++;
        }
    }

    /**
     * Place golden fruit at a random position
     */
    function placeGoldenFruit() {
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < 100) {
            goldenFruit = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };

            // Don't spawn too close to regular food
            const distFromFood = Math.abs(goldenFruit.x - food.x) + Math.abs(goldenFruit.y - food.y);

            validPosition = !isPositionOccupied(goldenFruit.x, goldenFruit.y) && distFromFood >= 3;
            attempts++;
        }
    }

    /**
     * Check if position is occupied
     */
    function isPositionOccupied(x, y) {
        // Check snake
        if (snake.some(segment => segment.x === x && segment.y === y)) return true;

        // Check obstacles
        if (obstacles.some(obs => obs.x === x && obs.y === y)) return true;

        // Check moving obstacles
        if (movingObstacles.some(obs => obs.x === x && obs.y === y)) return true;

        return false;
    }

    /**
     * Start the game
     */
    function start(levelNum = 1, gameOverCallback, scoreCallback, levelCallback, levelCompleteCallback, mode = 'levels', startingScoreParam = 0) {
        onGameOver = gameOverCallback;
        onScoreUpdate = scoreCallback;
        onLevelUpdate = levelCallback;
        onLevelComplete = levelCompleteCallback;
        gameMode = mode;

        initGame(levelNum, startingScoreParam);
        isRunning = true;

        InputSystem.init();

        AudioSystem.init();
        AudioSystem.startBGM();

        lastUpdateTime = performance.now();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    /**
     * Actually start moving (called after user input)
     */
    function startMoving() {
        waitingToStart = false;
        waitingToResume = false;
    }

    /**
     * Main game loop
     */
    function gameLoop(currentTime) {
        if (!isRunning) return;

        gameLoopId = requestAnimationFrame(gameLoop);

        if (isPaused || waitingToStart || waitingToResume || gameOver) {
            render();
            return;
        }

        // Update moving obstacles
        updateMovingObstacles();

        const gameSpeed = DIFFICULTY_SPEEDS[settings.difficulty];
        const deltaTime = currentTime - lastUpdateTime;

        if (deltaTime >= gameSpeed) {
            lastUpdateTime = currentTime - (deltaTime % gameSpeed);
            update();
            render();
        }
    }

    /**
     * Update moving obstacles
     */
    function updateMovingObstacles() {
        movingObstacles.forEach(obs => {
            obs.x += obs.dx;
            obs.y += obs.dy;

            // Reverse direction at boundaries
            if (obs.minX !== undefined && obs.x <= obs.minX) {
                obs.dx = 1;
            } else if (obs.maxX !== undefined && obs.x >= obs.maxX) {
                obs.dx = -1;
            }
            if (obs.minY !== undefined && obs.y <= obs.minY) {
                obs.dy = 1;
            } else if (obs.maxY !== undefined && obs.y >= obs.maxY) {
                obs.dy = -1;
            }
        });
    }

    /**
     * Update game state
     */
    function update() {
        InputSystem.updateDirection();

        const direction = InputSystem.getCurrentDirection();
        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            handleGameOver();
            return;
        }

        // Check self collision
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            handleGameOver();
            return;
        }

        // Check obstacle collision
        if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
            handleGameOver();
            return;
        }

        // Check moving obstacle collision
        if (movingObstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
            handleGameOver();
            return;
        }

        snake.unshift(head);

        // Check golden fruit collision
        if (goldenFruit && head.x === goldenFruit.x && head.y === goldenFruit.y) {
            score += 50;
            goldenFruit = null;
            AudioSystem.playGoldenFruit();

            if (onScoreUpdate) onScoreUpdate(score);
            placeFood();
            return;
        }

        // Check regular food collision
        if (head.x === food.x && head.y === food.y) {
            score += 10;

            if (onScoreUpdate) onScoreUpdate(score);

            AudioSystem.playEat();
            Renderer.triggerEatAnimation();

            // Check level completion (only in levels mode)
            const levelData = LEVELS[level] || LEVELS[1];
            const cumulativeTarget = level * levelData.targetScore;
            if (gameMode === 'levels' && score >= cumulativeTarget && !levelCompleted) {
                levelCompleted = true;
                handleLevelComplete();
                return;
            }

            placeFood();
        } else {
            snake.pop();
        }
    }

    /**
     * Handle level complete
     */
    function handleLevelComplete() {
        isRunning = false;
        cancelAnimationFrame(gameLoopId);
        clearInterval(goldenFruitTimer);
        AudioSystem.stopBGM();
        AudioSystem.playLevelComplete();

        const levelData = LEVELS[level] || LEVELS[1];
        const cumulativeTarget = level * levelData.targetScore;

        if (level < unlockedLevels) {
            // Already unlocked
        } else if (level === unlockedLevels) {
            // Unlock next level
            unlockedLevels = level + 1;
            saveLevelProgress();
        }

        // Show level complete screen
        if (onLevelComplete) {
            onLevelComplete(score, cumulativeTarget, level);
        }
    }

    /**
     * Handle game over
     */
    function handleGameOver() {
        gameOver = true;
        clearInterval(goldenFruitTimer);
        AudioSystem.stopBGM();
        AudioSystem.playGameOver();

        const levelData = LEVELS[level] || LEVELS[1];
        const isNewHighScore = score > highScore;

        if (isNewHighScore) {
            highScore = score;
            localStorage.setItem('snakeRushHighScore', highScore);
            updateHighScoreDisplay();
            AudioSystem.playHighScore();
        }

        // Check if level was completed
        if (levelCompleted && level < unlockedLevels) {
            // Already handled
        } else if (levelCompleted && level === unlockedLevels) {
            // Unlock next level
            unlockedLevels = level + 1;
            saveLevelProgress();
            AudioSystem.playLevelComplete();
        }

        // Delay showing game over screen so user can see how they died
        gameOverTimer = setTimeout(() => {
            isRunning = false;
            cancelAnimationFrame(gameLoopId);
            if (onGameOver) {
                onGameOver(score, highScore, isNewHighScore, levelCompleted, level, levelData.targetScore, bonusPoints);
            }
        }, 1500); // 1.5 second delay
    }

    /**
     * Render the game
     */
    function render() {
        Renderer.render({
            snake,
            food,
            goldenFruit,
            fruitType: settings.fruitType,
            obstacles,
            movingObstacles,
            paused: isPaused,
            waitingToStart,
            waitingToResume
        });
    }

    /**
     * Toggle pause state
     */
    function togglePause() {
        if (!isRunning || waitingToStart) return false;

        isPaused = !isPaused;

        if (isPaused) {
            AudioSystem.playPause();
        } else {
            // Unpausing - wait for user input before moving
            waitingToResume = true;
            InputSystem.resetFirstInput();
            AudioSystem.playResume();
        }

        return isPaused;
    }

    /**
     * Resume from pause
     */
    function resume() {
        isPaused = false;
        waitingToResume = true;
        InputSystem.resetFirstInput();
        AudioSystem.playResume();
    }

    /**
     * Quit the game
     */
    function quit() {
        isRunning = false;
        isPaused = false;
        gameOver = false;
        cancelAnimationFrame(gameLoopId);
        clearInterval(goldenFruitTimer);
        if (gameOverTimer) {
            clearTimeout(gameOverTimer);
            gameOverTimer = null;
        }
        AudioSystem.stopBGM();
        InputSystem.destroy();
    }

    /**
     * Update high score display in menu
     */
    function updateHighScoreDisplay() {
        const display = document.getElementById('highScoreMenu');
        if (display) {
            display.textContent = highScore;
        }
    }

    /**
     * Get current game state
     */
    function getState() {
        return {
            snake,
            food,
            goldenFruit,
            obstacles,
            movingObstacles,
            score,
            isRunning,
            isPaused,
            waitingToStart,
            level,
            levelCompleted
        };
    }

    /**
     * Check if waiting to start
     */
    function isWaitingToStart() {
        return waitingToStart;
    }

    return {
        init,
        start,
        startMoving,
        quit,
        togglePause,
        resume,
        getSettings,
        updateSetting,
        applySettings,
        getState,
        isWaitingToStart,
        getUnlockedLevels,
        getLevelInfo,
        LEVELS
    };
})();
