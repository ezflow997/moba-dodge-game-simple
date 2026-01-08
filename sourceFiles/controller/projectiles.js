import { Projectile } from "./projectile.js";
import { BossProjectile } from "./bossProjectile.js";

export class Projectiles{
    constructor(){
        this.difficulty_speed = [12, 15, 17, 21, 27];
        this.difficulty_size = [15, 20, 25, 30, 35];
        this.difficulty_speed_changer = [3.1, 3.9, 4.6, 5.0, 6.5];

        this.projectilesList = [];
        this.lastCreation = performance.now();

        this.baseRandomSpawnTime = 320;
        this.randomSpawnTimeMultiplier = 10;
        this.randomSpawnTimeMin = 100;
        this.randomSpawnTime = this.baseRandomSpawnTime;

        this.baseSpawnChance = 50;
        this.spawnChanceMultiplier = 1;
        this.spawnChanceMax = 70;
        this.spawnChance = this.baseSpawnChance;

        this.baseProjectilesMultiplier = 15;
        this.projectilesMultiplier = 2;
        this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier;

        this.speed = this.difficulty_speed[0];
        this.speed_changer = this.difficulty_speed_changer[0];
        this.size = this.difficulty_size[0];

        this.level = 0;
        this.levelMaxNow = window.performance.now();
        this.levelMultiplier = 750;
    }
    set_difficulty(game){
        this.speed = this.difficulty_speed[game.difficulty_level];
        this.speed_changer = this.difficulty_speed_changer[game.difficulty_level];
        this.size = this.difficulty_size[game.difficulty_level];
    }
    reset(){
        this.projectilesList = [];
        this.lastCreation = performance.now();
        this.minSpawnPercent = 0;
        this.maxSpawnPercent = 65;
        this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier;
        this.level = 0;
        this.levelMaxNow = window.performance.now();
        this.randomSpawnTime = this.baseRandomSpawnTime;
        this.spawnChance = this.baseSpawnChance;
    }
    update(player, game, update){
        // Clear and don't spawn projectiles during boss fight
        if(game.enemies?.bossActive){
            this.projectilesList = [];
            return;
        }
        if(this.projectilesList.length < this.maximumProjectilesMultiplier){
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
            let endX = game.width * 1.25;
            let beginX = 0 - (game.width * 0.25);
            if(xDir == -1){
                endX = 0 - (game.width * 0.25);
                beginX = game.width * 1.25
            }
            let endY = (slope*endX) + intercept;
            let beginY = (slope*beginX) + intercept;

            let projectile = new Projectile(beginX, beginY, this.size, pSpeed, endX, endY, false);
            //let projectile = new BossProjectile(beginX, beginY, endX, endY, pSpeed, this.size);
            let chance = Math.random()*100;
            if(update - this.lastCreation > this.randomSpawnTime && chance < this.spawnChance){
                this.projectilesList.push(projectile);
                this.lastCreation = performance.now();
                //console.log(this.randomSpawnTime);
            }
            else if(update - this.lastCreation > this.randomSpawnTime){
                this.lastCreation = performance.now();
            }
        }
        if(this.projectilesList.length > 0){
            for(let i = 0; i < this.projectilesList.length; i++){
                let p = this.projectilesList[i];
                if(p.destroy == true){
                    this.projectilesList.splice(i,1);
                    i = i - 1;
                    if(i == 0){
                        break;
                    }
                }
                else{
                    p.update();
                    p.checkCollision(player);
                    if(p.playerCollision == true){
                        // Check if god mode is enabled
                        if (game.devMode && game.devMode.isEnabled() && game.devMode.godMode) {
                            // God mode - ignore collision
                            continue;
                        }
                        
                        // Check if player can survive (shield blocks projectile, or extra life)
                        if (game.rewardManager && game.rewardManager.canSurviveHit(true)) {
                            // Projectile blocked! Remove it and show effect
                            if (game.effects) {
                                game.effects.spawnBurst(p.x, p.y, 'shieldBlock');
                                game.world.shake(5, 10);
                            }
                            this.projectilesList.splice(i, 1);
                            i--;
                            continue;
                        }
                        game.gameOver = true;
                        if (window.gameSound) window.gameSound.playPlayerDeath();
                        this.projectilesList = [];
                    }
                }
            }
        }
        if(game.score > 1500){
            if(game.score > (7000 + ((this.level - 5)*this.levelMultiplier))){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                if(this.randomSpawnTime < this.randomSpawnTimeMin){
                    this.randomSpawnTime = this.randomSpawnTimeMin;
                }
                this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier + (this.projectilesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                if(this.spawnChance > this.spawnChanceMax){
                    this.spawnChance = this.spawnChanceMax;
                }
                this.level++;
            }
            else if(game.score > 6000 && this.level == 5){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier + (this.projectilesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
            else if(game.score > 5000 && this.level == 4){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier + (this.projectilesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
            else if(game.score > 3800 && this.level == 3){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier + (this.projectilesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
            else if(game.score > 2500 && this.level == 2){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier + (this.projectilesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
            else if(game.score > 1500 && this.level == 1){
                this.randomSpawnTime = this.baseRandomSpawnTime - (this.randomSpawnTimeMultiplier*this.level);
                this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier + (this.projectilesMultiplier*this.level);
                this.spawnChance = this.baseSpawnChance + (this.spawnChanceMultiplier*this.level);
                this.level++;
            }
        }
        else if(game.score < 1500 && this.level == 0){
            this.randomSpawnTime = this.baseRandomSpawnTime;
            this.maximumProjectilesMultiplier = this.baseProjectilesMultiplier;
            this.spawnChance = this.baseSpawnChance;
            this.level++;
        }
    }
    draw(context){
        if(this.projectilesList.length > 0){
            for(let i = 0; i < this.projectilesList.length; i++){
                this.projectilesList[i].draw(context);
                //console.log(this.projectilesList[i])
            }
        }
    }
}