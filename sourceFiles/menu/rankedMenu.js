import { Button, superFunctions } from "./supers.js";

export class RankedMenu {
    constructor() {
        this.super = new superFunctions();

        this.isVisible = false;
        this.state = 'idle'; // 'idle', 'confirm', 'queued', 'results'

        // Queue status
        this.queueSize = 0;
        this.queuePosition = 0;
        this.playersNeeded = 10;

        // Player info
        this.playerElo = 1000;
        this.playerRank = null;
        this.gamesPlayed = 0;

        // Attempts tracking
        this.attemptsUsed = 0;
        this.attemptsRemaining = 5;
        this.maxAttempts = 5;
        this.bestScore = null;

        // Tournament results
        this.tournamentResults = null;
        this.playerResult = null;

        // Error state
        this.errorMessage = null;

        this.clicked = false;

        // Confirmation buttons (positions set dynamically in update)
        this.confirmButton = new Button(0, 0, 260, 85, "Queue Up", 36, 0, 0, false, true, 'white', 'white');
        this.cancelButton = new Button(0, 0, 260, 85, "Cancel", 36, 0, 0, false, true, 'white', 'white');
        this.leaderboardButton = new Button(0, 0, 260, 85, "Leaderboard", 30, 0, 0, false, true, 'white', 'white');

        // Results/Queued screen buttons
        this.closeButton = new Button(0, 0, 320, 85, "Continue", 38, 0, 0, false, true, 'white', 'white');
    }

    show(state = 'confirm') {
        this.isVisible = true;
        this.state = state;
        this.clicked = false;
        this.errorMessage = null;
    }

    hide() {
        this.isVisible = false;
        this.state = 'idle';
        this.tournamentResults = null;
        this.playerResult = null;
        this.errorMessage = null;
    }

    setQueueStatus(status) {
        this.queueSize = status.queueSize || 0;
        this.playersNeeded = status.playersNeeded || 10;
        if (status.player) {
            this.playerElo = status.player.elo || 1000;
            this.playerRank = status.player.rank;
            this.gamesPlayed = status.player.gamesPlayed || 0;
        }
        if (status.queuePosition) {
            this.queuePosition = status.queuePosition;
        }
        // Attempts tracking
        this.attemptsUsed = status.attemptsUsed || 0;
        this.attemptsRemaining = status.attemptsRemaining !== undefined ? status.attemptsRemaining : 5;
        this.maxAttempts = status.maxAttempts || 5;
        this.bestScore = status.bestScore || null;
    }

    setTournamentResults(results) {
        this.tournamentResults = results;
        this.playerResult = results.playerResult;
        this.state = 'results';
    }

    setQueuedState(queueInfo) {
        this.queuePosition = queueInfo.queuePosition;
        this.queueSize = queueInfo.totalInQueue || queueInfo.uniquePlayers;
        this.playersNeeded = queueInfo.playersNeeded;
        this.attemptsUsed = queueInfo.attemptsUsed || 0;
        this.attemptsRemaining = queueInfo.attemptsRemaining !== undefined ? queueInfo.attemptsRemaining : 5;
        this.maxAttempts = queueInfo.maxAttempts || 5;
        this.bestScore = queueInfo.bestScore || null;
        this.state = 'queued';
    }

    setError(message) {
        this.errorMessage = message;
    }

