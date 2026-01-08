
import { Button } from "./supers.js";
import { superFunctions } from "./supers.js";
import { MenuEffects } from "../effects/menuEffects.js";

export class Menu{
    constructor(){
        this.clicked = false;
        this.super = new superFunctions();
        this.menuEffects = new MenuEffects();

        this.mainMenuShow = false;

        this.challengeButton = new Button(150, 50, 500, 125, "Skill Mode:", 50, 70, 50, false, true, 'white', 'white');
        this.challengeButtonRow2_Text = '';

        this.difficultyButton = new Button(150, 200, 500, 100, "Difficulty:", 43, 15, 65, false, true, 'white', 'white');
        this.difficultyButtonRow2_Text = '';

        this.startButton = new Button(150, 325, 500, 100, "New Game", 50, 100, 65, false, true, 'white', 'white');

        this.leaderboardButton = new Button(150, 450, 500, 100, "Leaderboard", 50, 70, 65, false, true, 'white', 'white');

        this.logoutButton = new Button(520, 555, 150, 50, "Logout", 30, 22, 36, false, true, 'white', 'white');
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
        // Draw animated background and floating particles
        this.menuEffects.update(game.width, game.height);
        this.menuEffects.drawAnimatedBackground(context, game.width, game.height);
        this.menuEffects.drawFloatingParticles(context);

        // Draw game title with glow effect
        this.menuEffects.drawTitle(context, "MOBA DODGE", 800, 80, 80);
        this.menuEffects.drawTitle(context, "SIMPLE", 950, 150, 50);

        // Draw the three main buttons
        this.challengeButton.draw(context);
        this.challengeButtonRow2_Text = game.challenges[game.challenge_level];
        let challenge_spacer = (this.challengeButtonRow2_Text.length)/2;
        this.super.drawGlowText(context, 335 - (challenge_spacer*25), 150, this.challengeButtonRow2_Text, 50, '#ff00ff', '#ff00ff', 10);

        this.difficultyButton.draw(context);
        let difficulty_spacer = (this.difficultyButtonRow2_Text.length)/2;
        this.difficultyButtonRow2_Text = game.difficulties[game.difficulty_level];
        this.super.drawGlowText(context, 475 - (difficulty_spacer*25), 270, this.difficultyButtonRow2_Text, 50, '#ff00ff', '#ff00ff', 10);

        this.startButton.draw(context);

        this.leaderboardButton.draw(context);

        // Show player name and logout button if logged in
        if(game.playerName) {
            this.super.drawGlowText(context, 150, 580, "Playing as: " + game.playerName, 30, '#00ff88', '#00ff00', 5);
            this.logoutButton.draw(context);
        } else {
            this.super.drawGlowText(context, 150, 580, "Not logged in", 30, '#888888', '#666666', 5);
        }

        // Draw ability info
        let info_sep = 60;
        let info_x_off = 1600;
        let info_y_off = 140;
        let font_size = 45;
        this.super.drawGlowText(context, info_x_off, info_y_off+(info_sep*0), "(" + game.player.ePenalty + ") Dash " + (game.player.eCoolDown/1000).toFixed(1) + "s", font_size, '#ffff88', '#ffff00', 8);
        this.super.drawGlowText(context, info_x_off, info_y_off+(info_sep*1),  "(" + game.player.fPenalty + ") Ultimate " + (game.player.fCoolDown/1000).toFixed(1) + "s", font_size, '#ffff88', '#ffff00', 8);
        if(game.challenge_level == 0){
            this.super.drawGlowText(context, info_x_off, info_y_off+(info_sep*2), "(+" + game.enemies.enemyScoreValue + ") Shoot " + (game.player.qCoolDown/1000).toFixed(1) + "s", font_size, '#88ff88', '#00ff00', 8);
        }
        else if(game.challenge_level == 1){
            this.super.drawGlowText(context, info_x_off, info_y_off+(info_sep*2), "(+" + game.enemies.enemyScoreValue + "x" + game.voidBolts.splitScoreMultiplier + ") Recast Shoot " + (game.player.qCoolDown/1000).toFixed(1) + "s", font_size, '#88ff88', '#00ff00', 8);
        }

        // Display local high score if exists
        if(game.player_data.high_score[game.difficulty_level].value > 0){
            let acc_x_off = 940;
            let acc_y_off = 270;
            let acc_sep = 60;
            let score_centered = 130;
            let letter_spacing = 25;
            let score_center_offset = ('' + game.player_data.high_score[game.difficulty_level].value).length/2;
            this.super.drawGlowText(context, acc_x_off, acc_y_off, "High Score: ", 50, '#ffffff', '#00ffff', 6);
            this.super.drawGlowText(context, acc_x_off + score_centered - (letter_spacing*score_center_offset), acc_y_off + acc_sep, "" + game.player_data.high_score[game.difficulty_level].value, 50, '#00ff88', '#00ff00', 10);
        }
    }
}
