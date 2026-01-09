/**
 * IconLibrary - Centralized icon drawing functions for HUD and pickups
 * Includes radial timer system for cooldown visualization
 */

export const IconLibrary = {

    /**
     * Draw a radial timer with icon - sweeps clockwise from 12 o'clock
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} radius - Outer radius
     * @param {number} progress - 0 to 1 (1 = full/ready, 0 = empty/on cooldown)
     * @param {Function} iconDrawFn - Function to draw the icon: (ctx, x, y, size, color) => void
     * @param {Object} colors - { primary, ring, background }
     * @param {number} remainingSeconds - Optional seconds remaining for text display
     */
    drawRadialTimer(ctx, x, y, radius, progress, iconDrawFn, colors, remainingSeconds = null) {
        const rX = window.innerWidth / 2560;

        ctx.save();

        // 1. Draw background circle
        ctx.fillStyle = colors.background || 'rgba(30, 30, 30, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw greyed-out icon (full, behind)
        ctx.save();
        ctx.globalAlpha = 0.3;
        iconDrawFn(ctx, x, y, radius * 0.65, '#666666');
        ctx.restore();

        // 3. Create arc clipping path for colored portion
        if (progress > 0 && progress <= 1) {
            ctx.save();
            ctx.beginPath();
            // Start at 12 o'clock (-PI/2), sweep clockwise
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (progress * Math.PI * 2);
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius + 1, startAngle, endAngle, false);
            ctx.closePath();
            ctx.clip();

            // 4. Draw full-color icon inside clipped region
            iconDrawFn(ctx, x, y, radius * 0.65, colors.primary);
            ctx.restore();

            // 5. Draw colored outer ring arc
            ctx.strokeStyle = colors.ring || colors.primary;
            ctx.lineWidth = 3 * rX;
            ctx.beginPath();
            ctx.arc(x, y, radius - 2 * rX, startAngle, endAngle, false);
            ctx.stroke();
        }

        // 6. Draw remaining time text (only when low - under 5 seconds)
        if (remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds < 5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${radius * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4 * rX;
            ctx.fillText(`${Math.ceil(remainingSeconds)}`, x, y + radius + 12 * rX);
            ctx.shadowBlur = 0;
        }

        // 7. Draw subtle outer border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 * rX;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    },

    /**
     * Draw ability cooldown icon with ready pulse effect
     */
    drawAbilityCooldown(ctx, x, y, radius, abilityKey, progress, isReady, colors) {
        const rX = window.innerWidth / 2560;

        if (isReady) {
            // Full bright icon with pulse effect
            ctx.save();

            // Background
            ctx.fillStyle = colors.background || 'rgba(30, 30, 30, 0.9)';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw full color icon
            this.drawAbilityIcon(ctx, x, y, radius * 0.65, abilityKey, colors.primary);

            // Pulsing glow ring
            const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 3 * rX;
            ctx.shadowColor = colors.primary;
            ctx.shadowBlur = 15 * rX * pulse;
            ctx.beginPath();
            ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        } else {
            // Use radial timer for cooldown
            this.drawRadialTimer(ctx, x, y, radius, progress,
                (c, px, py, s, col) => this.drawAbilityIcon(c, px, py, s, abilityKey, col),
                colors);
        }
    },

    /**
     * Draw ability icon (Q, E, F)
     */
    drawAbilityIcon(ctx, x, y, size, abilityKey, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2 * (window.innerWidth / 2560);
        ctx.lineCap = 'round';

        switch (abilityKey) {
            case 'Q':
                // Shooting/bullet icon - concentric circles with crosshair
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Crosshair lines
                ctx.beginPath();
                ctx.moveTo(-size * 0.9, 0);
                ctx.lineTo(-size * 0.5, 0);
                ctx.moveTo(size * 0.5, 0);
                ctx.lineTo(size * 0.9, 0);
                ctx.moveTo(0, -size * 0.9);
                ctx.lineTo(0, -size * 0.5);
                ctx.moveTo(0, size * 0.5);
                ctx.lineTo(0, size * 0.9);
                ctx.stroke();
                break;

            case 'E':
                // Dash icon - motion arrow
                ctx.beginPath();
                ctx.moveTo(-size * 0.7, 0);
                ctx.lineTo(size * 0.5, 0);
                ctx.stroke();
                // Arrow head
                ctx.beginPath();
                ctx.moveTo(size * 0.5, 0);
                ctx.lineTo(size * 0.1, -size * 0.4);
                ctx.moveTo(size * 0.5, 0);
                ctx.lineTo(size * 0.1, size * 0.4);
                ctx.stroke();
                // Speed lines
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.moveTo(-size * 0.9, -size * 0.3);
                ctx.lineTo(-size * 0.4, -size * 0.3);
                ctx.moveTo(-size * 0.9, size * 0.3);
                ctx.lineTo(-size * 0.4, size * 0.3);
                ctx.stroke();
                ctx.globalAlpha = 1;
                break;

            case 'F':
                // Ultimate icon - star burst
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    const innerRadius = size * 0.25;
                    const outerRadius = size * 0.8;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
                    ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                    ctx.stroke();
                }
                // Center circle
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    },

    /**
     * Draw cooldown category icon (for pickup rewards)
     */
    drawCooldownIcon(ctx, x, y, size, id, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2 * (window.innerWidth / 2560);

        if (id && id.startsWith('q_cd')) {
            this.drawAbilityIcon(ctx, 0, 0, size, 'Q', color);
        } else if (id && id.startsWith('e_cd')) {
            this.drawAbilityIcon(ctx, 0, 0, size, 'E', color);
        } else if (id && id.startsWith('f_cd')) {
            this.drawAbilityIcon(ctx, 0, 0, size, 'F', color);
        } else {
            // Generic clock icon
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -size * 0.5);
            ctx.moveTo(0, 0);
            ctx.lineTo(size * 0.3, 0);
            ctx.stroke();
        }

        ctx.restore();
    },

    /**
     * Draw survivability icon (heart, shield, shrink)
     */
    drawSurvivabilityIcon(ctx, x, y, size, id, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2 * (window.innerWidth / 2560);

        if (id && id.startsWith('extra_life')) {
            // Heart icon
            ctx.beginPath();
            ctx.moveTo(0, size * 0.4);
            ctx.bezierCurveTo(-size * 0.6, -size * 0.1, -size * 0.6, -size * 0.5, 0, -size * 0.2);
            ctx.bezierCurveTo(size * 0.6, -size * 0.5, size * 0.6, -size * 0.1, 0, size * 0.4);
            ctx.fill();
        } else if (id && id.startsWith('shield')) {
            // Shield icon
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.6);
            ctx.lineTo(-size * 0.5, -size * 0.3);
            ctx.lineTo(-size * 0.5, size * 0.2);
            ctx.lineTo(0, size * 0.5);
            ctx.lineTo(size * 0.5, size * 0.2);
            ctx.lineTo(size * 0.5, -size * 0.3);
            ctx.closePath();
            ctx.stroke();
            // Inner fill
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (id && id.startsWith('shrink')) {
            // Shrink icon - arrows pointing inward
            const arrows = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
            for (const angle of arrows) {
                ctx.save();
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(size * 0.6, 0);
                ctx.lineTo(size * 0.2, 0);
                ctx.lineTo(size * 0.35, -size * 0.15);
                ctx.moveTo(size * 0.2, 0);
                ctx.lineTo(size * 0.35, size * 0.15);
                ctx.stroke();
                ctx.restore();
            }
        } else {
            // Generic diamond
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.6);
            ctx.lineTo(-size * 0.5, 0);
            ctx.lineTo(0, size * 0.6);
            ctx.lineTo(size * 0.5, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    /**
     * Draw movement icon (speed, dash, ghost)
     */
    drawMovementIcon(ctx, x, y, size, id, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2 * (window.innerWidth / 2560);

        if (id && id.startsWith('speed')) {
            // Speed lines with arrow
            ctx.beginPath();
            ctx.moveTo(-size * 0.5, -size * 0.3);
            ctx.lineTo(size * 0.5, -size * 0.3);
            ctx.moveTo(-size * 0.3, 0);
            ctx.lineTo(size * 0.5, 0);
            ctx.moveTo(-size * 0.5, size * 0.3);
            ctx.lineTo(size * 0.5, size * 0.3);
            ctx.stroke();
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(size * 0.5, 0);
            ctx.lineTo(size * 0.2, -size * 0.25);
            ctx.moveTo(size * 0.5, 0);
            ctx.lineTo(size * 0.2, size * 0.25);
            ctx.stroke();
        } else if (id && id.startsWith('dash_distance')) {
            // Dash trail - multiple circles
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(-size * 0.4, 0, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(size * 0.4, 0, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            // Motion lines
            ctx.beginPath();
            ctx.moveTo(-size * 0.7, -size * 0.2);
            ctx.lineTo(-size * 0.4, -size * 0.2);
            ctx.moveTo(-size * 0.7, size * 0.2);
            ctx.lineTo(-size * 0.4, size * 0.2);
            ctx.stroke();
        } else if (id && id.startsWith('ghost')) {
            // Ghost icon
            ctx.beginPath();
            ctx.arc(0, -size * 0.1, size * 0.4, Math.PI, 0);
            ctx.lineTo(size * 0.4, size * 0.4);
            ctx.quadraticCurveTo(size * 0.2, size * 0.2, 0, size * 0.4);
            ctx.quadraticCurveTo(-size * 0.2, size * 0.2, -size * 0.4, size * 0.4);
            ctx.closePath();
            ctx.globalAlpha = 0.7;
            ctx.fill();
            ctx.globalAlpha = 1;
            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-size * 0.15, -size * 0.1, size * 0.08, 0, Math.PI * 2);
            ctx.arc(size * 0.15, -size * 0.1, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Generic arrow
            ctx.beginPath();
            ctx.moveTo(-size * 0.6, 0);
            ctx.lineTo(size * 0.6, 0);
            ctx.lineTo(size * 0.2, -size * 0.4);
            ctx.moveTo(size * 0.6, 0);
            ctx.lineTo(size * 0.2, size * 0.4);
            ctx.lineWidth = 3 * (window.innerWidth / 2560);
            ctx.stroke();
        }

        ctx.restore();
    },

    /**
     * Draw offense icon (score, bullet size, range, aura)
     */
    drawOffenseIcon(ctx, x, y, size, id, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2 * (window.innerWidth / 2560);

        if (id && id.startsWith('score_mult')) {
            // Coin with multiplier
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font = `bold ${size * 0.7}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x', 0, size * 0.05);
        } else if (id && id.startsWith('bullet_size')) {
            // Big bullet
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // Inner ring
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
            ctx.stroke();
        } else if (id && id.startsWith('range')) {
            // Crosshair with extended lines
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-size * 0.7, 0);
            ctx.lineTo(-size * 0.15, 0);
            ctx.moveTo(size * 0.15, 0);
            ctx.lineTo(size * 0.7, 0);
            ctx.moveTo(0, -size * 0.7);
            ctx.lineTo(0, -size * 0.15);
            ctx.moveTo(0, size * 0.15);
            ctx.lineTo(0, size * 0.7);
            ctx.stroke();
        } else if (id && id.startsWith('damage_aura')) {
            // Radiating damage
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else {
            // Generic star
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const outerX = Math.cos(angle) * size * 0.6;
                const outerY = Math.sin(angle) * size * 0.6;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * size * 0.25;
                const innerY = Math.sin(innerAngle) * size * 0.25;
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    /**
     * Draw weapon icon by type
     */
    drawWeaponIcon(ctx, x, y, size, gunType, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2 * (window.innerWidth / 2560);

        switch (gunType) {
            case 'shotgun':
                // Spread pattern
                for (let i = -1; i <= 1; i++) {
                    const angle = i * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'rapidfire':
                // Triple bullets
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(size * 0.3 * i - size * 0.3, 0, size * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Speed lines
                ctx.beginPath();
                ctx.moveTo(-size * 0.6, -size * 0.25);
                ctx.lineTo(-size * 0.3, -size * 0.25);
                ctx.moveTo(-size * 0.6, size * 0.25);
                ctx.lineTo(-size * 0.3, size * 0.25);
                ctx.stroke();
                break;

            case 'piercing':
                // Arrow through circles
                ctx.beginPath();
                ctx.moveTo(-size * 0.8, 0);
                ctx.lineTo(size * 0.8, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(size * 0.8, 0);
                ctx.lineTo(size * 0.4, -size * 0.3);
                ctx.moveTo(size * 0.8, 0);
                ctx.lineTo(size * 0.4, size * 0.3);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(-size * 0.2, 0, size * 0.2, 0, Math.PI * 2);
                ctx.arc(size * 0.2, 0, size * 0.2, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'ricochet':
                // Bouncing path
                ctx.beginPath();
                ctx.moveTo(-size * 0.7, size * 0.4);
                ctx.lineTo(-size * 0.2, -size * 0.4);
                ctx.lineTo(size * 0.3, size * 0.4);
                ctx.lineTo(size * 0.7, -size * 0.2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(-size * 0.2, -size * 0.4, size * 0.1, 0, Math.PI * 2);
                ctx.arc(size * 0.3, size * 0.4, size * 0.1, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'homing':
                // Target crosshair
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-size * 0.7, 0);
                ctx.lineTo(-size * 0.3, 0);
                ctx.moveTo(size * 0.3, 0);
                ctx.lineTo(size * 0.7, 0);
                ctx.moveTo(0, -size * 0.7);
                ctx.lineTo(0, -size * 0.3);
                ctx.moveTo(0, size * 0.3);
                ctx.lineTo(0, size * 0.7);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'twin':
                // Two parallel bullets
                ctx.beginPath();
                ctx.arc(0, -size * 0.3, size * 0.2, 0, Math.PI * 2);
                ctx.arc(0, size * 0.3, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-size * 0.5, -size * 0.3);
                ctx.lineTo(-size * 0.2, -size * 0.3);
                ctx.moveTo(-size * 0.5, size * 0.3);
                ctx.lineTo(-size * 0.2, size * 0.3);
                ctx.stroke();
                break;

            case 'nova':
                // Star burst
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * size * 0.7, Math.sin(angle) * size * 0.7);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'chain':
                // Lightning bolt
                ctx.beginPath();
                ctx.moveTo(-size * 0.5, -size * 0.6);
                ctx.lineTo(-size * 0.1, -size * 0.1);
                ctx.lineTo(size * 0.2, -size * 0.2);
                ctx.lineTo(-size * 0.1, size * 0.3);
                ctx.lineTo(size * 0.3, size * 0.1);
                ctx.lineTo(size * 0.5, size * 0.6);
                ctx.stroke();
                // Sparks
                ctx.beginPath();
                ctx.arc(size * 0.4, -size * 0.3, size * 0.08, 0, Math.PI * 2);
                ctx.arc(-size * 0.3, size * 0.4, size * 0.08, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                // Default bullet
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Trail
                ctx.beginPath();
                ctx.moveTo(-size * 0.6, 0);
                ctx.lineTo(-size * 0.2, 0);
                ctx.stroke();
        }

        ctx.restore();
    },

    /**
     * Draw modern pistol icon for default weapon slot
     */
    drawModernPistolIcon(ctx, x, y, size, isActive) {
        const rX = window.innerWidth / 2560;
        const color = isActive ? '#ffffff' : '#888888';
        const fillColor = isActive ? '#aaaaaa' : '#555555';

        ctx.save();
        ctx.translate(x, y);
        ctx.lineWidth = 2 * rX;
        ctx.strokeStyle = color;
        ctx.fillStyle = fillColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Modern pistol silhouette (pointing right)
        ctx.beginPath();

        // Barrel
        ctx.moveTo(-size * 0.1, -size * 0.15);
        ctx.lineTo(size * 0.65, -size * 0.15);
        ctx.lineTo(size * 0.7, -size * 0.1);
        ctx.lineTo(size * 0.7, size * 0.05);
        ctx.lineTo(size * 0.65, size * 0.1);

        // Trigger guard
        ctx.lineTo(size * 0.15, size * 0.1);
        ctx.lineTo(size * 0.1, size * 0.2);
        ctx.quadraticCurveTo(size * 0.05, size * 0.3, -size * 0.1, size * 0.3);

        // Grip
        ctx.lineTo(-size * 0.2, size * 0.5);
        ctx.lineTo(-size * 0.35, size * 0.5);
        ctx.lineTo(-size * 0.3, size * 0.15);
        ctx.lineTo(-size * 0.25, size * 0.1);

        // Back to slide
        ctx.lineTo(-size * 0.25, -size * 0.05);
        ctx.lineTo(-size * 0.3, -size * 0.15);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        // Slide serrations
        ctx.strokeStyle = isActive ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1 * rX;
        for (let i = 0; i < 4; i++) {
            const sx = -size * 0.15 + i * size * 0.1;
            ctx.beginPath();
            ctx.moveTo(sx, -size * 0.12);
            ctx.lineTo(sx, -size * 0.02);
            ctx.stroke();
        }

        // Front sight
        if (isActive) {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.moveTo(size * 0.5, -size * 0.15);
            ctx.lineTo(size * 0.45, -size * 0.22);
            ctx.lineTo(size * 0.55, -size * 0.22);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    /**
     * Draw a compact badge icon with text overlay
     */
    drawBadgeIcon(ctx, x, y, size, iconDrawFn, color, badgeText) {
        const rX = window.innerWidth / 2560;

        ctx.save();

        // Draw the icon
        iconDrawFn(ctx, x, y, size * 0.7, color);

        // Draw badge text
        if (badgeText) {
            const badgeX = x + size * 0.4;
            const badgeY = y + size * 0.4;

            // Badge background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            const textWidth = ctx.measureText(badgeText).width || size * 0.6;
            ctx.fillRect(badgeX - 2 * rX, badgeY - 8 * rX, textWidth + 4 * rX, 12 * rX);

            // Badge text
            ctx.fillStyle = color;
            ctx.font = `bold ${10 * rX}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX, badgeY);
        }

        ctx.restore();
    },

    /**
     * Get icon drawing function for a reward
     */
    getIconDrawFnForReward(reward) {
        const category = reward.category;
        const id = reward.id || '';

        switch (category) {
            case 'cooldown':
                return (ctx, x, y, size, color) => this.drawCooldownIcon(ctx, x, y, size, id, color);
            case 'survivability':
                return (ctx, x, y, size, color) => this.drawSurvivabilityIcon(ctx, x, y, size, id, color);
            case 'movement':
                return (ctx, x, y, size, color) => this.drawMovementIcon(ctx, x, y, size, id, color);
            case 'offense':
                return (ctx, x, y, size, color) => this.drawOffenseIcon(ctx, x, y, size, id, color);
            case 'gun':
                const gunType = id.split('_')[0];
                return (ctx, x, y, size, color) => this.drawWeaponIcon(ctx, x, y, size, gunType, color);
            default:
                return (ctx, x, y, size, color) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                };
        }
    }
};
