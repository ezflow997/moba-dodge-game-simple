export class VortexBoss {
    constructor(x, y) {
        const rX = window.innerWidth / 2560;

        this.x = x;
        this.y = y;

        this.baseSize = 110;
        this.size = this.baseSize * rX;

        this.maxHealth = 15;
        this.health = this.maxHealth;
        this.isAlive = true;

        this.phase = 1;
        this.phaseThresholds = { 2: 10, 3: 5 };

        // Visual properties
        this.color = '#8800ff';
        this.coreColor = '#cc00ff';
        this.glowColor = '#ff00ff';
        this.pulsePhase = 0;
        this.rotationAngle = 0;
        this.geometryRotation = 0;
        this.hitFlash = 0;
        this.breathPhase = 0;

        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 100;

        // Movement
        this.baseSpeed = 1.5;
        this.speed = this.baseSpeed * rX;
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.02;
        this.centerX = window.innerWidth * 0.6;
        this.centerY = window.innerHeight * 0.5;

        // Entry state
        this.entering = true;
        this.entryTargetX = this.centerX;
        this.entryTargetY = this.centerY;

        // Orbital rings
        this.orbitalRings = [];
        this.createOrbitalRing(1); // Start with 1 ring

        // Attack patterns
        this.homingMissiles = [];
        this.lastHomingShot = performance.now();
        this.homingCooldown = 3500;

        this.spiralProjectiles = [];
        this.lastSpiral = performance.now();
        this.spiralCooldown = 6000;
        this.isSpiralAttacking = false;

        this.voidZones = [];

        // Pulse attack
        this.pulseCharging = false;
        this.pulseChargeDuration = 1000;
        this.pulseChargeStart = 0;
        this.lastPulse = performance.now();
        this.pulseCooldown = 8000;
    }

    createOrbitalRing(ringCount) {
        this.orbitalRings = [];
        
        for (let ring = 0; ring < ringCount; ring++) {
            const projectilesInRing = 4 + (ring * 2);
            const radius = (ring + 1) * 80;
            const clockwise = ring % 2 === 0;
            const speed = (0.02 + ring * 0.01) * (clockwise ? 1 : -1);
            
            const orbitals = [];
            for (let i = 0; i < projectilesInRing; i++) {
                orbitals.push({
                    angle: (Math.PI * 2 / projectilesInRing) * i,
                    baseRadius: radius,
                    radius: radius,
                    size: 8,
                    speed: speed,
                    health: 1,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }
            
            this.orbitalRings.push({
                orbitals: orbitals,
                baseRadius: radius,
                expanding: false
            });
        }
    }

    update(player, game) {
        const rX = window.innerWidth / 2560;
        this.size = this.baseSize * rX;
        this.speed = this.baseSpeed * rX;

        this.updatePhase();

        if (this.entering) {
            this.updateEntry();
            return;
        }

        this.updateMovement();
        this.updateOrbitals();
        this.updateAttacks(player, game);
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
            this.createOrbitalRing(3);
            this.homingCooldown = 2500;
            this.color = '#cc00ff';
            this.glowColor = '#ff00ff';
        } else if (this.health <= this.phaseThresholds[2] && this.phase < 2) {
            this.phase = 2;
            this.createOrbitalRing(2);
            this.homingCooldown = 3000;
            this.color = '#9900ff';
            this.glowColor = '#ff00ff';
        }

        if (this.phase !== previousPhase) {
            this.hitFlash = 1.0;
        }
    }

    updateEntry() {
        const result = this.moveTowards(this.entryTargetX, this.entryTargetY, this.speed * 10);
        this.x = result.x;
        this.y = result.y;

        const dx = this.x - this.entryTargetX;
        const dy = this.y - this.entryTargetY;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
            this.entering = false;
        }
    }

    updateMovement() {
        // Drift in a circular pattern around center
        this.driftAngle += this.driftSpeed;
        const driftRadius = 150;
        const targetX = this.centerX + Math.cos(this.driftAngle) * driftRadius;
        const targetY = this.centerY + Math.sin(this.driftAngle) * driftRadius;

        const result = this.moveTowards(targetX, targetY, this.speed);
        this.x = result.x;
        this.y = result.y;

        // Leave void zones in phase 2+
        if (this.phase >= 2 && Math.random() < 0.02) {
            // Play void zone sound
            if (window.gameSound) window.gameSound.playBossVoidZone();

            this.voidZones.push({
                x: this.x,
                y: this.y,
                radius: 60,
                createdAt: performance.now(),
                duration: 3000
            });
        }

        // Update void zones
        const now = performance.now();
        this.voidZones = this.voidZones.filter(zone => now - zone.createdAt < zone.duration);
    }

    moveTowards(targetX, targetY, speed) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < speed) {
            return { x: targetX, y: targetY };
        }

        return {
            x: this.x + (dx / distance) * speed,
            y: this.y + (dy / distance) * speed
        };
    }

    updateOrbitals() {
        const rX = window.innerWidth / 2560;

        for (let ring of this.orbitalRings) {
            for (let orbital of ring.orbitals) {
                orbital.angle += orbital.speed;
                orbital.pulsePhase += 0.1;

                // Pulse expansion effect
                if (ring.expanding) {
                    orbital.radius = ring.baseRadius * 1.5;
                } else {
                    orbital.radius += (ring.baseRadius - orbital.radius) * 0.1;
                }

                orbital.size = 8 * rX;
            }

            // Reset expansion
            if (ring.expanding) {
                ring.expanding = false;
            }
        }
    }

    updateAttacks(player, game) {
        const now = performance.now();

        // Homing missiles
        if (now - this.lastHomingShot > this.homingCooldown) {
            this.shootHomingMissile(player);
            this.lastHomingShot = now;
        }

        // Update homing missiles
        for (let i = this.homingMissiles.length - 1; i >= 0; i--) {
            const missile = this.homingMissiles[i];
            this.updateHomingMissile(missile, player);

            if (missile.checkCollision(player)) {
                // Check if god mode is enabled
                if (game.devMode && game.devMode.isEnabled() && game.devMode.godMode) {
                    // God mode - destroy missile but don't kill player
                    this.homingMissiles.splice(i, 1);
                } else {
                    game.gameOver = true;
                    this.homingMissiles.splice(i, 1);
                    if (window.gameSound) window.gameSound.playPlayerDeath();
                }
            } else if (missile.destroy) {
                this.homingMissiles.splice(i, 1);
            }
        }

        // Pulse attack (Phase 2+)
        if (this.phase >= 2 && !this.pulseCharging && now - this.lastPulse > this.pulseCooldown) {
            this.pulseCharging = true;
            this.pulseChargeStart = now;
        }

        if (this.pulseCharging) {
            if (now - this.pulseChargeStart > this.pulseChargeDuration) {
                this.executePulse();
                this.pulseCharging = false;
                this.lastPulse = now;
            }
        }

        // Spiral attack (Phase 3)
        if (this.phase >= 3 && now - this.lastSpiral > this.spiralCooldown) {
            this.executeSpiralAttack();
            this.lastSpiral = now;
        }

        // Update spiral projectiles
        for (let i = this.spiralProjectiles.length - 1; i >= 0; i--) {
            const proj = this.spiralProjectiles[i];
            proj.update();

            if (proj.checkCollision(player)) {
                // Check if god mode is enabled
                if (game.devMode && game.devMode.isEnabled() && game.devMode.godMode) {
                    // God mode - destroy projectile but don't kill player
                    this.spiralProjectiles.splice(i, 1);
                } else {
                    game.gameOver = true;
                    this.spiralProjectiles.splice(i, 1);
                    if (window.gameSound) window.gameSound.playPlayerDeath();
                }
            } else if (proj.destroy) {
                this.spiralProjectiles.splice(i, 1);
            }
        }
    }

    shootHomingMissile(player) {
        const rX = window.innerWidth / 2560;

        // Don't shoot if player is out of bounds
        const margin = 50;
        if (player.x < -margin || player.x > window.innerWidth + margin ||
            player.y < -margin || player.y > window.innerHeight + margin) {
            return;
        }

        // Play homing missile sound
        if (window.gameSound) window.gameSound.playBossHomingMissile();

        this.homingMissiles.push({
            x: this.x,
            y: this.y,
            vx: 0,
            vy: 0,
            speed: 10 * rX,
            size: 10 * rX,
            turnSpeed: 0.18,
            pulsePhase: 0,
            trail: [],
            maxTrailLength: 10,
            destroy: false,
            createdAt: performance.now(),
            lifetime: 5000,
            update: function(targetX, targetY) {
                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const angle = Math.atan2(dy, dx);
                
                this.vx += Math.cos(angle) * this.turnSpeed;
                this.vy += Math.sin(angle) * this.turnSpeed;
                
                const magnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (magnitude > this.speed) {
                    this.vx = (this.vx / magnitude) * this.speed;
                    this.vy = (this.vy / magnitude) * this.speed;
                }
                
                this.x += this.vx;
                this.y += this.vy;
                
                this.trail.push({ x: this.x, y: this.y });
                if (this.trail.length > this.maxTrailLength) this.trail.shift();
                
                this.pulsePhase += 0.15;
                
                if (this.x < -100 || this.x > window.innerWidth + 100 ||
                    this.y < -100 || this.y > window.innerHeight + 100) {
                    this.destroy = true;
                }

                // Expire after lifetime
                if (performance.now() - this.createdAt > this.lifetime) {
                    this.destroy = true;
                }
            },
            checkCollision: function(player) {
                const rX = window.innerWidth / 2560;
                const dx = this.x - player.x;
                const dy = this.y - player.y;
                return Math.sqrt(dx * dx + dy * dy) < (this.size + player.size * rX);
            }
        });
    }

    updateHomingMissile(missile, player) {
        missile.update(player.x, player.y);
    }

    executePulse() {
        // Play pulse sound
        if (window.gameSound) window.gameSound.playBossPulse();

        for (let ring of this.orbitalRings) {
            ring.expanding = true;
        }
    }

    executeSpiralAttack() {
        const rX = window.innerWidth / 2560;
        const projectileCount = 16;

        // Play spiral attack sound
        if (window.gameSound) window.gameSound.playBossSpiralAttack();

        for (let i = 0; i < projectileCount; i++) {
            const angle = (Math.PI * 2 / projectileCount) * i;
            const delay = i * 50;
            
            setTimeout(() => {
                if (this.isAlive) {
                    this.spiralProjectiles.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * 3 * rX,
                        vy: Math.sin(angle) * 3 * rX,
                        size: 8 * rX,
                        pulsePhase: 0,
                        destroy: false,
                        update: function() {
                            this.x += this.vx;
                            this.y += this.vy;
                            this.pulsePhase += 0.15;
                            
                            if (this.x < -50 || this.x > window.innerWidth + 50 ||
                                this.y < -50 || this.y > window.innerHeight + 50) {
                                this.destroy = true;
                            }
                        },
                        checkCollision: function(player) {
                            const rX = window.innerWidth / 2560;
                            const dx = this.x - player.x;
                            const dy = this.y - player.y;
                            return Math.sqrt(dx * dx + dy * dy) < (this.size + player.size * rX);
                        }
                    });
                }
            }, delay);
        }
    }

    updateVisuals() {
        this.pulsePhase += 0.06;
        this.rotationAngle += 0.02;
        this.geometryRotation += 0.03;
        this.breathPhase += 0.04;
        
        if (this.hitFlash > 0) {
            this.hitFlash -= 0.05;
        }
    }

    draw(context) {
        const rX = window.innerWidth / 2560;
        const pulse = 0.9 + Math.sin(this.pulsePhase) * 0.1;
        const breathScale = 1.0 + Math.sin(this.breathPhase) * 0.05;

        context.save();

        // Draw void zones
        for (let zone of this.voidZones) {
            const age = (performance.now() - zone.createdAt) / zone.duration;
            const alpha = 1 - age;
            
            context.save();
            context.globalAlpha = alpha * 0.3;
            const gradient = context.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius * rX);
            gradient.addColorStop(0, '#440088');
            gradient.addColorStop(1, 'rgba(68, 0, 136, 0)');
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(zone.x, zone.y, zone.radius * rX, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }

        // Draw spiral projectiles
        for (let proj of this.spiralProjectiles) {
            const projPulse = 0.8 + Math.sin(proj.pulsePhase) * 0.2;
            
            context.shadowColor = '#ff00ff';
            context.shadowBlur = 15 * rX;
            context.fillStyle = '#cc00ff';
            context.beginPath();
            context.arc(proj.x, proj.y, proj.size * projPulse, 0, Math.PI * 2);
            context.fill();
            
            context.fillStyle = '#ffffff';
            context.beginPath();
            context.arc(proj.x, proj.y, proj.size * 0.4 * projPulse, 0, Math.PI * 2);
            context.fill();
        }

        // Draw homing missiles
        for (let missile of this.homingMissiles) {
            const missilePulse = 0.8 + Math.sin(missile.pulsePhase) * 0.2;
            
            // Trail
            for (let i = 0; i < missile.trail.length; i++) {
                const t = missile.trail[i];
                const alpha = (i / missile.trail.length) * 0.5;
                
                context.save();
                context.globalAlpha = alpha;
                context.fillStyle = '#ff00ff';
                context.beginPath();
                context.arc(t.x, t.y, missile.size * 0.5, 0, Math.PI * 2);
                context.fill();
                context.restore();
            }
            
            context.shadowColor = '#ff00ff';
            context.shadowBlur = 20 * rX;
            context.fillStyle = '#cc00ff';
            context.beginPath();
            context.arc(missile.x, missile.y, missile.size * missilePulse, 0, Math.PI * 2);
            context.fill();
            
            context.fillStyle = '#ffffff';
            context.beginPath();
            context.arc(missile.x, missile.y, missile.size * 0.4 * missilePulse, 0, Math.PI * 2);
            context.fill();
        }

        // Draw energy connections from boss to orbitals
        context.strokeStyle = 'rgba(255, 0, 255, 0.2)';
        context.lineWidth = 1 * rX;
        for (let ring of this.orbitalRings) {
            for (let orbital of ring.orbitals) {
                const ox = this.x + Math.cos(orbital.angle + this.rotationAngle) * orbital.radius * rX;
                const oy = this.y + Math.sin(orbital.angle + this.rotationAngle) * orbital.radius * rX;
                
                context.beginPath();
                context.moveTo(this.x, this.y);
                context.lineTo(ox, oy);
                context.stroke();
            }
        }

        // Draw orbital projectiles
        for (let ring of this.orbitalRings) {
            for (let orbital of ring.orbitals) {
                if (orbital.health <= 0) continue;
                
                const ox = this.x + Math.cos(orbital.angle + this.rotationAngle) * orbital.radius * rX;
                const oy = this.y + Math.sin(orbital.angle + this.rotationAngle) * orbital.radius * rX;
                const orbPulse = 0.8 + Math.sin(orbital.pulsePhase) * 0.2;
                
                context.shadowColor = this.glowColor;
                context.shadowBlur = 15 * rX;
                context.fillStyle = '#aa00ff';
                context.beginPath();
                context.arc(ox, oy, orbital.size * orbPulse, 0, Math.PI * 2);
                context.fill();
                
                context.fillStyle = '#ffffff';
                context.beginPath();
                context.arc(ox, oy, orbital.size * 0.5 * orbPulse, 0, Math.PI * 2);
                context.fill();
            }
        }

        // Pulse charging indicator
        if (this.pulseCharging) {
            const chargeProgress = (performance.now() - this.pulseChargeStart) / this.pulseChargeDuration;
            context.strokeStyle = `rgba(255, 0, 255, ${chargeProgress})`;
            context.lineWidth = 5 * rX;
            context.shadowColor = '#ff00ff';
            context.shadowBlur = 20 * rX;
            context.beginPath();
            context.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2 * chargeProgress);
            context.stroke();
        }

        if (this.invulnerable) {
            context.globalAlpha = 0.5 + Math.sin(performance.now() * 0.02) * 0.3;
        }

        // Outer aura
        const auraGradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.6);
        auraGradient.addColorStop(0, 'rgba(136, 0, 255, 0.4)');
        auraGradient.addColorStop(0.6, 'rgba(204, 0, 255, 0.2)');
        auraGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        context.fillStyle = auraGradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 1.6 * pulse, 0, Math.PI * 2);
        context.fill();

        // Rotating geometric patterns
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.geometryRotation);
        context.strokeStyle = 'rgba(204, 0, 255, 0.6)';
        context.lineWidth = 2 * rX;
        
        const sides = 6;
        const shapeSize = this.size * 0.8;
        context.beginPath();
        for (let i = 0; i <= sides; i++) {
            const angle = (Math.PI * 2 / sides) * i;
            const x = Math.cos(angle) * shapeSize;
            const y = Math.sin(angle) * shapeSize;
            if (i === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.stroke();
        context.restore();

        // Main body
        context.shadowColor = this.glowColor;
        context.shadowBlur = 30 * rX * pulse;
        
        const bodyGradient = context.createRadialGradient(
            this.x - this.size * 0.2, this.y - this.size * 0.2, 0,
            this.x, this.y, this.size
        );
        bodyGradient.addColorStop(0, '#cc00ff');
        bodyGradient.addColorStop(0.5, this.color);
        bodyGradient.addColorStop(1, '#440088');
        
        context.fillStyle = this.hitFlash > 0 ? '#ffffff' : bodyGradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size * pulse * breathScale, 0, Math.PI * 2);
        context.fill();

        // Void core
        const voidGradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 0.5);
        voidGradient.addColorStop(0, '#000000');
        voidGradient.addColorStop(0.7, '#220044');
        voidGradient.addColorStop(1, this.coreColor);
        
        context.fillStyle = voidGradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.5 * pulse * breathScale, 0, Math.PI * 2);
        context.fill();

        // Pulsing center
        context.globalAlpha = 0.6 + Math.sin(this.pulsePhase * 2) * 0.4;
        context.fillStyle = '#ff00ff';
        context.shadowColor = '#ff00ff';
        context.shadowBlur = 25 * rX;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.2 * pulse, 0, Math.PI * 2);
        context.fill();

        context.restore();

        this.drawHealthBar(context, rX);
        this.drawPhaseIndicator(context, rX);
    }

    drawHealthBar(context, rX) {
        const barWidth = 220 * rX;
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
        context.fillText(`VORTEX BOSS - PHASE ${this.phase}`, this.x, this.y - this.size - 60 * rX);
        context.restore();
    }

    checkCollision(player, bullets) {
        const rX = window.innerWidth / 2560;
        
        // Check player collision with boss body
        const playerDx = this.x - player.x;
        const playerDy = this.y - player.y;
        if (Math.sqrt(playerDx * playerDx + playerDy * playerDy) < (this.size + player.size * rX)) {
            return { type: 'player' };
        }

        // Check player collision with orbitals
        for (let ring of this.orbitalRings) {
            for (let orbital of ring.orbitals) {
                if (orbital.health <= 0) continue;
                
                const ox = this.x + Math.cos(orbital.angle + this.rotationAngle) * orbital.radius * rX;
                const oy = this.y + Math.sin(orbital.angle + this.rotationAngle) * orbital.radius * rX;
                const dx = ox - player.x;
                const dy = oy - player.y;
                
                if (Math.sqrt(dx * dx + dy * dy) < (orbital.size + player.size * rX)) {
                    return { type: 'player' };
                }
            }
        }

        // Check bullet collision (normal mode bullets only)
        // Void bolts handle their own collision detection
        if (!this.invulnerable && !this.entering && bullets.bulletsList) {
            for (let i = bullets.bulletsList.length - 1; i >= 0; i--) {
                const bullet = bullets.bulletsList[i];

                // Check orbitals first (shield mechanic)
                let hitOrbital = false;
                let orbitalHitX = 0, orbitalHitY = 0;
                for (let ring of this.orbitalRings) {
                    for (let orbital of ring.orbitals) {
                        if (orbital.health <= 0) continue;

                        const ox = this.x + Math.cos(orbital.angle + this.rotationAngle) * orbital.radius * rX;
                        const oy = this.y + Math.sin(orbital.angle + this.rotationAngle) * orbital.radius * rX;
                        const dx = ox - bullet.x;
                        const dy = oy - bullet.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < (orbital.size + bullet.size)) {
                            orbital.health--;
                            orbitalHitX = bullet.x;
                            orbitalHitY = bullet.y;

                            // Ricochet bullets bounce off orbitals
                            if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                                const nx = -dx / dist;
                                const ny = -dy / dist;
                                const dot = bullet.dirX * nx + bullet.dirY * ny;
                                bullet.dirX = bullet.dirX - 2 * dot * nx;
                                bullet.dirY = bullet.dirY - 2 * dot * ny;
                                bullet.angle = Math.atan2(bullet.dirY, bullet.dirX);
                                bullet.x = ox + nx * (orbital.size + bullet.size + 5);
                                bullet.y = oy + ny * (orbital.size + bullet.size + 5);
                                bullet.bouncesRemaining--;
                                bullet.maxTravel += bullet.maxTravel * 0.3;
                                const remaining = bullet.maxTravel - bullet.distanceTraveled;
                                bullet.endX = bullet.x + bullet.dirX * remaining;
                                bullet.endY = bullet.y + bullet.dirY * remaining;
                            } else {
                                bullets.bulletsList.splice(i, 1);
                            }

                            hitOrbital = true;
                            if (window.gameSound) window.gameSound.playOrbitalHit();
                            break;
                        }
                    }
                    if (hitOrbital) break;
                }

                // Return orbital hit so it counts towards streak
                if (hitOrbital) {
                    return { type: 'orbital', x: orbitalHitX, y: orbitalHitY };
                }

                // Check boss body
                const bulletDx = this.x - bullet.x;
                const bulletDy = this.y - bullet.y;
                const bodyDist = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
                if (bodyDist < (this.size * 0.5 + bullet.size)) {
                    // Ricochet bullets bounce off boss body
                    if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                        const nx = -bulletDx / bodyDist;
                        const ny = -bulletDy / bodyDist;
                        const dot = bullet.dirX * nx + bullet.dirY * ny;
                        bullet.dirX = bullet.dirX - 2 * dot * nx;
                        bullet.dirY = bullet.dirY - 2 * dot * ny;
                        bullet.angle = Math.atan2(bullet.dirY, bullet.dirX);
                        bullet.x = this.x + nx * (this.size * 0.5 + bullet.size + 5);
                        bullet.y = this.y + ny * (this.size * 0.5 + bullet.size + 5);
                        bullet.bouncesRemaining--;
                        bullet.maxTravel += bullet.maxTravel * 0.3;
                        const remaining = bullet.maxTravel - bullet.distanceTraveled;
                        bullet.endX = bullet.x + bullet.dirX * remaining;
                        bullet.endY = bullet.y + bullet.dirY * remaining;
                    } else {
                        bullets.bulletsList.splice(i, 1);
                    }
                    this.takeDamage();

                    // Phase 3 shockwave on hit
                    if (this.phase >= 3) {
                        this.executeShockwave();
                    }

                    return { type: 'bullet', x: bullet.x, y: bullet.y };
                }
            }
        }

        return null;
    }

    executeShockwave() {
        const rX = window.innerWidth / 2560;
        const projectileCount = 12;

        for (let i = 0; i < projectileCount; i++) {
            const angle = (Math.PI * 2 / projectileCount) * i;
            this.spiralProjectiles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 4.5 * rX,
                vy: Math.sin(angle) * 4.5 * rX,
                size: 8 * rX,
                pulsePhase: 0,
                destroy: false,
                update: function() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.pulsePhase += 0.15;
                    
                    if (this.x < -50 || this.x > window.innerWidth + 50 ||
                        this.y < -50 || this.y > window.innerHeight + 50) {
                        this.destroy = true;
                    }
                },
                checkCollision: function(player) {
                    const rX = window.innerWidth / 2560;
                    const dx = this.x - player.x;
                    const dy = this.y - player.y;
                    return Math.sqrt(dx * dx + dy * dy) < (this.size + player.size * rX);
                }
            });
        }
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