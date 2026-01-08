/**
 * TestRoom - Isolated testing environment with target dummies and pickup grid
 */
export class TestRoom {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.dummies = [];
        this.pickupGrid = [];
        
        // Test room dimensions
        this.width = 2000;
        this.height = 1200;
        
        // Saved game state
        this.savedState = null;
    }
    
    /**
     * Enter test room
     */
    enter() {
        if (this.active) return;
        
        // Save current game state
        this.savedState = {
            score: this.game.score,
            playerX: this.game.player.x,
            playerY: this.game.player.y,
            playerSpeed: this.game.player.speed,
            enemies: [...this.game.enemies.enemiesList],
            projectiles: [...this.game.projectiles.projectilesList],
            bullets: [...this.game.bullets.bulletsList],
            gameOver: this.game.gameOver,
            difficulty: this.game.difficulty_level,
            level: this.game.enemies.level
        };
        
        // Clear game entities
        this.game.enemies.enemiesList = [];
        this.game.projectiles.projectilesList = [];
        this.game.bullets.bulletsList = [];
        this.game.voidBolts.reset();
        this.game.gameOver = false;
        
        // Setup test room
        this.setupDummies();
        this.setupPickupGrid();
        
        // Position player at spawn point
        this.game.player.x = this.game.width / 2;
        this.game.player.y = this.game.height - 200;
        this.game.player.desiredX = this.game.player.x;
        this.game.player.desiredY = this.game.player.y;
        
        this.active = true;
    }
    
    /**
     * Exit test room and restore game state
     */
    exit() {
        if (!this.active) return;
        
        // Restore game state
        if (this.savedState) {
            this.game.score = this.savedState.score;
            this.game.player.x = this.savedState.playerX;
            this.game.player.y = this.savedState.playerY;
            this.game.player.speed = this.savedState.playerSpeed;
            this.game.player.desiredX = this.savedState.playerX;
            this.game.player.desiredY = this.savedState.playerY;
            this.game.enemies.enemiesList = [...this.savedState.enemies];
            this.game.projectiles.projectilesList = [...this.savedState.projectiles];
            this.game.bullets.bulletsList = [...this.savedState.bullets];
            this.game.gameOver = this.savedState.gameOver;
            this.game.difficulty_level = this.savedState.difficulty;
            this.game.enemies.level = this.savedState.level;
        }
        
        // Clear test room data
        this.dummies = [];
        this.pickupGrid = [];
        this.savedState = null;
        this.active = false;
    }
    
    /**
     * Setup target dummies
     */
    setupDummies() {
        const centerX = this.game.width / 2;
        const topY = 200;
        const spacing = 250;
        
        // Create dummies with different HP values
        this.dummies = [
            this.createDummy(centerX - spacing * 2, topY, 1000, 'Low HP', false),
            this.createDummy(centerX - spacing, topY, 5000, 'Medium HP', false),
            this.createDummy(centerX, topY, 10000, 'High HP', false),
            this.createDummy(centerX + spacing, topY, 20000, 'Very High HP', false),
            this.createDummy(centerX + spacing * 2, topY, 50000, 'Ultra HP', false)
        ];
    }
    
    /**
     * Create a target dummy
     */
    createDummy(x, y, maxHp, label, moving) {
        return {
            x,
            y,
            startX: x,
            startY: y,
            maxHp,
            hp: maxHp,
            label,
            size: 60,
            moving,
            moveAngle: 0,
            moveRadius: 100,
            moveSpeed: 0.02,
            color: '#888888',
            takeDamage(amount) {
                this.hp = Math.max(0, this.hp - amount);
            },
            reset() {
                this.hp = this.maxHp;
                this.x = this.startX;
                this.y = this.startY;
            }
        };
    }
    
    /**
     * Setup pickup grid
     */
    setupPickupGrid() {
        const startX = 200;
        const startY = this.game.height / 2;
        const spacing = 120;
        
        // Create a grid of different pickup types (left side)
        const pickupTypes = [
            { type: 'speed', label: 'Speed\nBoost', color: '#00ff00' },
            { type: 'shield', label: 'Shield', color: '#0088ff' },
            { type: 'damage', label: 'Damage\nUp', color: '#ff0000' },
            { type: 'cooldown', label: 'CD\nReduce', color: '#ffff00' },
            { type: 'multishot', label: 'Multi\nShot', color: '#ff00ff' },
            { type: 'life', label: 'Extra\nLife', color: '#00ffff' }
        ];
        
        this.pickupGrid = [];
        for (let i = 0; i < pickupTypes.length; i++) {
            const pickup = pickupTypes[i];
            this.pickupGrid.push({
                x: startX + (i % 3) * spacing,
                y: startY + Math.floor(i / 3) * spacing,
                type: pickup.type,
                label: pickup.label,
                color: pickup.color,
                size: 30
            });
        }
        
        // Create gun upgrade pickups (right side)
        const gunStartX = this.game.width - 350;
        const gunStartY = this.game.height / 2;
        const gunSpacing = 120;
        
        const gunTypes = [
            { type: 'shotgun_common', label: 'Shotgun', color: '#9d9d9d' },
            { type: 'rapidfire_uncommon', label: 'Rapid\nFire', color: '#1eff00' },
            { type: 'piercing_rare', label: 'Piercing', color: '#0070dd' },
            { type: 'ricochet_uncommon', label: 'Ricochet', color: '#1eff00' },
            { type: 'homing_rare', label: 'Homing', color: '#0070dd' },
            { type: 'twin_common', label: 'Twin\nShot', color: '#9d9d9d' }
        ];
        
        for (let i = 0; i < gunTypes.length; i++) {
            const gun = gunTypes[i];
            this.pickupGrid.push({
                x: gunStartX + (i % 3) * gunSpacing,
                y: gunStartY + Math.floor(i / 3) * gunSpacing,
                type: gun.type,
                label: gun.label,
                color: gun.color,
                size: 30,
                isGun: true
            });
        }
    }
    
    /**
     * Update test room
     */
    update() {
        if (!this.active) return;
        
        // Update moving dummies
        for (const dummy of this.dummies) {
            if (dummy.moving) {
                dummy.moveAngle += dummy.moveSpeed;
                dummy.x = dummy.startX + Math.cos(dummy.moveAngle) * dummy.moveRadius;
                dummy.y = dummy.startY + Math.sin(dummy.moveAngle) * dummy.moveRadius;
            }
            
            // Check collisions with bullets
            this.checkBulletCollisions(dummy);
        }
        
        // Check pickup collisions
        this.checkPickupCollisions();
    }
    
    /**
     * Check bullet collisions with dummies
     */
    checkBulletCollisions(dummy) {
        const bulletsList = this.game.challenge_level === 0 
            ? this.game.bullets.bulletsList 
            : this.game.voidBolts.bolts;
        
        for (let i = bulletsList.length - 1; i >= 0; i--) {
            const bullet = bulletsList[i];
            const dx = bullet.x - dummy.x;
            const dy = bullet.y - dummy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < dummy.size + (bullet.size || 8)) {
                // Hit!
                const damage = this.game.devMode ? 
                    100 * this.game.devMode.damageMultiplier : 100;
                dummy.takeDamage(damage);
                
                // Remove bullet
                bulletsList.splice(i, 1);
                
                // Visual effect
                if (this.game.effects) {
                    this.game.effects.addExplosion(bullet.x, bullet.y, 20, '#ffff00');
                }
            }
        }
    }
    
    /**
     * Check pickup collisions with player
     */
    checkPickupCollisions() {
        const player = this.game.player;
        const pickupRadius = 40; // Pickup collection radius
        
        for (let i = this.pickupGrid.length - 1; i >= 0; i--) {
            const pickup = this.pickupGrid[i];
            const dx = player.x - pickup.x;
            const dy = player.y - pickup.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < pickupRadius + player.size) {
                // Spawn actual reward through reward manager
                if (this.game.rewardManager) {
                    this.game.rewardManager.spawnReward(pickup.x, pickup.y);
                }
                
                // Respawn pickup after a delay (or remove and re-add)
                const originalPickup = {...pickup};
                this.pickupGrid.splice(i, 1);
                
                // Respawn after 3 seconds
                setTimeout(() => {
                    if (this.active) {
                        this.pickupGrid.push(originalPickup);
                    }
                }, 3000);
            }
        }
    }
    
    /**
     * Draw test room
     */
    draw(context) {
        if (!this.active) return;
        
        const rX = window.innerWidth / 2560;
        
        // Draw test room title
        context.save();
        context.font = `${50 * rX}px monospace`;
        context.fillStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 10 * rX;
        context.textAlign = 'center';
        context.fillText('TEST ROOM', this.game.width / 2, 60);
        
        // Draw instructions
        context.font = `${24 * rX}px monospace`;
        context.fillStyle = '#ffffff';
        context.shadowBlur = 5 * rX;
        context.fillText('Type "testroom" or "test" to exit', this.game.width / 2, 100);
        context.restore();
        
        // Draw dummies
        this.drawDummies(context);
        
        // Draw pickup grid
        this.drawPickupGrid(context);
        
        // Draw boundaries
        this.drawBoundaries(context);
    }
    
    /**
     * Draw target dummies
     */
    drawDummies(context) {
        const rX = window.innerWidth / 2560;
        
        for (const dummy of this.dummies) {
            context.save();
            
            // Draw dummy body
            const gradient = context.createRadialGradient(
                dummy.x, dummy.y, 0,
                dummy.x, dummy.y, dummy.size
            );
            gradient.addColorStop(0, '#666666');
            gradient.addColorStop(1, dummy.color);
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(dummy.x, dummy.y, dummy.size, 0, Math.PI * 2);
            context.fill();
            
            // Draw outline
            context.strokeStyle = '#ffffff';
            context.lineWidth = 2 * rX;
            context.stroke();
            
            // Draw HP bar
            const barWidth = dummy.size * 2;
            const barHeight = 8 * rX;
            const barX = dummy.x - barWidth / 2;
            const barY = dummy.y - dummy.size - 20;
            
            // Background
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(barX, barY, barWidth, barHeight);
            
            // HP fill
            const hpPercent = dummy.hp / dummy.maxHp;
            const fillColor = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
            context.fillStyle = fillColor;
            context.fillRect(barX, barY, barWidth * hpPercent, barHeight);
            
            // HP text
            context.font = `${14 * rX}px monospace`;
            context.fillStyle = '#ffffff';
            context.textAlign = 'center';
            context.shadowBlur = 3 * rX;
            context.fillText(`${dummy.hp}/${dummy.maxHp}`, dummy.x, barY - 5);
            
            // Draw label
            context.font = `${16 * rX}px monospace`;
            const lines = dummy.label.split('\n');
            for (let i = 0; i < lines.length; i++) {
                context.fillText(lines[i], dummy.x, dummy.y + dummy.size + 25 + i * 18);
            }
            
            // Reset button indicator
            context.font = `${12 * rX}px monospace`;
            context.fillStyle = '#00ffff';
            context.fillText('[R to Reset]', dummy.x, dummy.y + dummy.size + 55);
            
            context.restore();
        }
    }
    
    /**
     * Draw pickup grid
     */
    drawPickupGrid(context) {
        const rX = window.innerWidth / 2560;
        
        context.save();
        
        // Separate pickups into left and right groups
        const leftPickups = this.pickupGrid.filter(p => !p.isGun);
        const gunPickups = this.pickupGrid.filter(p => p.isGun);
        
        // Draw left section title (PICKUPS)
        context.font = `${32 * rX}px monospace`;
        context.fillStyle = '#ffff00';
        context.shadowColor = '#ffff00';
        context.shadowBlur = 8 * rX;
        context.textAlign = 'left';
        context.fillText('PICKUPS', 100, this.game.height / 2 - 60);
        
        // Draw left pickups
        for (const pickup of leftPickups) {
            // Draw pickup circle
            context.fillStyle = pickup.color;
            context.shadowColor = pickup.color;
            context.shadowBlur = 15 * rX;
            context.beginPath();
            context.arc(pickup.x, pickup.y, pickup.size, 0, Math.PI * 2);
            context.fill();
            
            // Draw label
            context.font = `${14 * rX}px monospace`;
            context.fillStyle = '#ffffff';
            context.shadowBlur = 3 * rX;
            context.textAlign = 'center';
            const lines = pickup.label.split('\n');
            for (let i = 0; i < lines.length; i++) {
                context.fillText(lines[i], pickup.x, pickup.y + pickup.size + 20 + i * 16);
            }
        }
        
        // Draw right section title (GUN UPGRADES)
        context.font = `${32 * rX}px monospace`;
        context.fillStyle = '#ff8000';
        context.shadowColor = '#ff8000';
        context.shadowBlur = 8 * rX;
        context.textAlign = 'right';
        context.fillText('GUN UPGRADES', this.game.width - 100, this.game.height / 2 - 60);
        
        // Draw gun pickups
        for (const pickup of gunPickups) {
            // Draw pickup circle
            context.fillStyle = pickup.color;
            context.shadowColor = pickup.color;
            context.shadowBlur = 15 * rX;
            context.beginPath();
            context.arc(pickup.x, pickup.y, pickup.size, 0, Math.PI * 2);
            context.fill();
            
            // Draw label
            context.font = `${14 * rX}px monospace`;
            context.fillStyle = '#ffffff';
            context.shadowBlur = 3 * rX;
            context.textAlign = 'center';
            const lines = pickup.label.split('\n');
            for (let i = 0; i < lines.length; i++) {
                context.fillText(lines[i], pickup.x, pickup.y + pickup.size + 20 + i * 16);
            }
        }
        
        context.restore();
    }
    
    /**
     * Draw test room boundaries
     */
    drawBoundaries(context) {
        const rX = window.innerWidth / 2560;
        const margin = 50;
        
        context.save();
        context.strokeStyle = '#00ffff';
        context.lineWidth = 3 * rX;
        context.setLineDash([10, 5]);
        context.shadowColor = '#00ffff';
        context.shadowBlur = 10 * rX;
        
        // Draw boundary rectangle
        context.strokeRect(
            margin,
            margin,
            this.game.width - margin * 2,
            this.game.height - margin * 2
        );
        
        context.restore();
    }
    
    /**
     * Handle reset key press
     */
    handleResetKey() {
        // Reset all dummies
        for (const dummy of this.dummies) {
            dummy.reset();
        }
    }
}
