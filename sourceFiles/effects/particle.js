export class Particle {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;

        // Velocity - random direction if not specified
        const angle = config.angle !== undefined ? config.angle : Math.random() * Math.PI * 2;
        const speed = config.speed !== undefined ? config.speed : (Math.random() * 4 + 2);
        this.vx = config.vx !== undefined ? config.vx : Math.cos(angle) * speed;
        this.vy = config.vy !== undefined ? config.vy : Math.sin(angle) * speed;

        // Visual properties
        this.size = config.size !== undefined ? config.size : (Math.random() * 4 + 2);
        this.color = config.color || 'white';
        this.alpha = config.alpha !== undefined ? config.alpha : 1.0;

        // Lifecycle
        this.life = config.life !== undefined ? config.life : 1000;
        this.maxLife = this.life;
        this.decay = config.decay !== undefined ? config.decay : 0.02;

        // Physics
        this.gravity = config.gravity !== undefined ? config.gravity : 0;
        this.friction = config.friction !== undefined ? config.friction : 0.98;

        // Glow effect
        this.glow = config.glow !== undefined ? config.glow : false;
        this.glowSize = config.glowSize !== undefined ? config.glowSize : 10;

        // Scaling
        this.shrink = config.shrink !== undefined ? config.shrink : true;
        this.initialSize = this.size;
    }

    update(deltaTime) {
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Apply physics
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Decay
        this.life -= deltaTime;
        this.alpha = Math.max(0, this.alpha - this.decay);

        // Shrink over lifetime
        if (this.shrink) {
            const lifeRatio = Math.max(0, this.life / this.maxLife);
            this.size = this.initialSize * lifeRatio;
        }
    }

    draw(context) {
        if (this.alpha <= 0 || this.size <= 0) return;

        const rX = window.innerWidth / 2560;
        const scaledSize = this.size * rX;

        // Skip very small particles
        if (scaledSize < 0.5) return;

        // Viewport culling - skip drawing if outside visible area
        const cullBuffer = scaledSize + (this.glow ? this.glowSize * rX : 0);
        if (this.x < -cullBuffer || this.x > window.innerWidth + cullBuffer ||
            this.y < -cullBuffer || this.y > window.innerHeight + cullBuffer) {
            return;
        }

        // Only use glow for visible, larger particles (shadowBlur is expensive)
        const useGlow = this.glow && this.alpha > 0.3 && scaledSize > 2;

        if (useGlow) {
            context.save();
            context.globalAlpha = this.alpha;
            context.shadowColor = this.color;
            context.shadowBlur = this.glowSize * rX;
            context.beginPath();
            context.fillStyle = this.color;
            context.arc(this.x, this.y, scaledSize, 0, Math.PI * 2);
            context.fill();
            context.restore();
        } else {
            // Fast path without glow - no save/restore needed
            const prevAlpha = context.globalAlpha;
            context.globalAlpha = this.alpha;
            context.beginPath();
            context.fillStyle = this.color;
            context.arc(this.x, this.y, scaledSize, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = prevAlpha;
        }
    }

    isAlive() {
        return this.alpha > 0 && this.life > 0 && this.size > 0;
    }
}

// Preset configurations for different effects
export const PARTICLE_PRESETS = {
    enemyDeath: {
        count: 15,
        colors: ['#00ff00', '#32cd32', '#7cfc00', '#adff2f', 'white'],
        speedMin: 3,
        speedMax: 8,
        sizeMin: 3,
        sizeMax: 8,
        life: 600,
        gravity: 0.15,
        glow: true,
        glowSize: 8
    },
    playerDash: {
        count: 10,
        colors: ['#00ffff', '#00bfff', '#1e90ff', 'white'],
        speedMin: 1,
        speedMax: 4,
        sizeMin: 2,
        sizeMax: 6,
        life: 400,
        gravity: 0,
        glow: true,
        glowSize: 6
    },
    bossHit: {
        count: 12,
        colors: ['#ff4500', '#ff6347', '#ff0000', 'white'],
        speedMin: 4,
        speedMax: 10,
        sizeMin: 4,
        sizeMax: 10,
        life: 500,
        gravity: 0.1,
        glow: true,
        glowSize: 12
    },
    bossDeath: {
        count: 60,
        colors: ['#ff0000', '#ff4500', '#ffa500', '#ffff00', 'white'],
        speedMin: 5,
        speedMax: 15,
        sizeMin: 5,
        sizeMax: 18,
        life: 1200,
        gravity: 0.08,
        glow: true,
        glowSize: 15
    },
    menuSparkle: {
        count: 1,
        colors: ['#ffffff', '#f0f8ff', '#e6e6fa', '#87ceeb'],
        speedMin: 0.2,
        speedMax: 0.8,
        sizeMin: 1,
        sizeMax: 3,
        life: 3000,
        gravity: -0.02,
        glow: true,
        glowSize: 5,
        decay: 0.005
    },
    bulletHit: {
        count: 8,
        colors: ['#ffff00', '#ffd700', '#ffa500', 'white'],
        speedMin: 2,
        speedMax: 6,
        sizeMin: 2,
        sizeMax: 5,
        life: 300,
        gravity: 0.1,
        glow: true,
        glowSize: 6
    }
};
