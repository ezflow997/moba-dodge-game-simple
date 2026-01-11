import { BossProjectile } from "./bossProjectile.js";

export class PhantomBoss {
    constructor(x, y) {
        const rX = window.innerWidth / 2560;

        this.x = x;
        this.y = y;

        this.baseSize = 95;
        this.size = this.baseSize * rX;

        this.baseSpeed = 2.5;
        this.speed = this.baseSpeed * rX;

        this.maxHealth = 14;
        this.health = this.maxHealth;
        this.isAlive = true;

        this.phase = 1;
        this.phaseThresholds = { 2: 9, 3: 4 };

        // Visual properties - Toxic green theme
        this.color = '#00ff66';
        this.coreColor = '#00cc44';
        this.glowColor = '#44ff88';
        this.pulsePhase = 0;
        this.hitFlash = 0;
        this.ghostAlpha = 1.0; // For transparency effect

        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 200;

        // Entry state
        this.entering = true;
        this.entryTargetX = window.innerWidth * 0.65;
        this.entryTargetY = window.innerHeight * 0.5;

        // Teleportation mechanics
        this.teleporting = false;
        this.teleportPhase = 'none'; // 'none', 'glitching', 'invisible', 'reappearing'
        this.teleportStart = 0;
        this.glitchDuration = 500;
        this.invisibleDuration = 500; // Varies by phase
        this.teleportCooldown = 4000;
        this.lastTeleport = performance.now();
        this.teleportTarget = { x: 0, y: 0 };
        this.glitchOffset = { x: 0, y: 0 };

        // Afterimages
        this.afterimages = [];

        // Toxic burst attack
        this.lastBurst = performance.now();
        this.burstCooldown = 2500;
        this.burstCharging = false;
        this.burstChargeStart = 0;
        this.burstChargeDuration = 400;

        // Projectiles from afterimages and bursts
        this.projectiles = [];

        // Toxic fog zones (Phase 2+)
        this.toxicFogs = [];
        this.maxFogs = 2;

        // Shadow clone (Phase 3)
        this.shadowClone = null;
        this.lastCloneSpawn = performance.now();
        this.cloneCooldown = 8000;
        this.cloneDuration = 5000;

        // Particle effects
        this.particles = [];

        // Sound throttling to prevent audio overload
        this.lastSoundTimes = {
            teleport: 0,
            burst: 0,
            afterimage: 0,
            fog: 0,
            clone: 0
        };
        this.soundCooldowns = {
            teleport: 400,
            burst: 300,
            afterimage: 200,
            fog: 500,
            clone: 500
        };
    }

    canPlaySound(soundType) {
        const now = performance.now();
        if (now - this.lastSoundTimes[soundType] >= this.soundCooldowns[soundType]) {
            this.lastSoundTimes[soundType] = now;
            return true;
        }
        return false;
    }

    update(player, game) {
        const rX = window.innerWidth / 2560;
        this.size = this.baseSize * rX;

        this.updatePhase();

        if (this.entering) {
            this.updateEntry();
            return;
        }

        this.updateTeleportation(player);
        this.updateMovement(player);
        this.updateAfterimages(player, game);
        this.updateBurstAttack(player);
        this.updateProjectiles(player, game);
        this.updateToxicFogs();
        this.updateShadowClone(player, game);
        this.updateParticles();
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
            this.teleportCooldown = 2000;
            this.burstCooldown = 1500;
            this.invisibleDuration = 300;
            this.color = '#00ff88';
            this.glowColor = '#66ffaa';
            this.ghostAlpha = 0.7; // More transparent in phase 3
        } else if (this.health <= this.phaseThresholds[2] && this.phase < 2) {
            this.phase = 2;
            this.teleportCooldown = 3000;
            this.burstCooldown = 2000;
            this.invisibleDuration = 400;
            this.color = '#00ff77';
            this.glowColor = '#55ff99';
        }

