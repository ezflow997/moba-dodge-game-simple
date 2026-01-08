import { BossReward } from './bossReward.js';
import { CATEGORY, RARITY } from './rewardTypes.js';

export class RewardManager {
    constructor() {
        // Dropped rewards waiting to be picked up
        this.droppedRewards = [];

        // Active powerups with timers
        this.activeRewards = [];

        // Special gun currently equipped (null = default gun)
        this.activeGun = null;
        this.gunDurability = 0;

        // Extra lives
        this.extraLives = 0;

        // Shield charges
        this.shieldCharges = 0;

        // Ghost mode (phase through enemies)
        this.ghostMode = false;

        // Damage aura
        this.damageAura = null;

        // Score multiplier stack
        this.scoreMultiplier = 1.0;

        // Stat modifiers (stacking)
        this.qCooldownMod = 1.0;
        this.eCooldownMod = 1.0;
        this.fCooldownMod = 1.0;
        this.speedMod = 1.0;
        this.dashDistanceMod = 1.0;
        this.bulletSizeMod = 1.0;
        this.rangeMod = 1.0;
        this.playerSizeMod = 1.0;

        // Base values to track
        this.baseQCooldown = 1600;
        this.baseECooldown = 6100;
        this.baseFCooldown = 24000;
        this.baseSpeed = 4.1;

        // Notification queue for UI
        this.notifications = [];
    }

    reset() {
        this.droppedRewards = [];
        this.activeRewards = [];
        this.activeGun = null;
        this.gunDurability = 0;
        this.extraLives = 0;
        this.shieldCharges = 0;
        this.ghostMode = false;
        this.damageAura = null;
        this.scoreMultiplier = 1.0;
        this.qCooldownMod = 1.0;
        this.eCooldownMod = 1.0;
        this.fCooldownMod = 1.0;
        this.speedMod = 1.0;
        this.dashDistanceMod = 1.0;
        this.bulletSizeMod = 1.0;
        this.rangeMod = 1.0;
        this.playerSizeMod = 1.0;
        this.notifications = [];
    }

    // Spawn a reward drop at position
    spawnReward(x, y, specificReward = null) {
        const reward = new BossReward(x, y, specificReward);
        this.droppedRewards.push(reward);

        // Add spawn notification
        this.addNotification(`${reward.reward.rarity.name} drop!`, reward.reward.rarity.color);
    }

    // Add a text notification
    addNotification(text, color) {
        this.notifications.push({
            text: text,
            color: color,
            time: performance.now(),
            duration: 2000,
            y: 0
        });
    }

    // Called when gun is fired (decrease durability)
    onGunFired() {
        if (this.activeGun) {
            this.gunDurability--;
            if (this.gunDurability <= 0) {
                this.addNotification('Weapon depleted!', '#ff6666');
                this.activeGun = null;
                this.gunDurability = 0;
            }
        }
    }

    // Check if player can survive a hit (extra life or shield)
    canSurviveHit(isProjectile = false) {
        // Projectile shield first
        if (isProjectile && this.shieldCharges > 0) {
            this.shieldCharges--;
            this.addNotification('Shield blocked!', RARITY.RARE.color);
            return true;
        }

        // Ghost mode blocks enemy collision
        if (!isProjectile && this.ghostMode) {
            return true;
        }

        // Extra life
        if (this.extraLives > 0) {
            this.extraLives--;
            this.addNotification('Extra life used!', RARITY.EPIC.color);
            return true;
        }

        return false;
    }

    // Apply a collected reward
    applyReward(reward) {
        const now = performance.now();

        // Add collection notification
        this.addNotification(`${reward.name}!`, reward.rarity.color);

        // Handle by category
        switch (reward.category) {
            case CATEGORY.GUN:
                this.activeGun = reward;
                this.gunDurability = reward.durability;
                this.addNotification(`${reward.durability} shots`, reward.rarity.color);
                break;

            case CATEGORY.COOLDOWN:
                this.applyCooldownReward(reward, now);
                break;

            case CATEGORY.SURVIVABILITY:
                this.applySurvivabilityReward(reward, now);
                break;

            case CATEGORY.MOVEMENT:
                this.applyMovementReward(reward, now);
                break;

            case CATEGORY.OFFENSE:
                this.applyOffenseReward(reward, now);
                break;
        }

        // Add to active rewards for tracking (if timed)
        if (reward.duration && reward.duration > 0) {
            this.activeRewards.push({
                reward: reward,
                startTime: now,
                duration: reward.duration
            });
        } else if (reward.duration === -1) {
            // Permanent - still track for UI
            this.activeRewards.push({
                reward: reward,
                startTime: now,
                duration: -1,
                permanent: true
            });
        }
    }

