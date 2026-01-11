/**
 * DebugConsole - Interactive debug console UI with command input and history
 */
export class DebugConsole {
    constructor(commandRegistry, input) {
        this.commandRegistry = commandRegistry;
        this.input = input;
        
        this.visible = false;
        this.inputText = '';
        this.inputCaretPos = 0;
        this.commandHistory = this.loadHistory();
        this.historyIndex = -1;
        this.outputMessages = [];
        this.maxMessages = 20;
        this.suggestions = [];
        this.selectedSuggestion = 0;
        
        // Console dimensions and styling
        this.height = 400;
        this.padding = 15;
        this.fontSize = 16;
        this.lineHeight = 22;
        
        // Animation
        this.animationProgress = 0;
        this.animating = false;
        
        // Track tilde key state
        this.tildePressed = false;
        this.tildeJustPressed = false;
        
        // Set up keyboard listeners
        this.setupKeyboardListeners();
        
        // Add welcome message
        this.addMessage('Developer Console - Type "help" for available commands', '#00ffff');
    }
    
    /**
     * Load command history from localStorage
     */
    loadHistory() {
        const saved = localStorage.getItem('devConsoleHistory');
        return saved ? JSON.parse(saved) : [];
    }
    
    /**
     * Save command history to localStorage
     */
    saveHistory() {
        localStorage.setItem('devConsoleHistory', JSON.stringify(this.commandHistory));
    }
    
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardListeners() {
        // We'll handle keyboard input in the update method using the game's input handler
        // This prevents conflicts with the game's input system
        
        // Listen for typing when console is visible
        this.keydownHandler = (e) => {
            if (!this.visible) return;

            // Prevent console key from being added to input
            const consoleKey = localStorage.getItem('consoleKey') || '`';
            if (e.key === consoleKey || (consoleKey === '`' && e.key === '~')) {
                e.preventDefault();
                return;
            }
            
            // Handle special keys
            if (e.key === 'Enter') {
                e.preventDefault();
                this.executeCommand();
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                if (this.inputCaretPos > 0) {
                    this.inputText = this.inputText.slice(0, this.inputCaretPos - 1) + this.inputText.slice(this.inputCaretPos);
                    this.inputCaretPos--;
                    this.updateSuggestions();
                }
            } else if (e.key === 'Delete') {
                e.preventDefault();
                if (this.inputCaretPos < this.inputText.length) {
                    this.inputText = this.inputText.slice(0, this.inputCaretPos) + this.inputText.slice(this.inputCaretPos + 1);
                    this.updateSuggestions();
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (this.inputCaretPos > 0) {
                    this.inputCaretPos--;
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (this.inputCaretPos < this.inputText.length) {
                    this.inputCaretPos++;
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            } else if (e.key === 'Home') {
                e.preventDefault();
                this.inputCaretPos = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                this.inputCaretPos = this.inputText.length;
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.autocomplete();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hide();
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // Regular character - insert at caret position
                e.preventDefault();
                this.inputText = this.inputText.slice(0, this.inputCaretPos) + e.key + this.inputText.slice(this.inputCaretPos);
                this.inputCaretPos++;
                this.updateSuggestions();
            }
        };
        
        window.addEventListener('keydown', this.keydownHandler);
    }
    
    /**
     * Toggle console visibility
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Show console
     */
    show() {
        this.visible = true;
        this.animating = true;
        this.inputText = '';
        this.inputCaretPos = 0;
        this.historyIndex = -1;
        this.updateSuggestions();
    }

    /**
     * Hide console
     */
    hide() {
        this.visible = false;
        this.animating = true;
        this.inputText = '';
        this.inputCaretPos = 0;
        this.suggestions = [];
    }
    
    /**
     * Update console state
     */
    update(game) {
        // Skip if dev mode not enabled
        if (!game.devMode || !game.devMode.isEnabled()) return;

        // Get the configured console key from localStorage (default to backtick)
        const consoleKey = localStorage.getItem('consoleKey') || '`';

        // Check for console key in input buttons (also check ~ as fallback for backtick)
        let keyPressed = game.input.buttons.indexOf(consoleKey) > -1;
        if (consoleKey === '`') {
            keyPressed = keyPressed || game.input.buttons.indexOf('~') > -1;
        }

        // Detect rising edge (key just pressed) - only toggle if dev mode is already enabled
        if (keyPressed && !this.tildePressed) {
            this.tildeJustPressed = true;
            this.toggle();
        }

        this.tildePressed = keyPressed;
        
        // Animation
        if (this.animating) {
            if (this.visible) {
                this.animationProgress = Math.min(1, this.animationProgress + 0.15);
                if (this.animationProgress >= 1) {
                    this.animating = false;
                }
            } else {
                this.animationProgress = Math.max(0, this.animationProgress - 0.15);
                if (this.animationProgress <= 0) {
                    this.animating = false;
                }
            }
        }
    }
    
    /**
     * Execute current command
     */
    async executeCommand() {
        const command = this.inputText.trim();
        if (command.length === 0) return;
        
        // Add to history
        if (this.commandHistory.length === 0 || this.commandHistory[this.commandHistory.length - 1] !== command) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > 50) {
                this.commandHistory.shift();
            }
            this.saveHistory();
        }
        
        // Display command in console
        this.addMessage(`> ${command}`, '#ffffff');
        
        // Execute command (await in case it's async)
        const result = await this.commandRegistry.execute(command);
        
        // Display result
        const color = result.success ? '#00ff00' : '#ff0000';
        this.addMessage(result.message, color);

        // Clear input
        this.inputText = '';
        this.inputCaretPos = 0;
        this.historyIndex = -1;
        this.updateSuggestions();
    }
    
    /**
     * Navigate command history
     */
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        if (direction < 0) {
            // Up arrow - go back in history
            if (this.historyIndex === -1) {
                this.historyIndex = this.commandHistory.length - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else {
            // Down arrow - go forward in history
            if (this.historyIndex !== -1) {
                this.historyIndex++;
                if (this.historyIndex >= this.commandHistory.length) {
                    this.historyIndex = -1;
                    this.inputText = '';
                    this.inputCaretPos = 0;
                    this.updateSuggestions();
                    return;
                }
            }
        }

        if (this.historyIndex !== -1) {
            this.inputText = this.commandHistory[this.historyIndex];
            this.inputCaretPos = this.inputText.length;
            this.updateSuggestions();
        }
    }
    
    /**
     * Update autocomplete suggestions
     */
    updateSuggestions() {
        if (this.inputText.length === 0) {
            this.suggestions = [];
            return;
        }

        // Pass full input to getSuggestions (it handles both command and argument suggestions)
        this.suggestions = this.commandRegistry.getSuggestions(this.inputText);
        this.selectedSuggestion = 0;
    }
    
    /**
     * Autocomplete current input
     */
    autocomplete() {
        if (this.suggestions.length === 0) return;

        const suggestion = this.suggestions[this.selectedSuggestion];
        const parts = this.inputText.split(/\s+/);

        // If we're completing an argument (there's already a command with space)
        if (parts.length >= 2) {
            // Replace the partial argument with the full suggestion
            parts[parts.length - 1] = suggestion;
            this.inputText = parts.join(' ') + ' ';
        } else {
            // Completing a command
            this.inputText = suggestion + ' ';
        }

        this.inputCaretPos = this.inputText.length;
        this.suggestions = [];
    }
    
    /**
     * Add message to output
     */
    addMessage(message, color = '#ffffff') {
        // Split long messages into multiple lines
        const maxLineLength = 100;
        const lines = [];
        
        for (let i = 0; i < message.length; i += maxLineLength) {
            lines.push(message.substring(i, i + maxLineLength));
        }
        
        for (const line of lines) {
            this.outputMessages.push({ text: line, color });
        }
        
        // Keep only the last N messages
        while (this.outputMessages.length > this.maxMessages) {
            this.outputMessages.shift();
        }
    }
    
    /**
     * Draw console
     */
    draw(context, game) {
        if (this.animationProgress === 0) return;
        
        const rX = window.innerWidth / 2560;
        const width = game.width;
        const currentHeight = this.height * this.animationProgress;
        
        context.save();
        
        // Draw semi-transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.85)';
        context.fillRect(0, 0, width, currentHeight);
        
        // Draw border
        context.strokeStyle = '#00ffff';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(0, currentHeight);
        context.lineTo(width, currentHeight);
        context.stroke();
        
        // Only draw content if fully visible
        if (this.animationProgress >= 0.9) {
            const textX = this.padding;
            let textY = currentHeight - this.padding;
            
            context.font = `${this.fontSize * rX}px monospace`;
            context.textBaseline = 'bottom';
            
            // Draw input line
            context.fillStyle = '#ffffff';
            context.fillText(`> ${this.inputText}`, textX, textY);

            // Draw cursor at caret position
            const textBeforeCaret = `> ${this.inputText.slice(0, this.inputCaretPos)}`;
            const cursorX = textX + context.measureText(textBeforeCaret).width;
            const cursorBlink = Math.floor(Date.now() / 500) % 2;
            if (cursorBlink === 0) {
                context.fillRect(cursorX, textY - this.fontSize * rX, 2, this.fontSize * rX);
            }
            
            textY -= this.lineHeight * rX * 1.5;
            
            // Draw suggestions
            if (this.suggestions.length > 0) {
                context.fillStyle = '#ffff00';
                context.font = `${(this.fontSize - 2) * rX}px monospace`;
                const suggestText = `Suggestions: ${this.suggestions.slice(0, 5).join(', ')}`;
                context.fillText(suggestText, textX, textY);
                textY -= this.lineHeight * rX;
                context.font = `${this.fontSize * rX}px monospace`;
            }
            
            // Draw separator
            context.strokeStyle = '#00ffff';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(this.padding, textY);
            context.lineTo(width - this.padding, textY);
            context.stroke();
            
            textY -= this.padding;
            
            // Draw output messages (newest at bottom)
            for (let i = this.outputMessages.length - 1; i >= 0; i--) {
                const msg = this.outputMessages[i];
                context.fillStyle = msg.color;
                context.fillText(msg.text, textX, textY);
                textY -= this.lineHeight * rX;
                
                if (textY < this.padding) break;
            }
        }
        
        context.restore();
    }
    
    /**
     * Cleanup
     */
    destroy() {
        window.removeEventListener('keydown', this.keydownHandler);
    }
}
