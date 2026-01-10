import { REWARDS, CATEGORY } from '../controller/rewardTypes.js';

/**
 * CommandRegistry - Manages all debug console commands
 */
export class CommandRegistry {
    constructor(game, devMode) {
        this.game = game;
        this.devMode = devMode;
        this.commands = new Map();

        // Cache pickup IDs for suggestions
        this.pickupIds = Object.values(REWARDS).map(r => r.id);

        // Register all commands
        this.registerAllCommands();
    }
    
    /**
     * Register all available commands
     */
    registerAllCommands() {
        // Combat cheats
        this.register('god', this.cmdGodMode.bind(this), 'Toggle invincibility', ['godmode']);
        this.register('instantcd', this.cmdInstantCD.bind(this), 'Toggle instant ability cooldowns', ['nocd']);
        this.register('damage', this.cmdDamage.bind(this), 'Set damage multiplier <amount>');
        this.register('heal', this.cmdHeal.bind(this), 'Restore health to maximum', ['maxhp']);
        this.register('maxmana', this.cmdMaxMana.bind(this), 'Restore mana/energy to maximum');
        this.register('sethealth', this.cmdSetHealth.bind(this), 'Set health to specific value <amount>');
        
        // Progression cheats
        this.register('levelup', this.cmdLevelUp.bind(this), 'Level up by specified amount [amount=1]');
        this.register('setlevel', this.cmdSetLevel.bind(this), 'Set player to specific level <level>');
        this.register('addxp', this.cmdAddXP.bind(this), 'Add experience points <amount>');
        this.register('maxlevel', this.cmdMaxLevel.bind(this), 'Set to maximum level');
        
        // Spawning & testing
        this.register('testroom', this.cmdTestRoom.bind(this), 'Load isolated test room', ['test']);
        this.register('spawn', this.cmdSpawn.bind(this), 'Spawn specific enemy <type>');
        this.register('spawnpickup', this.cmdSpawnPickup.bind(this), 'Spawn specific pickup <type>');
        this.register('boss', this.cmdBoss.bind(this), 'Spawn a boss [type: shooter, charger, vortex]', ['spawnboss']);
        this.register('clear', this.cmdClear.bind(this), 'Remove all enemies and projectiles', ['clearenemies']);
        this.register('clearprojectiles', this.cmdClearProjectiles.bind(this), 'Remove only projectiles');
        
        // Movement & position
        this.register('speed', this.cmdSpeed.bind(this), 'Set movement speed multiplier <multiplier>');
        this.register('teleport', this.cmdTeleport.bind(this), 'Teleport to coordinates <x> <y>');
        this.register('tp', this.cmdTP.bind(this), 'Teleport to named position <landmark>');
        this.register('noclip', this.cmdNoclip.bind(this), 'Toggle collision detection');
        
        // Time & simulation
        this.register('timescale', this.cmdTimescale.bind(this), 'Adjust game speed <value> (0.1-10.0)');
        this.register('pause', this.cmdPause.bind(this), 'Pause/unpause game simulation');
        this.register('step', this.cmdStep.bind(this), 'Advance game by frames while paused [frames=1]');
        
        // Visualization
        this.register('hitboxes', this.cmdHitboxes.bind(this), 'Toggle hitbox visualization', ['showboxes']);
        this.register('fps', this.cmdFPS.bind(this), 'Toggle FPS counter');
        this.register('debug', this.cmdDebug.bind(this), 'Toggle detailed stats overlay', ['stats']);
        this.register('grid', this.cmdGrid.bind(this), 'Toggle coordinate grid overlay');
        this.register('paths', this.cmdPaths.bind(this), 'Show enemy pathfinding/movement paths');
        
        // Camera
        this.register('zoom', this.cmdZoom.bind(this), 'Set camera zoom level <level>');
        this.register('freecam', this.cmdFreeCam.bind(this), 'Toggle free camera mode (WASD to move)');
        this.register('resetcam', this.cmdResetCam.bind(this), 'Reset camera to default');
        
        // Utility
        this.register('help', this.cmdHelp.bind(this), 'List all available commands or show help for <command>');
        this.register('echo', this.cmdEcho.bind(this), 'Print message to console <message>');
        this.register('reset', this.cmdReset.bind(this), 'Reset all cheats to default state');
        this.register('quit', this.cmdQuit.bind(this), 'Quit to main menu', ['exit', 'menu']);
        
        // Debug commands
        this.register('leaderboard', this.cmdLeaderboard.bind(this), 'Test leaderboard connection', ['lb']);

        // Testing commands
        this.register('test', this.cmdTest.bind(this), 'Run all tests or tests in a category: test [category]');
        this.register('testfast', this.cmdTestFast.bind(this), 'Run quick smoke tests');
        this.register('testverbose', this.cmdTestVerbose.bind(this), 'Run tests with verbose output: testverbose [category]');
        this.register('testlist', this.cmdTestList.bind(this), 'List all available test categories');

        // Shop/points commands
        this.register('points', this.cmdPoints.bind(this), 'Set shop points <amount> or add points: points add <amount>', ['setpoints']);
        this.register('addpoints', this.cmdAddPoints.bind(this), 'Add shop points <amount>');
        this.register('showpoints', this.cmdShowPoints.bind(this), 'Show current shop points balance', ['balance', 'mypoints']);
    }
    
