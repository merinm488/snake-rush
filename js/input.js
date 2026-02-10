/**
 * Input System for Snake Rush
 * Handles keyboard, touch swipe, and D-pad controls
 */

const InputSystem = (function() {
    // Direction constants
    const DIRECTIONS = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    };

    // Current direction (snake starts moving right)
    let currentDirection = DIRECTIONS.RIGHT;
    let nextDirection = DIRECTIONS.RIGHT;
    let directionChangeCallback = null;
    let firstInputCallback = null;
    let hasReceivedFirstInput = false;

    // Touch/Swipe state
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    // Minimum swipe distance (in pixels)
    const SWIPE_THRESHOLD = 30;

    /**
     * Initialize the input system
     */
    function init(onFirstInput) {
        firstInputCallback = onFirstInput;
        hasReceivedFirstInput = false;

        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);

        // Touch/Swipe controls - detect swipes anywhere on screen
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });

        // D-pad controls
        initDPad();
    }

    /**
     * Handle keyboard input
     */
    function handleKeyDown(e) {
        const key = e.key.toLowerCase();

        // Arrow keys and WASD
        let handled = false;
        switch(key) {
            case 'arrowup':
            case 'w':
                changeDirection(DIRECTIONS.UP);
                handled = true;
                break;
            case 'arrowdown':
            case 's':
                changeDirection(DIRECTIONS.DOWN);
                handled = true;
                break;
            case 'arrowleft':
            case 'a':
                changeDirection(DIRECTIONS.LEFT);
                handled = true;
                break;
            case 'arrowright':
            case 'd':
                changeDirection(DIRECTIONS.RIGHT);
                handled = true;
                break;
        }

        if (handled) {
            e.preventDefault();
            handleFirstInput();
        }
    }

    /**
     * Handle touch start (for swipe detection)
     */
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    /**
     * Handle touch move (prevent scrolling while playing)
     */
    function handleTouchMove(e) {
        e.preventDefault();
    }

    /**
     * Handle touch end (detect swipe direction)
     */
    function handleTouchEnd(e) {
        if (e.changedTouches.length > 0) {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;

            if (handleSwipe()) {
                handleFirstInput();
            }
        }
    }

    /**
     * Detect and handle swipe gesture
     */
    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Check if swipe is long enough
        if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
            return false;
        }

        // Determine primary direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                changeDirection(DIRECTIONS.RIGHT);
            } else {
                changeDirection(DIRECTIONS.LEFT);
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                changeDirection(DIRECTIONS.DOWN);
            } else {
                changeDirection(DIRECTIONS.UP);
            }
        }

        return true;
    }

    /**
     * Initialize D-pad button controls
     */
    function initDPad() {
        const dPadButtons = document.querySelectorAll('.d-pad-btn');

        dPadButtons.forEach(button => {
            // Handle both touch and mouse events
            const handlePress = (e) => {
                e.preventDefault();
                const direction = button.getAttribute('data-direction');

                switch(direction) {
                    case 'up':
                        changeDirection(DIRECTIONS.UP);
                        break;
                    case 'down':
                        changeDirection(DIRECTIONS.DOWN);
                        break;
                    case 'left':
                        changeDirection(DIRECTIONS.LEFT);
                        break;
                    case 'right':
                        changeDirection(DIRECTIONS.RIGHT);
                        break;
                }

                handleFirstInput();
            };

            button.addEventListener('touchstart', handlePress, { passive: false });
            button.addEventListener('mousedown', handlePress);
        });
    }

    /**
     * Handle first input (to start game movement)
     */
    function handleFirstInput() {
        if (!hasReceivedFirstInput && firstInputCallback) {
            hasReceivedFirstInput = true;
            firstInputCallback();
        }
    }

    /**
     * Change the snake's direction
     * Prevents 180-degree turns (can't go directly backwards)
     */
    function changeDirection(newDirection) {
        // Prevent reversing direction
        if (currentDirection.x + newDirection.x === 0 &&
            currentDirection.y + newDirection.y === 0) {
            return;
        }

        nextDirection = newDirection;
    }

    /**
     * Update the current direction (called each game tick)
     */
    function updateDirection() {
        currentDirection = nextDirection;
    }

    /**
     * Get the current direction
     */
    function getCurrentDirection() {
        return currentDirection;
    }

    /**
     * Reset direction to default (right)
     */
    function reset() {
        currentDirection = DIRECTIONS.RIGHT;
        nextDirection = DIRECTIONS.RIGHT;
        hasReceivedFirstInput = false;
    }

    /**
     * Reset first input flag (for resume from pause)
     */
    function resetFirstInput() {
        hasReceivedFirstInput = false;
    }

    /**
     * Clean up event listeners
     */
    function destroy() {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchmove', handleTouchMove);

        const dPadButtons = document.querySelectorAll('.d-pad-btn');
        dPadButtons.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
    }

    return {
        DIRECTIONS,
        init,
        updateDirection,
        getCurrentDirection,
        reset,
        resetFirstInput,
        destroy
    };
})();
