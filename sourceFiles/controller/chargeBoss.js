import { makeMovements } from "./makeMovement.js";

export class ChargeBoss {
    constructor(x, y) {
        const rX = window.innerWidth / 2560;

        this.x = x;
        this.y = y;

        this.baseSize = 100;
        this.size = this.baseSize * rX;

        this.maxHealth = 12;
        this.health = this.maxHealth;
        this.isAlive = true;

        this.phase = 1;
        this.phaseThresholds = { 2: 8, 3: 4 };

        // Visual properties
        this.color = '#8800ff';
        this.coreColor = '#aa00ff';
        this.glowColor = '#cc44ff';
        this.pulsePhase = 0;
        this.hitFlash = 0;

        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 200;

        this.movement = new makeMovements();

        // Entry state
        this.entering = true;
        this.entryTargetX = window.innerWidth * 0.8;
        this.entryTargetY = window.innerHeight * 0.3;

        // Hovering behavior
        this.hovering = false;
        this.hoverTarget = { x: 0, y: 0 };
        this.baseHoverSpeed = 3.0;
        this.hoverSpeed = this.baseHoverSpeed * rX;
        this.hoverChangeTime = 2000; // Change hover target every 2 seconds
        this.lastHoverChange = performance.now();

        // Charge attack
        this.charging = false;
        this.chargingWindup = false;
        this.chargeSpeed = 0;
        this.baseChargeSpeed = 45.0;
        this.chargeDirection = { x: 0, y: 0 };
        this.baseChargeWindupDuration = 800; // Base wind-up time in ms
        this.chargeWindupRandomDelay = 400; // Random additional delay (0-400ms)
        this.chargeWindupDuration = this.baseChargeWindupDuration; // Current wind-up (set per charge)
        this.chargeWindupStart = 0;
        this.chargeDuration = 1200; // Charge duration in ms
        this.chargeStart = 0;
        this.chargeCooldown = 3000; // Time between charges
        this.lastCharge = performance.now();
        this.chargeTargetX = 0;
        this.chargeTargetY = 0;
    }

    update(player, game) {
        const rX = window.innerWidth / 2560;
        this.size = this.baseSize * rX;
        this.hoverSpeed = this.baseHoverSpeed * rX;

        this.updatePhase();

        if (this.entering) {
            this.updateEntry();
            return;
        }

        if (this.chargingWindup) {
            this.updateChargeWindup(player);
        } else if (this.charging) {
            this.updateCharging(game, player);
        } else {
            this.updateHovering(player, game);
        }

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
            this.chargeCooldown = 2000;
            this.color = '#ff00ff';
            this.glowColor = '#ff44ff';
        } else if (this.health <= this.phaseThresholds[2] && this.phase < 2) {
            this.phase = 2;
            this.chargeCooldown = 2500;
            this.color = '#aa00ff';
            this.glowColor = '#dd44ff';
        }

