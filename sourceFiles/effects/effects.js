import { Particle, PARTICLE_PRESETS } from './particle.js';

// Import performance mode from enemy.js
import { performanceMode } from '../controller/enemy.js';

export class EffectsManager {
    constructor() {
        this.particles = [];
        this.screenFlashes = [];
        this.prevTime = performance.now();

        // Particle pool for performance
        this.maxParticles = 500;
        this.maxParticlesPerformance = 100;  // Reduced limit for performance mode
    }

    spawnBurst(x, y, preset, customConfig = {}) {
        const baseConfig = PARTICLE_PRESETS[preset] || PARTICLE_PRESETS.default || {};
        const config = { ...baseConfig, ...customConfig };

        // Reduce particle count in performance mode
        const maxCount = performanceMode ? Math.ceil((config.count || 10) / 3) : (config.count || 10);
        const currentMax = performanceMode ? this.maxParticlesPerformance : this.maxParticles;

        // Safety check for colors
        if (!config.colors || config.colors.length === 0) {
            config.colors = ['#ffffff', '#ffff00', '#ff8800'];
        }

        // Disable glow in performance mode
        const useGlow = performanceMode ? false : (config.glow || false);

        for (let i = 0; i < maxCount; i++) {
            if (this.particles.length >= currentMax) {
                // Remove oldest particle
                this.particles.shift();
            }

            const color = config.colors[Math.floor(Math.random() * config.colors.length)];
            const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
            const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
            const angle = Math.random() * Math.PI * 2;

            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: color,
                life: config.life || 500,
                gravity: config.gravity || 0,
                glow: useGlow,
                glowSize: config.glowSize || 10,
                decay: config.decay || 0.02
            });

            this.particles.push(particle);
        }
    }

    spawnTrail(x, y, preset, direction = 0) {
        const config = PARTICLE_PRESETS[preset];
        const count = Math.ceil(config.count / 3);

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const color = config.colors[Math.floor(Math.random() * config.colors.length)];
            const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
            const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);

            // Trail particles move opposite to direction with some spread
            const spread = (Math.random() - 0.5) * Math.PI * 0.5;
            const angle = direction + Math.PI + spread;

            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: color,
                life: config.life * 0.5,
                gravity: config.gravity || 0,
                glow: config.glow || false,
                glowSize: config.glowSize || 10,
                decay: config.decay * 2 || 0.04
            });

            this.particles.push(particle);
        }
    }

    addScreenFlash(color, duration, intensity = 0.3) {
        this.screenFlashes.push({
            color: color,
            duration: duration,
            maxDuration: duration,
            intensity: intensity
        });
    }

    update() {
        const now = performance.now();
        const deltaTime = now - this.prevTime;
        this.prevTime = now;

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (!this.particles[i].isAlive()) {
                this.particles.splice(i, 1);
            }
        }

        // Update screen flashes
        for (let i = this.screenFlashes.length - 1; i >= 0; i--) {
            this.screenFlashes[i].duration -= deltaTime;
            if (this.screenFlashes[i].duration <= 0) {
                this.screenFlashes.splice(i, 1);
            }
        }
    }

    draw(context) {
        // Draw particles
        for (const particle of this.particles) {
            particle.draw(context);
        }

        // Draw screen flashes
        for (const flash of this.screenFlashes) {
            const alpha = (flash.duration / flash.maxDuration) * flash.intensity;
            context.save();
            context.globalAlpha = alpha;
            context.fillStyle = flash.color;
            context.fillRect(0, 0, window.innerWidth, window.innerHeight);
            context.restore();
        }
    }

    reset() {
        this.particles = [];
        this.screenFlashes = [];
    }

    getParticleCount() {
        return this.particles.length;
    }
}

// Screen shake manager
export class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    shake(intensity, duration) {
        this.intensity = intensity;
        this.duration = duration;
    }

    update() {
        if (this.duration > 0) {
            this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
            this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
            this.duration--;

            // Decay intensity
            this.intensity *= 0.95;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
            this.intensity = 0;
        }
    }

    apply(context) {
        if (this.duration > 0) {
            context.translate(this.offsetX, this.offsetY);
        }
    }

    reset() {
        this.intensity = 0;
        this.duration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}
