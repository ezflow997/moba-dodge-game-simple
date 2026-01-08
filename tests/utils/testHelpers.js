/**
 * Test Utilities
 * Helper functions for setting up and managing test environments
 */

/**
 * Create a mock game object for testing
 */
export function createMockGame(options = {}) {
  const width = options.width || 1920;
  const height = options.height || 1080;
  
  return {
    width,
    height,
    logic_fps: 60,
    render_fps: -1,
    score: 0,
    scorePrev: 0,
    gameOver: false,
    showMessage: '',
    showMessageNow: performance.now(),
    difficulties: ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'],
    difficulty_level: options.difficulty || 0,
    challenges: ['NORMAL', 'CHALLENGING'],
    challenge_level: 0,
    game_time: performance.now(),
    msUpdate: performance.now(),
    msDraw: performance.now(),
    msScore: performance.now(),
    // Mock managers
    effects: {
      reset: () => {},
      update: () => {},
      draw: () => {},
      addScreenFlash: () => {},
    },
    world: {
      reset: () => {},
      update: () => {},
      draw: () => {},
      shake: () => {},
    },
    rewardManager: {
      reset: () => {},
      update: () => {},
      draw: () => {},
      drawActiveRewardsUI: () => {},
      canSurviveHit: () => false,
      scoreMultiplier: 1,
    },
    sound: {
      playPlayerDeath: () => {},
      playAbilitySound: () => {},
      playEnemyDeath: () => {},
    },
    ...options.overrides,
  };
}

/**
 * Create a mock player for testing
 */
export function createMockPlayer(game, options = {}) {
  const x = options.x !== undefined ? options.x : game.width / 2;
  const y = options.y !== undefined ? options.y : game.height / 2;
  
  return {
    playerID: 1,
    x,
    y,
    baseSpeed: 4.1,
    speed: 4.1,
    size: 40,
    dx: 0,
    dy: 0,
    desiredX: x,
    desiredY: y,
    
    // Abilities
    qCoolDown: 1600,
    qCoolDownElapsed: options.qCoolDownElapsed || 0,
    qPressed: false,
    qPressedNow: performance.now(),
    qTriggered: true,
    qPresses: 0,
    
    eCoolDown: 6100,
    eCoolDownElapsed: options.eCoolDownElapsed || 0,
    ePressed: false,
    ePressedNow: performance.now(),
    eTriggered: true,
    ePresses: 0,
    ePenalty: -250,
    
    fCoolDown: 24000,
    fCoolDownElapsed: options.fCoolDownElapsed || 0,
    fPressed: false,
    fPressedNow: performance.now(),
    fTriggered: true,
    fPresses: 0,
    fPenalty: -750,
    
    projectileCollision: false,
    enemyCollision: false,
    
    // Methods
    reset: () => {},
    update: () => {},
    draw: () => {},
    checkCollision: () => {},
    
    ...options.overrides,
  };
}

/**
 * Create a mock enemy for testing
 */
export function createMockEnemy(options = {}) {
  return {
    x: options.x || 100,
    y: options.y || 100,
    speed: options.speed || 5.9,
    size: options.size || 62,
    color: options.color || 'green',
    health: options.health || 100,
    maxHealth: options.maxHealth || 100,
    isDead: false,
    markedForDeletion: false,
    
    // Methods
    update: () => {},
    draw: () => {},
    takeDamage: function(amount) {
      this.health -= amount;
      if (this.health <= 0) {
        this.isDead = true;
        this.markedForDeletion = true;
      }
    },
    checkCollision: () => {},
    
    ...options.overrides,
  };
}

/**
 * Create a mock projectile for testing
 */
export function createMockProjectile(options = {}) {
  return {
    x: options.x || 0,
    y: options.y || 0,
    dx: options.dx || 1,
    dy: options.dy || 0,
    speed: options.speed || 12,
    size: options.size || 15,
    color: options.color || 'red',
    markedForDeletion: false,
    
    // Methods
    update: () => {},
    draw: () => {},
    checkCollision: () => {},
    
    ...options.overrides,
  };
}

/**
 * Create a mock input handler for testing
 */
export function createMockInput(options = {}) {
  return {
    keys: options.keys || [],
    mouseX: options.mouseX || 0,
    mouseY: options.mouseY || 0,
    mousePressed: options.mousePressed || false,
    escapePressed: options.escapePressed || false,
    qPressed: options.qPressed || false,
    ePressed: options.ePressed || false,
    fPressed: options.fPressed || false,
  };
}

/**
 * Setup a complete test environment with all necessary objects
 */
export function setupTestEnvironment(options = {}) {
  const game = createMockGame(options.game);
  const player = createMockPlayer(game, options.player);
  const input = createMockInput(options.input);
  
  return {
    game,
    player,
    input,
    enemies: [],
    projectiles: [],
    bullets: [],
    pickups: [],
  };
}

/**
 * Teardown test environment (cleanup)
 */
export function teardownTestEnvironment(env) {
  // Clean up any references
  if (env && env.enemies) env.enemies.length = 0;
  if (env && env.projectiles) env.projectiles.length = 0;
  if (env && env.bullets) env.bullets.length = 0;
  if (env && env.pickups) env.pickups.length = 0;
}

/**
 * Simulate game time advancement
 */
export function advanceGameTime(milliseconds) {
  const currentTime = performance.now();
  performance.now = jest.fn(() => currentTime + milliseconds);
}

/**
 * Wait for a condition to be true (with timeout)
 */
export async function waitForCondition(conditionFn, timeout = 5000) {
  const startTime = Date.now();
  
  while (!conditionFn()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Simulate keyboard input
 */
export function simulateKeyPress(input, key, duration = 100) {
  if (!input.keys.includes(key)) {
    input.keys.push(key);
  }
  
  // Set specific key flags
  if (key === 'q' || key === 'Q') input.qPressed = true;
  if (key === 'e' || key === 'E') input.ePressed = true;
  if (key === 'f' || key === 'F') input.fPressed = true;
  if (key === 'Escape') input.escapePressed = true;
  
  // Auto-release after duration
  if (duration > 0) {
    setTimeout(() => {
      const index = input.keys.indexOf(key);
      if (index > -1) {
        input.keys.splice(index, 1);
      }
      if (key === 'q' || key === 'Q') input.qPressed = false;
      if (key === 'e' || key === 'E') input.ePressed = false;
      if (key === 'f' || key === 'F') input.fPressed = false;
      if (key === 'Escape') input.escapePressed = false;
    }, duration);
  }
}

/**
 * Simulate mouse input
 */
export function simulateMouseClick(input, x, y) {
  input.mouseX = x;
  input.mouseY = y;
  input.mousePressed = true;
  
  // Auto-release
  setTimeout(() => {
    input.mousePressed = false;
  }, 50);
}

/**
 * Get current game time
 */
export function getGameTime() {
  return performance.now();
}

/**
 * Check collision between two circular objects
 */
export function checkCircularCollision(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = (obj1.size || 0) / 2 + (obj2.size || 0) / 2;
  return distance < minDistance;
}

/**
 * Create a seeded random number generator for reproducible tests
 */
export function createSeededRandom(seed = 12345) {
  let state = seed;
  
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}