        if (this.phase !== previousPhase) {
            this.hitFlash = 1.0;
        }
    }

    updateEntry() {
        const rX = window.innerWidth / 2560;
        const entrySpeed = this.speed * 3;

        const result = this.moveTowards(this.entryTargetX, this.entryTargetY, entrySpeed);
        this.x = result.x;
        this.y = result.y;

        const dx = this.x - this.entryTargetX;
        const dy = this.y - this.entryTargetY;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
            this.entering = false;
        }
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

    updateTeleportation(player) {
        const now = performance.now();

        // Handle ongoing teleport
        if (this.teleporting) {
            const elapsed = now - this.teleportStart;

            if (this.teleportPhase === 'glitching') {
                // Glitch visual effect
                this.glitchOffset.x = (Math.random() - 0.5) * 20;
                this.glitchOffset.y = (Math.random() - 0.5) * 20;

                if (elapsed >= this.glitchDuration) {
                    // Spawn afterimage at current position before teleporting
                    this.spawnAfterimage();

                    // Spawn toxic fog in Phase 2+
                    if (this.phase >= 2) {
                        const fogChance = this.phase >= 3 ? 0.5 : 0.3;
                        if (Math.random() < fogChance && this.toxicFogs.length < this.maxFogs) {
                            this.spawnToxicFog(this.x, this.y);
                        }
                    }

                    // Create vanish particles
                    this.spawnTeleportParticles(this.x, this.y, 'vanish');

                    this.teleportPhase = 'invisible';
                    this.teleportStart = now;
                    this.invulnerable = true;
                    this.invulnerableTime = now;
                }
            } else if (this.teleportPhase === 'invisible') {
                if (elapsed >= this.invisibleDuration) {
                    // Move to target position
                    this.x = this.teleportTarget.x;
                    this.y = this.teleportTarget.y;

                    // Create reappear particles
                    this.spawnTeleportParticles(this.x, this.y, 'reappear');

                    this.teleportPhase = 'reappearing';
                    this.teleportStart = now;
                }
            } else if (this.teleportPhase === 'reappearing') {
                if (elapsed >= 200) {
                    this.teleporting = false;
                    this.teleportPhase = 'none';
                    this.glitchOffset = { x: 0, y: 0 };
                    this.lastTeleport = now;
                }
            }
            return;
        }

        // Check if time to teleport
        if (now - this.lastTeleport > this.teleportCooldown) {
            this.startTeleport(player);
        }
    }

    startTeleport(player) {
        this.teleporting = true;
        this.teleportPhase = 'glitching';
        this.teleportStart = performance.now();

        // Determine teleport target
        const rand = Math.random();
        const margin = 150;
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (rand < 0.6) {
            // Teleport behind player (60% chance)
            const angle = Math.atan2(this.y - player.y, this.x - player.x);
            const distance = 200 + Math.random() * 150;
            this.teleportTarget.x = player.x + Math.cos(angle) * distance;
            this.teleportTarget.y = player.y + Math.sin(angle) * distance;
        } else if (rand < 0.85) {
            // Random screen position (25% chance)
            this.teleportTarget.x = margin + Math.random() * (w - margin * 2);
            this.teleportTarget.y = margin + Math.random() * (h - margin * 2);
        } else {
            // Directly above or below player (15% chance)
            this.teleportTarget.x = player.x + (Math.random() - 0.5) * 100;
            this.teleportTarget.y = Math.random() < 0.5 ? margin + Math.random() * 100 : h - margin - Math.random() * 100;
        }

        // Clamp to screen bounds
        this.teleportTarget.x = Math.max(margin, Math.min(w - margin, this.teleportTarget.x));
        this.teleportTarget.y = Math.max(margin, Math.min(h - margin, this.teleportTarget.y));

        // Play teleport sound (throttled)
        if (window.gameSound && this.canPlaySound('teleport')) {
            window.gameSound.playBossTeleport();
        }
    }

    spawnAfterimage() {
        const rX = window.innerWidth / 2560;
        const count = this.phase >= 3 ? 2 : (this.phase >= 2 && Math.random() < 0.5 ? 2 : 1);

        for (let i = 0; i < count; i++) {
            const offsetX = i === 0 ? 0 : (Math.random() - 0.5) * 100;
            const offsetY = i === 0 ? 0 : (Math.random() - 0.5) * 100;

            this.afterimages.push({
                x: this.x + offsetX,
                y: this.y + offsetY,
                size: this.size,
                health: 2,
                createdAt: performance.now(),
                attackDelay: 1000,
                hasAttacked: false,
                alpha: 0.6,
                pulsePhase: 0,
                isAttacking: false
            });
        }
    }

    updateAfterimages(player, game) {
        const now = performance.now();
        const rX = window.innerWidth / 2560;

        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            const img = this.afterimages[i];
            img.pulsePhase += 0.05;

            const age = now - img.createdAt;

            // Attack after delay
            if (!img.hasAttacked && age >= img.attackDelay) {
                img.isAttacking = true;

                // Fire 3 projectiles toward player
                const baseAngle = Math.atan2(player.y - img.y, player.x - img.x);
                const spreadAngles = [-0.2, 0, 0.2];

                for (const spread of spreadAngles) {
                    const angle = baseAngle + spread;
                    const spawnX = img.x + Math.cos(angle) * img.size;
                    const spawnY = img.y + Math.sin(angle) * img.size;
                    const targetX = img.x + Math.cos(angle) * 1000;
                    const targetY = img.y + Math.sin(angle) * 1000;

                    const proj = new BossProjectile(spawnX, spawnY, targetX, targetY, 10, 12);
                    proj.color = '#00ff66';
                    proj.glowColor = '#44ff88';
                    this.projectiles.push(proj);
                }

                img.hasAttacked = true;

                // Play afterimage attack sound (throttled)
                if (window.gameSound && this.canPlaySound('afterimage')) {
                    window.gameSound.playPhantomAfterimage();
                }
            }

            // Fade out after attacking
            if (img.hasAttacked) {
                img.alpha -= 0.02;
                if (img.alpha <= 0) {
                    this.afterimages.splice(i, 1);
                    continue;
                }
            }

            // Remove if destroyed
            if (img.health <= 0) {
                this.spawnTeleportParticles(img.x, img.y, 'vanish');
                this.afterimages.splice(i, 1);
            }
        }
    }

    updateMovement(player) {
        // Don't move while teleporting or invisible
        if (this.teleporting && this.teleportPhase !== 'none') {
            return;
        }

        const rX = window.innerWidth / 2560;
        const speedMod = this.phase >= 3 ? 1.4 : (this.phase >= 2 ? 1.2 : 1.0);
        const currentSpeed = this.speed * speedMod;

        // Move toward player but keep some distance
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 300) {
            const result = this.moveTowards(player.x, player.y, currentSpeed);
            this.x = result.x;
            this.y = result.y;
        } else if (dist < 200) {
            // Move away if too close
            const result = this.moveTowards(this.x - dx, this.y - dy, currentSpeed * 0.5);
            this.x = result.x;
            this.y = result.y;
        }

        // Spawn trailing particles
        if (Math.random() < 0.1) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * this.size,
                y: this.y + (Math.random() - 0.5) * this.size,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 3 + Math.random() * 3,
                alpha: 0.6,
                color: this.glowColor
            });
        }
    }

    updateBurstAttack(player) {
        const now = performance.now();

        // Don't attack while teleporting
        if (this.teleporting) return;

        if (this.burstCharging) {
            if (now - this.burstChargeStart >= this.burstChargeDuration) {
                this.executeBurst(player);
                this.burstCharging = false;
                this.lastBurst = now;
            }
            return;
        }

        if (now - this.lastBurst > this.burstCooldown) {
            this.burstCharging = true;
            this.burstChargeStart = now;
        }
    }

    executeBurst(player) {
        const rX = window.innerWidth / 2560;
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const projectileCount = 5;
        const spreadAngle = Math.PI / 6; // 30 degrees spread

        // Play burst sound (throttled)
        if (window.gameSound && this.canPlaySound('burst')) {
            window.gameSound.playPhantomBurst();
        }

        for (let i = 0; i < projectileCount; i++) {
            const angle = baseAngle + (i - 2) * (spreadAngle / 2);
            const spawnX = this.x + Math.cos(angle) * this.size;
            const spawnY = this.y + Math.sin(angle) * this.size;
            const targetX = this.x + Math.cos(angle) * 1000;
            const targetY = this.y + Math.sin(angle) * 1000;

            const proj = new BossProjectile(spawnX, spawnY, targetX, targetY, 11, 14);
            proj.color = '#00ff66';
            proj.glowColor = '#44ff88';
            this.projectiles.push(proj);
        }
    }

    updateProjectiles(player, game) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update();

            if (proj.checkCollision(player)) {
                if (game.devMode && game.devMode.isEnabled() && game.devMode.godMode) {
                    proj.destroy = true;
                } else if (game.rewardManager && game.rewardManager.canSurviveHit(true)) {
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

    spawnToxicFog(x, y) {
        const rX = window.innerWidth / 2560;
        this.toxicFogs.push({
            x: x,
            y: y,
            radius: 80 * rX,
            createdAt: performance.now(),
            duration: 4000,
            damageDelay: 500,
            pulsePhase: 0
        });

        // Play fog spawn sound (throttled)
        if (window.gameSound && this.canPlaySound('fog')) {
            window.gameSound.playPhantomFog();
        }
    }

    updateToxicFogs() {
        const now = performance.now();
        this.toxicFogs = this.toxicFogs.filter(fog => {
            fog.pulsePhase += 0.03;
            return now - fog.createdAt < fog.duration;
        });
    }

    checkToxicFogCollision(player, game) {
        const now = performance.now();
        const rX = window.innerWidth / 2560;

        for (const fog of this.toxicFogs) {
            const age = now - fog.createdAt;
            if (age < fog.damageDelay) continue;

            const dx = fog.x - player.x;
            const dy = fog.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < fog.radius + player.size * rX) {
                return true;
            }
        }
        return false;
    }

    updateShadowClone(player, game) {
        if (this.phase < 3) return;

        const now = performance.now();
        const rX = window.innerWidth / 2560;

        // Spawn clone
        if (!this.shadowClone && now - this.lastCloneSpawn > this.cloneCooldown) {
            const mirrorX = window.innerWidth - this.x;
            const mirrorY = this.y;

            this.shadowClone = {
                x: mirrorX,
                y: mirrorY,
                size: this.size * 0.9,
                health: 3,
                createdAt: now,
                pulsePhase: 0,
                lastShot: now,
                shootCooldown: 2000
            };

            this.lastCloneSpawn = now;

            // Play clone spawn sound (throttled)
            if (window.gameSound && this.canPlaySound('clone')) {
                window.gameSound.playPhantomClone();
            }
        }

        // Update clone
        if (this.shadowClone) {
            this.shadowClone.pulsePhase += 0.08;

            // Mirror main boss x position
            this.shadowClone.x = window.innerWidth - this.x;
            this.shadowClone.y = this.y;

            // Clone attacks
            if (now - this.shadowClone.lastShot > this.shadowClone.shootCooldown) {
                const angle = Math.atan2(player.y - this.shadowClone.y, player.x - this.shadowClone.x);
                const spawnX = this.shadowClone.x + Math.cos(angle) * this.shadowClone.size;
                const spawnY = this.shadowClone.y + Math.sin(angle) * this.shadowClone.size;

                const proj = new BossProjectile(spawnX, spawnY, player.x, player.y, 10, 12);
                proj.color = '#004422';
                proj.glowColor = '#00ff66';
                this.projectiles.push(proj);

                this.shadowClone.lastShot = now;

                // Clone attack sound (shares afterimage throttle)
                if (window.gameSound && this.canPlaySound('afterimage')) {
                    window.gameSound.playPhantomAfterimage();
                }
            }

            // Check duration or health
            if (now - this.shadowClone.createdAt > this.cloneDuration || this.shadowClone.health <= 0) {
                this.spawnTeleportParticles(this.shadowClone.x, this.shadowClone.y, 'vanish');
                this.shadowClone = null;
            }
        }
    }

    spawnTeleportParticles(x, y, type) {
        const count = type === 'vanish' ? 20 : 15;
        const speed = type === 'vanish' ? 3 : -2;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed * (0.5 + Math.random()),
                vy: Math.sin(angle) * speed * (0.5 + Math.random()),
                size: 4 + Math.random() * 4,
                alpha: 1.0,
                color: this.glowColor
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            p.size *= 0.98;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateVisuals() {
        this.pulsePhase += 0.06;
        if (this.hitFlash > 0) {
            this.hitFlash -= 0.05;
        }
    }

    draw(context) {
        const rX = window.innerWidth / 2560;
        const pulse = 0.9 + Math.sin(this.pulsePhase) * 0.1;

        context.save();

        // Draw toxic fog zones
        this.drawToxicFogs(context, rX);

        // Draw particles
        this.drawParticles(context);

        // Draw projectiles
        for (const proj of this.projectiles) {
            proj.draw(context);
        }

        // Draw afterimages
        this.drawAfterimages(context, rX);

        // Draw shadow clone
        if (this.shadowClone) {
            this.drawShadowClone(context, rX);
        }

        // Draw connection line to clone
        if (this.shadowClone) {
            context.strokeStyle = 'rgba(0, 255, 102, 0.2)';
            context.lineWidth = 2 * rX;
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.lineTo(this.shadowClone.x, this.shadowClone.y);
            context.stroke();
        }

        // Don't draw main boss if invisible
        if (this.teleporting && this.teleportPhase === 'invisible') {
            // Draw faint outline
            context.globalAlpha = 0.05;
            context.beginPath();
            context.strokeStyle = this.glowColor;
            context.lineWidth = 2 * rX;
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.stroke();
            context.restore();
            this.drawHealthBar(context, rX);
            this.drawPhaseIndicator(context, rX);
            return;
        }

        // Apply glitch offset
        const drawX = this.x + this.glitchOffset.x;
        const drawY = this.y + this.glitchOffset.y;

        // Glitch visual during teleport start
        if (this.teleporting && this.teleportPhase === 'glitching') {
            context.globalAlpha = 0.5 + Math.random() * 0.3;
            // Draw multiple offset copies for glitch effect
            for (let i = 0; i < 3; i++) {
                const offsetX = (Math.random() - 0.5) * 15;
                const offsetY = (Math.random() - 0.5) * 15;
                context.fillStyle = i === 0 ? '#ff0000' : (i === 1 ? '#00ff00' : '#0000ff');
                context.globalAlpha = 0.3;
                context.beginPath();
                context.arc(drawX + offsetX, drawY + offsetY, this.size * pulse, 0, Math.PI * 2);
                context.fill();
            }
        }

        if (this.invulnerable) {
            context.globalAlpha = 0.5 + Math.sin(performance.now() * 0.02) * 0.3;
        } else {
            context.globalAlpha = this.ghostAlpha;
        }

        // Wispy outer aura
        const auraGradient = context.createRadialGradient(drawX, drawY, 0, drawX, drawY, this.size * 1.5);
        auraGradient.addColorStop(0, 'rgba(0, 255, 102, 0.3)');
        auraGradient.addColorStop(0.6, 'rgba(68, 255, 136, 0.1)');
        auraGradient.addColorStop(1, 'rgba(0, 255, 102, 0)');
        context.fillStyle = auraGradient;
        context.beginPath();
        context.arc(drawX, drawY, this.size * 1.5 * pulse, 0, Math.PI * 2);
        context.fill();

        // Main body glow
        context.shadowColor = this.glowColor;
        context.shadowBlur = (30 + this.phase * 10) * rX * pulse;

        // Main body
        context.beginPath();
        context.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
        context.arc(drawX, drawY, this.size * pulse, 0, Math.PI * 2);
        context.fill();

        // Phase rings
        this.drawPhaseRings(context, drawX, drawY, rX, pulse);

        // Core
        context.beginPath();
        context.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.coreColor;
        context.arc(drawX, drawY, this.size * 0.4 * pulse, 0, Math.PI * 2);
        context.fill();

        // Eyes
        this.drawEyes(context, drawX, drawY, rX);

        // Burst charging indicator
        if (this.burstCharging) {
            const chargeProgress = (performance.now() - this.burstChargeStart) / this.burstChargeDuration;
            context.strokeStyle = `rgba(0, 255, 102, ${chargeProgress})`;
            context.lineWidth = 4 * rX;
            context.shadowColor = '#00ff66';
            context.shadowBlur = 15 * rX;
            context.beginPath();
            context.arc(drawX, drawY, this.size * 1.3, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * chargeProgress));
            context.stroke();
        }

        context.restore();

        this.drawHealthBar(context, rX);
        this.drawPhaseIndicator(context, rX);
    }

    drawPhaseRings(context, x, y, rX, pulse) {
        context.strokeStyle = this.glowColor;
        context.lineWidth = 2 * rX;
        for (let i = 0; i < this.phase; i++) {
            const ringSize = this.size * (0.6 + i * 0.25) * pulse;
            context.globalAlpha = 0.6 - i * 0.15;
            context.beginPath();
            context.arc(x, y, ringSize, 0, Math.PI * 2);
            context.stroke();
        }
        context.globalAlpha = 1;
    }

    drawEyes(context, x, y, rX) {
        const eyeOffset = this.size * 0.25;
        const eyeSize = this.size * 0.15;

        // Eye sockets
        context.fillStyle = '#003311';
        context.beginPath();
        context.arc(x - eyeOffset, y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(x + eyeOffset, y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        context.fill();

        // Eye glow
        const eyeColor = this.phase >= 3 ? '#ff0000' : '#00ff00';
        context.fillStyle = eyeColor;
        context.shadowColor = eyeColor;
        context.shadowBlur = 8 * rX;
        context.beginPath();
        context.arc(x - eyeOffset, y - eyeOffset * 0.5, eyeSize * 0.5, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(x + eyeOffset, y - eyeOffset * 0.5, eyeSize * 0.5, 0, Math.PI * 2);
        context.fill();
    }

    drawAfterimages(context, rX) {
        for (const img of this.afterimages) {
            context.save();
            context.globalAlpha = img.alpha;

            const pulse = 0.9 + Math.sin(img.pulsePhase) * 0.1;

            // Attacking glow
            if (img.isAttacking && !img.hasAttacked) {
                context.shadowColor = '#ff0000';
                context.shadowBlur = 20 * rX;
            } else {
                context.shadowColor = this.glowColor;
                context.shadowBlur = 15 * rX;
            }

            context.fillStyle = img.isAttacking ? '#ff6644' : 'rgba(0, 255, 102, 0.5)';
            context.beginPath();
            context.arc(img.x, img.y, img.size * pulse, 0, Math.PI * 2);
            context.fill();

            // Core
            context.fillStyle = 'rgba(0, 204, 68, 0.5)';
            context.beginPath();
            context.arc(img.x, img.y, img.size * 0.4 * pulse, 0, Math.PI * 2);
            context.fill();

            context.restore();
        }
    }

    drawShadowClone(context, rX) {
        const clone = this.shadowClone;
        const pulse = 0.9 + Math.sin(clone.pulsePhase) * 0.1;

        context.save();
        context.globalAlpha = 0.7;

        // Darker color scheme for clone
        context.shadowColor = '#00ff66';
        context.shadowBlur = 20 * rX;

        context.fillStyle = '#004422';
        context.beginPath();
        context.arc(clone.x, clone.y, clone.size * pulse, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#002211';
        context.beginPath();
        context.arc(clone.x, clone.y, clone.size * 0.4 * pulse, 0, Math.PI * 2);
        context.fill();

        // Clone eyes
        const eyeOffset = clone.size * 0.25;
        const eyeSize = clone.size * 0.12;
        context.fillStyle = '#00ff66';
        context.shadowColor = '#00ff66';
        context.shadowBlur = 5 * rX;
        context.beginPath();
        context.arc(clone.x - eyeOffset, clone.y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(clone.x + eyeOffset, clone.y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    drawToxicFogs(context, rX) {
        const now = performance.now();

        for (const fog of this.toxicFogs) {
            const age = (now - fog.createdAt) / fog.duration;
            const alpha = (1 - age) * 0.4;
            const pulse = 1 + Math.sin(fog.pulsePhase) * 0.1;

            context.save();
            context.globalAlpha = alpha;

            const gradient = context.createRadialGradient(fog.x, fog.y, 0, fog.x, fog.y, fog.radius * pulse);
            gradient.addColorStop(0, 'rgba(0, 100, 50, 0.8)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 102, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 255, 102, 0)');

            context.fillStyle = gradient;
            context.beginPath();
            context.arc(fog.x, fog.y, fog.radius * pulse, 0, Math.PI * 2);
            context.fill();

            // Bubbling effect at edges
            for (let i = 0; i < 8; i++) {
                const angle = (fog.pulsePhase + i * Math.PI / 4) % (Math.PI * 2);
                const bx = fog.x + Math.cos(angle) * fog.radius * 0.8;
                const by = fog.y + Math.sin(angle) * fog.radius * 0.8;
                const bsize = 5 * rX * (0.5 + Math.sin(fog.pulsePhase * 2 + i) * 0.5);

                context.fillStyle = 'rgba(0, 255, 102, 0.6)';
                context.beginPath();
                context.arc(bx, by, bsize, 0, Math.PI * 2);
                context.fill();
            }

            context.restore();
        }
    }

    drawParticles(context) {
        for (const p of this.particles) {
            context.save();
            context.globalAlpha = p.alpha;
            context.fillStyle = p.color;
            context.beginPath();
            context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            context.fill();
            context.restore();
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
        context.fillText(`PHANTOM BOSS - PHASE ${this.phase}`, this.x, this.y - this.size - 60 * rX);
        context.restore();
    }

    checkCollision(player, bullets) {
        const rX = window.innerWidth / 2560;

        // Check player collision with boss body (if not invisible)
        if (!(this.teleporting && this.teleportPhase === 'invisible')) {
            const playerDx = this.x - player.x;
            const playerDy = this.y - player.y;
            if (Math.sqrt(playerDx * playerDx + playerDy * playerDy) < (this.size + player.size * rX)) {
                return { type: 'player' };
            }
        }

        // Check player collision with afterimages
        for (const img of this.afterimages) {
            const dx = img.x - player.x;
            const dy = img.y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < (img.size + player.size * rX)) {
                return { type: 'player' };
            }
        }

        // Check player collision with shadow clone
        if (this.shadowClone) {
            const dx = this.shadowClone.x - player.x;
            const dy = this.shadowClone.y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < (this.shadowClone.size + player.size * rX)) {
                return { type: 'player' };
            }
        }

        // Check bullet collisions
        if (!this.invulnerable && !this.entering && bullets.bulletsList) {
            for (let i = bullets.bulletsList.length - 1; i >= 0; i--) {
                const bullet = bullets.bulletsList[i];

                // Check afterimages first
                let hitAfterimage = false;
                for (const img of this.afterimages) {
                    const dx = img.x - bullet.x;
                    const dy = img.y - bullet.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < (img.size + bullet.size)) {
                        img.health--;
                        bullets.bulletsList.splice(i, 1);
                        hitAfterimage = true;
                        if (window.gameSound) window.gameSound.playOrbitalHit();
                        break;
                    }
                }
                if (hitAfterimage) continue;

                // Check shadow clone
                if (this.shadowClone) {
                    const dx = this.shadowClone.x - bullet.x;
                    const dy = this.shadowClone.y - bullet.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < (this.shadowClone.size + bullet.size)) {
                        this.shadowClone.health--;
                        bullets.bulletsList.splice(i, 1);
                        if (window.gameSound) window.gameSound.playOrbitalHit();
                        continue;
                    }
                }

                // Check boss body (if not invisible)
                if (this.teleporting && this.teleportPhase === 'invisible') continue;

                const bulletDx = this.x - bullet.x;
                const bulletDy = this.y - bullet.y;
                const dist = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
                if (dist < (this.size + bullet.size)) {
                    // Ricochet bullets bounce off boss
                    if (bullet.gunType === 'ricochet' && bullet.bouncesRemaining > 0) {
                        const nx = -bulletDx / dist;
                        const ny = -bulletDy / dist;
                        const dot = bullet.dirX * nx + bullet.dirY * ny;
                        bullet.dirX = bullet.dirX - 2 * dot * nx;
                        bullet.dirY = bullet.dirY - 2 * dot * ny;
                        bullet.angle = Math.atan2(bullet.dirY, bullet.dirX);
                        bullet.x = this.x + nx * (this.size + bullet.size + 5);
                        bullet.y = this.y + ny * (this.size + bullet.size + 5);
                        bullet.bouncesRemaining--;
                        bullet.maxTravel += bullet.maxTravel * 0.3;
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
