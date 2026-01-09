/**
 * PowerupHUD - Unified HUD rendering for abilities, powerups, and weapon slots
 * Features circular radial timers with icon grey-out effect
 */

import { IconLibrary } from './iconLibrary.js';
import { CATEGORY } from '../controller/rewardTypes.js';

export class PowerupHUD {
    constructor() {
        // Layout configuration
        this.abilitySize = 50;      // Ability icon diameter
        this.weaponSlotWidth = 85;  // Weapon slot width
        this.weaponSlotHeight = 70; // Weapon slot height
        this.powerupSize = 36;      // Active powerup icon diameter
        this.badgeSize = 22;        // Permanent upgrade badge size
        this.padding = 15;          // Edge padding
        this.gap = 8;               // Gap between elements

        // Colors for abilities
        this.abilityColors = {
            Q: { primary: '#00ffff', ring: '#00aaff', background: 'rgba(0, 40, 60, 0.9)' },
            E: { primary: '#ff8800', ring: '#ffaa00', background: 'rgba(60, 30, 0, 0.9)' },
            F: { primary: '#ff00ff', ring: '#aa00ff', background: 'rgba(50, 0, 50, 0.9)' }
        };
    }

    /**
     * Main draw method - renders entire HUD
     */
    draw(ctx, game) {
        const rX = window.innerWidth / 2560;

        // Calculate positions for unified action bar (bottom-right)
        // Extra padding (25px) for keybind labels below icons
        const actionBarY = window.innerHeight - this.padding * rX - this.abilitySize * rX - 25 * rX;

        // Draw sections from bottom to top
        this.drawActionBar(ctx, game, rX, actionBarY);
        this.drawPermanentUpgrades(ctx, game, rX, actionBarY - 35 * rX);
        this.drawActiveTimers(ctx, game, rX, actionBarY - 90 * rX);
    }

    /**
     * Draw the action bar (abilities + weapon slots)
     */
    drawActionBar(ctx, game, rX, y) {
        const player = game.player;
        const rewardManager = game.rewardManager;
        const pauseMenu = game.pauseMenu;

        // Get control scheme for label display
        const controlScheme = pauseMenu ? pauseMenu.controlScheme : 'mouse';

        // Calculate starting X position (from right edge)
        const weaponSlotsWidth = (this.weaponSlotWidth * 2 + this.gap) * rX;
        const abilitiesWidth = (this.abilitySize * 3 + this.gap * 2) * rX;
        const totalWidth = weaponSlotsWidth + abilitiesWidth + this.gap * 2 * rX;
        const startX = window.innerWidth - this.padding * rX - totalWidth;

        // Draw abilities (Q, E, F) on the left side of action bar
        this.drawAbilities(ctx, player, rX, startX, y, controlScheme);

        // Draw weapon slots on the right side
        const weaponX = startX + abilitiesWidth + this.gap * 2 * rX;
        this.drawWeaponSlots(ctx, rewardManager, rX, weaponX, y);
    }