    /**
     * Register a command
     */
    register(name, handler, description, aliases = []) {
        const cmd = { name, handler, description, aliases };
        this.commands.set(name.toLowerCase(), cmd);
        
        // Register aliases
        for (const alias of aliases) {
            this.commands.set(alias.toLowerCase(), cmd);
        }
    }
    
    /**
     * Execute a command
     */
    async execute(commandLine) {
        const parts = commandLine.trim().split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        const cmd = this.commands.get(commandName);
        if (!cmd) {
            return { success: false, message: `Unknown command: ${commandName}. Type 'help' for available commands.` };
        }

        // Check if user wants help for this specific command (e.g., "god help")
        if (args.length === 1 && args[0].toLowerCase() === 'help') {
            return this.getCommandHelp(cmd);
        }

        try {
            const result = cmd.handler(args);
            // Handle async commands
            if (result instanceof Promise) {
                return await result;
            }
            return result;
        } catch (error) {
            return { success: false, message: `Error executing ${commandName}: ${error.message}` };
        }
    }

    /**
     * Get detailed help for a specific command
     */
    getCommandHelp(cmd) {
        let help = `Command: ${cmd.name}\n`;
        help += `Description: ${cmd.description}\n`;
        if (cmd.aliases && cmd.aliases.length > 0) {
            help += `Aliases: ${cmd.aliases.join(', ')}\n`;
        }
        help += `\nUsage: ${cmd.name}`;

        // Add usage hints based on description
        if (cmd.description.includes('<')) {
            const match = cmd.description.match(/<[^>]+>/g);
            if (match) {
                help += ` ${match.join(' ')}`;
            }
        } else if (cmd.description.includes('[')) {
            const match = cmd.description.match(/\[[^\]]+\]/g);
            if (match) {
                help += ` ${match.join(' ')}`;
            }
        }

