/**
 * Test Commands
 * Console commands for running tests
 */

import { globalTestRunner } from './testRunner.js';

/**
 * Register test commands with dev console
 */
export function registerTestCommands(devConsole, game, testUI) {
  
  // Test command - run all tests
  devConsole.registerCommand('test', async (args) => {
    if (args.length === 0) {
      // Run all tests
      testUI.show();
      devConsole.addOutput('Running all tests...');
      const report = await globalTestRunner.runTests({});
      testUI.updateReport(report);
      devConsole.addOutput(`Tests complete: ${report.passed}/${report.totalTests} passed`);
      return globalTestRunner.formatReport(report);
    } else {
      // Run specific category or test
      const category = args[0];
      testUI.show();
      devConsole.addOutput(`Running tests in category: ${category}`);
      const report = await globalTestRunner.runTests({ category });
      testUI.updateReport(report);
      return globalTestRunner.formatReport(report);
    }
  }, 'Run all tests or tests in a category: test [category]');

  // Testfast command - run smoke tests only
  devConsole.registerCommand('testfast', async () => {
    testUI.show();
    devConsole.addOutput('Running smoke tests...');
    const report = await globalTestRunner.runTests({ tags: ['smoke'] });
    testUI.updateReport(report);
    devConsole.addOutput(`Smoke tests complete: ${report.passed}/${report.totalTests} passed`);
    return `Smoke tests: ${report.passed}/${report.totalTests} passed (${report.successRate}%)`;
  }, 'Run quick smoke tests');

  // Testverbose command - run with detailed output
  devConsole.registerCommand('testverbose', async (args) => {
    testUI.show();
    devConsole.addOutput('Running tests in verbose mode...');
    const filter = args.length > 0 ? { category: args[0] } : {};
    const report = await globalTestRunner.runTests(filter);
    testUI.updateReport(report);
    return globalTestRunner.formatReport(report);
  }, 'Run tests with verbose output: testverbose [category]');

  // Testlist command - list all available tests
  devConsole.registerCommand('testlist', () => {
    const categories = globalTestRunner.getCategories();
    let output = 'Available test categories:\n';
    categories.forEach(category => {
      const tests = globalTestRunner.getTestsByCategory(category);
      output += `  ${category} (${tests.length} tests)\n`;
    });
    return output;
  }, 'List all available tests and categories');

  // Testshow command - show test UI
  devConsole.registerCommand('testshow', () => {
    testUI.show();
    return 'Test UI opened';
  }, 'Show the test UI panel');

  // Testhide command - hide test UI
  devConsole.registerCommand('testhide', () => {
    testUI.hide();
    return 'Test UI closed';
  }, 'Hide the test UI panel');

  // Testclear command - clear test results
  devConsole.registerCommand('testclear', () => {
    globalTestRunner.clear();
    testUI.updateReport(null);
    testUI.updateTests([]);
    return 'Test results cleared';
  }, 'Clear all test results');

  // Testreport command - show last test report
  devConsole.registerCommand('testreport', () => {
    if (testUI.currentReport) {
      return globalTestRunner.formatReport(testUI.currentReport);
    } else {
      return 'No test report available. Run tests first.';
    }
  }, 'Show the last test report');
}

/**
 * Register keyboard shortcuts for testing
 */
export function setupTestKeyboardShortcuts(game, testUI, devConsole) {
  // This would be integrated into the main input handler
  // For now, we just define what the shortcuts should do
  
  return {
    // Ctrl+T: Run all tests
    'ctrl+t': async () => {
      testUI.show();
      const report = await globalTestRunner.runTests({});
      testUI.updateReport(report);
    },
    
    // Ctrl+Shift+T: Run smoke tests
    'ctrl+shift+t': async () => {
      testUI.show();
      const report = await globalTestRunner.runTests({ tags: ['smoke'] });
      testUI.updateReport(report);
    },
    
    // F12: Toggle test UI
    'f12': () => {
      testUI.toggle();
    },
  };
}
