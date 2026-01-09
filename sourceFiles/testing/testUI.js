/**
 * Test UI Panel
 * In-game visual test runner interface
 */

export class TestUI {
  constructor() {
    this.isVisible = false;
    this.tests = [];
    this.currentReport = null;
    this.scrollOffset = 0;
    this.maxVisibleTests = 15;
    this.selectedTestIndex = -1;
    this.filterStatus = 'all'; // all, passed, failed
  }

  /**
   * Toggle UI visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
  }

  /**
   * Show UI
   */
  show() {
    this.isVisible = true;
  }

  /**
   * Hide UI
   */
  hide() {
    this.isVisible = false;
  }

  /**
   * Update test list
   */
  updateTests(tests) {
    this.tests = tests;
  }

  /**
   * Update report
   */
  updateReport(report) {
    this.currentReport = report;
    this.tests = report.results || [];
  }

  /**
   * Scroll up
   */
  scrollUp() {
    this.scrollOffset = Math.max(0, this.scrollOffset - 1);
  }

  /**
   * Scroll down
   */
  scrollDown() {
    const maxScroll = Math.max(0, this.tests.length - this.maxVisibleTests);
    this.scrollOffset = Math.min(maxScroll, this.scrollOffset + 1);
  }

  /**
   * Select next test
   */
  selectNext() {
    if (this.tests.length > 0) {
      this.selectedTestIndex = (this.selectedTestIndex + 1) % this.tests.length;
      // Auto-scroll to keep selected test visible
      if (this.selectedTestIndex >= this.scrollOffset + this.maxVisibleTests) {
        this.scrollDown();
      }
    }
  }

  /**
   * Select previous test
   */
  selectPrevious() {
    if (this.tests.length > 0) {
      this.selectedTestIndex = (this.selectedTestIndex - 1 + this.tests.length) % this.tests.length;
      // Auto-scroll to keep selected test visible
      if (this.selectedTestIndex < this.scrollOffset) {
        this.scrollUp();
      }
    }
  }

  /**
   * Cycle filter
   */
  cycleFilter() {
    const filters = ['all', 'passed', 'failed'];
    const currentIndex = filters.indexOf(this.filterStatus);
    this.filterStatus = filters[(currentIndex + 1) % filters.length];
    this.scrollOffset = 0;
    this.selectedTestIndex = -1;
  }

  /**
   * Get filtered tests
   */
  getFilteredTests() {
    if (this.filterStatus === 'all') {
      return this.tests;
    }
    return this.tests.filter(t => t.status === this.filterStatus);
  }

  /**
   * Draw UI
   */
  draw(ctx, game) {
    if (!this.isVisible) return;

    const width = game.width * 0.8;
    const height = game.height * 0.8;
    const x = game.width * 0.1;
    const y = game.height * 0.1;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Title
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TEST SUITE', game.width / 2, y + 40);

    // Report summary
    if (this.currentReport) {
      this.drawSummary(ctx, game, x + 20, y + 70, width - 40);
    }

    // Test list
    this.drawTestList(ctx, game, x + 20, y + 180, width - 40, height - 250);

    // Controls help
    this.drawControls(ctx, game, x + 20, y + height - 60);
  }

  /**
   * Draw summary section
   */
  drawSummary(ctx, game, x, y, width) {
    const report = this.currentReport;

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';

    // Success rate with color
    const successRate = parseFloat(report.successRate);
    let color = '#4CAF50'; // Green
    if (successRate < 50) color = '#f44336'; // Red
    else if (successRate < 80) color = '#ff9800'; // Orange

    ctx.fillStyle = color;
    ctx.fillText(`Success Rate: ${report.successRate}%`, x, y);

    // Stats
    ctx.fillStyle = '#fff';
    const statsY = y + 30;
    ctx.fillText(`Total: ${report.totalTests}`, x, statsY);
    
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(`Passed: ${report.passed}`, x + 120, statsY);
    
    ctx.fillStyle = '#f44336';
    ctx.fillText(`Failed: ${report.failed}`, x + 240, statsY);
    
    ctx.fillStyle = '#9E9E9E';
    ctx.fillText(`Skipped: ${report.skipped}`, x + 360, statsY);

    // Duration
    ctx.fillStyle = '#fff';
    const duration = (report.totalDuration / 1000).toFixed(2);
    ctx.fillText(`Duration: ${duration}s`, x, statsY + 30);

    // Filter info
    ctx.fillStyle = '#2196F3';
    ctx.fillText(`Filter: ${this.filterStatus.toUpperCase()}`, x + 200, statsY + 30);
  }

