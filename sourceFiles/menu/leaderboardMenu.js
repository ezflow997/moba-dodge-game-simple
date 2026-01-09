import { Button, superFunctions } from "./supers.js";
import { SupabaseLeaderboard } from "../supabase/supabase.js";

export class LeaderboardMenu {
    constructor() {
        this.super = new superFunctions();
        this.supabase = new SupabaseLeaderboard();

        this.isVisible = false;
        this.currentDifficulty = 0;
        this.difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];

        // Ranked-only mode (opened from ranked menu)
        this.rankedOnly = false;

        this.leaderboardData = [];
        this.isLoading = false;
        this.loadError = null;

        // Pagination state
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalEntries = 0;
        this.entriesPerPage = 10;

        // Daily filter state
        this.isDaily = false;

        // Search state
        this.searchQuery = '';
        this.maxSearchLength = 12;
        this.searchActive = false;
        this.cursorBlink = 0;
        this.searchDebounceTimer = null;

        // Search results navigation
        this.searchResults = [];      // Array of {player_name, rank}
        this.currentResultIndex = 0;  // Which result is selected
        this.highlightedPlayer = null; // Player name to highlight

        this.clicked = false;

        // Bind keyboard handler
        this.keyHandler = this.handleKeyPress.bind(this);

        // Navigation buttons - difficulty (row at y=220)
        this.prevDiffButton = new Button(900, 220, 80, 60, "<", 45, 22, 44, false, true, 'white', 'white');
        this.nextDiffButton = new Button(1580, 220, 80, 60, ">", 45, 22, 44, false, true, 'white', 'white');

        // Daily/All toggle button - right side of difficulty row
        this.dailyToggleButton = new Button(1680, 220, 160, 60, "All Time", 26, 30, 42, false, true, 'white', 'white');

        // Search navigation buttons - on search row (y=330)
        this.prevResultButton = new Button(1500, 330, 50, 40, "<", 28, 12, 30, false, true, 'white', 'white');
        this.nextResultButton = new Button(1680, 330, 50, 40, ">", 28, 12, 30, false, true, 'white', 'white');
        this.clearSearchButton = new Button(1740, 330, 50, 40, "X", 28, 12, 30, false, true, 'white', 'white');

        // Pagination buttons
        this.firstPageButton = new Button(940, 960, 80, 60, "<<", 34, 14, 44, false, true, 'white', 'white');
        this.prevPageButton = new Button(1030, 960, 80, 60, "<", 40, 20, 45, false, true, 'white', 'white');
        this.nextPageButton = new Button(1450, 960, 80, 60, ">", 40, 20, 45, false, true, 'white', 'white');
        this.lastPageButton = new Button(1540, 960, 80, 60, ">>", 34, 14, 44, false, true, 'white', 'white');

