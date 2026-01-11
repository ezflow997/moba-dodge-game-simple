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

        // Input state: 'name', 'checkingName', 'password', 'security', 'submitting'
        this.inputState = 'name';
        this.isNewPlayer = false;
        this.errorMessage = '';
        this.showPassword = false;

        // Which field is active
        this.activeField = 'name'; // 'name', 'password', or 'securityAnswer'

        // Security question state
        this.selectedQuestionIndex = 0;
        this.securityAnswer = '';
        this.maxAnswerLength = 30;

        this.submitButton = new Button(1080, 580, 280, 70, "Submit", 45, 75, 50, false, true, 'white', 'white');
        this.nextButton = new Button(1080, 580, 280, 70, "Next", 45, 90, 50, false, true, 'white', 'white');
        this.togglePasswordButton = new Button(1320, 500, 50, 50, "*", 35, 12, 38, false, true, 'white', 'white');

        // Security question navigation buttons
        this.prevQuestionButton = new Button(650, 440, 50, 50, "<", 35, 12, 38, false, true, 'white', 'white');
        this.nextQuestionButton = new Button(1160, 440, 50, 50, ">", 35, 12, 38, false, true, 'white', 'white');

        // Forgot password link (shown after failed login)
        this.showForgotPassword = false;

        // Bind keyboard handler
        this.keyHandler = this.handleKeyPress.bind(this);

        // Track when menu was closed to prevent escape key from opening pause menu
        this.closedAt = 0;
    }

    show(onSubmitCallback, allowRegistration = true) {
        this.isVisible = true;
        this.playerName = '';
        this.password = '';
        this.securityAnswer = '';
        this.selectedQuestionIndex = 0;
        this.onSubmit = onSubmitCallback;
        this.cursorBlink = 0;
        this.inputState = 'name';
        this.activeField = 'name';
        this.isNewPlayer = false;
        this.existingPlayerHasSecurityQuestion = true; // Track existing player's security question status
        this.errorMessage = '';
        this.showPassword = false;
        this.showForgotPassword = false;
        this.allowRegistration = allowRegistration;

        // Add keyboard listener
        document.addEventListener('keydown', this.keyHandler);
    }

    hide() {
        this.isVisible = false;
        this.closedAt = performance.now(); // Track when menu closed for escape key cooldown
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
            } else if (this.activeField === 'password' && this.inputState === 'password') {
                this.password = this.password.slice(0, -1);
            } else if (this.activeField === 'securityAnswer' && this.inputState === 'security') {
                this.securityAnswer = this.securityAnswer.slice(0, -1);
            }
            e.preventDefault();
            return;
        }

        // Handle Tab to switch fields
        if (e.key === 'Tab') {
            if (this.inputState === 'password') {
                this.activeField = this.activeField === 'name' ? 'password' : 'name';
            }
            e.preventDefault();
            return;
        }

        // Handle arrow keys for question selection (in security state)
        if (this.inputState === 'security') {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                this.selectedQuestionIndex = (this.selectedQuestionIndex - 1 + SECURITY_QUESTIONS.length) % SECURITY_QUESTIONS.length;
                e.preventDefault();
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                this.selectedQuestionIndex = (this.selectedQuestionIndex + 1) % SECURITY_QUESTIONS.length;
                e.preventDefault();
                return;
            }
        }

        // Handle enter
        if (e.key === 'Enter') {
            if (this.inputState === 'name' && this.playerName.trim().length > 0) {
                this.checkPlayerName();
            } else if (this.inputState === 'password' && this.password.length >= 4) {
                this.proceedFromPassword();
            } else if (this.inputState === 'security' && this.securityAnswer.trim().length >= 1) {
                this.submitWithSecurity();
            }
            e.preventDefault();
            return;
        }

        // Handle escape - cancel without submitting
        if (e.key === 'Escape') {
            // Consume the game's escape flag to prevent pause menu from opening
            if (window.game && window.game.input) {
                window.game.input.escapePressed = false;
            }
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
            } else if (this.activeField === 'securityAnswer' && this.inputState === 'security') {
                if (this.securityAnswer.length < this.maxAnswerLength && /^[a-zA-Z0-9 _\-]$/.test(e.key)) {
                    this.securityAnswer += e.key;
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
            // Track if existing player has a security question
            if (exists) {
                this.existingPlayerHasSecurityQuestion = !!exists.hasSecurityQuestion;
            }
            console.log('[NAME_INPUT] Player exists:', exists, 'isNewPlayer:', this.isNewPlayer, 'hasSecurityQuestion:', this.existingPlayerHasSecurityQuestion, 'allowRegistration:', this.allowRegistration);

            // Block new account creation if not allowed
            if (this.isNewPlayer && !this.allowRegistration) {
                console.log('[NAME_INPUT] Blocking new account creation');
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

    // Called when password is entered - either verify (existing) or go to security (new)
    async proceedFromPassword() {
        if (this.password.length < 4) {
            this.errorMessage = 'Password must be at least 4 characters';
            return;
        }

        const name = this.playerName.trim();

        // If existing player, verify password and submit
        if (!this.isNewPlayer) {
            this.inputState = 'submitting';
            this.errorMessage = '';

            try {
                const verification = await this.supabase.verifyPassword(name, this.password);
                if (!verification.valid) {
                    this.errorMessage = 'Incorrect password';
                    this.inputState = 'password';
                    this.password = '';
                    this.showForgotPassword = true; // Show forgot password option after failed login
                    return;
                }
            } catch (error) {
                this.errorMessage = 'Verification failed. Try again.';
                this.inputState = 'password';
                return;
            }

            // Password verified, proceed
            if (name.length > 0 && this.onSubmit) {
                this.hide();
                this.onSubmit({
                    name: name,
                    password: this.password,
                    isNewPlayer: false,
                    hasSecurityQuestion: this.existingPlayerHasSecurityQuestion
                });
            }
        } else {
            // New player - go to security question step
            this.inputState = 'security';
            this.activeField = 'securityAnswer';
            this.errorMessage = '';
        }
    }

    // Submit with security question (for new accounts)
    submitWithSecurity() {
        if (this.securityAnswer.trim().length < 1) {
            this.errorMessage = 'Please enter a security answer';
            return;
        }

        this.inputState = 'submitting';
        this.errorMessage = '';

        const name = this.playerName.trim();
        const selectedQuestion = SECURITY_QUESTIONS[this.selectedQuestionIndex];

        if (name.length > 0 && this.onSubmit) {
            this.hide();
            this.onSubmit({
                name: name,
                password: this.password,
                isNewPlayer: true,
                securityQuestion: selectedQuestion,
                securityAnswer: this.securityAnswer.trim()
            });
        }
    }

    update(game) {
        if (!this.isVisible) return;

        const inX = game.input.mouseX;
        const inY = game.input.mouseY;
        const clicking = game.input.buttons.indexOf(0) > -1;

        // Click outside to close (panel: x=580, y=280, w=900, h=520 max)
        // Only check when not in a loading state
        if (this.inputState !== 'checkingName' && this.inputState !== 'submitting') {
            const rX = window.innerWidth / 2560;
            const rY = window.innerHeight / 1440;
            const panelLeft = 580 * rX;
            const panelRight = (580 + 900) * rX;
            const panelTop = 280 * rY;
            const panelBottom = (280 + 520) * rY;

            if (clicking && !this.clicked) {
                if (inX < panelLeft || inX > panelRight || inY < panelTop || inY > panelBottom) {
                    this.clicked = true;
                    this.hide();
                    if (this.onSubmit) this.onSubmit(null); // Signal cancelled
                    return;
                }
            }
        }

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

        // Submit/Next button (password state)
        if (this.inputState === 'password') {
            // For existing players, show Submit; for new players, show Next
            const btn = this.isNewPlayer ? this.nextButton : this.submitButton;
            btn.update(inX, inY);
            if (btn.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.password.length >= 4) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.proceedFromPassword();
            }

            // Toggle password visibility
            this.togglePasswordButton.update(inX, inY);
            if (this.togglePasswordButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showPassword = !this.showPassword;
            }

            // Forgot password link click detection (when visible)
            if (this.showForgotPassword && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                const rX = window.innerWidth / 2560;
                const rY = window.innerHeight / 1440;
                // Check if click is within the "Forgot Password?" text area (text drawn at y=610)
                const linkX = 660 * rX;
                const linkY = 585 * rY;
                const linkW = 200 * rX;
                const linkH = 35 * rY;
                if (inX >= linkX && inX <= linkX + linkW && inY >= linkY && inY <= linkY + linkH) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    // Open account menu in forgot password mode with username pre-filled
                    this.hide();
                    if (this.onSubmit) this.onSubmit(null); // Signal cancelled
                    if (window.game && window.game.accountMenu) {
                        window.game.accountMenu.show(false, this.playerName.trim(), false);
                        window.game.accountMenu.mode = 'enterUsername';
                        window.game.accountMenu.activeField = 'username';
                    }
                }
            }
        }

        // Security question state
        if (this.inputState === 'security') {
            // Question navigation
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

            // Submit button
            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.securityAnswer.trim().length >= 1) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.submitWithSecurity();
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

        // Calculate panel height based on state
        let panelHeight = 320;
        if (this.inputState === 'password') panelHeight = this.showForgotPassword ? 460 : 420;
        if (this.inputState === 'security') panelHeight = 520;

        // Input panel
        context.save();
        context.fillStyle = 'rgba(10, 20, 40, 0.95)';
        context.fillRect(580 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.strokeStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 3 * rY;
        context.strokeRect(580 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.restore();

        // Title based on state
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
        } else if (this.inputState === 'security') {
            this.super.drawGlowText(context, 750, 340, "SECURITY QUESTION", 50, '#ffffff', '#00ffff', 12);
            this.super.drawGlowText(context, 700, 380, "For password recovery", 28, '#888888', '#666666', 5);
        } else if (this.inputState === 'submitting') {
            this.super.drawGlowText(context, 900, 380, "Submitting...", 45, '#ffff00', '#ffaa00', 10);
        }

        // Name input state
        if (this.inputState === 'name') {
            this.drawInputField(context, rX, rY, 650, 420, 560, 'name', this.playerName, this.maxNameLength, "Type your name...");

            if (this.playerName.trim().length > 0) {
                this.nextButton.draw(context);
            } else {
                context.save();
                context.globalAlpha = 0.3;
                this.nextButton.draw(context);
                context.restore();
            }

            this.super.drawGlowText(context, 750, 670, "Press ENTER to continue | ESC to skip", 22, '#666666', '#444444', 3);
        }

        // Password input state
        if (this.inputState === 'password') {
            this.super.drawGlowText(context, 660, 440, "Name: " + this.playerName, 32, '#888888', '#666666', 5);
            this.drawInputField(context, rX, rY, 650, 470, 560, 'password', this.password, this.maxPasswordLength, "Enter password...");
            this.togglePasswordButton.draw(context);

            // Show Next for new players, Submit for existing
            const btn = this.isNewPlayer ? this.nextButton : this.submitButton;
            if (this.password.length >= 4) {
                btn.draw(context);
            } else {
                context.save();
                context.globalAlpha = 0.3;
                btn.draw(context);
                context.restore();
            }

            const reqColor = this.password.length >= 4 ? '#00ff88' : '#ff8888';
            this.super.drawGlowText(context, 660, 560, "Min 4 characters", 22, reqColor, reqColor, 3);

            // Show "Forgot Password?" link after failed login
            if (this.showForgotPassword) {
                // Check if mouse is hovering over the link for highlight effect
                const rX = window.innerWidth / 2560;
                const rY = window.innerHeight / 1440;
                const linkX = 660 * rX;
                const linkY = 585 * rY;
                const linkW = 200 * rX;
                const linkH = 35 * rY;
                const mouseX = game.input.mouseX;
                const mouseY = game.input.mouseY;
                const isHovered = mouseX >= linkX && mouseX <= linkX + linkW && mouseY >= linkY && mouseY <= linkY + linkH;

                const linkColor = isHovered ? '#00ffff' : '#ffaa00';
                const linkGlow = isHovered ? '#00ffff' : '#ff8800';
                this.super.drawGlowText(context, 660, 610, "Forgot Password?", 24, linkColor, linkGlow, isHovered ? 12 : 6);
            }

            this.super.drawGlowText(context, 720, 720, "Press ENTER to continue | ESC to cancel", 22, '#666666', '#444444', 3);
        }

        // Security question state
        if (this.inputState === 'security') {
            // Display selected question with navigation
            const question = SECURITY_QUESTIONS[this.selectedQuestionIndex];
            this.super.drawGlowText(context, 720, 450, question, 28, '#ffaa00', '#ff8800', 8);

            // Question navigation buttons
            this.prevQuestionButton.draw(context);
            this.nextQuestionButton.draw(context);

            // Question counter
            this.super.drawGlowText(context, 1000, 450, `${this.selectedQuestionIndex + 1}/${SECURITY_QUESTIONS.length}`, 22, '#666666', '#444444', 3);

            // Answer input field
            this.super.drawGlowText(context, 660, 510, "Your Answer:", 26, '#888888', '#666666', 5);
            this.drawInputField(context, rX, rY, 650, 530, 560, 'securityAnswer', this.securityAnswer, this.maxAnswerLength, "Type your answer...");

            // Submit button
            if (this.securityAnswer.trim().length >= 1) {
                this.submitButton.draw(context);
            } else {
                context.save();
                context.globalAlpha = 0.3;
                this.submitButton.draw(context);
                context.restore();
            }

            // Instructions
            this.super.drawGlowText(context, 680, 720, "Use arrows to change question | ENTER to submit", 22, '#666666', '#444444', 3);
        }

        // Error message
        if (this.errorMessage) {
            this.super.drawGlowText(context, 800, 800, this.errorMessage, 28, '#ff4444', '#ff0000', 8);
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
            this.super.drawGlowText(context, x + 20, y + 45, displayText, 36, '#00ff88', '#00ff00', 8);
        } else {
            this.super.drawGlowText(context, x + 20, y + 45, showCursor ? '|' : '', 36, '#00ff88', '#00ff00', 8);
            // Placeholder text - smaller size for better fit
            this.super.drawGlowText(context, x + 40, y + 42, placeholder, 28, '#555555', '#333333', 3);
        }

        // Character count
        const countText = `${value.length}/${maxLength}`;
        this.super.drawGlowText(context, x + width - 100, y + 45, countText, 22, '#666666', '#444444', 3);
    }
}
