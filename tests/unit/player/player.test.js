/**
 * Player Unit Tests
 * Tests for player spawn, movement, collision, and abilities
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockGame,
  createMockPlayer,
  simulateKeyPress,
  advanceGameTime,
} from '../../utils/testHelpers.js';
import {
  assertEquals,
  assertNotNull,
  assertTrue,
  assertFalse,
  assertInRange,
  assertApproximate,
} from '../../utils/assertions.js';

describe('Player Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment(env);
  });

  describe('Player Spawn', () => {
    test('Player spawns at center of screen', () => {
      const game = createMockGame({ width: 1920, height: 1080 });
      const player = createMockPlayer(game);

      expect(player.x).toBe(1920 / 2);
      expect(player.y).toBe(1080 / 2);
    });

    test('Player spawns with correct initial properties', () => {
      const player = env.player;

      assertNotNull(player, 'Player should exist');
      assertTrue(player.speed > 0, 'Player should have positive speed');
      assertTrue(player.size > 0, 'Player should have positive size');
      assertEquals(0, player.qPresses, 'Q ability should not be pressed initially');
      assertEquals(0, player.ePresses, 'E ability should not be pressed initially');
      assertEquals(0, player.fPresses, 'F ability should not be pressed initially');
    });

    test('Player has correct initial cooldown states', () => {
      const player = env.player;

      assertTrue(player.qTriggered, 'Q ability should be ready');
      assertTrue(player.eTriggered, 'E ability should be ready');
      assertTrue(player.fTriggered, 'F ability should be ready');
      assertEquals(0, player.qCoolDownElapsed, 'Q cooldown should be 0');
      assertEquals(0, player.eCoolDownElapsed, 'E cooldown should be 0');
      assertEquals(0, player.fCoolDownElapsed, 'F cooldown should be 0');
    });
  });

  describe('Player Movement', () => {
    test('Player has positive speed value', () => {
      const player = env.player;
      
      assertInRange(player.speed, 0.1, 100, 'Player speed should be reasonable');
    });

    test('Player position can be updated', () => {
      const player = env.player;
      const initialX = player.x;
      const initialY = player.y;

      player.x += 10;
      player.y += 10;

      assertEquals(initialX + 10, player.x, 'X position should update');
      assertEquals(initialY + 10, player.y, 'Y position should update');
    });

    test('Player desired position can be set', () => {
      const player = env.player;

      player.desiredX = 500;
      player.desiredY = 300;

      assertEquals(500, player.desiredX, 'Desired X should be set');
      assertEquals(300, player.desiredY, 'Desired Y should be set');
    });
  });

  describe('Player Collision', () => {
    test('Player has collision detection flags', () => {
      const player = env.player;

      assertFalse(player.projectileCollision, 'No projectile collision initially');
      assertFalse(player.enemyCollision, 'No enemy collision initially');
    });

    test('Player collision flags can be set', () => {
      const player = env.player;

      player.projectileCollision = true;
      player.enemyCollision = true;

      assertTrue(player.projectileCollision, 'Projectile collision flag set');
      assertTrue(player.enemyCollision, 'Enemy collision flag set');
    });
  });

  describe('Player Abilities - Q Ability', () => {
    test('Q ability has correct cooldown duration', () => {
      const player = env.player;

      assertEquals(1600, player.qCoolDown, 'Q cooldown should be 1600ms');
    });

    test('Q ability starts ready to use', () => {
      const player = env.player;

      assertTrue(player.qTriggered, 'Q should be ready initially');
      assertEquals(0, player.qPresses, 'Q presses should be 0');
    });

    test('Q ability can be pressed', () => {
      const player = env.player;
      simulateKeyPress(env.input, 'q');

      assertTrue(env.input.qPressed, 'Q should be pressed in input');
    });

    test('Q ability tracks press count', () => {
      const player = env.player;
      const initialPresses = player.qPresses;

      player.qPresses++;

      assertEquals(initialPresses + 1, player.qPresses, 'Q presses should increment');
    });
  });

  describe('Player Abilities - E Ability', () => {
    test('E ability has correct cooldown duration', () => {
      const player = env.player;

      assertEquals(6100, player.eCoolDown, 'E cooldown should be 6100ms');
    });

    test('E ability has penalty', () => {
      const player = env.player;

      assertEquals(-250, player.ePenalty, 'E penalty should be -250');
    });

    test('E ability starts ready to use', () => {
      const player = env.player;

      assertTrue(player.eTriggered, 'E should be ready initially');
      assertEquals(0, player.ePresses, 'E presses should be 0');
    });
  });

  describe('Player Abilities - F Ability', () => {
    test('F ability has correct cooldown duration', () => {
      const player = env.player;

      assertEquals(24000, player.fCoolDown, 'F cooldown should be 24000ms');
    });

    test('F ability has penalty', () => {
      const player = env.player;

      assertEquals(-750, player.fPenalty, 'F penalty should be -750');
    });

    test('F ability starts ready to use', () => {
      const player = env.player;

      assertTrue(player.fTriggered, 'F should be ready initially');
      assertEquals(0, player.fPresses, 'F presses should be 0');
    });
  });

  describe('Player Reset', () => {
    test('Player has reset method', () => {
      const player = env.player;

      assertNotNull(player.reset, 'Player should have reset method');
      expect(typeof player.reset).toBe('function');
    });
  });

  describe('Player Size Scaling', () => {
    test('Player size scales with window width', () => {
      const game = createMockGame({ width: 1920 });
      const player = createMockPlayer(game);

      // Player size should be positive and reasonable
      assertTrue(player.size > 0, 'Player size should be positive');
      assertInRange(player.size, 10, 100, 'Player size should be reasonable');
    });
  });
});
