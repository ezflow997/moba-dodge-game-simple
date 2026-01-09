import { Button, superFunctions } from "./supers.js";
import { SupabaseLeaderboard } from "../supabase/supabase.js";

export class NameInputMenu {
    constructor() {
        this.super = new superFunctions();
        this.supabase = new SupabaseLeaderboard();
        this.isVisible = false;
        this.playerName = '';
        this.password = '';
        this.maxNameLength = 12;
        this.maxPasswordLength = 20;
        this.onSubmit = null;
        this.clicked = false;
        this.cursorBlink = 0;

        // Input state: 'name', 'checkingName', 'password', 'submitting'
        this.inputState = 'name';
        this.isNewPlayer = false;
        this.errorMessage = '';
        this.showPassword = false;

        // Which field is active
        this.activeField = 'name'; // 'name' or 'password'

        this.submitButton = new Button(1080, 580, 280, 70, "Submit", 45, 75, 50, false, true, 'white', 'white');
        this.nextButton = new Button(1080, 580, 280, 70, "Next", 45, 90, 50, false, true, 'white', 'white');
        this.togglePasswordButton = new Button(1320, 500, 50, 50, "*", 35, 12, 38, false, true, 'white', 'white');

        // Bind keyboard handler
        this.keyHandler = this.handleKeyPress.bind(this);
    }

    show(onSubmitCallback, allowRegistration = true) {
        this.isVisible = true;
        this.playerName = '';
        this.password = '';
        this.onSubmit = onSubmitCallback;
        this.cursorBlink = 0;
        this.inputState = 'name';
        this.activeField = 'name';
        this.isNewPlayer = false;
        this.errorMessage = '';
        this.showPassword = false;
        this.allowRegistration = allowRegistration;

        // Add keyboard listener
        document.addEventListener('keydown', this.keyHandler);
    }

    hide() {
        this.isVisible = false;
        // Remove keyboard listener
        document.removeEventListener('keydown', this.keyHandler);
    }

    handleKeyPress(e) {
        if (!this.isVisible) return;
        if (this.inputState === 'checkingName' || this.inputState === 'submitting') return;

        // Handle backspace
        if (e.key === 'Backspace') {
            if (this.activeField === 'name' && this.inputState === 'name') {
                this.playerName = this.playerName.slice(0, -1);
            } else if (this.activeField === 'password') {
                this.password = this.password.slice(0, -1);
            }
            e.preventDefault();
            return;
        }

        // Handle Tab to switch fields (only in password state)
        if (e.key === 'Tab' && this.inputState === 'password') {
            this.activeField = this.activeField === 'name' ? 'password' : 'name';
            e.preventDefault();
            return;
        }

        // Handle enter
        if (e.key === 'Enter') {
            if (this.inputState === 'name' && this.playerName.trim().length > 0) {
                this.checkPlayerName();
            } else if (this.inputState === 'password' && this.password.length >= 4) {
                this.submitWithPassword();
            }
            e.preventDefault();
            return;
        }

        // Handle escape - cancel without submitting
        if (e.key === 'Escape') {
            this.hide();
            if (this.onSubmit) this.onSubmit(null); // Signal cancelled
            e.preventDefault();
            return;
        }

        // Handle regular characters
        if (e.key.length === 1) {
            if (this.activeField === 'name' && this.inputState === 'name') {
                if (this.playerName.length < this.maxNameLength && /^[a-zA-Z0-9_\-]$/.test(e.key)) {
                    this.playerName += e.key;
                }
            } else if (this.activeField === 'password' && this.inputState === 'password') {
                if (this.password.length < this.maxPasswordLength && /^[a-zA-Z0-9!@#$%^&*_\-]$/.test(e.key)) {
                    this.password += e.key;
                }
            }
            e.preventDefault();
        }
    }

    async checkPlayerName() {
        if (this.playerName.trim().length === 0) return;

        this.inputState = 'checkingName';
        this.errorMessage = '';

        try {
            const exists = await this.supabase.checkPlayerExists(this.playerName.trim());
            this.isNewPlayer = !exists;

            // Block new account creation if not allowed
            if (this.isNewPlayer && !this.allowRegistration) {
                this.errorMessage = 'New accounts disabled this session';
                this.inputState = 'name';
                return;
            }

            this.inputState = 'password';
            this.activeField = 'password';
        } catch (error) {
            this.errorMessage = 'Connection error';
            this.inputState = 'name';
        }
    }

    async submitWithPassword() {
        if (this.password.length < 4) {
            this.errorMessage = 'Password must be at least 4 characters';
            return;
        }

        this.inputState = 'submitting';
        this.errorMessage = '';

        const name = this.playerName.trim();

        // If existing player, verify password first
        if (!this.isNewPlayer) {
            try {
                const verification = await this.supabase.verifyPassword(name, this.password);
                if (!verification.valid) {
                    this.errorMessage = 'Incorrect password';
                    this.inputState = 'password';
                    this.password = ''; // Clear the password field
                    return;
                }
            } catch (error) {
                this.errorMessage = 'Verification failed. Try again.';
                this.inputState = 'password';
                return;
            }
        }

        // Password verified (or new player), proceed
        if (name.length > 0 && this.onSubmit) {
            this.hide();
            this.onSubmit({ name: name, password: this.password, isNewPlayer: this.isNewPlayer });
        }
    }

    update(game) {
        if (!this.isVisible) return;

        const inX = game.input.mouseX;
        const inY = game.input.mouseY;

        // Update cursor blink
        this.cursorBlink = (this.cursorBlink + 1) % 60;

        // Handle click release
        if (this.clicked && game.input.buttons.indexOf(0) == -1) {
            this.clicked = false;
        }

        // Don't process buttons during loading states
        if (this.inputState === 'checkingName' || this.inputState === 'submitting') return;

        // Next button (name state)
        if (this.inputState === 'name') {
            this.nextButton.update(inX, inY);
            if (this.nextButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.playerName.trim().length > 0) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.checkPlayerName();
            }
        }

        // Submit button (password state)
        if (this.inputState === 'password') {
            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.password.length >= 4) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.submitWithPassword();
            }

