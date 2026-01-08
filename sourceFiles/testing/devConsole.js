/**
 * Dev Console
 * Simple in-game console for running test commands
 */

export class DevConsole {
  constructor() {
    this.isVisible = false;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.currentCommand = '';
    this.output = [];
    this.maxOutputLines = 10;
    this.commands = new Map();
    
    // Register default commands
    this.registerCommand('help', this.helpCommand.bind(this), 'Show available commands');
    this.registerCommand('clear', this.clearCommand.bind(this), 'Clear console output');
  }

  /**
   * Register a command
   */
  registerCommand(name, handler, description = '') {
    this.commands.set(name, { handler, description });
  }

  /**
   * Toggle console visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.currentCommand = '';
    }
  }

  /**
   * Execute a command
   */
  async executeCommand(commandStr) {
    this.output.push(`> ${commandStr}`);
    this.commandHistory.push(commandStr);
    this.historyIndex = this.commandHistory.length;

    const parts = commandStr.trim().split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (command) {
      try {
        const result = await command.handler(args);
        if (result) {
          this.addOutput(result);
        }
      } catch (error) {
        this.addOutput(`Error: ${error.message}`, 'error');
      }
    } else {
      this.addOutput(`Unknown command: ${commandName}. Type 'help' for available commands.`, 'error');
    }

    this.currentCommand = '';
  }

  /**
   * Add output line
   */
  addOutput(text, type = 'normal') {
    const lines = text.split('\n');
    lines.forEach(line => {
      this.output.push({ text: line, type });
    });

    // Keep only recent output
    if (this.output.length > this.maxOutputLines * 2) {
      this.output = this.output.slice(-this.maxOutputLines * 2);
    }
  }

  /**
   * Clear output
   */
  clearCommand() {
    this.output = [];
    return 'Console cleared.';
  }

  /**
   * Help command
   */
  helpCommand() {
    let help = 'Available commands:\n';
    this.commands.forEach((cmd, name) => {
      help += `  ${name.padEnd(15)} - ${cmd.description}\n`;
    });
    return help;
  }

  /**
   * Navigate command history
   */
  historyUp() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentCommand = this.commandHistory[this.historyIndex] || '';
    }
  }

  historyDown() {
    if (this.historyIndex < this.commandHistory.length) {
      this.historyIndex++;
      this.currentCommand = this.commandHistory[this.historyIndex] || '';
    }
  }

  /**
   * Handle keyboard input
   */
  handleKey(key) {
    if (key === 'Enter') {
      if (this.currentCommand.trim()) {
        this.executeCommand(this.currentCommand);
      }
    } else if (key === 'Backspace') {
      this.currentCommand = this.currentCommand.slice(0, -1);
    } else if (key === 'ArrowUp') {
      this.historyUp();
    } else if (key === 'ArrowDown') {
      this.historyDown();
    } else if (key.length === 1) {
      // Regular character
      this.currentCommand += key;
    }
  }

  /**
   * Draw console
   */
  draw(ctx, game) {
    if (!this.isVisible) return;

    const width = game.width * 0.8;
    const height = 400;
    const x = game.width * 0.1;
    const y = game.height - height - 50;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DEV CONSOLE', x + 10, y + 20);

    // Output
    ctx.font = '14px monospace';
    let outputY = y + 50;
    const recentOutput = this.output.slice(-this.maxOutputLines);
    
    recentOutput.forEach(line => {
      if (typeof line === 'string') {
        ctx.fillStyle = '#fff';
        ctx.fillText(line, x + 10, outputY);
      } else {
        ctx.fillStyle = line.type === 'error' ? '#ff5555' : '#fff';
        ctx.fillText(line.text, x + 10, outputY);
      }
      outputY += 20;
    });

    // Input line
    const inputY = y + height - 30;
    ctx.fillStyle = '#00ff00';
    ctx.fillText('>', x + 10, inputY);
    ctx.fillStyle = '#fff';
    ctx.fillText(this.currentCommand, x + 30, inputY);

    // Cursor
    const cursorX = x + 30 + ctx.measureText(this.currentCommand).width;
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(cursorX, inputY - 12, 8, 15);
    }
  }

  /**
   * Update console
   */
  update(game) {
    // Console toggle is handled externally (typically with ~ or ` key)
  }
}
