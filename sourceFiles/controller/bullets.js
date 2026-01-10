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
            const bolt = this.chainBolts[i];
            bolt.update();

            // Check for recursive chain spawning
            if (bolt.needsRecursiveChain) {
                const newBolts = bolt.createRecursiveChains(enemies.enemiesList);
                for (const newBolt of newBolts) {
                    this.chainBolts.push(newBolt);
                }
            }

            if (bolt.expired) {
                // Kill the target enemy when chain completes
                const target = bolt.targetEnemy;
                if (target && enemies.enemiesList.includes(target)) {
                    const idx = enemies.enemiesList.indexOf(target);
                    enemies.enemiesList.splice(idx, 1);
                    enemies.enemiesTakenDown++;
                    enemies.hitStreak++;
                    if (enemies.hitStreak > enemies.best_streak) {
                        enemies.best_streak = enemies.hitStreak;
                    }
                    game.rewardManager.addScore(game, enemies.enemyScoreValue * enemies.hitStreak);
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

        // Build combined target list for homing (includes boss if active)
        const homingTargets = [...enemies.enemiesList];
        if (enemies.bossActive) {
            // Add the active boss to homing targets
            if (enemies.boss) homingTargets.push(enemies.boss);
            if (enemies.chargeBoss) homingTargets.push(enemies.chargeBoss);
            if (enemies.vortexBoss) homingTargets.push(enemies.vortexBoss);
        }

        if(player.qPressed == true){
            let msNow = window.performance.now();
            // Apply time scale from dev mode if available
            const timescale = game.devMode ? game.devMode.timescale : 1.0;
            player.qCoolDownElapsed = (msNow - player.qPressedNow) * timescale;

            if(this.bulletsCreated == true){
                // Check if this is an independent bullet type that shouldn't block cooldown
                const firstBullet = this.bulletsList.length > 0 ? this.bulletsList[0] : null;
                const independentTypes = ['shotgun', 'nova', 'twin', 'homing', 'ricochet', 'piercing', 'rapidfire'];
                const isIndependentGun = firstBullet && independentTypes.includes(firstBullet.gunType);

                // For independent guns, allow cooldown to proceed once all bullets have spawned
                // but keep updating bullets until they're gone
                if (isIndependentGun && this.bulletsSpawned && !this.bulletsDeSpawned) {
                    this.bulletsDeSpawned = true;  // Allow cooldown to reset
                }

                // Rapid fire: immediately allow next shot after bullet is created
                if (firstBullet && firstBullet.gunType === 'rapidfire' && this.bulletsCreated && !this.bulletsDeSpawned) {
                    this.bulletsDeSpawned = true;
                }

                // Standard completion check - bullets gone or hit target
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

                    // Check if bullets should spawn with fast stagger (shotgun)
                    const hasFastSpawn = this.bulletsList.length > 0 && this.bulletsList[0].fastSpawn;
                    const spawnInterval = hasFastSpawn ? 1.5 : this.bulletsSpawnInterval;  // 1.5ms for shotgun, 10ms default

                    if(msPassed > spawnInterval && this.bulletsSpawnCount < maxBullets){
                        this.bulletsSpawnNow = window.performance.now();
                        this.bulletsSpawnCount += 1;
                        this.bulletsSpawned = false;
                    }
                    else if(this.bulletsSpawnCount == maxBullets){
                        this.bulletsSpawned = true;
                    }

                    // Update unspawned shotgun bullets to follow player position
                    for (let i = this.bulletsSpawnCount; i < this.bulletsList.length; i++) {
                        const bullet = this.bulletsList[i];
                        if (bullet && bullet.followPlayer && !bullet.spawned) {
                            const p = bullet.followPlayer;
                            bullet.x = p.x;
                            bullet.y = p.y;
                            bullet.endX = p.x + Math.cos(bullet.bulletAngle) * bullet.maxTravel;
                            bullet.endY = p.y + Math.sin(bullet.bulletAngle) * bullet.maxTravel;
                        }
                    }

                    // Mark bullets as spawned when they start moving
                    for (let i = 0; i < this.bulletsSpawnCount && i < this.bulletsList.length; i++) {
                        const bullet = this.bulletsList[i];
                        if (bullet && bullet.followPlayer && !bullet.spawned) {
                            bullet.spawned = true;
                        }
                    }

                    if(this.bulletsSpawned == true && this.bulletsHitTarget == false){
                        for(let i = this.bulletsList.length - 1; i >= 0; i--){
                            const bullet = this.bulletsList[i];

                            // Always update and check collision first
                            if (!bullet.destroy && !bullet.enemyCollision) {
                                bullet.update(homingTargets);
                                bullet.checkCollision(enemies.enemiesList, this.onChain.bind(this));
                            }

                            // Now handle destroy/collision states
                            if(bullet.destroy == true || bullet.enemyCollision == true){
                                if(bullet.enemyCollision == true){
                                    // Check if bullet type should be independent (not clear all on hit)
                                    const independentTypes = ['shotgun', 'nova', 'twin', 'homing', 'ricochet', 'piercing', 'rapidfire'];
                                    const isIndependent = independentTypes.includes(bullet.gunType || bullet.bulletType);

                                    // For piercing bullets with pierce remaining, continue
                                    if (bullet.gunType === 'piercing' && bullet.pierceCount > 0) {
                                        bullet.enemyCollision = false;
                                        // Continue to next bullet, this one keeps moving
                                    // For ricochet bullets with bounces remaining, continue bouncing
                                    } else if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                                        bullet.enemyCollision = false;
                                    } else if (isIndependent) {
                                        // Independent bullets: remove only this bullet
                                        this.bulletsList.splice(i, 1);
                                    } else {
                                        // Single-target weapons: clear all bullets
                                        this.bulletsList = [];
                                        this.bulletsHitTarget = true;
                                        break;
                                    }
                                }
                                else if(bullet.destroy == true){
                                    // Don't reset streak for rapidfire misses
                                    if (bullet.gunType !== 'rapidfire') {
                                        enemies.hitStreak = 0;
                                    }
                                    this.bulletsList.splice(i,1);
                                }
                            }
                        }
                    }
                    else if(this.bulletsSpawned == false && this.bulletsSpawnCount > 0 && this.bulletsList.length > 0 && this.bulletsHitTarget == false){
                        let max = Math.min(this.bulletsSpawnCount, this.bulletsList.length);
                        for(let i = max - 1; i >= 0; i--){
                            const bullet = this.bulletsList[i];
                            if(!bullet) continue;

                            // Always update and check collision first
                            if (!bullet.destroy && !bullet.enemyCollision) {
                                bullet.update(homingTargets);
                                bullet.checkCollision(enemies.enemiesList, this.onChain.bind(this));
                            }

                            // Now handle collision states
                            if(bullet.destroy == true || bullet.enemyCollision == true){
                                if(bullet.enemyCollision == true){
                                    // Check if bullet type should be independent (not clear all on hit)
                                    const independentTypes = ['shotgun', 'nova', 'twin', 'homing', 'ricochet', 'piercing', 'rapidfire'];
                                    const isIndependent = independentTypes.includes(bullet.gunType || bullet.bulletType);

                                    // For piercing bullets with pierce remaining, continue
                                    if (bullet.gunType === 'piercing' && bullet.pierceCount > 0) {
                                        bullet.enemyCollision = false;
                                    // For ricochet bullets with bounces remaining, continue bouncing
                                    } else if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                                        bullet.enemyCollision = false;
                                    } else if (isIndependent) {
                                        // Independent bullets: remove only this bullet
                                        this.bulletsList.splice(i, 1);
                                    } else {
                                        // Single-target weapons: clear all bullets
                                        this.bulletsList = [];
                                        this.bulletsHitTarget = true;
                                        break;
                                    }
                                }
                                else if(bullet.destroy == true){
                                    // Don't reset streak for rapidfire misses
                                    if (bullet.gunType !== 'rapidfire') {
                                        enemies.hitStreak = 0;
                                    }
                                    this.bulletsList.splice(i, 1);
                                }
                            }
                        }
                    }
                }
            }

            // Apply gun's cooldown multiplier (rapid fire has very short cooldown)
            let effectiveCooldown;
            if (activeGun && activeGun.gunType === 'rapidfire') {
                // Rapid fire uses a very short fixed cooldown for continuous fire (50-100ms based on rarity)
                const rarityMultiplier = activeGun.cooldownMultiplier || 0.6;
                effectiveCooldown = 150 * rarityMultiplier;  // ~90ms for uncommon, ~45ms for legendary
            } else {
                const gunCooldownMult = activeGun ? (activeGun.cooldownMultiplier || 1) : 1;
                effectiveCooldown = player.qCoolDown * gunCooldownMult;
            }

            if(player.qCoolDownElapsed >= effectiveCooldown && this.bulletsDeSpawned == true){
                player.qPressed = false;
                this.bulletsDeSpawned = false;
            }
            else if(player.qCoolDownElapsed >= 0 && player.qTriggered == false){
                this.super.getAngle(this, player.x, player.y, input.mouseX, input.mouseY);
                this.super.getTravel(this, player.x, player.y, this.angle, this.bulletsMaxTravel);
                this.super.getOffset(this, player.x, player.y, this.angle, (player.size/2));
                player.qTriggered = true;

                // For rapid fire, don't clear existing bullets - let them keep flying
                // For other guns, clear the list for fresh burst
                if (!(activeGun && activeGun.gunType === 'rapidfire')) {
                    this.bulletsList = [];
                }

                // Create bullets based on active gun type
                this.createBullets(player, activeGun, rewardManager);

                this.bulletsCreated = true;
                if (window.gameSound) window.gameSound.playShoot();
                this.bulletsSpawnNow = window.performance.now();
            }
        }

        // Update rapid fire bullets independently (they keep flying after qPressed resets)
        // Only run when qPressed is false to avoid double-updating
        if (!player.qPressed && activeGun && activeGun.gunType === 'rapidfire' && this.bulletsList.length > 0) {
            for (let i = this.bulletsList.length - 1; i >= 0; i--) {
                const bullet = this.bulletsList[i];
                if (!bullet) continue;

                // Update bullet if not already handled
                if (!bullet.destroy && !bullet.enemyCollision) {
                    bullet.update(homingTargets);
                    bullet.checkCollision(enemies.enemiesList, this.onChain.bind(this));
                }

                // Handle destroy/collision
                if (bullet.destroy || bullet.enemyCollision) {
                    if (bullet.enemyCollision) {
                        // Rapid fire: just remove the bullet that hit
                        this.bulletsList.splice(i, 1);
                    } else if (bullet.destroy) {
                        // Bullet missed - rapid fire doesn't reset streak
                        this.bulletsList.splice(i, 1);
                    }
                }
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
                return 1;  // Rapid fire shoots single bullets continuously
            case 'ricochet':
                return 3;  // Ricochet always creates 3 bullets
            case 'homing':
                return 3;  // Homing always creates 3 bullets
            default:
                return this.bulletsMax;
        }
    }

    // Create bullets based on gun type
    createBullets(player, activeGun, rewardManager) {
        // Apply size and range modifiers from reward manager
        let sizeMultiplier = rewardManager ? rewardManager.bulletSizeMod : 1;
        let rangeMultiplier = rewardManager ? rewardManager.rangeMod : 1;

        // Recalculate end position with range modifier - store for use by weapon functions
        this.modifiedMaxTravel = this.bulletsMaxTravel * rangeMultiplier;
        this.modifiedEndX = player.x + Math.cos(this.angle) * this.modifiedMaxTravel;
        this.modifiedEndY = player.y + Math.sin(this.angle) * this.modifiedMaxTravel;

        if (!activeGun) {
            // Default gun - use modified range
            for(let i = 0; i < this.bulletsMax; i++){
                let b = new Bullet(
                    this.offX, this.offY,
                    this.modifiedEndX, this.modifiedEndY,
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
                // Fallback to default - use modified range
                for(let i = 0; i < this.bulletsMax; i++){
                    let b = new Bullet(
                        this.offX, this.offY,
                        this.modifiedEndX, this.modifiedEndY,
                        this.bulletSize * ((100-(i*20))/100) * sizeMultiplier,
                        this.bulletColor,
                        this.bulletSpeed,
                        'Normal'
                    );
                    this.bulletsList.push(b);
                }
        }
    }

    // Convert internal angle to a full-circle angle for trig
    getFullAngle() {
        // atan2 already returns the correct full-circle angle (-PI to PI)
        return this.angle;
    }

    createShotgunBullets(player, gunData, sizeMultiplier) {
        const count = gunData.bulletCount || 7;
        const spreadAngle = (gunData.spreadAngle || 30) * Math.PI / 180;  // Tighter spread (was 45)
        const baseAngle = this.getFullAngle();
        const maxTravel = this.bulletsMaxTravel * (gunData.rangeMultiplier || 0.5);

        for (let i = 0; i < count; i++) {
            const angleOffset = (i / (count - 1) - 0.5) * spreadAngle;
            const bulletAngle = baseAngle + angleOffset;

            const endX = player.x + Math.cos(bulletAngle) * maxTravel;
            const endY = player.y + Math.sin(bulletAngle) * maxTravel;

            const b = new SpecialBullet(
                this.offX, this.offY,
                endX, endY,
                this.bulletSize * 0.8 * sizeMultiplier,
                this.bulletSpeed * 1.8,  // 2x faster than before
                'shotgun',
                gunData
            );
            b.fastSpawn = true;  // Flag for fast stagger spawn (3ms vs 10ms)
            b.followPlayer = player;  // Reference to player for position updates
            b.bulletAngle = bulletAngle;  // Store angle for recalculating position
            b.maxTravel = maxTravel;
            b.spawned = false;  // Track if bullet has started moving
            this.bulletsList.push(b);
        }
    }

    createRapidfireBullets(player, gunData, sizeMultiplier) {
        // Rapid fire shoots single fast bullets continuously
        const b = new SpecialBullet(
            this.offX, this.offY,
            this.modifiedEndX, this.modifiedEndY,
            this.bulletSize * 0.7 * sizeMultiplier,
            this.bulletSpeed * 1.5,
            'rapidfire',
            gunData
        );
        this.bulletsList.push(b);
    }

    createPiercingBullets(player, gunData, sizeMultiplier) {
        for (let i = 0; i < 3; i++) {
            const b = new SpecialBullet(
                this.offX, this.offY,
                this.modifiedEndX, this.modifiedEndY,
                this.bulletSize * ((100-(i*25))/100) * sizeMultiplier,
                this.bulletSpeed,
                'piercing',
                gunData
            );
            this.bulletsList.push(b);
        }
    }

    createRicochetBullets(player, gunData, sizeMultiplier) {
        // Ricochet bullets get 50% more base range
        const ricochetGunData = {
            ...gunData,
            rangeMultiplier: (gunData.rangeMultiplier || 1) * 1.5
        };

        for (let i = 0; i < 3; i++) {
            const b = new SpecialBullet(
                this.offX, this.offY,
                this.modifiedEndX, this.modifiedEndY,
                this.bulletSize * ((100-(i*20))/100) * sizeMultiplier,
                this.bulletSpeed * (gunData.speedMultiplier || 1),
                'ricochet',
                ricochetGunData
            );
            this.bulletsList.push(b);
        }
    }

    createHomingBullets(player, gunData, sizeMultiplier) {
        const baseAngle = this.getFullAngle();
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
        const fullAngle = this.getFullAngle();
        const perpX = -Math.sin(fullAngle);
        const perpY = Math.cos(fullAngle);

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spacing;
            const startX = this.offX + perpX * offset;
            const startY = this.offY + perpY * offset;
            const endXOffset = this.modifiedEndX + perpX * offset;
            const endYOffset = this.modifiedEndY + perpY * offset;

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
                gunData,
                player  // Pass player reference for nova to follow
            );
            this.bulletsList.push(b);
        }
    }

    createChainBullets(player, gunData, sizeMultiplier) {
        for (let i = 0; i < 3; i++) {
            const b = new SpecialBullet(
                this.offX, this.offY,
                this.modifiedEndX, this.modifiedEndY,
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

        // Check if we have rapid fire bullets that should always be drawn
        const hasRapidfireBullets = this.bulletsList.length > 0 &&
            this.bulletsList.some(b => b && b.gunType === 'rapidfire');

        if(this.bulletsSpawned == true || hasRapidfireBullets){
            // Draw all bullets (rapid fire bullets always get drawn)
            for(let i = 0; i < this.bulletsList.length; i++){
                if (this.bulletsList[i]) {
                    this.bulletsList[i].draw(context);
                }
            }
        }
        else if(this.bulletsSpawned == false && this.bulletsSpawnCount > 0){
            let max = this.bulletsSpawnCount;
            if(max <= this.bulletsList.length){
                for(let i = 0; i < max; i++){
                    if (this.bulletsList[i]) {
                        this.bulletsList[i].draw(context);
                    }
                }
            }
        }
    }
}