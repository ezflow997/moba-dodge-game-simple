/**
 * Test System Integration
 * Integrates the test system into the game
 * 
 * To use this, add to main.js after Game class is defined:
 * 
 * import { initializeTestSystem } from './testing/testIntegration.js';
 * 
 * Then in Game constructor, add:
 * this.testSystem = initializeTestSystem(this);
 * 
 * And in the draw/update loops, add:
 * if (this.testSystem) this.testSystem.update(this);
 * if (this.testSystem) this.testSystem.draw(ctx, this);
 */

import { DevConsole } from './devConsole.js';
import { TestUI } from './testUI.js';
import { globalTestRunner } from './testRunner.js';
import { registerInGameTests } from './inGameTests.js';
import { registerTestCommands } from './testCommands.js';

export class TestSystem {
  constructor(game) {
    this.enabled = false; // Set to true to enable testing features
    this.devConsole = new DevConsole();
    this.testUI = new TestUI();
    this.game = game;
    
    // Register test commands
    registerTestCommands(this.devConsole, game, this.testUI);
    
    // Register in-game tests
    registerInGameTests(game);
    
    // Add keyboard shortcut for console toggle
    this.consoleToggleKey = '`';
    this.testUIToggleKey = 'F12';
    
    console.log('Test system initialized. Press ` to open dev console, F12 for test UI.');
  }

  /**
   * Update test system
   */
  update(game) {
    if (!this.enabled) return;
    
    // Handle console toggle
    if (game.input.keys.includes(this.consoleToggleKey)) {
      this.devConsole.toggle();
      game.input.keys = game.input.keys.filter(k => k !== this.consoleToggleKey);
    }
    
    // Handle test UI toggle (F12 is typically keyCode 123)
    // Note: This might need adjustment based on actual input handling
    
    // Update console
    if (this.devConsole.isVisible) {
      this.devConsole.update(game);
    }
    
    // Update test UI
    if (this.testUI.isVisible) {
      this.testUI.update(game);
    }
  }

  /**
   * Draw test system UI
   */
  draw(ctx, game) {
    if (!this.enabled) return;
    
    // Draw test UI
    if (this.testUI.isVisible) {
      this.testUI.draw(ctx, game);
    }
    
    // Draw console (drawn on top)
    if (this.devConsole.isVisible) {
      this.devConsole.draw(ctx, game);
    }
  }

  /**
   * Enable test system
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable test system
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Run tests programmatically
   */
  async runTests(filter = {}) {
    this.testUI.show();
    const report = await globalTestRunner.runTests(filter);
    this.testUI.updateReport(report);
    return report;
  }
}

/**
 * Initialize test system
 * Call this once when the game starts
 */
export function initializeTestSystem(game) {
  const testSystem = new TestSystem(game);
  
  // Enable by default in development
  // Change this to false for production
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.search.includes('dev=true');
  
  if (isDevelopment) {
    testSystem.enable();
  }
  
  // Expose test system globally for console access
  window.testSystem = testSystem;
  window.runTests = (filter) => testSystem.runTests(filter);
  
  return testSystem;
}

/**
 * Example usage in main.js:
 * 
 * import { initializeTestSystem } from './testing/testIntegration.js';
 * 
 * class Game {
 *   constructor(width, height) {
 *     // ... existing code ...
 *     
 *     // Initialize test system
 *     this.testSystem = initializeTestSystem(this);
 *   }
 *   
 *   update() {
 *     // ... existing code ...
 *     
 *     // Update test system
 *     if (this.testSystem) {
 *       this.testSystem.update(this);
 *     }
 *   }
 *   
 *   draw(context) {
 *     // ... existing draw code ...
 *     
 *     // Draw test UI (after all game elements)
 *     if (this.testSystem) {
 *       this.testSystem.draw(context, this);
 *     }
 *   }
 * }
 */
