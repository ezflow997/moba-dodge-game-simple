
import { Button } from "./supers.js";
import { superFunctions } from "./supers.js";
import { MenuEffects } from "../effects/menuEffects.js";

export class Menu{
    constructor(){
        this.clicked = false;
        this.super = new superFunctions();
        this.menuEffects = new MenuEffects();

        this.mainMenuShow = false;

        // Cleaner button layout with proper spacing
        const btnX = 80;
        const btnW = 340;
        const btnH = 70;
        const btnSpacing = 90;

        // Help button at top
        this.showHelp = false;
        this.helpButton = new Button(btnX, 80, btnW, btnH, "How to Play", 32, 0, 0, false, true, 'white', 'white');

        this.challengeButton = new Button(btnX, 80 + btnSpacing, btnW, btnH, "Skill Mode: NORMAL", 28, 0, 0, false, true, 'white', 'white');
        this.difficultyButton = new Button(btnX, 80 + btnSpacing * 2, btnW, btnH, "Difficulty: EASY", 28, 0, 0, false, true, 'white', 'white');
        this.startButton = new Button(btnX, 80 + btnSpacing * 3, btnW, btnH, "New Game", 32, 0, 0, false, true, 'white', 'white');
        this.rankedButton = new Button(btnX, 80 + btnSpacing * 4, btnW, btnH, "Ranked", 32, 0, 0, false, true, 'white', 'white');
        this.shopButton = new Button(btnX, 80 + btnSpacing * 5, btnW, btnH, "Shop", 32, 0, 0, false, true, 'white', 'white');
        this.leaderboardButton = new Button(btnX, 80 + btnSpacing * 6, btnW, btnH, "Leaderboard", 32, 0, 0, false, true, 'white', 'white');
        this.loginButton = new Button(btnX, 80 + btnSpacing * 7, btnW, btnH, "Login", 32, 0, 0, false, true, 'white', 'white');
        this.logoutButton = new Button(btnX + btnW + 20, 80 + btnSpacing * 7, 120, 50, "Logout", 24, 0, 0, false, true, 'white', 'white');
        this.accountButton = new Button(btnX, 80 + btnSpacing * 8, btnW, btnH, "Account", 32, 0, 0, false, true, 'white', 'white');

        // Shop points cache
        this.shopPoints = 0;

        // Player leaderboard data cache
        this.playerLeaderboardData = null;
        this.lastFetchedDifficulty = null;
        this.fetchingScores = false;
        this.initialFetchDone = false;
    }

    /**
     * Fetch player's leaderboard scores from the API
     * Only called on: login, opening leaderboard, after score submit, difficulty change
     */
    async fetchPlayerScores(game) {
        if (!game.playerName || this.fetchingScores) return;

        const difficulty = game.difficulties[game.difficulty_level];
        this.fetchingScores = true;

        try {
            // Fetch all-time score
            const allTimeResult = await game.supabase.searchPlayers(difficulty, game.playerName, false);

            // Fetch daily score
            const dailyResult = await game.supabase.searchPlayers(difficulty, game.playerName, true);

            // Find exact match for player name
            const allTimeMatch = allTimeResult.matches?.find(m =>
                m.player_name.toLowerCase() === game.playerName.toLowerCase()
            );
            const dailyMatch = dailyResult.matches?.find(m =>
                m.player_name.toLowerCase() === game.playerName.toLowerCase()
            );

            this.playerLeaderboardData = {
                allTime: allTimeMatch || null,
                daily: dailyMatch || null
            };

            this.lastFetchedDifficulty = difficulty;
        } catch (error) {
            console.error('Failed to fetch player scores:', error);
            this.playerLeaderboardData = null;
        }

        this.fetchingScores = false;
    }

    /**
     * Force refresh of player scores (called externally after score submit)
     */
    forceRefreshScores() {
        this.lastFetchedDifficulty = null;
    }

