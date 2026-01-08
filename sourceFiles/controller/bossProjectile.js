export class BossProjectile {
    constructor(x, y, targetX, targetY, speed, size) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.xDir = (this.targetX - this.spawnX)/(Math.abs(this.targetX - this.spawnX));
        this.yDir = (this.targetY - this.spawnY)/(Math.abs(this.targetY - this.spawnY));

        const rX = window.innerWidth / 2560;
        this.speed = speed * rX;
        this.size = size * rX;

        this.color = '#ff6600';
        this.glowColor = '#ffaa00';

        // Calculate trajectory toward target
        this.calculateTrajectory(targetX, targetY);

        this.destroy = false;
        this.playerCollision = false;

        // Visual effects
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trail = [];
        this.maxTrailLength = 8;
    }

    calculateTrajectory(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        } else {
            this.vx = 0;
            this.vy = this.speed;
        }

        this.angle = Math.atan2(dy, dx);
    }

    update() {
        // Store position for trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Move projectile
        this.x += this.vx;
        this.y += this.vy;
        //console.log(this.x,' ', this.y);

        // Update pulse
        this.pulsePhase += 0.15;

        // Check if out of bounds
        const margin = 0;
        if (this.x < -margin || this.x > window.innerWidth + margin ||
            this.y < -margin || this.y > window.innerHeight + margin) {
            if(this.xDir < 0 && this.x < this.targetX &&
                this.yDir < 0 && this.y < this.targetY ||
                this.xDir > 0 && this.x > this.targetX &&
                this.yDir > 0 && this.y > this.targetY ||
                this.xDir > 0 && this.x > this.targetX &&
                this.yDir < 0 && this.y < this.targetY ||
                this.xDir < 0 && this.x < this.targetX &&
                this.yDir > 0 && this.y > this.targetY){
                    this.destroy = true;
                    /*console.log(`boss projectile destroyed
                                X: ${this.x}, Y: ${this.y}
                                Tx: ${this.targetX}, Ty: ${this.targetY}
                                xDir: ${this.xDir}, yDir: ${this.yDir}
                                spawnX: ${this.spawnX}, spawnY: ${this.spawnY}`);*/
                }
        }
    }

    checkCollision(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const rX = window.innerWidth / 2560;
        const collisionDistance = this.size + (player.size * rX);

        if (distance < collisionDistance) {
            this.playerCollision = true;
            return true;
        }
        return false;
    }

    draw(context) {
        const rX = window.innerWidth / 2560;
        const pulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.5;
            const trailSize = this.size * (i / this.trail.length) * 0.7;

            context.save();
            context.globalAlpha = alpha;
            context.beginPath();
            context.fillStyle = this.glowColor;
            context.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }

        context.save();

        // Outer glow
        context.shadowColor = this.glowColor;
        context.shadowBlur = 20 * rX * pulse;

        // Main projectile
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        context.fill();

        // Inner bright core
        context.beginPath();
        context.fillStyle = '#ffffff';
        context.arc(this.x, this.y, this.size * 0.4 * pulse, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }
}
