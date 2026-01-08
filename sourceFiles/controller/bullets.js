import { Bullet } from "./bullet.js";
import { SpecialBullet, ChainBolt } from "./specialBullet.js";
import { superFunctions } from "../menu/supers.js";

export class Bullets {
    constructor(){
        this.super = new superFunctions();
        this.bulletsList = [];
        this.bulletsMax = 5;
        this.bulletsSpawnInterval = 10;
        this.bulletsSpawnNow = window.performance.now();
        this.bulletsSpawnCount = 0;
        this.bulletsCreated = false;
        this.bulletsSpawned = false;
        this.bulletsDeSpawned = false;
        this.bulletsHitTarget = false;

        this.bulletsMaxTravel = 780 * window.innerWidth / 2560;

        this.bulletSpeed = 18 * 120/60;
        this.bulletSize = 15;
        this.bulletColor = 'purple';

        this.endX = 0;
        this.endY = 0;
        this.dirX = 1;
        this.dirY = 1
        this.offX = 0;
        this.offY = 0;
        this.angle = 0;

        // Chain lightning bolts
        this.chainBolts = [];

        this.prevWindowWidth = window.innerWidth;
        this.prevWindowHeight = window.innerHeight;
    }
    reset(){
        this.bulletsList = [];
        this.chainBolts = [];
        this.bulletsMaxTravel = 780 * window.innerWidth / 2560;
        this.bulletsSpawnCount = 0;
        this.bulletsCreated = false;
        this.bulletsSpawned = false;
        this.bulletsDeSpawned = false;
        this.bulletsHitTarget = false;
    }
    update(player, input, enemies, game){
        if(this.prevWindowWidth != window.innerWidth || this.prevWindowHeight != window.innerHeight){
            this.bulletsMaxTravel = this.bulletsMaxTravel * window.innerWidth / this.prevWindowWidth;

            this.prevWindowWidth = window.innerWidth;
            this.prevWindowHeight = window.innerHeight;
        }

        // Update chain bolts
        for (let i = this.chainBolts.length - 1; i >= 0; i--) {
            this.chainBolts[i].update();
            if (this.chainBolts[i].expired) {
                // Kill the target enemy when chain completes
                const target = this.chainBolts[i].targetEnemy;
                if (target && enemies.enemiesList.includes(target)) {
                    const idx = enemies.enemiesList.indexOf(target);
                    enemies.enemiesList.splice(idx, 1);
                    enemies.enemiesTakenDown++;
                    enemies.hitStreak++;
                    if (enemies.hitStreak > enemies.best_streak) {
                        enemies.best_streak = enemies.hitStreak;
                    }
                    game.score += enemies.enemyScoreValue * enemies.hitStreak;
                    if (window.gameSound) window.gameSound.playEnemyDeath();
                    if (game.effects) {
                        game.effects.spawnBurst(target.x, target.y, 'enemyDeath');
                    }
                }
                this.chainBolts.splice(i, 1);
            }
        }

        // Get active gun from reward manager
        const rewardManager = game.rewardManager;
        const activeGun = rewardManager ? rewardManager.activeGun : null;

        if(player.qPressed == true){
            let msNow = window.performance.now();
            player.qCoolDownElapsed = msNow - player.qPressedNow;

            if(this.bulletsCreated == true){
                if(this.bulletsList.length == 0 || this.bulletsHitTarget == true){
                    this.bulletsCreated = false;
                    this.bulletsSpawned = false;
                    this.bulletsDeSpawned = true;
                    this.bulletsSpawnCount = 0;
                    this.bulletsHitTarget = false;
                }
                else{
                    let msNow = window.performance.now();
                    let msPassed = msNow - this.bulletsSpawnNow;
                    const maxBullets = this.getMaxBullets(activeGun);
                    if(msPassed > this.bulletsSpawnInterval && this.bulletsSpawnCount < maxBullets){
                        this.bulletsSpawnNow = window.performance.now();
                        this.bulletsSpawnCount += 1;
                        this.bulletsSpawned = false;
                    }
                    else if(this.bulletsSpawnCount == maxBullets){
                        this.bulletsSpawned = true;
                    }

                    if(this.bulletsSpawned == true && this.bulletsHitTarget == false){
                        for(let i = 0; i < this.bulletsList.length; i++){
                            if(this.bulletsList[i].destroy == true || this.bulletsList[i].enemyCollision == true){
                                if(this.bulletsList[i].enemyCollision == true){
                                    // For piercing bullets, don't clear all - just mark hit
                                    if (this.bulletsList[i].pierceCount > 0) {
                                        this.bulletsList[i].enemyCollision = false;
                                        this.bulletsHitTarget = true;
                                    } else {
                                        this.bulletsList = [];
                                        this.bulletsHitTarget = true;
                                        break;
                                    }
                                }
                                else if(this.bulletsList[i].destroy == true){
                                    enemies.hitStreak = 0;
                                    this.bulletsList.splice(i,1);
                                }
                            }
                            else{
                                this.bulletsList[i].update(enemies.enemiesList);
                                this.bulletsList[i].checkCollision(enemies.enemiesList, this.onChain.bind(this));
                            }
                        }
                    }
                    else if(this.bulletsSpawned == false && this.bulletsSpawnCount > 0 && this.bulletsList.length > 0 && this.bulletsHitTarget == false){
                        let max = Math.min(this.bulletsSpawnCount, this.bulletsList.length);
                        for(let i = 0; i < max; i++){
                            if(!this.bulletsList[i]) break;
                            if(this.bulletsList[i].enemyCollision == true){
                                if (this.bulletsList[i].pierceCount > 0) {
                                    this.bulletsList[i].enemyCollision = false;
                                    this.bulletsHitTarget = true;
                                } else {
                                    this.bulletsList = [];
                                    this.bulletsHitTarget = true;
                                    break;
                                }
                            }
                            else{
                                this.bulletsList[i].update(enemies.enemiesList);
                                this.bulletsList[i].checkCollision(enemies.enemiesList, this.onChain.bind(this));
                            }
                        }
                    }
                }
            }

            if(player.qCoolDownElapsed >= player.qCoolDown && this.bulletsDeSpawned == true){
                player.qPressed = false;
                this.bulletsDeSpawned = false;
            }
            else if(player.qCoolDownElapsed >= 0 && player.qTriggered == false){
                this.super.getAngle(this, player.x, player.y, input.mouseX, input.mouseY);
                this.super.getTravel(this, player.x, player.y, this.angle, this.bulletsMaxTravel);
                this.super.getOffset(this, player.x, player.y, this.angle, (player.size/2));
                player.qTriggered = true;
                this.bulletsList = [];

                // Create bullets based on active gun type
                this.createBullets(player, activeGun, rewardManager);

                this.bulletsCreated = true;
                if (window.gameSound) window.gameSound.playShoot();
                this.bulletsSpawnNow = window.performance.now();
            }
        }
        this.prevWindowWidth = window.innerWidth;
        this.prevWindowHeight = window.innerHeight;
    }

