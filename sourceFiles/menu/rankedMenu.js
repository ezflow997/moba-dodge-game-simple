import { Button, superFunctions } from "./supers.js";

export class RankedMenu {
    constructor() {
        this.super = new superFunctions();

        this.isVisible = false;
        this.state = 'idle'; // 'idle', 'confirm', 'queued', 'queue_view', 'results'

        // Queue status
        this.queueSize = 0;
        this.queuePosition = 0;
        this.playersNeeded = 2;
        this.maxPlayers = 2;
        this.totalQueues = 0;
        this.totalPlayersAllQueues = 0;

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
        this.timeRemaining = null;
        this.allQueuesSummary = [];
        this.dataFetchTime = null; // Timestamp when queue data was fetched
        this.isQueued = false; // Whether player is actually in a queue

        // Queue view pagination
        this.queueViewPage = 0; // 0 = current queue, 1 = all queues
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.isDraggingScrollbar = false;
        this.scrollbarDragStartY = 0;
        this.scrollbarDragStartOffset = 0;

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

        // Queue view page navigation buttons
        this.prevPageButton = new Button(0, 0, 150, 50, "My Queue", 20, 0, 0, false, true, 'white', 'white');
        this.nextPageButton = new Button(0, 0, 150, 50, "All Queues", 20, 0, 0, false, true, 'white', 'white');

        // Admin button for fixing stuck queues
        this.fixQueuesButton = new Button(0, 0, 180, 50, "Fix Queues", 18, 0, 0, false, true, 'white', 'white');
    }

    show(state = 'confirm') {
        this.isVisible = true;
        this.state = state;
        this.clicked = false;
        this.errorMessage = null;
        // Reset queue view page when entering
        if (state === 'queue_view') {
            this.queueViewPage = 0;
            this.scrollOffset = 0;
        }
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
        this.playersNeeded = status.playersNeeded || 0;
        this.maxPlayers = status.maxPlayers || 2;
        this.totalQueues = status.totalQueues || 0;
        this.totalPlayersAllQueues = status.totalPlayersAllQueues || 0;
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
        this.isQueued = status.isQueued || false;
        // Time remaining and all queues summary
        this.timeRemaining = status.timeRemaining !== undefined ? status.timeRemaining : null;
        if (status.allQueuesSummary) {
            this.allQueuesSummary = status.allQueuesSummary;
        }
        // Store fetch time for live countdown calculation
        this.dataFetchTime = Date.now();
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
        this.isQueued = true; // Player just submitted, so they're now in queue
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

        // Handle ESC to close ranked panel
        if (game.input.escapePressed) {
            this.hide();
            game.input.escapePressed = false;  // Consume the flag so pause menu doesn't open
            return true;
        }

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
            // Page navigation buttons at top
            const refPanelTop = 720 - refPanelH / 2;
            const pageNavY = refPanelTop + 70;
            setButtonPos(this.prevPageButton, refCenterX - 160, pageNavY, 150, 50);
            setButtonPos(this.nextPageButton, refCenterX + 10, pageNavY, 150, 50);

            this.prevPageButton.update(inX, inY);
            this.nextPageButton.update(inX, inY);

            // Back button and Fix Queues button
            setButtonPos(this.backButton, refCenterX - 200, buttonY, 180, 70);
            setButtonPos(this.fixQueuesButton, refCenterX + 20, buttonY, 180, 70);
            this.backButton.update(inX, inY);
            this.fixQueuesButton.update(inX, inY);

            // Page navigation
            if (this.prevPageButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.queueViewPage = 0;
                this.scrollOffset = 0;
                return true;
            }

            if (this.nextPageButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.queueViewPage = 1;
                this.scrollOffset = 0;
                return true;
            }

            // Handle scroll on page 1 (all queues)
            if (this.queueViewPage === 1) {
                // Calculate content and scroll dimensions
                const totalHeight = this.allQueuesSummary.reduce((h, q) => h + 80 + q.players.length * 30, 0);
                const viewHeight = 400;
                this.maxScrollOffset = Math.max(0, totalHeight - viewHeight);

                // Scale factors for coordinate conversion
                const scaleX = window.innerWidth / 2560;
                const scaleY = window.innerHeight / 1440;

                // Scrollbar dimensions (in screen coordinates)
                const scrollbarX = (refCenterX + 530) * scaleX;
                const scrollbarY = (720 - refPanelH / 2 + 180) * scaleY;
                const scrollbarHeight = 420 * scaleY;
                const scrollbarWidth = 40 * scaleX; // Wider hit area for easier clicking

                // Calculate thumb size and position
                const thumbHeight = this.maxScrollOffset > 0
                    ? Math.max(40 * scaleY, (viewHeight / totalHeight) * scrollbarHeight)
                    : scrollbarHeight;
                const thumbY = this.maxScrollOffset > 0
                    ? scrollbarY + (this.scrollOffset / this.maxScrollOffset) * (scrollbarHeight - thumbHeight)
                    : scrollbarY;

                // Handle scrollbar dragging
                if (clicking && this.maxScrollOffset > 0) {
                    // Check if clicking on scrollbar track or thumb (with extra padding for easier clicks)
                    const hitPadding = 15 * scaleX;
                    if (inX >= scrollbarX - hitPadding && inX <= scrollbarX + scrollbarWidth + hitPadding &&
                        inY >= scrollbarY && inY <= scrollbarY + scrollbarHeight) {
                        if (!this.isDraggingScrollbar && !this.clicked) {
                            this.isDraggingScrollbar = true;
                            this.scrollbarDragStartY = inY;
                            this.scrollbarDragStartOffset = this.scrollOffset;
                        }
                    }
                }

                if (this.isDraggingScrollbar) {
                    if (clicking) {
                        const dragDelta = inY - this.scrollbarDragStartY;
                        const scrollRatio = dragDelta / (scrollbarHeight - thumbHeight);
                        this.scrollOffset = this.scrollbarDragStartOffset + scrollRatio * this.maxScrollOffset;
                        this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset));
                    } else {
                        this.isDraggingScrollbar = false;
                    }
                }

