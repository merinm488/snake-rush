/**
 * UI System for Snake Rush
 * Handles menu navigation, modals, intro animation, and level selection
 */

const UISystem = (function() {
    // Screen elements
    const screens = {
        mainMenu: document.getElementById('mainMenu'),
        gameScreen: document.getElementById('gameScreen')
    };

    // Modal elements
    const modals = {
        pause: document.getElementById('pauseMenu'),
        gameOver: document.getElementById('gameOverScreen'),
        levelComplete: document.getElementById('levelCompleteScreen'),
        howToPlay: document.getElementById('howToPlayModal'),
        settings: document.getElementById('settingsModal'),
        levelSelect: document.getElementById('levelSelectModal')
    };

    // Button elements
    const buttons = {
        play: document.getElementById('playBtn'),
        levels: document.getElementById('levelsBtn'),
        howToPlay: document.getElementById('howToPlayBtn'),
        settings: document.getElementById('settingsBtn'),
        closeHowToPlay: document.getElementById('closeHowToPlay'),
        closeSettings: document.getElementById('closeSettings'),
        closeLevelSelect: document.getElementById('closeLevelSelect'),
        pause: document.getElementById('pauseBtn'),
        quitHeader: document.getElementById('quitBtnHeader'),
        resume: document.getElementById('resumeBtn'),
        quit: document.getElementById('quitBtn'),
        playAgain: document.getElementById('playAgainBtn'),
        nextLevelGameOver: document.getElementById('nextLevelGameOverBtn'),
        menu: document.getElementById('menuBtn'),
        nextLevelBtn: document.getElementById('nextLevelBtn'),
        playAgainLevel: document.getElementById('playAgainLevelBtn'),
        quitLevel: document.getElementById('quitLevelBtn')
    };

    // Selected game mode
    let selectedMode = 'endless';

    // Settings controls
    const settingsControls = {
        mode: document.getElementById('modeSelect'),
        theme: document.getElementById('themeSelect'),
        fruit: document.getElementById('fruitSelect'),
        fruitIcon: document.getElementById('fruitTypeIcon'),
        difficulty: document.getElementById('difficultySelect'),
        masterSound: document.getElementById('masterSoundToggle'),
        bgmSound: document.getElementById('bgmSoundToggle'),
        groupLevels: document.getElementById('settingGroupLevels'),
        groupFruit: document.getElementById('settingGroupFruit')
    };

    // Display elements
    const displays = {
        currentScore: document.getElementById('currentScore'),
        levelDisplay: document.querySelector('.level-display'),
        currentLevel: document.getElementById('currentLevel'),
        targetDisplay: document.querySelector('.target-display'),
        targetScore: document.getElementById('targetScore'),
        timerDisplay: document.getElementById('timerDisplay'),
        currentTime: document.getElementById('currentTime'),
        clockBonus: document.getElementById('clockBonus'),
        finalScore: document.getElementById('finalScore'),
        bestScore: document.getElementById('bestScore'),
        levelTarget: document.getElementById('levelTarget'),
        newHighScore: document.getElementById('newHighScore'),
        bonusPoints: document.getElementById('bonusPoints'),
        highScoreMenu: document.getElementById('highScoreMenu'),
        gameOverTitle: document.getElementById('gameOverTitle'),
        levelCompleted: document.getElementById('levelCompletedDisplay'),
        levelCompleteScore: document.getElementById('levelCompleteScore'),
        levelCompleteTarget: document.getElementById('levelCompleteTarget')
    };

    // Current game level
    let currentGameLevel = 1;
    let selectedLevel = 1;
    let accumulatedScore = 0; // Tracks accumulated score across levels in levels mode

    /**
     * Initialize the UI system
     */
    function init() {
        Game.init();
        Renderer.init();

        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                  .then((registration) => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  })
                  .catch((error) => {
                    console.log('ServiceWorker registration failed: ', error);
                  });
            });
        }

        // Load saved game mode
        const savedMode = localStorage.getItem('snakeRushGameMode');
        if (savedMode) {
            selectedMode = savedMode;
        }

        // Load settings into UI
        loadSettingsToUI();

        // Set up event listeners
        setupEventListeners();

        // Show intro animation
        playIntroAnimation();
    }

    /**
     * Play intro animation sequence
     */
    function playIntroAnimation() {
        const introSplash = document.getElementById('introSplash');

        // Show intro splash for 2 seconds, then fade out
        setTimeout(() => {
            introSplash.classList.add('fade-out');
        }, 2000);

        // After fade out, show menu and hide splash
        setTimeout(() => {
            introSplash.classList.add('hidden');
            showMainMenu();
        }, 2800);
    }

    /**
     * Show main menu with animation
     */
    function showMainMenu() {
        console.log('showMainMenu: Adding active class to mainMenu');
        screens.mainMenu.classList.add('active');
        screens.mainMenu.classList.add('menu-visible');
        console.log('showMainMenu: Menu classes after update:', screens.mainMenu.className);
    }

    /**
     * Update level/target display visibility based on game mode
     */
    function updateGameHeaderForMode(mode) {
        const gameMode = mode || selectedMode;

        // Hide all special displays first
        displays.levelDisplay.classList.add('hidden');
        displays.targetDisplay.classList.add('hidden');
        displays.timerDisplay.classList.add('hidden');

        if (gameMode === 'endless') {
            // No special displays needed
        } else if (gameMode === 'levels') {
            // Show level and target
            displays.levelDisplay.classList.remove('hidden');
            displays.targetDisplay.classList.remove('hidden');
        } else if (gameMode === 'time') {
            // Show timer
            displays.timerDisplay.classList.remove('hidden');
        }
    }

    /**
     * Update settings visibility based on game mode
     */
    function updateSettingsForMode() {
        const mode = selectedMode;

        // Levels button: Only show for Levels mode
        if (mode === 'levels') {
            settingsControls.groupLevels.classList.remove('hidden');
        } else {
            settingsControls.groupLevels.classList.add('hidden');
        }

        // Fruit Type: Show for Endless and Levels, hide for Time mode
        if (mode === 'time') {
            settingsControls.groupFruit.classList.add('hidden');
        } else {
            settingsControls.groupFruit.classList.remove('hidden');
        }
    }

    /**
     * Load current settings into UI controls
     */
    function loadSettingsToUI() {
        const settings = Game.getSettings();
        const soundSettings = AudioSystem.getSettings();

        settingsControls.mode.value = selectedMode;
        settingsControls.theme.value = settings.theme;
        settingsControls.fruit.value = settings.fruitType;
        settingsControls.difficulty.value = settings.difficulty;

        updateSettingsForMode();
        updateGameHeaderForMode(selectedMode);

        // Update fruit icon to match current setting
        const fruitEmojis = {
            apple: '🍎',
            cherry: '🍒',
            strawberry: '🍓',
            orange: '🍊',
            grape: '🍇',
            random: '🎲'
        };
        settingsControls.fruitIcon.textContent = fruitEmojis[settings.fruitType] || '🍎';

        // Sound settings
        settingsControls.masterSound.checked = soundSettings.master;
        settingsControls.bgmSound.checked = soundSettings.bgm;
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Main menu buttons
        buttons.play.addEventListener('click', () => startGame(1, selectedMode));
        buttons.howToPlay.addEventListener('click', () => showModal('howToPlay'));
        buttons.settings.addEventListener('click', () => showModal('settings'));
        buttons.levels.addEventListener('click', () => {
            hideModal('settings');
            setTimeout(() => showLevelSelect(), 100);
        });

        // Modal close buttons
        buttons.closeHowToPlay.addEventListener('click', () => hideModal('howToPlay'));
        buttons.closeSettings.addEventListener('click', saveAndCloseSettings);
        buttons.closeLevelSelect.addEventListener('click', () => hideModal('levelSelect'));

        // Game controls
        buttons.pause.addEventListener('click', togglePause);
        buttons.quitHeader.addEventListener('click', quitToMenu);
        buttons.resume.addEventListener('click', () => {
            hideModal('pause');
            Game.resume();
        });
        buttons.quit.addEventListener('click', quitToMenu);

        // Game over buttons
        buttons.playAgain.addEventListener('click', () => {
            hideModal('gameOver');
            startGame(currentGameLevel, null, true); // Reset score on play again
        });
        buttons.nextLevelGameOver.addEventListener('click', () => {
            hideModal('gameOver');
            startGame(currentGameLevel + 1, 'levels', false); // Keep score on next level
        });
        buttons.menu.addEventListener('click', () => {
            hideModal('gameOver');
            showScreen('mainMenu');
        });

        // Level complete buttons
        buttons.nextLevelBtn.addEventListener('click', () => {
            hideModal('levelComplete');
            startGame(currentGameLevel + 1, 'levels', false); // Keep score on next level
        });
        buttons.playAgainLevel.addEventListener('click', () => {
            hideModal('levelComplete');
            startGame(currentGameLevel, 'levels', true); // Reset score on play again
        });
        buttons.quitLevel.addEventListener('click', () => {
            hideModal('levelComplete');
            showScreen('mainMenu');
        });

        // Settings controls
        settingsControls.mode.addEventListener('change', (e) => {
            selectedMode = e.target.value;
            localStorage.setItem('snakeRushGameMode', selectedMode);
            updateSettingsForMode();
            updateGameHeaderForMode(selectedMode);
            AudioSystem.playClick();
        });
        settingsControls.theme.addEventListener('change', (e) => {
            Game.updateSetting('theme', e.target.value);
            AudioSystem.playClick();
        });

        settingsControls.fruit.addEventListener('change', (e) => {
            Game.updateSetting('fruitType', e.target.value);
            // Update the fruit icon
            const fruitEmojis = {
                apple: '🍎',
                cherry: '🍒',
                strawberry: '🍓',
                orange: '🍊',
                grape: '🍇',
                random: '🎲'
            };
            settingsControls.fruitIcon.textContent = fruitEmojis[e.target.value] || '🍎';
            AudioSystem.playClick();
        });

        settingsControls.difficulty.addEventListener('change', (e) => {
            Game.updateSetting('difficulty', e.target.value);
            AudioSystem.playClick();
        });

        // Sound settings
        settingsControls.masterSound.addEventListener('change', (e) => {
            AudioSystem.setMasterEnabled(e.target.checked);
            AudioSystem.playClick();
        });

        settingsControls.bgmSound.addEventListener('change', (e) => {
            AudioSystem.setSound('bgm', e.target.checked);
            AudioSystem.playClick();
        });

        // Close modals when clicking outside
        Object.keys(modals).forEach(key => {
            modals[key].addEventListener('click', (e) => {
                if (e.target === modals[key]) {
                    if (key === 'settings') {
                        saveAndCloseSettings();
                    } else if (key !== 'pause' && key !== 'gameOver') {
                        hideModal(key);
                    }
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleGlobalKeydown);
    }

    /**
     * Handle global keyboard shortcuts
     */
    function handleGlobalKeydown(e) {
        if (e.key === 'Escape') {
            const openModal = getOpenModal();
            if (openModal === 'howToPlay' || openModal === 'settings' || openModal === 'levelSelect') {
                if (openModal === 'settings') {
                    saveAndCloseSettings();
                } else {
                    hideModal(openModal);
                }
            }
        }

        if (e.key === ' ') {
            const gameScreen = screens.gameScreen;
            if (gameScreen.classList.contains('active') && Game.getState().isRunning) {
                e.preventDefault();
                togglePause();
            }
        }
    }

    /**
     * Show a specific screen
     */
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });

        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }

        AudioSystem.playClick();
    }

    /**
     * Show a modal
     */
    function showModal(modalName) {
        AudioSystem.playClick();
        if (modals[modalName]) {
            modals[modalName].classList.add('active');
        }
        // Update settings visibility when opening settings modal
        if (modalName === 'settings') {
            updateSettingsForMode();
        }
    }

    /**
     * Hide a modal
     */
    function hideModal(modalName) {
        AudioSystem.playClick();
        if (modals[modalName]) {
            const modalContent = modals[modalName].querySelector('.modal');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
            modals[modalName].classList.remove('active');
        }
    }

    /**
     * Get the currently open modal name
     */
    function getOpenModal() {
        for (const [key, modal] of Object.entries(modals)) {
            if (modal.classList.contains('active')) {
                return key;
            }
        }
        return null;
    }

    /**
     * Show level selection modal
     */
    function showLevelSelect() {
        const levelsGrid = document.getElementById('levelsGrid');
        const unlockedLevels = Game.getUnlockedLevels();
        const totalLevels = Object.keys(Game.LEVELS).length;

        levelsGrid.innerHTML = '';

        for (let i = 1; i <= totalLevels; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.innerHTML = `<span>${i}</span>`;

            if (i <= unlockedLevels) {
                if (i === selectedLevel) {
                    btn.classList.add('current');
                }
                btn.addEventListener('click', () => {
                    selectedLevel = i;
                    hideModal('levelSelect');
                });
            } else {
                btn.classList.add('locked');
            }

            levelsGrid.appendChild(btn);
        }

        modals.levelSelect.classList.add('active');
    }

    /**
     * Start the game
     */
    function startGame(levelNum, mode = null, resetScore = true) {
        // If no level provided, use selected level for levels mode
        if (levelNum === 1 && selectedMode === 'levels') {
            levelNum = selectedLevel;
        }
        // If no mode provided, use selected mode
        if (mode === null) {
            mode = selectedMode;
        }

        // Reset accumulated score when starting fresh (not from next level)
        if (resetScore) {
            accumulatedScore = 0;
        }

        currentGameLevel = levelNum;
        updateGameHeaderForMode(mode);
        showScreen('gameScreen');

        // Set timer update callback for Time Mode
        const timerCallback = mode === 'time' ? (time) => {
            displays.currentTime.textContent = time;
            // Add warning style when time is low
            if (time <= 10) {
                displays.timerDisplay.classList.add('warning');
            } else {
                displays.timerDisplay.classList.remove('warning');
            }
        } : null;

        Game.start(
            levelNum,
            // Game over callback
            (finalScore, bestScore, isNewHighScore, levelCompleted, level, targetScore, bonusPoints) => {
                displays.finalScore.textContent = finalScore;
                displays.bestScore.textContent = bestScore;

                // Update title
                displays.gameOverTitle.textContent = levelCompleted ? 'Level Complete!' : 'Game Over!';

                // Show/hide level completed message
                if (levelCompleted) {
                    displays.levelCompleted.classList.remove('hidden');
                } else {
                    displays.levelCompleted.classList.add('hidden');
                }

                // High score
                if (isNewHighScore) {
                    displays.newHighScore.classList.remove('hidden');
                } else {
                    displays.newHighScore.classList.add('hidden');
                }

                // Bonus points
                if (bonusPoints > 0) {
                    displays.bonusPoints.querySelector('.score-value').textContent = `+${bonusPoints}`;
                    displays.bonusPoints.classList.remove('hidden');
                } else {
                    displays.bonusPoints.classList.add('hidden');
                }

                // Show/hide next level button
                if (levelCompleted && level < Object.keys(Game.LEVELS).length) {
                    buttons.nextLevelGameOver.classList.remove('hidden');
                    buttons.playAgain.classList.add('hidden');
                } else {
                    buttons.nextLevelGameOver.classList.add('hidden');
                    buttons.playAgain.classList.remove('hidden');
                }

                // Reset accumulated score when game over (not level complete)
                if (!levelCompleted) {
                    accumulatedScore = 0;
                }

                showModal('gameOver');
            },
            // Score update callback
            (score) => {
                displays.currentScore.textContent = score;
                accumulatedScore = score; // Track the accumulated score
            },
            // Level update callback
            (level, targetScore) => {
                displays.currentLevel.textContent = level;
                displays.targetScore.textContent = targetScore;
            },
            // Level complete callback
            (score, targetScore, level) => {
                displays.levelCompleteScore.textContent = score;
                displays.levelCompleteTarget.textContent = targetScore;
                showModal('levelComplete');
            },
            mode,
            accumulatedScore, // Pass the accumulated score to game
            timerCallback // Pass timer update callback for Time Mode
        );

        // Set up first input callback to start movement
        InputSystem.init(() => {
            Game.startMoving();
        });
    }

    /**
     * Toggle pause state
     */
    function togglePause() {
        const paused = Game.togglePause();

        if (paused) {
            showModal('pause');
        } else {
            hideModal('pause');
        }
    }

    /**
     * Quit the current game and return to menu
     */
    function quitToMenu() {
        Game.quit();
        hideModal('pause');
        showScreen('mainMenu');
    }

    /**
     * Save settings and close settings modal
     */
    function saveAndCloseSettings() {
        // Settings are already auto-saved when changed
        hideModal('settings');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init,
        showScreen,
        showModal,
        hideModal
    };
})();
