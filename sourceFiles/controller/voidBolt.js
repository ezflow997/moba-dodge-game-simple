export class VoidBolt {
    constructor(x, y, targetX, targetY, speed, size, canSplit = true) {
        this.x = x;
        this.y = y;
        this.speed = speed * window.innerWidth / 2560;
        this.size = size * window.innerWidth / 2560;
        this.splitSpeed = 2.7;
        
        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
        this.angle = Math.atan2(dy, dx);
        
        // State
        this.destroy = false;
        this.canSplit = canSplit;
        this.hasSplit = false;
        
        // Visual effects
        this.color = '#bb77ff';      // Light purple
        this.glowColor = '#dd99ff';  // Bright light purple
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trail = [];
        this.maxTrailLength = 8;

        // Range tracking
        this.startX = x;
        this.startY = y;
        this.maxRange = 780 * window.innerWidth / 2560; // Same as bullets
        this.distanceTraveled = 0;
    }
    
    update() {
        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Track distance traveled
        const dx = this.x - this.startX;
        const dy = this.y - this.startY;
        this.distanceTraveled = Math.sqrt(dx * dx + dy * dy);
        
        // Destroy if exceeded range
        if (this.distanceTraveled > this.maxRange) {
            this.destroy = true;
        }
        
        // Trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Pulse
        this.pulsePhase += 0.15;
        
        // Check bounds
        if (this.x < -50 || this.x > window.innerWidth + 50 ||
            this.y < -50 || this.y > window.innerHeight + 50) {
            this.destroy = true;
        }
    }
    
    split() {
        if (!this.canSplit || this.hasSplit) return null;
        
        this.hasSplit = true;
        
        // Create two bolts at 45-degree angles from current direction
        const splitAngle = Math.PI / 2; // 90 degrees
        
        const bolt1 = new VoidBolt(this.x, this.y, 0, 0, this.speed / (window.innerWidth / 2560), this.size / (window.innerWidth / 2560), false);
        const angle1 = this.angle - splitAngle;
        bolt1.vx = Math.cos(angle1) * this.speed * this.splitSpeed;
        bolt1.vy = Math.sin(angle1) * this.speed * this.splitSpeed;
        bolt1.angle = angle1;
        bolt1.startX = this.x;
        bolt1.startY = this.y;
        bolt1.distanceTraveled = 0;
        
        const bolt2 = new VoidBolt(this.x, this.y, 0, 0, this.speed / (window.innerWidth / 2560), this.size / (window.innerWidth / 2560), false);
        const angle2 = this.angle + splitAngle;
        bolt2.vx = Math.cos(angle2) * this.speed * this.splitSpeed;
        bolt2.vy = Math.sin(angle2) * this.speed * this.splitSpeed;
        bolt2.angle = angle2;
        bolt2.startX = this.x;
        bolt2.startY = this.y;
        bolt2.distanceTraveled = 0;
        
        // Mark original for destruction
        this.destroy = true;
        
        return [bolt1, bolt2];
    }
    
    checkCollision(enemies, boss) {
        const rX = window.innerWidth / 2560;
        
        // Check regular enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (this.size + enemy.size)) {
                enemies.splice(i, 1);
                this.destroy = true;
                return { type: 'enemy', index: i };
            }
        }
        
        // Check boss
        if (boss && boss.isAlive && !boss.invulnerable && !boss.entering) {
            const dx = this.x - boss.x;
            const dy = this.y - boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (this.size + boss.size)) {
                this.destroy = true;
                boss.takeDamage();
                
                // Vortex boss shockwave
                if (boss.phase >= 3 && boss.executeShockwave) {
                    boss.executeShockwave();
                }
                
                return { type: 'boss' };
            }
            
            // Check vortex boss orbitals
            if (boss.orbitalRings) {
                for (let ring of boss.orbitalRings) {
                    for (let orbital of ring.orbitals) {
                        if (orbital.health <= 0) continue;
                        
                        const ox = boss.x + Math.cos(orbital.angle + boss.rotationAngle) * orbital.radius * rX;
                        const oy = boss.y + Math.sin(orbital.angle + boss.rotationAngle) * orbital.radius * rX;
                        const odx = this.x - ox;
                        const ody = this.y - oy;
                        
                        if (Math.sqrt(odx * odx + ody * ody) < (this.size + orbital.size)) {
                            orbital.health--;
                            this.destroy = true;
                            if (window.gameSound) window.gameSound.playMenuClick();
                            return { type: 'orbital' };
                        }
                    }
                }
            }
        }
        
        return null;
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