import { Button, superFunctions } from "./supers.js";
import { SupabaseLeaderboard } from "../supabase/supabase.js";

export class LeaderboardMenu {
    constructor() {
        this.super = new superFunctions();
        this.supabase = new SupabaseLeaderboard();

        this.isVisible = false;
        this.currentDifficulty = 0;
        this.difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];

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

        this.clicked = false;

        // Navigation buttons - difficulty
        this.prevDiffButton = new Button(830, 220, 100, 70, "<", 50, 30, 50, false, true, 'white', 'white');
        this.nextDiffButton = new Button(1630, 220, 100, 70, ">", 50, 30, 50, false, true, 'white', 'white');

        // Daily/All toggle button
        this.dailyToggleButton = new Button(1180, 280, 200, 50, "All Time", 30, 55, 35, false, true, 'white', 'white');

        // Pagination buttons
        this.prevPageButton = new Button(1050, 930, 100, 60, "<", 40, 30, 45, false, true, 'white', 'white');
        this.nextPageButton = new Button(1410, 930, 100, 60, ">", 40, 30, 45, false, true, 'white', 'white');

        // Bottom buttons
        this.refreshButton = new Button(900, 1010, 280, 70, "Refresh", 40, 60, 50, false, true, 'white', 'white');
        this.backButton = new Button(1380, 1010, 280, 70, "Back", 40, 80, 50, false, true, 'white', 'white');
    }

    async show(initialDifficulty = 0) {
        this.isVisible = true;
        this.currentDifficulty = initialDifficulty;
        this.currentPage = 1;
        await this.loadLeaderboard();
    }

    hide() {
        this.isVisible = false;
    }

    async loadLeaderboard() {
        this.isLoading = true;
        this.loadError = null;
        try {
            const result = await this.supabase.getLeaderboard(
                this.difficulties[this.currentDifficulty],
                this.entriesPerPage,
                this.currentPage,
                this.isDaily
            );
            this.leaderboardData = result.entries || [];
            this.totalPages = result.pagination?.totalPages || 1;
            this.totalEntries = result.pagination?.totalEntries || 0;
        } catch (error) {
            this.loadError = "Failed to load leaderboard";
            console.error('Leaderboard load error:', error);
        }
        this.isLoading = false;
    }

    update(game) {
        if (!this.isVisible) return false;

        const inX = game.input.mouseX;
        const inY = game.input.mouseY;

        // Handle click release
        if (this.clicked && game.input.buttons.indexOf(0) == -1) {
            this.clicked = false;
        }

        // Previous difficulty
        this.prevDiffButton.update(inX, inY);
        if (this.prevDiffButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            this.currentDifficulty = (this.currentDifficulty - 1 + 5) % 5;
            this.currentPage = 1;
            this.loadLeaderboard();
        }

        // Next difficulty
        this.nextDiffButton.update(inX, inY);
        if (this.nextDiffButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            this.currentDifficulty = (this.currentDifficulty + 1) % 5;
            this.currentPage = 1;
            this.loadLeaderboard();
        }

        // Daily toggle
        this.dailyToggleButton.update(inX, inY);
        if (this.dailyToggleButton.isHovered && game.input.buttons.indexOf(0) > -1 && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            this.isDaily = !this.isDaily;
            this.dailyToggleButton.text = this.isDaily ? "Today" : "All Time";
            this.currentPage = 1;
            this.loadLeaderboard();
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
            this.hide();
            return true; // Signal that we closed
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
        const panelH = 1000;

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
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.font = (80 * rX) + "px Arial Black";
        context.fillStyle = '#ffffff';
        context.fillText("LEADERBOARD", 1280 * rX, 180 * rY);
        context.restore();

        // Decorative line under title
        context.save();
        context.strokeStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 10;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(900 * rX, 200 * rY);
        context.lineTo(1660 * rX, 200 * rY);
        context.stroke();
        context.restore();

        // Difficulty selector - centered
        this.prevDiffButton.draw(context);
        const diffText = this.difficulties[this.currentDifficulty];
        const diffOffset = (diffText.length * 28) / 2;
        this.super.drawGlowText(context, 1280 - diffOffset, 275, diffText, 60, '#ff00ff', '#ff00ff', 12);
        this.nextDiffButton.draw(context);

        // Daily toggle button
        this.dailyToggleButton.draw(context);

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

    drawPagination(context, rX, rY) {
        // Previous page button (gray out if on first page)
        if (this.currentPage > 1) {
            this.prevPageButton.draw(context);
        } else {
            // Draw grayed out button
            context.save();
            context.globalAlpha = 0.3;
            this.prevPageButton.draw(context);
            context.restore();
        }

        // Page indicator
        const pageText = `Page ${this.currentPage} of ${this.totalPages}`;
        this.super.drawGlowText(context, 1180, 970, pageText, 32, '#ffffff', '#00ffff', 6);

        // Next page button (gray out if on last page)
        if (this.currentPage < this.totalPages) {
            this.nextPageButton.draw(context);
        } else {
            context.save();
            context.globalAlpha = 0.3;
            this.nextPageButton.draw(context);
            context.restore();
        }

        // Total entries count
        const totalText = `${this.totalEntries} total entries`;
        this.super.drawGlowText(context, 1200, 905, totalText, 24, '#888888', '#666666', 4);
    }

    drawLeaderboardEntries(context, rX, rY) {
        const startY = 380;
        const rowHeight = 52;

        // Column positions - spread across the wider panel
        const colRank = 730;
        const colName = 820;
        const colScore = 1200;
        const colKills = 1450;
        const colStreak = 1680;

        // Header row
        this.super.drawGlowText(context, colRank, startY, "#", 38, '#888888', '#666666', 6);
        this.super.drawGlowText(context, colName, startY, "NAME", 38, '#888888', '#666666', 6);
        this.super.drawGlowText(context, colScore, startY, "SCORE", 38, '#888888', '#666666', 6);
        this.super.drawGlowText(context, colKills, startY, "KILLS", 38, '#888888', '#666666', 6);
        this.super.drawGlowText(context, colStreak, startY, "STREAK", 38, '#888888', '#666666', 6);

        // Separator line
        context.save();
        context.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(710 * rX, (startY + 25) * rY);
        context.lineTo(1850 * rX, (startY + 25) * rY);
        context.stroke();
        context.restore();

        // Data rows
        if (this.leaderboardData.length === 0) {
            const noDataMsg = this.isDaily ? "No scores today!" : "No scores yet!";
            this.super.drawGlowText(context, 1100, 600, noDataMsg, 50, '#888888', '#666666', 10);
            if (!this.isDaily) {
                this.super.drawGlowText(context, 1030, 680, "Be the first to play!", 40, '#666666', '#444444', 6);
            }
            return;
        }

        for (let i = 0; i < this.leaderboardData.length; i++) {
            const entry = this.leaderboardData[i];
            const y = startY + (i + 1) * rowHeight;

            // Calculate actual rank based on page
            const actualRank = (this.currentPage - 1) * this.entriesPerPage + i + 1;

            // Rank coloring (gold/silver/bronze for top 3 overall)
            let rankColor = '#ffffff';
            let glowColor = '#00ffff';
            if (actualRank === 1) { rankColor = '#ffd700'; glowColor = '#ffaa00'; }
            else if (actualRank === 2) { rankColor = '#c0c0c0'; glowColor = '#888888'; }
            else if (actualRank === 3) { rankColor = '#cd7f32'; glowColor = '#aa5500'; }

            // Row background for top 3
            if (actualRank <= 3) {
                context.save();
                context.fillStyle = `rgba(${actualRank === 1 ? '255,215,0' : actualRank === 2 ? '192,192,192' : '205,127,50'}, 0.12)`;
                context.fillRect(710 * rX, (y - 28) * rY, 1140 * rX, 48 * rY);
                context.restore();
            }

            // Rank
            this.super.drawGlowText(context, colRank, y, actualRank.toString(), 34, rankColor, glowColor, 8);

            // Name (truncate to 12 chars)
            const displayName = entry.player_name.length > 12
                ? entry.player_name.substring(0, 12) + '...'
                : entry.player_name;
            this.super.drawGlowText(context, colName, y, displayName, 34, '#ffffff', '#00ffff', 8);

            // Score
            this.super.drawGlowText(context, colScore, y, entry.score.toString(), 34, '#00ff88', '#00ff00', 8);

            // Kills
            this.super.drawGlowText(context, colKills, y, entry.kills.toString(), 34, '#ff8888', '#ff4444', 8);

            // Best Streak
            this.super.drawGlowText(context, colStreak, y, entry.best_streak.toString(), 34, '#ffff88', '#ffff00', 8);
        }
    }
}
