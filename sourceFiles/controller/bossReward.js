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

        switch (this.reward.category) {
            case CATEGORY.GUN:
                // Bullet/projectile icon
                context.beginPath();
                context.moveTo(-iconSize, 0);
                context.lineTo(iconSize, 0);
                context.lineTo(iconSize * 0.5, -iconSize * 0.5);
                context.moveTo(iconSize, 0);
                context.lineTo(iconSize * 0.5, iconSize * 0.5);
                context.strokeStyle = '#ffffff';
                context.lineWidth = 3 * rX;
                context.stroke();
                break;

            case CATEGORY.COOLDOWN:
                // Clock icon
                context.beginPath();
                context.arc(0, 0, iconSize * 0.7, 0, Math.PI * 2);
                context.strokeStyle = '#ffffff';
                context.lineWidth = 2 * rX;
                context.stroke();
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(0, -iconSize * 0.5);
                context.moveTo(0, 0);
                context.lineTo(iconSize * 0.3, 0);
                context.stroke();
                break;

            case CATEGORY.SURVIVABILITY:
                // Heart/shield icon
                context.beginPath();
                context.moveTo(0, iconSize * 0.5);
                context.lineTo(-iconSize * 0.6, -iconSize * 0.2);
                context.lineTo(0, -iconSize * 0.6);
                context.lineTo(iconSize * 0.6, -iconSize * 0.2);
                context.closePath();
                context.fill();
                break;

            case CATEGORY.MOVEMENT:
                // Arrow/speed icon
                context.beginPath();
                context.moveTo(-iconSize * 0.6, 0);
                context.lineTo(iconSize * 0.6, 0);
                context.lineTo(iconSize * 0.2, -iconSize * 0.4);
                context.moveTo(iconSize * 0.6, 0);
                context.lineTo(iconSize * 0.2, iconSize * 0.4);
                context.strokeStyle = '#ffffff';
                context.lineWidth = 3 * rX;
                context.stroke();
                break;

            case CATEGORY.OFFENSE:
                // Star/damage icon
                context.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const outerX = Math.cos(angle) * iconSize * 0.6;
                    const outerY = Math.sin(angle) * iconSize * 0.6;
                    const innerAngle = angle + Math.PI / 5;
                    const innerX = Math.cos(innerAngle) * iconSize * 0.25;
                    const innerY = Math.sin(innerAngle) * iconSize * 0.25;

                    if (i === 0) {
                        context.moveTo(outerX, outerY);
                    } else {
                        context.lineTo(outerX, outerY);
                    }
                    context.lineTo(innerX, innerY);
                }
                context.closePath();
                context.fill();
                break;
        }
    }
}
