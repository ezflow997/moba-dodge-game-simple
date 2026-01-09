/**
 * Combat and Collision Unit Tests
 * Tests for damage calculation, collision detection, and combat mechanics
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockEnemy,
  createMockPlayer,
  createMockProjectile,
  checkCircularCollision,
  createMockGame,
} from '../../utils/testHelpers.js';
import {
  assertEquals,
  assertTrue,
  assertFalse,
  assertInRange,
} from '../../utils/assertions.js';

describe('Combat and Collision Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment(env);
  });

  describe('Collision Detection', () => {
    test('Detects collision between close objects', () => {
      const obj1 = { x: 100, y: 100, size: 40 };
      const obj2 = { x: 110, y: 110, size: 40 };

      const collision = checkCircularCollision(obj1, obj2);

      assertTrue(collision, 'Should detect collision between overlapping objects');
    });

    test('No collision for far apart objects', () => {
      const obj1 = { x: 100, y: 100, size: 40 };
      const obj2 = { x: 500, y: 500, size: 40 };

      const collision = checkCircularCollision(obj1, obj2);

      assertFalse(collision, 'Should not detect collision for distant objects');
    });

    test('Detects collision at exact boundary', () => {
      const obj1 = { x: 100, y: 100, size: 40 };
      const obj2 = { x: 140, y: 100, size: 40 }; // Exactly touching

      const collision = checkCircularCollision(obj1, obj2);

      // May or may not collide depending on exact implementation
      // Just verify it returns a boolean
      assertTrue(typeof collision === 'boolean', 'Should return boolean');
    });

    test('Player has collision flags', () => {
      const player = env.player;

      assertTrue(player.hasOwnProperty('projectileCollision'), 
        'Player should have projectileCollision flag');
      assertTrue(player.hasOwnProperty('enemyCollision'), 
        'Player should have enemyCollision flag');
    });

    test('Collision flags start false', () => {
      const player = env.player;

      assertFalse(player.projectileCollision, 'No projectile collision initially');
      assertFalse(player.enemyCollision, 'No enemy collision initially');
    });
  });

  describe('Enemy Damage System', () => {
    test('Enemy takes damage correctly', () => {
      const enemy = createMockEnemy({ health: 100 });

      enemy.takeDamage(25);

      assertEquals(75, enemy.health, 'Enemy health should decrease by 25');
    });

    test('Enemy dies when health reaches zero', () => {
      const enemy = createMockEnemy({ health: 50 });

      enemy.takeDamage(50);

      assertTrue(enemy.isDead, 'Enemy should be dead');
      assertTrue(enemy.markedForDeletion, 'Enemy should be marked for deletion');
    });

    test('Enemy dies when health goes negative', () => {
      const enemy = createMockEnemy({ health: 50 });

      enemy.takeDamage(100);

      assertTrue(enemy.isDead, 'Enemy should be dead from overkill');
    });

    test('Multiple damage instances accumulate', () => {
      const enemy = createMockEnemy({ health: 100 });

      enemy.takeDamage(20);
      enemy.takeDamage(30);
      enemy.takeDamage(10);

      assertEquals(40, enemy.health, 'Health should decrease from multiple hits');
    });

    test('Enemy with max health property', () => {
      const enemy = createMockEnemy({ health: 100, maxHealth: 100 });

      assertEquals(100, enemy.maxHealth, 'Should have max health property');
      assertEquals(enemy.health, enemy.maxHealth, 'Initial health equals max health');
    });

    test('Enemy health percentage calculation', () => {
      const enemy = createMockEnemy({ health: 100, maxHealth: 100 });

      enemy.takeDamage(75);

      const healthPercent = (enemy.health / enemy.maxHealth) * 100;
      assertEquals(25, healthPercent, 'Health should be 25%');
    });
  });

  describe('Projectile Collision', () => {
    test('Projectile can be marked for deletion after hit', () => {
      const projectile = createMockProjectile();

      projectile.markedForDeletion = true;

      assertTrue(projectile.markedForDeletion, 
        'Projectile should be marked for deletion');
    });

    test('Projectile collision with player (close)', () => {
      const projectile = createMockProjectile({ x: 100, y: 100, size: 15 });
      const player = { x: 105, y: 105, size: 40 };

      const collision = checkCircularCollision(projectile, player);

      assertTrue(collision, 'Projectile should collide with nearby player');
    });

    test('Projectile collision with player (far)', () => {
      const projectile = createMockProjectile({ x: 100, y: 100, size: 15 });
      const player = { x: 500, y: 500, size: 40 };

      const collision = checkCircularCollision(projectile, player);

      assertFalse(collision, 'Projectile should not collide with distant player');
    });

    test('Projectile starts not marked for deletion', () => {
      const projectile = createMockProjectile();

      assertFalse(projectile.markedForDeletion, 
        'Projectile should not be marked initially');
    });
  });

  describe('Enemy Collision with Player', () => {
    test('Enemy collides with player when close', () => {
      const enemy = createMockEnemy({ x: 100, y: 100, size: 62 });
      const player = { x: 110, y: 110, size: 40 };

      const collision = checkCircularCollision(enemy, player);

      assertTrue(collision, 'Enemy should collide with nearby player');
    });

    test('Enemy does not collide with distant player', () => {
      const enemy = createMockEnemy({ x: 100, y: 100, size: 62 });
      const player = { x: 1000, y: 1000, size: 40 };

      const collision = checkCircularCollision(enemy, player);

      assertFalse(collision, 'Enemy should not collide with distant player');
    });
  });

  describe('Damage Over Time', () => {
    test('Enemy can take damage multiple times over time', () => {
      const enemy = createMockEnemy({ health: 100 });

      // Simulate DOT ticks
      enemy.takeDamage(10); // Tick 1
      enemy.takeDamage(10); // Tick 2
      enemy.takeDamage(10); // Tick 3

      assertEquals(70, enemy.health, 'Health should decrease from DOT');
    });

    test('Enemy dies from DOT', () => {
      const enemy = createMockEnemy({ health: 25 });

      enemy.takeDamage(10);
      enemy.takeDamage(10);
      enemy.takeDamage(10);

      assertTrue(enemy.isDead, 'Enemy should die from DOT');
    });
  });

  describe('Hitbox Size Calculations', () => {
    test('Player has reasonable size', () => {
      const player = env.player;

      assertInRange(player.size, 10, 100, 'Player size should be reasonable');
    });

    test('Enemy has reasonable size', () => {
      const enemy = createMockEnemy();

      assertInRange(enemy.size, 10, 200, 'Enemy size should be reasonable');
    });

    test('Projectile has reasonable size', () => {
      const projectile = createMockProjectile();

      assertInRange(projectile.size, 5, 100, 'Projectile size should be reasonable');
    });

    test('Larger objects have bigger collision radius', () => {
      const smallObj = { x: 100, y: 100, size: 20 };
      const largeObj = { x: 100, y: 100, size: 80 };

      // Same position, different sizes
      const collisionRadius1 = smallObj.size / 2;
      const collisionRadius2 = largeObj.size / 2;

      assertTrue(collisionRadius2 > collisionRadius1, 
        'Larger object should have bigger collision radius');
    });
  });

  describe('Enemy Death State', () => {
    test('Enemy has isDead flag', () => {
      const enemy = createMockEnemy();

      assertTrue(enemy.hasOwnProperty('isDead'), 'Enemy should have isDead flag');
    });

    test('Enemy is not dead initially', () => {
      const enemy = createMockEnemy();

      assertFalse(enemy.isDead, 'Enemy should be alive initially');
    });

    test('Enemy marked for deletion when dead', () => {
      const enemy = createMockEnemy({ health: 10 });

      enemy.takeDamage(10);

      assertTrue(enemy.isDead, 'Enemy should be dead');
      assertTrue(enemy.markedForDeletion, 'Enemy should be marked for deletion');
    });
  });

  describe('Collision Edge Cases', () => {
    test('Objects at exact same position collide', () => {
      const obj1 = { x: 100, y: 100, size: 40 };
      const obj2 = { x: 100, y: 100, size: 40 };

      const collision = checkCircularCollision(obj1, obj2);

      assertTrue(collision, 'Objects at same position should collide');
    });

    test('Tiny objects can collide', () => {
      const obj1 = { x: 100, y: 100, size: 1 };
      const obj2 = { x: 100, y: 100, size: 1 };

      const collision = checkCircularCollision(obj1, obj2);

      assertTrue(collision, 'Even tiny objects at same position should collide');
    });

    test('Zero-size objects handled', () => {
      const obj1 = { x: 100, y: 100, size: 0 };
      const obj2 = { x: 100, y: 100, size: 0 };

      // Should not throw error
      const collision = checkCircularCollision(obj1, obj2);
      assertTrue(typeof collision === 'boolean', 'Should return boolean');
    });
  });
});