    updateMain(game){
        var inX = game.input.mouseX;
        var inY = game.input.mouseY;

        // Clear cached data when logged out
        if (!game.playerName) {
            this.playerLeaderboardData = null;
            this.initialFetchDone = false;
        } else if (!this.initialFetchDone) {
            // Initial fetch for users logged in from localStorage
            this.initialFetchDone = true;
            this.fetchPlayerScores(game);
        }

        if(this.clicked == true && game.input.buttons.indexOf(0) == -1){
            this.clicked = false;
        }

        this.challengeButton.update(inX, inY);
        if(this.challengeButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            if(game.challenge_level < game.challenges.length - 1){
                game.challenge_level++;
            }
            else{
                game.challenge_level = 0;
            }
        }

        this.difficultyButton.update(inX, inY);
        if(this.difficultyButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            if(game.difficulty_level < game.difficulties.length - 1){
                game.difficulty_level++;
            }
            else{
                game.difficulty_level = 0;
            }
            // Refresh scores for new difficulty
            if (game.playerName) {
                this.fetchPlayerScores(game);
            }
        }

        this.startButton.update(inX, inY);
        if(this.startButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
            this.clicked = true;
            if (window.gameSound) {
                window.gameSound.init();
                window.gameSound.resume();
                window.gameSound.playMenuClick();
            }

            // If player is logged in, show loadout menu to select starter rewards
            if (game.playerName && game.playerPassword) {
                // Fetch shop inventory and show loadout menu
                game.supabase.getShopData(game.playerName).then(data => {
                    game.loadoutMenu.setInventory(data.inventory || {});
                    game.loadoutMenu.show(game.playerName);
                });
            } else {
                // Not logged in - start game directly
                game.gameOver = false;
                this.mainMenuShow = false;
                // Reset dev mode session tracking for new game
                if (game.devMode) {
                    game.devMode.resetSession();
                }
            }
        }

        // Ranked button - only active when logged in and menus are not visible
        if(game.playerName && !game.leaderboardMenu.isVisible && !game.rankedMenu.isVisible && !game.shopMenu.isVisible) {
            this.rankedButton.update(inX, inY);
            if(this.rankedButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Fetch ranked status and show ranked menu
                game.supabase.getRankedStatus(game.playerName).then(status => {
                    game.rankedMenu.setQueueStatus(status);
                    game.rankedMenu.show('confirm');
                });
            }
        }

        // Shop button - only active when logged in and menus are not visible
        if(game.playerName && !game.leaderboardMenu.isVisible && !game.rankedMenu.isVisible && !game.shopMenu.isVisible) {
            this.shopButton.update(inX, inY);
            if(this.shopButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Fetch shop data and show shop menu
                game.supabase.getShopData(game.playerName).then(data => {
                    game.shopMenu.setShopData(data);
                    this.shopPoints = data.points || 0;
                    game.shopMenu.show();
                });
            }

        }

        // Leaderboard button - only active when logged in and menus are not visible
        if(game.playerName && !game.leaderboardMenu.isVisible && !game.rankedMenu.isVisible && !game.shopMenu.isVisible) {
            this.leaderboardButton.update(inX, inY);
            if(this.leaderboardButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                game.leaderboardMenu.show(game.difficulty_level, game);
                // Refresh player scores when opening leaderboard
                this.forceRefreshScores();
                this.fetchPlayerScores(game);
            }
        }

        // Login button - only show when not logged in
        if(!game.playerName && !game.leaderboardMenu.isVisible && !game.awaitingNameInput) {
            this.loginButton.update(inX, inY);
            if(this.loginButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Show login/register menu
                // Allow registration if no account created this session OR dev mode is enabled
                const devModeEnabled = game.devMode && game.devMode.isEnabled();
                const allowRegistration = !game.sessionAccountCreated || devModeEnabled;
                console.log('[LOGIN] sessionAccountCreated:', game.sessionAccountCreated, 'devMode:', devModeEnabled, 'allowRegistration:', allowRegistration);
                game.awaitingNameInput = true;
                game.nameInputMenu.show((result) => {
                    if (result) {
                        console.log('[LOGIN] Result:', result.name, 'isNewPlayer:', result.isNewPlayer, 'hasSecurityQuestion:', result.hasSecurityQuestion);
                        game.playerName = result.name;
                        game.playerPassword = result.password;
                        // Track if a new account was created this session
                        if (result.isNewPlayer) {
                            game.sessionAccountCreated = true;
                            sessionStorage.setItem('sessionAccountCreated', 'true');
                            console.log('[LOGIN] Set sessionAccountCreated = true');
                            // Store security question/answer for first score submission
                            game.pendingSecurityQuestion = result.securityQuestion;
                            game.pendingSecurityAnswer = result.securityAnswer;
                            // New players just set their security question
                            game.hasSecurityQuestion = true;
                        } else {
                            // Existing player - use the value from check
                            game.hasSecurityQuestion = result.hasSecurityQuestion !== false;
                        }
                        localStorage.setItem('playerName', result.name);
                        localStorage.setItem('playerPassword', result.password);
                        // Fetch player's leaderboard scores on login
                        this.fetchPlayerScores(game);
                        // Immediately ping presence to register online status and update count
                        console.log('[LOGIN] Calling pingPresence for:', game.playerName);
                        game.pingPresence();
                    }
                    game.awaitingNameInput = false;
                }, allowRegistration);
            }
        }

        // Logout button - only show when logged in
        if(game.playerName && !game.leaderboardMenu.isVisible && !game.accountMenu.isVisible) {
            this.logoutButton.update(inX, inY);
            if(this.logoutButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Clear stored credentials
                game.playerName = '';
                game.playerPassword = '';
                game.hasSecurityQuestion = true; // Reset to default
                localStorage.removeItem('playerName');
                localStorage.removeItem('playerPassword');
            }
        }

        // Account button - only show when logged in
        if(game.playerName && !game.leaderboardMenu.isVisible && !game.accountMenu.isVisible && !game.rankedMenu.isVisible) {
            this.accountButton.update(inX, inY);
            if(this.accountButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                game.accountMenu.show(true, game.playerName, game.hasSecurityQuestion);
            }
        }

        // Help button
        if(!game.leaderboardMenu.isVisible) {
            this.helpButton.update(inX, inY);
            if(this.helpButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showHelp = !this.showHelp;
            }
        }
    }
    drawMain(context, game){
        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Draw animated background and floating particles
        this.menuEffects.update(game.width, game.height);
        this.menuEffects.drawAnimatedBackground(context, game.width, game.height);
        this.menuEffects.drawFloatingParticles(context);

        // Draw game title centered at top (single line)
        const titleX = game.width / 2 / rX;  // Center of screen
        this.menuEffects.drawTitleCentered(context, "BULLET RUSH", titleX, 100, 60);

        // Draw online player count below title
        if (game.onlineCount > 0) {
            context.save();
            context.font = `bold ${28 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = '#88ff88';
            context.shadowColor = '#00ff00';
            context.shadowBlur = 10 * rX;
            context.fillText(`${game.onlineCount} player${game.onlineCount !== 1 ? 's' : ''} online`, titleX * rX, 150 * rY);
            context.restore();
        }

        // Update button text with current values
        this.challengeButton.text = "Mode: " + game.challenges[game.challenge_level];
        this.difficultyButton.text = "Difficulty: " + game.difficulties[game.difficulty_level];

        // Draw buttons
        this.challengeButton.draw(context);
        this.difficultyButton.draw(context);
        this.startButton.draw(context);

        // Draw ranked, shop, and leaderboard buttons (only if logged in)
        if (game.playerName) {
            this.rankedButton.draw(context);
            this.shopButton.draw(context);
            this.leaderboardButton.draw(context);
        }

        // Show login button or player name based on login state
        if(game.playerName) {
            this.super.drawGlowText(context, 80, 745, "Playing as: " + game.playerName, 26, '#00ff88', '#00ff00', 5);
            this.logoutButton.draw(context);
        } else {
            this.loginButton.draw(context);
        }

        // Draw Account button (only when logged in)
        if (game.playerName) {
            this.accountButton.draw(context);
        }

        // Draw Help button
        this.helpButton.draw(context);

        // Draw help panel on the right side if toggled
        if (this.showHelp) {
            this.drawHelpPanel(context, rX, rY);
        }

        // Display player scores panel in center
        this.drawScoresPanel(context, game, titleX, rX, rY);

        // Draw ESC hint at bottom of screen
        this.super.drawGlowText(context, 80, 1400, "Press ESC for Settings", 22, '#666666', '#444444', 3);
    }

    /**
     * Draw the help/controls panel on the right side
     */
    drawHelpPanel(context, rX, rY) {
        const panelX = 1750;
        const panelY = 50;
        const panelW = 720;
        const panelH = 1340;

        context.save();

        // Panel background
        context.fillStyle = 'rgba(0, 20, 40, 0.95)';
        context.strokeStyle = '#00ffff';
        context.lineWidth = 3 * rX;
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;

        this.drawRoundedRect(context, panelX * rX, panelY * rY, panelW * rX, panelH * rY, 15 * rX);
        context.fill();
        context.stroke();
        context.shadowBlur = 0;

        // Title
        context.fillStyle = '#00ffff';
        context.font = `bold ${36 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillText('HOW TO PLAY', (panelX + panelW / 2) * rX, (panelY + 45) * rY);

        // Divider
        context.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        context.lineWidth = 2 * rX;
        context.beginPath();
        context.moveTo((panelX + 30) * rX, (panelY + 65) * rY);
        context.lineTo((panelX + panelW - 30) * rX, (panelY + 65) * rY);
        context.stroke();

        const leftX = (panelX + 40) * rX;
        let y = (panelY + 95) * rY;
        const lineH = 32 * rY;
        const lineHSmall = 26 * rY;
        const sectionGap = 38 * rY;

        // Objective section
        context.fillStyle = '#ffaa00';
        context.font = `bold ${22 * rX}px Arial`;
        context.textAlign = 'left';
        context.fillText('OBJECTIVE', leftX, y);
        y += lineH;

        context.fillStyle = '#cccccc';
        context.font = `${17 * rX}px Arial`;
        context.fillText('Survive as long as possible!', leftX, y);
        y += lineHSmall;
        context.fillText('Dodge enemies and projectiles.', leftX, y);
        y += lineHSmall;
        context.fillText('Shoot enemies to gain points.', leftX, y);
        y += sectionGap;

        // Controls section - Mouse
        context.fillStyle = '#00ff88';
        context.font = `bold ${22 * rX}px Arial`;
        context.fillText('MOUSE CONTROLS', leftX, y);
        y += lineH;

        context.fillStyle = '#cccccc';
        context.font = `${17 * rX}px Arial`;
        context.fillText('Right Click - Move to position', leftX, y);
        y += lineHSmall;
        context.fillText('Q - Shoot', leftX, y);
        y += lineHSmall;
        context.fillText('E - Dash (short invincibility)', leftX, y);
        y += lineHSmall;
        context.fillText('F - Ultimate (long dash)', leftX, y);
        y += lineHSmall;
        context.fillText('G - Stop moving', leftX, y);
        y += sectionGap;

        // Controls section - WASD
        context.fillStyle = '#ff8800';
        context.font = `bold ${22 * rX}px Arial`;
        context.fillText('WASD CONTROLS', leftX, y);
        y += lineH;

        context.fillStyle = '#cccccc';
        context.font = `${17 * rX}px Arial`;
        context.fillText('WASD - Move directly', leftX, y);
        y += lineHSmall;
        context.fillText('Left Click - Shoot', leftX, y);
        y += lineHSmall;
        context.fillText('E - Dash toward mouse', leftX, y);
        y += lineHSmall;
        context.fillText('Q - Ultimate toward mouse', leftX, y);
        y += sectionGap;

        // Shop section
        context.fillStyle = '#ffdd00';
        context.font = `bold ${22 * rX}px Arial`;
        context.fillText('SHOP', leftX, y);
        y += lineH;

        context.fillStyle = '#cccccc';
        context.font = `${17 * rX}px Arial`;
        context.fillText('Earn points by completing games.', leftX, y);
        y += lineHSmall;
        context.fillText('Higher difficulty = more points.', leftX, y);
        y += lineHSmall;
        context.fillText('Buy single-use or permanent items.', leftX, y);
        y += lineHSmall;
        context.fillText('Permanent unlocks have unlimited uses.', leftX, y);
        y += sectionGap;

        // Loadout section
        context.fillStyle = '#00ddff';
        context.font = `bold ${22 * rX}px Arial`;
        context.fillText('LOADOUT', leftX, y);
        y += lineH;

        context.fillStyle = '#cccccc';
        context.font = `${17 * rX}px Arial`;
        context.fillText('Select owned items before starting.', leftX, y);
        y += lineHSmall;
        context.fillText('Start with weapons, shields, bonuses.', leftX, y);
        y += lineHSmall;
        context.fillText('Only one gun can be equipped.', leftX, y);
        y += lineHSmall;
        context.fillText('Only available in non-ranked games.', leftX, y);
        y += sectionGap;

        // Ranked section
        context.fillStyle = '#ff5555';
        context.font = `bold ${22 * rX}px Arial`;
        context.fillText('RANKED MODE', leftX, y);
        y += lineH;

        context.fillStyle = '#cccccc';
        context.font = `${17 * rX}px Arial`;
        context.fillText('Competitive mode - fixed HARD difficulty.', leftX, y);
        y += lineHSmall;
        context.fillText('No loadouts allowed - pure skill only.', leftX, y);
        y += lineHSmall;
        context.fillText('Compete for the highest score.', leftX, y);
        y += lineHSmall;
        context.fillText('Ranked games do not award shop points.', leftX, y);
        y += sectionGap;

        // Tips section
        context.fillStyle = '#ff44ff';
        context.font = `bold ${22 * rX}px Arial`;
        context.fillText('TIPS', leftX, y);
        y += lineH;

        context.fillStyle = '#cccccc';
        context.font = `${17 * rX}px Arial`;
        context.fillText('Dashing costs points but saves lives!', leftX, y);
        y += lineHSmall;
        context.fillText('Kill streaks give bonus points.', leftX, y);
        y += lineHSmall;
        context.fillText('Collect powerups from boss drops.', leftX, y);
        y += lineHSmall;
        context.fillText('TAB switches weapon slots.', leftX, y);
        y += lineHSmall;
        context.fillText('ESC opens settings menu.', leftX, y);

        context.restore();
    }

    /**
     * Draw a centered scores panel showing leaderboard scores (if logged in) or session scores
     */
    drawScoresPanel(context, game, centerX, rX, rY) {
        const difficulty = game.difficulties[game.difficulty_level];
        const panelX = centerX - 400;  // 2x wider
        const panelY = 220;
        const panelW = 800;  // 2x wider
        const lineHeight = 84;  // 2x taller

        // Check if we have leaderboard data (logged in)
        const hasLeaderboardData = game.playerName && this.playerLeaderboardData;
        const allTime = hasLeaderboardData ? this.playerLeaderboardData.allTime : null;
        const daily = hasLeaderboardData ? this.playerLeaderboardData.daily : null;

        // Fallback to session scores
        const highScore = game.player_data.high_score[game.difficulty_level];
        const lastScore = game.player_data.last_score[game.difficulty_level];

        // Determine what to show
        const hasAllTime = allTime && allTime.score > 0;
        const hasDaily = daily && daily.score > 0;
        const hasSessionScores = highScore.value > 0 || lastScore.value > 0;

        // Only show if there's something to display
        if (!hasAllTime && !hasDaily && !hasSessionScores) return;

        context.save();

        // Calculate panel height based on content (2x scale)
        let panelH = 120; // Base height for title (2x)
        if (hasAllTime) panelH += 160;
        if (hasDaily) panelH += 160;
        if (!hasLeaderboardData && hasSessionScores) panelH += 240;

        // Panel background
        context.fillStyle = 'rgba(0, 20, 40, 0.85)';
        context.strokeStyle = game.playerName ? '#00ff88' : '#00ffff';
        context.lineWidth = 4 * rX;  // 2x
        context.shadowColor = game.playerName ? '#00ff88' : '#00ffff';
        context.shadowBlur = 30 * rX;  // 2x

        this.drawRoundedRect(context, panelX * rX, panelY * rY, panelW * rX, panelH * rY, 20 * rX);  // 2x corner radius
        context.fill();
        context.stroke();
        context.shadowBlur = 0;

        // Title
        context.fillStyle = game.playerName ? '#00ff88' : '#00ffff';
        context.font = `bold ${44 * rX}px Arial`;  // 2x
        context.textAlign = 'center';
        const title = game.playerName ? `${game.playerName}'s ${difficulty} SCORES` : `${difficulty} SCORES`;
        context.fillText(title, centerX * rX, (panelY + 64) * rY);  // 2x

        // Divider line
        context.strokeStyle = game.playerName ? 'rgba(0, 255, 136, 0.3)' : 'rgba(0, 255, 255, 0.3)';
        context.lineWidth = 2 * rX;  // 2x
        context.beginPath();
        context.moveTo((panelX + 40) * rX, (panelY + 96) * rY);  // 2x
        context.lineTo((panelX + panelW - 40) * rX, (panelY + 96) * rY);  // 2x
        context.stroke();

        let yOffset = panelY + 156;  // 2x

        // If logged in and has leaderboard data, show that
        if (hasLeaderboardData) {
            // All-Time Score
            if (hasAllTime) {
                this.drawScoreRow(context, panelX, panelW, yOffset, rX, rY,
                    'ALL-TIME', allTime.score, `Rank #${allTime.rank}`, '#00ff88', '#ffdd00');
                yOffset += lineHeight * 1.8;
            }

            // Daily Score
            if (hasDaily) {
                this.drawScoreRow(context, panelX, panelW, yOffset, rX, rY,
                    'TODAY', daily.score, `Rank #${daily.rank}`, '#ffaa00', '#ff8800');
                yOffset += lineHeight * 1.8;
            }

            // Show message if no scores yet
            if (!hasAllTime && !hasDaily) {
                context.fillStyle = '#666666';
                context.font = `${32 * rX}px Arial`;  // 2x
                context.textAlign = 'center';
                context.fillText('No scores recorded yet', centerX * rX, yOffset * rY);
                context.fillText('Play a game to get on the leaderboard!', centerX * rX, (yOffset + 50) * rY);  // 2x
            }

            // Loading indicator
            if (this.fetchingScores) {
                context.fillStyle = '#888888';
                context.font = `${24 * rX}px Arial`;  // 2x
                context.textAlign = 'right';
                context.fillText('Updating...', (panelX + panelW - 40) * rX, (panelY + 64) * rY);  // 2x
            }
        } else {
            // Not logged in - show session scores
            if (highScore.value > 0) {
                context.fillStyle = '#888888';
                context.font = `${28 * rX}px Arial`;  // 2x
                context.textAlign = 'left';
                context.fillText('SESSION HIGH', (panelX + 60) * rX, yOffset * rY);  // 2x

                context.fillStyle = '#00ff88';
                context.font = `bold ${56 * rX}px Arial`;  // 2x
                context.textAlign = 'right';
                context.fillText(highScore.value.toLocaleString(), (panelX + panelW - 60) * rX, yOffset * rY);  // 2x

                yOffset += lineHeight - 10;

                // Stats
                context.font = `${26 * rX}px Arial`;  // 2x
                context.textAlign = 'left';
                context.fillStyle = '#ff6666';
                context.fillText(`Kills: ${highScore.kills}`, (panelX + 60) * rX, yOffset * rY);  // 2x
                context.fillStyle = '#ffaa00';
                context.textAlign = 'right';
                context.fillText(`Streak: ${highScore.best_streak}`, (panelX + panelW - 60) * rX, yOffset * rY);  // 2x
            }

            // Hint to login
            context.fillStyle = '#555555';
            context.font = `${22 * rX}px Arial`;  // 2x
            context.textAlign = 'center';
            context.fillText('Login to save scores to leaderboard', centerX * rX, (panelY + panelH - 24) * rY);  // 2x
        }

        context.restore();
    }

    /**
     * Helper to draw a score row with label, value, and rank (2x scale)
     */
    drawScoreRow(context, panelX, panelW, y, rX, rY, label, score, rankText, scoreColor, rankColor) {
        // Label
        context.fillStyle = '#888888';
        context.font = `${28 * rX}px Arial`;  // 2x
        context.textAlign = 'left';
        context.fillText(label, (panelX + 60) * rX, y * rY);  // 2x

        // Score value
        context.fillStyle = scoreColor;
        context.font = `bold ${56 * rX}px Arial`;  // 2x
        context.textAlign = 'right';
        context.fillText(score.toLocaleString(), (panelX + panelW - 60) * rX, y * rY);  // 2x

        // Rank badge
        context.fillStyle = rankColor;
        context.font = `bold ${32 * rX}px Arial`;  // 2x
        context.textAlign = 'left';
        context.fillText(rankText, (panelX + 60) * rX, (y + 50) * rY);  // 2x
    }

    /**
     * Helper to draw rounded rectangle path
     */
    drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
