/**
 * Test Runner - In-Game Test Execution Engine
 * Can run tests inside the game environment or from command line
 */

export class TestRunner {
  constructor() {
    this.tests = [];
    this.categories = new Map();
    this.results = [];
    this.isRunning = false;
    this.currentTest = null;
    this.startTime = 0;
    this.endTime = 0;
  }

  /**
   * Register a test
   */
  registerTest(name, category, fn, tags = []) {
    const test = {
      name,
      category,
      fn,
      tags,
      status: 'pending', // pending, running, passed, failed, skipped
      error: null,
      duration: 0,
      warnings: [],
    };

    this.tests.push(test);

    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(test);
  }

  /**
   * Run all tests or filtered tests
   */
  async runTests(filter = {}) {
    this.isRunning = true;
    this.results = [];
    this.startTime = performance.now();

    let testsToRun = this.tests;

    // Filter by category
    if (filter.category) {
      testsToRun = testsToRun.filter(t => t.category === filter.category);
    }

    // Filter by name
    if (filter.name) {
      testsToRun = testsToRun.filter(t => t.name.includes(filter.name));
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      testsToRun = testsToRun.filter(t => 
        filter.tags.some(tag => t.tags.includes(tag))
      );
    }

    // Run tests
    for (const test of testsToRun) {
      await this.runSingleTest(test);
      
      if (filter.stopOnFailure && test.status === 'failed') {
        break;
      }
    }

    this.endTime = performance.now();
    this.isRunning = false;

    return this.generateReport();
  }

  /**
   * Run a single test
   */
  async runSingleTest(test) {
    this.currentTest = test;
    test.status = 'running';
    const testStartTime = performance.now();

    try {
      await test.fn();
      test.status = 'passed';
    } catch (error) {
      test.status = 'failed';
      test.error = error;
    }

    test.duration = performance.now() - testStartTime;
    this.results.push(test);
    this.currentTest = null;
  }

  /**
   * Generate test report
   */
  generateReport() {
    const totalTests = this.results.length;
    const passed = this.results.filter(t => t.status === 'passed').length;
    const failed = this.results.filter(t => t.status === 'failed').length;
    const skipped = this.results.filter(t => t.status === 'skipped').length;
    const warnings = this.results.filter(t => t.warnings.length > 0).length;
    const totalDuration = this.endTime - this.startTime;
    const successRate = totalTests > 0 ? (passed / totalTests * 100).toFixed(1) : 0;

    return {
      totalTests,
      passed,
      failed,
      skipped,
      warnings,
      successRate,
      totalDuration,
      results: this.results,
      failedTests: this.results.filter(t => t.status === 'failed'),
    };
  }

  /**
   * Format test report as text
   */
  formatReport(report) {
    let output = '';

    // Individual test results
    for (const test of report.results) {
      const icon = this.getStatusIcon(test.status);
      const durationStr = `${test.duration.toFixed(0)}ms`;
      
      output += `[${this.getStatusText(test.status)}] ${test.name} - ${durationStr}\n`;
      
      if (test.status === 'failed' && test.error) {
        output += `  Error: ${test.error.message}\n`;
      }
      
      if (test.warnings.length > 0) {
        test.warnings.forEach(warning => {
          output += `  Warning: ${warning}\n`;
        });
      }
    }

    // Summary
    output += '\n========================================\n';
    output += 'TEST SUITE RESULTS\n';
    output += '========================================\n';
    output += `Total Tests: ${report.totalTests}\n`;
    output += `Passed: ${report.passed} ✓\n`;
    output += `Failed: ${report.failed} ✗\n`;
    output += `Skipped: ${report.skipped} ⊘\n`;
    output += `Warnings: ${report.warnings} ⚠\n`;
    output += '========================================\n';
    output += `Success Rate: ${report.successRate}%\n`;
    output += `Total Time: ${(report.totalDuration / 1000).toFixed(2)}s\n`;
    output += '========================================\n';

    // Failed tests detail
    if (report.failedTests.length > 0) {
      output += '\nFAILED TESTS:\n';
      report.failedTests.forEach((test, index) => {
        output += `${index + 1}. [FAIL] ${test.name}\n`;
        if (test.error) {
          output += `   ${test.error.message}\n`;
          if (test.error.stack) {
            output += `   ${test.error.stack.split('\n')[1]}\n`;
          }
        }
      });
    }

    return output;
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    const icons = {
      passed: '✓',
      failed: '✗',
      skipped: '⊘',
      running: '⟳',
      pending: '○',
    };
    return icons[status] || '?';
  }

  /**
   * Get status text
   */
  getStatusText(status) {
    return status.toUpperCase();
  }

  /**
   * Get all categories
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Get tests by category
   */
  getTestsByCategory(category) {
    return this.categories.get(category) || [];
  }

  /**
   * Clear all tests and results
   */
  clear() {
    this.tests = [];
    this.categories.clear();
    this.results = [];
  }
}

/**
 * Global test runner instance
 */
export const globalTestRunner = new TestRunner();

/**
 * Helper function to register a test
 */
export function registerTest(name, category, fn, tags = []) {
  globalTestRunner.registerTest(name, category, fn, tags);
}

/**
 * Helper function to run tests
 */
export async function runTests(filter = {}) {
  return await globalTestRunner.runTests(filter);
}
