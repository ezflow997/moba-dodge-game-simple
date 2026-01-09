import { BossReward } from './bossReward.js';
import { CATEGORY, RARITY } from './rewardTypes.js';

export class RewardManager {
    constructor() {
        // Dropped rewards waiting to be picked up
        this.droppedRewards = [];

        // Active powerups with timers
        this.activeRewards = [];

        // Weapon slot system: 2 slots
        // Slot 0 = Default gun (null, cannot be replaced)
        // Slot 1 = Upgrade gun slot (stores picked up gun upgrades)
        this.weaponSlots = [
            { gun: null, durability: 0 },  // Slot 0: Default - always null
            { gun: null, durability: 0 }   // Slot 1: Upgrade slot
        ];
        this.currentSlot = 0;  // Currently active slot (0 = default, 1 = upgrade)

        // Legacy support - activeGun getter for compatibility
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
        // Reset weapon slots
        this.weaponSlots = [
            { gun: null, durability: 0 },
            { gun: null, durability: 0 }
        ];
        this.currentSlot = 0;
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

    // Cycle weapon slots with Tab key
    cycleWeaponSlot() {
        // Only cycle if slot 1 has a weapon
        if (this.weaponSlots[1].gun) {
            this.currentSlot = this.currentSlot === 0 ? 1 : 0;
            this.updateActiveGun();
            const slotName = this.currentSlot === 0 ? 'Default Gun' : this.weaponSlots[1].gun.name;
            this.addNotification(`Switched to: ${slotName}`, this.currentSlot === 0 ? '#ffffff' : this.weaponSlots[1].gun.rarity.color);
        } else {
            this.addNotification('No upgrade in slot!', '#888888');
        }
    }

    // Update activeGun based on current slot
    updateActiveGun() {
        if (this.currentSlot === 0) {
            this.activeGun = null;
            this.gunDurability = 0;
        } else {
            this.activeGun = this.weaponSlots[1].gun;
            this.gunDurability = this.weaponSlots[1].durability;
        }
    }

    // Check if upgrade slot has a weapon
    hasUpgradeWeapon() {
        return this.weaponSlots[1].gun !== null;
    }

    // Get upgrade slot weapon info
    getUpgradeSlot() {
        return this.weaponSlots[1];
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
        // Only decrease durability if using upgrade slot (slot 1)
        if (this.currentSlot === 1 && this.weaponSlots[1].gun) {
            this.weaponSlots[1].durability--;
            this.gunDurability = this.weaponSlots[1].durability;

            if (this.weaponSlots[1].durability <= 0) {
                this.addNotification('Weapon depleted!', '#ff6666');
                this.weaponSlots[1].gun = null;
                this.weaponSlots[1].durability = 0;
                // Auto-switch back to default
                this.currentSlot = 0;
                this.updateActiveGun();
            }
        }
        // Default gun (slot 0) has infinite ammo, no decrease
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
                // Store gun in upgrade slot (slot 1)
                this.weaponSlots[1].gun = reward;
                this.weaponSlots[1].durability = reward.durability;
                // Auto-switch to the new weapon
                this.currentSlot = 1;
                this.updateActiveGun();
                this.addNotification(`${reward.durability} shots - Press TAB to switch`, reward.rarity.color);
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

    // Apply multiple starter rewards at game start (from shop loadout)
    applyStarterRewards(rewards) {
        if (!rewards || rewards.length === 0) return;

        // Apply each reward
        for (const reward of rewards) {
            this.applyReward(reward);
        }

        // Show notification about starter rewards
        if (rewards.length > 0) {
            this.addNotification(`${rewards.length} starter reward${rewards.length > 1 ? 's' : ''} applied!`, '#ffcc00');
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
                lastTick: this.damageAura ? this.damageAura.lastTick : now
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
                if (reward.blockCount) {
                    this.shieldCharges = Math.max(0, this.shieldCharges - reward.blockCount);
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

        // Make bullet modifiers accessible for the bullets system
        this.currentRangeMod = this.rangeMod;
        this.currentBulletSizeMod = this.bulletSizeMod;

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

        const auraRadius = this.damageAura.radius * window.innerWidth / 2560;

        // Check regular enemies
        if (game.enemies && game.enemies.enemiesList) {
            const enemies = game.enemies.enemiesList;
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

        // Check test room dummies
        if (game.testRoom && game.testRoom.active && game.testRoom.dummies) {
            for (const dummy of game.testRoom.dummies) {
                if (dummy.dead) continue;

                const dx = dummy.x - player.x;
                const dy = dummy.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < auraRadius) {
                    // Damage dummy
                    const damage = game.devMode ? 100 * game.devMode.damageMultiplier : 100;
                    dummy.takeDamage(damage);

                    // Effects
                    if (game.effects) {
                        game.effects.spawnBurst(dummy.x, dummy.y, 'enemyDeath');
                    }

                    // Check if dummy died
                    if (dummy.dead && dummy.respawnTime === 0) {
                        dummy.respawnTime = performance.now() + 3000;
                    }
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

    // Draw weapon slots UI (bottom-right corner)
    drawWeaponSlotsUI(context) {
        const rX = window.innerWidth / 2560;
        const slotWidth = 90 * rX;
        const slotHeight = 70 * rX;
        const slotGap = 10 * rX;
        const padding = 20 * rX;

        // Position at bottom-right
        const startX = window.innerWidth - (slotWidth * 2 + slotGap + padding);
        const startY = window.innerHeight - slotHeight - padding;

        context.save();

        // Draw both slots
        for (let i = 0; i < 2; i++) {
            const slot = this.weaponSlots[i];
            const x = startX + i * (slotWidth + slotGap);
            const y = startY;
            const isActive = this.currentSlot === i;

            // Slot background
            context.fillStyle = isActive ? 'rgba(80, 80, 80, 0.9)' : 'rgba(30, 30, 30, 0.8)';
            context.fillRect(x, y, slotWidth, slotHeight);

            // Slot border (highlight active slot)
            if (isActive) {
                context.strokeStyle = '#00ffff';
                context.lineWidth = 3 * rX;
                context.shadowColor = '#00ffff';
                context.shadowBlur = 10 * rX;
            } else {
                context.strokeStyle = '#555555';
                context.lineWidth = 2 * rX;
                context.shadowBlur = 0;
            }
            context.strokeRect(x, y, slotWidth, slotHeight);
            context.shadowBlur = 0;

            // Slot number/label
            context.fillStyle = isActive ? '#ffffff' : '#888888';
            context.font = `bold ${10 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillText(i === 0 ? 'DEFAULT' : 'UPGRADE', x + slotWidth / 2, y + 14 * rX);

            // Slot content
            if (i === 0) {
                // Default gun slot - show pistol icon
                this.drawSlotPistolIcon(context, x + slotWidth / 2, y + 40 * rX, 18 * rX, isActive);
            } else if (slot.gun) {
                // Upgrade slot with weapon
                const gunColor = slot.gun.rarity.color;

                // Weapon name
                context.fillStyle = gunColor;
                context.font = `bold ${11 * rX}px Arial`;
                context.textAlign = 'center';
                const shortName = slot.gun.name.length > 12 ? slot.gun.name.slice(0, 11) + '…' : slot.gun.name;
                context.fillText(shortName, x + slotWidth / 2, y + 32 * rX);

                // Weapon type icon
                this.drawSlotWeaponIcon(context, x + slotWidth / 2, y + 46 * rX, 12 * rX, slot.gun, gunColor);

                // Durability bar
                const barWidth = slotWidth - 16 * rX;
                const barHeight = 6 * rX;
                const barX = x + 8 * rX;
                const barY = y + slotHeight - 12 * rX;
                const durabilityPercent = slot.durability / slot.gun.durability;

                // Background
                context.fillStyle = '#222222';
                context.fillRect(barX, barY, barWidth, barHeight);

                // Fill
                let barColor = gunColor;
                if (durabilityPercent < 0.25) barColor = '#ff4444';
                else if (durabilityPercent < 0.5) barColor = '#ffaa00';
                context.fillStyle = barColor;
                context.fillRect(barX, barY, barWidth * durabilityPercent, barHeight);
            } else {
                // Empty upgrade slot
                context.fillStyle = '#444444';
                context.font = `${12 * rX}px Arial`;
                context.textAlign = 'center';
                context.fillText('Empty', x + slotWidth / 2, y + 42 * rX);
            }
        }

        // Tab key hint
        context.fillStyle = '#aaaaaa';
        context.font = `${11 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillText('TAB to switch', startX + slotWidth + slotGap / 2, startY - 8 * rX);

        context.restore();
    }

    // Draw pistol icon for default slot
    drawSlotPistolIcon(context, cx, cy, size, isActive) {
        context.save();
        context.strokeStyle = isActive ? '#ffffff' : '#888888';
        context.fillStyle = isActive ? '#cccccc' : '#666666';
        context.lineWidth = 2;

        // Simple pistol shape
        context.beginPath();
        context.moveTo(cx - size * 0.6, cy);
        context.lineTo(cx + size * 0.6, cy);
        context.lineTo(cx + size * 0.6, cy - size * 0.2);
        context.lineTo(cx - size * 0.3, cy - size * 0.2);
        context.lineTo(cx - size * 0.3, cy + size * 0.5);
        context.lineTo(cx - size * 0.5, cy + size * 0.5);
        context.lineTo(cx - size * 0.5, cy);
        context.closePath();
        context.fill();
        context.stroke();

        context.restore();
    }

    // Draw weapon type icon for upgrade slot
    drawSlotWeaponIcon(context, cx, cy, size, gun, color) {
        context.save();
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = 2;

        const type = gun.weaponType || 'basic';

        switch (type) {
            case 'shotgun':
                // Multiple lines spreading out
                for (let i = -2; i <= 2; i++) {
                    const angle = i * 0.15;
                    context.beginPath();
                    context.moveTo(cx, cy);
                    context.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size * 0.5);
                    context.stroke();
                }
                break;
            case 'homing':
                // Curved arrow
                context.beginPath();
                context.arc(cx, cy, size * 0.6, Math.PI * 0.5, Math.PI * 1.5, false);
                context.stroke();
                context.beginPath();
                context.moveTo(cx, cy - size * 0.6);
                context.lineTo(cx + size * 0.3, cy - size * 0.3);
                context.lineTo(cx - size * 0.1, cy - size * 0.3);
                context.fill();
                break;
            case 'nova':
                // Star burst
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    context.beginPath();
                    context.moveTo(cx, cy);
                    context.lineTo(cx + Math.cos(angle) * size * 0.6, cy + Math.sin(angle) * size * 0.6);
                    context.stroke();
                }
                break;
            case 'chain':
                // Lightning bolt
                context.beginPath();
                context.moveTo(cx - size * 0.3, cy - size * 0.5);
                context.lineTo(cx + size * 0.1, cy);
                context.lineTo(cx - size * 0.1, cy);
                context.lineTo(cx + size * 0.3, cy + size * 0.5);
                context.stroke();
                break;
            case 'piercing':
                // Arrow through
                context.beginPath();
                context.moveTo(cx - size * 0.5, cy);
                context.lineTo(cx + size * 0.5, cy);
                context.moveTo(cx + size * 0.3, cy - size * 0.3);
                context.lineTo(cx + size * 0.5, cy);
                context.lineTo(cx + size * 0.3, cy + size * 0.3);
                context.stroke();
                break;
            case 'rapidfire':
                // Triple dots
                for (let i = -1; i <= 1; i++) {
                    context.beginPath();
                    context.arc(cx + i * size * 0.4, cy, size * 0.15, 0, Math.PI * 2);
                    context.fill();
                }
                break;
            case 'ricochet':
                // Bouncing line
                context.beginPath();
                context.moveTo(cx - size * 0.5, cy - size * 0.3);
                context.lineTo(cx, cy + size * 0.3);
                context.lineTo(cx + size * 0.5, cy - size * 0.3);
                context.stroke();
                break;
            default:
                // Simple bullet
                context.beginPath();
                context.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
                context.fill();
        }

        context.restore();
    }

    // Draw combined stats panel at bottom-right (above weapon slots)
    drawActiveRewardsUI(context) {
        // Empty - combined into drawPermanentUpgradesUI
    }

    // Draw all active stats and timers at bottom-right
    drawPermanentUpgradesUI(context, game) {
        const rX = window.innerWidth / 2560;
        const now = performance.now();
        const panelWidth = 170 * rX;
        const x = window.innerWidth - panelWidth - 220 * rX;  // Left of weapon slots
        let y = window.innerHeight - 20 * rX;  // Start from bottom, go up

        // Get control scheme for proper keybind display
        const controlScheme = game && game.pauseMenu ? game.pauseMenu.controlScheme : 'mouse';
        // In WASD mode: Q ability = F key (ult), E ability = E key (dash), Shoot = click
        // In Mouse mode: Q = Q, E = E, F = F
        const qLabel = controlScheme === 'wasd' ? 'Shoot' : 'Q';
        const eLabel = controlScheme === 'wasd' ? 'Dash' : 'E';
        const fLabel = controlScheme === 'wasd' ? 'Ult' : 'F';

        // Collect timed rewards
        const timedRewards = this.activeRewards.filter(ar => !ar.permanent && ar.reward.category !== CATEGORY.GUN);

        // Build permanent stats display
        const stats = [];

        // Cooldowns (show as reduction percentage with correct keybind labels)
        if (this.qCooldownMod !== 1) {
            const reduction = Math.round((1 - this.qCooldownMod) * 100);
            stats.push({ label: `${qLabel} CD`, value: `-${reduction}%`, color: '#ffff00' });
        }
        if (this.eCooldownMod !== 1) {
            const reduction = Math.round((1 - this.eCooldownMod) * 100);
            stats.push({ label: `${eLabel} CD`, value: `-${reduction}%`, color: '#ff8800' });
        }
        if (this.fCooldownMod !== 1) {
            const reduction = Math.round((1 - this.fCooldownMod) * 100);
            stats.push({ label: `${fLabel} CD`, value: `-${reduction}%`, color: '#ff00ff' });
        }

        // Survivability (permanent)
        if (this.extraLives > 0) {
            stats.push({ label: 'Lives', value: `+${this.extraLives}`, color: '#ff4444' });
        }
        if (this.shieldCharges > 0) {
            stats.push({ label: 'Shield', value: `x${this.shieldCharges}`, color: '#4488ff' });
        }

        // Check if anything to display
        if (stats.length === 0 && timedRewards.length === 0) return;

        context.save();
        context.textAlign = 'left';

        // Calculate total height needed (going upward from bottom)
        const lineHeight = 16 * rX;
        const titleHeight = 20 * rX;
        let totalHeight = 0;
        if (timedRewards.length > 0) totalHeight += titleHeight + (Math.min(timedRewards.length, 5) * lineHeight);
        if (stats.length > 0) totalHeight += titleHeight + (stats.length * lineHeight);
        if (timedRewards.length > 0 && stats.length > 0) totalHeight += 8 * rX; // gap between sections

        // Start drawing from calculated top position
        y = window.innerHeight - 100 * rX - totalHeight;

        // Draw permanent modifiers section first (at top of panel)
        if (stats.length > 0) {
            // Title
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(x - 5 * rX, y - 2 * rX, panelWidth + 10 * rX, titleHeight);
            context.fillStyle = '#ffcc00';
            context.font = `bold ${11 * rX}px Arial`;
            context.fillText('PERMANENT', x, y + 12 * rX);
            y += titleHeight;

            context.font = `${10 * rX}px Arial`;
            for (const stat of stats) {
                context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                context.fillRect(x - 5 * rX, y, panelWidth + 10 * rX, lineHeight - 2 * rX);
                context.fillStyle = stat.color;
                context.fillText(`${stat.label}: ${stat.value}`, x, y + 11 * rX);
                y += lineHeight;
            }
            y += 8 * rX;  // Gap
        }

        // Draw timed powerups section
        if (timedRewards.length > 0) {
            // Title
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(x - 5 * rX, y - 2 * rX, panelWidth + 10 * rX, titleHeight);
            context.fillStyle = '#00ffff';
            context.font = `bold ${11 * rX}px Arial`;
            context.fillText('ACTIVE TIMERS', x, y + 12 * rX);
            y += titleHeight;

            context.font = `${10 * rX}px Arial`;
            for (const active of timedRewards.slice(0, 5)) {
                const remaining = active.duration - (now - active.startTime);
                const seconds = Math.ceil(remaining / 1000);
                const color = active.reward.rarity.color;

                context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                context.fillRect(x - 5 * rX, y, panelWidth + 10 * rX, lineHeight - 2 * rX);
                context.fillStyle = color;
                context.fillText(`${active.reward.name}: ${seconds}s`, x, y + 11 * rX);
                y += lineHeight;
            }
        }

        context.restore();
    }
}