    applyCooldownReward(reward, now) {
        const reduction = 1 - reward.reduction;
        switch (reward.ability) {
            case 'q':
                this.qCooldownMod *= reduction;
                break;
            case 'e':
                this.eCooldownMod *= reduction;
                break;
            case 'f':
                this.fCooldownMod *= reduction;
                break;
        }
    }

    applySurvivabilityReward(reward, now) {
        if (reward.lives) {
            this.extraLives += reward.lives;
        }
        if (reward.blockCount) {
            this.shieldCharges += reward.blockCount;
        }
        if (reward.sizeReduction) {
            this.playerSizeMod *= (1 - reward.sizeReduction);
        }
    }

    applyMovementReward(reward, now) {
        if (reward.speedBoost) {
            this.speedMod *= (1 + reward.speedBoost);
        }
        if (reward.dashBoost) {
            this.dashDistanceMod *= (1 + reward.dashBoost);
        }
        if (reward.phaseThrough) {
            this.ghostMode = true;
        }
    }

    applyOffenseReward(reward, now) {
        if (reward.scoreMultiplier) {
            this.scoreMultiplier *= reward.scoreMultiplier;
        }
        if (reward.sizeBoost) {
            this.bulletSizeMod *= (1 + reward.sizeBoost);
        }
        if (reward.rangeBoost) {
            this.rangeMod *= (1 + reward.rangeBoost);
        }
        if (reward.auraRadius) {
            this.damageAura = {
                radius: reward.auraRadius,
                damage: reward.auraDamage,
                lastTick: now
            };
        }
    }

    // Remove expired reward effects
    removeRewardEffects(reward) {
        switch (reward.category) {
            case CATEGORY.COOLDOWN:
                const restoration = 1 / (1 - reward.reduction);
                switch (reward.ability) {
                    case 'q': this.qCooldownMod *= restoration; break;
                    case 'e': this.eCooldownMod *= restoration; break;
                    case 'f': this.fCooldownMod *= restoration; break;
                }
                break;

            case CATEGORY.SURVIVABILITY:
                if (reward.sizeReduction) {
                    this.playerSizeMod /= (1 - reward.sizeReduction);
                }
                break;

            case CATEGORY.MOVEMENT:
                if (reward.speedBoost) {
                    this.speedMod /= (1 + reward.speedBoost);
                }
                if (reward.dashBoost) {
                    this.dashDistanceMod /= (1 + reward.dashBoost);
                }
                if (reward.phaseThrough) {
                    // Only disable if no other ghost mode active
                    const otherGhost = this.activeRewards.some(ar =>
                        ar.reward.phaseThrough && ar.reward.id !== reward.id
                    );
                    if (!otherGhost) this.ghostMode = false;
                }
                break;

            case CATEGORY.OFFENSE:
                if (reward.scoreMultiplier) {
                    this.scoreMultiplier /= reward.scoreMultiplier;
                }
                if (reward.sizeBoost) {
                    this.bulletSizeMod /= (1 + reward.sizeBoost);
                }
                if (reward.rangeBoost) {
                    this.rangeMod /= (1 + reward.rangeBoost);
                }
                if (reward.auraRadius) {
                    // Only remove if no other aura active
                    const otherAura = this.activeRewards.some(ar =>
                        ar.reward.auraRadius && ar.reward.id !== reward.id
                    );
                    if (!otherAura) this.damageAura = null;
                }
                break;
        }
    }

