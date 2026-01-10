import { makeMovements } from "./makeMovement.js";

var move = new makeMovements();

export class SpecialBullet {
    constructor(x, y, endX, endY, size, speed, gunType, gunData, playerRef = null) {
        this.x = x;
        this.y = y;
        this.endX = endX;
        this.endY = endY;
        this.startX = x;
        this.startY = y;

        this.size = size * window.innerWidth / 2560;
        this.baseSize = this.size;
        this.speed = speed * window.innerWidth / 2560;
        this.baseSpeed = this.speed;

        this.gunType = gunType;
        this.gunData = gunData;

        // Player reference for nova bullets (to follow player position)
        this.playerRef = playerRef;
        this.isNova = gunType === 'nova';

        // Calculate direction for various effects
        const dx = endX - x;
        const dy = endY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.dirX = dx / dist;
        this.dirY = dy / dist;
        this.angle = Math.atan2(dy, dx);

        // States
        this.destroy = false;
        this.enemyCollision = false;

        // Piercing
        this.pierceCount = gunData.pierceCount || 0;
        this.piercedEnemies = new Set();

        // Ricochet
        this.bounceCount = gunData.bounceCount || 0;
        this.bouncesRemaining = this.bounceCount;

        // Homing
        this.isHoming = gunType === 'homing';
        this.turnSpeed = gunData.turnSpeed || 0.03;
        this.targetEnemy = null;

        // Chain lightning
        this.chainCount = gunData.chainCount || 0;
        this.chainRange = (gunData.chainRange || 150) * window.innerWidth / 2560;
        this.chainsRemaining = this.chainCount;
        this.isChainBolt = false;

        // Speed modifier
        if (gunData.speedMultiplier) {
            this.speed *= gunData.speedMultiplier;
        }

        // Visual
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trail = [];
        this.maxTrailLength = 10;
        this.color = this.getGunColor();
        this.glowColor = this.getGunGlow();

        // Max travel distance
        this.maxTravel = 780 * window.innerWidth / 2560;
        if (gunData.rangeMultiplier) {
            this.maxTravel *= gunData.rangeMultiplier;
        }
        this.distanceTraveled = 0;

        this.prevWindowW = window.innerWidth;
        this.prevWindowH = window.innerHeight;
    }

    getGunColor() {
        switch (this.gunType) {
            case 'shotgun': return '#ff4400';
            case 'rapidfire': return '#ffff00';
            case 'piercing': return '#00ffff';
            case 'ricochet': return '#00ff88';
            case 'homing': return '#ff00ff';
            case 'twin': return '#ff6600';
            case 'nova': return '#ffffff';
            case 'chain': return '#4488ff';
            default: return '#ff6600';
        }
    }

    getGunGlow() {
        switch (this.gunType) {
            case 'shotgun': return '#ff8800';
            case 'rapidfire': return '#ffff88';
            case 'piercing': return '#88ffff';
            case 'ricochet': return '#88ffaa';
            case 'homing': return '#ff88ff';
            case 'twin': return '#ffaa00';
            case 'nova': return '#aaaaff';
            case 'chain': return '#88aaff';
            default: return '#ffaa00';
        }
    }

