
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

        this.challengeButton = new Button(btnX, 80, btnW, btnH, "Skill Mode: NORMAL", 28, 0, 0, false, true, 'white', 'white');
        this.difficultyButton = new Button(btnX, 80 + btnSpacing, btnW, btnH, "Difficulty: EASY", 28, 0, 0, false, true, 'white', 'white');
        this.startButton = new Button(btnX, 80 + btnSpacing * 2, btnW, btnH, "New Game", 32, 0, 0, false, true, 'white', 'white');
        this.leaderboardButton = new Button(btnX, 80 + btnSpacing * 3, btnW, btnH, "Leaderboard", 32, 0, 0, false, true, 'white', 'white');
        this.loginButton = new Button(btnX, 80 + btnSpacing * 4, btnW, btnH, "Login", 32, 0, 0, false, true, 'white', 'white');
        this.logoutButton = new Button(btnX + btnW + 20, 80 + btnSpacing * 4, 120, 50, "Logout", 24, 0, 0, false, true, 'white', 'white');
    }
    updateMain(game){
        var inX = game.input.mouseX;
        var inY = game.input.mouseY;

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
        }

        this.startButton.update(inX, inY);
        if(this.startButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
            this.clicked = true;
            if (window.gameSound) {
                window.gameSound.init();
                window.gameSound.resume();
                window.gameSound.playMenuClick();
            }
            game.gameOver = false;
            this.mainMenuShow = false;
            // Reset dev mode session tracking for new game
            if (game.devMode) {
                game.devMode.resetSession();
            }
        }

        // Leaderboard button - only active when leaderboard menu is not visible
        if(!game.leaderboardMenu.isVisible) {
            this.leaderboardButton.update(inX, inY);
            if(this.leaderboardButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                game.leaderboardMenu.show(game.difficulty_level);
            }
        }

        // Login button - only show when not logged in
        if(!game.playerName && !game.leaderboardMenu.isVisible && !game.awaitingNameInput) {
            this.loginButton.update(inX, inY);
            if(this.loginButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Show login/register menu
                game.awaitingNameInput = true;
                game.nameInputMenu.show((result) => {
                    if (result) {
                        game.playerName = result.name;
                        game.playerPassword = result.password;
                        localStorage.setItem('playerName', result.name);
                        localStorage.setItem('playerPassword', result.password);
                    }
                    game.awaitingNameInput = false;
                });
            }
        }

        // Logout button - only show when logged in
        if(game.playerName && !game.leaderboardMenu.isVisible) {
            this.logoutButton.update(inX, inY);
            if(this.logoutButton.isHovered == true && game.input.buttons.indexOf(0) > -1 && this.clicked == false){
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Clear stored credentials
                game.playerName = '';
                game.playerPassword = '';
                localStorage.removeItem('playerName');
                localStorage.removeItem('playerPassword');
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

        // Draw game title centered at top
        const titleX = game.width / 2 / rX;  // Center of screen
        this.menuEffects.drawTitleCentered(context, "MOBA DODGE", titleX, 80, 70);
        this.menuEffects.drawTitleCentered(context, "SIMPLE", titleX, 145, 40);

        // Update button text with current values
        this.challengeButton.text = "Mode: " + game.challenges[game.challenge_level];
        this.difficultyButton.text = "Difficulty: " + game.difficulties[game.difficulty_level];

        // Draw buttons
        this.challengeButton.draw(context);
        this.difficultyButton.draw(context);
        this.startButton.draw(context);
        this.leaderboardButton.draw(context);

        // Show login button or player name based on login state
        if(game.playerName) {
            this.super.drawGlowText(context, 80, 475, "Playing as: " + game.playerName, 26, '#00ff88', '#00ff00', 5);
            this.logoutButton.draw(context);
        } else {
            this.loginButton.draw(context);
        }

        // Draw ability info on the right side
        const infoX = 1750;
        const infoY = 100;
        const infoSep = 50;
        const fontSize = 36;

        this.super.drawGlowText(context, infoX, infoY, "Abilities", 40, '#00ffff', '#00aaff', 8);
        this.super.drawGlowText(context, infoX, infoY + infoSep * 1, "Dash (" + game.player.ePenalty + ") " + (game.player.eCoolDown/1000).toFixed(1) + "s", fontSize, '#ffff88', '#ffff00', 6);
        this.super.drawGlowText(context, infoX, infoY + infoSep * 2, "Ultimate (" + game.player.fPenalty + ") " + (game.player.fCoolDown/1000).toFixed(1) + "s", fontSize, '#ffff88', '#ffff00', 6);

        if(game.challenge_level == 0){
            this.super.drawGlowText(context, infoX, infoY + infoSep * 3, "Shoot (+" + game.enemies.enemyScoreValue + ") " + (game.player.qCoolDown/1000).toFixed(1) + "s", fontSize, '#88ff88', '#00ff00', 6);
        } else {
            this.super.drawGlowText(context, infoX, infoY + infoSep * 3, "Shoot (+" + game.enemies.enemyScoreValue + "x" + game.voidBolts.splitScoreMultiplier + ") " + (game.player.qCoolDown/1000).toFixed(1) + "s", fontSize, '#88ff88', '#00ff00', 6);
        }

        // Display high score in center
        if(game.player_data.high_score[game.difficulty_level].value > 0){
            this.super.drawGlowText(context, titleX - 80, 220, "High Score", 36, '#ffffff', '#00ffff', 6, true);
            this.super.drawGlowText(context, titleX - 80, 270, "" + game.player_data.high_score[game.difficulty_level].value, 50, '#00ff88', '#00ff00', 10, true);
        }
    }
}
