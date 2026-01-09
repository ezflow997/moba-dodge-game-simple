import { Button, superFunctions } from "./supers.js";
import { SupabaseLeaderboard } from "../supabase/supabase.js";

export class AccountMenu {
    constructor() {
        this.super = new superFunctions();
        this.supabase = new SupabaseLeaderboard();
        this.isVisible = false;
        this.clicked = false;
        this.cursorBlink = 0;

        // Mode: 'main', 'changePassword', 'forgotPassword', 'enterUsername', 'answerQuestion', 'setNewPassword'
        this.mode = 'main';

        // Input fields
        this.username = '';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.securityAnswer = '';
        this.maxLength = 20;

        // Active field tracking
        this.activeField = 'currentPassword';

        // Security question for recovery
        this.securityQuestion = '';

        // Messages
        this.errorMessage = '';
        this.successMessage = '';
        this.isLoading = false;

        // Buttons
        this.changePasswordButton = new Button(830, 400, 400, 70, "Change Password", 32, 0, 0, false, true, 'white', 'white');
        this.forgotPasswordButton = new Button(830, 500, 400, 70, "Forgot Password", 32, 0, 0, false, true, 'white', 'white');
        this.backButton = new Button(830, 600, 400, 70, "Back", 32, 0, 0, false, true, 'white', 'white');
        this.submitButton = new Button(1050, 620, 200, 60, "Submit", 28, 0, 0, false, true, 'white', 'white');
        this.cancelButton = new Button(810, 620, 200, 60, "Cancel", 28, 0, 0, false, true, 'white', 'white');
        this.nextButton = new Button(1050, 550, 200, 60, "Next", 28, 0, 0, false, true, 'white', 'white');

        // Keyboard handler
        this.keyHandler = this.handleKeyPress.bind(this);
    }

    show(isLoggedIn = false, playerName = '') {
        this.isVisible = true;
        this.mode = 'main';
        this.username = playerName;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.securityAnswer = '';
        this.securityQuestion = '';
        this.errorMessage = '';
        this.successMessage = '';
        this.isLoading = false;
        this.activeField = 'currentPassword';
        this.isLoggedIn = isLoggedIn;

        document.addEventListener('keydown', this.keyHandler);
    }

    hide() {
        this.isVisible = false;
        document.removeEventListener('keydown', this.keyHandler);
    }

    handleKeyPress(e) {
        if (!this.isVisible || this.isLoading) return;

        // Handle Escape to go back/close
        if (e.key === 'Escape') {
            if (this.mode === 'main') {
                this.hide();
            } else {
                this.mode = 'main';
                this.errorMessage = '';
                this.successMessage = '';
            }
            e.preventDefault();
            return;
        }

        // Handle Tab to switch fields
        if (e.key === 'Tab') {
            this.cycleActiveField();
            e.preventDefault();
            return;
        }

        // Handle Enter to submit
        if (e.key === 'Enter') {
            this.handleSubmit();
            e.preventDefault();
            return;
        }

        // Handle Backspace
        if (e.key === 'Backspace') {
            this.handleBackspace();
            e.preventDefault();
            return;
        }

        // Handle character input
        if (e.key.length === 1) {
            this.handleCharInput(e.key);
            e.preventDefault();
        }
    }

    cycleActiveField() {
        if (this.mode === 'changePassword') {
            const fields = ['currentPassword', 'newPassword', 'confirmPassword'];
            const idx = fields.indexOf(this.activeField);
            this.activeField = fields[(idx + 1) % fields.length];
        } else if (this.mode === 'enterUsername') {
            this.activeField = 'username';
        } else if (this.mode === 'answerQuestion') {
            this.activeField = 'securityAnswer';
        } else if (this.mode === 'setNewPassword') {
            const fields = ['newPassword', 'confirmPassword'];
            const idx = fields.indexOf(this.activeField);
            this.activeField = fields[(idx + 1) % fields.length];
        }
    }