    update(game) {
        if (!this.isVisible) return true;

        const inX = game.input.mouseX;
        const inY = game.input.mouseY;

        // Panel dimensions in reference coordinates (2560x1440)
        // Panel: 800x700, centered
        const refCenterX = 1280;
        const refPanelBottom = 720 + 350; // centerY + panelH/2 = 1070
        const buttonY = refPanelBottom - 50 - 85; // 50px padding from bottom, 85px button height

        // Set button positions (unscaled - Button.draw() handles scaling)
        const setButtonPos = (btn, x, y, w, h) => {
            btn.x = x;
            btn.y = y;
            btn.w = w;
            btn.h = h;
        };

        if (this.state === 'confirm') {
            // Two bottom buttons with 30px gap, each 260 wide
            const btnW = 260;
            const gap = 30;
            const leftBtnX = refCenterX - btnW - gap / 2; // 1005
            const rightBtnX = refCenterX + gap / 2; // 1295

            setButtonPos(this.confirmButton, leftBtnX, buttonY, btnW, 85);
            setButtonPos(this.cancelButton, rightBtnX, buttonY, btnW, 85);

            // Leaderboard button centered above the two buttons
            const leaderboardY = buttonY - 100; // 100px above bottom buttons
            setButtonPos(this.leaderboardButton, refCenterX - btnW / 2, leaderboardY, btnW, 85);

            this.confirmButton.update(inX, inY);
            this.cancelButton.update(inX, inY);
            this.leaderboardButton.update(inX, inY);

            const clicking = game.input.buttons.indexOf(0) > -1;

            if (!clicking) {
                this.clicked = false;
            }

            if (this.cancelButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.hide();
                return true;
            }

            if (this.leaderboardButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Signal to open ranked leaderboard
                return 'open_ranked_leaderboard';
            }

            // Only allow queue if attempts remaining (or never queued)
            const canQueue = this.attemptsUsed === 0 || this.attemptsRemaining > 0;
            if (this.confirmButton.isHovered && clicking && !this.clicked && canQueue) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Signal to start ranked game
                return 'start_ranked';
            }
        } else if (this.state === 'queued' || this.state === 'results') {
            // Single centered button, 320 wide
            const closeBtnW = 320;
            const closeBtnX = refCenterX - closeBtnW / 2; // 1120

            setButtonPos(this.closeButton, closeBtnX, buttonY, closeBtnW, 85);
            this.closeButton.update(inX, inY);

            const clicking = game.input.buttons.indexOf(0) > -1;

            if (!clicking) {
                this.clicked = false;
            }

            if (this.closeButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.hide();
                return true;
            }
        }

