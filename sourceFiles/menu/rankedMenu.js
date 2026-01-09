import { Button, superFunctions } from "./supers.js";

export class RankedMenu {
    constructor() {
        this.super = new superFunctions();

        this.isVisible = false;
        this.state = 'idle'; // 'idle', 'confirm', 'queued', 'queue_view', 'results'

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

        // Queue standings data
        this.queueStandings = [];
        this.playersReady = 0;
        this.totalQueuedPlayers = 0;

        // Tournament results
        this.tournamentResults = null;
        this.playerResult = null;

        // Error state
        this.errorMessage = null;

        this.clicked = false;

        // Confirm state buttons
        this.confirmButton = new Button(0, 0, 200, 70, "Queue Up", 30, 0, 0, false, true, 'white', 'white');
        this.cancelButton = new Button(0, 0, 200, 70, "Cancel", 30, 0, 0, false, true, 'white', 'white');
        this.leaderboardButton = new Button(0, 0, 200, 70, "Rankings", 28, 0, 0, false, true, 'white', 'white');
        this.viewQueueButton = new Button(0, 0, 200, 70, "View Queue", 26, 0, 0, false, true, 'white', 'white');

        // Results/Queued screen buttons
        this.closeButton = new Button(0, 0, 280, 70, "Continue", 34, 0, 0, false, true, 'white', 'white');
        this.backButton = new Button(0, 0, 200, 70, "Back", 30, 0, 0, false, true, 'white', 'white');
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
        // Queue standings
        if (status.queueStandings) {
            this.queueStandings = status.queueStandings;
        }
        this.playersReady = status.playersReady || 0;
        this.totalQueuedPlayers = status.totalQueuedPlayers || this.queueSize;
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
        if (queueInfo.queueStandings) {
            this.queueStandings = queueInfo.queueStandings;
        }
        this.playersReady = queueInfo.playersReady || 0;
        this.totalQueuedPlayers = queueInfo.totalQueuedPlayers || this.queueSize;
        this.state = 'queued';
    }

    setQueueStandings(standings) {
        this.queueStandings = standings || [];
    }

    setError(message) {
        this.errorMessage = message;
    }

