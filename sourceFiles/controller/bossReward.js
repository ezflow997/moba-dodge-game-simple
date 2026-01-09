import { getRandomReward, CATEGORY, RARITY } from './rewardTypes.js';

export class BossReward {
    constructor(x, y, reward = null) {
        this.x = x;
        this.y = y;
        this.reward = reward || getRandomReward();

        // Visual properties
        this.size = 35 * window.innerWidth / 2560;
        this.baseSize = this.size;
        this.rotation = 0;
        this.pulsePhase = 0;
        this.floatPhase = Math.random() * Math.PI * 2;
        this.floatOffset = 0;

        // Movement - slight float down with hover
        this.velocityY = 0.5;
        this.targetY = y + 50;
        this.settled = false;

        // Pickup properties
        this.pickupRadius = 60 * window.innerWidth / 2560;
        this.collected = false;
        this.collectAnimation = 0;

        // Lifetime - despawns after 15 seconds if not collected
        this.spawnTime = performance.now();
        this.lifetime = 15000;
        this.expired = false;

        // Particles for visual flair
        this.particles = [];
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                angle: (Math.PI * 2 / 8) * i,
                distance: this.size * 1.2,
                speed: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 3
            });
        }

        this.prevWindowWidth = window.innerWidth;
    }

    update(player) {
        // Handle window resize
        if (window.innerWidth !== this.prevWindowWidth) {
            const ratio = window.innerWidth / this.prevWindowWidth;
            this.x *= ratio;
            this.y *= ratio;
            this.size *= ratio;
            this.baseSize *= ratio;
            this.pickupRadius *= ratio;
            this.targetY *= ratio;
            this.prevWindowWidth = window.innerWidth;
        }

        // Float down to target position
        if (!this.settled && this.y < this.targetY) {
            this.y += this.velocityY;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.settled = true;
            }
        }

        // Hover animation
        this.floatPhase += 0.05;
        this.floatOffset = Math.sin(this.floatPhase) * 8;

        // Rotation and pulse
        this.rotation += 0.02;
        this.pulsePhase += 0.08;
        this.size = this.baseSize * (1 + Math.sin(this.pulsePhase) * 0.1);

        // Update particles
        for (const p of this.particles) {
            p.angle += p.speed;
        }

        // Check lifetime
        if (performance.now() - this.spawnTime > this.lifetime) {
            this.expired = true;
        }

        // Check collection
        if (!this.collected && player) {
            const dx = player.x - this.x;
            const dy = player.y - (this.y + this.floatOffset);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.pickupRadius + player.size / 2) {
                this.collected = true;
                return this.reward; // Return reward data for RewardManager
            }
        }

        // Collection animation
        if (this.collected) {
            this.collectAnimation += 0.1;
            this.size *= 1.1;
            if (this.collectAnimation > 1) {
                this.expired = true;
            }
        }

        return null;
    }

    draw(context) {
        if (this.expired) return;

        const rX = window.innerWidth / 2560;
        const drawY = this.y + this.floatOffset;
        const color = this.reward.rarity.color;
        const glowColor = this.reward.rarity.glowColor;

        context.save();

        // Collection animation - fade out
        if (this.collected) {
            context.globalAlpha = 1 - this.collectAnimation;
        }

        // Expiring warning - flash when < 3 seconds left
        const timeLeft = this.lifetime - (performance.now() - this.spawnTime);
        if (timeLeft < 3000 && !this.collected) {
            context.globalAlpha = 0.5 + Math.sin(performance.now() / 100) * 0.5;
        }

        // Outer glow
        const gradient = context.createRadialGradient(this.x, drawY, 0, this.x, drawY, this.size * 2);
        gradient.addColorStop(0, color + '60');
        gradient.addColorStop(0.5, glowColor + '30');
        gradient.addColorStop(1, 'transparent');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, drawY, this.size * 2, 0, Math.PI * 2);
        context.fill();

        // S-Tier special golden ring
        if (this.reward.rarity === RARITY.STIER) {
            context.strokeStyle = '#ffdd00';
            context.lineWidth = 3 * rX;
            context.shadowColor = '#ffdd00';
            context.shadowBlur = 20 * rX;
            context.beginPath();
            context.arc(this.x, drawY, this.size * 1.5, this.rotation, this.rotation + Math.PI * 1.5);
            context.stroke();
        }

        // Orbiting particles
        context.shadowColor = color;
        context.shadowBlur = 10 * rX;
        for (const p of this.particles) {
            const px = this.x + Math.cos(p.angle + this.rotation) * p.distance;
            const py = drawY + Math.sin(p.angle + this.rotation) * p.distance;
            context.fillStyle = color;
            context.beginPath();
            context.arc(px, py, p.size * rX, 0, Math.PI * 2);
            context.fill();
        }

        // Main reward orb
        context.save();
        context.translate(this.x, drawY);
        context.rotate(this.rotation);

        // Outer ring
        context.strokeStyle = color;
        context.lineWidth = 3 * rX;
        context.shadowColor = color;
        context.shadowBlur = 25 * rX;
        context.beginPath();
        context.arc(0, 0, this.size, 0, Math.PI * 2);
        context.stroke();

        // Inner gradient fill
        const innerGradient = context.createRadialGradient(
            -this.size * 0.3, -this.size * 0.3, 0,
            0, 0, this.size
        );
        innerGradient.addColorStop(0, '#ffffff');
        innerGradient.addColorStop(0.4, color);
        innerGradient.addColorStop(1, glowColor);
        context.fillStyle = innerGradient;
        context.beginPath();
        context.arc(0, 0, this.size * 0.9, 0, Math.PI * 2);
        context.fill();

        // Category icon (simple shapes)
        context.fillStyle = '#ffffff';
        context.shadowBlur = 0;
        this.drawCategoryIcon(context, rX);

        context.restore();

        // Reward name text
        context.font = `bold ${14 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = color;
        context.shadowColor = '#000000';
        context.shadowBlur = 4 * rX;
        context.fillText(this.reward.name, this.x, drawY + this.size + 20 * rX);

        // Rarity text
        context.font = `${11 * rX}px Arial`;
        context.fillStyle = color;
        context.fillText(this.reward.rarity.name, this.x, drawY + this.size + 35 * rX);

        context.restore();
    }

    drawCategoryIcon(context, rX) {
        const iconSize = this.size * 0.4;
        const id = this.reward.id || '';

        switch (this.reward.category) {
            case CATEGORY.GUN:
                this.drawWeaponIcon(context, rX, iconSize);
                break;

            case CATEGORY.COOLDOWN:
                this.drawCooldownIcon(context, rX, iconSize, id);
                break;

            case CATEGORY.SURVIVABILITY:
                this.drawSurvivabilityIcon(context, rX, iconSize, id);
                break;

            case CATEGORY.MOVEMENT:
                this.drawMovementIcon(context, rX, iconSize, id);
                break;

            case CATEGORY.OFFENSE:
                this.drawOffenseIcon(context, rX, iconSize, id);
                break;
        }
    }

    drawCooldownIcon(context, rX, iconSize, id) {
        context.strokeStyle = '#ffffff';
        context.fillStyle = '#ffffff';
        context.lineWidth = 2 * rX;

        if (id.startsWith('q_cd')) {
            // Q ability - Bullet/shooting icon
            context.beginPath();
            context.arc(0, 0, iconSize * 0.5, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.arc(0, 0, iconSize * 0.2, 0, Math.PI * 2);
            context.fill();
            // "Q" letter
            context.font = `bold ${iconSize * 0.8}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('Q', 0, iconSize * 0.05);
        } else if (id.startsWith('e_cd')) {
            // E ability - Dash icon
            context.beginPath();
            context.moveTo(-iconSize * 0.6, 0);
            context.lineTo(iconSize * 0.4, 0);
            context.lineTo(iconSize * 0.1, -iconSize * 0.3);
            context.moveTo(iconSize * 0.4, 0);
            context.lineTo(iconSize * 0.1, iconSize * 0.3);
            context.stroke();
            // "E" letter
            context.font = `bold ${iconSize * 0.6}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('E', -iconSize * 0.3, 0);
        } else if (id.startsWith('f_cd')) {
            // F ability - Ultimate icon (star burst)
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(Math.cos(angle) * iconSize * 0.6, Math.sin(angle) * iconSize * 0.6);
                context.stroke();
            }
            // "F" letter
            context.font = `bold ${iconSize * 0.5}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('F', 0, 0);
        } else {
            // Generic clock icon
            context.beginPath();
            context.arc(0, 0, iconSize * 0.7, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, -iconSize * 0.5);
            context.moveTo(0, 0);
            context.lineTo(iconSize * 0.3, 0);
            context.stroke();
        }
    }

    drawSurvivabilityIcon(context, rX, iconSize, id) {
        context.strokeStyle = '#ffffff';
        context.fillStyle = '#ffffff';
        context.lineWidth = 2 * rX;

        if (id.startsWith('extra_life')) {
            // Heart icon
            context.beginPath();
            context.moveTo(0, iconSize * 0.4);
            context.bezierCurveTo(-iconSize * 0.6, -iconSize * 0.1, -iconSize * 0.6, -iconSize * 0.5, 0, -iconSize * 0.2);
            context.bezierCurveTo(iconSize * 0.6, -iconSize * 0.5, iconSize * 0.6, -iconSize * 0.1, 0, iconSize * 0.4);
            context.fill();
        } else if (id.startsWith('shield')) {
            // Shield icon
            context.beginPath();
            context.moveTo(0, -iconSize * 0.6);
            context.lineTo(-iconSize * 0.5, -iconSize * 0.3);
            context.lineTo(-iconSize * 0.5, iconSize * 0.2);
            context.lineTo(0, iconSize * 0.5);
            context.lineTo(iconSize * 0.5, iconSize * 0.2);
            context.lineTo(iconSize * 0.5, -iconSize * 0.3);
            context.closePath();
            context.stroke();
            // Inner shield
            context.beginPath();
            context.moveTo(0, -iconSize * 0.35);
            context.lineTo(-iconSize * 0.25, -iconSize * 0.15);
            context.lineTo(-iconSize * 0.25, iconSize * 0.1);
            context.lineTo(0, iconSize * 0.25);
            context.lineTo(iconSize * 0.25, iconSize * 0.1);
            context.lineTo(iconSize * 0.25, -iconSize * 0.15);
            context.closePath();
            context.fill();
        } else if (id.startsWith('shrink')) {
            // Shrink icon - arrows pointing inward
            const arrows = [
                { angle: 0 }, { angle: Math.PI / 2 }, { angle: Math.PI }, { angle: -Math.PI / 2 }
            ];
            for (const a of arrows) {
                context.save();
                context.rotate(a.angle);
                context.beginPath();
                context.moveTo(iconSize * 0.6, 0);
                context.lineTo(iconSize * 0.2, 0);
                context.lineTo(iconSize * 0.35, -iconSize * 0.15);
                context.moveTo(iconSize * 0.2, 0);
                context.lineTo(iconSize * 0.35, iconSize * 0.15);
                context.stroke();
                context.restore();
            }
        } else {
            // Generic diamond
            context.beginPath();
            context.moveTo(0, -iconSize * 0.6);
            context.lineTo(-iconSize * 0.5, 0);
            context.lineTo(0, iconSize * 0.6);
            context.lineTo(iconSize * 0.5, 0);
            context.closePath();
            context.fill();
        }
    }

    drawMovementIcon(context, rX, iconSize, id) {
        context.strokeStyle = '#ffffff';
        context.fillStyle = '#ffffff';
        context.lineWidth = 2 * rX;

        if (id.startsWith('speed')) {
            // Speed lines with shoe
            context.beginPath();
            context.moveTo(-iconSize * 0.5, -iconSize * 0.3);
            context.lineTo(iconSize * 0.5, -iconSize * 0.3);
            context.moveTo(-iconSize * 0.3, 0);
            context.lineTo(iconSize * 0.5, 0);
            context.moveTo(-iconSize * 0.5, iconSize * 0.3);
            context.lineTo(iconSize * 0.5, iconSize * 0.3);
            context.stroke();
            // Arrow
            context.beginPath();
            context.moveTo(iconSize * 0.5, 0);
            context.lineTo(iconSize * 0.2, -iconSize * 0.2);
            context.moveTo(iconSize * 0.5, 0);
            context.lineTo(iconSize * 0.2, iconSize * 0.2);
            context.stroke();
        } else if (id.startsWith('dash_distance')) {
            // Dash trail icon
            context.beginPath();
            context.arc(-iconSize * 0.4, 0, iconSize * 0.15, 0, Math.PI * 2);
            context.globalAlpha = 0.4;
            context.fill();
            context.globalAlpha = 0.7;
            context.beginPath();
            context.arc(0, 0, iconSize * 0.2, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = 1;
            context.beginPath();
            context.arc(iconSize * 0.4, 0, iconSize * 0.25, 0, Math.PI * 2);
            context.fill();
            // Motion lines
            context.beginPath();
            context.moveTo(-iconSize * 0.7, -iconSize * 0.2);
            context.lineTo(-iconSize * 0.4, -iconSize * 0.2);
            context.moveTo(-iconSize * 0.7, iconSize * 0.2);
            context.lineTo(-iconSize * 0.4, iconSize * 0.2);
            context.stroke();
        } else if (id.startsWith('ghost')) {
            // Ghost icon
            context.beginPath();
            context.arc(0, -iconSize * 0.1, iconSize * 0.4, Math.PI, 0);
            context.lineTo(iconSize * 0.4, iconSize * 0.4);
            // Wavy bottom
            context.quadraticCurveTo(iconSize * 0.2, iconSize * 0.2, 0, iconSize * 0.4);
            context.quadraticCurveTo(-iconSize * 0.2, iconSize * 0.2, -iconSize * 0.4, iconSize * 0.4);
            context.closePath();
            context.globalAlpha = 0.7;
            context.fill();
            context.globalAlpha = 1;
            // Eyes
            context.fillStyle = '#000000';
            context.beginPath();
            context.arc(-iconSize * 0.15, -iconSize * 0.1, iconSize * 0.08, 0, Math.PI * 2);
            context.arc(iconSize * 0.15, -iconSize * 0.1, iconSize * 0.08, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = '#ffffff';
        } else {
            // Generic arrow
            context.beginPath();
            context.moveTo(-iconSize * 0.6, 0);
            context.lineTo(iconSize * 0.6, 0);
            context.lineTo(iconSize * 0.2, -iconSize * 0.4);
            context.moveTo(iconSize * 0.6, 0);
            context.lineTo(iconSize * 0.2, iconSize * 0.4);
            context.lineWidth = 3 * rX;
            context.stroke();
        }
    }

    drawOffenseIcon(context, rX, iconSize, id) {
        context.strokeStyle = '#ffffff';
        context.fillStyle = '#ffffff';
        context.lineWidth = 2 * rX;

        if (id.startsWith('score_mult')) {
            // Coin/money icon
            context.beginPath();
            context.arc(0, 0, iconSize * 0.5, 0, Math.PI * 2);
            context.stroke();
            context.font = `bold ${iconSize * 0.7}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('$', 0, iconSize * 0.05);
        } else if (id.startsWith('bullet_size')) {
            // Big bullet icon
            context.beginPath();
            context.arc(0, 0, iconSize * 0.5, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.arc(0, 0, iconSize * 0.3, 0, Math.PI * 2);
            context.strokeStyle = '#000000';
            context.stroke();
            context.strokeStyle = '#ffffff';
        } else if (id.startsWith('range')) {
            // Crosshair with extended lines
            context.beginPath();
            context.arc(0, 0, iconSize * 0.3, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.moveTo(-iconSize * 0.7, 0);
            context.lineTo(-iconSize * 0.15, 0);
            context.moveTo(iconSize * 0.15, 0);
            context.lineTo(iconSize * 0.7, 0);
            context.moveTo(0, -iconSize * 0.7);
            context.lineTo(0, -iconSize * 0.15);
            context.moveTo(0, iconSize * 0.15);
            context.lineTo(0, iconSize * 0.7);
            context.stroke();
        } else if (id.startsWith('damage_aura')) {
            // Radiating damage icon
            context.beginPath();
            context.arc(0, 0, iconSize * 0.25, 0, Math.PI * 2);
            context.fill();
            // Outer waves
            context.beginPath();
            context.arc(0, 0, iconSize * 0.45, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.arc(0, 0, iconSize * 0.65, 0, Math.PI * 2);
            context.globalAlpha = 0.5;
            context.stroke();
            context.globalAlpha = 1;
        } else {
            // Generic star
            context.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const outerX = Math.cos(angle) * iconSize * 0.6;
                const outerY = Math.sin(angle) * iconSize * 0.6;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * iconSize * 0.25;
                const innerY = Math.sin(innerAngle) * iconSize * 0.25;
                if (i === 0) context.moveTo(outerX, outerY);
                else context.lineTo(outerX, outerY);
                context.lineTo(innerX, innerY);
            }
            context.closePath();
            context.fill();
        }
    }

    drawWeaponIcon(context, rX, iconSize) {
        // Get gun type from reward id (e.g., 'shotgun_common' -> 'shotgun')
        const gunType = this.reward.id ? this.reward.id.split('_')[0] : 'default';

        context.strokeStyle = '#ffffff';
        context.fillStyle = '#ffffff';
        context.lineWidth = 2 * rX;

        switch (gunType) {
            case 'shotgun':
                // Three spread lines
                for (let i = -1; i <= 1; i++) {
                    const angle = i * 0.4;
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Math.cos(angle) * iconSize, Math.sin(angle) * iconSize);
                    context.stroke();
                }
                // Base circle
                context.beginPath();
                context.arc(0, 0, iconSize * 0.2, 0, Math.PI * 2);
                context.fill();
                break;

            case 'rapidfire':
                // Multiple small bullets in a line
                for (let i = 0; i < 3; i++) {
                    context.beginPath();
                    context.arc(iconSize * 0.3 * i - iconSize * 0.3, 0, iconSize * 0.15, 0, Math.PI * 2);
                    context.fill();
                }
                // Speed lines
                for (let i = 0; i < 2; i++) {
                    context.beginPath();
                    context.moveTo(-iconSize * 0.6, iconSize * 0.3 * (i - 0.5));
                    context.lineTo(-iconSize * 0.3, iconSize * 0.3 * (i - 0.5));
                    context.stroke();
                }
                break;

            case 'piercing':
                // Arrow piercing through
                context.beginPath();
                context.moveTo(-iconSize * 0.8, 0);
                context.lineTo(iconSize * 0.8, 0);
                context.stroke();
                // Arrow head
                context.beginPath();
                context.moveTo(iconSize * 0.8, 0);
                context.lineTo(iconSize * 0.4, -iconSize * 0.3);
                context.moveTo(iconSize * 0.8, 0);
                context.lineTo(iconSize * 0.4, iconSize * 0.3);
                context.stroke();
                // Through rings
                context.beginPath();
                context.arc(-iconSize * 0.2, 0, iconSize * 0.25, 0, Math.PI * 2);
                context.stroke();
                context.beginPath();
                context.arc(iconSize * 0.2, 0, iconSize * 0.25, 0, Math.PI * 2);
                context.stroke();
                break;

            case 'ricochet':
                // Bouncing path
                context.beginPath();
                context.moveTo(-iconSize * 0.7, iconSize * 0.4);
                context.lineTo(-iconSize * 0.2, -iconSize * 0.4);
                context.lineTo(iconSize * 0.3, iconSize * 0.4);
                context.lineTo(iconSize * 0.7, -iconSize * 0.2);
                context.stroke();
                // Bounce markers
                context.beginPath();
                context.arc(-iconSize * 0.2, -iconSize * 0.4, iconSize * 0.1, 0, Math.PI * 2);
                context.fill();
                context.beginPath();
                context.arc(iconSize * 0.3, iconSize * 0.4, iconSize * 0.1, 0, Math.PI * 2);
                context.fill();
                break;

            case 'homing':
                // Target crosshair
                context.beginPath();
                context.arc(0, 0, iconSize * 0.5, 0, Math.PI * 2);
                context.stroke();
                context.beginPath();
                context.moveTo(-iconSize * 0.7, 0);
                context.lineTo(-iconSize * 0.3, 0);
                context.moveTo(iconSize * 0.3, 0);
                context.lineTo(iconSize * 0.7, 0);
                context.moveTo(0, -iconSize * 0.7);
                context.lineTo(0, -iconSize * 0.3);
                context.moveTo(0, iconSize * 0.3);
                context.lineTo(0, iconSize * 0.7);
                context.stroke();
                // Center dot
                context.beginPath();
                context.arc(0, 0, iconSize * 0.1, 0, Math.PI * 2);
                context.fill();
                break;

            case 'twin':
                // Two parallel bullets
                context.beginPath();
                context.arc(0, -iconSize * 0.3, iconSize * 0.2, 0, Math.PI * 2);
                context.fill();
                context.beginPath();
                context.arc(0, iconSize * 0.3, iconSize * 0.2, 0, Math.PI * 2);
                context.fill();
                // Trail lines
                context.beginPath();
                context.moveTo(-iconSize * 0.5, -iconSize * 0.3);
                context.lineTo(-iconSize * 0.2, -iconSize * 0.3);
                context.moveTo(-iconSize * 0.5, iconSize * 0.3);
                context.lineTo(-iconSize * 0.2, iconSize * 0.3);
                context.stroke();
                break;

            case 'nova':
                // Starburst pattern
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Math.cos(angle) * iconSize * 0.7, Math.sin(angle) * iconSize * 0.7);
                    context.stroke();
                }
                // Center
                context.beginPath();
                context.arc(0, 0, iconSize * 0.15, 0, Math.PI * 2);
                context.fill();
                break;

            case 'chain':
                // Lightning bolt
                context.beginPath();
                context.moveTo(-iconSize * 0.5, -iconSize * 0.6);
                context.lineTo(-iconSize * 0.1, -iconSize * 0.1);
                context.lineTo(iconSize * 0.2, -iconSize * 0.2);
                context.lineTo(-iconSize * 0.1, iconSize * 0.3);
                context.lineTo(iconSize * 0.3, iconSize * 0.1);
                context.lineTo(iconSize * 0.5, iconSize * 0.6);
                context.stroke();
                // Electric sparks
                context.beginPath();
                context.arc(iconSize * 0.4, -iconSize * 0.3, iconSize * 0.08, 0, Math.PI * 2);
                context.fill();
                context.beginPath();
                context.arc(-iconSize * 0.3, iconSize * 0.4, iconSize * 0.08, 0, Math.PI * 2);
                context.fill();
                break;

            default:
                // Default bullet/projectile icon
                context.beginPath();
                context.moveTo(-iconSize, 0);
                context.lineTo(iconSize, 0);
                context.lineTo(iconSize * 0.5, -iconSize * 0.5);
                context.moveTo(iconSize, 0);
                context.lineTo(iconSize * 0.5, iconSize * 0.5);
                context.lineWidth = 3 * rX;
                context.stroke();
                break;
        }
    }
}