    handleBackspace() {
        if (this.activeField === 'currentPassword') {
            this.currentPassword = this.currentPassword.slice(0, -1);
        } else if (this.activeField === 'newPassword') {
            this.newPassword = this.newPassword.slice(0, -1);
        } else if (this.activeField === 'confirmPassword') {
            this.confirmPassword = this.confirmPassword.slice(0, -1);
        } else if (this.activeField === 'username') {
            this.username = this.username.slice(0, -1);
        } else if (this.activeField === 'securityAnswer') {
            this.securityAnswer = this.securityAnswer.slice(0, -1);
        }
    }

    handleCharInput(char) {
        if (!/^[a-zA-Z0-9!@#$%^&*_\- ]$/.test(char)) return;

        if (this.activeField === 'currentPassword' && this.currentPassword.length < this.maxLength) {
            this.currentPassword += char;
        } else if (this.activeField === 'newPassword' && this.newPassword.length < this.maxLength) {
            this.newPassword += char;
        } else if (this.activeField === 'confirmPassword' && this.confirmPassword.length < this.maxLength) {
            this.confirmPassword += char;
        } else if (this.activeField === 'username' && this.username.length < 12) {
            if (/^[a-zA-Z0-9_\-]$/.test(char)) {
                this.username += char;
            }
        } else if (this.activeField === 'securityAnswer' && this.securityAnswer.length < 30) {
            this.securityAnswer += char;
        }
    }

    handleSubmit() {
        if (this.mode === 'changePassword') {
            this.submitChangePassword();
        } else if (this.mode === 'enterUsername') {
            this.fetchSecurityQuestion();
        } else if (this.mode === 'answerQuestion') {
            this.verifySecurityAnswer();
        } else if (this.mode === 'setNewPassword') {
            this.submitNewPassword();
        }
    }

    async submitChangePassword() {
        if (this.newPassword.length < 4) {
            this.errorMessage = 'New password must be at least 4 characters';
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage = 'Passwords do not match';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            const result = await this.supabase.changePassword(this.username, this.currentPassword, this.newPassword);
            if (result.error) {
                this.errorMessage = result.error;
            } else {
                this.successMessage = 'Password changed successfully!';
                this.currentPassword = '';
                this.newPassword = '';
                this.confirmPassword = '';
                // Update stored password
                if (window.game) {
                    window.game.playerPassword = this.newPassword;
                    localStorage.setItem('playerPassword', this.newPassword);
                }
            }
        } catch (error) {
            this.errorMessage = 'Failed to change password';
        }

        this.isLoading = false;
    }

    async fetchSecurityQuestion() {
        if (this.username.trim().length === 0) {
            this.errorMessage = 'Please enter your username';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            const result = await this.supabase.getSecurityQuestion(this.username.trim());
            if (result.error) {
                this.errorMessage = result.error;
            } else {
                this.securityQuestion = result.securityQuestion;
                this.mode = 'answerQuestion';
                this.activeField = 'securityAnswer';
            }
        } catch (error) {
            this.errorMessage = 'Failed to fetch security question';
        }

        this.isLoading = false;
    }

    async verifySecurityAnswer() {
        if (this.securityAnswer.trim().length === 0) {
            this.errorMessage = 'Please enter your answer';
            return;
        }

        // Move to set new password - actual verification happens on submit
        this.mode = 'setNewPassword';
        this.activeField = 'newPassword';
        this.errorMessage = '';
    }

    async submitNewPassword() {
        if (this.newPassword.length < 4) {
            this.errorMessage = 'New password must be at least 4 characters';
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage = 'Passwords do not match';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            const result = await this.supabase.recoverPassword(this.username.trim(), this.securityAnswer.trim(), this.newPassword);
            if (result.error) {
                this.errorMessage = result.error;
                this.mode = 'answerQuestion';
                this.securityAnswer = '';
            } else {
                this.successMessage = 'Password reset successfully! You can now login.';
                this.mode = 'main';
            }
        } catch (error) {
            this.errorMessage = 'Failed to reset password';
        }

        this.isLoading = false;
    }

    // Helper to check if click is within an input field
    isClickInField(mouseX, mouseY, fieldX, fieldY, fieldW, fieldH, rX, rY) {
        const x = fieldX * rX;
        const y = fieldY * rY;
        const w = fieldW * rX;
        const h = fieldH * rY;
        return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
    }

    update(game) {
        if (!this.isVisible) return;

        const inX = game.input.mouseX;
        const inY = game.input.mouseY;

        this.cursorBlink = (this.cursorBlink + 1) % 60;

        if (this.clicked && game.input.buttons.indexOf(0) == -1) {
            this.clicked = false;
        }

        if (this.isLoading) return;

        // Main menu
        if (this.mode === 'main') {
            if (this.isLoggedIn) {
                this.changePasswordButton.update(inX, inY);
                if (this.changePasswordButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.mode = 'changePassword';
                    this.activeField = 'currentPassword';
                    this.errorMessage = '';
                    this.successMessage = '';
                }
            }

            this.forgotPasswordButton.update(inX, inY);
            if (this.forgotPasswordButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.mode = 'enterUsername';
                this.activeField = 'username';
                if (!this.isLoggedIn) this.username = '';
                this.errorMessage = '';
                this.successMessage = '';
            }

            this.backButton.update(inX, inY);
            if (this.backButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.hide();
            }
        }

        // Sub-menus with Cancel button
        if (this.mode !== 'main') {
            this.cancelButton.update(inX, inY);
            if (this.cancelButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.mode = 'main';
                this.errorMessage = '';
            }
        }

        // Change password - click to select fields
        if (this.mode === 'changePassword') {
            const rX = window.innerWidth / 2560;
            const rY = window.innerHeight / 1440;

            // Check clicks on input fields
            if (game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                if (this.isClickInField(inX, inY, 650, 420, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'currentPassword';
                } else if (this.isClickInField(inX, inY, 650, 510, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'newPassword';
                } else if (this.isClickInField(inX, inY, 650, 600, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'confirmPassword';
                }
            }

            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.submitChangePassword();
            }
        }

        // Enter username next
        if (this.mode === 'enterUsername') {
            this.nextButton.update(inX, inY);
            if (this.nextButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.username.trim().length > 0) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.fetchSecurityQuestion();
            }
        }

        // Answer question next
        if (this.mode === 'answerQuestion') {
            this.nextButton.update(inX, inY);
            if (this.nextButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.securityAnswer.trim().length > 0) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.verifySecurityAnswer();
            }
        }

        // Set new password - click to select fields
        if (this.mode === 'setNewPassword') {
            const rX = window.innerWidth / 2560;
            const rY = window.innerHeight / 1440;

            // Check clicks on input fields
            if (game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                if (this.isClickInField(inX, inY, 650, 450, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'newPassword';
                } else if (this.isClickInField(inX, inY, 650, 540, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'confirmPassword';
                }
            }

            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.submitNewPassword();
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

        // Panel
        const panelHeight = this.mode === 'main' ? 400 : 450;
        context.save();
        context.fillStyle = 'rgba(10, 20, 40, 0.95)';
        context.fillRect(580 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.strokeStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 3 * rY;
        context.strokeRect(580 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.restore();

        // Draw based on mode
        if (this.mode === 'main') {
            this.drawMainMenu(context, rX, rY);
        } else if (this.mode === 'changePassword') {
            this.drawChangePassword(context, rX, rY);
        } else if (this.mode === 'enterUsername') {
            this.drawEnterUsername(context, rX, rY);
        } else if (this.mode === 'answerQuestion') {
            this.drawAnswerQuestion(context, rX, rY);
        } else if (this.mode === 'setNewPassword') {
            this.drawSetNewPassword(context, rX, rY);
        }

        // Loading indicator
        if (this.isLoading) {
            this.super.drawGlowText(context, 950, 700, "Loading...", 28, '#ffff00', '#ffaa00', 8);
        }

        // Error message
        if (this.errorMessage) {
            this.super.drawGlowText(context, 750, 750, this.errorMessage, 24, '#ff4444', '#ff0000', 8);
        }

        // Success message
        if (this.successMessage) {
            this.super.drawGlowText(context, 750, 750, this.successMessage, 24, '#00ff88', '#00ff00', 8);
        }
    }

    drawMainMenu(context, rX, rY) {
        this.super.drawGlowText(context, 880, 350, "ACCOUNT", 50, '#ffffff', '#00ffff', 12);

        if (this.isLoggedIn) {
            this.super.drawGlowText(context, 860, 390, "Logged in as: " + this.username, 24, '#00ff88', '#00ff00', 5);
            this.changePasswordButton.draw(context);
        } else {
            this.super.drawGlowText(context, 900, 390, "Not logged in", 24, '#888888', '#666666', 5);
        }

        this.forgotPasswordButton.draw(context);
        this.backButton.draw(context);
    }

    drawChangePassword(context, rX, rY) {
        this.super.drawGlowText(context, 820, 340, "CHANGE PASSWORD", 40, '#ffffff', '#00ffff', 12);

        // Current password
        this.super.drawGlowText(context, 660, 410, "Current Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 650, 420, 560, 'currentPassword', this.currentPassword, true);

        // New password
        this.super.drawGlowText(context, 660, 500, "New Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 650, 510, 560, 'newPassword', this.newPassword, true);

        // Confirm password
        this.super.drawGlowText(context, 660, 590, "Confirm Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 650, 600, 560, 'confirmPassword', this.confirmPassword, true);

        this.submitButton.draw(context);
        this.cancelButton.draw(context);
    }

    drawEnterUsername(context, rX, rY) {
        this.super.drawGlowText(context, 820, 340, "FORGOT PASSWORD", 40, '#ffffff', '#00ffff', 12);
        this.super.drawGlowText(context, 750, 390, "Enter your username to recover", 24, '#888888', '#666666', 5);

        this.super.drawGlowText(context, 660, 460, "Username:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 650, 470, 560, 'username', this.username, false);

        if (this.username.trim().length > 0) {
            this.nextButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.nextButton.draw(context);
            context.restore();
        }
        this.cancelButton.draw(context);
    }

    drawAnswerQuestion(context, rX, rY) {
        this.super.drawGlowText(context, 820, 340, "SECURITY QUESTION", 40, '#ffffff', '#00ffff', 12);
        this.super.drawGlowText(context, 700, 420, this.securityQuestion, 26, '#ffaa00', '#ff8800', 8);

        this.super.drawGlowText(context, 660, 490, "Your Answer:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 650, 500, 560, 'securityAnswer', this.securityAnswer, false);

        if (this.securityAnswer.trim().length > 0) {
            this.nextButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.nextButton.draw(context);
            context.restore();
        }
        this.cancelButton.draw(context);
    }

    drawSetNewPassword(context, rX, rY) {
        this.super.drawGlowText(context, 850, 340, "SET NEW PASSWORD", 40, '#ffffff', '#00ffff', 12);

        this.super.drawGlowText(context, 660, 440, "New Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 650, 450, 560, 'newPassword', this.newPassword, true);

        this.super.drawGlowText(context, 660, 530, "Confirm Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 650, 540, 560, 'confirmPassword', this.confirmPassword, true);

        this.submitButton.draw(context);
        this.cancelButton.draw(context);
    }

    drawInputField(context, rX, rY, x, y, width, fieldName, value, isPassword) {
        const isActive = this.activeField === fieldName;
        const showCursor = isActive && this.cursorBlink < 30;

        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(x * rX, y * rY, width * rX, 50 * rY);
        context.strokeStyle = isActive ? '#00ffff' : '#666666';
        context.shadowColor = isActive ? '#00ffff' : '#666666';
        context.shadowBlur = isActive ? 10 * rX : 0;
        context.lineWidth = 2 * rY;
        context.strokeRect(x * rX, y * rY, width * rX, 50 * rY);
        context.restore();

        let displayValue = isPassword && value.length > 0 ? '*'.repeat(value.length) : value;
        if (showCursor) displayValue += '|';

        if (displayValue.length > 0) {
            this.super.drawGlowText(context, x + 15, y + 38, displayValue, 30, '#00ff88', '#00ff00', 5);
        }
    }
}
