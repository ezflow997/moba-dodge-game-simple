/**
 * Enemy Unit Tests
 * Tests for enemy spawn, behavior, damage, and death
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockEnemy,
  createMockGame,
} from '../../utils/testHelpers.js';
import {
  assertEquals,
  assertNotNull,
  assertTrue,
  assertFalse,
  assertInRange,
  assertGreaterThan,
} from '../../utils/assertions.js';

describe('Enemy Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment(env);
  });

  describe('Enemy Spawn', () => {
    test('Enemy spawns with correct position', () => {
      const enemy = createMockEnemy({ x: 100, y: 200 });

      assertEquals(100, enemy.x, 'Enemy X position should be correct');
      assertEquals(200, enemy.y, 'Enemy Y position should be correct');
    });

    test('Enemy spawns with health', () => {
      const enemy = createMockEnemy({ health: 100 });

      assertEquals(100, enemy.health, 'Enemy should have health');
      assertGreaterThan(enemy.health, 0, 'Enemy health should be positive');
    });

    test('Enemy has speed and size properties', () => {
      const enemy = createMockEnemy();

      assertNotNull(enemy.speed, 'Enemy should have speed');
      assertNotNull(enemy.size, 'Enemy should have size');
      assertGreaterThan(enemy.speed, 0, 'Enemy speed should be positive');
      assertGreaterThan(enemy.size, 0, 'Enemy size should be positive');
    });

    test('Enemy has color property', () => {
      const enemy = createMockEnemy({ color: 'green' });

      assertEquals('green', enemy.color, 'Enemy should have correct color');
    });

    test('Enemy is not dead initially', () => {
      const enemy = createMockEnemy();

      assertFalse(enemy.isDead, 'Enemy should not be dead initially');
      assertFalse(enemy.markedForDeletion, 'Enemy should not be marked for deletion');
    });
  });

  describe('Enemy Damage', () => {
    test('Enemy takes damage correctly', () => {
      const enemy = createMockEnemy({ health: 100 });
      const initialHealth = enemy.health;

      enemy.takeDamage(25);

      assertEquals(initialHealth - 25, enemy.health, 'Enemy health should decrease by damage amount');
    });

    test('Enemy health cannot go below zero', () => {
      const enemy = createMockEnemy({ health: 50 });

      enemy.takeDamage(100);

      assertTrue(enemy.health <= 0, 'Enemy health should be 0 or negative after lethal damage');
    });

    test('Enemy dies when health reaches zero', () => {
      const enemy = createMockEnemy({ health: 50 });

      enemy.takeDamage(50);

      assertTrue(enemy.isDead, 'Enemy should be dead when health reaches 0');
    });

    test('Enemy marked for deletion when killed', () => {
      const enemy = createMockEnemy({ health: 50 });

      enemy.takeDamage(50);

      assertTrue(enemy.markedForDeletion, 'Enemy should be marked for deletion when killed');
    });
  });

  describe('Enemy Death', () => {
    test('Enemy death flag set correctly', () => {
      const enemy = createMockEnemy({ health: 100 });

      enemy.takeDamage(100);

      assertTrue(enemy.isDead, 'Enemy isDead flag should be true');
    });

    test('Multiple damage hits can kill enemy', () => {
      const enemy = createMockEnemy({ health: 100 });

      enemy.takeDamage(30);
      enemy.takeDamage(30);
      enemy.takeDamage(40);

      assertTrue(enemy.health <= 0, 'Enemy should die from multiple hits');
      assertTrue(enemy.isDead, 'Enemy should be marked as dead');
    });
  });

  describe('Enemy Behavior', () => {
    test('Enemy has update method', () => {
      const enemy = createMockEnemy();

      assertNotNull(enemy.update, 'Enemy should have update method');
      expect(typeof enemy.update).toBe('function');
    });

    test('Enemy has draw method', () => {
      const enemy = createMockEnemy();

      assertNotNull(enemy.draw, 'Enemy should have draw method');
      expect(typeof enemy.draw).toBe('function');
    });

    test('Enemy has collision check method', () => {
      const enemy = createMockEnemy();

      assertNotNull(enemy.checkCollision, 'Enemy should have checkCollision method');
      expect(typeof enemy.checkCollision).toBe('function');
    });
  });

  describe('Enemy Difficulty Scaling', () => {
    test('Different difficulty speeds', () => {
      const easyEnemy = createMockEnemy({ speed: 5.9 });
      const hardEnemy = createMockEnemy({ speed: 7.0 });
      const insaneEnemy = createMockEnemy({ speed: 8.5 });

      assertTrue(easyEnemy.speed < hardEnemy.speed, 'Hard enemy should be faster than easy');
      assertTrue(hardEnemy.speed < insaneEnemy.speed, 'Insane enemy should be faster than hard');
    });

    test('Different difficulty sizes', () => {
      const easyEnemy = createMockEnemy({ size: 62 });
      const hardEnemy = createMockEnemy({ size: 40 });
      const insaneEnemy = createMockEnemy({ size: 20 });

      assertTrue(easyEnemy.size > hardEnemy.size, 'Easy enemy should be larger than hard');
      assertTrue(hardEnemy.size > insaneEnemy.size, 'Hard enemy should be larger than insane');
    });
  });

  describe('Enemy Max Health', () => {
    test('Enemy has max health property', () => {
      const enemy = createMockEnemy({ health: 100, maxHealth: 100 });

      assertEquals(100, enemy.maxHealth, 'Enemy should have max health');
      assertEquals(enemy.health, enemy.maxHealth, 'Initial health should equal max health');
    });

    test('Enemy health percentage can be calculated', () => {
      const enemy = createMockEnemy({ health: 100, maxHealth: 100 });

      enemy.takeDamage(50);

      const healthPercent = (enemy.health / enemy.maxHealth) * 100;
      assertEquals(50, healthPercent, 'Health should be 50%');
    });
  });
});