    // Chain lightning callback
    onChain(fromEnemy, toEnemy, gunData) {
        const bolt = new ChainBolt(fromEnemy.x, fromEnemy.y, toEnemy, gunData);
        this.chainBolts.push(bolt);
    }

    // Get max bullets for current gun
    getMaxBullets(activeGun) {
        if (!activeGun) return this.bulletsMax;

        switch (activeGun.gunType) {
            case 'shotgun':
                return activeGun.bulletCount || 7;
            case 'twin':
                return activeGun.bulletCount || 2;
            case 'nova':
                return activeGun.bulletCount || 12;
            case 'rapidfire':
                return activeGun.bulletCount || this.bulletsMax;
            default:
                return this.bulletsMax;
        }
    }

    // Create bullets based on gun type
    createBullets(player, activeGun, rewardManager) {
        // Apply size and range modifiers from reward manager
        let sizeMultiplier = rewardManager ? rewardManager.bulletSizeMod : 1;
        let rangeMultiplier = rewardManager ? rewardManager.rangeMod : 1;

        if (!activeGun) {
            // Default gun
            for(let i = 0; i < this.bulletsMax; i++){
                let b = new Bullet(
                    this.offX, this.offY,
                    this.endX, this.endY,
                    this.bulletSize * ((100-(i*20))/100) * sizeMultiplier,
                    this.bulletColor,
                    this.bulletSpeed,
                    'Normal'
                );
                this.bulletsList.push(b);
            }
            return;
        }

        // Notify reward manager that gun was fired
        if (rewardManager) {
            rewardManager.onGunFired();
        }

        // Apply gun-specific range modifier
        if (activeGun.rangeMultiplier) {
            rangeMultiplier *= activeGun.rangeMultiplier;
        }

        const gunData = {
            ...activeGun,
            rangeMultiplier: rangeMultiplier
        };

        switch (activeGun.gunType) {
            case 'shotgun':
                this.createShotgunBullets(player, gunData, sizeMultiplier);
                break;
            case 'rapidfire':
                this.createRapidfireBullets(player, gunData, sizeMultiplier);
                break;
            case 'piercing':
                this.createPiercingBullets(player, gunData, sizeMultiplier);
                break;
            case 'ricochet':
                this.createRicochetBullets(player, gunData, sizeMultiplier);
                break;
            case 'homing':
                this.createHomingBullets(player, gunData, sizeMultiplier);
                break;
            case 'twin':
                this.createTwinBullets(player, gunData, sizeMultiplier);
                break;
            case 'nova':
                this.createNovaBullets(player, gunData, sizeMultiplier);
                break;
            case 'chain':
                this.createChainBullets(player, gunData, sizeMultiplier);
                break;
            default:
                // Fallback to default
                for(let i = 0; i < this.bulletsMax; i++){
                    let b = new Bullet(
                        this.offX, this.offY,
                        this.endX, this.endY,
                        this.bulletSize * ((100-(i*20))/100) * sizeMultiplier,
                        this.bulletColor,
                        this.bulletSpeed,
                        'Normal'
                    );
                    this.bulletsList.push(b);
                }
        }
    }

