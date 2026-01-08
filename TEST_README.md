# Test Suite Documentation

## Overview

This project includes a comprehensive automated test suite that verifies all game systems are working correctly. Tests can be run via command line (for CI/CD) or in-game (when dev mode is enabled).

## Running Tests

### Command Line

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run smoke tests (quick validation)
npm run test:fast

# Run tests in verbose mode
npm run test:verbose

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests for CI/CD
npm run test:ci
```

### In-Game Console

When dev mode is enabled, you can run tests from the in-game console:

1. Press **`~`** or **`` ` ``** to open the dev console
2. Use the following commands:

```
test                  - Run all tests
test <category>       - Run tests in a specific category (e.g., test Player)
testfast              - Run quick smoke tests only
testverbose           - Run with detailed logging
testverbose <category> - Run category tests with verbose output
testlist              - List all available test categories
testshow              - Show the test UI panel
testhide              - Hide the test UI panel
testclear             - Clear test results
testreport            - Show the last test report
```

### Test UI Panel

Press **F12** to toggle the test UI panel, which shows:

- Test results with color-coded status
- Success rate and summary statistics
- Detailed error messages for failed tests
- Filter options (all/passed/failed)

**Keyboard Shortcuts:**
- **↑/↓**: Navigate through tests
- **F**: Cycle through filters (all → passed → failed)
- **R**: Re-run tests
- **ESC**: Close the UI

## Test Categories

### Player Tests
- Player spawns correctly
- Player movement in all directions
- Player collision detection
- Player abilities (Q, E, F)
- Ability cooldowns
- Player health and damage

### Enemy Tests
- Enemies spawn correctly
- Enemy AI and pathfinding
- Enemies detect and attack player
- Enemy damage and death
- Enemy loot drops
- Boss mechanics

### Projectile Tests
- Projectile spawning and movement
- Projectile collision detection
- Projectile despawn (timeout/hit)
- Projectile damage application

### Combat Tests
- Damage calculation accuracy
- Critical hits (if applicable)
- Damage over time effects
- Status effects (stun, slow, etc.)
- Invincibility frames

### UI Tests
- Health bar updates
- Cooldown indicators
- Score counter
- Menu navigation

### Performance Tests
- FPS maintains target (60fps)
- Memory usage stays within bounds
- No memory leaks

## Writing New Tests

### Jest Tests (Command Line)

Create test files in the `tests/` directory following this structure:

```javascript
import { describe, test, expect } from '@jest/globals';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from '../utils/testHelpers.js';
import {
  assertEquals,
  assertTrue,
  assertFalse,
} from '../utils/assertions.js';

describe('My Feature Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment(env);
  });

  test('Feature works correctly', () => {
    // Arrange
    const player = env.player;
    
    // Act
    player.x = 100;
    
    // Assert
    assertEquals(100, player.x, 'Player X should be 100');
  });
});
```

### In-Game Tests

Add tests to `sourceFiles/testing/inGameTests.js`:

```javascript
import { registerTest } from './testRunner.js';

registerTest('My test name', 'CategoryName', (game) => {
  // Test implementation
  assert(game.player, 'Player should exist');
  assert(game.player.x > 0, 'Player X should be positive');
}, ['smoke']); // Optional tags
```

## Test Utilities

### Assertions

The test suite provides custom assertion functions:

```javascript
import {
  assertEquals,        // Assert two values are equal
  assertNotNull,       // Assert value is not null/undefined
  assertInRange,       // Assert value is within range
  assertTrue,          // Assert condition is true
  assertFalse,         // Assert condition is false
  assertThrows,        // Assert function throws error
  assertApproximate,   // Assert value is approximately equal (with tolerance)
  assertContains,      // Assert array contains element
  assertLength,        // Assert array has specific length
  assertGreaterThan,   // Assert value is greater than threshold
  assertLessThan,      // Assert value is less than threshold
} from './utils/assertions.js';
```

### Test Helpers

```javascript
import {
  setupTestEnvironment,      // Create clean game state
  teardownTestEnvironment,   // Clean up after tests
  createMockGame,            // Create mock game object
  createMockPlayer,          // Create mock player object
  createMockEnemy,           // Create mock enemy object
  createMockProjectile,      // Create mock projectile object
  createMockInput,           // Create mock input handler
  simulateKeyPress,          // Simulate keyboard input
  simulateMouseClick,        // Simulate mouse input
  advanceGameTime,           // Fast-forward game simulation
  waitForCondition,          // Wait for async conditions
  checkCircularCollision,    // Check collision between objects
  createSeededRandom,        // Create reproducible random generator
} from './utils/testHelpers.js';
```

## Test Output Format

Tests report their status in the following format:

```
[PASS] Test Name - Completed in 25ms
[FAIL] Test Name - Expected: <value>, Got: <value> (50ms)
[SKIP] Test Name - Dependency not met
[WARN] Test Name - Passed but with warnings
```

### Summary Report

```
========================================
TEST SUITE RESULTS
========================================
Total Tests: 150
Passed: 145 ✓
Failed: 3 ✗
Skipped: 2 ⊘
Warnings: 0 ⚠
========================================
Success Rate: 96.7%
Total Time: 2.45s
========================================

FAILED TESTS:
1. [FAIL] Enemy Pathfinding - Path not found
   Expected: Valid path array
   Got: null
   Location: tests/enemy_tests.js:45
```

## CI/CD Integration

The test suite automatically runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### GitHub Actions Workflow

The workflow:
1. Runs tests on multiple Node.js versions (18.x, 20.x)
2. Generates coverage reports
3. Uploads test artifacts
4. Comments on PRs with test results

### Test Configuration

Edit `jest.config.js` to customize:
- Test environment
- Coverage thresholds
- Test patterns
- Timeout values

## Troubleshooting

### Common Issues

**Tests fail with "jest is not defined"**
- Ensure you're using the test scripts in `package.json`
- Don't use `jest.fn()` directly in non-test files

**Tests time out**
- Increase timeout in `jest.config.js`
- Check for infinite loops or hanging promises

**In-game tests don't appear**
- Ensure dev mode is enabled
- Check that tests are registered with `registerTest()`
- Verify `registerInGameTests(game)` is called

**Coverage not generated**
- Run `npm run test:coverage`
- Check `jest.config.js` for coverage configuration

### Debug Mode

Enable verbose test output:

```bash
npm run test:verbose
```

Or in-game:

```
testverbose
```

## Best Practices

1. **Keep tests focused**: Each test should verify one specific behavior
2. **Use descriptive names**: Test names should clearly describe what they test
3. **Clean up after tests**: Always use `teardownTestEnvironment()`
4. **Make tests deterministic**: Use seeded random for reproducible results
5. **Test edge cases**: Don't just test the happy path
6. **Keep tests fast**: Smoke tests should complete in under 5 seconds
7. **Mock external dependencies**: Don't rely on network or file system
8. **Document complex tests**: Add comments explaining non-obvious test logic

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add tests for edge cases
4. Update this documentation if needed
5. Run full test suite before committing

## Support

For issues or questions about the test suite:
- Check this documentation
- Review existing test examples
- Open an issue on GitHub
