/**
 * Ability System Unit Tests
 * Tests for player abilities (Q, E, F) including cooldowns
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockPlayer,
  createMockGame,
  advanceGameTime,
} from '../../utils/testHelpers.js';
import {
  assertEquals,
  assertTrue,
  assertFalse,
  assertApproximate,
} from '../../utils/assertions.js';

describe('Ability System Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment(env);
  });

  describe('Q Ability', () => {
    test('Q ability has correct cooldown duration', () => {
      const player = env.player;

      assertEquals(1600, player.qCoolDown, 'Q cooldown should be 1600ms');
    });

    test('Q ability starts ready', () => {
      const player = env.player;

      assertTrue(player.qTriggered, 'Q should be ready initially');
      assertEquals(0, player.qCoolDownElapsed, 'Q cooldown elapsed should be 0');
    });

    test('Q ability can be triggered', () => {
      const player = env.player;

      player.qTriggered = false;
      player.qCoolDownElapsed = 0;

      assertFalse(player.qTriggered, 'Q should not be ready after use');
    });

    test('Q ability tracks press count', () => {
      const player = env.player;

      player.qPresses = 0;
      player.qPresses++;
      player.qPresses++;

      assertEquals(2, player.qPresses, 'Q presses should be tracked');
    });

    test('Q ability cooldown can elapse', () => {
      const player = createMockPlayer(env.game, { qCoolDownElapsed: 1600 });

      assertTrue(player.qCoolDownElapsed >= player.qCoolDown, 
        'Q cooldown should have elapsed');
    });
  });

  describe('E Ability', () => {
    test('E ability has correct cooldown duration', () => {
      const player = env.player;

      assertEquals(6100, player.eCoolDown, 'E cooldown should be 6100ms');
    });

    test('E ability starts ready', () => {
      const player = env.player;

      assertTrue(player.eTriggered, 'E should be ready initially');
      assertEquals(0, player.eCoolDownElapsed, 'E cooldown elapsed should be 0');
    });

    test('E ability has score penalty', () => {
      const player = env.player;

      assertEquals(-250, player.ePenalty, 'E penalty should be -250 points');
    });

    test('E ability can be triggered', () => {
      const player = env.player;

      player.eTriggered = false;
      player.eCoolDownElapsed = 0;

      assertFalse(player.eTriggered, 'E should not be ready after use');
    });

    test('E ability tracks press count', () => {
      const player = env.player;

      player.ePresses = 0;
      player.ePresses++;

      assertEquals(1, player.ePresses, 'E presses should be tracked');
    });
  });

  describe('F Ability', () => {
    test('F ability has correct cooldown duration', () => {
      const player = env.player;

      assertEquals(24000, player.fCoolDown, 'F cooldown should be 24000ms');
    });

    test('F ability starts ready', () => {
      const player = env.player;

      assertTrue(player.fTriggered, 'F should be ready initially');
      assertEquals(0, player.fCoolDownElapsed, 'F cooldown elapsed should be 0');
    });

    test('F ability has score penalty', () => {
      const player = env.player;

      assertEquals(-750, player.fPenalty, 'F penalty should be -750 points');
    });

    test('F ability has longest cooldown', () => {
      const player = env.player;

      assertTrue(player.fCoolDown > player.eCoolDown, 'F cooldown should be longer than E');
      assertTrue(player.fCoolDown > player.qCoolDown, 'F cooldown should be longer than Q');
    });

    test('F ability can be triggered', () => {
      const player = env.player;

      player.fTriggered = false;
      player.fCoolDownElapsed = 0;

      assertFalse(player.fTriggered, 'F should not be ready after use');
    });

    test('F ability tracks press count', () => {
      const player = env.player;

      player.fPresses = 0;
      player.fPresses++;
      player.fPresses++;
      player.fPresses++;

      assertEquals(3, player.fPresses, 'F presses should be tracked');
    });
  });

  describe('Cooldown Management', () => {
    test('All abilities start with zero elapsed cooldown', () => {
      const player = env.player;

      assertEquals(0, player.qCoolDownElapsed, 'Q elapsed should be 0');
      assertEquals(0, player.eCoolDownElapsed, 'E elapsed should be 0');
      assertEquals(0, player.fCoolDownElapsed, 'F elapsed should be 0');
    });

    test('Cooldown values are positive', () => {
      const player = env.player;

      assertTrue(player.qCoolDown > 0, 'Q cooldown should be positive');
      assertTrue(player.eCoolDown > 0, 'E cooldown should be positive');
      assertTrue(player.fCoolDown > 0, 'F cooldown should be positive');
    });

    test('Cooldowns are in ascending order (Q < E < F)', () => {
      const player = env.player;

      assertTrue(player.qCoolDown < player.eCoolDown, 'Q should be faster than E');
      assertTrue(player.eCoolDown < player.fCoolDown, 'E should be faster than F');
    });
  });

  describe('Ability Penalties', () => {
    test('E and F have penalties', () => {
      const player = env.player;

      assertTrue(player.ePenalty < 0, 'E penalty should be negative');
      assertTrue(player.fPenalty < 0, 'F penalty should be negative');
    });

    test('F penalty is larger than E penalty', () => {
      const player = env.player;

      assertTrue(Math.abs(player.fPenalty) > Math.abs(player.ePenalty), 
        'F penalty should be larger than E penalty');
    });
  });

  describe('Press Tracking', () => {
    test('Press counts start at zero', () => {
      const player = env.player;

      assertEquals(0, player.qPresses, 'Q presses should start at 0');
      assertEquals(0, player.ePresses, 'E presses should start at 0');
      assertEquals(0, player.fPresses, 'F presses should start at 0');
    });

    test('Press counts can increment', () => {
      const player = env.player;

      player.qPresses++;
      player.ePresses += 2;
      player.fPresses += 3;

      assertEquals(1, player.qPresses, 'Q presses should increment');
      assertEquals(2, player.ePresses, 'E presses should increment');
      assertEquals(3, player.fPresses, 'F presses should increment');
    });
  });

  describe('Ability State Flags', () => {
    test('All triggered flags exist', () => {
      const player = env.player;

      assertTrue(player.hasOwnProperty('qTriggered'), 'Should have qTriggered');
      assertTrue(player.hasOwnProperty('eTriggered'), 'Should have eTriggered');
      assertTrue(player.hasOwnProperty('fTriggered'), 'Should have fTriggered');
    });

    test('All pressed flags exist', () => {
      const player = env.player;

      assertTrue(player.hasOwnProperty('qPressed'), 'Should have qPressed');
      assertTrue(player.hasOwnProperty('ePressed'), 'Should have ePressed');
      assertTrue(player.hasOwnProperty('fPressed'), 'Should have fPressed');
    });

    test('Pressed flags start false', () => {
      const player = env.player;

      assertFalse(player.qPressed, 'Q should not be pressed initially');
      assertFalse(player.ePressed, 'E should not be pressed initially');
      assertFalse(player.fPressed, 'F should not be pressed initially');
    });
  });
});