            // Toggle password visibility
            this.togglePasswordButton.update(inX, inY);
            if (this.togglePasswordButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showPassword = !this.showPassword;
            }
        }
    }

    draw(context, game) {
        if (!this.isVisible) return;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Dark overlay
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.85)';
        context.fillRect(0, 0, game.width, game.height);
        context.restore();

        // Input panel - taller to fit password field
        const panelHeight = this.inputState === 'password' ? 420 : 320;
        context.save();
        context.fillStyle = 'rgba(10, 20, 40, 0.95)';
        context.fillRect(580 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.strokeStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 3 * rY;
        context.strokeRect(580 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.restore();

        // Title
        if (this.inputState === 'name') {
            this.super.drawGlowText(context, 820, 350, "ENTER YOUR NAME", 50, '#ffffff', '#00ffff', 12);
            this.super.drawGlowText(context, 780, 390, "to submit your score", 28, '#888888', '#666666', 5);
        } else if (this.inputState === 'checkingName') {
            this.super.drawGlowText(context, 900, 380, "Checking...", 45, '#ffff00', '#ffaa00', 10);
        } else if (this.inputState === 'password') {
            if (this.isNewPlayer) {
                this.super.drawGlowText(context, 780, 340, "CREATE PASSWORD", 50, '#ffffff', '#00ffff', 12);
                this.super.drawGlowText(context, 720, 380, "New account for: " + this.playerName, 28, '#00ff88', '#00ff00', 5);
            } else {
                this.super.drawGlowText(context, 800, 340, "ENTER PASSWORD", 50, '#ffffff', '#00ffff', 12);
                this.super.drawGlowText(context, 780, 380, "Welcome back, " + this.playerName, 28, '#00ff88', '#00ff00', 5);
            }
        } else if (this.inputState === 'submitting') {
            this.super.drawGlowText(context, 900, 380, "Submitting...", 45, '#ffff00', '#ffaa00', 10);
        }

        // Name input field (always show in name state, show read-only in password state)
        if (this.inputState === 'name') {
            this.drawInputField(context, rX, rY, 650, 420, 560, 'name', this.playerName, this.maxNameLength, "Type your name...");

            // Next button
            if (this.playerName.trim().length > 0) {
                this.nextButton.draw(context);
            } else {
                context.save();
                context.globalAlpha = 0.3;
                this.nextButton.draw(context);
                context.restore();
            }

            // Instructions
            this.super.drawGlowText(context, 750, 670, "Press ENTER to continue | ESC to skip", 22, '#666666', '#444444', 3);
        }

        // Password input field
        if (this.inputState === 'password') {
            // Show name (read-only)
            this.super.drawGlowText(context, 660, 440, "Name: " + this.playerName, 32, '#888888', '#666666', 5);

            // Password field
            this.drawInputField(context, rX, rY, 650, 470, 560, 'password', this.password, this.maxPasswordLength, "Enter password...");

            // Toggle password visibility button
            this.togglePasswordButton.draw(context);

            // Submit button
            if (this.password.length >= 4) {
                this.submitButton.draw(context);
            } else {
                context.save();
                context.globalAlpha = 0.3;
                this.submitButton.draw(context);
                context.restore();
            }

            // Password requirements
            const reqColor = this.password.length >= 4 ? '#00ff88' : '#ff8888';
            this.super.drawGlowText(context, 660, 560, "Min 4 characters", 22, reqColor, reqColor, 3);

            // Instructions
            this.super.drawGlowText(context, 720, 720, "Press ENTER to submit | ESC to cancel", 22, '#666666', '#444444', 3);
        }

        // Error message
        if (this.errorMessage) {
            this.super.drawGlowText(context, 800, 750, this.errorMessage, 28, '#ff4444', '#ff0000', 8);
        }
    }

    drawInputField(context, rX, rY, x, y, width, fieldType, value, maxLength, placeholder) {
        const isActive = this.activeField === fieldType;
        const showCursor = isActive && this.cursorBlink < 30;

        // Input field background
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(x * rX, y * rY, width * rX, 60 * rY);
        context.strokeStyle = isActive ? '#00ffff' : '#ff00ff';
        context.shadowColor = isActive ? '#00ffff' : '#ff00ff';
        context.shadowBlur = 10 * rX;
        context.lineWidth = 2 * rY;
        context.strokeRect(x * rX, y * rY, width * rX, 60 * rY);
        context.restore();

        // Display value
        let displayValue = value;
        if (fieldType === 'password' && !this.showPassword && value.length > 0) {
            displayValue = '*'.repeat(value.length);
        }

        if (value.length > 0) {
            const displayText = displayValue + (showCursor ? '|' : '');
            this.super.drawGlowText(context, x + 20, y + 45, displayText, 40, '#00ff88', '#00ff00', 8);
        } else {
            // Placeholder text
            this.super.drawGlowText(context, x + 20, y + 45, showCursor ? '|' : '', 40, '#00ff88', '#00ff00', 8);
            this.super.drawGlowText(context, x + 40, y + 45, placeholder, 35, '#555555', '#333333', 3);
        }

        // Character count
        const countText = `${value.length}/${maxLength}`;
        this.super.drawGlowText(context, x + width - 100, y + 45, countText, 25, '#666666', '#444444', 3);
    }
}
