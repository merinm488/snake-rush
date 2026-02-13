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
    let gameMode = 'levels'; // 'endless', 'levels', or 'time'

    // Time Mode specific state
    let timeRemaining = 60; // Starting time in seconds
    let timerInterval = null;
    let foods = []; // Multiple fruits for Time Mode
    let poisons = []; // Poison items (tamarind)
    let clockPowerUp = null; // Clock power-up

    // Developer debug mode - for testing features during development
    let debugMode = false;

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

    // Fruit point values for Time Mode
    const FRUIT_POINTS = {
        strawberry: 50,
        cherry: 40,
        apple: 30,
        grape: 20,
        orange: 10
    };

    // Fruit lifespan in milliseconds (longer for low value, shorter for high value)
    const FRUIT_LIFESPAN = {
        strawberry: 7000,  // 7 seconds - rare fruit disappears quickly
        cherry: 8000,        // 8 seconds
        apple: 10000,        // 10 seconds
        grape: 10000,        // 10 seconds
        orange: 10000         // 10 seconds - common fruit stays longer
    };

    // Poison penalty
    const POISON_PENALTY = -60;

    // Clock power-up bonus time
    const CLOCK_BONUS = 15;

    let tileCountX = 20;
    let tileCountY = 20;

    // Level definitions
    const LEVELS = {
        1: { obstacles: [], movingObstacles: [], targetScore: 100 },
        2: {
            obstacles: [
                { x: 6, y: 6 }, { x: 23, y: 6 },
                { x: 4, y: 14 }, { x: 25, y: 14 },
                { x: 9, y: 22 }, { x: 20, y: 22 },
                { x: 14, y: 28 }
            ],
            movingObstacles: [],
            targetScore: 100
        },
        3: {
            obstacles: [
                { x: 5, y: 4 }, { x: 24, y: 4 },
                { x: 7, y: 10 }, { x: 22, y: 10 },
                { x: 4, y: 17 }, { x: 25, y: 17 },
                { x: 10, y: 23 }, { x: 19, y: 23 },
                { x: 14, y: 29 }, { x: 15, y: 29 },
                { x: 8, y: 13 }, { x: 21, y: 13 }
            ],
            movingObstacles: [],
            targetScore: 100
        },
        4: {
            obstacles: [
                { x: 3, y: 5 }, { x: 26, y: 5 },
                { x: 3, y: 15 }, { x: 26, y: 15 },
                { x: 3, y: 25 }, { x: 26, y: 25 },
                { x: 10, y: 10 }, { x: 19, y: 10 },
                { x: 10, y: 20 }, { x: 19, y: 20 },
                { x: 14, y: 7 }, { x: 15, y: 28 }
            ],
            movingObstacles: [
                { x: 7, y: 12, dx: 1, dy: 0, minX: 7, maxX: 22 },
                { x: 22, y: 20, dx: -1, dy: 0, minX: 7, maxX: 22 }
            ],
            targetScore: 100
        },
        5: {
            obstacles: [
                { x: 2, y: 3 }, { x: 27, y: 3 },
                { x: 2, y: 12 }, { x: 27, y: 12 },
                { x: 2, y: 21 }, { x: 27, y: 21 },
                { x: 2, y: 30 }, { x: 27, y: 30 },
                { x: 7, y: 6 }, { x: 22, y: 6 },
                { x: 7, y: 18 }, { x: 22, y: 18 },
                { x: 14, y: 13 }, { x: 15, y: 13 },
                { x: 14, y: 24 }, { x: 15, y: 24 }
            ],
            movingObstacles: [
                { x: 7, y: 9, dx: 1, dy: 0, minX: 7, maxX: 22 },
                { x: 22, y: 15, dx: -1, dy: 0, minX: 7, maxX: 22 },
                { x: 14, y: 5, dx: 0, dy: 1, minY: 5, maxY: 25 }
            ],
            targetScore: 100
        }
    };

    // Game state callbacks
    let onGameOver = null;
    let onScoreUpdate = null;
    let onLevelUpdate = null;
    let onLevelComplete = null;
    let onTimerUpdate = null;

    /**
     * Initialize the game
     */
    function init() {
        loadSettings();
        loadLevelProgress();
        highScore = parseInt(localStorage.getItem('snakeRushHighScore')) || 0;
        updateHighScoreDisplay();

        // Set up debug mode toggle for input system
        window.toggleDebugMode = toggleDebugMode;
        updateDebugIndicator();
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

        // Clear Time Mode specific arrays
        foods = [];
        poisons = [];
        clockPowerUp = null;

        // Reset timer to 60s for Time Mode
        if (gameMode === 'time') {
            timeRemaining = 60;
            // Immediately update the display to show 60s
            if (onTimerUpdate) {
                onTimerUpdate(timeRemaining);
            }
        }

        if (gameMode === 'time') {
            // Time Mode: Multiple fruits, poisons, clocks, no golden fruit
            spawnMultipleFoods(5); // Start with 5 fruits
            startPoisonSpawner();
            startClockSpawner();
            startTimer();
            // Set default food (for renderer compatibility)
            food = { x: -1, y: -1 };
        } else {
            // Endless/Levels Mode: Single food, golden fruit
            placeFood();
            startGoldenFruitSpawner();
        }

        // Calculate cumulative target score for levels mode
        const cumulativeTarget = gameMode === 'levels' ? (level * levelData.targetScore) : levelData.targetScore;

        // Update displays
        if (onScoreUpdate) onScoreUpdate(score);
        // Only update level display in levels mode
        if (onLevelUpdate && gameMode === 'levels') onLevelUpdate(level, cumulativeTarget);
    }

    /**
     * Start golden fruit spawner
     * In debug mode: spawns every 2 seconds (for testing)
     * Normal mode: 10% chance every 3 seconds
     */
    function startGoldenFruitSpawner() {
        if (goldenFruitTimer) clearInterval(goldenFruitTimer);

        const interval = debugMode ? 2000 : 3000; // Faster in debug mode

        goldenFruitTimer = setInterval(() => {
            if (!isRunning || isPaused || waitingToStart || waitingToResume || goldenFruit) return;

            if (debugMode) {
                // Debug mode: always spawn
                placeGoldenFruit();
                // Remove after 8 seconds (longer for testing)
                setTimeout(() => {
                    goldenFruit = null;
                }, 8000);
            } else {
                // Normal: 10% chance to spawn
                if (Math.random() < 0.10) {
                    placeGoldenFruit();
                    // Remove after 6 seconds (gave more time to reach it)
                    setTimeout(() => {
                        goldenFruit = null;
                    }, 6000);
                }
            }
        }, interval);
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

        // Create spawn pulse effect
        if (goldenFruit) {
            createSpawnEffect(goldenFruit.x, goldenFruit.y, 'golden');
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

        // Check existing foods (for Time Mode multiple fruits)
        if (foods.some(f => f.x === x && f.y === y)) return true;

        // Check poisons (for Time Mode)
        if (poisons.some(p => p.x === x && p.y === y)) return true;

        // Check clock power-up (for Time Mode)
        if (clockPowerUp && clockPowerUp.x === x && clockPowerUp.y === y) return true;

        return false;
    }

    /**
     * Spawn multiple fruits for Time Mode
     * Uses weighted random: lower value fruits more common, high value rarer
     */
    function spawnMultipleFoods(count) {
        // Weighted fruit types - add more entries for more common fruits
        const weightedFruitTypes = [
            'orange', 'orange', 'orange', 'orange',  // 10 pts - most common
            'grape', 'grape', 'grape', 'grape',        // 20 pts - same as orange
            'apple', 'apple', 'apple', 'apple',        // 30 pts - same as orange/grape
            'cherry', 'cherry',                         // 40 pts - half frequency of common ones
            'strawberry'                                 // 50 pts - rarest (quarter frequency)
        ];
        foods = [];

        for (let i = 0; i < count; i++) {
            const type = weightedFruitTypes[Math.floor(Math.random() * weightedFruitTypes.length)];
            let validPosition = false;
            let attempts = 0;
            let newFood = null;

            while (!validPosition && attempts < 100) {
                newFood = {
                    x: Math.floor(Math.random() * tileCountX),
                    y: Math.floor(Math.random() * tileCountY),
                    type: type,
                    points: FRUIT_POINTS[type],
                    spawnTime: Date.now(),
                    lifespan: FRUIT_LIFESPAN[type]
                };

                // Check if this position is occupied by any existing food
                const occupied = foods.some(f => f.x === newFood.x && f.y === newFood.y);
                validPosition = !occupied;
                attempts++;
            }

            if (validPosition) {
                foods.push(newFood);
            }
        }
    }

    /**
     * Replenish fruits in Time Mode (maintain count)
     */
    function replenishFoods() {
        const targetCount = 5;
        if (foods.length < targetCount) {
            const needed = targetCount - foods.length;
            // Weighted fruit types - add more entries for more common fruits
            const weightedFruitTypes = [
                'orange', 'orange', 'orange', 'orange',  // 10 pts - most common
                'grape', 'grape', 'grape', 'grape',        // 20 pts - same as orange
                'apple', 'apple', 'apple', 'apple',        // 30 pts - same as orange/grape
                'cherry', 'cherry',                         // 40 pts - half frequency of common ones
                'strawberry'                                 // 50 pts - rarest (quarter frequency)
            ];
            for (let i = 0; i < needed; i++) {
                const type = weightedFruitTypes[Math.floor(Math.random() * weightedFruitTypes.length)];
                let validPosition = false;
                let attempts = 0;
                let newFood = null;

                while (!validPosition && attempts < 100) {
                    newFood = {
                        x: Math.floor(Math.random() * tileCountX),
                        y: Math.floor(Math.random() * tileCountY),
                        type: type,
                        points: FRUIT_POINTS[type],
                        spawnTime: Date.now(),
                        lifespan: FRUIT_LIFESPAN[type]
                    };

                    validPosition = !isPositionOccupied(newFood.x, newFood.y);
                    attempts++;
                }

                if (validPosition) {
                    foods.push(newFood);
                }
            }
        }
    }

    /**
     * Start poison spawner for Time Mode
     * Spawns tamarind at random intervals
     */
    function startPoisonSpawner() {
        if (goldenFruitTimer) {
            // Reuse the timer variable for Time Mode spawning
            clearInterval(goldenFruitTimer);
        }

        const interval = debugMode ? 3000 : 5000; // Spawn poison every 5 seconds (3s in debug)

        goldenFruitTimer = setInterval(() => {
            if (!isRunning || isPaused || waitingToStart || waitingToResume) return;

            // Spawn 2-3 poisons with different lifespans so they disappear at different times
            const poisonCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 poisons
            const lifespans = [6000, 8000, 10000]; // Different lifespans in milliseconds

            for (let i = 0; i < poisonCount; i++) {
                const lifespan = lifespans[i % lifespans.length];
                placePoison(lifespan);
            }
        }, interval);
    }

    /**
     * Place a poison item at random position with specified lifespan
     */
    function placePoison(lifespan = 8000) {
        let validPosition = false;
        let attempts = 0;
        let poison = null;

        while (!validPosition && attempts < 100) {
            poison = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY),
                spawnTime: Date.now(),
                lifespan: lifespan
            };

            validPosition = !isPositionOccupied(poison.x, poison.y);
            attempts++;
        }

        if (validPosition) {
            poisons.push(poison);
        }
    }

    /**
     * Start clock power-up spawner for Time Mode
     */
    function startClockSpawner() {
        const interval = debugMode ? 5000 : 10000; // Spawn clock every 10 seconds (5s in debug)

        if (!window.clockSpawnerInterval) {
            window.clockSpawnerInterval = setInterval(() => {
                if (!isRunning || isPaused || waitingToStart || waitingToResume || clockPowerUp) return;

                if (debugMode || Math.random() < 0.25) { // 25% chance
                    placeClock();
                    // Remove clock after 6 seconds
                    setTimeout(() => {
                        clockPowerUp = null;
                    }, 6000);
                }
            }, interval);
        }
    }

    /**
     * Place a clock power-up at random position
     */
    function placeClock() {
        let validPosition = false;
        let attempts = 0;
        let clock = null;

        while (!validPosition && attempts < 100) {
            clock = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };

            validPosition = !isPositionOccupied(clock.x, clock.y);
            attempts++;
        }

        if (validPosition) {
            clockPowerUp = clock;
        }
    }

    /**
     * Create spawn effect at grid position
     */
    function createSpawnEffect(gridX, gridY, type = 'golden') {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const cellWidth = canvasRect.width / tileCountX;
        const cellHeight = canvasRect.height / tileCountY;

        // Calculate position in pixels relative to canvas
        const x = gridX * cellWidth + cellWidth / 2;
        const y = gridY * cellHeight + cellHeight / 2;

        // Create spawn effect element
        const spawnEffect = document.createElement('div');
        spawnEffect.className = `golden-spawn`;
        spawnEffect.style.left = `${x}px`;
        spawnEffect.style.top = `${y}px`;
        spawnEffect.style.width = `${cellWidth * 2}px`;
        spawnEffect.style.height = `${cellWidth * 2}px`;

        // Get the game container and position the effect absolutely
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.position = 'relative';
            spawnEffect.style.position = 'absolute';
            gameContainer.appendChild(spawnEffect);

            // Remove after animation completes
            setTimeout(() => {
                if (spawnEffect.parentNode) {
                    spawnEffect.parentNode.removeChild(spawnEffect);
                }
            }, 1000);
        }
    }

    /**
     * Create explosion effect at grid position
     */
    function createExplosion(gridX, gridY, type = 'wall') {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const cellWidth = canvasRect.width / tileCountX;
        const cellHeight = canvasRect.height / tileCountY;

        // Calculate position in pixels relative to canvas
        const x = gridX * cellWidth + cellWidth / 2;
        const y = gridY * cellHeight + cellHeight / 2;

        // Create explosion element
        const explosion = document.createElement('div');
        explosion.className = `explosion-particle ${type}`;
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        explosion.style.width = `${cellWidth}px`;
        explosion.style.height = `${cellHeight}px`;

        // Get the game container and position the explosion absolutely
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.position = 'relative';
            explosion.style.position = 'absolute';
            gameContainer.appendChild(explosion);

            // Remove after animation completes
            setTimeout(() => {
                if (explosion.parentNode) {
                    explosion.parentNode.removeChild(explosion);
                }
            }, 600);
        }
    }

    /**
     * Start the timer for Time Mode
     */
    function startTimer() {
        stopTimer(); // Clear any existing timer
        timeRemaining = 60; // Reset to 60 seconds

        timerInterval = setInterval(() => {
            if (!isPaused && !waitingToStart && !waitingToResume && isRunning) {
                timeRemaining--;
                updateTimerDisplay();

                if (timeRemaining <= 0) {
                    handleTimeUp();
                }
            }
        }, 1000);
    }

    /**
     * Stop the timer
     */
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /**
     * Update timer display (called from UI)
     */
    function updateTimerDisplay() {
        // This will be called from UI system
        if (onTimerUpdate && gameMode === 'time') {
            onTimerUpdate(timeRemaining);
        }
    }

    /**
     * Handle time's up event
     */
    function handleTimeUp() {
        stopTimer();
        gameOver = true;
        isRunning = false;
        clearInterval(goldenFruitTimer);
        AudioSystem.stopBGM();
        AudioSystem.playGameOver();

        // Check for high score
        const isNewHighScore = score > highScore;
        if (isNewHighScore) {
            highScore = score;
            localStorage.setItem('snakeRushHighScore', highScore);
            updateHighScoreDisplay();
            AudioSystem.playHighScore();
        }

        if (onGameOver) {
            onGameOver(score, highScore, isNewHighScore, false, 1, 0, 0);
        }
    }

    /**
     * Start the game
     */
    function start(levelNum = 1, gameOverCallback, scoreCallback, levelCallback, levelCompleteCallback, mode = 'levels', startingScoreParam = 0, timerCallback = null) {
        onGameOver = gameOverCallback;
        onScoreUpdate = scoreCallback;
        onLevelUpdate = levelCallback;
        onLevelComplete = levelCompleteCallback;
        onTimerUpdate = timerCallback;
        gameMode = mode;

        // Force fruit type to apple in endless and level modes
        if (mode !== 'time') {
            settings.fruitType = 'apple';
            saveSettings();
            applySettings();
        }

        initGame(levelNum, startingScoreParam);
        isRunning = true;

        InputSystem.init(() => {
            Game.startMoving();
        });

        AudioSystem.init();
        AudioSystem.startBGM();

        lastUpdateTime = performance.now();
        gameLoopId = requestAnimationFrame(gameLoop);
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
            // Create explosion at wall hit position
            const hitX = Math.max(0, Math.min(head.x, tileCountX - 1));
            const hitY = Math.max(0, Math.min(head.y, tileCountY - 1));
            createExplosion(hitX, hitY, 'wall');
            handleGameOver('wall');
            return;
        }

        // Check self collision
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            handleGameOver('self');
            return;
        }

        // Check obstacle collision
        if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
            createExplosion(head.x, head.y, 'wall');
            handleGameOver('obstacle');
            return;
        }

        // Check moving obstacle collision
        if (movingObstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
            createExplosion(head.x, head.y, 'wall');
            handleGameOver('obstacle');
            return;
        }

        snake.unshift(head);

        // Remove expired fruits in Time Mode
        if (gameMode === 'time') {
            const now = Date.now();
            const initialCount = foods.length;
            foods = foods.filter(f => now - f.spawnTime < f.lifespan);
            // Spawn replacement fruits if any expired
            if (foods.length < initialCount) {
                const needed = 5 - foods.length;
                if (needed > 0) {
                    // Use weighted spawning to replace expired fruits
                    const weightedFruitTypes = [
                        'orange', 'orange', 'orange', 'orange',
                        'grape', 'grape', 'grape', 'grape',
                        'apple', 'apple', 'apple', 'apple',
                        'cherry', 'cherry',
                        'strawberry'
                    ];
                    for (let i = 0; i < needed; i++) {
                        const type = weightedFruitTypes[Math.floor(Math.random() * weightedFruitTypes.length)];
                        let validPosition = false;
                        let attempts = 0;
                        let newFood = null;

                        while (!validPosition && attempts < 100) {
                            newFood = {
                                x: Math.floor(Math.random() * tileCountX),
                                y: Math.floor(Math.random() * tileCountY),
                                type: type,
                                points: FRUIT_POINTS[type],
                                spawnTime: Date.now(),
                                lifespan: FRUIT_LIFESPAN[type]
                            };
                            validPosition = !isPositionOccupied(newFood.x, newFood.y);
                            attempts++;
                        }
                        if (validPosition) {
                            foods.push(newFood);
                        }
                    }
                }
            }
        }

        if (gameMode === 'time') {
            // Time Mode: Handle multiple fruits, poisons, clocks
            // Check clock power-up collision
            if (clockPowerUp && head.x === clockPowerUp.x && head.y === clockPowerUp.y) {
                timeRemaining += CLOCK_BONUS;
                clockPowerUp = null;

                // Add clock collection visual effect
                const gameScreen = document.getElementById('gameScreen');
                if (gameScreen) {
                    gameScreen.classList.remove('clock-collect');
                    void gameScreen.offsetWidth;
                    gameScreen.classList.add('clock-collect');
                }

                AudioSystem.playGoldenFruit(); // Reuse golden fruit sound
                if (onScoreUpdate) onScoreUpdate(score);
                updateTimerDisplay();
                return;
            }

            // Remove expired poisons
            const now = Date.now();
            poisons = poisons.filter(p => now - p.spawnTime < p.lifespan);

            // Check poison collision
            if (poisons.some((p, index) => p.x === head.x && p.y === head.y)) {
                score += POISON_PENALTY; // -60 points
                // Remove the poison
                const poisonIndex = poisons.findIndex(p => p.x === head.x && p.y === head.y);
                if (poisonIndex !== -1) {
                    poisons.splice(poisonIndex, 1);
                }

                // Create localized tamarind explosion at the tamarind's position
                createExplosion(head.x, head.y, 'bomb');

                AudioSystem.playBomb(); // Use bomb explosion sound
                if (onScoreUpdate) onScoreUpdate(score);
                return;
            }

            // Check fruit collisions
            const eatenFruitIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
            if (eatenFruitIndex !== -1) {
                const eatenFruit = foods[eatenFruitIndex];
                score += eatenFruit.points;
                foods.splice(eatenFruitIndex, 1);
                AudioSystem.playEat();
                Renderer.triggerEatAnimation();
                if (onScoreUpdate) onScoreUpdate(score);

                // Replenish fruits
                replenishFoods();
                return;
            }

            snake.pop();
        } else {
            // Regular modes: Single food, golden fruit
            // Check golden fruit collision
            if (goldenFruit && head.x === goldenFruit.x && head.y === goldenFruit.y) {
                score += 50;
                const goldenPos = { ...goldenFruit }; // Save position for effect
                goldenFruit = null;

                // Create explosion effect at golden fruit position
                createExplosion(goldenPos.x, goldenPos.y, 'golden');

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
    function handleGameOver(collisionType = 'wall') {
        gameOver = true;
        clearInterval(goldenFruitTimer);

        // Add visual effect based on collision type
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            // Remove all effect classes first
            gameScreen.classList.remove('screen-shake', 'snake-collision');
            void gameScreen.offsetWidth; // Trigger reflow

            if (collisionType === 'self') {
                // For self collision, apply effect to canvas only
                gameScreen.classList.add('snake-collision');
            } else {
                // For wall/obstacle collision, shake the screen
                gameScreen.classList.add('screen-shake');
            }
        }

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
            waitingToResume,
            gameMode,
            foods,
            poisons,
            clockPowerUp
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
        stopTimer(); // Stop Time Mode timer
        if (window.clockSpawnerInterval) {
            clearInterval(window.clockSpawnerInterval);
            window.clockSpawnerInterval = null;
        }
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

    /**
     * Toggle debug mode for development/testing
     * Press Shift+D (desktop) or use Settings button (mobile)
     */
    function toggleDebugMode() {
        debugMode = !debugMode;

        // Update visual indicator
        updateDebugIndicator();

        // Log to console
        if (debugMode) {
            console.log('%c🐛 DEBUG MODE ENABLED', 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
            console.log('%c• Golden fruit spawns every 2 seconds', 'color: #4CAF50; font-size: 12px;');
            console.log('%c• Stays visible for 8 seconds', 'color: #4CAF50; font-size: 12px;');
            console.log('%c• Toggle: Shift+D or Settings > Developer Tools button', 'color: #2196F3; font-size: 12px;');
        } else {
            console.log('%c✅ Debug mode disabled', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
        }

        // Restart golden fruit spawner with new settings
        if (isRunning) {
            startGoldenFruitSpawner();
        }
    }

    /**
     * Update debug mode visual indicator
     */
    function updateDebugIndicator() {
        // Debug indicator disabled
        return;

        let indicator = document.getElementById('debugIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'debugIndicator';
            const bg = debugMode ? '#ff6b6b' : '#4CAF50';
            const text = debugMode ? '🐛 DEBUG ON' : '✅ DEBUG OFF';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: ${bg};
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-family: monospace;
                font-size: 12px;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                pointer-events: none;
                transition: all 0.3s ease;
            `;
            indicator.textContent = text;
            document.body.appendChild(indicator);
        } else {
            indicator.style.background = debugMode ? '#ff6b6b' : '#4CAF50';
            indicator.textContent = debugMode ? '🐛 DEBUG ON' : '✅ DEBUG OFF';
        }
    }

    /**
     * Actually start moving (called after user input)
     */
    function startMoving() {
        waitingToStart = false;
        waitingToResume = false;
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
        toggleDebugMode,
        setTimerUpdateCallback: (callback) => { onTimerUpdate = callback; },
        LEVELS
    };
})();
