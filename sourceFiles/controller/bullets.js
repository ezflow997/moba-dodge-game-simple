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
        this.homingMissileCount = 0;
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
                    game.rewardManager.onGunHit(); // Refund durability on hit
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
            if (enemies.boss) {
                homingTargets.push(enemies.boss);
            }
        }
        // Add test room dummies as homing targets
        if (game.testRoom && game.testRoom.active && game.testRoom.dummies) {
            for (const dummy of game.testRoom.dummies) {
                if (!dummy.dead) {
                    homingTargets.push(dummy);
                }
            }
        }
        // Store for use by createHomingBullets
        this.currentHomingTargets = homingTargets;

        if(player.qPressed == true){
            let msNow = window.performance.now();
            // Apply time scale from dev mode if available
            const timescale = game.devMode ? game.devMode.timescale : 1.0;
            // In test room, instantly complete cooldown
            const inTestRoom = game.testRoom && game.testRoom.active;
            player.qCoolDownElapsed = inTestRoom ? player.qCoolDown + 1 : (msNow - player.qPressedNow) * timescale;

            // In test room, reset bullet creation state to allow next shot immediately
            // Old bullets will continue updating via the independent bullets section
            if (inTestRoom && this.bulletsCreated) {
                this.bulletsCreated = false;
                this.bulletsSpawned = true;  // Keep true so old bullets continue drawing
                this.bulletsDeSpawned = true;  // Allow cooldown to reset
            }

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

                            // Handle homing missile boss hits - trigger effects
                            if (bullet.hitBoss && bullet.gunType === 'homing') {
                                if (game.effects) {
                                    game.effects.spawnBurst(bullet.bossHitX, bullet.bossHitY, 'bossHit');
                                    game.world.shake(8, 10);
                                }
                                if (window.gameSound) window.gameSound.playBossHit();
                                // Refund cooldown and allow shooting again
                                player.qCoolDownElapsed = 0;
                                player.qPressed = false;
                                player.qTriggered = true;
                                game.input.q_key += 60;
                                enemies.hitStreak += 1;
                                if (enemies.hitStreak > enemies.best_streak) {
                                    enemies.best_streak = enemies.hitStreak;
                                }
                                game.rewardManager.addScore(game, enemies.enemyScoreValue * enemies.hitStreak);
                                game.rewardManager.onGunHit();
                                bullet.hitBoss = false; // Clear flag so we don't trigger again
                            }

                            // Now handle destroy/collision states
                            if(bullet.destroy == true || bullet.enemyCollision == true){
                                if(bullet.enemyCollision == true){
                                    // Check if bullet type should be independent (not clear all on hit)
                                    // Use explicit flag OR gunType check for backwards compatibility
                                    const independentTypes = ['shotgun', 'nova', 'twin', 'homing', 'ricochet', 'piercing', 'rapidfire'];
                                    const isIndependent = bullet.isIndependentBullet === true || independentTypes.includes(bullet.gunType || bullet.bulletType);

                                    // For piercing bullets with pierce remaining, continue
                                    if (bullet.gunType === 'piercing' && bullet.pierceCount > 0) {
                                        bullet.enemyCollision = false;
                                        // Continue to next bullet, this one keeps moving
                                    // For ricochet bullets with bounces remaining, continue bouncing
                                    } else if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                                        bullet.enemyCollision = false;
                                    } else if (isIndependent) {
                                        // Independent bullets: remove only this bullet, others continue
                                        this.bulletsList.splice(i, 1);
                                    } else if (bullet.gunType === 'nova' || bullet.gunType === 'twin' || bullet.gunType === 'shotgun') {
                                        // Safeguard: these should always be independent, only remove this bullet
                                        this.bulletsList.splice(i, 1);
                                    } else {
                                        // Single-target weapons: clear all bullets
                                        this.bulletsList = [];
                                        this.bulletsHitTarget = true;
                                        break;
                                    }
                                }
                                else if(bullet.destroy == true){
                                    // Don't reset streak for multi-hit weapons (rapidfire, piercing, ricochet)
                                    // These fire multiple bullets or hit multiple targets - individual misses shouldn't reset streak
                                    const noStreakReset = ['rapidfire', 'piercing', 'ricochet', 'shotgun', 'twin', 'nova', 'homing'];
                                    if (!noStreakReset.includes(bullet.gunType) && !bullet.isIndependentBullet) {
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

                            // Handle homing missile boss hits - trigger effects
                            if (bullet.hitBoss && bullet.gunType === 'homing') {
                                if (game.effects) {
                                    game.effects.spawnBurst(bullet.bossHitX, bullet.bossHitY, 'bossHit');
                                    game.world.shake(8, 10);
                                }
                                if (window.gameSound) window.gameSound.playBossHit();
                                player.qCoolDownElapsed = 0;
                                player.qPressed = false;
                                player.qTriggered = true;
                                game.input.q_key += 60;
                                enemies.hitStreak += 1;
                                if (enemies.hitStreak > enemies.best_streak) {
                                    enemies.best_streak = enemies.hitStreak;
                                }
                                game.rewardManager.addScore(game, enemies.enemyScoreValue * enemies.hitStreak);
                                game.rewardManager.onGunHit();
                                bullet.hitBoss = false;
                            }

                            // Now handle collision states
                            if(bullet.destroy == true || bullet.enemyCollision == true){
                                if(bullet.enemyCollision == true){
                                    // Check if bullet type should be independent (not clear all on hit)
                                    // Use explicit flag OR gunType check for backwards compatibility
                                    const independentTypes = ['shotgun', 'nova', 'twin', 'homing', 'ricochet', 'piercing', 'rapidfire'];
                                    const isIndependent = bullet.isIndependentBullet === true || independentTypes.includes(bullet.gunType || bullet.bulletType);

                                    // For piercing bullets with pierce remaining, continue
                                    if (bullet.gunType === 'piercing' && bullet.pierceCount > 0) {
                                        bullet.enemyCollision = false;
                                    // For ricochet bullets with bounces remaining, continue bouncing
                                    } else if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                                        bullet.enemyCollision = false;
                                    } else if (isIndependent) {
                                        // Independent bullets: remove only this bullet, others continue
                                        this.bulletsList.splice(i, 1);
                                    } else if (bullet.gunType === 'nova' || bullet.gunType === 'twin' || bullet.gunType === 'shotgun') {
                                        // Safeguard: these should always be independent, only remove this bullet
                                        this.bulletsList.splice(i, 1);
                                    } else {
                                        // Single-target weapons: clear all bullets
                                        this.bulletsList = [];
                                        this.bulletsHitTarget = true;
                                        break;
                                    }
                                }
                                else if(bullet.destroy == true){
                                    // Don't reset streak for multi-hit weapons (rapidfire, piercing, ricochet)
                                    // These fire multiple bullets or hit multiple targets - individual misses shouldn't reset streak
                                    const noStreakReset = ['rapidfire', 'piercing', 'ricochet', 'shotgun', 'twin', 'nova', 'homing'];
                                    if (!noStreakReset.includes(bullet.gunType) && !bullet.isIndependentBullet) {
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

                // For independent weapons (rapidfire, homing, etc.), don't clear existing bullets
                // Let them keep flying while new ones are added
                const independentGunTypes = ['rapidfire', 'homing', 'shotgun', 'nova', 'twin', 'ricochet', 'piercing'];
                if (!(activeGun && independentGunTypes.includes(activeGun.gunType))) {
                    this.bulletsList = [];
                }

                // Create bullets based on active gun type
                this.createBullets(player, activeGun, rewardManager, game);

                this.bulletsCreated = true;
                // Play weapon-specific sound
                if (window.gameSound) {
                    const gunType = activeGun ? activeGun.gunType : null;
                    switch (gunType) {
                        case 'shotgun': window.gameSound.playShootShotgun(); break;
                        case 'rapidfire': window.gameSound.playShootRapidfire(); break;
                        case 'piercing': window.gameSound.playShootPiercing(); break;
                        case 'ricochet': window.gameSound.playShootRicochet(); break;
                        case 'homing': window.gameSound.playShootHoming(); break;
                        case 'twin': window.gameSound.playShootTwin(); break;
                        case 'nova': window.gameSound.playShootNova(); break;
                        case 'chain': window.gameSound.playShootChain(); break;
                        default: window.gameSound.playShoot(); break;
                    }
                }
                this.bulletsSpawnNow = window.performance.now();
            }
        }

        // Update independent bullets (rapidfire, ricochet, etc.) after qPressed resets
        // They keep flying after cooldown completes - only run when qPressed is false to avoid double-updating
        // Also update in test room so bullets continue animating after instant cooldown reset
        const independentUpdateTypes = ['rapidfire', 'ricochet', 'homing', 'piercing', 'shotgun', 'twin', 'nova'];
        const inTestRoomForUpdate = game.testRoom && game.testRoom.active;
        const needsIndependentUpdate = (activeGun && independentUpdateTypes.includes(activeGun.gunType)) ||
            this.bulletsList.some(b => b && b.isIndependentBullet) ||
            inTestRoomForUpdate;

        if (!player.qPressed && needsIndependentUpdate && this.bulletsList.length > 0) {
            for (let i = this.bulletsList.length - 1; i >= 0; i--) {
                const bullet = this.bulletsList[i];
                if (!bullet) continue;

                // Update bullet if not already handled
                if (!bullet.destroy && !bullet.enemyCollision) {
                    bullet.update(homingTargets);
                    bullet.checkCollision(enemies.enemiesList, this.onChain.bind(this));
                }

                // Handle homing missile boss hits - trigger effects
                if (bullet.hitBoss && bullet.gunType === 'homing') {
                    if (game.effects) {
                        game.effects.spawnBurst(bullet.bossHitX, bullet.bossHitY, 'bossHit');
                        game.world.shake(8, 10);
                    }
                    if (window.gameSound) window.gameSound.playBossHit();
                    player.qCoolDownElapsed = 0;
                    player.qPressed = false;
                    player.qTriggered = true;
                    game.input.q_key += 60;
                    enemies.hitStreak += 1;
                    if (enemies.hitStreak > enemies.best_streak) {
                        enemies.best_streak = enemies.hitStreak;
                    }
                    game.rewardManager.addScore(game, enemies.enemyScoreValue * enemies.hitStreak);
                    game.rewardManager.onGunHit();
                    bullet.hitBoss = false;
                }

                // Handle destroy/collision
                if (bullet.destroy || bullet.enemyCollision) {
                    if (bullet.enemyCollision) {
                        // For ricochet bullets with bounces remaining, continue bouncing
                        if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                            bullet.enemyCollision = false;
                        } else {
                            // Remove only this bullet that hit - others continue
                            this.bulletsList.splice(i, 1);
                        }
                    } else if (bullet.destroy) {
                        // Don't reset streak for multi-hit weapons (rapidfire, piercing, ricochet, shotgun)
                        // These fire multiple bullets or hit multiple targets - individual misses shouldn't reset streak
                        const noStreakReset = ['rapidfire', 'piercing', 'ricochet', 'shotgun', 'twin', 'nova', 'homing'];
                        if (!noStreakReset.includes(bullet.gunType) && !bullet.isIndependentBullet) {
                            enemies.hitStreak = 0;
                        }
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
                // Return actual missile count (set by createHomingBullets)
                return this.homingMissileCount || 3;
            default:
                return this.bulletsMax;
        }
    }

    // Create bullets based on gun type
    createBullets(player, activeGun, rewardManager, game) {
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
            rewardManager.onGunFired(game);
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
        const spreadAngle = (gunData.spreadAngle || 30) * Math.PI / 180;
        const baseAngle = this.getFullAngle();
        const maxTravel = this.bulletsMaxTravel * (gunData.rangeMultiplier || 0.5);

        // Random spread factor - higher tiers have tighter grouping
        const randomSpreadFactor = gunData.randomSpread || 0.4;

        for (let i = 0; i < count; i++) {
            // Base angle offset within the cone
            const baseOffset = (i / (count - 1) - 0.5) * spreadAngle;
            // Add randomness to each pellet's angle
            const randomOffset = (Math.random() - 0.5) * spreadAngle * randomSpreadFactor;
            const bulletAngle = baseAngle + baseOffset + randomOffset;

            // Slight random variation in speed for more natural feel
            const speedVariation = 0.9 + Math.random() * 0.2;

            const endX = player.x + Math.cos(bulletAngle) * maxTravel;
            const endY = player.y + Math.sin(bulletAngle) * maxTravel;

            const b = new SpecialBullet(
                this.offX, this.offY,
                endX, endY,
                this.bulletSize * 0.8 * sizeMultiplier,
                this.bulletSpeed * 1.8 * speedVariation,
                'shotgun',
                gunData
            );
            b.instantSpawn = true;  // All pellets fire at once
            b.spawned = true;  // Already spawned - no stagger delay
            b.isIndependentBullet = true;  // Explicit flag for independent collision handling
            this.bulletsList.push(b);
        }

        // Immediately mark all bullets as spawned for instant fire
        this.bulletsSpawnCount = count;
        this.bulletsSpawned = true;
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

        // Filter to only visible/in-bounds enemies for missile count
        const visibleTargets = this.currentHomingTargets ? this.currentHomingTargets.filter(e => {
            return e.x >= 0 && e.x <= window.innerWidth &&
                   e.y >= 0 && e.y <= window.innerHeight;
        }) : [];

        // Only create missiles for the number of visible targets (max 3)
        const targetCount = visibleTargets.length;
        const missileCount = Math.min(Math.max(targetCount, 1), 3); // At least 1, max 3

        // Store actual missile count for getMaxBullets
        this.homingMissileCount = missileCount;

        for (let i = 0; i < missileCount; i++) {
            // Spread missiles based on count
            let spreadAngle;
            if (missileCount === 1) {
                spreadAngle = 0;
            } else if (missileCount === 2) {
                spreadAngle = (i - 0.5) * 0.3;
            } else {
                spreadAngle = (i - 1) * 0.3;
            }

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
            // Assign target preference so each missile targets a different enemy
            b.targetPreference = i; // 0 = closest, 1 = 2nd closest, 2 = 3rd closest
            b.isIndependentBullet = true; // Each missile is handled independently
            b.instantSpawn = true;
            b.spawned = true;
            this.bulletsList.push(b);
        }

        // Immediately mark all bullets as spawned for instant fire
        this.bulletsSpawnCount = missileCount;
        this.bulletsSpawned = true;
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
            b.instantSpawn = true;  // All bullets fire at once
            b.spawned = true;  // Already spawned - no stagger delay
            b.isIndependentBullet = true;  // Explicit flag for independent collision handling
            this.bulletsList.push(b);
        }

        // Immediately mark all bullets as spawned for instant fire
        this.bulletsSpawnCount = count;
        this.bulletsSpawned = true;
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
            b.isIndependentBullet = true;  // Ensure each bullet is handled independently
            this.bulletsList.push(b);
        }

        // Immediately mark all bullets as spawned for instant fire
        this.bulletsSpawnCount = count;
        this.bulletsSpawned = true;
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
    draw(context, game){
        // Draw chain lightning bolts
        for (const bolt of this.chainBolts) {
            bolt.draw(context);
        }

        // Check if we have independent bullets that should always be drawn
        // Also always draw bullets in test room
        const independentDrawTypes = ['rapidfire', 'shotgun', 'ricochet', 'piercing', 'homing', 'nova', 'twin'];
        const inTestRoom = game && game.testRoom && game.testRoom.active;
        const hasIndependentBullets = this.bulletsList.length > 0 &&
            (inTestRoom || this.bulletsList.some(b => b && independentDrawTypes.includes(b.gunType)));

        if(this.bulletsSpawned == true || hasIndependentBullets){
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