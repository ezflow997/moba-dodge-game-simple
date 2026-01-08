/**
 * TestRoom Tests
 * Tests for TestRoom functionality including bullet collision effects
 */

import { describe, test, expect, jest } from '@jest/globals';
import { createMockGame } from '../../utils/testHelpers.js';
import { TestRoom } from '../../../sourceFiles/dev/TestRoom.js';

describe('TestRoom - Bug Fixes', () => {
  test('TestRoom uses spawnBurst for bullet collision effects', () => {
    // Create mock game with effects manager
    const game = createMockGame({
      overrides: {
        effects: {
          spawnBurst: jest.fn(),
          reset: () => {},
          update: () => {},
          draw: () => {},
        },
        bullets: {
          bulletsList: [
            { x: 100, y: 100, size: 8 }
          ]
        },
        voidBolts: {
          bolts: [],
          reset: () => {}
        }
      }
    });

    // Create test room
    const testRoom = new TestRoom(game);
    testRoom.active = true;
    
    // Create a dummy at the exact same position as the bullet
    const dummy = testRoom.createDummy(100, 100, 1000, 'Test', false);
    testRoom.dummies = [dummy];
    
    // Check bullet collisions (this will trigger spawnBurst)
    testRoom.checkBulletCollisions(dummy);
    
    // Verify spawnBurst was called (not addExplosion)
    expect(game.effects.spawnBurst).toHaveBeenCalled();
    expect(game.effects.spawnBurst).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      'enemyDeath'
    );
  });

  test('TestRoom checkBulletCollisions handles effects gracefully when effects is null', () => {
    // Create mock game without effects manager
    const game = createMockGame({
      overrides: {
        effects: null,
        bullets: {
          bulletsList: [
            { x: 100, y: 100, size: 8 }
          ]
        },
        voidBolts: {
          bolts: [],
          reset: () => {}
        }
      }
    });

    // Create test room
    const testRoom = new TestRoom(game);
    testRoom.active = true;
    
    // Create a dummy at the exact same position as the bullet
    const dummy = testRoom.createDummy(100, 100, 1000, 'Test', false);
    testRoom.dummies = [dummy];
    
    // This should not throw an error even though effects is null
    expect(() => {
      testRoom.checkBulletCollisions(dummy);
    }).not.toThrow();
  });

  test('TestRoom can be entered and exited', () => {
    const game = createMockGame({
      overrides: {
        player: {
          x: 960,
          y: 540,
          speed: 4.1,
          size: 40,
          desiredX: 960,
          desiredY: 540
        },
        enemies: {
          enemiesList: [],
          level: 1
        },
        projectiles: {
          projectilesList: []
        },
        bullets: {
          bulletsList: []
        },
        voidBolts: {
          bolts: [],
          reset: () => {}
        }
      }
    });

    const testRoom = new TestRoom(game);
    
    // Enter test room
    testRoom.enter();
    expect(testRoom.active).toBe(true);
    expect(testRoom.dummies.length).toBeGreaterThan(0);
    
    // Exit test room
    testRoom.exit();
    expect(testRoom.active).toBe(false);
    expect(testRoom.dummies.length).toBe(0);
  });
});