    /**
     * Draw ability cooldown circles
     */
    drawAbilities(ctx, player, rX, startX, y, controlScheme) {
        const size = this.abilitySize * rX;
        const centerY = y + size / 2;

        // Labels based on control scheme
        const labels = controlScheme === 'wasd'
            ? { Q: 'LMB', E: 'E', F: 'F' }
            : { Q: 'Q', E: 'E', F: 'F' };

        // Q Ability (Shoot)
        const qCenterX = startX + size / 2;
        const qProgress = player.qPressed ? player.qCoolDownElapsed / player.qCoolDown : 1;
        const qReady = !player.qPressed;  // Ready when cooldown is complete
        IconLibrary.drawAbilityCooldown(ctx, qCenterX, centerY, size / 2, 'Q', qProgress, qReady, this.abilityColors.Q);
        this.drawAbilityLabel(ctx, qCenterX, centerY + size / 2 + 12 * rX, labels.Q, rX);

        // E Ability (Dash)
        const eCenterX = startX + size + this.gap * rX + size / 2;
        const eProgress = player.ePressed ? player.eCoolDownElapsed / player.eCoolDown : 1;
        const eReady = !player.ePressed;  // Ready when cooldown is complete
        IconLibrary.drawAbilityCooldown(ctx, eCenterX, centerY, size / 2, 'E', eProgress, eReady, this.abilityColors.E);
        this.drawAbilityLabel(ctx, eCenterX, centerY + size / 2 + 12 * rX, labels.E, rX);

        // F Ability (Ultimate)
        const fCenterX = startX + (size + this.gap * rX) * 2 + size / 2;
        const fProgress = player.fPressed ? player.fCoolDownElapsed / player.fCoolDown : 1;
        const fReady = !player.fPressed;  // Ready when cooldown is complete
        IconLibrary.drawAbilityCooldown(ctx, fCenterX, centerY, size / 2, 'F', fProgress, fReady, this.abilityColors.F);
        this.drawAbilityLabel(ctx, fCenterX, centerY + size / 2 + 12 * rX, labels.F, rX);
    }

    /**
     * Draw ability keybind label
     */
    drawAbilityLabel(ctx, x, y, label, rX) {
        ctx.save();
        ctx.fillStyle = '#aaaaaa';
        ctx.font = `bold ${10 * rX}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, y);
        ctx.restore();
    }

    /**
     * Draw weapon slots
     */
    drawWeaponSlots(ctx, rewardManager, rX, startX, y) {
        const slotW = this.weaponSlotWidth * rX;
        const slotH = this.weaponSlotHeight * rX;
        const cornerRadius = 6 * rX;

        ctx.save();

        for (let i = 0; i < 2; i++) {
            const slot = rewardManager.weaponSlots[i];
            const x = startX + i * (slotW + this.gap * rX);
            const isActive = rewardManager.currentSlot === i;

            // Slot background
            this.drawRoundedRect(ctx, x, y, slotW, slotH, cornerRadius,
                isActive ? 'rgba(50, 70, 90, 0.95)' : 'rgba(25, 30, 35, 0.9)');

            // Glowing border for active slot
            if (isActive) {
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 12 * rX;
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2 * rX;
            } else {
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 1 * rX;
            }
            this.strokeRoundedRect(ctx, x, y, slotW, slotH, cornerRadius);
            ctx.shadowBlur = 0;

            // Slot number
            ctx.fillStyle = isActive ? '#ffffff' : '#666666';
            ctx.font = `bold ${9 * rX}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText(i === 0 ? '1' : '2', x + 6 * rX, y + 12 * rX);

            // Slot content
            if (i === 0) {
                // Default gun
                IconLibrary.drawModernPistolIcon(ctx, x + slotW / 2, y + slotH / 2 - 3 * rX, 24 * rX, isActive);

                // Label
                ctx.fillStyle = isActive ? '#888888' : '#555555';
                ctx.font = `${8 * rX}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('STANDARD', x + slotW / 2, y + slotH - 8 * rX);
            } else if (slot.gun) {
                // Upgrade slot with weapon
                const gunColor = slot.gun.rarity.color;
                const gunType = slot.gun.id ? slot.gun.id.split('_')[0] : 'default';

                // Weapon icon
                IconLibrary.drawWeaponIcon(ctx, x + slotW / 2, y + 28 * rX, 16 * rX, gunType, gunColor);

                // Weapon name
                ctx.fillStyle = gunColor;
                ctx.font = `bold ${9 * rX}px Arial`;
                ctx.textAlign = 'center';
                const shortName = slot.gun.name.length > 10 ? slot.gun.name.slice(0, 9) + '..' : slot.gun.name;
                ctx.fillText(shortName, x + slotW / 2, y + 50 * rX);

                // Durability bar
                const barW = slotW - 16 * rX;
                const barH = 4 * rX;
                const barX = x + 8 * rX;
                const barY = y + slotH - 10 * rX;
                const durPct = slot.durability / slot.gun.durability;

                // Bar background
                ctx.fillStyle = '#222222';
                this.drawRoundedRect(ctx, barX, barY, barW, barH, 2 * rX, '#222222');

                // Bar fill
                let barColor = gunColor;
                if (durPct < 0.25) barColor = '#ff3333';
                else if (durPct < 0.5) barColor = '#ffaa00';
                this.drawRoundedRect(ctx, barX, barY, barW * durPct, barH, 2 * rX, barColor);
            } else {
                // Empty slot
                ctx.fillStyle = '#444444';
                ctx.font = `${10 * rX}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('EMPTY', x + slotW / 2, y + slotH / 2 + 3 * rX);

                // Dashed border
                ctx.setLineDash([3 * rX, 3 * rX]);
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1 * rX;
                ctx.strokeRect(x + 8 * rX, y + 12 * rX, slotW - 16 * rX, slotH - 28 * rX);
                ctx.setLineDash([]);
            }
        }