  /**
   * Draw test list
   */
  drawTestList(ctx, game, x, y, width, height) {
    const filteredTests = this.getFilteredTests();
    const visibleTests = filteredTests.slice(
      this.scrollOffset,
      this.scrollOffset + this.maxVisibleTests
    );

    ctx.font = '16px monospace';
    ctx.textAlign = 'left';

    let currentY = y;
    const lineHeight = 35;

    visibleTests.forEach((test, index) => {
      const actualIndex = this.scrollOffset + index;
      const isSelected = actualIndex === this.selectedTestIndex;

      // Highlight selected test
      if (isSelected) {
        ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
        ctx.fillRect(x - 5, currentY - 20, width + 10, lineHeight);
      }

      // Status icon and color
      const statusColors = {
        passed: '#4CAF50',
        failed: '#f44336',
        skipped: '#9E9E9E',
        running: '#2196F3',
        pending: '#9E9E9E',
      };
      const statusIcons = {
        passed: '✓',
        failed: '✗',
        skipped: '⊘',
        running: '⟳',
        pending: '○',
      };

      ctx.fillStyle = statusColors[test.status] || '#fff';
      ctx.fillText(statusIcons[test.status] || '?', x, currentY);

      // Test name
      ctx.fillStyle = '#fff';
      const testName = test.name.length > 50 ? test.name.substring(0, 47) + '...' : test.name;
      ctx.fillText(testName, x + 30, currentY);

      // Duration
      ctx.fillStyle = '#9E9E9E';
      ctx.textAlign = 'right';
      ctx.fillText(`${test.duration.toFixed(0)}ms`, x + width, currentY);
      ctx.textAlign = 'left';

      // Error message if failed and selected
      if (test.status === 'failed' && isSelected && test.error) {
        ctx.fillStyle = '#f44336';
        ctx.font = '14px monospace';
        const errorMsg = test.error.message.substring(0, 80);
        ctx.fillText(`  Error: ${errorMsg}`, x + 30, currentY + 20);
        ctx.font = '16px monospace';
      }

      currentY += lineHeight;
    });

    // Scroll indicator
    if (filteredTests.length > this.maxVisibleTests) {
      const scrollBarHeight = height;
      const scrollBarY = y;
      const scrollBarX = x + width + 10;

      // Scrollbar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(scrollBarX, scrollBarY, 10, scrollBarHeight);

      // Scrollbar thumb
      const thumbHeight = (this.maxVisibleTests / filteredTests.length) * scrollBarHeight;
      const thumbY = scrollBarY + (this.scrollOffset / filteredTests.length) * scrollBarHeight;
      ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
      ctx.fillRect(scrollBarX, thumbY, 10, thumbHeight);
    }
  }

  /**
   * Draw controls
   */
  drawControls(ctx, game, x, y) {
    ctx.font = '14px Arial';
    ctx.fillStyle = '#9E9E9E';
    ctx.textAlign = 'left';

    const controls = [
      '↑/↓: Navigate',
      'F: Filter',
      'R: Re-run',
      'ESC: Close'
    ];

    controls.forEach((control, index) => {
      ctx.fillText(control, x + (index * 150), y);
    });
  }

  /**
   * Update UI (handle input)
   */
  update(game) {
    if (!this.isVisible) return;

    // Handle keyboard input
    const input = game.input;

    // Navigate with arrow keys
    if (input.keys.includes('ArrowUp')) {
      this.selectPrevious();
      // Remove key to prevent rapid firing
      input.keys = input.keys.filter(k => k !== 'ArrowUp');
    }

    if (input.keys.includes('ArrowDown')) {
      this.selectNext();
      input.keys = input.keys.filter(k => k !== 'ArrowDown');
    }

    // Filter toggle with F key
    if (input.keys.includes('f') || input.keys.includes('F')) {
      this.cycleFilter();
      input.keys = input.keys.filter(k => k !== 'f' && k !== 'F');
    }

    // Close with Escape
    if (input.escapePressed) {
      this.hide();
      input.escapePressed = false;
    }
  }
}