    update(enemies) {
        // Handle window resize
        if (window.innerWidth !== this.prevWindowW || window.innerHeight !== this.prevWindowH) {
            const ratioW = window.innerWidth / this.prevWindowW;
            const ratioH = window.innerHeight / this.prevWindowH;
            this.x *= ratioW;
            this.y *= ratioH;
            this.endX *= ratioW;
            this.endY *= ratioH;
            this.size *= ratioW;
            this.speed *= ratioW;
            this.maxTravel *= ratioW;
            this.chainRange *= ratioW;
            this.prevWindowW = window.innerWidth;
            this.prevWindowH = window.innerHeight;
        }

        // Nova bullets: follow player position (bullets move with player)
        if (this.isNova && this.playerRef) {
            const playerDeltaX = this.playerRef.x - this.startX;
            const playerDeltaY = this.playerRef.y - this.startY;

            // Move bullet with player
            this.x += playerDeltaX;
            this.y += playerDeltaY;
            this.endX += playerDeltaX;
            this.endY += playerDeltaY;

            // Update start position
            this.startX = this.playerRef.x;
            this.startY = this.playerRef.y;

            // Also move trail points
            for (const t of this.trail) {
                t.x += playerDeltaX;
                t.y += playerDeltaY;
            }
        }

        // Store trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Homing behavior
        if (this.isHoming && enemies && enemies.length > 0) {
            this.updateHoming(enemies);
        }

        // Move bullet
        const prevX = this.x;
        const prevY = this.y;

        if (this.isHoming || this.bouncesRemaining > 0 || this.bounceCount > 0) {
            // Use directional movement for homing and ricochet bullets
            this.x += this.dirX * this.speed;
            this.y += this.dirY * this.speed;
        } else if (this.x !== this.endX || this.y !== this.endY) {
            const values = move.make(this.x, this.y, this.speed, this.endX, this.endY);
            this.x = values[0];
            this.y = values[1];
        } else {
            this.destroy = true;
        }

        // Track distance
        const moved = Math.sqrt(Math.pow(this.x - prevX, 2) + Math.pow(this.y - prevY, 2));
        this.distanceTraveled += moved;

        // Check max travel
        if (this.distanceTraveled >= this.maxTravel) {
            this.destroy = true;
        }

        // Ricochet - bounce off walls
        if (this.bouncesRemaining > 0) {
            this.checkBounce();
        }

        // Update pulse
        this.pulsePhase += 0.15;
    }

    updateHoming(enemies) {
        // Find closest enemy
        let closestDist = Infinity;
        let closestEnemy = null;

        for (const enemy of enemies) {
            if (this.piercedEnemies.has(enemy)) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }

        if (closestEnemy) {
            // Turn towards enemy
            const targetAngle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
            let angleDiff = targetAngle - this.angle;

            // Normalize angle difference
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // Apply turn
            if (Math.abs(angleDiff) < this.turnSpeed) {
                this.angle = targetAngle;
            } else {
                this.angle += Math.sign(angleDiff) * this.turnSpeed;
            }

            // Update direction
            this.dirX = Math.cos(this.angle);
            this.dirY = Math.sin(this.angle);
        }
    }

    checkBounce() {
        const rX = window.innerWidth / 2560;
        let bounced = false;

        // Left wall
        if (this.x <= this.size) {
            this.x = this.size;
            this.dirX = Math.abs(this.dirX);
            bounced = true;
        }
        // Right wall
        if (this.x >= window.innerWidth - this.size) {
            this.x = window.innerWidth - this.size;
            this.dirX = -Math.abs(this.dirX);
            bounced = true;
        }
        // Top wall
        if (this.y <= this.size) {
            this.y = this.size;
            this.dirY = Math.abs(this.dirY);
            bounced = true;
        }
        // Bottom wall
        if (this.y >= window.innerHeight - this.size) {
            this.y = window.innerHeight - this.size;
            this.dirY = -Math.abs(this.dirY);
            bounced = true;
        }

        if (bounced) {
            this.bouncesRemaining--;
            this.angle = Math.atan2(this.dirY, this.dirX);

            // Extend range on each bounce (add 30% more range)
            this.maxTravel += this.maxTravel * 0.3;

            // Update end position for non-homing
            const remaining = this.maxTravel - this.distanceTraveled;
            this.endX = this.x + this.dirX * remaining;
            this.endY = this.y + this.dirY * remaining;
        }
    }

    checkCollision(enemies, onChain = null) {
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            // Skip already pierced enemies
            if (this.piercedEnemies.has(enemy)) continue;

            const distX = Math.abs(this.x - enemy.x);
            const distY = Math.abs(this.y - enemy.y);
            const distC = Math.sqrt(distX * distX + distY * distY);

            if (distC <= this.size + enemy.size) {
                // Mark this enemy as hit
                this.piercedEnemies.add(enemy);

                // Ricochet - bounce off enemy if we have bounces left
                if (this.gunType === 'ricochet' && this.bouncesRemaining > 0) {
                    this.bounceOffEnemy(enemy);
                    // Don't set enemyCollision - bullet continues without interruption

                    // Chain lightning effect
                    if (this.chainsRemaining > 0 && onChain) {
                        this.triggerChain(enemy, enemies, onChain);
                    }

                    return; // Continue moving after bounce
                }

                // Piercing - continue if we have pierce left
                if (this.pierceCount > 0) {
                    this.pierceCount--;
                    // Mark enemy as hit so it gets killed
                    enemy.bulletCollision = true;

                    // Chain lightning effect
                    if (this.chainsRemaining > 0 && onChain) {
                        this.triggerChain(enemy, enemies, onChain);
                    }

                    // If no more pierces left, destroy the bullet
                    if (this.pierceCount <= 0) {
                        this.enemyCollision = true;
                        return;
                    }

                    return; // Continue moving
                }

                // Chain on final hit
                if (this.chainsRemaining > 0 && onChain) {
                    this.triggerChain(enemy, enemies, onChain);
                }

                // Mark enemy as hit so it gets killed
                enemy.bulletCollision = true;
                this.enemyCollision = true;
                return;
            }
        }