                // Mouse wheel scrolling
                if (game.input.wheelDelta) {
                    this.scrollOffset += game.input.wheelDelta > 0 ? -60 : 60;
                    this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset));
                }
            }

            if (this.backButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.queueViewPage = 0;
                this.scrollOffset = 0;
                this.state = 'confirm';
                return true;
            }

            if (this.fixQueuesButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                return 'fix_stuck_queues';
            }
        } else if (this.state === 'queued') {
            const closeBtnW = 280;
            setButtonPos(this.closeButton, refCenterX - closeBtnW / 2, buttonY, closeBtnW, 70);
            this.closeButton.update(inX, inY);

            if (this.closeButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Return to confirm state to see queue status and play again
                this.state = 'confirm';
                return 'refresh_ranked_status';
            }
        } else if (this.state === 'results') {
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
        const panelW = 1150 * rX;
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

        // Queue info - show total players across all queues
        context.font = `${26 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        const queueText = this.totalQueues > 0
            ? `${this.totalPlayersAllQueues} players in ${this.totalQueues} queue${this.totalQueues !== 1 ? 's' : ''}`
            : 'No active queues';
        context.fillText(queueText, centerX, panelY + 240 * rY);

        // Current queue status (your queue)
        if (this.queueSize > 0) {
            context.font = `${22 * rX}px Arial`;
            context.fillStyle = '#88ffff';
            context.fillText(`Your queue: ${this.queueSize}/${this.maxPlayers} players`, centerX, panelY + 270 * rY);
        }

        // Tournament status
        if (this.queueSize >= this.maxPlayers) {
            context.font = `${22 * rX}px Arial`;
            context.fillStyle = '#00ff88';
            context.fillText(`${this.playersReady}/${this.totalQueuedPlayers} completed all attempts`, centerX, panelY + 300 * rY);
        }

        // Attempts info (if already in queue)
        let infoEndY = 300;
        if (this.attemptsUsed > 0) {
            context.font = `${24 * rX}px Arial`;
            context.fillStyle = this.attemptsRemaining > 0 ? '#00ff88' : '#ff4444';
            context.fillText(`Your Attempts: ${this.attemptsUsed}/${this.maxAttempts}`, centerX, panelY + 340 * rY);
            if (this.bestScore !== null) {
                context.fillStyle = '#ffaa00';
                context.fillText(`Your Best Score: ${this.bestScore.toLocaleString()}`, centerX, panelY + 375 * rY);
            }
            infoEndY = 375;
        }

        // Rules
        context.font = `${20 * rX}px Arial`;
        context.fillStyle = '#888888';
        const rulesStartY = infoEndY + 45;
        const rules = [
            'HARD difficulty only',
            `${this.maxAttempts} attempts per tournament`,
            'Best score counts for placement',
            'Resolves when complete or after 1 hour'
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
        let title;
        if (this.queueViewPage === 0) {
            title = this.isQueued ? 'MY QUEUE' : 'AVAILABLE QUEUE';
        } else {
            title = 'ALL QUEUES';
        }
        context.fillText(title, centerX, panelY + 60 * rY);
        context.shadowBlur = 0;

        // Draw page navigation buttons with active highlight
        const btn1X = this.prevPageButton.x * rX;
        const btn1Y = this.prevPageButton.y * rY;
        const btn2X = this.nextPageButton.x * rX;
        const btn2Y = this.nextPageButton.y * rY;
        const btnW = this.prevPageButton.w * rX;
        const btnH = this.prevPageButton.h * rY;

        // Draw highlight background for active tab
        context.beginPath();
        if (this.queueViewPage === 0) {
            context.roundRect(btn1X - 4 * rX, btn1Y - 4 * rY, btnW + 8 * rX, btnH + 8 * rY, 12 * rX);
            context.fillStyle = 'rgba(255, 170, 0, 0.2)';
            context.fill();
            context.strokeStyle = '#ffaa00';
            context.lineWidth = 2 * rX;
            context.shadowColor = '#ffaa00';
            context.shadowBlur = 10 * rX;
            context.stroke();
            context.shadowBlur = 0;
        } else {
            context.roundRect(btn2X - 4 * rX, btn2Y - 4 * rY, btnW + 8 * rX, btnH + 8 * rY, 12 * rX);
            context.fillStyle = 'rgba(255, 170, 0, 0.2)';
            context.fill();
            context.strokeStyle = '#ffaa00';
            context.lineWidth = 2 * rX;
            context.shadowColor = '#ffaa00';
            context.shadowBlur = 10 * rX;
            context.stroke();
            context.shadowBlur = 0;
        }

        this.prevPageButton.draw(context);
        this.nextPageButton.draw(context);

        if (this.queueViewPage === 0) {
            this.drawMyQueuePage(context, centerX, panelY, rX, rY);
        } else {
            this.drawAllQueuesPage(context, centerX, panelY, rX, rY);
        }

        // Draw back button and fix queues button
        this.backButton.draw(context);
        this.fixQueuesButton.draw(context);
    }

    // Calculate live time remaining based on fetch time
    getLiveTimeRemaining(originalTime) {
        if (originalTime === null || this.dataFetchTime === null) return null;
        const elapsed = Date.now() - this.dataFetchTime;
        return Math.max(0, originalTime - elapsed);
    }

    drawMyQueuePage(context, centerX, panelY, rX, rY) {
        // Show notice if player is not yet in the queue
        if (!this.isQueued && this.queueStandings.length > 0) {
            context.font = `${20 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = '#ffaa00';
            context.fillText('You will join this queue when you play a ranked game', centerX, panelY + 130 * rY);
        }

        // Time remaining display (live countdown) - only shows when minimum players reached
        const liveTimeRemaining = this.getLiveTimeRemaining(this.timeRemaining);
        context.font = `${22 * rX}px Arial`;
        context.textAlign = 'center';
        if (liveTimeRemaining !== null) {
            const minutes = Math.floor(liveTimeRemaining / 60000);
            const seconds = Math.floor((liveTimeRemaining % 60000) / 1000);
            const timeStr = `${minutes}m ${seconds}s remaining`;
            context.fillStyle = minutes < 10 ? '#ff8844' : '#88ffff';
            context.fillText(timeStr, centerX, panelY + 160 * rY);
        } else if (this.queueSize > 0 && this.queueSize < this.maxPlayers) {
            context.fillStyle = '#888888';
            context.fillText('Waiting for more players to start timer...', centerX, panelY + 160 * rY);
        }

        // Queue status
        context.font = `${24 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        const queueLabel = this.isQueued ? 'Your queue:' : 'Available queue:';
        context.fillText(`${queueLabel} ${this.queueSize}/${this.maxPlayers} players | ${this.playersReady} ready`, centerX, panelY + 195 * rY);

        // Column headers
        const startY = 230;
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
        const rowHeight = 38;
        const maxRows = 10;

        if (this.queueStandings.length === 0) {
            context.fillStyle = '#666666';
            context.textAlign = 'center';
            context.fillText('You are not in a queue', centerX, panelY + (startY + 80) * rY);
        } else {
            for (let i = 0; i < Math.min(this.queueStandings.length, maxRows); i++) {
                const entry = this.queueStandings[i];
                const y = panelY + (startY + 50 + i * rowHeight) * rY;

                const isReady = entry.attempts >= this.maxAttempts;

                context.textAlign = 'left';
                context.fillStyle = i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#ffffff';
                context.fillText(`${i + 1}`, colRank, y);

                const displayName = entry.player_name.length > 12
                    ? entry.player_name.substring(0, 12) + '...'
                    : entry.player_name;
                context.fillStyle = isReady ? '#00ff88' : '#ffffff';
                context.fillText(displayName, colName, y);

                context.fillStyle = '#ffaa00';
                context.fillText(entry.score.toLocaleString(), colScore, y);

                context.fillStyle = isReady ? '#00ff88' : '#88ffff';
                context.fillText(`${entry.attempts}/${this.maxAttempts}`, colAttempts, y);
            }
        }
    }

    drawAllQueuesPage(context, centerX, panelY, rX, rY) {
        const panelW = 1150 * rX;
        const panelH = 800 * rY;

        // Queue count info
        context.font = `${20 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = '#888888';
        const queueCount = this.allQueuesSummary.length;
        context.fillText(`${queueCount} active queue${queueCount !== 1 ? 's' : ''} | Drag scrollbar or use mouse wheel`, centerX, panelY + 160 * rY);

        // Draw clipping region for scrollable content
        context.save();
        const clipY = panelY + 180 * rY;
        const clipH = panelH - 280 * rY;
        context.beginPath();
        context.rect(centerX - panelW / 2 + 20 * rX, clipY, panelW - 40 * rX, clipH);
        context.clip();

        // Queue colors for different queues
        const queueColors = [
            'rgba(255, 100, 100, 0.3)',   // Red
            'rgba(100, 255, 100, 0.3)',   // Green
            'rgba(100, 100, 255, 0.3)',   // Blue
            'rgba(255, 255, 100, 0.3)',   // Yellow
            'rgba(255, 100, 255, 0.3)',   // Magenta
            'rgba(100, 255, 255, 0.3)',   // Cyan
            'rgba(255, 180, 100, 0.3)',   // Orange
            'rgba(180, 100, 255, 0.3)',   // Purple
        ];

        const borderColors = [
            '#ff6464',
            '#64ff64',
            '#6464ff',
            '#ffff64',
            '#ff64ff',
            '#64ffff',
            '#ffb464',
            '#b464ff',
        ];

        if (this.allQueuesSummary.length === 0) {
            context.fillStyle = '#666666';
            context.font = `${22 * rX}px Arial`;
            context.fillText('No active queues', centerX, clipY + 100 * rY);
        } else {
            let currentY = clipY + 20 * rY - this.scrollOffset * rY;

            this.allQueuesSummary.forEach((queue, qIndex) => {
                const colorIndex = qIndex % queueColors.length;
                const boxPadding = 15 * rX;
                const playerLineHeight = 28 * rY;
                const headerHeight = 35 * rY;
                const boxHeight = headerHeight + queue.players.length * playerLineHeight + boxPadding * 2;
                const boxWidth = panelW - 180 * rX;
                const boxX = centerX - boxWidth / 2 - 30 * rX;

                // Skip drawing if completely outside visible area
                if (currentY + boxHeight < clipY - 50 || currentY > clipY + clipH + 50) {
                    currentY += boxHeight + 15 * rY;
                    return;
                }

                // Draw queue box background
                context.beginPath();
                context.roundRect(boxX, currentY, boxWidth, boxHeight, 10 * rX);
                context.fillStyle = queueColors[colorIndex];
                context.fill();
                context.strokeStyle = borderColors[colorIndex];
                context.lineWidth = 2 * rX;
                context.stroke();

                // Time remaining for this queue (live countdown)
                const liveQueueTime = this.getLiveTimeRemaining(queue.timeRemaining);
                const qMinutes = Math.floor(liveQueueTime / 60000);
                const qSeconds = Math.floor((liveQueueTime % 60000) / 1000);
                const qTimeStr = `${qMinutes}m ${qSeconds}s`;

                // Queue header
                context.font = `bold ${18 * rX}px Arial`;
                context.textAlign = 'left';
                context.fillStyle = borderColors[colorIndex];
                context.fillText(`Queue ${qIndex + 1}`, boxX + boxPadding, currentY + 25 * rY);

                // Status on right side
                context.textAlign = 'right';
                context.font = `${16 * rX}px Arial`;
                context.fillStyle = '#aaaaaa';
                context.fillText(`${queue.playerCount}/${this.maxPlayers} | ${queue.playersReady} ready | ${qTimeStr}`, boxX + boxWidth - boxPadding, currentY + 25 * rY);

                // Player entries (sorted by score)
                context.font = `${18 * rX}px Arial`;
                queue.players.forEach((player, pIndex) => {
                    const playerY = currentY + headerHeight + boxPadding + pIndex * playerLineHeight;
                    const isReady = player.attempts >= this.maxAttempts;

                    // Rank number
                    context.textAlign = 'left';
                    context.fillStyle = pIndex === 0 ? '#ffd700' : pIndex === 1 ? '#c0c0c0' : '#888888';
                    context.fillText(`${pIndex + 1}.`, boxX + boxPadding + 5 * rX, playerY);

                    // Player name
                    const playerName = typeof player === 'string' ? player : player.name;
                    const displayName = playerName.length > 14 ? playerName.substring(0, 14) + '..' : playerName;
                    context.fillStyle = isReady ? '#00ff88' : '#ffffff';
                    context.fillText(displayName, boxX + boxPadding + 35 * rX, playerY);

                    // Score
                    context.fillStyle = '#ffaa00';
                    const score = typeof player === 'string' ? '---' : player.score.toLocaleString();
                    context.fillText(score, boxX + boxPadding + 200 * rX, playerY);

                    // Attempts
                    const attempts = typeof player === 'string' ? 0 : player.attempts;
                    context.fillStyle = isReady ? '#00ff88' : '#88ffff';
                    context.fillText(`${attempts}/${this.maxAttempts}`, boxX + boxWidth - boxPadding - 60 * rX, playerY);
                });

                currentY += boxHeight + 15 * rY;
            });
        }

        context.restore();

        // Draw scrollbar if content exceeds view
        const totalContentHeight = this.allQueuesSummary.reduce((h, q) => h + (35 + q.players.length * 28 + 30 + 15), 0);
        const viewHeight = 400;

        if (totalContentHeight > viewHeight && this.maxScrollOffset > 0) {
            const scrollbarX = centerX + 530 * rX;
            const scrollbarY = clipY;
            const scrollbarHeight = clipH;
            const scrollbarWidth = 25 * rX;

            // Draw scrollbar track
            context.beginPath();
            context.roundRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 6 * rX);
            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.fill();
            context.strokeStyle = 'rgba(255, 170, 0, 0.3)';
            context.lineWidth = 1;
            context.stroke();

            // Calculate thumb size and position
            const thumbHeight = Math.max(40 * rY, (viewHeight / totalContentHeight) * scrollbarHeight);
            const thumbY = scrollbarY + (this.scrollOffset / this.maxScrollOffset) * (scrollbarHeight - thumbHeight);

            // Draw scrollbar thumb
            context.beginPath();
            context.roundRect(scrollbarX + 2 * rX, thumbY, scrollbarWidth - 4 * rX, thumbHeight, 4 * rX);

            // Highlight if dragging
            if (this.isDraggingScrollbar) {
                context.fillStyle = '#ffaa00';
                context.shadowColor = '#ffaa00';
                context.shadowBlur = 8 * rX;
            } else {
                context.fillStyle = 'rgba(255, 170, 0, 0.7)';
                context.shadowBlur = 0;
            }
            context.fill();
            context.shadowBlur = 0;
        }
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
        context.fillText(`${this.queueSize} of ${this.maxPlayers} players in queue`, centerX, panelY + 250 * rY);

        if (this.queueSize >= this.maxPlayers) {
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
