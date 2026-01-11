import { makeMovements } from "./makeMovement.js";
import { BossProjectile } from "./bossProjectile.js";

export class Boss {
    constructor(x, y) {
        const rX = window.innerWidth / 2560;

        this.x = x;
        this.y = y;

        this.baseSize = 120;
        this.size = this.baseSize * rX;

        this.baseSpeed = 2.0;
        this.speed = this.baseSpeed * rX;

        this.maxHealth = 15;
        this.health = this.maxHealth;
        this.isAlive = true;

        this.phase = 1;
        this.phaseThresholds = { 2: 10, 3: 5 };

        this.color = '#cc0000';
        this.coreColor = '#ff0000';
        this.glowColor = '#ff4400';
        this.pulsePhase = 0;
        this.hitFlash = 0;

        this.projectiles = [];
        this.lastShot = performance.now();
        this.shootCooldown = 1500;

        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 200;

        this.movement = new makeMovements();

        this.entering = true;
        this.entryTargetX = window.innerWidth * 0.7;
        this.entryTargetY = window.innerHeight * 0.5;

        // Track window size for resize handling
        this.prevWindowW = window.innerWidth;
        this.prevWindowH = window.innerHeight;
    }

    update(player, game) {
        // Handle window resize - recalculate coordinates
        if (window.innerWidth !== this.prevWindowW || window.innerHeight !== this.prevWindowH) {
            const scaleX = window.innerWidth / this.prevWindowW;
            const scaleY = window.innerHeight / this.prevWindowH;

            // Scale current position
            this.x *= scaleX;
            this.y *= scaleY;

            // Recalculate entry target based on new window size
            this.entryTargetX = window.innerWidth * 0.7;
            this.entryTargetY = window.innerHeight * 0.5;

            // Scale projectile positions
            for (const proj of this.projectiles) {
                proj.x *= scaleX;
                proj.y *= scaleY;
                proj.targetX *= scaleX;
                proj.targetY *= scaleY;
            }

            this.prevWindowW = window.innerWidth;
            this.prevWindowH = window.innerHeight;
        }

        const rX = window.innerWidth / 2560;
        this.size = this.baseSize * rX;

        this.updatePhase();

        if (this.entering) {
            this.updateEntry();
            return;
        }

        this.updateMovement(player);
        this.updateProjectiles(player, game);
        this.updateVisuals();

        if (this.invulnerable) {
            if (performance.now() - this.invulnerableTime > this.invulnerableDuration) {
                this.invulnerable = false;
            }
        }
    }

    updatePhase() {
        const previousPhase = this.phase;

        if (this.health <= this.phaseThresholds[3] && this.phase < 3) {
            this.phase = 3;
            this.shootCooldown = 800;
            this.color = '#ff0000';
            this.glowColor = '#ff0000';
        } else if (this.health <= this.phaseThresholds[2] && this.phase < 2) {
            this.phase = 2;
            this.shootCooldown = 1500;
            this.color = '#dd0000';
            this.glowColor = '#ff2200';
        }

        if (this.phase !== previousPhase) {
            this.hitFlash = 1.0;
        }
    }

