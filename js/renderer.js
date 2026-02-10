/**
 * Renderer System for Snake Rush
 * Handles canvas rendering with natural snake, golden fruit, and obstacles
 */

const Renderer = (function() {
    let canvas = null;
    let ctx = null;

    // Game configuration
    let gridSize = 20;
    let tileCount = 20;

    // Colors (read from CSS variables)
    let colors = {};

    // Fruit emoji mapping
    const fruitEmojis = {
        apple: '🍎',
        cherry: '🍒',
        strawberry: '🍓',
        orange: '🍊',
        grape: '🍇'
    };

    // Animation state
    let mouthOpenAmount = 0;
    let tongueVisible = false;
    let isEating = false;

    /**
     * Initialize the renderer
     */
    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        // Initial canvas setup
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Get initial colors from CSS
        updateColors();
    }

    /**
     * Update colors from CSS variables
     */
    function updateColors() {
        const computedStyle = getComputedStyle(document.body);
        colors = {
            snakeHead: computedStyle.getPropertyValue('--snake-head').trim(),
            snakeBody: computedStyle.getPropertyValue('--snake-body').trim(),
            snakePattern: computedStyle.getPropertyValue('--snake-pattern').trim(),
            gameBg: computedStyle.getPropertyValue('--game-bg').trim(),
            border: computedStyle.getPropertyValue('--border').trim()
        };
    }

    /**
     * Resize canvas based on viewport
     */
    function resizeCanvas() {
        const container = document.querySelector('.game-container');
        if (!container) return;

        const maxWidth = Math.min(window.innerWidth - 32, 600);
        const maxHeight = window.innerHeight - 200;

        // Calculate size based on grid
        const size = Math.min(maxWidth, maxHeight);

        // Set canvas size
        canvas.width = size;
        canvas.height = size;

        // Calculate grid size
        gridSize = Math.floor(size / tileCount);
    }

    /**
     * Clear the canvas and draw grid
     */
    function clear() {
        ctx.fillStyle = colors.gameBg || '#1a3050';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw visible grid pattern
        const gridColor = colors.border || '#4a5a6a';
        ctx.strokeStyle = gridColor;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;

        for (let i = 0; i <= tileCount; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw obstacles
     */
    function drawObstacles(obstacles) {
        obstacles.forEach(obs => {
            const x = obs.x * gridSize;
            const y = obs.y * gridSize;

            // Draw obstacle block with gradient
            const gradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(0.5, '#444');
            gradient.addColorStop(1, '#333');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);

            // Draw border
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);

            // Draw X pattern
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 4);
            ctx.lineTo(x + gridSize - 4, y + gridSize - 4);
            ctx.moveTo(x + gridSize - 4, y + 4);
            ctx.lineTo(x + 4, y + gridSize - 4);
            ctx.stroke();
        });
    }

    /**
     * Draw moving obstacles
     */
    function drawMovingObstacles(obstacles) {
        obstacles.forEach(obs => {
            const x = obs.x * gridSize;
            const y = obs.y * gridSize;

            // Draw moving obstacle with danger color
            const gradient = ctx.createRadialGradient(
                x + gridSize / 2, y + gridSize / 2, 0,
                x + gridSize / 2, y + gridSize / 2, gridSize / 2
            );
            gradient.addColorStop(0, '#aa4444');
            gradient.addColorStop(1, '#8B0000');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);

            // Draw skull symbol
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + gridSize / 2, y + gridSize / 2 - 2, gridSize / 4, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + gridSize / 3, y + gridSize / 2 - 4, 2, 0, Math.PI * 2);
            ctx.arc(x + gridSize * 2 / 3, y + gridSize / 2 - 4, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Calculate distance between two points
     */
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    /**
     * Draw the natural serpentine snake
     */
    function drawSnake(snake, food) {
        // Calculate distance to food for mouth animation
        const head = snake[0];
        const distToFood = food ? distance(head.x, head.y, food.x, food.y) : 999;

        // Animate mouth opening when approaching food (within 3 tiles)
        const targetMouthOpen = distToFood <= 3 ? Math.min(1, (3 - distToFood) / 2) : 0;
        mouthOpenAmount += (targetMouthOpen - mouthOpenAmount) * 0.2;

        // Draw the body as a continuous flowing shape
        if (snake.length > 1) {
            drawContinuousBody(snake);
        }

        // Draw head last (on top)
        const headSegment = snake[0];
        const x = headSegment.x * gridSize;
        const y = headSegment.y * gridSize;
        drawSnakeHead(x, y, headSegment, food);

        // Reset eating state
        if (isEating) {
            setTimeout(() => { isEating = false; tongueVisible = false; }, 200);
        }
    }

    /**
     * Draw snake body as a continuous flowing shape
     */
    function drawContinuousBody(snake) {
        console.log('🐍 Drawing NEW continuous snake body, length:', snake.length);
        const totalLength = snake.length;

        // Get points for the spine of the snake
        const points = snake.slice(1).map((seg, i) => ({
            x: seg.x * gridSize + gridSize / 2,
            y: seg.y * gridSize + gridSize / 2,
            sizeRatio: 1 - ((i + 1) / totalLength) * 0.5, // Gradually taper to 50% at tail
            colorRatio: (i + 1) / totalLength
        }));

        if (points.length < 1) return;

        // Draw as ONE continuous thick line with varying width
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw multiple layers for smooth appearance
        for (let layer = 0; layer < 3; layer++) {
            ctx.beginPath();

            // Draw through all points
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                const baseSize = gridSize * 0.95 * point.sizeRatio;
                const layerSize = baseSize * (1 - layer * 0.15); // Each layer slightly smaller

                // Color varies by position
                let segmentColor;
                if (point.colorRatio < 0.3) {
                    segmentColor = colors.snakeHead || '#5ed4a3';
                } else if (point.colorRatio < 0.6) {
                    segmentColor = colors.snakeBody || '#4bc492';
                } else {
                    segmentColor = colors.snakePattern || '#3db482';
                }

                // Draw this segment as a circle (layered creates smooth blending)
                const gradient = ctx.createRadialGradient(
                    point.x, point.y, 0,
                    point.x, point.y, layerSize / 2
                );

                if (layer === 0) {
                    // Base layer - darker
                    gradient.addColorStop(0, adjustColorBrightness(segmentColor, -20));
                    gradient.addColorStop(1, adjustColorBrightness(segmentColor, -30));
                } else if (layer === 1) {
                    // Middle layer - main color
                    gradient.addColorStop(0, segmentColor);
                    gradient.addColorStop(0.5, adjustColorBrightness(segmentColor, -10));
                    gradient.addColorStop(1, adjustColorBrightness(segmentColor, -25));
                } else {
                    // Top layer - highlight
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                }

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(point.x, point.y, layerSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Helper function to adjust color brightness
     */
    function adjustColorBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    /**
     * Draw snake head
     */
    function drawSnakeHead(x, y, head, food) {
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;
        const headSize = gridSize;

        // Get current direction
        const direction = InputSystem.getCurrentDirection();

        // Draw head shape (slightly larger than body, oval/serpentine)
        ctx.fillStyle = colors.snakeHead || '#5ed4a3';
        ctx.beginPath();

        // Create an oval/elliptical shape for natural snake head
        ctx.ellipse(centerX, centerY, headSize / 2.1, headSize / 2.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.ellipse(centerX - headSize / 6, centerY - headSize / 6, headSize / 4, headSize / 6, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw eyes based on direction
        const eyeOffset = headSize / 4;
        const eyeSize = headSize / 5;
        let leftEyeX, rightEyeX, eyeY;

        if (direction.x === -1) { // Left
            leftEyeX = centerX - eyeOffset / 1.5;
            rightEyeX = centerX - eyeOffset / 4;
            eyeY = centerY - eyeOffset / 3;
        } else if (direction.x === 1) { // Right
            leftEyeX = centerX + eyeOffset / 4;
            rightEyeX = centerX + eyeOffset / 1.5;
            eyeY = centerY - eyeOffset / 3;
        } else if (direction.y === -1) { // Up
            leftEyeX = centerX - eyeOffset / 3;
            rightEyeX = centerX + eyeOffset / 3;
            eyeY = centerY - eyeOffset / 1.5;
        } else { // Down
            leftEyeX = centerX - eyeOffset / 3;
            rightEyeX = centerX + eyeOffset / 3;
            eyeY = centerY + eyeOffset / 6;
        }

        // Draw eyes (snake-like - round and menacing but cute)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(leftEyeX, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
        ctx.ellipse(rightEyeX, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(leftEyeX, eyeY, eyeSize / 2.5, eyeSize / 2.5, 0, 0, Math.PI * 2);
        ctx.ellipse(rightEyeX, eyeY, eyeSize / 2.5, eyeSize / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(leftEyeX - eyeSize / 5, eyeY - eyeSize / 5, eyeSize / 4, 0, Math.PI * 2);
        ctx.arc(rightEyeX - eyeSize / 5, eyeY - eyeSize / 5, eyeSize / 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw mouth
        drawMouth(centerX, centerY, headSize, direction);
    }

    /**
     * Draw mouth with animation
     */
    function drawMouth(centerX, centerY, headSize, direction) {
        const mouthY = centerY + headSize / 4;
        const mouthWidth = headSize / 3.5;

        ctx.fillStyle = '#2a1a0a';
        ctx.strokeStyle = '#1a0a00';
        ctx.lineWidth = 1;

        if (mouthOpenAmount > 0.1 || tongueVisible) {
            // Open mouth
            const openAmount = Math.max(mouthOpenAmount, tongueVisible ? 0.8 : 0);
            const mouthHeight = mouthWidth * 0.7 * openAmount;

            // Draw mouth opening
            ctx.beginPath();
            ctx.ellipse(centerX, mouthY, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw tongue when open
            if (tongueVisible || mouthOpenAmount > 0.4) {
                ctx.fillStyle = '#FF4444';
                ctx.beginPath();
                const tongueLength = mouthWidth * 0.7;
                const tongueWidth = mouthWidth * 0.25;

                // Forked tongue
                ctx.moveTo(centerX, mouthY);
                ctx.lineTo(centerX, mouthY + tongueLength);
                ctx.stroke();

                // Fork
                ctx.beginPath();
                ctx.moveTo(centerX - tongueWidth / 2, mouthY + tongueLength);
                ctx.lineTo(centerX, mouthY + tongueLength + tongueWidth / 2);
                ctx.moveTo(centerX + tongueWidth / 2, mouthY + tongueLength);
                ctx.lineTo(centerX, mouthY + tongueLength + tongueWidth / 2);
                ctx.stroke();
            }
        } else {
            // Closed mouth (slight curve)
            ctx.beginPath();
            ctx.arc(centerX, mouthY, mouthWidth / 2, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
        }
    }

    /**
     * Draw food (fruit)
     */
    function drawFood(food, fruitType) {
        const x = food.x * gridSize + gridSize / 2;
        const y = food.y * gridSize + gridSize / 2;

        ctx.font = `${gridSize * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let emoji = fruitEmojis[fruitType] || fruitEmojis.apple;

        // If random, pick a random fruit
        if (fruitType === 'random') {
            const fruitKeys = Object.keys(fruitEmojis);
            emoji = fruitEmojis[fruitKeys[Math.floor(Math.random() * fruitKeys.length)]];
        }

        ctx.fillText(emoji, x, y);

        // Add a subtle glow effect
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText(emoji, x, y);
        ctx.shadowBlur = 0;
    }

    /**
     * Draw golden fruit (bonus)
     */
    function drawGoldenFruit(food) {
        if (!food) return;

        const x = food.x * gridSize;
        const y = food.y * gridSize;
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;

        // Animated glow
        const glowSize = 10 + Math.sin(Date.now() / 200) * 5;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gridSize / 2 + glowSize);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, gridSize / 2 + glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw star instead of apple for golden fruit
        ctx.font = `${gridSize * 0.9}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', centerX, centerY);

        // Draw sparkle effects
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 4; i++) {
            const angle = (Date.now() / 500 + i * Math.PI / 2) % (Math.PI * 2);
            const sparkleX = centerX + Math.cos(angle) * gridSize / 1.5;
            const sparkleY = centerY + Math.sin(angle) * gridSize / 1.5;
            const sparkleSize = 2 + Math.sin(Date.now() / 100 + i) * 1;

            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw "Press to Start" message
     */
    function drawPressToStart() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Pulsing text
        const alpha = 0.7 + Math.sin(Date.now() / 500) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillText('Press any direction key', canvas.width / 2, canvas.height / 2 - 15);
        ctx.fillText('or swipe to start', canvas.width / 2, canvas.height / 2 + 15);
    }

    /**
     * Draw pause overlay
     */
    function drawPause() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }

    /**
     * Trigger eating animation
     */
    function triggerEatAnimation() {
        isEating = true;
        tongueVisible = true;
        mouthOpenAmount = 1;
    }

    /**
     * Render a complete frame
     */
    function render(gameState) {
        clear();

        // Draw obstacles
        if (gameState.obstacles) {
            drawObstacles(gameState.obstacles);
        }

        if (gameState.movingObstacles) {
            drawMovingObstacles(gameState.movingObstacles);
        }

        // Draw golden fruit
        if (gameState.goldenFruit) {
            drawGoldenFruit(gameState.goldenFruit);
        }

        // Draw regular food
        drawFood(gameState.food, gameState.fruitType);

        // Draw snake
        drawSnake(gameState.snake, gameState.food);

        // Draw overlays
        if (gameState.paused) {
            drawPause();
        } else if (gameState.waitingToStart) {
            drawPressToStart();
        }
        // Note: waitingToResume has no overlay - snake just waits silently
    }

    return {
        init,
        updateColors,
        render,
        triggerEatAnimation,
        getTileCount: () => tileCount,
        resizeCanvas
    };
})();