    update(game) {
        if (!this.isVisible) return true;

        const inX = game.input.mouseX;
        const inY = game.input.mouseY;

        // Panel dimensions in reference coordinates (2560x1440)
        const refCenterX = 1280;
        const refPanelH = 800;
        const refPanelBottom = 720 + refPanelH / 2;
        const buttonY = refPanelBottom - 60 - 70; // padding from bottom

        const setButtonPos = (btn, x, y, w, h) => {
            btn.x = x;
            btn.y = y;
            btn.w = w;
            btn.h = h;
        };

        const clicking = game.input.buttons.indexOf(0) > -1;
        if (!clicking) {
            this.clicked = false;
        }

        if (this.state === 'confirm') {
            // Top row: Rankings and View Queue buttons
            const topBtnY = 720 - refPanelH / 2 + 570; // Position below rules text
            const btnW = 200;
            const gap = 20;

            setButtonPos(this.leaderboardButton, refCenterX - btnW - gap / 2, topBtnY, btnW, 70);
            setButtonPos(this.viewQueueButton, refCenterX + gap / 2, topBtnY, btnW, 70);

            // Bottom row: Queue Up and Cancel buttons
            setButtonPos(this.confirmButton, refCenterX - btnW - gap / 2, buttonY, btnW, 70);
            setButtonPos(this.cancelButton, refCenterX + gap / 2, buttonY, btnW, 70);

            this.confirmButton.update(inX, inY);
            this.cancelButton.update(inX, inY);
            this.leaderboardButton.update(inX, inY);
            this.viewQueueButton.update(inX, inY);

            if (this.cancelButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.hide();
                return true;
            }

            if (this.leaderboardButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                return 'open_ranked_leaderboard';
            }

            if (this.viewQueueButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                return 'view_queue';
            }

            const canQueue = this.attemptsUsed === 0 || this.attemptsRemaining > 0;
            if (this.confirmButton.isHovered && clicking && !this.clicked && canQueue) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                return 'start_ranked';
            }
        } else if (this.state === 'queue_view') {
            // Back button
            setButtonPos(this.backButton, refCenterX - 100, buttonY, 200, 70);
            this.backButton.update(inX, inY);

            if (this.backButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.state = 'confirm';
                return true;
            }
        } else if (this.state === 'queued' || this.state === 'results') {
            const closeBtnW = 280;
            setButtonPos(this.closeButton, refCenterX - closeBtnW / 2, buttonY, closeBtnW, 70);
            this.closeButton.update(inX, inY);

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
        const panelW = 900 * rX;
        const panelH = 800 * rY;
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
        } else if (this.state === 'queue_view') {
            this.drawQueueViewState(context, centerX, panelY, rX, rY);
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
            context.fillText(this.errorMessage, centerX, panelY + panelH - 30 * rY);
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
        context.fillText('RANKED MODE', centerX, panelY + 70 * rY);
        context.shadowBlur = 0;

        // Player ELO info
        context.font = `${32 * rX}px Arial`;
        context.fillStyle = '#ffffff';
        context.fillText(`Your ELO: ${this.playerElo}`, centerX, panelY + 140 * rY);

        if (this.playerRank) {
            context.font = `${22 * rX}px Arial`;
            context.fillStyle = '#88ffff';
            context.fillText(`Rank #${this.playerRank} | ${this.gamesPlayed} games played`, centerX, panelY + 175 * rY);
        }

        // Queue info
        context.font = `${26 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText(`Players in queue: ${this.queueSize}/10`, centerX, panelY + 240 * rY);

        // Tournament status
        if (this.queueSize >= 10) {
            context.font = `${22 * rX}px Arial`;
            context.fillStyle = '#00ff88';
            context.fillText(`${this.playersReady}/${this.totalQueuedPlayers} players completed all attempts`, centerX, panelY + 275 * rY);
        }

        // Attempts info (if already in queue)
        let infoEndY = 275;
        if (this.attemptsUsed > 0) {
            context.font = `${24 * rX}px Arial`;
            context.fillStyle = this.attemptsRemaining > 0 ? '#00ff88' : '#ff4444';
            context.fillText(`Your Attempts: ${this.attemptsUsed}/${this.maxAttempts}`, centerX, panelY + 320 * rY);
            if (this.bestScore !== null) {
                context.fillStyle = '#ffaa00';
                context.fillText(`Your Best Score: ${this.bestScore.toLocaleString()}`, centerX, panelY + 355 * rY);
            }
            infoEndY = 355;
        }

        // Rules
        context.font = `${20 * rX}px Arial`;
        context.fillStyle = '#888888';
        const rulesStartY = infoEndY + 50;
        const rules = [
            'EASY difficulty only',
            `${this.maxAttempts} attempts per tournament`,
            'Best score counts for placement',
            'Resolves when all players complete attempts',
            'Top 25% gain ELO, Bottom 25% lose ELO'
        ];
        rules.forEach((rule, i) => {
            context.fillText(rule, centerX, panelY + rulesStartY * rY + i * 28 * rY);
        });

        // Draw buttons
        const canQueue = this.attemptsUsed === 0 || this.attemptsRemaining > 0;
        if (!canQueue) {
            this.drawDisabledButton(context, this.confirmButton, 'All Used');
        } else {
            this.confirmButton.draw(context);
        }
        this.cancelButton.draw(context);
        this.leaderboardButton.draw(context);
        this.viewQueueButton.draw(context);
    }

    drawQueueViewState(context, centerX, panelY, rX, rY) {
        // Title
        context.font = `bold ${42 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = '#ffaa00';
        context.shadowColor = '#ffaa00';
        context.shadowBlur = 10 * rX;
        context.fillText('QUEUE STANDINGS', centerX, panelY + 70 * rY);
        context.shadowBlur = 0;

        // Queue status
        context.font = `${24 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText(`${this.queueSize} players | ${this.playersReady} ready`, centerX, panelY + 110 * rY);

        // Column headers
        const startY = 160;
        const colRank = centerX - 350 * rX;
        const colName = centerX - 250 * rX;
        const colScore = centerX + 50 * rX;
        const colAttempts = centerX + 250 * rX;

        context.font = `${20 * rX}px Arial`;
        context.fillStyle = '#888888';
        context.textAlign = 'left';
        context.fillText('#', colRank, panelY + startY * rY);
        context.fillText('PLAYER', colName, panelY + startY * rY);
        context.fillText('BEST SCORE', colScore, panelY + startY * rY);
        context.fillText('ATTEMPTS', colAttempts, panelY + startY * rY);

        // Separator line
        context.strokeStyle = 'rgba(255, 170, 0, 0.3)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(centerX - 380 * rX, panelY + (startY + 15) * rY);
        context.lineTo(centerX + 380 * rX, panelY + (startY + 15) * rY);
        context.stroke();

        // Queue entries
        context.font = `${22 * rX}px Arial`;
        const rowHeight = 40;
        const maxRows = 12;

        if (this.queueStandings.length === 0) {
            context.fillStyle = '#666666';
            context.textAlign = 'center';
            context.fillText('No players in queue yet', centerX, panelY + (startY + 80) * rY);
        } else {
            for (let i = 0; i < Math.min(this.queueStandings.length, maxRows); i++) {
                const entry = this.queueStandings[i];
                const y = panelY + (startY + 50 + i * rowHeight) * rY;

                // Highlight if all attempts used
                const isReady = entry.attempts >= this.maxAttempts;

                // Rank
                context.textAlign = 'left';
                context.fillStyle = i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#ffffff';
                context.fillText(`${i + 1}`, colRank, y);

                // Name
                const displayName = entry.player_name.length > 12
                    ? entry.player_name.substring(0, 12) + '...'
                    : entry.player_name;
                context.fillStyle = isReady ? '#00ff88' : '#ffffff';
                context.fillText(displayName, colName, y);

                // Score
                context.fillStyle = '#ffaa00';
                context.fillText(entry.score.toLocaleString(), colScore, y);

                // Attempts
                context.fillStyle = isReady ? '#00ff88' : '#88ffff';
                context.fillText(`${entry.attempts}/${this.maxAttempts}`, colAttempts, y);
            }
        }

        // Draw back button
        this.backButton.draw(context);
    }

    drawQueuedState(context, centerX, panelY, rX, rY) {
        // Title
        context.font = `bold ${42 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = '#00ff88';
        context.shadowColor = '#00ff88';
        context.shadowBlur = 10 * rX;
        context.fillText('SCORE SUBMITTED!', centerX, panelY + 70 * rY);
        context.shadowBlur = 0;

        // Attempts status
        context.font = `${28 * rX}px Arial`;
        context.fillStyle = this.attemptsRemaining > 0 ? '#00ff88' : '#ffaa00';
        context.fillText(`Attempts: ${this.attemptsUsed}/${this.maxAttempts}`, centerX, panelY + 130 * rY);

        // Best score
        if (this.bestScore !== null) {
            context.font = `${32 * rX}px Arial`;
            context.fillStyle = '#ffaa00';
            context.fillText(`Best Score: ${this.bestScore.toLocaleString()}`, centerX, panelY + 180 * rY);
        }

        // Queue status
        context.font = `${26 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText(`${this.queueSize} of 10 players in queue`, centerX, panelY + 250 * rY);

        if (this.queueSize >= 10) {
            context.fillStyle = '#88ffff';
            context.fillText(`${this.playersReady}/${this.totalQueuedPlayers} players completed all attempts`, centerX, panelY + 290 * rY);
        } else {
            context.fillText(`Waiting for ${this.playersNeeded} more player${this.playersNeeded !== 1 ? 's' : ''}...`, centerX, panelY + 290 * rY);
        }

        // Info based on attempts remaining
        context.font = `${22 * rX}px Arial`;
        context.fillStyle = '#88ffff';
        if (this.attemptsRemaining > 0) {
            context.fillText(`You have ${this.attemptsRemaining} attempt${this.attemptsRemaining !== 1 ? 's' : ''} remaining!`, centerX, panelY + 370 * rY);
            context.fillText('Play again to try for a higher score.', centerX, panelY + 405 * rY);
        } else {
            context.fillText('All attempts used. Waiting for other players...', centerX, panelY + 370 * rY);
            context.fillText('Tournament resolves when everyone finishes.', centerX, panelY + 405 * rY);
        }

        // Draw button
        this.closeButton.draw(context);
    }

    drawResultsState(context, centerX, panelY, rX, rY) {
        if (!this.playerResult) return;

        const placement = this.playerResult.placement;
        const totalPlayers = this.tournamentResults.totalPlayers;
        const percentile = (placement / totalPlayers) * 100;

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
        context.fillText(titleText, centerX, panelY + 70 * rY);
        context.shadowBlur = 0;

        context.font = `${36 * rX}px Arial`;
        context.fillStyle = '#ffffff';
        context.fillText(`Placement: #${placement} of ${totalPlayers}`, centerX, panelY + 140 * rY);

        context.font = `${28 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText(`Score: ${this.playerResult.score.toLocaleString()}`, centerX, panelY + 185 * rY);

        const eloChange = this.playerResult.eloChange;
        const eloColor = eloChange > 0 ? '#00ff88' : eloChange < 0 ? '#ff4444' : '#aaaaaa';
        const eloSign = eloChange > 0 ? '+' : '';

        context.font = `bold ${42 * rX}px Arial`;
        context.fillStyle = eloColor;
        context.shadowColor = eloColor;
        context.shadowBlur = 10 * rX;
        context.fillText(`${eloSign}${eloChange} ELO`, centerX, panelY + 270 * rY);
        context.shadowBlur = 0;

        context.font = `${28 * rX}px Arial`;
        context.fillStyle = '#ffffff';
        context.fillText(`${this.playerResult.eloBefore} → ${this.playerResult.eloAfter}`, centerX, panelY + 315 * rY);

        if (this.tournamentResults.allResults) {
            context.font = `${20 * rX}px Arial`;
            context.fillStyle = '#888888';
            context.fillText('Top 3:', centerX, panelY + 380 * rY);

            const top3 = this.tournamentResults.allResults.slice(0, 3);
            top3.forEach((result, i) => {
                const medals = ['#ffd700', '#c0c0c0', '#cd7f32'];
                context.fillStyle = medals[i];
                context.fillText(`${i + 1}. ${result.playerName} - ${result.score.toLocaleString()}`, centerX, panelY + 415 * rY + i * 28 * rY);
            });
        }

        this.closeButton.draw(context);
    }

    drawDisabledButton(context, btn, text) {
        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;
        const bx = btn.x * rX;
        const by = btn.y * rY;
        const bw = btn.w * rX;
        const bh = btn.h * rY;
        const cornerR = 8 * rX;

        context.beginPath();
        context.roundRect(bx, by, bw, bh, cornerR);
        context.fillStyle = 'rgba(50, 50, 50, 0.8)';
        context.fill();
        context.strokeStyle = '#555555';
        context.lineWidth = 2 * rX;
        context.stroke();

        context.font = `${24 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = '#666666';
        context.fillText(text, bx + bw / 2, by + bh / 2 + 8 * rY);
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
