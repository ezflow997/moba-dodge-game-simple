/**
 * Smoke Tests
 * Quick tests to verify basic game functionality
 */

import { describe, test, expect } from '@jest/globals';
import {
  createMockGame,
  createMockPlayer,
  createMockEnemy,
  createMockProjectile,
} from '../utils/testHelpers.js';
import {
  assertTrue,
  assertNotNull,
} from '../utils/assertions.js';

describe('Smoke Tests - Quick Validation', () => {
  test('Game object can be created', () => {
    const game = createMockGame();
    
    assertNotNull(game, 'Game should exist');
    assertTrue(game.width > 0, 'Game should have width');
    assertTrue(game.height > 0, 'Game should have height');
  });

  test('Player object can be created', () => {
    const game = createMockGame();
    const player = createMockPlayer(game);
    
    assertNotNull(player, 'Player should exist');
    assertTrue(player.speed > 0, 'Player should have speed');
  });

  test('Enemy object can be created', () => {
    const enemy = createMockEnemy();
    
    assertNotNull(enemy, 'Enemy should exist');
    assertTrue(enemy.health > 0, 'Enemy should have health');
  });

  test('Projectile object can be created', () => {
    const projectile = createMockProjectile();
    
    assertNotNull(projectile, 'Projectile should exist');
    assertTrue(projectile.speed > 0, 'Projectile should have speed');
  });

  test('Game has difficulty levels', () => {
    const game = createMockGame();
    
    assertNotNull(game.difficulties, 'Game should have difficulty levels');
    assertTrue(game.difficulties.length > 0, 'Should have at least one difficulty');
  });

  test('Player abilities have cooldowns', () => {
    const game = createMockGame();
    const player = createMockPlayer(game);
    
    assertTrue(player.qCoolDown > 0, 'Q ability should have cooldown');
    assertTrue(player.eCoolDown > 0, 'E ability should have cooldown');
    assertTrue(player.fCoolDown > 0, 'F ability should have cooldown');
  });

  test('Enemy can take damage', () => {
    const enemy = createMockEnemy({ health: 100 });
    
    enemy.takeDamage(10);
    
    assertTrue(enemy.health < 100, 'Enemy health should decrease');
  });

  test('Game has managers', () => {
    const game = createMockGame();
    
    assertNotNull(game.effects, 'Game should have effects manager');
    assertNotNull(game.world, 'Game should have world manager');
    assertNotNull(game.rewardManager, 'Game should have reward manager');
  });
});
