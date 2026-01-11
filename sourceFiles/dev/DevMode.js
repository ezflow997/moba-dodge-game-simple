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

        // Player count tracking
        this.uniquePlayerCount = null;
        this.playerCountLoading = false;
        this.playerCountError = false;
        this.lastPlayerCountFetch = 0;
        this.playerCountFetchInterval = 60000; // Refresh every 60 seconds

        // Dev menu state (player stats panel)
        this.devMenuOpen = false;
        this.onlinePlayers = [];
        this.onlinePlayersLoading = false;
        this.lastOnlinePlayersFetch = 0;

        // All accounts list
        this.allAccounts = [];
        this.allAccountsLoading = false;

        // Tab state: 'accounts' or 'online'
        this.activeTab = 'accounts';

        // Scroll state for lists
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.itemHeight = 28;
        this.visibleItems = 12;

        // Button dimensions for hit detection
        this.devMenuButton = {
            x: 0, // Will be calculated based on screen width
            y: 10,
            width: 40,
            height: 40
        };
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

    /**
     * Fetch unique player count from API (basic count only)
     */
    async fetchPlayerCount() {
        // This is now only used for background refresh, not for display
    }

    /**
     * Fetch all accounts list from API
     */
    async fetchAllAccounts() {
        if (this.allAccountsLoading) return;

        this.allAccountsLoading = true;

        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        const apiBase = isLocalhost
            ? 'https://moba-dodge-simple.vercel.app/api'
            : '/api';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${apiBase}/player-count?list=true`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                this.uniquePlayerCount = data.registeredPlayers;
                this.allAccounts = data.accounts || [];
            }
        } catch (error) {
            console.error('Failed to fetch all accounts:', error);
        } finally {
            this.allAccountsLoading = false;
        }
    }

    /**
     * Fetch online players list from API
     */
    async fetchOnlinePlayers() {
        if (this.onlinePlayersLoading) return;

        this.onlinePlayersLoading = true;

        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        const apiBase = isLocalhost
            ? 'https://moba-dodge-simple.vercel.app/api'
            : '/api';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${apiBase}/presence?list=true`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                this.onlinePlayers = data.players || [];
            }
        } catch (error) {
            console.error('Failed to fetch online players:', error);
        } finally {
            this.onlinePlayersLoading = false;
            this.lastOnlinePlayersFetch = performance.now();
        }
    }

    /**
     * Toggle dev menu open/closed
     */
    toggleDevMenu() {
        this.devMenuOpen = !this.devMenuOpen;
        if (this.devMenuOpen) {
            // Reset scroll and fetch fresh data when opening
            this.scrollOffset = 0;
            this.fetchAllAccounts();
            this.fetchOnlinePlayers();
        }
    }

    /**
     * Switch active tab
     */
    setActiveTab(tab) {
        if (this.activeTab !== tab) {
            this.activeTab = tab;
            this.scrollOffset = 0; // Reset scroll when switching tabs
        }
    }

    /**
     * Handle scroll for the list
     */
    handleScroll(delta) {
        if (!this.devMenuOpen) return;

        const currentList = this.activeTab === 'accounts' ? this.allAccounts : this.onlinePlayers;
        this.maxScrollOffset = Math.max(0, currentList.length - this.visibleItems);

        this.scrollOffset += delta > 0 ? 1 : -1;
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
    }

    /**
     * Handle click for dev menu button
     * @returns {boolean} True if click was handled
     */
    handleClick(mouseX, mouseY) {
        if (!this.enabled) return false;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Update button position based on screen width
        this.devMenuButton.x = window.innerWidth - 55;

        const btn = this.devMenuButton;
        const scaledX = btn.x;
        const scaledY = btn.y * rX;
        const scaledW = btn.width * rX;
        const scaledH = btn.height * rX;

        if (mouseX >= scaledX && mouseX <= scaledX + scaledW &&
            mouseY >= scaledY && mouseY <= scaledY + scaledH) {
            this.toggleDevMenu();
            return true;
        }

        // If menu is open, handle panel interactions
        if (this.devMenuOpen) {
            // Panel dimensions (centered)
            const panelW = 500 * rX;
            const panelH = 550 * rY;
            const panelX = (window.innerWidth - panelW) / 2;
            const panelY = (window.innerHeight - panelH) / 2;

            // Check if click is inside panel
            if (mouseX >= panelX && mouseX <= panelX + panelW &&
                mouseY >= panelY && mouseY <= panelY + panelH) {

                // Check tab clicks
                const tabY = panelY + 50 * rY;
                const tabH = 40 * rY;
                const tabW = panelW / 2;

                if (mouseY >= tabY && mouseY <= tabY + tabH) {
                    if (mouseX < panelX + tabW) {
                        this.setActiveTab('accounts');
                    } else {
                        this.setActiveTab('online');
                    }
                    return true;
                }

                // Click is inside panel but not on a tab - don't close
                return true;
            }

            // Click outside panel - close it
            this.devMenuOpen = false;
            return true;
        }

        return false;
    }

    /**
     * Draw the dev menu button (top right)
     */
    drawDevMenuButton(context) {
        if (!this.enabled) return;

        const rX = window.innerWidth / 2560;
        const x = window.innerWidth - 55;
        const y = 10 * rX;
        const size = 40 * rX;

        // Update button position for hit detection
        this.devMenuButton.x = x;

        context.save();

        // Button background
        context.fillStyle = this.devMenuOpen ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 100, 0, 0.5)';
        context.strokeStyle = '#00ff00';
        context.lineWidth = 2 * rX;
        context.shadowColor = '#00ff00';
        context.shadowBlur = 8 * rX;

        context.beginPath();
        context.roundRect(x, y, size, size, 8 * rX);
        context.fill();
        context.stroke();

        // Icon (users/people icon using simple shapes)
        context.fillStyle = '#00ff00';
        context.shadowBlur = 4 * rX;

        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const iconScale = rX * 0.8;

        // Draw simple person icon (head + body)
        // Head
        context.beginPath();
        context.arc(centerX, centerY - 8 * iconScale, 6 * iconScale, 0, Math.PI * 2);
        context.fill();

        // Body
        context.beginPath();
        context.arc(centerX, centerY + 8 * iconScale, 10 * iconScale, Math.PI, 0);
        context.fill();

        context.restore();
    }

    /**
     * Draw the dev menu panel
     */
    drawDevMenuPanel(context) {
        if (!this.enabled || !this.devMenuOpen) return;

        const rX = window.innerWidth / 2560;
        const panelX = window.innerWidth - 320 * rX;
        const panelY = 60 * rX;
        const panelW = 300 * rX;
        const panelH = 400 * rX;

        context.save();

        // Panel background
        context.fillStyle = 'rgba(0, 20, 0, 0.95)';
        context.strokeStyle = '#00ff00';
        context.lineWidth = 2 * rX;
        context.shadowColor = '#00ff00';
        context.shadowBlur = 15 * rX;

        context.beginPath();
        context.roundRect(panelX, panelY, panelW, panelH, 10 * rX);
        context.fill();
        context.stroke();

        // Title
        context.font = `bold ${20 * rX}px monospace`;
        context.fillStyle = '#00ff00';
        context.textAlign = 'center';
        context.shadowBlur = 5 * rX;
        context.fillText('DEV STATS', panelX + panelW / 2, panelY + 30 * rX);

        // Divider line
        context.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(panelX + 20 * rX, panelY + 45 * rX);
        context.lineTo(panelX + panelW - 20 * rX, panelY + 45 * rX);
        context.stroke();

        // Accounts count
        context.font = `${16 * rX}px monospace`;
        context.textAlign = 'left';
        context.fillStyle = '#00ffff';
        let currentY = panelY + 70 * rX;

        const accountsText = this.playerCountLoading && this.uniquePlayerCount === null
            ? 'Accounts: Loading...'
            : this.playerCountError && this.uniquePlayerCount === null
                ? 'Accounts: [Error]'
                : `Accounts: ${this.uniquePlayerCount ?? '--'}`;
        context.fillText(accountsText, panelX + 20 * rX, currentY);
        currentY += 25 * rX;

        // Online players count
        context.fillStyle = '#ffff00';
        context.fillText(`Online: ${this.onlinePlayers.length}`, panelX + 20 * rX, currentY);
        currentY += 35 * rX;

        // Online players header
        context.fillStyle = '#888888';
        context.font = `${14 * rX}px monospace`;
        context.fillText('ONLINE PLAYERS:', panelX + 20 * rX, currentY);
        currentY += 20 * rX;

        // Divider
        context.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        context.beginPath();
        context.moveTo(panelX + 20 * rX, currentY - 5 * rX);
        context.lineTo(panelX + panelW - 20 * rX, currentY - 5 * rX);
        context.stroke();

        // Online players list
        context.font = `${14 * rX}px monospace`;
        const maxVisiblePlayers = 10;
        const lineHeight = 22 * rX;

        if (this.onlinePlayersLoading && this.onlinePlayers.length === 0) {
            context.fillStyle = '#666666';
            context.fillText('Loading...', panelX + 25 * rX, currentY + lineHeight);
        } else if (this.onlinePlayers.length === 0) {
            context.fillStyle = '#666666';
            context.fillText('No players online', panelX + 25 * rX, currentY + lineHeight);
        } else {
            const playersToShow = this.onlinePlayers.slice(0, maxVisiblePlayers);
            for (let i = 0; i < playersToShow.length; i++) {
                const player = playersToShow[i];
                const y = currentY + (i + 1) * lineHeight;

                // Online indicator dot
                context.fillStyle = '#00ff00';
                context.beginPath();
                context.arc(panelX + 25 * rX, y - 4 * rX, 4 * rX, 0, Math.PI * 2);
                context.fill();

                // Player name
                context.fillStyle = '#ffffff';
                const displayName = player.name.length > 18
                    ? player.name.substring(0, 18) + '...'
                    : player.name;
                context.fillText(displayName, panelX + 40 * rX, y);
            }

            // Show "+X more" if there are more players
            if (this.onlinePlayers.length > maxVisiblePlayers) {
                const moreCount = this.onlinePlayers.length - maxVisiblePlayers;
                context.fillStyle = '#888888';
                context.fillText(`+${moreCount} more...`, panelX + 25 * rX, currentY + (maxVisiblePlayers + 1) * lineHeight);
            }
        }

        context.restore();
    }

}
