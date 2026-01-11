import { Button, superFunctions } from "./supers.js";
import { SupabaseLeaderboard } from "../supabase/supabase.js";

// Predefined security questions
const SECURITY_QUESTIONS = [
    "What is your favorite color?",
    "What is your pet's name?",
    "What city were you born in?",
    "What is your favorite food?",
    "What is your lucky number?"
];

export class AccountMenu {
    constructor() {
        this.super = new superFunctions();
        this.supabase = new SupabaseLeaderboard();
        this.isVisible = false;
        this.clicked = false;
        this.cursorBlink = 0;

        // Mode: 'main', 'changePassword', 'forgotPassword', 'enterUsername', 'answerQuestion', 'setNewPassword', 'setSecurityQuestion', 'changeSecurityQuestion'
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

        // Security question setup (for accounts without one)
        this.hasSecurityQuestion = true; // Assume true by default
        this.selectedQuestionIndex = 0;

        // Messages
        this.errorMessage = '';
        this.successMessage = '';
        this.isLoading = false;

        // Buttons - Main menu (centered: panel at x=830)
        this.changePasswordButton = new Button(1080, 420, 400, 70, "Change Password", 32, 0, 0, false, true, 'white', 'white');
        this.forgotPasswordButton = new Button(1080, 500, 400, 70, "Forgot Password", 32, 0, 0, false, true, 'white', 'white');
        this.setSecurityButton = new Button(1080, 580, 400, 70, "Set Security Question", 28, 0, 0, false, true, 'white', 'white');
        this.changeSecurityButton = new Button(1080, 580, 400, 70, "Change Security Question", 26, 0, 0, false, true, 'white', 'white');
        this.backButton = new Button(1080, 660, 400, 70, "Back", 32, 0, 0, false, true, 'white', 'white');

        // Buttons - Sub-menus
        this.submitButton = new Button(1300, 680, 200, 60, "Submit", 28, 0, 0, false, true, 'white', 'white');
        this.cancelButton = new Button(1060, 680, 200, 60, "Cancel", 28, 0, 0, false, true, 'white', 'white');
        this.nextButton = new Button(1300, 580, 200, 60, "Next", 28, 0, 0, false, true, 'white', 'white');

        // Security question selector buttons
        this.prevQuestionButton = new Button(900, 440, 60, 50, "<", 32, 0, 0, false, true, 'white', 'white');
        this.nextQuestionButton = new Button(1400, 440, 60, 50, ">", 32, 0, 0, false, true, 'white', 'white');

        // Keyboard handler
        this.keyHandler = this.handleKeyPress.bind(this);

        // Track when menu was closed to prevent escape key from opening pause menu
        this.closedAt = 0;
    }

    show(isLoggedIn = false, playerName = '', hasSecurityQuestion = true) {
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
        this.hasSecurityQuestion = hasSecurityQuestion;
        this.selectedQuestionIndex = 0;

        document.addEventListener('keydown', this.keyHandler);

        // If logged in, fetch current security question status from server
        if (isLoggedIn && playerName) {
            this.checkSecurityQuestionStatus(playerName);
        }
    }

    async checkSecurityQuestionStatus(playerName) {
        try {
            const result = await this.supabase.checkPlayerExists(playerName);
            if (result) {
                this.hasSecurityQuestion = !!result.hasSecurityQuestion;
                // Also update game state
                if (window.game) {
                    window.game.hasSecurityQuestion = this.hasSecurityQuestion;
                }
                console.log('[AccountMenu] Security question status:', this.hasSecurityQuestion);
            }
        } catch (error) {
            console.error('[AccountMenu] Failed to check security question status:', error);
        }
    }

    hide() {
        this.isVisible = false;
        this.closedAt = performance.now(); // Track when menu closed for escape key cooldown
        document.removeEventListener('keydown', this.keyHandler);
    }

