/**
 * DevMode - Manages developer mode state and settings
 */
export class DevMode {
    constructor() {
        // Load dev mode state from localStorage
        this.enabled = localStorage.getItem('devModeEnabled') === 'true';
        
        // Cheat states
        this.godMode = false;
        this.instantCooldowns = false;
        this.noclip = false;
        this.damageMultiplier = 1.0;
        this.speedMultiplier = 1.0;
        this.timescale = 1.0;
        this.freeCam = false;
        this.zoom = 1.0;
        
        // Visualization states
        this.showHitboxes = false;
        this.showFPS = false;
        this.showStats = false;
        this.showGrid = false;
        this.showPaths = false;
        
        // Camera position for free cam
        this.cameraX = 0;
        this.cameraY = 0;
        
        // Test room state
        this.inTestRoom = false;
        this.savedGameState = null;

        // Track if dev mode was used during current game session
        // This prevents turning off dev mode to save cheated scores
        this.usedThisSession = false;
        
        // FPS tracking
        this.fps = 0;
        this.lastFPSUpdate = 0;
        this.frameCount = 0;
    }
    
    /**
     * Enable or disable dev mode
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('devModeEnabled', enabled.toString());

        // Mark that dev mode was used this session (can't be undone until new game)
        if (enabled) {
            this.usedThisSession = true;
        }

        // Reset all cheats when disabling
        if (!enabled) {
            this.resetAllCheats();
        }
    }
    
    /**
     * Check if dev mode is enabled
     */
    isEnabled() {
        return this.enabled;
    }
    
    /**
     * Reset all cheat states to default
     */
    resetAllCheats() {
        this.godMode = false;
        this.instantCooldowns = false;
        this.noclip = false;
        this.damageMultiplier = 1.0;
        this.speedMultiplier = 1.0;
        this.timescale = 1.0;
        this.freeCam = false;
        this.zoom = 1.0;
        this.showHitboxes = false;
        this.showFPS = false;
        this.showStats = false;
        this.showGrid = false;
        this.showPaths = false;
        this.cameraX = 0;
        this.cameraY = 0;
    }

    /**
     * Reset session tracking for new game
     * Call this when starting a new game to allow score saving again
     */
    resetSession() {
        this.usedThisSession = this.enabled; // If still enabled, mark as used
    }

    /**
     * Check if dev mode was used at any point during this game session
     */
    wasUsedThisSession() {
        return this.usedThisSession || this.enabled;
    }
    
    /**
     * Update FPS counter
     */
    updateFPS() {
        const now = performance.now();
        this.frameCount++;
        
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }
    
    /**
     * Draw dev mode indicator and active cheats
     */
    drawIndicators(context, game) {
        if (!this.enabled) return;
        
        const rX = window.innerWidth / 2560;
        const startY = 20;
        let currentY = startY;
        const fontSize = 24;
        const lineHeight = 30;
        
        context.save();
        context.font = `${fontSize * rX}px monospace`;
        context.shadowBlur = 5 * rX;
        
        // Dev mode indicator
        context.fillStyle = '#00ff00';
        context.shadowColor = '#00ff00';
        context.fillText('[DEV MODE]', 10, currentY);
        currentY += lineHeight;
        
        // Active cheats
        if (this.godMode) {
            context.fillStyle = '#ffff00';
            context.shadowColor = '#ffff00';
            context.fillText('[GOD MODE]', 10, currentY);
            currentY += lineHeight;
        }
        
        if (this.instantCooldowns) {
            context.fillStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.fillText('[INSTANT CD]', 10, currentY);
            currentY += lineHeight;
        }
        
        if (this.noclip) {
            context.fillStyle = '#ff00ff';
            context.shadowColor = '#ff00ff';
            context.fillText('[NOCLIP]', 10, currentY);
            currentY += lineHeight;
        }
        
        if (this.speedMultiplier !== 1.0) {
            context.fillStyle = '#ffaa00';
            context.shadowColor = '#ffaa00';
            context.fillText(`[SPEED x${this.speedMultiplier.toFixed(1)}]`, 10, currentY);
            currentY += lineHeight;
        }
        
        if (this.timescale !== 1.0) {
            context.fillStyle = '#ff88ff';
            context.shadowColor = '#ff88ff';
            context.fillText(`[TIME x${this.timescale.toFixed(1)}]`, 10, currentY);
            currentY += lineHeight;
        }
        
        if (this.freeCam) {
            context.fillStyle = '#88ff88';
            context.shadowColor = '#88ff88';
            context.fillText('[FREE CAM]', 10, currentY);
            currentY += lineHeight;
        }
        
        context.restore();
    }
    