        return { success: true, message: help };
    }
    
    /**
     * Get all command names for autocomplete
     */
    getCommandNames() {
        const names = new Set();
        for (const [name, cmd] of this.commands.entries()) {
            names.add(cmd.name);
        }
        return Array.from(names).sort();
    }
    
    /**
     * Get suggestions for partial command or arguments
     */
    getSuggestions(partial) {
        const lowerPartial = partial.toLowerCase();
        const parts = lowerPartial.split(/\s+/);

        // If we have a space, check if this is a command that needs argument suggestions
        if (parts.length >= 2) {
            const command = parts[0];
            const argPartial = parts[parts.length - 1];

            // Provide pickup suggestions for spawnpickup command
            if (command === 'spawnpickup') {
                // Show "list" as first suggestion, then pickup IDs
                const suggestions = ['list', ...this.pickupIds];
                if (argPartial.length === 0) {
                    return suggestions.slice(0, 10);  // Show first 10 if no partial
                }
                return suggestions.filter(id => id.startsWith(argPartial)).slice(0, 10);
            }

            // Provide boss type suggestions
            if (command === 'boss' || command === 'spawnboss') {
                const bossTypes = ['shooter', 'charger', 'vortex'];
                if (argPartial.length === 0) {
                    return bossTypes;
                }
                return bossTypes.filter(t => t.startsWith(argPartial));
            }

            // Provide tp landmark suggestions
            if (command === 'tp') {
                const landmarks = ['center', 'spawn', 'topleft', 'topright', 'bottomleft', 'bottomright'];
                if (argPartial.length === 0) {
                    return landmarks;
                }
                return landmarks.filter(l => l.startsWith(argPartial));
            }
        }

        // Default: suggest command names
        return this.getCommandNames().filter(name => name.startsWith(lowerPartial));
    }
    
    // ==================== COMMAND IMPLEMENTATIONS ====================
    
    cmdGodMode(args) {
        this.devMode.godMode = !this.devMode.godMode;
        return { success: true, message: `God mode ${this.devMode.godMode ? 'enabled' : 'disabled'}` };
    }
    
    cmdInstantCD(args) {
        this.devMode.instantCooldowns = !this.devMode.instantCooldowns;
        if (this.devMode.instantCooldowns) {
            // Reset all cooldowns immediately
            this.game.player.qCoolDownElapsed = this.game.player.qCoolDown;
            this.game.player.eCoolDownElapsed = this.game.player.eCoolDown;
            this.game.player.fCoolDownElapsed = this.game.player.fCoolDown;
        }
        return { success: true, message: `Instant cooldowns ${this.devMode.instantCooldowns ? 'enabled' : 'disabled'}` };
    }
    
    cmdDamage(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: damage <multiplier>' };
        }
        const multiplier = parseFloat(args[0]);
        if (isNaN(multiplier) || multiplier < 0) {
            return { success: false, message: 'Invalid multiplier value' };
        }
        this.devMode.damageMultiplier = multiplier;
        return { success: true, message: `Damage multiplier set to ${multiplier}x` };
    }
    
    cmdHeal(args) {
        // This game doesn't have explicit health, but we can interpret this as preventing death
        if (!this.devMode.godMode) {
            this.devMode.godMode = true;
            return { success: true, message: 'God mode enabled (health restored)' };
        }
        return { success: true, message: 'Already at full health (god mode active)' };
    }
    
    cmdMaxMana(args) {
        // Reset all cooldowns
        this.game.player.qCoolDownElapsed = this.game.player.qCoolDown;
        this.game.player.eCoolDownElapsed = this.game.player.eCoolDown;
        this.game.player.fCoolDownElapsed = this.game.player.fCoolDown;
        return { success: true, message: 'All ability cooldowns reset' };
    }
    
    cmdSetHealth(args) {
        // Not applicable in this game (no health system)
        return { success: true, message: 'Health system not implemented (use god mode instead)' };
    }
    
    cmdLevelUp(args) {
        const amount = args.length > 0 ? parseInt(args[0]) : 1;
        if (isNaN(amount) || amount < 1) {
            return { success: false, message: 'Invalid level amount' };
        }
        this.game.enemies.level += amount;
        return { success: true, message: `Leveled up by ${amount} (now level ${this.game.enemies.level})` };
    }
    
    cmdSetLevel(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: setlevel <level>' };
        }
        const level = parseInt(args[0]);
        if (isNaN(level) || level < 0) {
            return { success: false, message: 'Invalid level value' };
        }
        this.game.enemies.level = level;
        return { success: true, message: `Level set to ${level}` };
    }
    
    cmdAddXP(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: addxp <amount>' };
        }
        const amount = parseInt(args[0]);
        if (isNaN(amount)) {
            return { success: false, message: 'Invalid XP amount' };
        }
        this.game.score += amount;
        return { success: true, message: `Added ${amount} score/XP` };
    }
    
    cmdMaxLevel(args) {
        this.game.enemies.level = 100;
        return { success: true, message: 'Level set to maximum (100)' };
    }
    
    cmdTestRoom(args) {
        if (!this.game.testRoom.active) {
            // Enter test room using TestRoom class
            this.game.testRoom.enter();
            this.devMode.inTestRoom = true;
            return { success: true, message: 'Entered test room. Type "testroom" again to return.' };
        } else {
            // Exit test room using TestRoom class
            this.game.testRoom.exit();
            this.devMode.inTestRoom = false;
            return { success: true, message: 'Exited test room and restored game state.' };
        }
    }
    
    async cmdSpawn(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: spawn <type> (types: enemy, boss)' };
        }
        
        const type = args[0].toLowerCase();
        
        if (type === 'enemy') {
            // Dynamically import Enemy class
            try {
                const { Enemy } = await import('../controller/enemy.js');
                const enemy = new Enemy(
                    this.game.player.x + 200,
                    this.game.player.y,
                    this.game.enemies.speed,
                    this.game.enemies.size,
                    this.game.enemies.color
                );
                this.game.enemies.enemiesList.push(enemy);
                return { success: true, message: 'Spawned enemy near player' };
            } catch (error) {
                return { success: false, message: 'Failed to spawn enemy: ' + error.message };
            }
        } else if (type === 'boss') {
            // Use the dedicated boss command
            return this.cmdBoss([]);
        }
        
        return { success: false, message: 'Unknown enemy type. Available: enemy, boss' };
    }
    
    cmdSpawnPickup(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: spawnpickup <type> or spawnpickup list [category]' };
        }

        // Handle "list" command
        if (args[0].toLowerCase() === 'list') {
            return this.listPickups(args.slice(1));
        }

        if (this.game.rewardManager) {
            // Verify pickup type exists
            const pickupId = args[0].toLowerCase();
            const reward = Object.values(REWARDS).find(r => r.id === pickupId);
            if (!reward) {
                return { success: false, message: `Unknown pickup: ${args[0]}. Use 'spawnpickup list' to see available types.` };
            }

            // Spawn reward drop at player position
            this.game.rewardManager.spawnReward(
                this.game.player.x + 100,
                this.game.player.y,
                reward
            );
            return { success: true, message: `Spawned pickup: ${reward.name} (${reward.rarity.name})` };
        }

        return { success: false, message: 'Reward system not available' };
    }

    /**
     * List available pickups, optionally filtered by category
     */
    listPickups(args) {
        const categories = Object.values(CATEGORY);

        // If category specified, filter by it
        if (args.length > 0) {
            const catArg = args[0].toLowerCase();
            const matchedCat = categories.find(c => c === catArg);

            if (!matchedCat) {
                return { success: false, message: `Unknown category: ${args[0]}. Categories: ${categories.join(', ')}` };
            }

            const rewards = Object.values(REWARDS).filter(r => r.category === matchedCat);
            let msg = `Pickups in ${matchedCat}:\n`;
            rewards.forEach(r => {
                msg += `  ${r.id} - ${r.name} (${r.rarity.name})\n`;
            });
            return { success: true, message: msg };
        }

        // List all categories and their pickup counts
        let msg = 'Available pickup categories:\n';
        for (const cat of categories) {
            const count = Object.values(REWARDS).filter(r => r.category === cat).length;
            msg += `  ${cat} (${count} pickups)\n`;
        }
        msg += `\nTotal pickups: ${this.pickupIds.length}\n`;
        msg += 'Use: spawnpickup list <category> to see pickups in a category';
        return { success: true, message: msg };
    }

    async cmdBoss(args) {
        // Exit test room if active
        if (this.game.testRoom && this.game.testRoom.active) {
            this.game.testRoom.exit();
            this.devMode.inTestRoom = false;
        }

        // Clear existing enemies and projectiles for a clean boss fight
        this.game.enemies.enemiesList = [];
        this.game.projectiles.projectilesList = [];

        const bossTypes = ['shooter', 'charger', 'vortex'];

        // Check if a specific boss type was requested
        if (args.length > 0) {
            const requestedType = args[0].toLowerCase();

            if (!bossTypes.includes(requestedType)) {
                return { success: false, message: `Unknown boss type: ${requestedType}. Available: ${bossTypes.join(', ')}` };
            }

            // Spawn specific boss type
            try {
                const spawnX = this.game.width + 150;
                const spawnY = this.game.height / 2;

                if (requestedType === 'shooter') {
                    const { Boss } = await import('../controller/boss.js');
                    this.game.enemies.boss = new Boss(spawnX, spawnY);
                    if (this.game.effects) this.game.effects.addScreenFlash('#ff0000', 500, 0.3);
                } else if (requestedType === 'charger') {
                    const { ChargeBoss } = await import('../controller/chargeBoss.js');
                    this.game.enemies.boss = new ChargeBoss(spawnX, spawnY);
                    if (this.game.effects) this.game.effects.addScreenFlash('#aa00ff', 500, 0.3);
                } else if (requestedType === 'vortex') {
                    const { VortexBoss } = await import('../controller/vortexBoss.js');
                    this.game.enemies.boss = new VortexBoss(spawnX, spawnY);
                    if (this.game.effects) this.game.effects.addScreenFlash('#ff00ff', 500, 0.3);
                }

                this.game.enemies.bossActive = true;
                if (this.game.world) this.game.world.shake(15, 30);
                if (window.gameSound) window.gameSound.playBossWarning();

                return { success: true, message: `Spawned ${requestedType} boss!` };
            } catch (error) {
                return { success: false, message: 'Failed to spawn boss: ' + error.message };
            }
        }

        // No type specified - spawn random boss
        this.game.enemies.spawnBoss(this.game);
        return { success: true, message: 'Spawned random boss!' };
    }

    cmdClear(args) {
        this.game.enemies.enemiesList = [];
        this.game.projectiles.projectilesList = [];
        this.game.bullets.bulletsList = [];
        this.game.voidBolts.reset();
        if (this.game.enemies.bossActive) {
            this.game.enemies.bossActive = false;
            this.game.enemies.boss = null;
        }
        return { success: true, message: 'Cleared all enemies and projectiles' };
    }
    
    cmdClearProjectiles(args) {
        this.game.projectiles.projectilesList = [];
        this.game.bullets.bulletsList = [];
        this.game.voidBolts.reset();
        return { success: true, message: 'Cleared all projectiles' };
    }
    
    cmdSpeed(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: speed <multiplier>' };
        }
        const multiplier = parseFloat(args[0]);
        if (isNaN(multiplier) || multiplier <= 0) {
            return { success: false, message: 'Invalid speed multiplier' };
        }
        this.devMode.speedMultiplier = multiplier;
        this.game.player.speed = this.game.player.baseSpeed * multiplier;
        return { success: true, message: `Speed multiplier set to ${multiplier}x` };
    }
    
    cmdTeleport(args) {
        if (args.length < 2) {
            return { success: false, message: 'Usage: teleport <x> <y>' };
        }
        const x = parseFloat(args[0]);
        const y = parseFloat(args[1]);
        if (isNaN(x) || isNaN(y)) {
            return { success: false, message: 'Invalid coordinates' };
        }
        this.game.player.x = x;
        this.game.player.y = y;
        this.game.player.desiredX = x;
        this.game.player.desiredY = y;
        return { success: true, message: `Teleported to (${x}, ${y})` };
    }
    
    cmdTP(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: tp <landmark> (center, spawn, topleft, topright, bottomleft, bottomright)' };
        }
        
        const landmark = args[0].toLowerCase();
        let x, y;
        
        switch (landmark) {
            case 'center':
            case 'spawn':
                x = this.game.width / 2;
                y = this.game.height / 2;
                break;
            case 'topleft':
                x = 100;
                y = 100;
                break;
            case 'topright':
                x = this.game.width - 100;
                y = 100;
                break;
            case 'bottomleft':
                x = 100;
                y = this.game.height - 100;
                break;
            case 'bottomright':
                x = this.game.width - 100;
                y = this.game.height - 100;
                break;
            default:
                return { success: false, message: 'Unknown landmark' };
        }
        
        this.game.player.x = x;
        this.game.player.y = y;
        this.game.player.desiredX = x;
        this.game.player.desiredY = y;
        return { success: true, message: `Teleported to ${landmark}` };
    }
    
    cmdNoclip(args) {
        this.devMode.noclip = !this.devMode.noclip;
        return { success: true, message: `Noclip ${this.devMode.noclip ? 'enabled' : 'disabled'}` };
    }
    
    cmdTimescale(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: timescale <value> (0.1-10.0)' };
        }
        const value = parseFloat(args[0]);
        if (isNaN(value) || value < 0.1 || value > 10.0) {
            return { success: false, message: 'Timescale must be between 0.1 and 10.0' };
        }
        this.devMode.timescale = value;
        this.game.logic_fps = 60 * value;
        return { success: true, message: `Timescale set to ${value}x` };
    }
    
    cmdPause(args) {
        if (this.game.pauseMenu) {
            this.game.pauseMenu.toggle();
            return { success: true, message: this.game.pauseMenu.isPaused ? 'Game paused' : 'Game unpaused' };
        }
        return { success: false, message: 'Pause system not available' };
    }
    
    cmdStep(args) {
        const frames = args.length > 0 ? parseInt(args[0]) : 1;
        if (isNaN(frames) || frames < 1) {
            return { success: false, message: 'Invalid frame count' };
        }
        
        // Step through frames (this is a simplified implementation)
        for (let i = 0; i < frames; i++) {
            this.game.update();
        }
        return { success: true, message: `Advanced ${frames} frame(s)` };
    }
    
    cmdHitboxes(args) {
        this.devMode.showHitboxes = !this.devMode.showHitboxes;
        return { success: true, message: `Hitbox visualization ${this.devMode.showHitboxes ? 'enabled' : 'disabled'}` };
    }
    
    cmdFPS(args) {
        this.devMode.showFPS = !this.devMode.showFPS;
        return { success: true, message: `FPS counter ${this.devMode.showFPS ? 'enabled' : 'disabled'}` };
    }
    
    cmdDebug(args) {
        this.devMode.showStats = !this.devMode.showStats;
        return { success: true, message: `Stats overlay ${this.devMode.showStats ? 'enabled' : 'disabled'}` };
    }
    
    cmdGrid(args) {
        this.devMode.showGrid = !this.devMode.showGrid;
        return { success: true, message: `Grid overlay ${this.devMode.showGrid ? 'enabled' : 'disabled'}` };
    }
    
    cmdPaths(args) {
        this.devMode.showPaths = !this.devMode.showPaths;
        return { success: true, message: `Enemy path visualization ${this.devMode.showPaths ? 'enabled' : 'disabled'}` };
    }
    
    cmdZoom(args) {
        if (args.length === 0) {
            return { success: false, message: 'Usage: zoom <level>' };
        }
        const zoom = parseFloat(args[0]);
        if (isNaN(zoom) || zoom <= 0) {
            return { success: false, message: 'Invalid zoom level' };
        }
        this.devMode.zoom = zoom;
        return { success: true, message: `Zoom set to ${zoom}x` };
    }
    
    cmdFreeCam(args) {
        this.devMode.freeCam = !this.devMode.freeCam;
        return { success: true, message: `Free camera ${this.devMode.freeCam ? 'enabled' : 'disabled'}. Use WASD to move camera.` };
    }
    
    cmdResetCam(args) {
        this.devMode.freeCam = false;
        this.devMode.zoom = 1.0;
        this.devMode.cameraX = 0;
        this.devMode.cameraY = 0;
        return { success: true, message: 'Camera reset to default' };
    }
    
    cmdHelp(args) {
        if (args.length > 0) {
            // Show help for specific command
            const cmdName = args[0].toLowerCase();
            const cmd = this.commands.get(cmdName);
            if (!cmd) {
                return { success: false, message: `Unknown command: ${cmdName}` };
            }
            
            let help = `${cmd.name}: ${cmd.description}`;
            if (cmd.aliases.length > 0) {
                help += `\nAliases: ${cmd.aliases.join(', ')}`;
            }
            return { success: true, message: help };
        }
        
        // List all commands
        const commandList = this.getCommandNames();
        let help = 'Available commands:\n';
        for (const name of commandList) {
            const cmd = this.commands.get(name);
            help += `  ${name} - ${cmd.description}\n`;
        }
        help += '\nType "help <command>" for more info on a specific command.';
        return { success: true, message: help };
    }
    
    cmdEcho(args) {
        const message = args.join(' ');
        return { success: true, message: message || '(empty message)' };
    }
    
    cmdReset(args) {
        this.devMode.resetAllCheats();

        // Also reset player speed
        this.game.player.speed = this.game.player.baseSpeed;
        this.game.logic_fps = 60;

        return { success: true, message: 'All cheats reset to default state' };
    }

    cmdQuit(args) {
        // Exit test room if active (without restoring state)
        if (this.game.testRoom && this.game.testRoom.active) {
            this.game.testRoom.active = false;
            this.game.testRoom.dummies = [];
            this.game.testRoom.pickupGrid = [];
            this.game.testRoom.savedState = null;
            this.devMode.inTestRoom = false;
        }

        // Quit to main menu
        this.game.gameOver = true;
        this.game.score = 0;
        this.game.showMessage = 'None';
        this.game.player.reset(this.game);
        this.game.projectiles.reset();
        this.game.bullets.reset();
        this.game.voidBolts.reset();
        this.game.enemies.reset();
        this.game.effects.reset();
        this.game.world.reset();
        this.game.rewardManager.reset();

        // Close debug console
        if (this.game.debugConsole) {
            this.game.debugConsole.visible = false;
        }

        // Switch to menu music
        if (window.gameSound) {
            window.gameSound.playMenuMusic();
        }

        return { success: true, message: 'Returning to main menu...' };
    }

    async cmdTest(args) {
        try {
            const { globalTestRunner } = await import('../testing/testRunner.js');
            const { registerInGameTests } = await import('../testing/inGameTests.js');
            
            // Register tests if not already done
            registerInGameTests(this.game);
            
            if (args.length === 0) {
                const report = await globalTestRunner.runTests({});
                return { success: true, message: globalTestRunner.formatReport(report) };
            } else {
                const category = args[0];
                const report = await globalTestRunner.runTests({ category });
                return { success: true, message: globalTestRunner.formatReport(report) };
            }
        } catch (error) {
            return { success: false, message: 'Test system not available: ' + error.message };
        }
    }
    
    async cmdTestFast(args) {
        try {
            const { globalTestRunner } = await import('../testing/testRunner.js');
            const { registerInGameTests } = await import('../testing/inGameTests.js');
            
            // Register tests if not already done
            registerInGameTests(this.game);
            
            const report = await globalTestRunner.runTests({ tags: ['smoke'] });
            return { success: true, message: `Smoke tests: ${report.passed}/${report.totalTests} passed (${report.successRate}%)` };
        } catch (error) {
            return { success: false, message: 'Test system not available: ' + error.message };
        }
    }
    
    async cmdTestVerbose(args) {
        try {
            const { globalTestRunner } = await import('../testing/testRunner.js');
            const { registerInGameTests } = await import('../testing/inGameTests.js');
            
            // Register tests if not already done
            registerInGameTests(this.game);
            
            const filter = args.length > 0 ? { category: args[0] } : {};
            const report = await globalTestRunner.runTests(filter);
            return { success: true, message: globalTestRunner.formatReport(report) };
        } catch (error) {
            return { success: false, message: 'Test system not available: ' + error.message };
        }
    }
    
    async cmdTestList(args) {
        try {
            const { globalTestRunner } = await import('../testing/testRunner.js');
            const categories = globalTestRunner.getCategories();
            if (categories.length === 0) {
                return { success: true, message: 'No test categories available. Use test or testfast to run tests.' };
            }
            return { success: true, message: 'Available test categories: ' + categories.join(', ') };
        } catch (error) {
            return { success: false, message: 'Test system not available: ' + error.message };
        }
    }

    cmdPoints(args) {
        if (!this.game.shopMenu) {
            return { success: false, message: 'Shop system not available' };
        }

        if (args.length === 0) {
            return { success: true, message: `Current points: ${this.game.shopMenu.playerPoints.toLocaleString()}` };
        }

        // Handle "points add <amount>" syntax
        if (args[0].toLowerCase() === 'add') {
            return this.cmdAddPoints(args.slice(1));
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 0) {
            return { success: false, message: 'Invalid amount. Usage: points <amount>' };
        }

        this.game.shopMenu.playerPoints = amount;
        return { success: true, message: `Points set to ${amount.toLocaleString()}` };
    }

    cmdAddPoints(args) {
        if (!this.game.shopMenu) {
            return { success: false, message: 'Shop system not available' };
        }

        if (args.length === 0) {
            return { success: false, message: 'Usage: addpoints <amount>' };
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount)) {
            return { success: false, message: 'Invalid amount. Usage: addpoints <amount>' };
        }

        const oldPoints = this.game.shopMenu.playerPoints;
        this.game.shopMenu.playerPoints += amount;
        const newPoints = this.game.shopMenu.playerPoints;

        if (amount >= 0) {
            return { success: true, message: `Added ${amount.toLocaleString()} points (${oldPoints.toLocaleString()} → ${newPoints.toLocaleString()})` };
        } else {
            return { success: true, message: `Removed ${Math.abs(amount).toLocaleString()} points (${oldPoints.toLocaleString()} → ${newPoints.toLocaleString()})` };
        }
    }

    async cmdShowPoints(args) {
        if (!this.game.supabase || !this.game.playerName) {
            return { success: false, message: 'Not logged in' };
        }

        try {
            const data = await this.game.supabase.getShopData(this.game.playerName);
            if (data.error) {
                return { success: false, message: `Error: ${data.error}` };
            }
            const points = data.points || 0;
            // Also update shopMenu if available
            if (this.game.shopMenu) {
                this.game.shopMenu.setShopData(data);
            }
            return { success: true, message: `Current points: ${points.toLocaleString()}` };
        } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    async cmdLeaderboard(args) {
        try {
            const { SupabaseLeaderboard } = await import('../supabase/supabase.js');
            const supabase = new SupabaseLeaderboard();

            // Test with EASY difficulty
            const testDifficulty = args.length > 0 ? args[0].toUpperCase() : 'EASY';
            const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
            if (!validDifficulties.includes(testDifficulty)) {
                return { success: false, message: `Invalid difficulty. Valid: ${validDifficulties.join(', ')}` };
            }

            const startTime = performance.now();
            const result = await supabase.getLeaderboard(testDifficulty, 5, 1, false);
            const elapsed = (performance.now() - startTime).toFixed(0);

            if (result.entries && result.entries.length > 0) {
                let msg = `Leaderboard OK (${elapsed}ms)\n`;
                msg += `Difficulty: ${testDifficulty}\n`;
                msg += `Total entries: ${result.pagination.totalEntries}\n`;
                msg += `Top ${result.entries.length} players:\n`;
                result.entries.forEach((e, i) => {
                    msg += `  ${i + 1}. ${e.player_name}: ${e.score}\n`;
                });
                return { success: true, message: msg };
            } else {
                return { success: true, message: `Leaderboard OK (${elapsed}ms) - No entries for ${testDifficulty}. Total: ${result.pagination?.totalEntries || 0}` };
            }
        } catch (error) {
            return { success: false, message: `Leaderboard error: ${error.message}` };
        }
    }
}
