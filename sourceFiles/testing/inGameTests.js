/**
 * In-Game Tests
 * Tests that can be executed during gameplay in dev mode
 */

import { registerTest } from './testRunner.js';

/**
 * Helper: Assert that throws error if false
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Register all in-game tests
 */
export function registerInGameTests(game) {
  // ===== PLAYER TESTS =====
  
  registerTest('Player spawns correctly', 'Player', () => {
    assert(game.player, 'Player should exist');
    assert(game.player.x > 0, 'Player X position should be positive');
    assert(game.player.y > 0, 'Player Y position should be positive');
  }, ['smoke']);

  registerTest('Player has correct speed', 'Player', () => {
    assert(game.player.speed > 0, 'Player speed should be positive');
    assert(game.player.speed < 100, 'Player speed should be reasonable');
  }, ['smoke']);

  registerTest('Player abilities have cooldowns', 'Player', () => {
    assert(game.player.qCoolDown === 1600, 'Q cooldown should be 1600ms');
    assert(game.player.eCoolDown === 6100, 'E cooldown should be 6100ms');
    assert(game.player.fCoolDown === 24000, 'F cooldown should be 24000ms');
  });

  registerTest('Player has collision flags', 'Player', () => {
    assert(game.player.hasOwnProperty('projectileCollision'), 'Player should have projectileCollision flag');
    assert(game.player.hasOwnProperty('enemyCollision'), 'Player should have enemyCollision flag');
  });

  // ===== GAME STATE TESTS =====
  
  registerTest('Game has correct dimensions', 'Game', () => {
    assert(game.width > 0, 'Game width should be positive');
    assert(game.height > 0, 'Game height should be positive');
  }, ['smoke']);

  registerTest('Game has difficulty levels', 'Game', () => {
    assert(game.difficulties, 'Game should have difficulties');
    assert(game.difficulties.length === 5, 'Should have 5 difficulty levels');
    assert(game.difficulties.includes('EASY'), 'Should have EASY difficulty');
    assert(game.difficulties.includes('INSANE'), 'Should have INSANE difficulty');
  }, ['smoke']);

  registerTest('Game has challenge modes', 'Game', () => {
    assert(game.challenges, 'Game should have challenges');
    assert(game.challenges.length === 2, 'Should have 2 challenge modes');
  });

  registerTest('Game has required managers', 'Game', () => {
    assert(game.effects, 'Game should have effects manager');
    assert(game.world, 'Game should have world manager');
    assert(game.rewardManager, 'Game should have reward manager');
    assert(game.sound, 'Game should have sound manager');
  }, ['smoke']);

  // ===== ENEMY TESTS =====
  
  registerTest('Enemy manager exists', 'Enemy', () => {
    assert(game.enemies, 'Enemy manager should exist');
    assert(Array.isArray(game.enemies.enemiesList), 'Should have enemies list');
  }, ['smoke']);

  registerTest('Enemy difficulty scaling configured', 'Enemy', () => {
    assert(game.enemies.difficulty_speed, 'Should have difficulty speeds');
    assert(game.enemies.difficulty_speed.length === 5, 'Should have 5 speed settings');
    assert(game.enemies.difficulty_size, 'Should have difficulty sizes');
    assert(game.enemies.difficulty_size.length === 5, 'Should have 5 size settings');
  });

  registerTest('Enemy boss system configured', 'Enemy', () => {
    assert(game.enemies.hasOwnProperty('bossActive'), 'Should have bossActive flag');
    assert(game.enemies.bossScoreThreshold > 0, 'Should have boss score threshold');
    assert(game.enemies.bossDefeatBonus > 0, 'Should have boss defeat bonus');
  });

  // ===== PROJECTILE TESTS =====
  
  registerTest('Projectile manager exists', 'Projectile', () => {
    assert(game.projectiles, 'Projectile manager should exist');
    assert(Array.isArray(game.projectiles.projectilesList), 'Should have projectiles list');
  }, ['smoke']);

  registerTest('Projectile difficulty scaling configured', 'Projectile', () => {
    assert(game.projectiles.difficulty_speed, 'Should have difficulty speeds');
    assert(game.projectiles.difficulty_speed.length === 5, 'Should have 5 speed settings');
    assert(game.projectiles.difficulty_size, 'Should have difficulty sizes');
    assert(game.projectiles.difficulty_size.length === 5, 'Should have 5 size settings');
  });

  // ===== BULLET TESTS =====
  
  registerTest('Bullet manager exists', 'Bullet', () => {
    assert(game.bullets, 'Bullet manager should exist');
    assert(Array.isArray(game.bullets.bulletsList), 'Should have bullets list');
  }, ['smoke']);

  registerTest('VoidBolts manager exists', 'Bullet', () => {
    assert(game.voidBolts, 'VoidBolts manager should exist');
    assert(Array.isArray(game.voidBolts.bolts), 'Should have bolts list');
  });

  // ===== UI TESTS =====
  
  registerTest('Display manager exists', 'UI', () => {
    assert(game.display, 'Display manager should exist');
  }, ['smoke']);

  registerTest('Menu system exists', 'UI', () => {
    assert(game.menu, 'Menu should exist');
  }, ['smoke']);

  registerTest('Pause menu exists', 'UI', () => {
    assert(game.pauseMenu, 'Pause menu should exist');
    assert(game.pauseMenu.hasOwnProperty('isPaused'), 'Should have isPaused flag');
  });

  // ===== EFFECTS TESTS =====
  
  registerTest('Effects manager has methods', 'Effects', () => {
    assert(game.effects.reset, 'Effects should have reset method');
    assert(game.effects.update, 'Effects should have update method');
    assert(game.effects.draw, 'Effects should have draw method');
  }, ['smoke']);

  registerTest('World manager has methods', 'World', () => {
    assert(game.world.reset, 'World should have reset method');
    assert(game.world.update, 'World should have update method');
    assert(game.world.draw, 'World should have draw method');
  }, ['smoke']);

  // ===== REWARD TESTS =====
  
  registerTest('Reward manager exists', 'Reward', () => {
    assert(game.rewardManager, 'Reward manager should exist');
    assert(game.rewardManager.reset, 'Should have reset method');
    assert(game.rewardManager.update, 'Should have update method');
    assert(game.rewardManager.draw, 'Should have draw method');
  }, ['smoke']);

  registerTest('Reward manager has score multiplier', 'Reward', () => {
    assert(game.rewardManager.hasOwnProperty('scoreMultiplier'), 'Should have scoreMultiplier');
  });

  // ===== SCORE TESTS =====
  
  registerTest('Score system initialized', 'Score', () => {
    assert(game.hasOwnProperty('score'), 'Game should have score');
    assert(game.score >= 0, 'Score should be non-negative');
  }, ['smoke']);

  registerTest('Player data structure exists', 'Score', () => {
    assert(game.player_data, 'Player data should exist');
    assert(game.player_data.high_score, 'Should have high score array');
    assert(game.player_data.last_score, 'Should have last score array');
  });

  // ===== INPUT TESTS =====
  
  registerTest('Input handler exists', 'Input', () => {
    assert(game.input, 'Input handler should exist');
  }, ['smoke']);

  registerTest('Input has key tracking', 'Input', () => {
    assert(game.input.hasOwnProperty('keys'), 'Input should track keys');
  });

  // ===== SOUND TESTS =====
  
  registerTest('Sound manager exists', 'Sound', () => {
    assert(game.sound, 'Sound manager should exist');
  }, ['smoke']);

  registerTest('Global sound reference set', 'Sound', () => {
    assert(window.gameSound, 'Global game sound should be set');
  });

  // ===== PERFORMANCE TESTS =====
  
  registerTest('Game FPS configured', 'Performance', () => {
    assert(game.logic_fps === 60, 'Logic FPS should be 60');
  }, ['smoke']);

  registerTest('Game time tracking works', 'Performance', () => {
    const time1 = performance.now();
    assert(time1 > 0, 'Performance.now should work');
  }, ['smoke']);
}
