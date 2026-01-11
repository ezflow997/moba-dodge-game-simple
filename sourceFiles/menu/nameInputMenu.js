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

        // Caret positions for each field
        this.nameCaretPos = 0;
        this.passwordCaretPos = 0;
        this.securityAnswerCaretPos = 0;

        this.submitButton = new Button(1080, 510, 280, 60, "Submit", 40, 75, 43, false, true, 'white', 'white');
        this.togglePasswordButton = new Button(1470, 470, 50, 60, "*", 35, 12, 43, false, true, 'white', 'white');

        // Security question navigation buttons
        this.prevQuestionButton = new Button(900, 440, 50, 50, "<", 35, 12, 38, false, true, 'white', 'white');
        this.nextQuestionButton = new Button(1410, 440, 50, 50, ">", 35, 12, 38, false, true, 'white', 'white');

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

        // Reset caret positions
        this.nameCaretPos = 0;
        this.passwordCaretPos = 0;
        this.securityAnswerCaretPos = 0;

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

        // Handle backspace - delete character before caret
        if (e.key === 'Backspace') {
            if (this.activeField === 'name' && this.inputState === 'name') {
                if (this.nameCaretPos > 0) {
                    this.playerName = this.playerName.slice(0, this.nameCaretPos - 1) + this.playerName.slice(this.nameCaretPos);
                    this.nameCaretPos--;
                }
            } else if (this.activeField === 'password' && this.inputState === 'password') {
                if (this.passwordCaretPos > 0) {
                    this.password = this.password.slice(0, this.passwordCaretPos - 1) + this.password.slice(this.passwordCaretPos);
                    this.passwordCaretPos--;
                }
            } else if (this.activeField === 'securityAnswer' && this.inputState === 'security') {
                if (this.securityAnswerCaretPos > 0) {
                    this.securityAnswer = this.securityAnswer.slice(0, this.securityAnswerCaretPos - 1) + this.securityAnswer.slice(this.securityAnswerCaretPos);
                    this.securityAnswerCaretPos--;
                }
            }
            e.preventDefault();
            return;
        }

        // Handle Delete key - delete character after caret
        if (e.key === 'Delete') {
            if (this.activeField === 'name' && this.inputState === 'name') {
                if (this.nameCaretPos < this.playerName.length) {
                    this.playerName = this.playerName.slice(0, this.nameCaretPos) + this.playerName.slice(this.nameCaretPos + 1);
                }
            } else if (this.activeField === 'password' && this.inputState === 'password') {
                if (this.passwordCaretPos < this.password.length) {
                    this.password = this.password.slice(0, this.passwordCaretPos) + this.password.slice(this.passwordCaretPos + 1);
                }
            } else if (this.activeField === 'securityAnswer' && this.inputState === 'security') {
                if (this.securityAnswerCaretPos < this.securityAnswer.length) {
                    this.securityAnswer = this.securityAnswer.slice(0, this.securityAnswerCaretPos) + this.securityAnswer.slice(this.securityAnswerCaretPos + 1);
                }
            }
            e.preventDefault();
            return;
        }

        // Handle Left/Right arrow keys for caret movement (not in security question selection)
        if (e.key === 'ArrowLeft' && this.inputState !== 'security') {
            if (this.activeField === 'name' && this.nameCaretPos > 0) {
                this.nameCaretPos--;
            } else if (this.activeField === 'password' && this.passwordCaretPos > 0) {
                this.passwordCaretPos--;
            }
            e.preventDefault();
            return;
        }
        if (e.key === 'ArrowRight' && this.inputState !== 'security') {
            if (this.activeField === 'name' && this.nameCaretPos < this.playerName.length) {
                this.nameCaretPos++;
            } else if (this.activeField === 'password' && this.passwordCaretPos < this.password.length) {
                this.passwordCaretPos++;
            }
            e.preventDefault();
            return;
        }

        // Handle Home/End keys for caret movement
        if (e.key === 'Home') {
            if (this.activeField === 'name') {
                this.nameCaretPos = 0;
            } else if (this.activeField === 'password') {
                this.passwordCaretPos = 0;
            } else if (this.activeField === 'securityAnswer') {
                this.securityAnswerCaretPos = 0;
            }
            e.preventDefault();
            return;
        }
        if (e.key === 'End') {
            if (this.activeField === 'name') {
                this.nameCaretPos = this.playerName.length;
            } else if (this.activeField === 'password') {
                this.passwordCaretPos = this.password.length;
            } else if (this.activeField === 'securityAnswer') {
                this.securityAnswerCaretPos = this.securityAnswer.length;
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

        // Handle arrow keys in security state
        if (this.inputState === 'security') {
            // Up/Down for question selection
            if (e.key === 'ArrowUp') {
                this.selectedQuestionIndex = (this.selectedQuestionIndex - 1 + SECURITY_QUESTIONS.length) % SECURITY_QUESTIONS.length;
                e.preventDefault();
                return;
            }
            if (e.key === 'ArrowDown') {
                this.selectedQuestionIndex = (this.selectedQuestionIndex + 1) % SECURITY_QUESTIONS.length;
                e.preventDefault();
                return;
            }
            // Left/Right for caret movement in answer field
            if (e.key === 'ArrowLeft' && this.securityAnswerCaretPos > 0) {
                this.securityAnswerCaretPos--;
                e.preventDefault();
                return;
            }
            if (e.key === 'ArrowRight' && this.securityAnswerCaretPos < this.securityAnswer.length) {
                this.securityAnswerCaretPos++;
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

        // Handle regular characters - insert at caret position
        if (e.key.length === 1) {
            if (this.activeField === 'name' && this.inputState === 'name') {
                if (this.playerName.length < this.maxNameLength && /^[a-zA-Z0-9_\-]$/.test(e.key)) {
                    this.playerName = this.playerName.slice(0, this.nameCaretPos) + e.key + this.playerName.slice(this.nameCaretPos);
                    this.nameCaretPos++;
                }
            } else if (this.activeField === 'password' && this.inputState === 'password') {
                if (this.password.length < this.maxPasswordLength && /^[a-zA-Z0-9!@#$%^&*_\-]$/.test(e.key)) {
                    this.password = this.password.slice(0, this.passwordCaretPos) + e.key + this.password.slice(this.passwordCaretPos);
                    this.passwordCaretPos++;
                }
            } else if (this.activeField === 'securityAnswer' && this.inputState === 'security') {
                if (this.securityAnswer.length < this.maxAnswerLength && /^[a-zA-Z0-9 _\-]$/.test(e.key)) {
                    this.securityAnswer = this.securityAnswer.slice(0, this.securityAnswerCaretPos) + e.key + this.securityAnswer.slice(this.securityAnswerCaretPos);
                    this.securityAnswerCaretPos++;
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

        // Click outside to close (panel: x=830, y=280, w=900, h=520 max)
        // Only check when not in a loading state
        if (this.inputState !== 'checkingName' && this.inputState !== 'submitting') {
            const rX = window.innerWidth / 2560;
            const rY = window.innerHeight / 1440;
            const panelLeft = 830 * rX;
            const panelRight = (830 + 900) * rX;
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

        // Store scale factors for input field click detection
        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Click detection for input fields to position caret
        if (clicking && !this.clicked) {
            // Approximate character width for 36px Arial font
            const charWidth = 36 * 0.55 * rX;

            // Name input field (name state): x=900, y=420, w=560, h=60
            if (this.inputState === 'name' && this.isClickInInputField(inX, inY, 900, 420, 560, 60, rX, rY)) {
                this.clicked = true;
                const textStartX = (900 + 20) * rX;
                const relativeX = inX - textStartX;
                if (relativeX <= 0) {
                    this.nameCaretPos = 0;
                } else {
                    const clickedPos = Math.round(relativeX / charWidth);
                    this.nameCaretPos = Math.min(clickedPos, this.playerName.length);
                }
            }

            // Password input field (password state): x=900, y=470, w=560, h=60
            if (this.inputState === 'password' && this.isClickInInputField(inX, inY, 900, 470, 560, 60, rX, rY)) {
                this.clicked = true;
                const textStartX = (900 + 20) * rX;
                const relativeX = inX - textStartX;
                if (relativeX <= 0) {
                    this.passwordCaretPos = 0;
                } else {
                    const clickedPos = Math.round(relativeX / charWidth);
                    this.passwordCaretPos = Math.min(clickedPos, this.password.length);
                }
            }

            // Security answer field (security state): x=900, y=530, w=560, h=60
            if (this.inputState === 'security' && this.isClickInInputField(inX, inY, 900, 530, 560, 60, rX, rY)) {
                this.clicked = true;
                const textStartX = (900 + 20) * rX;
                const relativeX = inX - textStartX;
                if (relativeX <= 0) {
                    this.securityAnswerCaretPos = 0;
                } else {
                    const clickedPos = Math.round(relativeX / charWidth);
                    this.securityAnswerCaretPos = Math.min(clickedPos, this.securityAnswer.length);
                }
            }
        }

        // Submit button (name state)
        if (this.inputState === 'name') {
            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.playerName.trim().length > 0) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.checkPlayerName();
            }
        }

        // Submit button (password state)
        if (this.inputState === 'password') {
            // Move button down for password state
            const originalY = this.submitButton.y;
            this.submitButton.y = 590;

            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.password.length >= 4) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.proceedFromPassword();
            }

            this.submitButton.y = originalY;

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
                // Check if click is within the "Forgot Password?" text area (text drawn at y=680)
                const linkX = 1080 * rX;
                const linkY = 655 * rY;
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

            // Move button down for security state
            const originalY = this.submitButton.y;
            this.submitButton.y = 620;

            // Submit button
            this.submitButton.update(inX, inY);
            if (this.submitButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked && this.securityAnswer.trim().length >= 1) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.submitWithSecurity();
            }

            this.submitButton.y = originalY;
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
        if (this.inputState === 'password') panelHeight = this.showForgotPassword ? 480 : 440;
        if (this.inputState === 'security') panelHeight = 520;

        // Input panel (centered: x=830 for 900 width on 2560 reference)
        context.save();
        context.fillStyle = 'rgba(10, 20, 40, 0.95)';
        context.fillRect(830 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.strokeStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 3 * rY;
        context.strokeRect(830 * rX, 280 * rY, 900 * rX, panelHeight * rY);
        context.restore();

        // Title based on state
        if (this.inputState === 'name') {
            this.super.drawGlowText(context, 1070, 350, "ENTER YOUR NAME", 50, '#ffffff', '#00ffff', 12);
            this.super.drawGlowText(context, 1030, 390, "to submit your score", 28, '#888888', '#666666', 5);
        } else if (this.inputState === 'checkingName') {
            this.super.drawGlowText(context, 1150, 380, "Checking...", 45, '#ffff00', '#ffaa00', 10);
        } else if (this.inputState === 'password') {
            if (this.isNewPlayer) {
                this.super.drawGlowText(context, 1030, 340, "CREATE PASSWORD", 50, '#ffffff', '#00ffff', 12);
                this.super.drawGlowText(context, 970, 380, "New account for: " + this.playerName, 28, '#00ff88', '#00ff00', 5);
            } else {
                this.super.drawGlowText(context, 1050, 340, "ENTER PASSWORD", 50, '#ffffff', '#00ffff', 12);
                this.super.drawGlowText(context, 1030, 380, "Welcome back, " + this.playerName, 28, '#00ff88', '#00ff00', 5);
            }
        } else if (this.inputState === 'security') {
            this.super.drawGlowText(context, 1000, 340, "SECURITY QUESTION", 50, '#ffffff', '#00ffff', 12);
            this.super.drawGlowText(context, 950, 380, "For password recovery", 28, '#888888', '#666666', 5);
        } else if (this.inputState === 'submitting') {
            this.super.drawGlowText(context, 1150, 380, "Submitting...", 45, '#ffff00', '#ffaa00', 10);
        }

        // Name input state
        if (this.inputState === 'name') {
            this.drawInputField(context, rX, rY, 900, 420, 560, 'name', this.playerName, this.maxNameLength, "Type your name...");

            if (this.playerName.trim().length > 0) {
                this.submitButton.draw(context);
            } else {
                context.save();
                context.globalAlpha = 0.3;
                this.submitButton.draw(context);
                context.restore();
            }

            this.super.drawGlowText(context, 1000, 600, "Press ENTER to continue | ESC to skip", 22, '#666666', '#444444', 3);
        }

        // Password input state
        if (this.inputState === 'password') {
            this.super.drawGlowText(context, 910, 440, "Name: " + this.playerName, 32, '#888888', '#666666', 5);
            this.drawInputField(context, rX, rY, 900, 470, 560, 'password', this.password, this.maxPasswordLength, "Enter password...");
            this.togglePasswordButton.draw(context);

            const reqColor = this.password.length >= 4 ? '#00ff88' : '#ff8888';
            this.super.drawGlowText(context, 910, 560, "Min 4 characters", 22, reqColor, reqColor, 3);

            // Move button down for password state
            const originalY = this.submitButton.y;
            this.submitButton.y = 590;

            if (this.password.length >= 4) {
                this.submitButton.draw(context);
            } else {
                context.save();
                context.globalAlpha = 0.3;
                this.submitButton.draw(context);
                context.restore();
            }

            this.submitButton.y = originalY;

            // Show "Forgot Password?" link after failed login (below the button)
            if (this.showForgotPassword) {
                const linkX = 1080 * rX;
                const linkY = 655 * rY;
                const linkW = 200 * rX;
                const linkH = 35 * rY;
                const mouseX = game.input.mouseX;
                const mouseY = game.input.mouseY;
                const isHovered = mouseX >= linkX && mouseX <= linkX + linkW && mouseY >= linkY && mouseY <= linkY + linkH;

                const linkColor = isHovered ? '#00ffff' : '#ffaa00';
                const linkGlow = isHovered ? '#00ffff' : '#ff8800';
                this.super.drawGlowText(context, 1080, 680, "Forgot Password?", 24, linkColor, linkGlow, isHovered ? 12 : 6);
            }

            this.super.drawGlowText(context, 970, 720, "Press ENTER to continue | ESC to cancel", 22, '#666666', '#444444', 3);
        }

        // Security question state
        if (this.inputState === 'security') {
            // Display selected question with navigation
            const question = SECURITY_QUESTIONS[this.selectedQuestionIndex];
            this.super.drawGlowText(context, 970, 450, question, 28, '#ffaa00', '#ff8800', 8);

            // Question navigation buttons
            this.prevQuestionButton.draw(context);
            this.nextQuestionButton.draw(context);

            // Question counter
            this.super.drawGlowText(context, 1250, 450, `${this.selectedQuestionIndex + 1}/${SECURITY_QUESTIONS.length}`, 22, '#666666', '#444444', 3);

            // Answer input field
            this.super.drawGlowText(context, 910, 510, "Your Answer:", 26, '#888888', '#666666', 5);
            this.drawInputField(context, rX, rY, 900, 530, 560, 'securityAnswer', this.securityAnswer, this.maxAnswerLength, "Type your answer...");

            // Move button down for security state
            const originalY = this.submitButton.y;
            this.submitButton.y = 620;

            // Submit button
            if (this.securityAnswer.trim().length >= 1) {
                this.submitButton.draw(context);
            } else {
                context.save();
                context.globalAlpha = 0.3;
                this.submitButton.draw(context);
                context.restore();
            }

            this.submitButton.y = originalY;

            // Instructions
            this.super.drawGlowText(context, 930, 720, "Use arrows to change question | ENTER to submit", 22, '#666666', '#444444', 3);
        }

        // Error message
        if (this.errorMessage) {
            this.super.drawGlowText(context, 1050, 800, this.errorMessage, 28, '#ff4444', '#ff0000', 8);
        }
    }

    // Calculate caret position from click X coordinate
    calculateCaretFromClick(context, clickX, fieldX, value, fontSize, rX) {
        if (value.length === 0) return 0;

        const textStartX = (fieldX + 20) * rX;
        const relativeX = clickX - textStartX;

        if (relativeX <= 0) return 0;

        // Measure each character to find the closest caret position
        context.save();
        context.font = `${fontSize * rX}px Arial`;

        let caretPos = 0;
        let prevWidth = 0;

        for (let i = 1; i <= value.length; i++) {
            const width = context.measureText(value.slice(0, i)).width;
            const midPoint = (prevWidth + width) / 2;

            if (relativeX < midPoint) {
                break;
            }
            caretPos = i;
            prevWidth = width;
        }

        context.restore();
        return caretPos;
    }

    // Check if click is within input field bounds
    isClickInInputField(clickX, clickY, fieldX, fieldY, fieldW, fieldH, rX, rY) {
        const x = fieldX * rX;
        const y = fieldY * rY;
        const w = fieldW * rX;
        const h = fieldH * rY;
        return clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h;
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

        // Get the caret position for this field
        let caretPos = 0;
        if (fieldType === 'name') {
            caretPos = this.nameCaretPos;
        } else if (fieldType === 'password') {
            caretPos = this.passwordCaretPos;
        } else if (fieldType === 'securityAnswer') {
            caretPos = this.securityAnswerCaretPos;
        }

        // Display value with cursor at caret position
        let displayValue = value;
        if (fieldType === 'password' && !this.showPassword && value.length > 0) {
            displayValue = '*'.repeat(value.length);
        }

        if (value.length > 0) {
            // Insert cursor at caret position
            const beforeCaret = displayValue.slice(0, caretPos);
            const afterCaret = displayValue.slice(caretPos);
            const displayText = beforeCaret + (showCursor ? '|' : '') + afterCaret;
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