    handleKeyPress(e) {
        if (!this.isVisible || this.isLoading) return;

        // Handle Escape to go back/close
        if (e.key === 'Escape') {
            // Clear escape flag to prevent pause menu from opening
            if (window.game && window.game.input) {
                window.game.input.escapePressed = false;
            }
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
        } else if (this.mode === 'setSecurityQuestion') {
            this.activeField = 'securityAnswer';
        } else if (this.mode === 'changeSecurityQuestion') {
            const fields = ['currentPassword', 'securityAnswer'];
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
        } else if (this.mode === 'setSecurityQuestion') {
            this.submitSetSecurityQuestion();
        } else if (this.mode === 'changeSecurityQuestion') {
            this.submitChangeSecurityQuestion();
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

    async submitSetSecurityQuestion() {
        if (this.securityAnswer.trim().length < 1) {
            this.errorMessage = 'Please enter your security answer';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            const question = SECURITY_QUESTIONS[this.selectedQuestionIndex];
            const password = window.game ? window.game.playerPassword : localStorage.getItem('playerPassword');

            const result = await this.supabase.setSecurityQuestion(
                this.username,
                password,
                question,
                this.securityAnswer.trim()
            );

            if (result.error) {
                this.errorMessage = result.error;
            } else {
                this.successMessage = 'Security question set successfully!';
                this.hasSecurityQuestion = true;
                this.mode = 'main';
                this.securityAnswer = '';
                // Update game state
                if (window.game) {
                    window.game.hasSecurityQuestion = true;
                }
            }
        } catch (error) {
            this.errorMessage = 'Failed to set security question';
        }

        this.isLoading = false;
    }

    async submitChangeSecurityQuestion() {
        if (this.currentPassword.length < 1) {
            this.errorMessage = 'Please enter your current password';
            return;
        }
        if (this.securityAnswer.trim().length < 1) {
            this.errorMessage = 'Please enter your new security answer';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            const question = SECURITY_QUESTIONS[this.selectedQuestionIndex];

            const result = await this.supabase.changeSecurityQuestion(
                this.username,
                this.currentPassword,
                question,
                this.securityAnswer.trim()
            );

            if (result.error) {
                this.errorMessage = result.error;
            } else {
                this.successMessage = 'Security question changed successfully!';
                this.mode = 'main';
                this.currentPassword = '';
                this.securityAnswer = '';
            }
        } catch (error) {
            this.errorMessage = 'Failed to change security question';
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
            this.changePasswordButton.update(inX, inY);
            if (this.changePasswordButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.mode = 'changePassword';
                this.activeField = 'currentPassword';
                this.errorMessage = '';
                this.successMessage = '';
            }

            // Forgot password button
            this.forgotPasswordButton.update(inX, inY);
            if (this.forgotPasswordButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.mode = 'enterUsername';
                this.activeField = 'username';
                this.errorMessage = '';
                this.successMessage = '';
            }

            // Set security question button (only if no security question set)
            if (!this.hasSecurityQuestion) {
                this.setSecurityButton.update(inX, inY);
                if (this.setSecurityButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.mode = 'setSecurityQuestion';
                    this.activeField = 'securityAnswer';
                    this.selectedQuestionIndex = 0;
                    this.securityAnswer = '';
                    this.errorMessage = '';
                    this.successMessage = '';
                }
            }

            // Change security question button (only if security question already set)
            if (this.hasSecurityQuestion) {
                this.changeSecurityButton.update(inX, inY);
                if (this.changeSecurityButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.mode = 'changeSecurityQuestion';
                    this.activeField = 'currentPassword';
                    this.selectedQuestionIndex = 0;
                    this.currentPassword = '';
                    this.securityAnswer = '';
                    this.errorMessage = '';
                    this.successMessage = '';
                }
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
                if (this.isClickInField(inX, inY, 900, 420, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'currentPassword';
                } else if (this.isClickInField(inX, inY, 900, 510, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'newPassword';
                } else if (this.isClickInField(inX, inY, 900, 600, 560, 50, rX, rY)) {
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
                if (this.isClickInField(inX, inY, 900, 450, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'newPassword';
                } else if (this.isClickInField(inX, inY, 900, 540, 560, 50, rX, rY)) {
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

        // Set security question mode
        if (this.mode === 'setSecurityQuestion') {
            // Question navigation buttons - temporarily adjust y for this mode
            const origPrevY = this.prevQuestionButton.y;
            const origNextY = this.nextQuestionButton.y;
            this.prevQuestionButton.y = 450;
            this.nextQuestionButton.y = 450;

            this.prevQuestionButton.update(inX, inY);
            if (this.prevQuestionButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedQuestionIndex = (this.selectedQuestionIndex - 1 + SECURITY_QUESTIONS.length) % SECURITY_QUESTIONS.length;
            }

            this.nextQuestionButton.update(inX, inY);
            if (this.nextQuestionButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedQuestionIndex = (this.selectedQuestionIndex + 1) % SECURITY_QUESTIONS.length;
            }

            // Restore original positions
            this.prevQuestionButton.y = origPrevY;
            this.nextQuestionButton.y = origNextY;

            // Submit button
            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.securityAnswer.trim().length > 0) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.submitSetSecurityQuestion();
            }
        }

        // Change security question mode
        if (this.mode === 'changeSecurityQuestion') {
            const rX = window.innerWidth / 2560;
            const rY = window.innerHeight / 1440;

            // Check clicks on input fields
            if (game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                if (this.isClickInField(inX, inY, 900, 400, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'currentPassword';
                } else if (this.isClickInField(inX, inY, 900, 600, 560, 50, rX, rY)) {
                    this.clicked = true;
                    this.activeField = 'securityAnswer';
                }
            }

            // Question navigation buttons
            const origPrevY = this.prevQuestionButton.y;
            const origNextY = this.nextQuestionButton.y;
            this.prevQuestionButton.y = 500;
            this.nextQuestionButton.y = 500;

            this.prevQuestionButton.update(inX, inY);
            if (this.prevQuestionButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedQuestionIndex = (this.selectedQuestionIndex - 1 + SECURITY_QUESTIONS.length) % SECURITY_QUESTIONS.length;
            }

            this.nextQuestionButton.update(inX, inY);
            if (this.nextQuestionButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedQuestionIndex = (this.selectedQuestionIndex + 1) % SECURITY_QUESTIONS.length;
            }

            // Restore original positions
            this.prevQuestionButton.y = origPrevY;
            this.nextQuestionButton.y = origNextY;

            // Submit button
            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.currentPassword.length > 0 && this.securityAnswer.trim().length > 0) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.submitChangeSecurityQuestion();
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

        // Panel height based on mode
        let panelHeight = 480;
        if (this.mode === 'main') {
            panelHeight = 480; // Always show all buttons
        } else if (this.mode === 'setSecurityQuestion') {
            panelHeight = 520;
        } else if (this.mode === 'changeSecurityQuestion') {
            panelHeight = 560;
        }
        context.save();
        context.fillStyle = 'rgba(10, 20, 40, 0.95)';
        context.fillRect(830 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.strokeStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 3 * rY;
        context.strokeRect(830 * rX, 280 * rY, 900 * rX, panelHeight * rY);
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
        } else if (this.mode === 'setSecurityQuestion') {
            this.drawSetSecurityQuestion(context, rX, rY);
        } else if (this.mode === 'changeSecurityQuestion') {
            this.drawChangeSecurityQuestion(context, rX, rY);
        }

        // Loading indicator
        if (this.isLoading) {
            this.super.drawGlowText(context, 1200, 700, "Loading...", 28, '#ffff00', '#ffaa00', 8);
        }

        // Error message
        if (this.errorMessage) {
            this.super.drawGlowText(context, 1000, 750, this.errorMessage, 24, '#ff4444', '#ff0000', 8);
        }

        // Success message
        if (this.successMessage) {
            this.super.drawGlowText(context, 1000, 750, this.successMessage, 24, '#00ff88', '#00ff00', 8);
        }
    }

    drawMainMenu(context, rX, rY) {
        this.super.drawGlowText(context, 1130, 350, "ACCOUNT", 50, '#ffffff', '#00ffff', 12);
        this.super.drawGlowText(context, 1110, 390, "Logged in as: " + this.username, 24, '#00ff88', '#00ff00', 5);

        this.changePasswordButton.draw(context);
        this.forgotPasswordButton.draw(context);

        // Show "Set Security Question" button if user doesn't have one
        // Show "Change Security Question" button if user already has one
        if (!this.hasSecurityQuestion) {
            this.setSecurityButton.draw(context);
        } else {
            this.changeSecurityButton.draw(context);
        }

        // Back button always at the same position
        this.backButton.y = 660;
        this.backButton.draw(context);
    }

    drawChangePassword(context, rX, rY) {
        this.super.drawGlowText(context, 1070, 340, "CHANGE PASSWORD", 40, '#ffffff', '#00ffff', 12);

        // Current password
        this.super.drawGlowText(context, 910, 410, "Current Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 420, 560, 'currentPassword', this.currentPassword, true);

        // New password
        this.super.drawGlowText(context, 910, 500, "New Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 510, 560, 'newPassword', this.newPassword, true);

        // Confirm password
        this.super.drawGlowText(context, 910, 590, "Confirm Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 600, 560, 'confirmPassword', this.confirmPassword, true);

        this.submitButton.draw(context);
        this.cancelButton.draw(context);
    }

    drawEnterUsername(context, rX, rY) {
        this.super.drawGlowText(context, 1070, 340, "FORGOT PASSWORD", 40, '#ffffff', '#00ffff', 12);
        this.super.drawGlowText(context, 1000, 390, "Enter your username to recover", 24, '#888888', '#666666', 5);

        this.super.drawGlowText(context, 910, 460, "Username:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 470, 560, 'username', this.username, false);

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
        this.super.drawGlowText(context, 1070, 340, "SECURITY QUESTION", 40, '#ffffff', '#00ffff', 12);
        this.super.drawGlowText(context, 950, 420, this.securityQuestion, 26, '#ffaa00', '#ff8800', 8);

        this.super.drawGlowText(context, 910, 490, "Your Answer:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 500, 560, 'securityAnswer', this.securityAnswer, false);

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
        this.super.drawGlowText(context, 1100, 340, "SET NEW PASSWORD", 40, '#ffffff', '#00ffff', 12);

        this.super.drawGlowText(context, 910, 440, "New Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 450, 560, 'newPassword', this.newPassword, true);

        this.super.drawGlowText(context, 910, 530, "Confirm Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 540, 560, 'confirmPassword', this.confirmPassword, true);

        this.submitButton.draw(context);
        this.cancelButton.draw(context);
    }

    drawSetSecurityQuestion(context, rX, rY) {
        this.super.drawGlowText(context, 1050, 340, "SET SECURITY QUESTION", 36, '#ffffff', '#00ffff', 12);
        this.super.drawGlowText(context, 950, 380, "This is a one-time setup for password recovery", 20, '#888888', '#666666', 5);

        // Security question selector
        this.super.drawGlowText(context, 910, 420, "Select Question:", 24, '#888888', '#666666', 5);

        // Question display box
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(970 * rX, 450 * rY, 420 * rX, 50 * rY);
        context.strokeStyle = '#00ffff';
        context.lineWidth = 2 * rY;
        context.strokeRect(970 * rX, 450 * rY, 420 * rX, 50 * rY);
        context.restore();

        // Draw current question
        const currentQuestion = SECURITY_QUESTIONS[this.selectedQuestionIndex];
        this.super.drawGlowText(context, 985, 488, currentQuestion, 22, '#ffaa00', '#ff8800', 5);

        // Navigation buttons - temporarily adjust y position for this mode
        const origPrevY = this.prevQuestionButton.y;
        const origNextY = this.nextQuestionButton.y;
        this.prevQuestionButton.y = 450;
        this.nextQuestionButton.y = 450;
        this.prevQuestionButton.draw(context);
        this.nextQuestionButton.draw(context);
        this.prevQuestionButton.y = origPrevY;
        this.nextQuestionButton.y = origNextY;

        // Answer field
        this.super.drawGlowText(context, 910, 550, "Your Answer:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 560, 560, 'securityAnswer', this.securityAnswer, false);

        // Submit button (dim if no answer)
        if (this.securityAnswer.trim().length > 0) {
            this.submitButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.submitButton.draw(context);
            context.restore();
        }
        this.cancelButton.draw(context);
    }

    drawChangeSecurityQuestion(context, rX, rY) {
        this.super.drawGlowText(context, 1030, 330, "CHANGE SECURITY QUESTION", 36, '#ffffff', '#00ffff', 12);

        // Current password field
        this.super.drawGlowText(context, 910, 390, "Current Password:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 400, 560, 'currentPassword', this.currentPassword, true);

        // Security question selector
        this.super.drawGlowText(context, 910, 480, "New Question:", 24, '#888888', '#666666', 5);

        // Question display box
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(970 * rX, 500 * rY, 420 * rX, 50 * rY);
        context.strokeStyle = '#00ffff';
        context.lineWidth = 2 * rY;
        context.strokeRect(970 * rX, 500 * rY, 420 * rX, 50 * rY);
        context.restore();

        // Draw current question
        const currentQuestion = SECURITY_QUESTIONS[this.selectedQuestionIndex];
        this.super.drawGlowText(context, 985, 538, currentQuestion, 22, '#ffaa00', '#ff8800', 5);

        // Navigation buttons
        const origPrevY = this.prevQuestionButton.y;
        const origNextY = this.nextQuestionButton.y;
        this.prevQuestionButton.y = 500;
        this.nextQuestionButton.y = 500;
        this.prevQuestionButton.draw(context);
        this.nextQuestionButton.draw(context);
        this.prevQuestionButton.y = origPrevY;
        this.nextQuestionButton.y = origNextY;

        // Answer field
        this.super.drawGlowText(context, 910, 580, "New Answer:", 24, '#888888', '#666666', 5);
        this.drawInputField(context, rX, rY, 900, 600, 560, 'securityAnswer', this.securityAnswer, false);

        // Submit button (dim if missing fields)
        if (this.currentPassword.length > 0 && this.securityAnswer.trim().length > 0) {
            this.submitButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.submitButton.draw(context);
            context.restore();
        }
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
