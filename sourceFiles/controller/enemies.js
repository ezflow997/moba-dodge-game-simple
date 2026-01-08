import { Enemy } from "./enemy.js";
import { Boss } from "./boss.js";
import { ChargeBoss } from "./chargeBoss.js";
import { VortexBoss } from "./vortexBoss.js";

export class Enemies {
    constructor(){
        // Boss properties
        this.boss = null;
        this.bossActive = false;
        this.bossDefeated = 0;
        this.bossScoreThreshold = 50;
        this.bossTowardsScore = 0;
        this.bossDefeatBonus = 2000;
        this.difficulty_speed = [5.9, 6.2, 6.6, 7.0, 8.5];
        this.difficulty_size = [62, 55, 50, 40, 20];
        this.difficulty_speed_changer = [0.35, 0.62, 0.87, 1.32, 3.33];

        this.enemiesList = [];
        this.lastCreation = performance.now();

        this.baseRandomSpawnTime = 470;
        this.randomSpawnTimeMultiplier = 10;
        this.randomSpawnTimeMin = 50;
        this.randomSpawnTime = this.baseRandomSpawnTime;

        this.level = 0;
        this.levelMaxNow = window.performance.now();
        this.levelMultiplier = 1500;

        this.baseSpawnChance = 40;
        this.spawnChanceMax = 65;
        this.spawnChanceMultiplier = 1;
        this.spawnChance = this.baseSpawnChance;

        this.baseMaxEnemiesMultiplier = 5;  // orginal value 5
        this.enemiesMultiplier = 0.25;
        this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier;

        this.speed = this.difficulty_speed[0];
        this.speed_changer = this.difficulty_speed_changer[0];
        this.size = this.difficulty_size[0];
        this.color = 'green';

        this.hitStreak = 0;
        this.best_streak = 0;
        this.enemyScoreValue = 10;
        this.enemiesTakenDown = 0;
    }
    set_difficulty(game){
        this.speed = this.difficulty_speed[game.difficulty_level];
        this.speed_changer = this.difficulty_speed_changer[game.difficulty_level];
        this.size = this.difficulty_size[game.difficulty_level];
    }
    reset(){
        this.enemiesList = [];
        this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier;
        this.hitStreak = 0;
        this.best_streak = 0;
        this.enemiesTakenDown = 0;
        this.level = 0;
        this.levelMaxNow = window.performance.now();
        this.randomSpawnTime = this.baseRandomSpawnTime;
        this.spawnChance = this.baseSpawnChance;

        // Reset boss state
        this.boss = null;
        this.bossActive = false;
        this.bossDefeated = 0;
        this.bossTowardsScore = 0;
    }
    update(game, player, bullets, update){
        // Get the correct bullet/bolt array based on challenge mode
        const bulletArray = game.challenge_level === 0 ? bullets.bulletsList : bullets.bolts;
        
        if(!this.bossActive &&
            this.bossTowardsScore >= (this.bossScoreThreshold * (this.bossDefeated + 1))){
                this.spawnBoss(game);
        }

        // Update boss if active
        if (this.bossActive && this.boss) {
            this.boss.update(player, game);

            // Check boss collision with player and bullets
            const collision = this.boss.checkCollision(player, bullets);
            if (collision) {
                if (collision.type === 'player') {
                    game.gameOver = true;
                    if (window.gameSound) window.gameSound.playPlayerDeath();
                } else if (collision.type === 'bullet') {
                    // Trigger effects on boss hit
                    if (game.effects) {
                        game.effects.spawnBurst(collision.x, collision.y, 'bossHit');
                        game.world.shake(8, 10);

                        player.qCoolDownElapsed = 0;
                        game.input.q_key += 60;
                        
                        // Clear bullets/bolts based on challenge mode
                        if(game.challenge_level === 0) {
                            bullets.bulletsList = [];
                            bullets.bulletsSpawned = false;
                        } else {
                            bullets.bolts = [];
                            bullets.canRecast = false;
                            bullets.activeBolt = null;
                        }
                        
                        player.qPressed = false;
                        player.qTriggered = true;

                        game.score = game.score + (this.enemyScoreValue * this.hitStreak);

                        if(player.ePressed == true){
                            player.ePressedNow -= 500;
                            //console.log(player.ePressedNow);
                        }
                        if(player.fPressed == true){
                            player.fPressedNow -= 1000;
                            //console.log(player.fPressedNow);
                        }
                    }
                    if (window.gameSound) window.gameSound.playBossHit();
                }
            }

            // Check if boss is defeated
            if (!this.boss.isAlive) {
                this.handleBossDefeat(game);
            }
        }

        // Only spawn regular enemies if boss is NOT active
        if (!this.bossActive && this.enemiesList.length < this.maximumEnemiesMultiplier){
            let startX = game.width * Math.random();
            let xDir = 1;
            if(startX - player.desiredX < 0){
                xDir = -1;
            }

            let startY = game.height * Math.random();
            let yDir = 1;
            if(startY - player.desiredY < 0){
                yDir = -1;
            }

            let sign = Math.random() * 100;
            if(sign < 50){
                sign = -1;
            }
            else{
                sign = 1;
            }
            let pSpeed = (Math.random() * this.speed_changer * sign) + this.speed;

            let dx = startX - player.desiredX;
            let dy = startY - player.desiredY;
            let slope = dy/dx;
            let intercept = ((slope*startX) - startY)/-1;
            //console.log(slope, intercept);

            // decide wether to calucate for y or x
            let beginX = 0 - (game.width * 0.25);
            if(xDir == -1){
                beginX = game.width * 1.25
            }
            let beginY = (slope*beginX) + intercept;

            let enemy = new Enemy(beginX, beginY, this.size, this.color, pSpeed);
            let chance = Math.random()*100;
            if(update - this.lastCreation > this.randomSpawnTime && chance < this.spawnChance){
                this.enemiesList.push(enemy);
                this.lastCreation = performance.now();
                //console.log(this.randomSpawnTime);
            }
            else if(update - this.lastCreation > this.randomSpawnTime){
                this.lastCreation = performance.now();
            }
        }
        if(!this.bossActive && this.enemiesList.length > 0){
            for(let i = 0; i < this.enemiesList.length; i++){
                let p = this.enemiesList[i];
                if(p.playerCollision == true){
                    game.gameOver = true;
                    if (window.gameSound) window.gameSound.playPlayerDeath();
                }
                if(p.bulletCollision == true){
                    //console.log('colision ',game.input.q_key);
                    if(game.challenge_level == 0){
                        player.qCoolDownElapsed = 0;
                        game.input.q_key += 60;
                        
                        // Clear bullets/bolts based on challenge mode
                        if(game.challenge_level === 0) {
                            bullets.bulletsList = [];
                            bullets.bulletsSpawned = false;
                        } else {
                            bullets.bolts = [];
                            bullets.canRecast = false;
                            bullets.activeBolt = null;
                        }
                        
                        player.qPressed = false;
                        player.qTriggered = true;
                        this.enemiesList.splice(i,1);
                        this.hitStreak += 1;
                        if(this.hitStreak > this.best_streak){
                            this.best_streak = this.hitStreak;
                        }
                        this.enemiesTakenDown += 1;
                        game.score = game.score + (this.enemyScoreValue * this.hitStreak);
                        this.bossTowardsScore = this.bossTowardsScore + this.enemyScoreValue;
                        if (window.gameSound) window.gameSound.playEnemyDeath();
                        i = i - 1;
                        if(i == 0){
                            break;
                        }
                    }
                    else if(game.challenge_level == 1){
                        this.enemiesList.splice(i,1);
                        if (window.gameSound) window.gameSound.playEnemyDeath();
                    }
                }
                else{
                    p.update(player);
                    if(game.challenge_level == 0){
                        p.checkCollision(player, bulletArray);
                    }
                    else if(game.challenge_level == 1){
                        p.checkCollision(player, bulletArray);
                    }
                }
            }
        }
        if(game.score > 800){
            if(game.score > (6000 + ((this.level-5)*this.levelMultiplier))){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                if(this.randomSpawnTime < this.randomSpawnTimeMin){
                    this.randomSpawnTime = this.randomSpawnTimeMin;
                }
                this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier + (this.enemiesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                if(this.spawnChance > this.randomSpawnChanceMax){
                    this.spawnChance = this.randomSpawnChanceMax;
                }
                this.level++;
            }
            else if(game.score > 6000 && this.level == 5){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier + (this.enemiesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
            else if(game.score > 5000 && this.level == 4){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier + (this.enemiesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
            else if(game.score > 3800 && this.level == 3){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier + (this.enemiesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
            else if(game.score > 2500 && this.level == 2){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier + (this.enemiesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
            else if(game.score > 800 && this.level == 1){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier + (this.enemiesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
        }
        else if(game.score < 800 && this.level == 0){
            this.randomSpawnTime = this.baseRandomSpawnTime;
            this.maximumEnemiesMultiplier = this.baseMaxEnemiesMultiplier;
            this.spawnChance = this.baseSpawnChance;
            this.level++;
        }
    }
    draw(context){
        if(this.enemiesList.length > 0){
            for(let i = 0; i < this.enemiesList.length; i++){
                this.enemiesList[i].draw(context);
            }
        }

        // Draw boss if active
        if (this.bossActive && this.boss) {
            this.boss.draw(context);
        }
    }

    spawnBoss(game) {
        // Clear existing enemies when boss spawns
        this.enemiesList = [];

        // Randomly choose boss type (50/50 chance)
        const rand = Math.random();
        let bossType;
        if (rand < 0.33) {
            bossType = 'shooter';
        } else if (rand < 0.66) {
            bossType = 'charger';
        } else {
            bossType = 'vortex';
        }
        //bossType = 'vortex';

        // Create boss at right side of screen
        const spawnX = game.width + 150;
        const spawnY = game.height / 2;

        if (bossType === 'shooter') {
            this.boss = new Boss(spawnX, spawnY);
            // Red flash for shooter boss
            if (game.effects) {
                game.effects.addScreenFlash('#ff0000', 500, 0.3);
            }
        } else if (bossType === 'charger') {
            this.boss = new ChargeBoss(spawnX, spawnY);
            // Purple flash for charge boss
            if (game.effects) {
                game.effects.addScreenFlash('#aa00ff', 500, 0.3);
            }
        } else {
            this.boss = new VortexBoss(spawnX, spawnY);
            // Magenta flash for vortex boss
            if (game.effects) {
                game.effects.addScreenFlash('#ff00ff', 500, 0.3);
            }
        }
        
        this.bossActive = true;
        if (game.world) {
            game.world.shake(15, 30);
        }
        if (window.gameSound) {
            window.gameSound.playBossWarning();
        }
    }

    handleBossDefeat(game) {
        // Award bonus score
        game.score += (this.bossDefeatBonus * (this.bossDefeated + 1));

        // Trigger death effects
        if (game.effects) {
            game.effects.spawnBurst(this.boss.x, this.boss.y, 'bossDeath');
            game.effects.addScreenFlash('#ffffff', 800, 0.5);
        }
        if (game.world) {
            game.world.shake(25, 60);
        }
        if (window.gameSound) {
            window.gameSound.playBossDeath();
        }

        // Mark boss as defeated
        this.bossActive = false;
        this.bossDefeated++;
        this.boss = null;
        this.bossTowardsScore = 0;
    }
}