        // Bottom buttons
        this.refreshButton = new Button(900, 1060, 280, 70, "Refresh", 40, 60, 50, false, true, 'white', 'white');
        this.backButton = new Button(1380, 1060, 280, 70, "Back", 40, 80, 50, false, true, 'white', 'white');
    }

    async show(initialDifficulty = 0) {
        this.isVisible = true;
        this.rankedOnly = false;
        this.currentDifficulty = initialDifficulty;
        this.currentPage = 1;
        this.searchQuery = '';
        this.searchActive = false;
        this.searchResults = [];
        this.currentResultIndex = 0;
        this.highlightedPlayer = null;
        document.addEventListener('keydown', this.keyHandler);
        await this.loadLeaderboard();
    }

    async showRanked() {
        this.isVisible = true;
        this.rankedOnly = true;
        this.currentPage = 1;
        this.searchQuery = '';
        this.searchActive = false;
        this.searchResults = [];
        this.currentResultIndex = 0;
        this.highlightedPlayer = null;
        document.addEventListener('keydown', this.keyHandler);
        await this.loadLeaderboard();
    }

    hide() {
        this.isVisible = false;
        this.rankedOnly = false;
        this.searchActive = false;
        this.highlightedPlayer = null;
        document.removeEventListener('keydown', this.keyHandler);
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = null;
        }
    }

    handleKeyPress(e) {
        // ESC is handled in update() method to properly consume the game input flag
        // This handler is only for search input when search is active
        if (!this.isVisible || !this.searchActive) return;

        // Handle backspace
        if (e.key === 'Backspace') {
            this.searchQuery = this.searchQuery.slice(0, -1);
            this.triggerSearchDebounce();
            e.preventDefault();
            return;
        }

        // Handle enter - go to next result
        if (e.key === 'Enter') {
            if (this.searchResults.length > 0) {
                this.nextSearchResult();
            }
            e.preventDefault();
            return;
        }

        // Handle regular characters
        if (e.key.length === 1 && this.searchQuery.length < this.maxSearchLength) {
            if (/^[a-zA-Z0-9_\-]$/.test(e.key)) {
                this.searchQuery += e.key;
                this.triggerSearchDebounce();
            }
            e.preventDefault();
        }
    }

    triggerSearchDebounce() {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        this.searchDebounceTimer = setTimeout(() => {
            this.performSearch();
            this.searchDebounceTimer = null;
        }, 300);
    }

    async performSearch() {
        if (this.searchQuery.trim().length === 0) {
            this.searchResults = [];
            this.currentResultIndex = 0;
            this.highlightedPlayer = null;
            return;
        }

        try {
            let result;
            if (this.isRankedMode()) {
                // Search ranked players
                result = await this.supabase.searchRankedPlayers(this.searchQuery.trim());
            } else {
                // Search score-based leaderboard
                result = await this.supabase.searchPlayers(
                    this.difficulties[this.currentDifficulty],
                    this.searchQuery.trim(),
                    this.isDaily
                );
            }
            this.searchResults = result.matches || [];
            this.currentResultIndex = 0;

            // If we have results, navigate to the first one
            if (this.searchResults.length > 0) {
                this.goToResult(0);
            } else {
                this.highlightedPlayer = null;
            }
        } catch (error) {
            console.error('[Search] Error:', error);
            this.searchResults = [];
        }
    }

    goToResult(index) {
        if (this.searchResults.length === 0) return;

        this.currentResultIndex = index;
        const result = this.searchResults[index];
        this.highlightedPlayer = result.player_name;

        // Calculate which page this rank is on
        const page = Math.ceil(result.rank / this.entriesPerPage);
        if (page !== this.currentPage) {
            this.currentPage = page;
            this.loadLeaderboard();
        }
    }

    nextSearchResult() {
        if (this.searchResults.length === 0) return;
        const nextIndex = (this.currentResultIndex + 1) % this.searchResults.length;
        this.goToResult(nextIndex);
    }

    prevSearchResult() {
        if (this.searchResults.length === 0) return;
        const prevIndex = (this.currentResultIndex - 1 + this.searchResults.length) % this.searchResults.length;
        this.goToResult(prevIndex);
    }

    isRankedMode() {
        return this.rankedOnly;
    }

    async loadLeaderboard() {
        this.isLoading = true;
        this.loadError = null;
        try {
            console.log('[Leaderboard] Loading...', {
                difficulty: this.difficulties[this.currentDifficulty],
                page: this.currentPage,
                isDaily: this.isDaily
            });

            let result;
            if (this.isRankedMode()) {
                // Fetch ranked ELO leaderboard
                result = await this.supabase.getRankedLeaderboard(
                    this.entriesPerPage,
                    this.currentPage
                );
            } else {
                // Fetch regular score leaderboard
                result = await this.supabase.getLeaderboard(
                    this.difficulties[this.currentDifficulty],
                    this.entriesPerPage,
                    this.currentPage,
                    this.isDaily
                );
            }

            console.log('[Leaderboard] Result:', result);
            this.leaderboardData = result.entries || [];
            this.totalPages = result.pagination?.totalPages || 1;
            this.totalEntries = result.pagination?.totalEntries || 0;
        } catch (error) {
            this.loadError = "Failed to load leaderboard";
            console.error('[Leaderboard] Load error:', error);
        }
        this.isLoading = false;
    }

    update(game) {
        if (!this.isVisible) return false;

        // Handle ESC to close leaderboard (and consume the escape flag)
        if (game.input.escapePressed) {
            const wasRankedOnly = this.rankedOnly;
            this.hide();
            game.input.escapePressed = false;  // Consume the flag so pause menu doesn't open
            return wasRankedOnly ? 'return_to_ranked' : false;
        }

        const inX = game.input.mouseX;
        const inY = game.input.mouseY;

        // Update cursor blink
        this.cursorBlink = (this.cursorBlink + 1) % 60;

        // Handle click release
        if (this.clicked && game.input.buttons.indexOf(0) == -1) {
            this.clicked = false;
        }

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Search field click detection (positioned at 730, 325, width 750, height 45)
        const searchX = 730 * rX;
        const searchY = 325 * rY;
        const searchW = 750 * rX;
        const searchH = 45 * rY;
        const inSearchBox = inX >= searchX && inX <= searchX + searchW && inY >= searchY && inY <= searchY + searchH;

        if (game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            if (inSearchBox) {
                this.searchActive = true;
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
            } else {
                // Clicked outside search box - deactivate it
                this.searchActive = false;
            }
        }

        // Search result navigation buttons
        if (this.searchResults.length > 1) {
            this.prevResultButton.update(inX, inY);
            if (this.prevResultButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.prevSearchResult();
            }

            this.nextResultButton.update(inX, inY);
            if (this.nextResultButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.nextSearchResult();
            }
        }

        // Clear search button
        if (this.searchQuery.length > 0) {
            this.clearSearchButton.update(inX, inY);
            if (this.clearSearchButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.searchQuery = '';
                this.searchResults = [];
                this.currentResultIndex = 0;
                this.highlightedPlayer = null;
            }
        }

        // Difficulty navigation - only for non-ranked modes
        if (!this.isRankedMode()) {
            // Previous difficulty
            this.prevDiffButton.update(inX, inY);
            if (this.prevDiffButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.currentDifficulty = (this.currentDifficulty - 1 + this.difficulties.length) % this.difficulties.length;
                this.currentPage = 1;
                this.searchResults = [];
                this.highlightedPlayer = null;
                this.loadLeaderboard();
                if (this.searchQuery.length > 0) this.performSearch();
            }

            // Next difficulty
            this.nextDiffButton.update(inX, inY);
            if (this.nextDiffButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.currentDifficulty = (this.currentDifficulty + 1) % this.difficulties.length;
                this.currentPage = 1;
                this.searchResults = [];
                this.highlightedPlayer = null;
                this.loadLeaderboard();
                if (this.searchQuery.length > 0) this.performSearch();
            }

            // Daily toggle
            this.dailyToggleButton.update(inX, inY);
            if (this.dailyToggleButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.isDaily = !this.isDaily;
                this.dailyToggleButton.text = this.isDaily ? "Today" : "All Time";
                this.currentPage = 1;
                this.searchResults = [];
                this.highlightedPlayer = null;
                this.loadLeaderboard();
                if (this.searchQuery.length > 0) this.performSearch();
            }
        }

        // First page
        this.firstPageButton.update(inX, inY);
        if (this.firstPageButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (this.currentPage > 1) {
                if (window.gameSound) window.gameSound.playMenuClick();
                this.currentPage = 1;
                this.loadLeaderboard();
            }
        }

        // Previous page
        this.prevPageButton.update(inX, inY);
        if (this.prevPageButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (this.currentPage > 1) {
                if (window.gameSound) window.gameSound.playMenuClick();
                this.currentPage--;
                this.loadLeaderboard();
            }
        }

        // Next page
        this.nextPageButton.update(inX, inY);
        if (this.nextPageButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (this.currentPage < this.totalPages) {
                if (window.gameSound) window.gameSound.playMenuClick();
                this.currentPage++;
                this.loadLeaderboard();
            }
        }

        // Last page
        this.lastPageButton.update(inX, inY);
        if (this.lastPageButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (this.currentPage < this.totalPages) {
                if (window.gameSound) window.gameSound.playMenuClick();
                this.currentPage = this.totalPages;
                this.loadLeaderboard();
            }
        }

        // Refresh button
        this.refreshButton.update(inX, inY);
        if (this.refreshButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            this.loadLeaderboard();
        }

        // Back button
        this.backButton.update(inX, inY);
        if (this.backButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            const wasRankedOnly = this.rankedOnly;
            this.hide();
            return wasRankedOnly ? 'return_to_ranked' : true; // Signal to return to ranked panel if opened from there
        }

        return false;
    }

    draw(context, game) {
        if (!this.isVisible) return;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Semi-transparent overlay
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.9)';
        context.fillRect(0, 0, game.width, game.height);
        context.restore();

        // Main panel - bigger and centered
        const panelX = 680;
        const panelY = 100;
        const panelW = 1200;
        const panelH = 1080;

        context.save();
        context.fillStyle = 'rgba(10, 20, 40, 0.95)';
        context.fillRect(panelX * rX, panelY * rY, panelW * rX, panelH * rY);
        context.strokeStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 4 * rY;
        context.strokeRect(panelX * rX, panelY * rY, panelW * rX, panelH * rY);
        context.restore();

        // Title - properly centered using textAlign
        context.save();
        context.textAlign = 'center';
        const titleColor = this.isRankedMode() ? '#ffaa00' : '#00ffff';
        context.shadowColor = titleColor;
        context.shadowBlur = 20 * rX;
        context.font = (80 * rX) + "px Arial Black";
        context.fillStyle = '#ffffff';
        const titleText = this.isRankedMode() ? "RANKED" : "LEADERBOARD";
        context.fillText(titleText, 1280 * rX, 180 * rY);
        context.restore();

        // Decorative line under title
        context.save();
        context.strokeStyle = titleColor;
        context.shadowColor = titleColor;
        context.shadowBlur = 10;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(900 * rX, 200 * rY);
        context.lineTo(1660 * rX, 200 * rY);
        context.stroke();
        context.restore();

        // Difficulty selector - only for non-ranked mode
        if (!this.isRankedMode()) {
            this.prevDiffButton.draw(context);
            const diffText = this.difficulties[this.currentDifficulty];
            const diffOffset = (diffText.length * 28) / 2;
            this.super.drawGlowText(context, 1280 - diffOffset, 275, diffText, 60, '#ff00ff', '#ff00ff', 12);
            this.nextDiffButton.draw(context);

            // Daily toggle button
            this.dailyToggleButton.draw(context);
        } else {
            // Show "ELO Rankings" subtitle for ranked mode
            this.super.drawGlowText(context, 1160, 275, "ELO Rankings", 50, '#ffaa00', '#ffaa00', 12);
        }

        // Search input field
        this.drawSearchField(context, rX, rY);

        // Loading/error state
        if (this.isLoading) {
            this.super.drawGlowText(context, 1150, 600, "Loading...", 50, '#ffff00', '#ffaa00', 10);
        } else if (this.loadError) {
            this.super.drawGlowText(context, 1050, 600, this.loadError, 45, '#ff4444', '#ff0000', 10);
        } else {
            // Draw leaderboard entries
            this.drawLeaderboardEntries(context, rX, rY);
        }

        // Pagination controls
        this.drawPagination(context, rX, rY);

        // Bottom buttons - side by side
        this.refreshButton.draw(context);
        this.backButton.draw(context);
    }

    drawSearchField(context, rX, rY) {
        const x = 730;
        const y = 325;
        const width = 750;
        const height = 45;

        // Label
        this.super.drawGlowText(context, 730, 315, "Find Player:", 22, '#888888', '#666666', 4);

        // Input field background
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(x * rX, y * rY, width * rX, height * rY);
        context.strokeStyle = this.searchActive ? '#00ffff' : '#444444';
        context.shadowColor = this.searchActive ? '#00ffff' : '#444444';
        context.shadowBlur = this.searchActive ? 8 * rX : 3 * rX;
        context.lineWidth = 2 * rY;
        context.strokeRect(x * rX, y * rY, width * rX, height * rY);
        context.restore();

        // Display text or placeholder
        const showCursor = this.searchActive && this.cursorBlink < 30;
        if (this.searchQuery.length > 0) {
            const displayText = this.searchQuery + (showCursor ? '|' : '');
            this.super.drawGlowText(context, x + 15, y + 33, displayText, 26, '#00ff88', '#00ff00', 6);
        } else {
            const placeholder = showCursor ? '|' : 'Type name to search...';
            const color = this.searchActive ? '#00ff88' : '#555555';
            this.super.drawGlowText(context, x + 15, y + 33, placeholder, 22, color, color, 3);
        }

        // Show search results info and navigation
        if (this.searchQuery.length > 0) {
            if (this.searchResults.length > 0) {
                // Show "X of Y" results
                const resultText = `${this.currentResultIndex + 1} of ${this.searchResults.length}`;
                this.super.drawGlowText(context, 1560, y + 33, resultText, 22, '#00ffff', '#00ffff', 4);

                // Draw navigation buttons if more than 1 result
                if (this.searchResults.length > 1) {
                    this.prevResultButton.draw(context);
                    this.nextResultButton.draw(context);
                }
            } else {
                // No results found
                this.super.drawGlowText(context, 1560, y + 33, "No matches", 22, '#ff6666', '#ff4444', 4);
            }

            // Clear button
            this.clearSearchButton.draw(context);
        }
    }

    drawPagination(context, rX, rY) {
        // First page button (gray out if on first page)
        if (this.currentPage > 1) {
            this.firstPageButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.firstPageButton.draw(context);
            context.restore();
        }

        // Previous page button (gray out if on first page)
        if (this.currentPage > 1) {
            this.prevPageButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.prevPageButton.draw(context);
            context.restore();
        }

        // Total entries count (above pagination buttons)
        const totalLabel = this.isRankedMode() ? 'players' : 'entries';
        const totalText = `${this.totalEntries} total ${totalLabel}`;
        this.super.drawGlowText(context, 1240, 955, totalText, 24, '#888888', '#666666', 4);

        // Page indicator
        const pageText = `Page ${this.currentPage} of ${this.totalPages}`;
        this.super.drawGlowText(context, 1200, 1010, pageText, 32, '#ffffff', '#00ffff', 6);

        // Next page button (gray out if on last page)
        if (this.currentPage < this.totalPages) {
            this.nextPageButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.nextPageButton.draw(context);
            context.restore();
        }

        // Last page button (gray out if on last page)
        if (this.currentPage < this.totalPages) {
            this.lastPageButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.lastPageButton.draw(context);
            context.restore();
        }
    }

    drawLeaderboardEntries(context, rX, rY) {
        const startY = 420;
        const rowHeight = 50;
        const isRanked = this.isRankedMode();

        // Column positions - spread across the wider panel
        const colRank = 730;
        const colName = 820;
        const colScore = 1200;  // ELO for ranked
        const colKills = 1450;  // Games for ranked
        const colStreak = 1680; // Not used for ranked

        // Header row
        this.super.drawGlowText(context, colRank, startY, "#", 38, '#888888', '#666666', 6);
        this.super.drawGlowText(context, colName, startY, "NAME", 38, '#888888', '#666666', 6);
        if (isRanked) {
            this.super.drawGlowText(context, colScore, startY, "ELO", 38, '#888888', '#666666', 6);
            this.super.drawGlowText(context, colKills, startY, "GAMES", 38, '#888888', '#666666', 6);
        } else {
            this.super.drawGlowText(context, colScore, startY, "SCORE", 38, '#888888', '#666666', 6);
            this.super.drawGlowText(context, colKills, startY, "KILLS", 38, '#888888', '#666666', 6);
            this.super.drawGlowText(context, colStreak, startY, "STREAK", 38, '#888888', '#666666', 6);
        }

        // Separator line
        context.save();
        context.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(710 * rX, (startY + 18) * rY);
        context.lineTo(1850 * rX, (startY + 18) * rY);
        context.stroke();
        context.restore();

        // Data rows
        if (this.leaderboardData.length === 0) {
            let noDataMsg, subMsg;
            if (isRanked) {
                noDataMsg = "No ranked players yet!";
                subMsg = "Play ranked to get on the leaderboard!";
            } else if (this.isDaily) {
                noDataMsg = "No scores today!";
                subMsg = null;
            } else {
                noDataMsg = "No scores yet!";
                subMsg = "Be the first to play!";
            }
            this.super.drawGlowText(context, 1100, 600, noDataMsg, 50, '#888888', '#666666', 10);
            if (subMsg) {
                this.super.drawGlowText(context, 1030, 680, subMsg, 40, '#666666', '#444444', 6);
            }
            return;
        }

        for (let i = 0; i < this.leaderboardData.length; i++) {
            const entry = this.leaderboardData[i];
            const y = startY + (i + 1) * rowHeight;

            // Calculate actual rank based on page
            const actualRank = (this.currentPage - 1) * this.entriesPerPage + i + 1;

            // Check if this entry is highlighted from search
            const isHighlighted = this.highlightedPlayer &&
                entry.player_name.toLowerCase() === this.highlightedPlayer.toLowerCase();

            // Rank coloring (gold/silver/bronze for top 3 overall)
            let rankColor = '#ffffff';
            let glowColor = '#00ffff';
            if (actualRank === 1) { rankColor = '#ffd700'; glowColor = '#ffaa00'; }
            else if (actualRank === 2) { rankColor = '#c0c0c0'; glowColor = '#888888'; }
            else if (actualRank === 3) { rankColor = '#cd7f32'; glowColor = '#aa5500'; }

            // Row background - highlighted search result or top 3
            if (isHighlighted && actualRank <= 3) {
                // Searched player who is also top 3 - show medal color with bright border
                context.save();
                context.fillStyle = `rgba(${actualRank === 1 ? '255,215,0' : actualRank === 2 ? '192,192,192' : '205,127,50'}, 0.3)`;
                context.fillRect(710 * rX, (y - 32) * rY, 1140 * rX, 48 * rY);
                context.strokeStyle = '#00ff00';
                context.shadowColor = '#00ff00';
                context.shadowBlur = 10;
                context.lineWidth = 3;
                context.strokeRect(710 * rX, (y - 32) * rY, 1140 * rX, 48 * rY);
                context.restore();
            } else if (isHighlighted) {
                // Highlighted search result - bright cyan background
                context.save();
                context.fillStyle = 'rgba(0, 255, 255, 0.25)';
                context.fillRect(710 * rX, (y - 32) * rY, 1140 * rX, 48 * rY);
                context.strokeStyle = '#00ffff';
                context.lineWidth = 2;
                context.strokeRect(710 * rX, (y - 32) * rY, 1140 * rX, 48 * rY);
                context.restore();
            } else if (actualRank <= 3) {
                context.save();
                context.fillStyle = `rgba(${actualRank === 1 ? '255,215,0' : actualRank === 2 ? '192,192,192' : '205,127,50'}, 0.12)`;
                context.fillRect(710 * rX, (y - 32) * rY, 1140 * rX, 48 * rY);
                context.restore();
            }

            // Rank
            this.super.drawGlowText(context, colRank, y, actualRank.toString(), 34, rankColor, glowColor, 8);

            // Name (truncate to 12 chars) - brighter if highlighted
            const playerName = entry.player_name || entry.playerName || 'Unknown';
            const displayName = playerName.length > 12
                ? playerName.substring(0, 12) + '...'
                : playerName;
            const nameColor = isHighlighted ? '#00ffff' : '#ffffff';
            const nameGlow = isHighlighted ? '#00ffff' : '#00ffff';
            const nameGlowSize = isHighlighted ? 15 : 8;
            this.super.drawGlowText(context, colName, y, displayName, 34, nameColor, nameGlow, nameGlowSize);

            if (isRanked) {
                // ELO
                const elo = entry.elo || 1000;
                const eloColor = elo >= 1000 ? '#00ff88' : '#ff8888';
                const eloGlow = elo >= 1000 ? '#00ff00' : '#ff4444';
                this.super.drawGlowText(context, colScore, y, elo.toString(), 34, eloColor, eloGlow, 8);

                // Games played
                const games = entry.games_played || entry.gamesPlayed || 0;
                this.super.drawGlowText(context, colKills, y, games.toString(), 34, '#88ffff', '#00ffff', 8);
            } else {
                // Score
                this.super.drawGlowText(context, colScore, y, entry.score.toString(), 34, '#00ff88', '#00ff00', 8);

                // Kills
                this.super.drawGlowText(context, colKills, y, entry.kills.toString(), 34, '#ff8888', '#ff4444', 8);

                // Best Streak
                this.super.drawGlowText(context, colStreak, y, entry.best_streak.toString(), 34, '#ffff88', '#ffff00', 8);
            }
        }
    }
}