        this.enemyCollision = false;
    }

    bounceOffEnemy(enemy) {
        // Mark enemy as hit so it gets killed
        enemy.bulletCollision = true;

        // Calculate reflection direction based on collision normal
        const dx = this.x - enemy.x;
        const dy = this.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Normal vector from enemy center to bullet
        const nx = dx / dist;
        const ny = dy / dist;

        // Reflect direction: d' = d - 2(d·n)n
        const dot = this.dirX * nx + this.dirY * ny;
        this.dirX = this.dirX - 2 * dot * nx;
        this.dirY = this.dirY - 2 * dot * ny;

        // Update angle
        this.angle = Math.atan2(this.dirY, this.dirX);

        // Push bullet outside enemy to prevent multiple collisions
        this.x = enemy.x + nx * (enemy.size + this.size + 5);
        this.y = enemy.y + ny * (enemy.size + this.size + 5);

        // Decrement bounce count
        this.bouncesRemaining--;

        // Extend range on each bounce (add 30% more range)
        this.maxTravel += this.maxTravel * 0.3;

        // Update end position
        const remaining = this.maxTravel - this.distanceTraveled;
        this.endX = this.x + this.dirX * remaining;
        this.endY = this.y + this.dirY * remaining;
    }

    triggerChain(hitEnemy, enemies, onChain) {
        // Find nearby enemies to chain to
        const chainTargets = [];

        for (const enemy of enemies) {
            if (enemy === hitEnemy) continue;
            if (this.piercedEnemies.has(enemy)) continue;

            const dx = enemy.x - hitEnemy.x;
            const dy = enemy.y - hitEnemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.chainRange) {
                chainTargets.push({ enemy, dist });
            }
        }

        // Sort by distance and chain to closest
        chainTargets.sort((a, b) => a.dist - b.dist);

        const toChain = Math.min(this.chainsRemaining, chainTargets.length);
        for (let i = 0; i < toChain; i++) {
            onChain(hitEnemy, chainTargets[i].enemy, this.gunData);
            this.chainsRemaining--;
        }
    }

    draw(context) {
        const rX = window.innerWidth / 2560;
        const pulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.6;
            const trailSize = this.size * (i / this.trail.length) * 0.8;

            context.save();
            context.globalAlpha = alpha;
            context.beginPath();
            context.fillStyle = this.glowColor;
            context.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }

        context.save();

        // Special effects based on gun type
        if (this.gunType === 'chain') {
            // Electric effect
            context.strokeStyle = this.color;
            context.lineWidth = 2 * rX;
            context.shadowColor = this.glowColor;
            context.shadowBlur = 15 * rX;

            for (let i = 0; i < 3; i++) {
                const offset = (Math.random() - 0.5) * this.size;
                context.beginPath();
                context.moveTo(this.x - this.size, this.y + offset);
                context.lineTo(this.x + this.size, this.y - offset);
                context.stroke();
            }
        }

        if (this.gunType === 'homing') {
            // Missile trail effect
            context.fillStyle = '#ff00ff44';
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.lineTo(
                this.x - this.dirX * this.size * 2 + this.dirY * this.size,
                this.y - this.dirY * this.size * 2 - this.dirX * this.size
            );
            context.lineTo(
                this.x - this.dirX * this.size * 2 - this.dirY * this.size,
                this.y - this.dirY * this.size * 2 + this.dirX * this.size
            );
            context.closePath();
            context.fill();
        }

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

        // Piercing indicator rings
        if (this.gunData.pierceCount && this.pierceCount > 0) {
            context.strokeStyle = '#00ffff88';
            context.lineWidth = 2 * rX;
            context.beginPath();
            context.arc(this.x, this.y, this.size * 1.3, 0, Math.PI * 2);
            context.stroke();
        }

        context.restore();
    }
}