        return true;
    }

    draw(context, game) {
        if (!this.isVisible) return;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        context.save();

        // Draw overlay
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Panel dimensions
        const panelW = 800 * rX;
        const panelH = 700 * rY;
        const panelX = centerX - panelW / 2;
        const panelY = centerY - panelH / 2;
        const cornerRadius = 15 * rX;

        // Draw panel background
        this.drawRoundedRect(context, panelX, panelY, panelW, panelH, cornerRadius);
        const gradient = context.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
        gradient.addColorStop(0, 'rgba(20, 30, 60, 0.98)');
        gradient.addColorStop(1, 'rgba(10, 20, 40, 0.98)');
        context.fillStyle = gradient;
        context.fill();

        // Draw border
        context.strokeStyle = '#ffaa00';
        context.shadowColor = '#ffaa00';
        context.shadowBlur = 15 * rX;
        context.lineWidth = 3 * rX;
        context.stroke();
        context.shadowBlur = 0;

        // Draw content based on state
        if (this.state === 'confirm') {
            this.drawConfirmState(context, centerX, panelY, rX, rY);
        } else if (this.state === 'queued') {
            this.drawQueuedState(context, centerX, panelY, rX, rY);
        } else if (this.state === 'results') {
            this.drawResultsState(context, centerX, panelY, rX, rY);
        }

        // Draw error message if any
        if (this.errorMessage) {
            context.font = `${22 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = '#ff4444';
            context.fillText(this.errorMessage, centerX, panelY + panelH - 50 * rY);
        }

        context.restore();
    }

    drawConfirmState(context, centerX, panelY, rX, rY) {
        // Title
        context.font = `bold ${48 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = '#ffaa00';
        context.shadowColor = '#ffaa00';
        context.shadowBlur = 10 * rX;
        context.fillText('RANKED MODE', centerX, panelY + 80 * rY);
        context.shadowBlur = 0;

        // Player ELO info
        context.font = `${32 * rX}px Arial`;
        context.fillStyle = '#ffffff';
        context.fillText(`Your ELO: ${this.playerElo}`, centerX, panelY + 160 * rY);

        if (this.playerRank) {
            context.font = `${24 * rX}px Arial`;
            context.fillStyle = '#88ffff';
            context.fillText(`Rank #${this.playerRank} | ${this.gamesPlayed} games played`, centerX, panelY + 200 * rY);
        }

        // Queue info
        context.font = `${26 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText(`Players in queue: ${this.queueSize}/10`, centerX, panelY + 280 * rY);

        // Attempts info (if already in queue)
        if (this.attemptsUsed > 0) {
            context.font = `${24 * rX}px Arial`;
            context.fillStyle = this.attemptsRemaining > 0 ? '#00ff88' : '#ff4444';
            context.fillText(`Attempts: ${this.attemptsUsed}/${this.maxAttempts} used`, centerX, panelY + 320 * rY);
            if (this.bestScore !== null) {
                context.fillStyle = '#ffaa00';
                context.fillText(`Best Score: ${this.bestScore.toLocaleString()}`, centerX, panelY + 350 * rY);
            }
        }

        // Rules
        context.font = `${22 * rX}px Arial`;
        context.fillStyle = '#ffffff';
        const rulesStartY = this.attemptsUsed > 0 ? 400 : 350;
        const rules = [
            'EASY difficulty only',
            `${this.maxAttempts} attempts per tournament`,
            'Best score counts for placement',
            'Tournament resolves at 10 players',
            'Top 25% gain ELO, Bottom 25% lose ELO'
        ];
        rules.forEach((rule, i) => {
            context.fillText(rule, centerX, panelY + rulesStartY * rY + i * 32 * rY);
        });

        // Draw buttons (disable confirm if no attempts remaining)
        const canQueue = this.attemptsUsed === 0 || this.attemptsRemaining > 0;
        if (!canQueue) {
            // Draw disabled button manually
            const btn = this.confirmButton;
            const rX2 = window.innerWidth / 2560;
            const rY2 = window.innerHeight / 1440;
            const bx = btn.x * rX2;
            const by = btn.y * rY2;
            const bw = btn.w * rX2;
            const bh = btn.h * rY2;
            const cornerR = 8 * rX2;

            context.beginPath();
            context.roundRect(bx, by, bw, bh, cornerR);
            context.fillStyle = 'rgba(50, 50, 50, 0.8)';
            context.fill();
            context.strokeStyle = '#555555';
            context.lineWidth = 2 * rX2;
            context.stroke();

            context.font = `${28 * rX2}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = '#666666';
            context.fillText('No Attempts', bx + bw / 2, by + bh / 2 + 10 * rY2);
        } else {
            this.confirmButton.draw(context);
        }
        this.cancelButton.draw(context);
        this.leaderboardButton.draw(context);
    }

    drawQueuedState(context, centerX, panelY, rX, rY) {
        // Title
        context.font = `bold ${42 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = '#00ff88';
        context.shadowColor = '#00ff88';
        context.shadowBlur = 10 * rX;
        context.fillText('SCORE SUBMITTED!', centerX, panelY + 80 * rY);
        context.shadowBlur = 0;

        // Attempts status
        context.font = `${28 * rX}px Arial`;
        context.fillStyle = this.attemptsRemaining > 0 ? '#00ff88' : '#ffaa00';
        context.fillText(`Attempts: ${this.attemptsUsed}/${this.maxAttempts}`, centerX, panelY + 140 * rY);

        // Best score
        if (this.bestScore !== null) {
            context.font = `${32 * rX}px Arial`;
            context.fillStyle = '#ffaa00';
            context.fillText(`Best Score: ${this.bestScore.toLocaleString()}`, centerX, panelY + 190 * rY);
        }

        // Queue status
        context.font = `${26 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText(`${this.queueSize} of 10 players in queue`, centerX, panelY + 260 * rY);
        context.fillText(`Waiting for ${this.playersNeeded} more player${this.playersNeeded !== 1 ? 's' : ''}...`, centerX, panelY + 300 * rY);

        // Info based on attempts remaining
        context.font = `${22 * rX}px Arial`;
        context.fillStyle = '#88ffff';
        if (this.attemptsRemaining > 0) {
            context.fillText(`You have ${this.attemptsRemaining} attempt${this.attemptsRemaining !== 1 ? 's' : ''} remaining!`, centerX, panelY + 380 * rY);
            context.fillText('Play again to try for a higher score.', centerX, panelY + 420 * rY);
        } else {
            context.fillText('All attempts used. Wait for tournament to resolve.', centerX, panelY + 380 * rY);
            context.fillText('Check back later to see your results!', centerX, panelY + 420 * rY);
        }

        // Draw button
        this.closeButton.draw(context);
    }

    drawResultsState(context, centerX, panelY, rX, rY) {
        if (!this.playerResult) return;

        const placement = this.playerResult.placement;
        const totalPlayers = this.tournamentResults.totalPlayers;
        const percentile = (placement / totalPlayers) * 100;

        // Title color based on result
        let titleColor, titleText;
        if (percentile <= 25) {
            titleColor = '#00ff88';
            titleText = 'VICTORY!';
        } else if (percentile > 75) {
            titleColor = '#ff4444';
            titleText = 'DEFEAT';
        } else {
            titleColor = '#ffaa00';
            titleText = 'NEUTRAL';
        }

        context.font = `bold ${48 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = titleColor;
        context.shadowColor = titleColor;
        context.shadowBlur = 15 * rX;
        context.fillText(titleText, centerX, panelY + 80 * rY);
        context.shadowBlur = 0;

        // Placement
        context.font = `${36 * rX}px Arial`;
        context.fillStyle = '#ffffff';
        context.fillText(`Placement: #${placement} of ${totalPlayers}`, centerX, panelY + 160 * rY);

        // Score
        context.font = `${28 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText(`Score: ${this.playerResult.score.toLocaleString()}`, centerX, panelY + 210 * rY);

        // ELO change
        const eloChange = this.playerResult.eloChange;
        const eloColor = eloChange > 0 ? '#00ff88' : eloChange < 0 ? '#ff4444' : '#aaaaaa';
        const eloSign = eloChange > 0 ? '+' : '';

        context.font = `bold ${42 * rX}px Arial`;
        context.fillStyle = eloColor;
        context.shadowColor = eloColor;
        context.shadowBlur = 10 * rX;
        context.fillText(`${eloSign}${eloChange} ELO`, centerX, panelY + 300 * rY);
        context.shadowBlur = 0;

        // New ELO
        context.font = `${28 * rX}px Arial`;
        context.fillStyle = '#ffffff';
        context.fillText(`${this.playerResult.eloBefore} → ${this.playerResult.eloAfter}`, centerX, panelY + 350 * rY);

        // Top 3 players
        if (this.tournamentResults.allResults) {
            context.font = `${20 * rX}px Arial`;
            context.fillStyle = '#888888';
            context.fillText('Top 3:', centerX, panelY + 430 * rY);

            const top3 = this.tournamentResults.allResults.slice(0, 3);
            top3.forEach((result, i) => {
                const medals = ['#ffd700', '#c0c0c0', '#cd7f32'];
                context.fillStyle = medals[i];
                context.fillText(`${i + 1}. ${result.playerName} - ${result.score.toLocaleString()}`, centerX, panelY + 465 * rY + i * 28 * rY);
            });
        }

        // Draw button
        this.closeButton.draw(context);
    }

    drawRoundedRect(context, x, y, w, h, r) {
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + w - r, y);
        context.quadraticCurveTo(x + w, y, x + w, y + r);
        context.lineTo(x + w, y + h - r);
        context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        context.lineTo(x + r, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
    }
}