    update(player, game) {
        const now = performance.now();

        // Update dropped rewards
        for (let i = this.droppedRewards.length - 1; i >= 0; i--) {
            const drop = this.droppedRewards[i];
            const collectedReward = drop.update(player);

            if (collectedReward) {
                this.applyReward(collectedReward);
                if (window.gameSound) window.gameSound.playPickup && window.gameSound.playPickup();
            }

            if (drop.expired || drop.collected) {
                this.droppedRewards.splice(i, 1);
            }
        }

        // Update active rewards (check expiration)
        for (let i = this.activeRewards.length - 1; i >= 0; i--) {
            const active = this.activeRewards[i];

            if (active.permanent) continue;

            const elapsed = now - active.startTime;
            if (elapsed >= active.duration) {
                this.removeRewardEffects(active.reward);
                this.addNotification(`${active.reward.name} expired`, '#888888');
                this.activeRewards.splice(i, 1);
            }
        }

        // Update notifications
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notif = this.notifications[i];
            if (now - notif.time > notif.duration) {
                this.notifications.splice(i, 1);
            }
        }

        // Apply stat modifiers to player
        if (player) {
            // Q cooldown - also apply rapid fire gun modifier
            let qMod = this.qCooldownMod;
            if (this.activeGun && this.activeGun.cooldownMultiplier) {
                qMod *= this.activeGun.cooldownMultiplier;
            }
            player.qCoolDown = Math.floor(this.baseQCooldown * qMod);
            player.eCoolDown = Math.floor(this.baseECooldown * this.eCooldownMod);
            player.fCoolDown = Math.floor(this.baseFCooldown * this.fCooldownMod);

            // Speed modifier (applied to base speed)
            const baseSpeed = 4.1 * window.innerWidth / 2560 * 120 / 60;
            player.baseSpeed = baseSpeed * this.speedMod;

            // Size modifier
            const baseSize = 40 * window.innerWidth / 2560;
            player.size = baseSize * this.playerSizeMod;
        }

