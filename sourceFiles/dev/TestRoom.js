import { REWARDS } from '../controller/rewardTypes.js';
import { ChainBolt } from '../controller/specialBullet.js';

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
        
        // Pickup constants
        this.PICKUP_COLLECTION_RADIUS = 25;  // Tighter collection for smaller pickups
        this.PICKUP_RESPAWN_DELAY_MS = 3000;
        
        // Pickup respawn timers
        this.respawnTimers = [];
        
        // Dummy respawn tracking
        this.dummyRespawnTimers = [];

        // Chain bolts for test room (to handle recursive bouncing properly)
        this.chainBolts = [];

        // Saved game state
        this.savedState = null;
        
        // Pickup type to reward ID mapping
        this.pickupTypeToRewardId = {
            // Cooldowns
            'q_cooldown': 'Q_CD_COMMON',
            'e_cooldown': 'E_CD_COMMON',
            'f_cooldown': 'F_CD_COMMON',
            // Survivability
            'life': 'EXTRA_LIFE_RARE',
            'shield': 'SHIELD_COMMON',
            'shrink': 'SHRINK_COMMON',
            // Movement
            'speed': 'SPEED_COMMON',
            'dash': 'DASH_DISTANCE_COMMON',
            'ghost': 'GHOST_COMMON',
            // Offense
            'score': 'SCORE_MULT_COMMON',
            'bullet_size': 'BULLET_SIZE_COMMON',
            'range': 'RANGE_COMMON',
            'aura': 'DAMAGE_AURA_COMMON',
            // Guns (legacy mappings)
            'shotgun_common': 'SHOTGUN_COMMON',
            'rapidfire_uncommon': 'RAPIDFIRE_UNCOMMON',
            'piercing_rare': 'PIERCING_RARE',
            'ricochet_uncommon': 'RICOCHET_UNCOMMON',
            'homing_rare': 'HOMING_RARE',
            'twin_common': 'TWIN_COMMON',
            'nova_epic': 'NOVA_EPIC',
            'chain_epic': 'CHAIN_EPIC'
        };

        // Selected rarity for gun pickups (null = use default rarity)
        this.selectedRarity = null;

        // Rarity options for selector
        this.rarityOptions = [
            { key: 'default', name: 'Default', color: '#ffffff' },
            { key: 'COMMON', name: 'Common', color: '#9d9d9d' },
            { key: 'UNCOMMON', name: 'Uncommon', color: '#1eff00' },
            { key: 'RARE', name: 'Rare', color: '#0070dd' },
            { key: 'EPIC', name: 'Epic', color: '#a335ee' },
            { key: 'LEGENDARY', name: 'Legendary', color: '#ff8000' },
            { key: 'STIER', name: 'S-Tier', color: '#ff0000' }
        ];

        // Gun type to rarity variants mapping (ALL rarities for ALL guns)
        this.gunRarityVariants = {
            'shotgun': {
                COMMON: 'SHOTGUN_COMMON', UNCOMMON: 'SHOTGUN_UNCOMMON', RARE: 'SHOTGUN_RARE',
                EPIC: 'SHOTGUN_EPIC', LEGENDARY: 'SHOTGUN_LEGENDARY', STIER: 'SHOTGUN_STIER'
            },
            'rapidfire': {
                COMMON: 'RAPIDFIRE_COMMON', UNCOMMON: 'RAPIDFIRE_UNCOMMON', RARE: 'RAPIDFIRE_RARE',
                EPIC: 'RAPIDFIRE_EPIC', LEGENDARY: 'RAPIDFIRE_LEGENDARY', STIER: 'RAPIDFIRE_STIER'
            },
            'piercing': {
                COMMON: 'PIERCING_COMMON', UNCOMMON: 'PIERCING_UNCOMMON', RARE: 'PIERCING_RARE',
                EPIC: 'PIERCING_EPIC', LEGENDARY: 'PIERCING_LEGENDARY', STIER: 'PIERCING_STIER'
            },
            'ricochet': {
                COMMON: 'RICOCHET_COMMON', UNCOMMON: 'RICOCHET_UNCOMMON', RARE: 'RICOCHET_RARE',
                EPIC: 'RICOCHET_EPIC', LEGENDARY: 'RICOCHET_LEGENDARY', STIER: 'RICOCHET_STIER'
            },
            'homing': {
                COMMON: 'HOMING_COMMON', UNCOMMON: 'HOMING_UNCOMMON', RARE: 'HOMING_RARE',
                EPIC: 'HOMING_EPIC', LEGENDARY: 'HOMING_LEGENDARY', STIER: 'HOMING_STIER'
            },
            'twin': {
                COMMON: 'TWIN_COMMON', UNCOMMON: 'TWIN_UNCOMMON', RARE: 'TWIN_RARE',
                EPIC: 'TWIN_EPIC', LEGENDARY: 'TWIN_LEGENDARY', STIER: 'TWIN_STIER'
            },
            'nova': {
                COMMON: 'NOVA_COMMON', UNCOMMON: 'NOVA_UNCOMMON', RARE: 'NOVA_RARE',
                EPIC: 'NOVA_EPIC', LEGENDARY: 'NOVA_LEGENDARY', STIER: 'NOVA_STIER'
            },
            'chain': {
                COMMON: 'CHAIN_COMMON', UNCOMMON: 'CHAIN_UNCOMMON', RARE: 'CHAIN_RARE',
                EPIC: 'CHAIN_EPIC', LEGENDARY: 'CHAIN_LEGENDARY', STIER: 'CHAIN_STIER'
            }
        };

        // Non-gun pickup rarity variants (ALL rarities for ALL non-gun pickups)
        this.pickupRarityVariants = {
            // Cooldowns
            'q_cooldown': {
                COMMON: 'Q_CD_COMMON', UNCOMMON: 'Q_CD_UNCOMMON', RARE: 'Q_CD_RARE',
                EPIC: 'Q_CD_EPIC', LEGENDARY: 'Q_CD_LEGENDARY', STIER: 'Q_CD_STIER'
            },
            'e_cooldown': {
                COMMON: 'E_CD_COMMON', UNCOMMON: 'E_CD_UNCOMMON', RARE: 'E_CD_RARE',
                EPIC: 'E_CD_EPIC', LEGENDARY: 'E_CD_LEGENDARY', STIER: 'E_CD_STIER'
            },
            'f_cooldown': {
                COMMON: 'F_CD_COMMON', UNCOMMON: 'F_CD_UNCOMMON', RARE: 'F_CD_RARE',
                EPIC: 'F_CD_EPIC', LEGENDARY: 'F_CD_LEGENDARY', STIER: 'F_CD_STIER'
            },
            // Survivability
            'life': {
                RARE: 'EXTRA_LIFE_RARE', LEGENDARY: 'EXTRA_LIFE_LEGENDARY', STIER: 'EXTRA_LIFE_STIER'
            },
            'shield': {
                COMMON: 'SHIELD_COMMON', UNCOMMON: 'SHIELD_UNCOMMON', RARE: 'SHIELD_RARE',
                EPIC: 'SHIELD_EPIC', LEGENDARY: 'SHIELD_LEGENDARY', STIER: 'SHIELD_STIER'
            },
            'shrink': {
                COMMON: 'SHRINK_COMMON', UNCOMMON: 'SHRINK_UNCOMMON', RARE: 'SHRINK_RARE',
                EPIC: 'SHRINK_EPIC', LEGENDARY: 'SHRINK_LEGENDARY', STIER: 'SHRINK_STIER'
            },
            // Movement
            'speed': {
                COMMON: 'SPEED_COMMON', UNCOMMON: 'SPEED_UNCOMMON', RARE: 'SPEED_RARE',
                EPIC: 'SPEED_EPIC', LEGENDARY: 'SPEED_LEGENDARY', STIER: 'SPEED_STIER'
            },
            'dash': {
                COMMON: 'DASH_DISTANCE_COMMON', UNCOMMON: 'DASH_DISTANCE_UNCOMMON', RARE: 'DASH_DISTANCE_RARE',
                EPIC: 'DASH_DISTANCE_EPIC', LEGENDARY: 'DASH_DISTANCE_LEGENDARY', STIER: 'DASH_DISTANCE_STIER'
            },
            'ghost': {
                COMMON: 'GHOST_COMMON', UNCOMMON: 'GHOST_UNCOMMON', RARE: 'GHOST_RARE',
                EPIC: 'GHOST_EPIC', LEGENDARY: 'GHOST_LEGENDARY', STIER: 'GHOST_STIER'
            },
            // Offense
            'score': {
                COMMON: 'SCORE_MULT_COMMON', UNCOMMON: 'SCORE_MULT_UNCOMMON', RARE: 'SCORE_MULT_RARE',
                EPIC: 'SCORE_MULT_EPIC', LEGENDARY: 'SCORE_MULT_LEGENDARY', STIER: 'SCORE_MULT_STIER'
            },
            'bullet_size': {
                COMMON: 'BULLET_SIZE_COMMON', UNCOMMON: 'BULLET_SIZE_UNCOMMON', RARE: 'BULLET_SIZE_RARE',
                EPIC: 'BULLET_SIZE_EPIC', LEGENDARY: 'BULLET_SIZE_LEGENDARY', STIER: 'BULLET_SIZE_STIER'
            },
            'range': {
                COMMON: 'RANGE_COMMON', UNCOMMON: 'RANGE_UNCOMMON', RARE: 'RANGE_RARE',
                EPIC: 'RANGE_EPIC', LEGENDARY: 'RANGE_LEGENDARY', STIER: 'RANGE_STIER'
            },
            'aura': {
                COMMON: 'DAMAGE_AURA_COMMON', UNCOMMON: 'DAMAGE_AURA_UNCOMMON', RARE: 'DAMAGE_AURA_RARE',
                EPIC: 'DAMAGE_AURA_EPIC', LEGENDARY: 'DAMAGE_AURA_LEGENDARY', STIER: 'DAMAGE_AURA_STIER'
            }
        };
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
        this.chainBolts = [];

        // Clear all respawn timers to prevent memory leaks
        for (const timerId of this.respawnTimers) {
            clearTimeout(timerId);
        }
        this.respawnTimers = [];
        
        // Clear dummy respawn timers
        for (const timerId of this.dummyRespawnTimers) {
            clearTimeout(timerId);
        }
        this.dummyRespawnTimers = [];
        
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
            dead: false,
            respawnTime: 0,
            takeDamage(amount) {
                if (!this.dead) {
                    this.hp = Math.max(0, this.hp - amount);
                    if (this.hp === 0) {
                        this.dead = true;
                    }
                }
            },
            reset() {
                this.hp = this.maxHp;
                this.x = this.startX;
                this.y = this.startY;
                this.dead = false;
                this.respawnTime = 0;
            },
            respawn() {
                this.hp = this.maxHp;
                this.dead = false;
                this.respawnTime = 0;
            }
        };
    }
    
    /**
     * Setup pickup grid
     */
    setupPickupGrid() {
        this.pickupGrid = [];
        const spacing = 110;  // Good spacing for navigation

        // COOLDOWN pickups (top-left section) - pushed further left
        const cdStartX = 100;
        const cdStartY = this.game.height / 2 - 100;
        const cooldownTypes = [
            { type: 'q_cooldown', label: 'Q CD', color: '#ffff00', category: 'cooldown' },
            { type: 'e_cooldown', label: 'E CD', color: '#ff8800', category: 'cooldown' },
            { type: 'f_cooldown', label: 'F CD', color: '#ff00ff', category: 'cooldown' }
        ];

        for (let i = 0; i < cooldownTypes.length; i++) {
            const pickup = cooldownTypes[i];
            this.pickupGrid.push({
                x: cdStartX + i * spacing,
                y: cdStartY,
                type: pickup.type,
                label: pickup.label,
                color: pickup.color,
                size: 18,  // Smaller size for easier navigation
                category: pickup.category
            });
        }

        // SURVIVABILITY pickups (middle-left section)
        const survStartX = 100;
        const survStartY = this.game.height / 2 + 30;
        const survTypes = [
            { type: 'life', label: 'Life', color: '#ff4444', category: 'survivability' },
            { type: 'shield', label: 'Shield', color: '#4488ff', category: 'survivability' },
            { type: 'shrink', label: 'Shrink', color: '#88ff88', category: 'survivability' }
        ];

        for (let i = 0; i < survTypes.length; i++) {
            const pickup = survTypes[i];
            this.pickupGrid.push({
                x: survStartX + i * spacing,
                y: survStartY,
                type: pickup.type,
                label: pickup.label,
                color: pickup.color,
                size: 18,
                category: pickup.category
            });
        }

        // MOVEMENT pickups (bottom-left section)
        const moveStartX = 100;
        const moveStartY = this.game.height / 2 + 160;
        const moveTypes = [
            { type: 'speed', label: 'Speed', color: '#00ff88', category: 'movement' },
            { type: 'dash', label: 'Dash', color: '#00ffff', category: 'movement' },
            { type: 'ghost', label: 'Ghost', color: '#aa88ff', category: 'movement' }
        ];

        for (let i = 0; i < moveTypes.length; i++) {
            const pickup = moveTypes[i];
            this.pickupGrid.push({
                x: moveStartX + i * spacing,
                y: moveStartY,
                type: pickup.type,
                label: pickup.label,
                color: pickup.color,
                size: 18,
                category: pickup.category
            });
        }

        // OFFENSE pickups (far-left section, below movement)
        const offStartX = 100;
        const offStartY = this.game.height / 2 + 290;
        const offTypes = [
            { type: 'score', label: 'Score', color: '#ffcc00', category: 'offense' },
            { type: 'bullet_size', label: 'Bullet', color: '#ff6600', category: 'offense' },
            { type: 'range', label: 'Range', color: '#00aaff', category: 'offense' },
            { type: 'aura', label: 'Aura', color: '#ff0066', category: 'offense' }
        ];

        for (let i = 0; i < offTypes.length; i++) {
            const pickup = offTypes[i];
            this.pickupGrid.push({
                x: offStartX + i * spacing,
                y: offStartY,
                type: pickup.type,
                label: pickup.label,
                color: pickup.color,
                size: 18,
                category: pickup.category
            });
        }
        
        // Create gun upgrade pickups (right side)
        const gunStartX = this.game.width - 470;
        const gunStartY = this.game.height / 2;
        const gunSpacing = 110;

        const gunTypes = [
            { type: 'shotgun_common', label: 'Shotgun', color: '#9d9d9d', gunType: 'shotgun' },
            { type: 'rapidfire_uncommon', label: 'Rapid\nFire', color: '#1eff00', gunType: 'rapidfire' },
            { type: 'piercing_rare', label: 'Piercing', color: '#0070dd', gunType: 'piercing' },
            { type: 'ricochet_uncommon', label: 'Ricochet', color: '#1eff00', gunType: 'ricochet' },
            { type: 'homing_rare', label: 'Homing', color: '#0070dd', gunType: 'homing' },
            { type: 'twin_common', label: 'Twin\nShot', color: '#9d9d9d', gunType: 'twin' },
            { type: 'nova_epic', label: 'Nova', color: '#a335ee', gunType: 'nova' },
            { type: 'chain_epic', label: 'Chain\nLightning', color: '#a335ee', gunType: 'chain' }
        ];

        for (let i = 0; i < gunTypes.length; i++) {
            const gun = gunTypes[i];
            this.pickupGrid.push({
                x: gunStartX + (i % 4) * gunSpacing,
                y: gunStartY + Math.floor(i / 4) * gunSpacing,
                type: gun.type,
                label: gun.label,
                color: gun.color,
                size: 30,
                isGun: true,
                gunType: gun.gunType
            });
        }

        // Create rarity selector pickups (bottom center - lowered to avoid spawn)
        const rarityStartX = this.game.width / 2 - 300;
        const rarityStartY = this.game.height - 100;
        const raritySpacing = 100;

        for (let i = 0; i < this.rarityOptions.length; i++) {
            const rarity = this.rarityOptions[i];
            this.pickupGrid.push({
                x: rarityStartX + i * raritySpacing,
                y: rarityStartY,
                type: `rarity_${rarity.key}`,
                label: rarity.name,
                color: rarity.color,
                size: 25,
                isRaritySelector: true,
                rarityKey: rarity.key
            });
        }
    }
    
    /**
     * Update test room
     */
    update() {
        if (!this.active) return;

        // Check for R key press to reset dummies
        if (this.game.input.buttons.includes('r')) {
            this.handleResetKey();
        }

        // Update moving dummies
        for (const dummy of this.dummies) {
            if (dummy.moving && !dummy.dead) {
                dummy.moveAngle += dummy.moveSpeed;
                dummy.x = dummy.startX + Math.cos(dummy.moveAngle) * dummy.moveRadius;
                dummy.y = dummy.startY + Math.sin(dummy.moveAngle) * dummy.moveRadius;
            }

            // Check collisions with bullets (only if not dead)
            if (!dummy.dead) {
                this.checkBulletCollisions(dummy);
            }

            // Check if dummy should respawn
            if (dummy.dead && dummy.respawnTime > 0 && performance.now() >= dummy.respawnTime) {
                dummy.respawn();
            }
        }

        // Update homing bullets to track dummies
        this.updateHomingBullets();

        // Update chain bolts and handle recursive bouncing
        this.updateChainBolts();

        // Check pickup collisions
        this.checkPickupCollisions();
    }

    /**
     * Update chain bolts and handle recursive bouncing for test room
     */
    updateChainBolts() {
        const aliveDummies = this.dummies.filter(d => !d.dead);

        for (let i = this.chainBolts.length - 1; i >= 0; i--) {
            const bolt = this.chainBolts[i];
            bolt.update();

            // Check for recursive chain spawning
            if (bolt.needsRecursiveChain && bolt.recursiveDepth < bolt.maxRecursiveBounces) {
                // Create recursive chains to nearby dummies
                const chainRange = (bolt.gunData.chainRange || 150) * window.innerWidth / 2560;
                const targets = [];

                for (const dummy of aliveDummies) {
                    // Skip already-hit dummies
                    if (bolt.hitEnemies && bolt.hitEnemies.has(dummy)) continue;

                    const dx = dummy.x - bolt.targetEnemy.x;
                    const dy = dummy.y - bolt.targetEnemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist <= chainRange) {
                        targets.push({ dummy, dist });
                    }
                }

                // Sort by distance and chain to closest
                targets.sort((a, b) => a.dist - b.dist);
                const chainCount = bolt.gunData.chainCount || 1;
                const toChain = Math.min(chainCount, targets.length);

                for (let j = 0; j < toChain; j++) {
                    const target = targets[j].dummy;

                    // Create new chain bolt
                    const newBolt = new ChainBolt(
                        bolt.targetEnemy.x,
                        bolt.targetEnemy.y,
                        target,
                        bolt.gunData,
                        bolt.recursiveDepth + 1,
                        bolt.hitEnemies
                    );
                    this.chainBolts.push(newBolt);

                    // Deal damage to chained dummy
                    const damage = this.game.devMode ? 100 * this.game.devMode.damageMultiplier : 100;
                    target.takeDamage(damage);

                    // Visual effect
                    if (this.game.effects) {
                        this.game.effects.spawnBurst(target.x, target.y, 'enemyDeath');
                    }

                    // Check if target died
                    if (target.dead && target.respawnTime === 0) {
                        target.respawnTime = performance.now() + 3000;
                    }
                }

                bolt.needsRecursiveChain = false;
            }

            if (bolt.expired) {
                this.chainBolts.splice(i, 1);
            }
        }
    }

    /**
     * Update homing bullets to track test room dummies
     */
    updateHomingBullets() {
        const bulletsList = this.game.bullets.bulletsList;
        const aliveDummies = this.dummies.filter(d => !d.dead);

        for (const bullet of bulletsList) {
            if (bullet.isHoming && aliveDummies.length > 0) {
                // Find closest dummy
                let closestDist = Infinity;
                let closestDummy = null;

                for (const dummy of aliveDummies) {
                    // Skip already pierced dummies
                    if (bullet.piercedEnemies && bullet.piercedEnemies.has(dummy)) continue;
                    if (bullet.piercedDummies && bullet.piercedDummies.has(dummy)) continue;

                    const dx = dummy.x - bullet.x;
                    const dy = dummy.y - bullet.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < closestDist) {
                        closestDist = dist;
                        closestDummy = dummy;
                    }
                }

                if (closestDummy) {
                    // Turn towards dummy
                    const targetAngle = Math.atan2(closestDummy.y - bullet.y, closestDummy.x - bullet.x);
                    let angleDiff = targetAngle - bullet.angle;

                    // Normalize angle difference
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                    // Apply turn
                    const turnSpeed = bullet.turnSpeed || 0.03;
                    if (Math.abs(angleDiff) < turnSpeed) {
                        bullet.angle = targetAngle;
                    } else {
                        bullet.angle += Math.sign(angleDiff) * turnSpeed;
                    }

                    // Update direction
                    bullet.dirX = Math.cos(bullet.angle);
                    bullet.dirY = Math.sin(bullet.angle);
                }
            }
        }
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

            // Skip if this bullet already hit this dummy (for piercing)
            if (bullet.piercedDummies && bullet.piercedDummies.has(dummy)) {
                continue;
            }

            const dx = bullet.x - dummy.x;
            const dy = bullet.y - dummy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < dummy.size + (bullet.size || 8)) {
                // Hit!
                const damage = this.game.devMode ?
                    100 * this.game.devMode.damageMultiplier : 100;
                dummy.takeDamage(damage);

                // Visual effect
                if (this.game.effects) {
                    this.game.effects.spawnBurst(bullet.x, bullet.y, 'enemyDeath');
                }

                // Handle chain lightning
                if (bullet.chainsRemaining && bullet.chainsRemaining > 0) {
                    this.triggerChainLightning(dummy, bullet);
                }

                // Check if bullet should pierce through
                if (bullet.pierceCount && bullet.pierceCount > 0) {
                    bullet.pierceCount--;
                    // Track which dummies this bullet has hit
                    if (!bullet.piercedDummies) {
                        bullet.piercedDummies = new Set();
                    }
                    bullet.piercedDummies.add(dummy);
                    // Don't remove the bullet - it pierces through
                } else {
                    // Remove bullet (no pierce or out of pierce)
                    bulletsList.splice(i, 1);
                }

                // Check if dummy died
                if (dummy.dead && dummy.respawnTime === 0) {
                    // Set respawn time (3 seconds from now)
                    dummy.respawnTime = performance.now() + 3000;

                    // Create enhanced death effect
                    if (this.game.effects) {
                        this.game.effects.spawnBurst(dummy.x, dummy.y, 'enemyDeath');
                        this.game.effects.spawnBurst(dummy.x, dummy.y, 'enemyDeath');
                    }
                }
            }
        }
    }

    /**
     * Trigger chain lightning from a hit dummy to nearby dummies
     */
    triggerChainLightning(hitDummy, bullet) {
        const chainRange = bullet.chainRange || 350;
        const aliveDummies = this.dummies.filter(d => !d.dead && d !== hitDummy);

        // Create a shared set for tracking hit targets across recursive bounces
        const hitEnemies = new Set();
        hitEnemies.add(hitDummy);

        // Find nearby dummies within chain range
        const chainTargets = [];
        for (const dummy of aliveDummies) {
            // Skip already hit dummies
            if (bullet.piercedDummies && bullet.piercedDummies.has(dummy)) continue;

            const dx = dummy.x - hitDummy.x;
            const dy = dummy.y - hitDummy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= chainRange) {
                chainTargets.push({ dummy, dist });
            }
        }

        // Sort by distance
        chainTargets.sort((a, b) => a.dist - b.dist);

        // Chain to closest targets
        const toChain = Math.min(bullet.chainsRemaining, chainTargets.length);
        for (let i = 0; i < toChain; i++) {
            const target = chainTargets[i].dummy;

            // Create chain bolt visual effect with recursive support
            // Use TestRoom's local chainBolts list for proper recursive handling
            const chainBolt = new ChainBolt(
                hitDummy.x,
                hitDummy.y,
                target,
                bullet.gunData,
                0, // Initial recursive depth
                hitEnemies
            );
            this.chainBolts.push(chainBolt);

            // Deal damage to chained dummy
            const damage = this.game.devMode ? 100 * this.game.devMode.damageMultiplier : 100;
            target.takeDamage(damage);

            // Visual effect
            if (this.game.effects) {
                this.game.effects.spawnBurst(target.x, target.y, 'enemyDeath');
            }

            // Track as hit
            if (!bullet.piercedDummies) {
                bullet.piercedDummies = new Set();
            }
            bullet.piercedDummies.add(target);

            bullet.chainsRemaining--;

            // Check if target died
            if (target.dead && target.respawnTime === 0) {
                target.respawnTime = performance.now() + 3000;
            }
        }
    }
    
    /**
     * Check pickup collisions with player
     */
    checkPickupCollisions() {
        const player = this.game.player;

        for (let i = this.pickupGrid.length - 1; i >= 0; i--) {
            const pickup = this.pickupGrid[i];
            const dx = player.x - pickup.x;
            const dy = player.y - pickup.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.PICKUP_COLLECTION_RADIUS + player.size) {
                // Handle rarity selector pickups
                if (pickup.isRaritySelector) {
                    this.selectedRarity = pickup.rarityKey === 'default' ? null : pickup.rarityKey;

                    // Show notification
                    if (this.game.rewardManager) {
                        const rarityName = pickup.rarityKey === 'default' ? 'Default' : pickup.rarityKey;
                        this.game.rewardManager.addNotification(`Rarity: ${rarityName}`, pickup.color);
                    }

                    // Save pickup data for respawn
                    const originalPickup = {...pickup};
                    this.pickupGrid.splice(i, 1);

                    // Respawn after short delay
                    const timerId = setTimeout(() => {
                        if (this.active) {
                            this.pickupGrid.push(originalPickup);
                        }
                    }, 500);

                    this.respawnTimers.push(timerId);
                    continue;
                }

                // Get the reward ID for this pickup type
                let rewardId = this.pickupTypeToRewardId[pickup.type];

                // If we have a selected rarity, try to get that rarity variant
                if (this.selectedRarity) {
                    // Check if this is a gun pickup
                    if (pickup.isGun && pickup.gunType) {
                        const variants = this.gunRarityVariants[pickup.gunType];
                        if (variants && variants[this.selectedRarity]) {
                            rewardId = variants[this.selectedRarity];
                        }
                    }
                    // Check if this is a non-gun pickup with rarity variants
                    else if (this.pickupRarityVariants[pickup.type]) {
                        const variants = this.pickupRarityVariants[pickup.type];
                        if (variants && variants[this.selectedRarity]) {
                            rewardId = variants[this.selectedRarity];
                        }
                    }
                }

                // Legacy fallback logic for gun pickups without exact match
                if (pickup.isGun && pickup.gunType && this.selectedRarity) {
                    const variants = this.gunRarityVariants[pickup.gunType];
                    if (variants && !variants[this.selectedRarity]) {
                        // Fallback: find closest available rarity
                        // Priority: search DOWN from selected first (towards Common), then UP (towards S-tier)
                        const rarityOrder = ['STIER', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];
                        const selectedIndex = rarityOrder.indexOf(this.selectedRarity);

                        let foundRarity = null;
                        // Check from selected down to common (find closest lower/equal rarity)
                        for (let j = selectedIndex; j < rarityOrder.length; j++) {
                            if (variants[rarityOrder[j]]) {
                                foundRarity = rarityOrder[j];
                                break;
                            }
                        }
                        // If not found below, check from selected up to S-tier
                        if (!foundRarity) {
                            for (let j = selectedIndex - 1; j >= 0; j--) {
                                if (variants[rarityOrder[j]]) {
                                    foundRarity = rarityOrder[j];
                                    break;
                                }
                            }
                        }

                        if (foundRarity) {
                            rewardId = variants[foundRarity];
                            // Show fallback notification
                            if (this.game.rewardManager && foundRarity !== this.selectedRarity) {
                                const rarityColors = {
                                    'COMMON': '#9d9d9d', 'UNCOMMON': '#1eff00', 'RARE': '#0070dd',
                                    'EPIC': '#a335ee', 'LEGENDARY': '#ff8000', 'STIER': '#ff0000'
                                };
                                this.game.rewardManager.addNotification(
                                    `No ${this.selectedRarity} → ${foundRarity}`,
                                    rarityColors[foundRarity]
                                );
                            }
                        }
                    }
                }

                const specificReward = rewardId ? REWARDS[rewardId] : null;

                // Spawn actual reward through reward manager with specific type
                if (this.game.rewardManager) {
                    this.game.rewardManager.spawnReward(pickup.x, pickup.y, specificReward);
                }

                // Save pickup data for respawn
                const originalPickup = {...pickup};
                this.pickupGrid.splice(i, 1);

                // Respawn after delay
                const timerId = setTimeout(() => {
                    if (this.active) {
                        this.pickupGrid.push(originalPickup);
                    }
                }, this.PICKUP_RESPAWN_DELAY_MS);

                // Store timer ID for cleanup
                this.respawnTimers.push(timerId);
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

        // Draw chain bolts
        for (const bolt of this.chainBolts) {
            bolt.draw(context);
        }

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
            
            // If dummy is dead, show different visuals
            if (dummy.dead) {
                // Draw faded dummy with skull or X
                context.globalAlpha = 0.3;
                
                // Draw dummy body (faded)
                const gradient = context.createRadialGradient(
                    dummy.x, dummy.y, 0,
                    dummy.x, dummy.y, dummy.size
                );
                gradient.addColorStop(0, '#333333');
                gradient.addColorStop(1, '#111111');
                
                context.fillStyle = gradient;
                context.beginPath();
                context.arc(dummy.x, dummy.y, dummy.size, 0, Math.PI * 2);
                context.fill();
                
                // Draw X mark
                context.globalAlpha = 0.6;
                context.strokeStyle = '#ff0000';
                context.lineWidth = 4 * rX;
                const xSize = dummy.size * 0.5;
                context.beginPath();
                context.moveTo(dummy.x - xSize, dummy.y - xSize);
                context.lineTo(dummy.x + xSize, dummy.y + xSize);
                context.moveTo(dummy.x + xSize, dummy.y - xSize);
                context.lineTo(dummy.x - xSize, dummy.y + xSize);
                context.stroke();
                
                // Draw respawn timer
                context.globalAlpha = 1;
                const respawnSeconds = Math.max(0, Math.ceil((dummy.respawnTime - performance.now()) / 1000));
                context.font = `${20 * rX}px monospace`;
                context.fillStyle = '#ff0000';
                context.textAlign = 'center';
                context.shadowColor = '#ff0000';
                context.shadowBlur = 5 * rX;
                context.fillText(`Respawning in ${respawnSeconds}s`, dummy.x, dummy.y + dummy.size + 25);
            } else {
                // Draw normal dummy
                
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
            }
            
            context.restore();
        }
    }
    
    /**
     * Draw unique weapon icon based on gun type
     */
    drawWeaponIcon(context, x, y, size, gunType, rX) {
        const time = performance.now() / 1000;
        const pulse = 0.9 + Math.sin(time * 3) * 0.1;

        context.save();

        // Weapon color schemes
        const colors = {
            shotgun: { primary: '#ff6600', secondary: '#ff9944', glow: '#ff4400' },
            rapidfire: { primary: '#ffee00', secondary: '#ffff66', glow: '#ffaa00' },
            piercing: { primary: '#00ffff', secondary: '#88ffff', glow: '#00aaff' },
            ricochet: { primary: '#44ff44', secondary: '#88ff88', glow: '#00ff00' },
            homing: { primary: '#ff44ff', secondary: '#ff88ff', glow: '#aa00ff' },
            twin: { primary: '#4488ff', secondary: '#88aaff', glow: '#0066ff' },
            nova: { primary: '#ff00ff', secondary: '#ff66ff', glow: '#ff00aa' },
            chain: { primary: '#00aaff', secondary: '#66ccff', glow: '#0088ff' }
        };

        const c = colors[gunType] || colors.shotgun;

        // Base glow
        context.shadowColor = c.glow;
        context.shadowBlur = 20 * rX * pulse;

        switch (gunType) {
            case 'shotgun':
                // Spread pattern - multiple pellets in a fan
                context.fillStyle = c.primary;
                for (let i = -2; i <= 2; i++) {
                    const angle = (i * 25) * Math.PI / 180;
                    const dist = size * 0.5;
                    const px = x + Math.sin(angle) * dist;
                    const py = y - Math.cos(angle) * dist * 0.8;
                    const pelletSize = size * (0.25 - Math.abs(i) * 0.03);
                    context.beginPath();
                    context.arc(px, py, pelletSize, 0, Math.PI * 2);
                    context.fill();
                }
                // Center barrel
                context.fillStyle = c.secondary;
                context.beginPath();
                context.arc(x, y + size * 0.3, size * 0.35, 0, Math.PI * 2);
                context.fill();
                break;

            case 'rapidfire':
                // Stacked bullets with speed lines
                context.fillStyle = c.primary;
                for (let i = 0; i < 3; i++) {
                    const offset = (i - 1) * size * 0.35;
                    context.beginPath();
                    context.ellipse(x + offset, y, size * 0.2, size * 0.4, 0, 0, Math.PI * 2);
                    context.fill();
                }
                // Speed lines
                context.strokeStyle = c.secondary;
                context.lineWidth = 2 * rX;
                for (let i = 0; i < 4; i++) {
                    const ly = y - size * 0.6 + i * size * 0.4;
                    context.beginPath();
                    context.moveTo(x - size * 0.8, ly);
                    context.lineTo(x - size * 0.4, ly);
                    context.stroke();
                }
                break;

            case 'piercing':
                // Arrow/spear shape
                context.fillStyle = c.primary;
                context.beginPath();
                context.moveTo(x, y - size * 0.8);
                context.lineTo(x + size * 0.4, y + size * 0.2);
                context.lineTo(x + size * 0.15, y + size * 0.2);
                context.lineTo(x + size * 0.15, y + size * 0.8);
                context.lineTo(x - size * 0.15, y + size * 0.8);
                context.lineTo(x - size * 0.15, y + size * 0.2);
                context.lineTo(x - size * 0.4, y + size * 0.2);
                context.closePath();
                context.fill();
                // Glow trail
                context.strokeStyle = c.secondary;
                context.lineWidth = 3 * rX;
                context.beginPath();
                context.moveTo(x, y - size * 0.8);
                context.lineTo(x, y - size * 1.2);
                context.stroke();
                break;

            case 'ricochet':
                // Bouncing zigzag pattern
                context.strokeStyle = c.primary;
                context.lineWidth = 4 * rX;
                context.lineCap = 'round';
                context.beginPath();
                context.moveTo(x - size * 0.6, y - size * 0.5);
                context.lineTo(x + size * 0.3, y - size * 0.1);
                context.lineTo(x - size * 0.3, y + size * 0.3);
                context.lineTo(x + size * 0.6, y + size * 0.6);
                context.stroke();
                // Bounce points
                context.fillStyle = c.secondary;
                context.beginPath();
                context.arc(x + size * 0.3, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
                context.arc(x - size * 0.3, y + size * 0.3, size * 0.15, 0, Math.PI * 2);
                context.fill();
                break;

            case 'homing':
                // Target reticle with curved arrow
                context.strokeStyle = c.primary;
                context.lineWidth = 3 * rX;
                // Outer ring
                context.beginPath();
                context.arc(x, y, size * 0.7, 0, Math.PI * 2);
                context.stroke();
                // Crosshairs
                context.beginPath();
                context.moveTo(x - size * 0.9, y);
                context.lineTo(x - size * 0.4, y);
                context.moveTo(x + size * 0.4, y);
                context.lineTo(x + size * 0.9, y);
                context.moveTo(x, y - size * 0.9);
                context.lineTo(x, y - size * 0.4);
                context.moveTo(x, y + size * 0.4);
                context.lineTo(x, y + size * 0.9);
                context.stroke();
                // Center dot
                context.fillStyle = c.secondary;
                context.beginPath();
                context.arc(x, y, size * 0.2, 0, Math.PI * 2);
                context.fill();
                break;

            case 'twin':
                // Two parallel bullets
                context.fillStyle = c.primary;
                context.beginPath();
                context.arc(x - size * 0.35, y, size * 0.35, 0, Math.PI * 2);
                context.fill();
                context.beginPath();
                context.arc(x + size * 0.35, y, size * 0.35, 0, Math.PI * 2);
                context.fill();
                // Connecting line
                context.strokeStyle = c.secondary;
                context.lineWidth = 3 * rX;
                context.beginPath();
                context.moveTo(x - size * 0.35, y + size * 0.4);
                context.lineTo(x + size * 0.35, y + size * 0.4);
                context.stroke();
                break;

            case 'nova':
                // Starburst pattern
                context.fillStyle = c.primary;
                const spikes = 8;
                context.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const angle = (i * Math.PI) / spikes - Math.PI / 2;
                    const radius = i % 2 === 0 ? size * 0.9 : size * 0.4;
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (i === 0) context.moveTo(px, py);
                    else context.lineTo(px, py);
                }
                context.closePath();
                context.fill();
                // Center
                context.fillStyle = c.secondary;
                context.beginPath();
                context.arc(x, y, size * 0.25, 0, Math.PI * 2);
                context.fill();
                break;

            case 'chain':
                // Lightning bolt
                context.strokeStyle = c.primary;
                context.lineWidth = 4 * rX;
                context.lineCap = 'round';
                context.lineJoin = 'round';
                context.beginPath();
                context.moveTo(x - size * 0.2, y - size * 0.8);
                context.lineTo(x + size * 0.3, y - size * 0.2);
                context.lineTo(x - size * 0.1, y - size * 0.1);
                context.lineTo(x + size * 0.4, y + size * 0.7);
                context.stroke();
                // Electric sparks
                context.fillStyle = c.secondary;
                const sparkAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
                for (const angle of sparkAngles) {
                    const sx = x + Math.cos(angle + time * 5) * size * 0.6;
                    const sy = y + Math.sin(angle + time * 5) * size * 0.6;
                    context.beginPath();
                    context.arc(sx, sy, size * 0.1, 0, Math.PI * 2);
                    context.fill();
                }
                break;
        }

        context.restore();
    }

    /**
     * Draw pickup grid
     */
    drawPickupGrid(context) {
        const rX = window.innerWidth / 2560;

        context.save();

        // Separate pickups into groups by category
        const cooldownPickups = this.pickupGrid.filter(p => p.category === 'cooldown');
        const survPickups = this.pickupGrid.filter(p => p.category === 'survivability');
        const movePickups = this.pickupGrid.filter(p => p.category === 'movement');
        const offensePickups = this.pickupGrid.filter(p => p.category === 'offense');
        const gunPickups = this.pickupGrid.filter(p => p.isGun);
        const rarityPickups = this.pickupGrid.filter(p => p.isRaritySelector);

        // Draw category labels
        context.textAlign = 'left';
        context.font = `${14 * rX}px monospace`;

        // COOLDOWNS label
        context.fillStyle = '#ffff00';
        context.shadowColor = '#ffff00';
        context.shadowBlur = 6 * rX;
        context.fillText('COOLDOWNS', 40, this.game.height / 2 - 130);

        // SURVIVABILITY label
        context.fillStyle = '#ff4488';
        context.shadowColor = '#ff4488';
        context.fillText('SURVIVABILITY', 40, this.game.height / 2);

        // MOVEMENT label
        context.fillStyle = '#00ff88';
        context.shadowColor = '#00ff88';
        context.fillText('MOVEMENT', 40, this.game.height / 2 + 130);

        // OFFENSE label
        context.fillStyle = '#ffaa00';
        context.shadowColor = '#ffaa00';
        context.fillText('OFFENSE', 40, this.game.height / 2 + 260);

        // Draw all non-gun, non-rarity pickups
        const leftPickups = [...cooldownPickups, ...survPickups, ...movePickups, ...offensePickups];
        for (const pickup of leftPickups) {
            // Draw pickup circle
            context.fillStyle = pickup.color;
            context.shadowColor = pickup.color;
            context.shadowBlur = 15 * rX;
            context.beginPath();
            context.arc(pickup.x, pickup.y, pickup.size, 0, Math.PI * 2);
            context.fill();

            // Draw label
            context.font = `${12 * rX}px monospace`;
            context.fillStyle = '#ffffff';
            context.shadowBlur = 3 * rX;
            context.textAlign = 'center';
            context.fillText(pickup.label, pickup.x, pickup.y + pickup.size + 18);
        }

        // Draw right section title (GUN UPGRADES)
        context.font = `${32 * rX}px monospace`;
        context.fillStyle = '#ff8000';
        context.shadowColor = '#ff8000';
        context.shadowBlur = 8 * rX;
        context.textAlign = 'right';
        context.fillText('GUN UPGRADES', this.game.width - 100, this.game.height / 2 - 60);

        // Draw gun pickups with unique icons
        for (const pickup of gunPickups) {
            this.drawWeaponIcon(context, pickup.x, pickup.y, pickup.size, pickup.gunType, rX);

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

        // Draw rarity selector section title
        context.font = `${28 * rX}px monospace`;
        context.fillStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 8 * rX;
        context.textAlign = 'center';
        context.fillText('RARITY SELECTOR', this.game.width / 2, this.game.height - 140);

        // Draw rarity selector pickups
        for (const pickup of rarityPickups) {
            const isSelected = (pickup.rarityKey === 'default' && !this.selectedRarity) ||
                               (pickup.rarityKey === this.selectedRarity);

            // Draw selection ring if selected
            if (isSelected) {
                context.strokeStyle = '#ffffff';
                context.lineWidth = 3 * rX;
                context.shadowColor = '#ffffff';
                context.shadowBlur = 15 * rX;
                context.beginPath();
                context.arc(pickup.x, pickup.y, pickup.size + 8, 0, Math.PI * 2);
                context.stroke();
            }

            // Draw pickup circle
            context.fillStyle = pickup.color;
            context.shadowColor = pickup.color;
            context.shadowBlur = isSelected ? 20 * rX : 10 * rX;
            context.beginPath();
            context.arc(pickup.x, pickup.y, pickup.size, 0, Math.PI * 2);
            context.fill();

            // Draw label
            context.font = `${12 * rX}px monospace`;
            context.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
            context.shadowBlur = 3 * rX;
            context.textAlign = 'center';
            context.fillText(pickup.label, pickup.x, pickup.y + pickup.size + 18);
        }

        context.restore();
    }
    
    /**
     * Draw test room boundaries
     */
    drawBoundaries(context) {
        const rX = window.innerWidth / 2560;
        const margin = 20;  // Closer to edge for more play area
        
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