    createShotgunBullets(player, gunData, sizeMultiplier) {
        const count = gunData.bulletCount || 7;
        const spreadAngle = (gunData.spreadAngle || 45) * Math.PI / 180;
        // Calculate the actual angle to the target using atan2 (full 0 to 2*PI range)
        const baseAngle = Math.atan2(this.endY - player.y, this.endX - player.x);

        for (let i = 0; i < count; i++) {
            const angleOffset = (i / (count - 1) - 0.5) * spreadAngle;
            const bulletAngle = baseAngle + angleOffset;

            const maxTravel = this.bulletsMaxTravel * (gunData.rangeMultiplier || 0.5);
            const endX = player.x + Math.cos(bulletAngle) * maxTravel;
            const endY = player.y + Math.sin(bulletAngle) * maxTravel;

            const b = new SpecialBullet(
                this.offX, this.offY,
                endX, endY,
                this.bulletSize * 0.8 * sizeMultiplier,
                this.bulletSpeed * 0.9,
                'shotgun',
                gunData
            );
            this.bulletsList.push(b);
        }
    }

    createRapidfireBullets(player, gunData, sizeMultiplier) {
        const count = gunData.bulletCount || this.bulletsMax;

        for (let i = 0; i < count; i++) {
            const b = new SpecialBullet(
                this.offX, this.offY,
                this.endX, this.endY,
                this.bulletSize * ((100-(i*15))/100) * sizeMultiplier,
                this.bulletSpeed * 1.2,
                'rapidfire',
                gunData
            );
            this.bulletsList.push(b);
        }
    }

    createPiercingBullets(player, gunData, sizeMultiplier) {
        for (let i = 0; i < 3; i++) {
            const b = new SpecialBullet(
                this.offX, this.offY,
                this.endX, this.endY,
                this.bulletSize * ((100-(i*25))/100) * sizeMultiplier,
                this.bulletSpeed,
                'piercing',
                gunData
            );
            this.bulletsList.push(b);
        }
    }