        // Damage aura tick
        if (this.damageAura && game && game.enemies) {
            const tickInterval = 500; // Damage every 0.5 seconds
            if (now - this.damageAura.lastTick > tickInterval) {
                this.damageAura.lastTick = now;
                this.applyDamageAura(player, game);
            }
        }
    }

    applyDamageAura(player, game) {
        if (!this.damageAura || !player) return;

        const enemies = game.enemies.enemiesList;
        const auraRadius = this.damageAura.radius * window.innerWidth / 2560;

        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < auraRadius) {
                // Kill enemy
                enemies.splice(i, 1);
                game.enemies.enemiesTakenDown++;
                game.score += game.enemies.enemyScoreValue;
                if (window.gameSound) window.gameSound.playEnemyDeath();

                // Effects
                if (game.effects) {
                    game.effects.spawnBurst(enemy.x, enemy.y, 'enemyDeath');
                }
            }
        }
    }

    draw(context, player) {
        const rX = window.innerWidth / 2560;

        // Draw dropped rewards
        for (const drop of this.droppedRewards) {
            drop.draw(context);
        }

        // Draw ghost mode effect on player
        if (this.ghostMode && player) {
            context.save();
            context.globalAlpha = 0.3;
            context.strokeStyle = '#00ffff';
            context.lineWidth = 2 * rX;
            context.setLineDash([5, 5]);
            context.beginPath();
            context.arc(player.x, player.y, player.size * 1.5, 0, Math.PI * 2);
            context.stroke();
            context.restore();
        }

        // Draw damage aura
        if (this.damageAura && player) {
            const auraRadius = this.damageAura.radius * rX;
            context.save();
            const gradient = context.createRadialGradient(
                player.x, player.y, 0,
                player.x, player.y, auraRadius
            );
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0.1)');
            gradient.addColorStop(0.7, 'rgba(255, 50, 50, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
            context.fill();

            // Pulsing ring
            context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            context.lineWidth = 2 * rX;
            context.beginPath();
            context.arc(player.x, player.y, auraRadius * (0.8 + Math.sin(performance.now() / 200) * 0.2), 0, Math.PI * 2);
            context.stroke();
            context.restore();
        }

        // Draw shield indicator
        if (this.shieldCharges > 0 && player) {
            context.save();
            context.strokeStyle = RARITY.RARE.color;
            context.lineWidth = 3 * rX;
            context.shadowColor = RARITY.RARE.color;
            context.shadowBlur = 10 * rX;
            context.beginPath();
            context.arc(player.x, player.y, player.size * 1.3, 0, Math.PI * 2);
            context.stroke();

            // Shield count
            context.fillStyle = '#ffffff';
            context.font = `bold ${12 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillText(`x${this.shieldCharges}`, player.x, player.y - player.size * 1.6);
            context.restore();
        }

        // Draw extra lives indicator
        if (this.extraLives > 0) {
            context.save();
            context.fillStyle = RARITY.EPIC.color;
            context.font = `bold ${18 * rX}px Arial`;
            context.textAlign = 'left';
            context.shadowColor = '#000000';
            context.shadowBlur = 4 * rX;
            context.fillText(`Lives: ${this.extraLives}`, 20 * rX, 30 * rX);
            context.restore();
        }

        // Draw notifications
        this.drawNotifications(context, rX);
    }

    drawNotifications(context, rX) {
        const now = performance.now();
        let yOffset = window.innerHeight * 0.15;

        context.save();
        context.textAlign = 'center';

        for (const notif of this.notifications) {
            const elapsed = now - notif.time;
            const progress = elapsed / notif.duration;
            const alpha = 1 - Math.pow(progress, 2);
            const slideUp = progress * 30 * rX;

            context.globalAlpha = alpha;
            context.font = `bold ${20 * rX}px Arial`;
            context.fillStyle = notif.color;
            context.shadowColor = '#000000';
            context.shadowBlur = 4 * rX;
            context.fillText(notif.text, window.innerWidth / 2, yOffset - slideUp);

            yOffset += 30 * rX;
        }

        context.restore();
    }

    // Draw the active rewards UI panel
    drawActiveRewardsUI(context) {
        const rX = window.innerWidth / 2560;
        const now = performance.now();

        // Position at top-left, below lives indicator
        let x = 20 * rX;
        let y = this.extraLives > 0 ? 50 * rX : 20 * rX;

        context.save();

        // Active gun display
        if (this.activeGun) {
            const gunColor = this.activeGun.rarity.color;
            const durabilityPercent = this.gunDurability / this.activeGun.durability;

            // Background
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillRect(x, y, 180 * rX, 45 * rX);

            // Gun name
            context.fillStyle = gunColor;
            context.font = `bold ${14 * rX}px Arial`;
            context.textAlign = 'left';
            context.fillText(this.activeGun.name, x + 10 * rX, y + 18 * rX);

            // Durability bar
            context.fillStyle = '#333333';
            context.fillRect(x + 10 * rX, y + 26 * rX, 160 * rX, 10 * rX);

            // Durability fill (color based on remaining)
            let barColor = gunColor;
            if (durabilityPercent < 0.25) barColor = '#ff0000';
            else if (durabilityPercent < 0.5) barColor = '#ffaa00';

            context.fillStyle = barColor;
            context.fillRect(x + 10 * rX, y + 26 * rX, 160 * rX * durabilityPercent, 10 * rX);

            // Durability text
            context.fillStyle = '#ffffff';
            context.font = `${10 * rX}px Arial`;
            context.fillText(`${this.gunDurability}/${this.activeGun.durability}`, x + 140 * rX, y + 18 * rX);

            y += 50 * rX;
        }

        // Score multiplier
        if (this.scoreMultiplier > 1) {
            context.fillStyle = RARITY.EPIC.color;
            context.font = `bold ${16 * rX}px Arial`;
            context.fillText(`Score x${this.scoreMultiplier.toFixed(1)}`, x, y + 15 * rX);
            y += 25 * rX;
        }

        // Active timed powerups (compact list)
        const timedRewards = this.activeRewards.filter(ar => !ar.permanent && ar.reward.category !== CATEGORY.GUN);

        if (timedRewards.length > 0) {
            context.fillStyle = '#ffffff';
            context.font = `${12 * rX}px Arial`;

            for (const active of timedRewards.slice(0, 5)) { // Show max 5
                const remaining = active.duration - (now - active.startTime);
                const seconds = Math.ceil(remaining / 1000);
                const color = active.reward.rarity.color;

                context.fillStyle = color;
                context.fillText(`${active.reward.name}: ${seconds}s`, x, y + 12 * rX);
                y += 18 * rX;
            }
        }

        context.restore();
    }
}
