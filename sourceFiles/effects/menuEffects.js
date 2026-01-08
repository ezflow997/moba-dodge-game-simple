export class MenuEffects {
    constructor() {
        this.floatingParticles = [];
        this.maxParticles = 50;
        this.waveOffset = 0;
        this.gradientPhase = 0;
        this.initialized = false;

        // Color palette for effects
        this.colors = ['#00ffff', '#00ff88', '#88ffff', '#ffffff', '#00aaff'];
    }

    drawMenuBackground(context, game){
        context.fillStyle = 'rgba(10, 10, 26, 0.95)';
        context.fillRect(0, 0, game.width, game.height);
    }

    init(width, height) {
        // Spawn initial floating particles
        for (let i = 0; i < this.maxParticles; i++) {
            this.spawnFloatingParticle(width, height);
        }
        this.initialized = true;
    }

    spawnFloatingParticle(width, height) {
        const particle = {
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: -Math.random() * 0.8 - 0.2,
            alpha: Math.random() * 0.6 + 0.2,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.05 + 0.02
        };
        this.floatingParticles.push(particle);
    }

    update(width, height) {
        if (!this.initialized) {
            this.init(width, height);
        }

        // Update gradient phase
        this.gradientPhase += 0.01;
        this.waveOffset += 0.02;

        // Update floating particles
        for (let i = this.floatingParticles.length - 1; i >= 0; i--) {
            const p = this.floatingParticles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulsePhase += p.pulseSpeed;

            // Respawn if out of bounds
            if (p.y < -20 || p.x < -20 || p.x > width + 20) {
                this.floatingParticles.splice(i, 1);
                this.spawnFloatingParticle(width, height);
                // Reset new particle to bottom
                this.floatingParticles[this.floatingParticles.length - 1].y = height + 10;
            }
        }

        // Maintain particle count
        while (this.floatingParticles.length < this.maxParticles) {
            this.spawnFloatingParticle(width, height);
            this.floatingParticles[this.floatingParticles.length - 1].y = height + 10;
        }
    }

    drawAnimatedBackground(context, width, height) {
        // Animated dark gradient background
        const gradient = context.createLinearGradient(0, 0, 0, height);

        const shift = Math.sin(this.gradientPhase) * 0.1;
        gradient.addColorStop(0, `rgb(${5 + shift * 20}, ${5 + shift * 15}, ${15 + shift * 30})`);
        gradient.addColorStop(0.4, `rgb(${10 + shift * 15}, ${15 + shift * 20}, ${30 + shift * 40})`);
        gradient.addColorStop(0.7, `rgb(${5 + shift * 10}, ${10 + shift * 15}, ${25 + shift * 35})`);
        gradient.addColorStop(1, `rgb(${2}, ${2}, ${8})`);

        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        // Draw subtle animated wave overlay
        this.drawWaveOverlay(context, width, height);
    }

    drawWaveOverlay(context, width, height) {
        context.save();
        context.globalAlpha = 0.03;

        for (let layer = 0; layer < 3; layer++) {
            const offset = this.waveOffset + layer * 0.5;
            const amplitude = 30 + layer * 20;
            const frequency = 0.003 - layer * 0.0005;

            context.beginPath();
            context.moveTo(0, height);

            for (let x = 0; x <= width; x += 10) {
                const y = height * 0.6 + Math.sin(x * frequency + offset) * amplitude + layer * 50;
                context.lineTo(x, y);
            }

            context.lineTo(width, height);
            context.closePath();

            const waveGradient = context.createLinearGradient(0, height * 0.5, 0, height);
            waveGradient.addColorStop(0, this.colors[layer % this.colors.length]);
            waveGradient.addColorStop(1, 'transparent');
            context.fillStyle = waveGradient;
            context.fill();
        }

        context.restore();
    }

    drawFloatingParticles(context) {
        const rX = window.innerWidth / 2560;

        for (const p of this.floatingParticles) {
            const pulseFactor = 0.7 + Math.sin(p.pulsePhase) * 0.3;
            const size = p.size * pulseFactor * rX;
            const alpha = p.alpha * pulseFactor;

            context.save();
            context.globalAlpha = alpha;
            context.shadowColor = p.color;
            context.shadowBlur = 10 * rX;

            context.beginPath();
            context.fillStyle = p.color;
            context.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
            context.fill();

            context.restore();
        }
    }

    // Draw glowing title text
    drawTitle(context, text, x, y, size) {
        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;
        const pulse = 0.8 + Math.sin(this.gradientPhase * 2) * 0.2;

        context.save();

        // Glow layers
        for (let i = 3; i > 0; i--) {
            context.shadowColor = '#00ffff';
            context.shadowBlur = (15 * i * pulse) * rX;
            context.font = (size * rX) + "px Arial Black";
            context.fillStyle = `rgba(0, 255, 255, ${0.3 / i})`;
            context.fillText(text, x * rX, y * rY);
        }

        // Main text with gradient
        const textGradient = context.createLinearGradient(
            x * rX, (y - size) * rY,
            x * rX, y * rY
        );
        textGradient.addColorStop(0, '#ffffff');
        textGradient.addColorStop(0.5, '#00ffff');
        textGradient.addColorStop(1, '#0088ff');

        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.font = (size * rX) + "px Arial Black";
        context.fillStyle = textGradient;
        context.fillText(text, x * rX, y * rY);

        context.restore();
    }

    reset() {
        this.floatingParticles = [];
        this.initialized = false;
        this.waveOffset = 0;
        this.gradientPhase = 0;
    }
}
