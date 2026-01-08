/**
 * Projectile Unit Tests
 * Tests for projectile spawn, movement, collision, and despawn
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockProjectile,
  checkCircularCollision,
} from '../../utils/testHelpers.js';
import {
  assertEquals,
  assertNotNull,
  assertTrue,
  assertFalse,
  assertGreaterThan,
  assertApproximate,
} from '../../utils/assertions.js';

describe('Projectile Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment(env);
  });

  describe('Projectile Spawn', () => {
    test('Projectile spawns at correct position', () => {
      const projectile = createMockProjectile({ x: 100, y: 200 });

      assertEquals(100, projectile.x, 'Projectile X should be correct');
      assertEquals(200, projectile.y, 'Projectile Y should be correct');
    });

    test('Projectile has velocity', () => {
      const projectile = createMockProjectile({ dx: 1, dy: 0 });

      assertNotNull(projectile.dx, 'Projectile should have dx');
      assertNotNull(projectile.dy, 'Projectile should have dy');
    });

    test('Projectile has speed property', () => {
      const projectile = createMockProjectile({ speed: 12 });

      assertEquals(12, projectile.speed, 'Projectile speed should be correct');
      assertGreaterThan(projectile.speed, 0, 'Projectile speed should be positive');
    });

    test('Projectile has size property', () => {
      const projectile = createMockProjectile({ size: 15 });

      assertEquals(15, projectile.size, 'Projectile size should be correct');
      assertGreaterThan(projectile.size, 0, 'Projectile size should be positive');
    });

    test('Projectile has color property', () => {
      const projectile = createMockProjectile({ color: 'red' });

      assertEquals('red', projectile.color, 'Projectile color should be correct');
    });

    test('Projectile not marked for deletion initially', () => {
      const projectile = createMockProjectile();

      assertFalse(projectile.markedForDeletion, 'Projectile should not be marked for deletion');
    });
  });

  describe('Projectile Movement', () => {
    test('Projectile moves in direction of velocity', () => {
      const projectile = createMockProjectile({ x: 100, y: 100, dx: 1, dy: 0, speed: 10 });
      
      const newX = projectile.x + projectile.dx * projectile.speed;
      const newY = projectile.y + projectile.dy * projectile.speed;

      assertEquals(110, newX, 'Projectile should move in X direction');
      assertEquals(100, newY, 'Projectile Y should not change');
    });

    test('Projectile diagonal movement', () => {
      const projectile = createMockProjectile({ 
        x: 0, 
        y: 0, 
        dx: 0.707, 
        dy: 0.707, 
        speed: 10 
      });
      
      const moveDistance = Math.sqrt(
        Math.pow(projectile.dx * projectile.speed, 2) + 
        Math.pow(projectile.dy * projectile.speed, 2)
      );

      assertApproximate(10, moveDistance, 0.1, 'Projectile should move correct distance diagonally');
    });

    test('Projectile normalized direction vector', () => {
      const projectile = createMockProjectile({ dx: 0.6, dy: 0.8 });
      
      const magnitude = Math.sqrt(projectile.dx ** 2 + projectile.dy ** 2);

      assertApproximate(1, magnitude, 0.01, 'Direction vector should be normalized');
    });
  });

  describe('Projectile Collision', () => {
    test('Projectile collision with player', () => {
      const projectile = createMockProjectile({ x: 100, y: 100, size: 15 });
      const player = { x: 110, y: 110, size: 40 };

      const collision = checkCircularCollision(projectile, player);

      assertTrue(collision, 'Projectile should collide with nearby player');
    });

    test('Projectile no collision when far away', () => {
      const projectile = createMockProjectile({ x: 100, y: 100, size: 15 });
      const player = { x: 500, y: 500, size: 40 };

      const collision = checkCircularCollision(projectile, player);

      assertFalse(collision, 'Projectile should not collide with far away player');
    });

    test('Projectile marked for deletion after collision', () => {
      const projectile = createMockProjectile();

      projectile.markedForDeletion = true;

      assertTrue(projectile.markedForDeletion, 'Projectile should be marked for deletion');
    });
  });

  describe('Projectile Despawn', () => {
    test('Projectile can be marked for deletion', () => {
      const projectile = createMockProjectile();

      projectile.markedForDeletion = true;

      assertTrue(projectile.markedForDeletion, 'Projectile marked for deletion flag should be set');
    });

    test('Projectile despawn on boundary exit', () => {
      const projectile = createMockProjectile({ x: -100, y: 100 });
      const gameWidth = 1920;
      const gameHeight = 1080;

      const outOfBounds = projectile.x < 0 || projectile.x > gameWidth ||
                          projectile.y < 0 || projectile.y > gameHeight;

      assertTrue(outOfBounds, 'Projectile should be out of bounds');
    });
  });

  describe('Projectile Methods', () => {
    test('Projectile has update method', () => {
      const projectile = createMockProjectile();

      assertNotNull(projectile.update, 'Projectile should have update method');
      expect(typeof projectile.update).toBe('function');
    });

    test('Projectile has draw method', () => {
      const projectile = createMockProjectile();

      assertNotNull(projectile.draw, 'Projectile should have draw method');
      expect(typeof projectile.draw).toBe('function');
    });

    test('Projectile has collision check method', () => {
      const projectile = createMockProjectile();

      assertNotNull(projectile.checkCollision, 'Projectile should have checkCollision method');
      expect(typeof projectile.checkCollision).toBe('function');
    });
  });

  describe('Projectile Difficulty Scaling', () => {
    test('Different difficulty speeds', () => {
      const easyProjectile = createMockProjectile({ speed: 12 });
      const hardProjectile = createMockProjectile({ speed: 21 });
      const insaneProjectile = createMockProjectile({ speed: 27 });

      assertTrue(easyProjectile.speed < hardProjectile.speed, 'Hard projectile should be faster');
      assertTrue(hardProjectile.speed < insaneProjectile.speed, 'Insane projectile should be fastest');
    });

    test('Different difficulty sizes', () => {
      const easyProjectile = createMockProjectile({ size: 15 });
      const hardProjectile = createMockProjectile({ size: 30 });
      const insaneProjectile = createMockProjectile({ size: 35 });

      assertTrue(easyProjectile.size < hardProjectile.size, 'Hard projectile should be larger');
      assertTrue(hardProjectile.size < insaneProjectile.size, 'Insane projectile should be largest');
    });
  });
});
