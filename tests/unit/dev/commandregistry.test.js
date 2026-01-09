/**
 * CommandRegistry Tests
 * Tests for dev console command functionality
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { createMockGame } from '../../utils/testHelpers.js';
import { CommandRegistry } from '../../../sourceFiles/dev/CommandRegistry.js';

// Mock DevMode
class MockDevMode {
  constructor() {
    this.godMode = false;
    this.instantCooldowns = false;
    this.damageMultiplier = 1.0;
    this.speedMultiplier = 1.0;
    this.inTestRoom = false;
  }
  
  resetAllCheats() {
    this.godMode = false;
    this.instantCooldowns = false;
    this.damageMultiplier = 1.0;
    this.speedMultiplier = 1.0;
  }
}

describe('CommandRegistry - Test Command Fixes', () => {
  let game;
  let devMode;
  let registry;

  beforeEach(() => {
    game = createMockGame({
      overrides: {
        testRoom: {
          active: false,
          enter: jest.fn(),
          exit: jest.fn()
        }
      }
    });
    devMode = new MockDevMode();
    registry = new CommandRegistry(game, devMode);
  });

  test('cmdTest imports and calls registerInGameTests', async () => {
    // Mock the test runner
    jest.unstable_mockModule('../../../sourceFiles/testing/testRunner.js', () => ({
      globalTestRunner: {
        runTests: jest.fn(async () => ({
          totalTests: 10,
          passed: 10,
          failed: 0,
          skipped: 0,
          warnings: 0,
          successRate: 100,
          totalDuration: 100,
          results: []
        })),
        formatReport: jest.fn(() => 'Test results')
      }
    }));

    // Mock registerInGameTests
    jest.unstable_mockModule('../../../sourceFiles/testing/inGameTests.js', () => ({
      registerInGameTests: jest.fn()
    }));

    // Execute the test command
    const result = await registry.cmdTest([]);
    
    // Verify the command succeeded
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
  });

  test('cmdTestFast imports and calls registerInGameTests', async () => {
    // Mock the test runner
    jest.unstable_mockModule('../../../sourceFiles/testing/testRunner.js', () => ({
      globalTestRunner: {
        runTests: jest.fn(async () => ({
          totalTests: 5,
          passed: 5,
          failed: 0,
          successRate: 100
        }))
      }
    }));

    // Mock registerInGameTests
    jest.unstable_mockModule('../../../sourceFiles/testing/inGameTests.js', () => ({
      registerInGameTests: jest.fn()
    }));

    // Execute the testfast command
    const result = await registry.cmdTestFast([]);
    
    // Verify the command succeeded
    expect(result.success).toBe(true);
    expect(result.message).toContain('Smoke tests');
  });

  test('cmdTestVerbose imports and calls registerInGameTests', async () => {
    // Mock the test runner
    jest.unstable_mockModule('../../../sourceFiles/testing/testRunner.js', () => ({
      globalTestRunner: {
        runTests: jest.fn(async () => ({
          totalTests: 10,
          passed: 10,
          failed: 0,
          results: []
        })),
        formatReport: jest.fn(() => 'Verbose test results')
      }
    }));

    // Mock registerInGameTests
    jest.unstable_mockModule('../../../sourceFiles/testing/inGameTests.js', () => ({
      registerInGameTests: jest.fn()
    }));

    // Execute the testverbose command
    const result = await registry.cmdTestVerbose([]);
    
    // Verify the command succeeded
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
  });

  test('cmdTestVerbose accepts category filter', async () => {
    // Mock the test runner
    jest.unstable_mockModule('../../../sourceFiles/testing/testRunner.js', () => ({
      globalTestRunner: {
        runTests: jest.fn(async () => ({
          totalTests: 3,
          passed: 3,
          failed: 0,
          results: []
        })),
        formatReport: jest.fn(() => 'Category test results')
      }
    }));

    // Mock registerInGameTests
    jest.unstable_mockModule('../../../sourceFiles/testing/inGameTests.js', () => ({
      registerInGameTests: jest.fn()
    }));

    // Execute the testverbose command with category
    const result = await registry.cmdTestVerbose(['Player']);
    
    // Verify the command succeeded
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
  });
});