    createRicochetBullets(player, gunData, sizeMultiplier) {
        for (let i = 0; i < 3; i++) {
            const b = new SpecialBullet(
                this.offX, this.offY,
                this.endX, this.endY,
                this.bulletSize * ((100-(i*20))/100) * sizeMultiplier,
                this.bulletSpeed * (gunData.speedMultiplier || 1),
                'ricochet',
                gunData
            );
            this.bulletsList.push(b);
        }
    }

    createHomingBullets(player, gunData, sizeMultiplier) {
        // Calculate the actual angle to the target using atan2 (full 0 to 2*PI range)
        const baseAngle = Math.atan2(this.endY - player.y, this.endX - player.x);

        for (let i = 0; i < 3; i++) {
            const spreadAngle = (i - 1) * 0.3;
            const bulletAngle = baseAngle + spreadAngle;
            const maxTravel = this.bulletsMaxTravel * (gunData.rangeMultiplier || 1);
            const endX = player.x + Math.cos(bulletAngle) * maxTravel;
            const endY = player.y + Math.sin(bulletAngle) * maxTravel;

            const b = new SpecialBullet(
                this.offX, this.offY,
                endX, endY,
                this.bulletSize * 1.2 * sizeMultiplier,
                this.bulletSpeed * (gunData.speedMultiplier || 0.6),
                'homing',
                gunData
            );
            this.bulletsList.push(b);
        }
    }

    createTwinBullets(player, gunData, sizeMultiplier) {
        const count = gunData.bulletCount || 2;
        const spacing = (gunData.spacing || 15) * window.innerWidth / 2560;
        // Calculate the actual angle to the target using atan2 (full 0 to 2*PI range)
        const actualAngle = Math.atan2(this.endY - player.y, this.endX - player.x);
        const perpX = -Math.sin(actualAngle);
        const perpY = Math.cos(actualAngle);

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spacing;
            const startX = this.offX + perpX * offset;
            const startY = this.offY + perpY * offset;
            const endXOffset = this.endX + perpX * offset;
            const endYOffset = this.endY + perpY * offset;

            const b = new SpecialBullet(
                startX, startY,
                endXOffset, endYOffset,
                this.bulletSize * sizeMultiplier,
                this.bulletSpeed,
                'twin',
                gunData
            );
            this.bulletsList.push(b);
        }
    }

    createNovaBullets(player, gunData, sizeMultiplier) {
        const count = gunData.bulletCount || 12;
        const maxTravel = this.bulletsMaxTravel * (gunData.rangeMultiplier || 1);

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const endX = player.x + Math.cos(angle) * maxTravel;
            const endY = player.y + Math.sin(angle) * maxTravel;

            const b = new SpecialBullet(
                player.x, player.y,
                endX, endY,
                this.bulletSize * 0.9 * sizeMultiplier,
                this.bulletSpeed * 0.85,
                'nova',
                gunData
            );
            this.bulletsList.push(b);
        }
    }

    createChainBullets(player, gunData, sizeMultiplier) {
        for (let i = 0; i < 3; i++) {
            const b = new SpecialBullet(
                this.offX, this.offY,
                this.endX, this.endY,
                this.bulletSize * ((100-(i*20))/100) * sizeMultiplier,
                this.bulletSpeed,
                'chain',
                gunData
            );
            this.bulletsList.push(b);
        }
    }
    draw(context){
        // Draw chain lightning bolts
        for (const bolt of this.chainBolts) {
            bolt.draw(context);
        }

        if(this.bulletsSpawned == true){
            for(let i = 0; i < this.bulletsList.length; i++){
                this.bulletsList[i].draw(context);
            }
        }
        else if(this.bulletsSpawned == false && this.bulletsSpawnCount > 0){
            let max = this.bulletsSpawnCount;
            if(max <= this.bulletsList.length){
                for(let i = 0; i < max; i++){
                    this.bulletsList[i].draw(context);
                }
            }
        }
    }
}