        if (this.phase !== previousPhase) {
            this.hitFlash = 1.0;
        }
    }

    updateEntry() {
        const rX = window.innerWidth / 2560;

        const result = this.movement.make(this.x, this.y, this.hoverSpeed * 2, this.entryTargetX, this.entryTargetY);
        this.x = result[0];
        this.y = result[1];

        const dx = this.x - this.entryTargetX;
        const dy = this.y - this.entryTargetY;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
            this.entering = false;
            this.hovering = true;
            this.pickNewHoverTarget();
        }
    }

    updateHovering(player, game) {
        const now = performance.now();

        // Move towards hover target
        const result = this.movement.make(this.x, this.y, this.hoverSpeed, this.hoverTarget.x, this.hoverTarget.y);
        this.x = result[0];
        this.y = result[1];

        // Check if reached hover target or time to change
        const dx = this.x - this.hoverTarget.x;
        const dy = this.y - this.hoverTarget.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20 || now - this.lastHoverChange > this.hoverChangeTime) {
            this.pickNewHoverTarget();
            this.lastHoverChange = now;
        }

        // Check if time to charge
        if (now - this.lastCharge > this.chargeCooldown) {
            this.startChargeWindup(player);
        }
    }

    pickNewHoverTarget() {
        const margin = 150;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Randomly pick an edge: 0=top, 1=right, 2=bottom, 3=left
        const edge = Math.floor(Math.random() * 4);

        switch(edge) {
            case 0: // Top edge
                this.hoverTarget.x = margin + Math.random() * (w - margin * 2);
                this.hoverTarget.y = margin;
                break;
            case 1: // Right edge
                this.hoverTarget.x = w - margin;
                this.hoverTarget.y = margin + Math.random() * (h - margin * 2);
                break;
            case 2: // Bottom edge
                this.hoverTarget.x = margin + Math.random() * (w - margin * 2);
                this.hoverTarget.y = h - margin;
                break;
            case 3: // Left edge
                this.hoverTarget.x = margin;
                this.hoverTarget.y = margin + Math.random() * (h - margin * 2);
                break;
        }
    }

    startChargeWindup(player) {
        this.chargingWindup = true;
        this.chargeWindupStart = performance.now();
        this.hovering = false;

        // Add random delay to wind-up duration for unpredictability
        this.chargeWindupDuration = this.baseChargeWindupDuration + Math.random() * this.chargeWindupRandomDelay;
    }

    updateChargeWindup(player) {
        const now = performance.now();
        const elapsed = now - this.chargeWindupStart;

        // Continuously track player during windup
        this.chargeTargetX = player.x;
        this.chargeTargetY = player.y;

        if (elapsed >= this.chargeWindupDuration) {
            // Wind-up complete, start charge
            this.chargingWindup = false;
            this.charging = true;
            this.chargeStart = now;

            // Lock in final target position at moment of launch
            const dx = this.chargeTargetX - this.x;
            const dy = this.chargeTargetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            this.chargeDirection.x = dx / dist;
            this.chargeDirection.y = dy / dist;

            const rX = window.innerWidth / 2560;
            this.chargeSpeed = this.baseChargeSpeed * rX;

            if (window.gameSound) {
                window.gameSound.playMenuClick(); // Use existing sound or add boss charge sound
            }
        }
    }

    updateCharging(game, player) {
        const now = performance.now();
        const elapsed = now - this.chargeStart;

        // Check if went off-screen BEFORE moving (tighter bounds)
        const margin = 100;
        if (this.x < margin || this.x > window.innerWidth - margin ||
            this.y < margin || this.y > window.innerHeight - margin) {
            this.charging = false;
            this.hovering = true;
            this.lastCharge = now;
            this.pickNewHoverTarget();
            this.lastHoverChange = now;
            return;
        }

        if (elapsed >= this.chargeDuration) {
            // Charge complete
            this.charging = false;
            this.hovering = true;
            this.lastCharge = now;
            this.pickNewHoverTarget();
            this.lastHoverChange = now;
            return;
        }

        // Move in charge direction
        this.x += this.chargeDirection.x * this.chargeSpeed;
        this.y += this.chargeDirection.y * this.chargeSpeed;
    }

    updateVisuals() {
        this.pulsePhase += 0.08;
        if (this.hitFlash > 0) {
            this.hitFlash -= 0.05;
        }
    }

    draw(context) {
        const rX = window.innerWidth / 2560;
        let pulse = 0.9 + Math.sin(this.pulsePhase) * 0.1;

        context.save();

        // Enhanced effects during charging states
        if (this.chargingWindup) {
            const windupProgress = (performance.now() - this.chargeWindupStart) / this.chargeWindupDuration;
            pulse = 1.0 + windupProgress * 0.3;
            context.globalAlpha = 0.8 + Math.sin(performance.now() * 0.02) * 0.2;
        }

        if (this.invulnerable) {
            context.globalAlpha = 0.5 + Math.sin(performance.now() * 0.02) * 0.3;
        }

        // Draw charging indicator
        if (this.chargingWindup) {
            this.drawChargeIndicator(context, rX);
        }

        // Main boss body
        context.shadowColor = this.glowColor;
        context.shadowBlur = (25 + this.phase * 10) * rX * pulse;

        context.beginPath();
        context.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
        context.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        context.fill();

        // Phase rings
        this.drawPhaseRings(context, rX, pulse);

        // Core
        context.beginPath();
        context.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.coreColor;
        context.arc(this.x, this.y, this.size * 0.5 * pulse, 0, Math.PI * 2);
        context.fill();

        // Horns/spikes
        this.drawHorns(context, rX);

        context.restore();

        // UI elements
        this.drawHealthBar(context, rX);
        this.drawPhaseIndicator(context, rX);

        // Draw charge trajectory preview
        if (this.chargingWindup) {
            this.drawChargeTrajectory(context, rX);
        }
    }

    drawChargeIndicator(context, rX) {
        const windupProgress = (performance.now() - this.chargeWindupStart) / this.chargeWindupDuration;
        const size = this.size * 1.5;

        // Pulsing circle
        context.strokeStyle = '#ffff00';
        context.lineWidth = 5 * rX;
        context.globalAlpha = 0.5 + windupProgress * 0.5;
        context.beginPath();
        context.arc(this.x, this.y, size * (1 + windupProgress * 0.2), 0, Math.PI * 2);
        context.stroke();

        // Progress arc
        context.strokeStyle = '#ff0000';
        context.lineWidth = 8 * rX;
        context.globalAlpha = 0.8;
        context.beginPath();
        context.arc(this.x, this.y, size, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * windupProgress), false);
        context.stroke();
    }

    drawChargeTrajectory(context, rX) {
        context.save();
        context.strokeStyle = '#ff0000';
        context.lineWidth = 4 * rX;
        context.globalAlpha = 0.6;  // More visible
        context.setLineDash([15 * rX, 10 * rX]);

        // Draw line directly to current charge target (player position)
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(this.chargeTargetX, this.chargeTargetY);
        context.stroke();

        // Draw target reticle on player
        context.setLineDash([]);
        context.strokeStyle = '#ff0000';
        context.lineWidth = 3 * rX;
        context.globalAlpha = 0.8;
        const reticleSize = 30 * rX;
        
        // Crosshair
        context.beginPath();
        context.moveTo(this.chargeTargetX - reticleSize, this.chargeTargetY);
        context.lineTo(this.chargeTargetX + reticleSize, this.chargeTargetY);
        context.moveTo(this.chargeTargetX, this.chargeTargetY - reticleSize);
        context.lineTo(this.chargeTargetX, this.chargeTargetY + reticleSize);
        context.stroke();
        
        // Circle
        context.beginPath();
        context.arc(this.chargeTargetX, this.chargeTargetY, reticleSize * 0.7, 0, Math.PI * 2);
        context.stroke();
        
        context.restore();
    }

    drawPhaseRings(context, rX, pulse) {
        context.strokeStyle = this.glowColor;
        context.lineWidth = 3 * rX;
        for (let i = 0; i < this.phase; i++) {
            const ringSize = this.size * (0.7 + i * 0.2) * pulse;
            context.beginPath();
            context.arc(this.x, this.y, ringSize, 0, Math.PI * 2);
            context.stroke();
        }
    }

    drawHorns(context, rX) {
        const hornLength = this.size * 0.4;
        const hornWidth = this.size * 0.15;

        context.fillStyle = this.phase >= 3 ? '#ff00ff' : this.coreColor;
        context.shadowColor = this.glowColor;
        context.shadowBlur = 10 * rX;

        // Top horns
        for (let i = 0; i < this.phase; i++) {
            const angle = (Math.PI / 2) - (i * Math.PI / 3);
            context.beginPath();
            context.moveTo(this.x, this.y - this.size * 0.3);
            context.lineTo(this.x + Math.cos(angle) * hornLength, this.y - this.size * 0.3 + Math.sin(angle) * hornLength);
            context.lineTo(this.x + Math.cos(angle + 0.3) * hornWidth, this.y - this.size * 0.3 + Math.sin(angle + 0.3) * hornWidth);
            context.fill();
        }
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
        context.fillText(`CHARGE BOSS - PHASE ${this.phase}`, this.x, this.y - this.size - 60 * rX);
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