# Snake Rush 🐍

A responsive Snake game with themes, sound effects, and mobile-friendly controls. Built with vanilla HTML, CSS, and JavaScript.

![Snake Rush](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 About This Project

This project showcases how I utilized **Claude Code** (Anthropic's AI-powered CLI tool) to develop a complete, fully-functional web game **without any prior knowledge of HTML, CSS, or JavaScript**.

### What This Project Demonstrates

**As a Learning Achievement:**
- Developed a complex web application from scratch using AI-assisted development
- Learned and implemented core web technologies: HTML5, CSS3, and vanilla JavaScript
- Understood responsive design principles and mobile-first development
- Gained practical experience with browser APIs (Canvas, Web Audio, Touch Events, localStorage)

**As a Frontend Design Project:**
This project also showcases my ability to manage frontend design perfectly:
- ✅ **Responsive UI/UX** - Seamless experience across desktop, tablet, and mobile devices
- ✅ **Visual Design** - Multiple color themes with consistent styling and smooth animations
- ✅ **Accessibility** - Proper semantic HTML, ARIA labels, and keyboard navigation
- ✅ **User Experience** - Intuitive controls, clear feedback, and polished interactions
- ✅ **Performance** - Optimized rendering with smooth 60fps gameplay
- ✅ **Cross-browser Compatibility** - Works on all modern browsers

## Features

- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Multiple Themes** - Choose from Classic, Neon, Retro, Ocean, Forest, and Sunset themes
- **Sound Effects** - Generated audio for eating, game over, and UI interactions
- **Mobile Controls** - Swipe gestures and on-screen D-pad for touch devices
- **Keyboard Controls** - Arrow keys or WASD for desktop play
- **Difficulty Levels** - Easy, Medium, and Hard modes
- **High Score Tracking** - Saved to localStorage
- **Multiple Fruit Types** - Apple, Cherry, Strawberry, Orange, Grape, or Random

## How to Play

1. **Objective**: Guide your snake to eat fruits and grow longer. Avoid hitting the walls or yourself!

2. **Controls**:
   - **Desktop**: Arrow keys or WASD
   - **Mobile**: Swipe in any direction or use the on-screen D-pad
   - **Pause**: Press Space or tap the pause button

3. **Scoring**: Each fruit eaten = 10 points

4. **Difficulty**: Higher difficulty = faster snake = more challenging!

## Installation

No installation required! Simply clone or download this repository and open `index.html` in your web browser.

```bash
git clone https://github.com/yourusername/snake-rush.git
cd snake-rush
open index.html  # On macOS
# or
start index.html  # On Windows
```

## Deployment to GitHub Pages

1. Create a new GitHub repository
2. Push the code to the repository
3. Go to repository Settings > Pages
4. Select the `main` branch as the source
5. Click Save

Your game will be available at `https://yourusername.github.io/snake-rush/`

## Project Structure

```
snake-rush/
├── index.html          # Main HTML structure
├── css/
│   ├── style.css       # Main styles
│   └── themes.css      # Theme definitions
├── js/
│   ├── audio.js        # Sound effects (Web Audio API)
│   ├── input.js        # Keyboard & touch controls
│   ├── renderer.js     # Canvas rendering
│   ├── game.js         # Core game logic
│   └── ui.js           # Menu/navigation logic
└── README.md
```

## Customization

### Adding New Themes

Add a new theme in `css/themes.css`:

```css
body.theme-yourtheme {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --game-bg: #0f0f23;
    --text-primary: #eee;
    --text-secondary: #aaa;
    --accent: #4ecca3;
    --border: #333;
    --shadow: rgba(78, 204, 163, 0.3);
    --snake-head: #4ecca3;
    --snake-body: #45b393;
    --snake-pattern: #3d997c;
}
```

Then add the option to `index.html`:

```html
<option value="yourtheme">Your Theme Name</option>
```

### Adding New Fruits

Add fruit emojis in `js/renderer.js`:

```javascript
const fruitEmojis = {
    apple: '🍎',
    yourfruit: '🥝'
};
```

Then add the option to `index.html`:

```html
<option value="yourfruit">Kiwi 🥝</option>
```

## Technical Details

- **No dependencies** - Pure vanilla JavaScript
- **Canvas API** - For smooth game rendering
- **Web Audio API** - For programmatically generated sounds
- **Touch Events API** - For swipe gesture detection
- **localStorage** - For saving high scores and preferences

## Browser Support

Works in all modern browsers that support:
- Canvas API
- Web Audio API
- ES6 JavaScript
- CSS Variables

## License

MIT License - feel free to use this project for learning or as a base for your own games!

## Credits

**Built with ❤️ using [Claude Code](https://claude.ai/claude-code)**

This project demonstrates the power of AI-assisted development in creating functional, polished web applications. Developed entirely through Claude Code's conversational interface, this game serves as both an entertaining project and proof of what's possible when AI helps bridge the gap between ideas and implementation.
