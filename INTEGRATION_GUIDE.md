# Integration Guide for Test System

This guide shows how to integrate the test system into the game.

## Quick Integration

### Step 1: Import the Test System

Add this import to `sourceFiles/main.js` at the top with other imports:

```javascript
import { initializeTestSystem } from "./testing/testIntegration.js";
```

### Step 2: Initialize in Game Constructor

In the `Game` class constructor (around line 97), add:

```javascript
// Initialize test system (dev mode only)
this.testSystem = null;
try {
  this.testSystem = initializeTestSystem(this);
} catch (error) {
  console.log('Test system not available:', error.message);
}
```

### Step 3: Update in Game Loop

In the `update()` method (around line 114), add after other updates:

```javascript
// Update test system
if (this.testSystem && this.testSystem.enabled) {
  this.testSystem.update(this);
}
```

### Step 4: Draw Test UI

In the `draw()` method (around line 158), add at the end (after all other draws):

```javascript
// Draw test UI (on top of everything)
if (this.testSystem && this.testSystem.enabled) {
  this.testSystem.draw(context, this);
}
```

### Step 5: Enable Dev Mode

The test system automatically enables if:
- Running on localhost (127.0.0.1 or localhost)
- URL contains `?dev=true`

To force enable/disable:

```javascript
// After initializing test system:
this.testSystem.enable();  // Force enable
// or
this.testSystem.disable(); // Force disable
```

## Usage

Once integrated:

1. **Open Dev Console**: Press `` ` `` (backtick)
2. **Run Tests**: Type `test` and press Enter
3. **Quick Tests**: Type `testfast`
4. **Show Test UI**: Press **F12** or type `testshow`

## Available Console Commands

```
test                  - Run all tests
test <category>       - Run tests in specific category
testfast              - Run smoke tests only
testverbose           - Run tests with verbose output
testlist              - List all test categories
testshow              - Show test UI
testhide              - Hide test UI
testclear             - Clear test results
testreport            - Show last report
help                  - Show all commands
clear                 - Clear console
```

## Test UI Controls

- **↑/↓**: Navigate tests
- **F**: Cycle filters (all/passed/failed)
- **R**: Re-run tests
- **ESC**: Close UI

## Programmatic Test Execution

You can also run tests programmatically:

```javascript
// From browser console
window.runTests();                    // Run all tests
window.runTests({ category: 'Player' }); // Run specific category
window.runTests({ tags: ['smoke'] }); // Run by tag

// Access test system
window.testSystem.enable();           // Enable test system
window.testSystem.disable();          // Disable test system
```

## Dev Mode Detection

The test system auto-detects dev mode using:

```javascript
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.search.includes('dev=true');
```

To force dev mode on any URL, add `?dev=true`:
```
https://yoursite.com/?dev=true
```

## Minimal Integration (No Modifications)

If you don't want to modify main.js, you can load the test system separately:

1. Create a new file `sourceFiles/testLoader.js`:

```javascript
import { initializeTestSystem } from "./testing/testIntegration.js";

// Wait for game to be ready
window.addEventListener('load', () => {
  setTimeout(() => {
    if (window.game) {
      window.game.testSystem = initializeTestSystem(window.game);
      console.log('Test system loaded!');
    }
  }, 1000);
});
```

2. Add to `index.html` before closing `</body>`:

```html
<script type="module" src="sourceFiles/testLoader.js"></script>
```

## Troubleshooting

### Test System Not Appearing

- Check browser console for errors
- Verify dev mode is enabled (`?dev=true`)
- Try `window.testSystem.enable()` in console

### Console Won't Open

- Make sure backtick key (`` ` ``) is being pressed
- Check if keyboard input is being captured by game
- Try clicking the game canvas first

### Tests Not Registering

- Verify `registerInGameTests(game)` is called
- Check that game object has all required properties
- Look for errors in browser console

### UI Not Rendering

- Ensure test system is enabled
- Check that `draw()` is being called
- Verify canvas context is valid

## Next Steps

1. **Add More Tests**: Edit `sourceFiles/testing/inGameTests.js`
2. **Customize UI**: Modify `sourceFiles/testing/testUI.js`
3. **Add Commands**: Edit `sourceFiles/testing/testCommands.js`
4. **Configure Tests**: Update `jest.config.js`

## Example: Adding a Custom Test

```javascript
// In sourceFiles/testing/inGameTests.js

registerTest('My custom test', 'Custom', (game) => {
  assert(game.score >= 0, 'Score should not be negative');
  assert(game.player.speed > 0, 'Player should have speed');
}, ['smoke']);
```

## Example: Adding a Custom Console Command

```javascript
// In sourceFiles/testing/testCommands.js
// Inside registerTestCommands function:

devConsole.registerCommand('mystatus', () => {
  return `Game Score: ${game.score}\nPlayer Health: ${game.player.health}`;
}, 'Show game status');
```

Now you can use `mystatus` command in the dev console!