    updateEntry() {
        const rX = window.innerWidth / 2560;
        let entrySpeed = 5.0;
        this.speed = (this.baseSpeed + entrySpeed) * rX;

        const result = this.movement.make(this.x, this.y, this.speed * 2, this.entryTargetX, this.entryTargetY);
        this.x = result[0];
        this.y = result[1];

        const dx = this.x - this.entryTargetX;
        const dy = this.y - this.entryTargetY;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
            this.entering = false;
        }
    }

    updateMovement(player) {
        const rX = window.innerWidth / 2560;
        this.speed = this.baseSpeed * rX;

        const result = this.movement.make(this.x, this.y, this.speed, player.x, player.y);
        this.x = result[0];
        this.y = result[1];
    }

    updateProjectiles(player, game) {
        const now = performance.now();

        if (now - this.lastShot > this.shootCooldown) {
            this.shootAtPlayer(player);
            this.lastShot = now;
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update();

            if (proj.checkCollision(player)) {
                // Check if god mode is enabled
                if (game.devMode && game.devMode.isEnabled() && game.devMode.godMode) {
                    // God mode - destroy projectile but don't kill player
                    proj.destroy = true;
                } else if (game.rewardManager && game.rewardManager.canSurviveHit(true)) {
                    // Shield or extra life blocked the projectile
                    proj.destroy = true;
                    if (game.effects) {
                        game.effects.spawnBurst(proj.x, proj.y, 'shieldBlock');
                        game.world.shake(5, 10);
                    }
                } else {
                    game.gameOver = true;
                    proj.destroy = true;
                    if (window.gameSound) window.gameSound.playPlayerDeath();
                }
            }

            if (proj.destroy) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    shootAtPlayer(player) {
        const rX = window.innerWidth / 2560;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const spawnX = this.x + Math.cos(angle) * this.size;
        const spawnY = this.y + Math.sin(angle) * this.size;

        // Play shooter boss unique sound
        if (window.gameSound) window.gameSound.playShooterBossShoot();

        if (this.phase === 1) {
            // Phase 1: Single shot at player
            const projectile = new BossProjectile(spawnX, spawnY, player.x, player.y, 12, 15);
            this.projectiles.push(projectile);
        } else if (this.phase === 2) {
            // Phase 2: Two shots in a small spread
            const spreadAngle = 0.15;
            const leftProj = new BossProjectile(spawnX, spawnY,
                this.x + Math.cos(angle + spreadAngle) * 500,
                this.y + Math.sin(angle + spreadAngle) * 500, 12, 15);
            this.projectiles.push(leftProj);
            const rightProj = new BossProjectile(spawnX, spawnY,
                this.x + Math.cos(angle - spreadAngle) * 500,
                this.y + Math.sin(angle - spreadAngle) * 500, 12, 15);
            this.projectiles.push(rightProj);
        } else {
            // Phase 3: Three shots in a wider spread
            const projectile = new BossProjectile(spawnX, spawnY, player.x, player.y, 12, 15);
            this.projectiles.push(projectile);
            const spreadAngle = 0.3;
            const leftProj = new BossProjectile(spawnX, spawnY,
                this.x + Math.cos(angle + spreadAngle) * 500,
                this.y + Math.sin(angle + spreadAngle) * 500, 10, 12);
            this.projectiles.push(leftProj);
            const rightProj = new BossProjectile(spawnX, spawnY,
                this.x + Math.cos(angle - spreadAngle) * 500,
                this.y + Math.sin(angle - spreadAngle) * 500, 10, 12);
            this.projectiles.push(rightProj);
        }
    }

    updateVisuals() {
        this.pulsePhase += 0.08;
        if (this.hitFlash > 0) {
            this.hitFlash -= 0.05;
        }
    }

    draw(context) {
        const rX = window.innerWidth / 2560;
        const pulse = 0.9 + Math.sin(this.pulsePhase) * 0.1;

        context.save();
        for (const proj of this.projectiles) {
            proj.draw(context);
        }

        if (this.invulnerable) {
            context.globalAlpha = 0.5 + Math.sin(performance.now() * 0.02) * 0.3;
        }

        if (this.hitFlash > 0) {
            context.globalAlpha = Math.min(1, context.globalAlpha || 1);
        }

        context.shadowColor = this.glowColor;
        context.shadowBlur = (30 + this.phase * 10) * rX * pulse;

        context.beginPath();
        context.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
        context.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        context.fill();

        this.drawPhaseRings(context, rX, pulse);

        context.beginPath();
        context.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.coreColor;
        context.arc(this.x, this.y, this.size * 0.4 * pulse, 0, Math.PI * 2);
        context.fill();

        this.drawEyes(context, rX);
        context.restore();

        this.drawHealthBar(context, rX);
        this.drawPhaseIndicator(context, rX);
    }

    drawPhaseRings(context, rX, pulse) {
        context.strokeStyle = this.glowColor;
        context.lineWidth = 3 * rX;
        for (let i = 0; i < this.phase; i++) {
            const ringSize = this.size * (0.6 + i * 0.25) * pulse;
            context.beginPath();
            context.arc(this.x, this.y, ringSize, 0, Math.PI * 2);
            context.stroke();
        }
    }

    drawEyes(context, rX) {
        const eyeOffset = this.size * 0.25;
        const eyeSize = this.size * 0.15;
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(this.x - eyeOffset, this.y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(this.x + eyeOffset, this.y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = this.phase >= 3 ? '#ff0000' : '#ffff00';
        context.shadowColor = context.fillStyle;
        context.shadowBlur = 5 * rX;
        context.beginPath();
        context.arc(this.x - eyeOffset, this.y - eyeOffset * 0.5, eyeSize * 0.5, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(this.x + eyeOffset, this.y - eyeOffset * 0.5, eyeSize * 0.5, 0, Math.PI * 2);
        context.fill();
    }

    drawHealthBar(context, rX) {
        const barWidth = 200 * rX;
        const barHeight = 15 * rX;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 40 * rX;

        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2 * rX;
        context.strokeRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        context.fillStyle = healthPercent > 0.6 ? '#00ff00' : (healthPercent > 0.3 ? '#ffff00' : '#ff0000');
        context.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    drawPhaseIndicator(context, rX) {
        context.save();
        context.font = (20 * rX) + "px Arial Black";
        context.textAlign = 'center';
        context.fillStyle = '#ffffff';
        context.shadowColor = this.glowColor;
        context.shadowBlur = 10 * rX;
        context.fillText(`BOSS - PHASE ${this.phase}`, this.x, this.y - this.size - 60 * rX);
        context.restore();
    }

    checkCollision(player, bullets) {
        // Only check player and normal bullets
        // VoidBolts handle their own collision
        const rX = window.innerWidth / 2560;
        const playerDx = this.x - player.x;
        const playerDy = this.y - player.y;
        if (Math.sqrt(playerDx * playerDx + playerDy * playerDy) < (this.size + player.size * rX)) {
            return { type: 'player' };
        }

        if (!this.invulnerable && !this.entering && bullets.bulletsList) {
            for (let i = bullets.bulletsList.length - 1; i >= 0; i--) {
                const bullet = bullets.bulletsList[i];
                const bulletDx = this.x - bullet.x;
                const bulletDy = this.y - bullet.y;
                const dist = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
                if (dist < (this.size + bullet.size)) {
                    // Ricochet bullets bounce off boss instead of being destroyed
                    if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                        // Calculate reflection
                        const nx = -bulletDx / dist;
                        const ny = -bulletDy / dist;
                        const dot = bullet.dirX * nx + bullet.dirY * ny;
                        bullet.dirX = bullet.dirX - 2 * dot * nx;
                        bullet.dirY = bullet.dirY - 2 * dot * ny;
                        bullet.angle = Math.atan2(bullet.dirY, bullet.dirX);

                        // Push bullet outside boss
                        bullet.x = this.x + nx * (this.size + bullet.size + 5);
                        bullet.y = this.y + ny * (this.size + bullet.size + 5);

                        bullet.bouncesRemaining--;
                        bullet.maxTravel += bullet.maxTravel * 0.3;

                        // Update end position
                        const remaining = bullet.maxTravel - bullet.distanceTraveled;
                        bullet.endX = bullet.x + bullet.dirX * remaining;
                        bullet.endY = bullet.y + bullet.dirY * remaining;
                    } else {
                        bullets.bulletsList.splice(i, 1);
                    }
                    this.takeDamage();
                    return { type: 'bullet', x: bullet.x, y: bullet.y };
                }
            }
        }
        return null;
    }

    takeDamage() {
        if (!this.invulnerable) {
            this.health--;
            this.invulnerable = true;
            this.invulnerableTime = performance.now();
            this.hitFlash = 1.0;
            if (this.health <= 0) this.isAlive = false;
        }
    }
}