// Chain bolt - spawned when chain lightning triggers
export class ChainBolt {
    constructor(fromX, fromY, toEnemy, gunData, recursiveDepth = 0, hitEnemies = null) {
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toEnemy.x;
        this.toY = toEnemy.y;
        this.targetEnemy = toEnemy;
        this.gunData = gunData;

        // Recursive bouncing properties
        this.recursiveDepth = recursiveDepth;
        this.maxRecursiveBounces = gunData.recursiveBounces || 0;
        this.hitEnemies = hitEnemies || new Set();
        this.hitEnemies.add(toEnemy); // Mark this enemy as hit

        // Track if we need to trigger recursive chains
        this.needsRecursiveChain = false;
        this.recursiveChainTriggered = false;

        this.duration = 150; // ms
        this.startTime = performance.now();
        this.expired = false;

        this.segments = [];
        this.generateSegments();
    }

    generateSegments() {
        const dx = this.toX - this.fromX;
        const dy = this.toY - this.fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const numSegments = Math.floor(dist / 20) + 2;

        this.segments = [];
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            let x = this.fromX + dx * t;
            let y = this.fromY + dy * t;

            // Add random offset (except endpoints)
            if (i > 0 && i < numSegments) {
                x += (Math.random() - 0.5) * 20;
                y += (Math.random() - 0.5) * 20;
            }

            this.segments.push({ x, y });
        }
    }

    update() {
        const elapsed = performance.now() - this.startTime;

        if (elapsed > this.duration) {
            this.expired = true;
        }

        // Trigger recursive chains at halfway point (so visual chains appear sequentially)
        if (!this.recursiveChainTriggered && elapsed > this.duration * 0.5) {
            if (this.recursiveDepth < this.maxRecursiveBounces) {
                this.needsRecursiveChain = true;
            }
            this.recursiveChainTriggered = true;
        }

        // Regenerate segments for flickering effect
        if (Math.random() < 0.3) {
            this.generateSegments();
        }
    }

    // Get enemies that can be recursively chained to from this bolt's target
    getRecursiveTargets(enemies) {
        if (this.recursiveDepth >= this.maxRecursiveBounces) {
            return [];
        }

        const chainRange = (this.gunData.chainRange || 150) * window.innerWidth / 2560;
        const targets = [];

        for (const enemy of enemies) {
            // Skip already-hit enemies
            if (this.hitEnemies.has(enemy)) continue;

            const dx = enemy.x - this.targetEnemy.x;
            const dy = enemy.y - this.targetEnemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= chainRange) {
                targets.push({ enemy, dist });
            }
        }

        // Sort by distance and return up to chainCount targets
        targets.sort((a, b) => a.dist - b.dist);
        const chainCount = this.gunData.chainCount || 1;
        return targets.slice(0, chainCount);
    }

    // Create new chain bolts for recursive bounce
    createRecursiveChains(enemies) {
        const targets = this.getRecursiveTargets(enemies);
        const newBolts = [];

        for (const target of targets) {
            const newBolt = new ChainBolt(
                this.targetEnemy.x,
                this.targetEnemy.y,
                target.enemy,
                this.gunData,
                this.recursiveDepth + 1,
                this.hitEnemies
            );
            newBolts.push(newBolt);
        }

        this.needsRecursiveChain = false;
        return newBolts;
    }

    draw(context) {
        const rX = window.innerWidth / 2560;
        const alpha = 1 - (performance.now() - this.startTime) / this.duration;

        context.save();
        context.globalAlpha = alpha;
        context.strokeStyle = '#4488ff';
        context.lineWidth = 3 * rX;
        context.shadowColor = '#88aaff';
        context.shadowBlur = 15 * rX;

        context.beginPath();
        context.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            context.lineTo(this.segments[i].x, this.segments[i].y);
        }
        context.stroke();

        // Glow effect
        context.lineWidth = 6 * rX;
        context.globalAlpha = alpha * 0.3;
        context.stroke();

        context.restore();
    }
}