    /**
     * Draw FPS counter
     */
    drawFPS(context) {
        if (!this.showFPS) return;
        
        const rX = window.innerWidth / 2560;
        const x = window.innerWidth - 100;
        const y = 30;
        
        context.save();
        context.font = `${28 * rX}px monospace`;
        context.fillStyle = this.fps >= 50 ? '#00ff00' : this.fps >= 30 ? '#ffff00' : '#ff0000';
        context.shadowColor = context.fillStyle;
        context.shadowBlur = 5 * rX;
        context.textAlign = 'right';
        context.fillText(`FPS: ${this.fps}`, x, y);
        context.restore();
    }
    
    /**
     * Draw detailed stats overlay
     */
    drawStats(context, game) {
        if (!this.showStats) return;
        
        const rX = window.innerWidth / 2560;
        const x = window.innerWidth - 10;
        let y = 80;
        const fontSize = 20;
        const lineHeight = 25;
        
        context.save();
        context.font = `${fontSize * rX}px monospace`;
        context.fillStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 3 * rX;
        context.textAlign = 'right';
        
        const stats = [
            `Pos: (${Math.round(game.player.x)}, ${Math.round(game.player.y)})`,
            `Vel: (${Math.round(game.player.dx)}, ${Math.round(game.player.dy)})`,
            `Speed: ${game.player.speed.toFixed(1)}`,
            `Score: ${game.score}`,
            `Enemies: ${game.enemies.enemiesList.length}`,
            `Projectiles: ${game.projectiles.projectilesList.length}`,
            `Q CD: ${(game.player.qCoolDownElapsed / 1000).toFixed(1)}s`,
            `E CD: ${(game.player.eCoolDownElapsed / 1000).toFixed(1)}s`,
            `F CD: ${(game.player.fCoolDownElapsed / 1000).toFixed(1)}s`,
        ];
        
        for (const stat of stats) {
            context.fillText(stat, x, y);
            y += lineHeight;
        }
        
        context.restore();
    }
    
    /**
     * Draw hitboxes for all entities
     */
    drawHitboxes(context, game) {
        if (!this.showHitboxes) return;
        
        const rX = window.innerWidth / 2560;
        context.save();
        context.lineWidth = 2 * rX;
        
        // Player hitbox (green)
        context.strokeStyle = '#00ff00';
        context.beginPath();
        context.arc(game.player.x, game.player.y, game.player.size, 0, Math.PI * 2);
        context.stroke();
        
        // Enemy hitboxes (red)
        context.strokeStyle = '#ff0000';
        for (const enemy of game.enemies.enemiesList) {
            context.beginPath();
            context.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            context.stroke();
        }
        
        // Boss hitbox (dark red)
        if (game.enemies.bossActive && game.enemies.boss) {
            context.strokeStyle = '#aa0000';
            context.lineWidth = 3 * rX;
            context.beginPath();
            context.arc(game.enemies.boss.x, game.enemies.boss.y, game.enemies.boss.size, 0, Math.PI * 2);
            context.stroke();
            context.lineWidth = 2 * rX;
        }
        
        // Projectile hitboxes (yellow)
        context.strokeStyle = '#ffff00';
        for (const projectile of game.projectiles.projectilesList) {
            context.beginPath();
            context.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            context.stroke();
        }
        
        // Bullet hitboxes (cyan)
        context.strokeStyle = '#00ffff';
        const bulletsList = game.challenge_level === 0 ? game.bullets.bulletsList : game.voidBolts.bolts;
        for (const bullet of bulletsList) {
            context.beginPath();
            context.arc(bullet.x, bullet.y, bullet.size || 8, 0, Math.PI * 2);
            context.stroke();
        }
        
        // Pickup hitboxes (blue)
        context.strokeStyle = '#0088ff';
        if (game.rewardManager && game.rewardManager.drops) {
            for (const drop of game.rewardManager.drops) {
                context.beginPath();
                context.arc(drop.x, drop.y, drop.size || 20, 0, Math.PI * 2);
                context.stroke();
            }
        }
        
        context.restore();
    }
    
    /**
     * Draw coordinate grid overlay
     */
    drawGridOverlay(context, game) {
        if (!this.showGrid) return;
        
        const rX = window.innerWidth / 2560;
        const gridSize = 100;
        const alpha = 0.3;
        
        context.save();
        context.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        context.lineWidth = 1;
        context.font = `${14 * rX}px monospace`;
        context.fillStyle = `rgba(0, 255, 255, ${alpha + 0.2})`;
        
        // Vertical lines
        for (let x = 0; x < game.width; x += gridSize) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, game.height);
            context.stroke();
            
            // Label
            context.fillText(x.toString(), x + 5, 15);
        }
        
        // Horizontal lines
        for (let y = 0; y < game.height; y += gridSize) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(game.width, y);
            context.stroke();
            
            // Label
            context.fillText(y.toString(), 5, y + 15);
        }
        
        context.restore();
    }
}
