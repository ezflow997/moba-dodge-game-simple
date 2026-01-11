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
        this.visibleItems = 18; // Increased for larger panel

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
            // Panel dimensions (centered) - 1.5x size
            const panelW = 750 * rX;
            const panelH = 825 * rY;
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
     * Draw the dev menu panel (centered, with tabs)
     */
    drawDevMenuPanel(context) {
        if (!this.enabled || !this.devMenuOpen) return;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Panel dimensions (centered) - 1.5x size
        const panelW = 750 * rX;
        const panelH = 825 * rY;
        const panelX = (window.innerWidth - panelW) / 2;
        const panelY = (window.innerHeight - panelH) / 2;

        context.save();

        // Darken background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Panel background
        context.fillStyle = 'rgba(0, 20, 0, 0.98)';
        context.strokeStyle = '#00ff00';
        context.lineWidth = 3 * rX;
        context.shadowColor = '#00ff00';
        context.shadowBlur = 20 * rX;

        context.beginPath();
        context.roundRect(panelX, panelY, panelW, panelH, 12 * rX);
        context.fill();
        context.stroke();

        // Title
        context.font = `bold ${28 * rX}px monospace`;
        context.fillStyle = '#00ff00';
        context.textAlign = 'center';
        context.shadowBlur = 8 * rX;
        context.fillText('DEV STATS', panelX + panelW / 2, panelY + 35 * rY);

        // Tabs
        const tabY = panelY + 50 * rY;
        const tabH = 40 * rY;
        const tabW = panelW / 2;

        // Accounts tab
        context.fillStyle = this.activeTab === 'accounts' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 50, 0, 0.5)';
        context.fillRect(panelX, tabY, tabW, tabH);
        context.strokeStyle = this.activeTab === 'accounts' ? '#00ff00' : '#004400';
        context.lineWidth = 2 * rX;
        context.strokeRect(panelX, tabY, tabW, tabH);

        context.font = `bold ${18 * rX}px monospace`;
        context.fillStyle = this.activeTab === 'accounts' ? '#00ff00' : '#666666';
        context.textAlign = 'center';
        context.shadowBlur = this.activeTab === 'accounts' ? 5 * rX : 0;
        const accountsCount = this.allAccounts.length || this.uniquePlayerCount || 0;
        context.fillText(`All Accounts (${accountsCount})`, panelX + tabW / 2, tabY + 26 * rY);

        // Online tab
        context.fillStyle = this.activeTab === 'online' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 50, 0, 0.5)';
        context.fillRect(panelX + tabW, tabY, tabW, tabH);
        context.strokeStyle = this.activeTab === 'online' ? '#00ff00' : '#004400';
        context.strokeRect(panelX + tabW, tabY, tabW, tabH);

        context.fillStyle = this.activeTab === 'online' ? '#00ff00' : '#666666';
        context.shadowBlur = this.activeTab === 'online' ? 5 * rX : 0;
        context.fillText(`Online (${this.onlinePlayers.length})`, panelX + tabW + tabW / 2, tabY + 26 * rY);

        // Content area
        const contentY = tabY + tabH + 15 * rY;
        const contentH = panelH - (contentY - panelY) - 20 * rY;
        const contentX = panelX + 20 * rX;
        const contentW = panelW - 40 * rX;

        // Draw list based on active tab
        const currentList = this.activeTab === 'accounts' ? this.allAccounts : this.onlinePlayers;
        const isLoading = this.activeTab === 'accounts' ? this.allAccountsLoading : this.onlinePlayersLoading;

        // Update max scroll
        this.maxScrollOffset = Math.max(0, currentList.length - this.visibleItems);

        context.font = `${16 * rX}px monospace`;
        context.textAlign = 'left';
        context.shadowBlur = 0;

        const lineHeight = 32 * rY;
        const listStartY = contentY + 10 * rY;

        if (isLoading && currentList.length === 0) {
            context.fillStyle = '#888888';
            context.textAlign = 'center';
            context.fillText('Loading...', panelX + panelW / 2, listStartY + 50 * rY);
        } else if (currentList.length === 0) {
            context.fillStyle = '#888888';
            context.textAlign = 'center';
            const emptyMsg = this.activeTab === 'accounts' ? 'No accounts found' : 'No players online';
            context.fillText(emptyMsg, panelX + panelW / 2, listStartY + 50 * rY);
        } else {
            // Clip content area
            context.save();
            context.beginPath();
            context.rect(contentX - 5 * rX, contentY, contentW + 10 * rX, contentH);
            context.clip();

            const visibleStart = this.scrollOffset;
            const visibleEnd = Math.min(visibleStart + this.visibleItems, currentList.length);

            for (let i = visibleStart; i < visibleEnd; i++) {
                const item = currentList[i];
                const y = listStartY + (i - visibleStart) * lineHeight;

                // Row background (alternating)
                if ((i - visibleStart) % 2 === 0) {
                    context.fillStyle = 'rgba(0, 255, 0, 0.05)';
                    context.fillRect(contentX, y - 8 * rY, contentW, lineHeight - 4 * rY);
                }

                // Index number
                context.fillStyle = '#555555';
                context.textAlign = 'right';
                context.fillText(`${i + 1}.`, contentX + 35 * rX, y + 12 * rY);

                // Status indicator
                if (this.activeTab === 'online') {
                    // Green dot for online
                    context.fillStyle = '#00ff00';
                    context.beginPath();
                    context.arc(contentX + 50 * rX, y + 8 * rY, 5 * rX, 0, Math.PI * 2);
                    context.fill();
                }

                // Player name
                context.fillStyle = '#ffffff';
                context.textAlign = 'left';
                const nameX = this.activeTab === 'online' ? contentX + 65 * rX : contentX + 45 * rX;
                const displayName = item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name;
                context.fillText(displayName, nameX, y + 12 * rY);
            }

            context.restore();

            // Draw scrollbar if needed
            if (currentList.length > this.visibleItems) {
                const scrollbarX = panelX + panelW - 15 * rX;
                const scrollbarY = contentY;
                const scrollbarH = contentH;
                const scrollbarW = 8 * rX;

                // Scrollbar track
                context.fillStyle = 'rgba(0, 255, 0, 0.2)';
                context.fillRect(scrollbarX, scrollbarY, scrollbarW, scrollbarH);

                // Scrollbar thumb
                const thumbRatio = this.visibleItems / currentList.length;
                const thumbH = Math.max(scrollbarH * thumbRatio, 30 * rY);
                const thumbY = scrollbarY + (this.scrollOffset / this.maxScrollOffset) * (scrollbarH - thumbH);

                context.fillStyle = '#00ff00';
                context.beginPath();
                context.roundRect(scrollbarX, thumbY, scrollbarW, thumbH, 4 * rX);
                context.fill();

                // Scroll hint
                context.fillStyle = '#666666';
                context.font = `${12 * rX}px monospace`;
                context.textAlign = 'center';
                context.fillText('Scroll to see more', panelX + panelW / 2, panelY + panelH - 10 * rY);
            }
        }

        // Close hint
        context.fillStyle = '#555555';
        context.font = `${14 * rX}px monospace`;
        context.textAlign = 'center';
        context.fillText('Click outside to close', panelX + panelW / 2, panelY + panelH + 25 * rY);

        context.restore();
    }

}