        // TAB hint
        ctx.fillStyle = '#666666';
        ctx.font = `${9 * rX}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('[TAB]', startX + slotW + this.gap * rX / 2, y - 6 * rX);

        ctx.restore();
    }

    /**
     * Draw permanent upgrades as compact icon badges
     */
    drawPermanentUpgrades(ctx, game, rX, y) {
        const rewardManager = game.rewardManager;
        const pauseMenu = game.pauseMenu;
        const controlScheme = pauseMenu ? pauseMenu.controlScheme : 'mouse';

        const upgrades = [];

        // Collect permanent upgrades
        if (rewardManager.qCooldownMod !== 1) {
            const reduction = Math.round((1 - rewardManager.qCooldownMod) * 100);
            const label = controlScheme === 'wasd' ? 'Shoot' : 'Q';
            upgrades.push({
                icon: (ctx, x, y, s, c) => IconLibrary.drawAbilityIcon(ctx, x, y, s, 'Q', c),
                color: '#00ffff',
                badge: `-${reduction}%`
            });
        }
        if (rewardManager.eCooldownMod !== 1) {
            const reduction = Math.round((1 - rewardManager.eCooldownMod) * 100);
            upgrades.push({
                icon: (ctx, x, y, s, c) => IconLibrary.drawAbilityIcon(ctx, x, y, s, 'E', c),
                color: '#ff8800',
                badge: `-${reduction}%`
            });
        }
        if (rewardManager.fCooldownMod !== 1) {
            const reduction = Math.round((1 - rewardManager.fCooldownMod) * 100);
            upgrades.push({
                icon: (ctx, x, y, s, c) => IconLibrary.drawAbilityIcon(ctx, x, y, s, 'F', c),
                color: '#ff00ff',
                badge: `-${reduction}%`
            });
        }
        if (rewardManager.extraLives > 0) {
            upgrades.push({
                icon: (ctx, x, y, s, c) => IconLibrary.drawSurvivabilityIcon(ctx, x, y, s, 'extra_life', c),
                color: '#ff4444',
                badge: `+${rewardManager.extraLives}`
            });
        }
        if (rewardManager.shieldCharges > 0) {
            upgrades.push({
                icon: (ctx, x, y, s, c) => IconLibrary.drawSurvivabilityIcon(ctx, x, y, s, 'shield', c),
                color: '#4488ff',
                badge: `x${rewardManager.shieldCharges}`
            });
        }
        if (rewardManager.speedMod !== 1) {
            const boost = Math.round((rewardManager.speedMod - 1) * 100);
            upgrades.push({
                icon: (ctx, x, y, s, c) => IconLibrary.drawMovementIcon(ctx, x, y, s, 'speed', c),
                color: '#88ff88',
                badge: `+${boost}%`
            });
        }
        if (rewardManager.dashDistanceMod !== 1) {
            const boost = Math.round((rewardManager.dashDistanceMod - 1) * 100);
            upgrades.push({
                icon: (ctx, x, y, s, c) => IconLibrary.drawMovementIcon(ctx, x, y, s, 'dash_distance', c),
                color: '#ffff88',
                badge: `+${boost}%`
            });
        }

        if (upgrades.length === 0) return;

        const size = this.badgeSize * rX;
        const totalWidth = upgrades.length * (size + this.gap * rX) - this.gap * rX;
        const startX = window.innerWidth - this.padding * rX - totalWidth - 50 * rX;

        ctx.save();

        // Label
        ctx.fillStyle = '#888888';
        ctx.font = `bold ${8 * rX}px Arial`;
        ctx.textAlign = 'right';
        ctx.fillText('BUFFS', startX - 8 * rX, y + size / 2 + 3 * rX);

        // Draw upgrade badges
        upgrades.forEach((upgrade, i) => {
            const x = startX + i * (size + this.gap * rX) + size / 2;

            // Background circle
            ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Icon
            upgrade.icon(ctx, x, y, size * 0.55, upgrade.color);

            // Badge
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.font = `bold ${8 * rX}px Arial`;
            const badgeWidth = ctx.measureText(upgrade.badge).width + 4 * rX;
            ctx.fillRect(x - badgeWidth / 2, y + size / 2 - 2 * rX, badgeWidth, 10 * rX);
            ctx.fillStyle = upgrade.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(upgrade.badge, x, y + size / 2 + 3 * rX);
        });

        ctx.restore();
    }

    /**
     * Draw active timed powerups as radial timer icons
     */
    drawActiveTimers(ctx, game, rX, baseY) {
        const rewardManager = game.rewardManager;
        const now = performance.now();

        // Filter to timed rewards only (not permanent, not guns)
        const timedRewards = rewardManager.activeRewards.filter(ar =>
            !ar.permanent && ar.reward.category !== CATEGORY.GUN
        );

        if (timedRewards.length === 0) return;

        const size = this.powerupSize * rX;
        const maxPerRow = 4;
        const startX = window.innerWidth - this.padding * rX - (maxPerRow * (size + this.gap * rX));

        ctx.save();

        // Label
        ctx.fillStyle = '#888888';
        ctx.font = `bold ${8 * rX}px Arial`;
        ctx.textAlign = 'right';
        ctx.fillText('ACTIVE', startX - 8 * rX, baseY + size / 2);

        // Draw timer icons
        timedRewards.slice(0, 8).forEach((active, i) => {
            const row = Math.floor(i / maxPerRow);
            const col = i % maxPerRow;
            const x = startX + col * (size + this.gap * rX) + size / 2;
            const y = baseY - row * (size + this.gap * rX);

            const elapsed = now - active.startTime;
            const remaining = active.duration - elapsed;
            const progress = remaining / active.duration;
            const remainingSeconds = remaining / 1000;

            const iconDrawFn = IconLibrary.getIconDrawFnForReward(active.reward);
            const colors = {
                primary: active.reward.rarity.color,
                ring: active.reward.rarity.color,
                background: 'rgba(20, 20, 25, 0.9)'
            };

            IconLibrary.drawRadialTimer(ctx, x, y, size / 2, progress, iconDrawFn, colors, remainingSeconds);
        });

        ctx.restore();
    }

    /**
     * Helper: Draw rounded rectangle
     */
    drawRoundedRect(ctx, x, y, w, h, r, fillColor) {
        ctx.fillStyle = fillColor;
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
        ctx.fill();
    }

    /**
     * Helper: Stroke rounded rectangle
     */
    strokeRoundedRect(ctx, x, y, w, h, r) {
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
        ctx.stroke();
    }
}
