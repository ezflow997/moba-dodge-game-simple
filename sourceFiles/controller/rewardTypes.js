// Reward Rarity Tiers
export const RARITY = {
    COMMON: { name: 'Common', color: '#9d9d9d', glowColor: '#666666', weight: 35 },
    UNCOMMON: { name: 'Uncommon', color: '#1eff00', glowColor: '#00aa00', weight: 25 },
    RARE: { name: 'Rare', color: '#0070dd', glowColor: '#0050aa', weight: 20 },
    EPIC: { name: 'Epic', color: '#a335ee', glowColor: '#7722bb', weight: 12 },
    LEGENDARY: { name: 'Legendary', color: '#ff8000', glowColor: '#cc6600', weight: 6 },
    STIER: { name: 'S-Tier', color: '#ff0000', glowColor: '#ffdd00', weight: 2 }
};

// Reward Categories
export const CATEGORY = {
    GUN: 'gun',
    COOLDOWN: 'cooldown',
    SURVIVABILITY: 'survivability',
    MOVEMENT: 'movement',
    OFFENSE: 'offense'
};

// All reward definitions
export const REWARDS = {
    // ============ GUN TYPES (with durability) ============

    // Shotgun - Wide spread, less range
    SHOTGUN_COMMON: {
        id: 'shotgun_common',
        name: 'Shotgun',
        description: '5 bullets, 45% range',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'shotgun',
        durability: 12,
        bulletCount: 5,
        spreadAngle: 40,
        rangeMultiplier: 0.45
    },
    SHOTGUN_UNCOMMON: {
        id: 'shotgun_uncommon',
        name: 'Pump Shotgun',
        description: '7 bullets, 50% range',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'shotgun',
        durability: 18,
        bulletCount: 7,
        spreadAngle: 45,
        rangeMultiplier: 0.5
    },
    SHOTGUN_RARE: {
        id: 'shotgun_rare',
        name: 'Heavy Shotgun',
        description: '9 bullets, 55% range',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'shotgun',
        durability: 25,
        bulletCount: 9,
        spreadAngle: 50,
        rangeMultiplier: 0.55
    },
    SHOTGUN_EPIC: {
        id: 'shotgun_epic',
        name: 'Combat Shotgun',
        description: '11 bullets, 60% range',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'shotgun',
        durability: 35,
        bulletCount: 11,
        spreadAngle: 55,
        rangeMultiplier: 0.6
    },
    SHOTGUN_LEGENDARY: {
        id: 'shotgun_legendary',
        name: 'Devastator',
        description: '14 bullets, 70% range',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'shotgun',
        durability: 45,
        bulletCount: 14,
        spreadAngle: 60,
        rangeMultiplier: 0.7
    },
    SHOTGUN_STIER: {
        id: 'shotgun_stier',
        name: 'Doomblaster',
        description: '18 bullets, 80% range, faster fire',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'shotgun',
        durability: 60,
        bulletCount: 18,
        spreadAngle: 70,
        rangeMultiplier: 0.8,
        cooldownMultiplier: 0.7
    },

    // Rapid Fire - Fast shooting
    RAPIDFIRE_COMMON: {
        id: 'rapidfire_common',
        name: 'Quick Shot',
        description: '25% faster shooting',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'rapidfire',
        durability: 30,
        cooldownMultiplier: 0.75
    },
    RAPIDFIRE_UNCOMMON: {
        id: 'rapidfire_uncommon',
        name: 'Rapid Fire',
        description: '40% faster shooting',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'rapidfire',
        durability: 45,
        cooldownMultiplier: 0.6
    },
    RAPIDFIRE_RARE: {
        id: 'rapidfire_rare',
        name: 'Auto Cannon',
        description: '50% faster shooting',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'rapidfire',
        durability: 60,
        cooldownMultiplier: 0.5
    },
    RAPIDFIRE_EPIC: {
        id: 'rapidfire_epic',
        name: 'Turbo Cannon',
        description: '60% faster shooting',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'rapidfire',
        durability: 80,
        cooldownMultiplier: 0.4
    },
    RAPIDFIRE_LEGENDARY: {
        id: 'rapidfire_legendary',
        name: 'Gatling Gun',
        description: '70% faster shooting',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'rapidfire',
        durability: 100,
        cooldownMultiplier: 0.3
    },
    RAPIDFIRE_STIER: {
        id: 'rapidfire_stier',
        name: 'Minigun',
        description: '80% faster, dual bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'rapidfire',
        durability: 130,
        cooldownMultiplier: 0.2,
        bulletCount: 2
    },

    // Piercing - Goes through enemies
    PIERCING_COMMON: {
        id: 'piercing_common',
        name: 'Sharp Shot',
        description: 'Pierce 1 enemy',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'piercing',
        durability: 12,
        pierceCount: 1
    },
    PIERCING_UNCOMMON: {
        id: 'piercing_uncommon',
        name: 'Piercing Shot',
        description: 'Pierce 2 enemies',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'piercing',
        durability: 18,
        pierceCount: 2
    },
    PIERCING_RARE: {
        id: 'piercing_rare',
        name: 'Penetrator',
        description: 'Pierce 3 enemies',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'piercing',
        durability: 25,
        pierceCount: 3
    },
    PIERCING_EPIC: {
        id: 'piercing_epic',
        name: 'Railgun',
        description: 'Pierce 5 enemies',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'piercing',
        durability: 35,
        pierceCount: 5
    },
    PIERCING_LEGENDARY: {
        id: 'piercing_legendary',
        name: 'Void Piercer',
        description: 'Pierce 8 enemies, +20% range',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'piercing',
        durability: 45,
        pierceCount: 8,
        rangeMultiplier: 1.2
    },
    PIERCING_STIER: {
        id: 'piercing_stier',
        name: 'Infinity Lance',
        description: 'Pierce ALL enemies, +50% range',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'piercing',
        durability: 60,
        pierceCount: 999,
        rangeMultiplier: 1.5
    },

    // Ricochet - Bounces off walls
    RICOCHET_COMMON: {
        id: 'ricochet_common',
        name: 'Bouncer',
        description: 'Bullets bounce 1 time',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'ricochet',
        durability: 12,
        bounceCount: 1
    },
    RICOCHET_UNCOMMON: {
        id: 'ricochet_uncommon',
        name: 'Ricochet',
        description: 'Bullets bounce 2 times',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'ricochet',
        durability: 18,
        bounceCount: 2
    },
    RICOCHET_RARE: {
        id: 'ricochet_rare',
        name: 'Pinball',
        description: 'Bullets bounce 3 times',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'ricochet',
        durability: 25,
        bounceCount: 3
    },
    RICOCHET_EPIC: {
        id: 'ricochet_epic',
        name: 'Trick Shot',
        description: 'Bullets bounce 4 times, +15% speed',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'ricochet',
        durability: 35,
        bounceCount: 4,
        speedMultiplier: 1.15
    },
    RICOCHET_LEGENDARY: {
        id: 'ricochet_legendary',
        name: 'Geometry Master',
        description: 'Bullets bounce 6 times, +30% speed',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'ricochet',
        durability: 45,
        bounceCount: 6,
        speedMultiplier: 1.3
    },
    RICOCHET_STIER: {
        id: 'ricochet_stier',
        name: 'Chaos Bouncer',
        description: 'Bullets bounce 8 times, +50% speed',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'ricochet',
        durability: 60,
        bounceCount: 8,
        speedMultiplier: 1.5
    },

    // Homing - Tracks enemies
    HOMING_COMMON: {
        id: 'homing_common',
        name: 'Seeker',
        description: 'Slow homing, weak tracking',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'homing',
        durability: 12,
        turnSpeed: 0.015,
        speedMultiplier: 0.5
    },
    HOMING_UNCOMMON: {
        id: 'homing_uncommon',
        name: 'Tracker',
        description: 'Moderate homing',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'homing',
        durability: 18,
        turnSpeed: 0.025,
        speedMultiplier: 0.55
    },
    HOMING_RARE: {
        id: 'homing_rare',
        name: 'Homing Missile',
        description: 'Good tracking, medium speed',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'homing',
        durability: 25,
        turnSpeed: 0.035,
        speedMultiplier: 0.6
    },
    HOMING_EPIC: {
        id: 'homing_epic',
        name: 'Smart Missile',
        description: 'Fast tracking missiles',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'homing',
        durability: 35,
        turnSpeed: 0.05,
        speedMultiplier: 0.7
    },
    HOMING_LEGENDARY: {
        id: 'homing_legendary',
        name: 'Heat Seeker',
        description: 'Aggressive tracking, fast',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'homing',
        durability: 45,
        turnSpeed: 0.07,
        speedMultiplier: 0.85
    },
    HOMING_STIER: {
        id: 'homing_stier',
        name: 'Swarm Missiles',
        description: 'Perfect tracking, 3 missiles',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'homing',
        durability: 60,
        turnSpeed: 0.1,
        speedMultiplier: 0.9,
        bulletCount: 3
    },

    // Twin/Multi Shot - Multiple parallel bullets
    TWIN_COMMON: {
        id: 'twin_common',
        name: 'Twin Shot',
        description: 'Fire 2 bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'twin',
        durability: 15,
        bulletCount: 2,
        spacing: 20
    },
    TWIN_UNCOMMON: {
        id: 'twin_uncommon',
        name: 'Triple Shot',
        description: 'Fire 3 bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'twin',
        durability: 22,
        bulletCount: 3,
        spacing: 18
    },
    TWIN_RARE: {
        id: 'twin_rare',
        name: 'Quad Shot',
        description: 'Fire 4 bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'twin',
        durability: 30,
        bulletCount: 4,
        spacing: 15
    },
    TWIN_EPIC: {
        id: 'twin_epic',
        name: 'Penta Shot',
        description: 'Fire 5 bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'twin',
        durability: 40,
        bulletCount: 5,
        spacing: 12
    },
    TWIN_LEGENDARY: {
        id: 'twin_legendary',
        name: 'Hexa Cannon',
        description: 'Fire 6 bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'twin',
        durability: 50,
        bulletCount: 6,
        spacing: 10
    },
    TWIN_STIER: {
        id: 'twin_stier',
        name: 'Bullet Storm',
        description: 'Fire 8 bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'twin',
        durability: 65,
        bulletCount: 8,
        spacing: 8
    },

    // Nova - 360 degree burst
    NOVA_COMMON: {
        id: 'nova_common',
        name: 'Spark',
        description: '4 bullets in all directions',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'nova',
        durability: 10,
        bulletCount: 4,
        rangeMultiplier: 0.6
    },
    NOVA_UNCOMMON: {
        id: 'nova_uncommon',
        name: 'Pulse',
        description: '6 bullets in all directions',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'nova',
        durability: 14,
        bulletCount: 6,
        rangeMultiplier: 0.7
    },
    NOVA_RARE: {
        id: 'nova_rare',
        name: 'Nova',
        description: '8 bullets in all directions',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'nova',
        durability: 18,
        bulletCount: 8,
        rangeMultiplier: 0.8
    },
    NOVA_EPIC: {
        id: 'nova_epic',
        name: 'Nova Burst',
        description: '12 bullets in all directions',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'nova',
        durability: 24,
        bulletCount: 12,
        rangeMultiplier: 1.0
    },
    NOVA_LEGENDARY: {
        id: 'nova_legendary',
        name: 'Star Burst',
        description: '16 bullets, +30% range',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'nova',
        durability: 32,
        bulletCount: 16,
        rangeMultiplier: 1.3
    },
    NOVA_STIER: {
        id: 'nova_stier',
        name: 'Supernova',
        description: '24 bullets, double range',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'nova',
        durability: 45,
        bulletCount: 24,
        rangeMultiplier: 2.0
    },

    // Chain Lightning - Jumps between enemies
    // recursiveBounces = how many times chain can bounce from enemy to enemy
    CHAIN_COMMON: {
        id: 'chain_common',
        name: 'Static',
        description: 'Jumps to 1 enemy, no recursive bounce',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'chain',
        durability: 10,
        chainCount: 1,
        chainRange: 150,
        recursiveBounces: 0
    },
    CHAIN_UNCOMMON: {
        id: 'chain_uncommon',
        name: 'Shock',
        description: 'Jumps to 1 enemy, 1 recursive bounce',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'chain',
        durability: 15,
        chainCount: 1,
        chainRange: 220,
        recursiveBounces: 1
    },
    CHAIN_RARE: {
        id: 'chain_rare',
        name: 'Lightning',
        description: 'Jumps to 2 enemies, 2 recursive bounces',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'chain',
        durability: 22,
        chainCount: 2,
        chainRange: 280,
        recursiveBounces: 2
    },
    CHAIN_EPIC: {
        id: 'chain_epic',
        name: 'Chain Lightning',
        description: 'Jumps to 3 enemies, 3 recursive bounces',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'chain',
        durability: 30,
        chainCount: 3,
        chainRange: 350,
        recursiveBounces: 3
    },
    CHAIN_LEGENDARY: {
        id: 'chain_legendary',
        name: 'Thunder Strike',
        description: 'Jumps to 5 enemies, 4 recursive bounces',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'chain',
        durability: 40,
        chainCount: 5,
        chainRange: 450,
        recursiveBounces: 4
    },
    CHAIN_STIER: {
        id: 'chain_stier',
        name: 'Storm Caller',
        description: 'Jumps to 8 enemies, 5 recursive bounces',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'chain',
        durability: 55,
        chainCount: 8,
        chainRange: 600,
        recursiveBounces: 5
    },

    // ============ COOLDOWN REDUCTIONS ============

    // Q Cooldown (Shooting) - All 6 rarities
    Q_CD_COMMON: {
        id: 'q_cd_common',
        name: 'Quick Trigger',
        description: '-10% Q cooldown for 45s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.COMMON,
        ability: 'q',
        reduction: 0.10,
        duration: 45000
    },
    Q_CD_UNCOMMON: {
        id: 'q_cd_uncommon',
        name: 'Fast Trigger',
        description: '-18% Q cooldown for 60s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.UNCOMMON,
        ability: 'q',
        reduction: 0.18,
        duration: 60000
    },
    Q_CD_RARE: {
        id: 'q_cd_rare',
        name: 'Rapid Trigger',
        description: '-25% Q cooldown for 75s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.RARE,
        ability: 'q',
        reduction: 0.25,
        duration: 75000
    },
    Q_CD_EPIC: {
        id: 'q_cd_epic',
        name: 'Hyper Trigger',
        description: '-35% Q cooldown for 90s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.EPIC,
        ability: 'q',
        reduction: 0.35,
        duration: 90000
    },
    Q_CD_LEGENDARY: {
        id: 'q_cd_legendary',
        name: 'Instant Trigger',
        description: '-45% Q cooldown for 120s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.LEGENDARY,
        ability: 'q',
        reduction: 0.45,
        duration: 120000
    },
    Q_CD_STIER: {
        id: 'q_cd_stier',
        name: 'Zero Cooldown',
        description: '-60% Q cooldown permanently',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.STIER,
        ability: 'q',
        reduction: 0.60,
        duration: -1
    },

    // E Cooldown (Dash) - All 6 rarities
    E_CD_COMMON: {
        id: 'e_cd_common',
        name: 'Nimble Feet',
        description: '-10% E cooldown for 30s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.COMMON,
        ability: 'e',
        reduction: 0.10,
        duration: 30000
    },
    E_CD_UNCOMMON: {
        id: 'e_cd_uncommon',
        name: 'Swift Dash',
        description: '-18% E cooldown for 45s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.UNCOMMON,
        ability: 'e',
        reduction: 0.18,
        duration: 45000
    },
    E_CD_RARE: {
        id: 'e_cd_rare',
        name: 'Quick Dash',
        description: '-25% E cooldown for 60s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.RARE,
        ability: 'e',
        reduction: 0.25,
        duration: 60000
    },
    E_CD_EPIC: {
        id: 'e_cd_epic',
        name: 'Flash Step',
        description: '-35% E cooldown for 90s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.EPIC,
        ability: 'e',
        reduction: 0.35,
        duration: 90000
    },
    E_CD_LEGENDARY: {
        id: 'e_cd_legendary',
        name: 'Teleport',
        description: '-50% E cooldown for 120s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.LEGENDARY,
        ability: 'e',
        reduction: 0.50,
        duration: 120000
    },
    E_CD_STIER: {
        id: 'e_cd_stier',
        name: 'Blink Master',
        description: '-65% E cooldown permanently',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.STIER,
        ability: 'e',
        reduction: 0.65,
        duration: -1
    },

    // F Cooldown (Ultimate) - All 6 rarities
    F_CD_COMMON: {
        id: 'f_cd_common',
        name: 'Ult Ready',
        description: '-8% F cooldown for 60s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.COMMON,
        ability: 'f',
        reduction: 0.08,
        duration: 60000
    },
    F_CD_UNCOMMON: {
        id: 'f_cd_uncommon',
        name: 'Ult Haste',
        description: '-15% F cooldown for 90s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.UNCOMMON,
        ability: 'f',
        reduction: 0.15,
        duration: 90000
    },
    F_CD_RARE: {
        id: 'f_cd_rare',
        name: 'Ultimate Haste',
        description: '-22% F cooldown for 120s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.RARE,
        ability: 'f',
        reduction: 0.22,
        duration: 120000
    },
    F_CD_EPIC: {
        id: 'f_cd_epic',
        name: 'Power Surge',
        description: '-32% F cooldown for 150s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.EPIC,
        ability: 'f',
        reduction: 0.32,
        duration: 150000
    },
    F_CD_LEGENDARY: {
        id: 'f_cd_legendary',
        name: 'Ascension',
        description: '-45% F cooldown for 180s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.LEGENDARY,
        ability: 'f',
        reduction: 0.45,
        duration: 180000
    },
    F_CD_STIER: {
        id: 'f_cd_stier',
        name: 'Godmode',
        description: '-60% F cooldown permanently',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.STIER,
        ability: 'f',
        reduction: 0.60,
        duration: -1
    },

    // ============ SURVIVABILITY ============

    // Extra Life - 3 tiers only (1, 2, 3 lives)
    EXTRA_LIFE_RARE: {
        id: 'extra_life_rare',
        name: 'Second Chance',
        description: 'Survive one fatal hit',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.RARE,
        lives: 1
    },
    EXTRA_LIFE_LEGENDARY: {
        id: 'extra_life_legendary',
        name: 'Undying Will',
        description: 'Survive two fatal hits',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.LEGENDARY,
        lives: 2
    },
    EXTRA_LIFE_STIER: {
        id: 'extra_life_stier',
        name: 'Phoenix Soul',
        description: 'Survive three fatal hits',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.STIER,
        lives: 3
    },

    // Shield - All 6 rarities
    SHIELD_COMMON: {
        id: 'shield_common',
        name: 'Weak Shield',
        description: 'Block 1 projectile (15s)',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.COMMON,
        blockCount: 1,
        duration: 15000
    },
    SHIELD_UNCOMMON: {
        id: 'shield_uncommon',
        name: 'Light Shield',
        description: 'Block 1 projectile (25s)',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.UNCOMMON,
        blockCount: 1,
        duration: 25000
    },
    SHIELD_RARE: {
        id: 'shield_rare',
        name: 'Energy Shield',
        description: 'Block 2 projectiles (35s)',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.RARE,
        blockCount: 2,
        duration: 35000
    },
    SHIELD_EPIC: {
        id: 'shield_epic',
        name: 'Force Field',
        description: 'Block 3 projectiles (45s)',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.EPIC,
        blockCount: 3,
        duration: 45000
    },
    SHIELD_LEGENDARY: {
        id: 'shield_legendary',
        name: 'Barrier',
        description: 'Block 5 projectiles (60s)',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.LEGENDARY,
        blockCount: 5,
        duration: 60000
    },
    SHIELD_STIER: {
        id: 'shield_stier',
        name: 'Invincible Aura',
        description: 'Block 8 projectiles (90s)',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.STIER,
        blockCount: 8,
        duration: 90000
    },

    // Shrink - All 6 rarities
    SHRINK_COMMON: {
        id: 'shrink_common',
        name: 'Slim Form',
        description: '10% smaller hitbox for 30s',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.COMMON,
        sizeReduction: 0.10,
        duration: 30000
    },
    SHRINK_UNCOMMON: {
        id: 'shrink_uncommon',
        name: 'Compact Form',
        description: '18% smaller hitbox for 45s',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.UNCOMMON,
        sizeReduction: 0.18,
        duration: 45000
    },
    SHRINK_RARE: {
        id: 'shrink_rare',
        name: 'Mini Form',
        description: '25% smaller hitbox for 60s',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.RARE,
        sizeReduction: 0.25,
        duration: 60000
    },
    SHRINK_EPIC: {
        id: 'shrink_epic',
        name: 'Micro Mode',
        description: '35% smaller hitbox for 75s',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.EPIC,
        sizeReduction: 0.35,
        duration: 75000
    },
    SHRINK_LEGENDARY: {
        id: 'shrink_legendary',
        name: 'Nano Form',
        description: '45% smaller hitbox for 90s',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.LEGENDARY,
        sizeReduction: 0.45,
        duration: 90000
    },
    SHRINK_STIER: {
        id: 'shrink_stier',
        name: 'Atom Size',
        description: '55% smaller hitbox for 120s',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.STIER,
        sizeReduction: 0.55,
        duration: 120000
    },

    // ============ MOVEMENT ============

    // Speed Boost - All 6 rarities
    SPEED_COMMON: {
        id: 'speed_common',
        name: 'Quick Feet',
        description: '+10% speed for 25s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.COMMON,
        speedBoost: 0.10,
        duration: 25000
    },
    SPEED_UNCOMMON: {
        id: 'speed_uncommon',
        name: 'Fast Stride',
        description: '+18% speed for 40s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.UNCOMMON,
        speedBoost: 0.18,
        duration: 40000
    },
    SPEED_RARE: {
        id: 'speed_rare',
        name: 'Swift Runner',
        description: '+25% speed for 55s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.RARE,
        speedBoost: 0.25,
        duration: 55000
    },
    SPEED_EPIC: {
        id: 'speed_epic',
        name: 'Blur',
        description: '+35% speed for 70s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.EPIC,
        speedBoost: 0.35,
        duration: 70000
    },
    SPEED_LEGENDARY: {
        id: 'speed_legendary',
        name: 'Velocity',
        description: '+45% speed for 90s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.LEGENDARY,
        speedBoost: 0.45,
        duration: 90000
    },
    SPEED_STIER: {
        id: 'speed_stier',
        name: 'Lightspeed',
        description: '+60% speed for 120s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.STIER,
        speedBoost: 0.60,
        duration: 120000
    },

    // Dash Distance - All 6 rarities
    DASH_DISTANCE_COMMON: {
        id: 'dash_distance_common',
        name: 'Long Step',
        description: '+25% dash distance for 30s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.COMMON,
        dashBoost: 0.25,
        duration: 30000
    },
    DASH_DISTANCE_UNCOMMON: {
        id: 'dash_distance_uncommon',
        name: 'Extended Dash',
        description: '+40% dash distance for 50s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.UNCOMMON,
        dashBoost: 0.40,
        duration: 50000
    },
    DASH_DISTANCE_RARE: {
        id: 'dash_distance_rare',
        name: 'Power Dash',
        description: '+60% dash distance for 70s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.RARE,
        dashBoost: 0.60,
        duration: 70000
    },
    DASH_DISTANCE_EPIC: {
        id: 'dash_distance_epic',
        name: 'Warp Dash',
        description: '+85% dash distance for 90s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.EPIC,
        dashBoost: 0.85,
        duration: 90000
    },
    DASH_DISTANCE_LEGENDARY: {
        id: 'dash_distance_legendary',
        name: 'Blink',
        description: '+120% dash distance for 120s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.LEGENDARY,
        dashBoost: 1.20,
        duration: 120000
    },
    DASH_DISTANCE_STIER: {
        id: 'dash_distance_stier',
        name: 'Teleport Dash',
        description: '+175% dash distance for 150s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.STIER,
        dashBoost: 1.75,
        duration: 150000
    },

    // Ghost Mode - All 6 rarities
    GHOST_COMMON: {
        id: 'ghost_common',
        name: 'Fade',
        description: 'Phase through enemies for 3s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.COMMON,
        duration: 3000,
        phaseThrough: true
    },
    GHOST_UNCOMMON: {
        id: 'ghost_uncommon',
        name: 'Phase Shift',
        description: 'Phase through enemies for 5s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.UNCOMMON,
        duration: 5000,
        phaseThrough: true
    },
    GHOST_RARE: {
        id: 'ghost_rare',
        name: 'Spirit Walk',
        description: 'Phase through enemies for 8s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.RARE,
        duration: 8000,
        phaseThrough: true
    },
    GHOST_EPIC: {
        id: 'ghost_epic',
        name: 'Phantom',
        description: 'Phase through enemies for 12s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.EPIC,
        duration: 12000,
        phaseThrough: true
    },
    GHOST_LEGENDARY: {
        id: 'ghost_legendary',
        name: 'Ghost Mode',
        description: 'Phase through enemies for 18s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.LEGENDARY,
        duration: 18000,
        phaseThrough: true
    },
    GHOST_STIER: {
        id: 'ghost_stier',
        name: 'Ethereal Form',
        description: 'Phase through enemies for 30s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.STIER,
        duration: 30000,
        phaseThrough: true
    },

    // ============ OFFENSE ============

    // Score Multiplier - All 6 rarities
    SCORE_MULT_COMMON: {
        id: 'score_mult_common',
        name: 'Bonus Points',
        description: '1.2x score multiplier for 20s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.COMMON,
        scoreMultiplier: 1.2,
        duration: 20000
    },
    SCORE_MULT_UNCOMMON: {
        id: 'score_mult_uncommon',
        name: 'Score Boost',
        description: '1.4x score multiplier for 30s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.UNCOMMON,
        scoreMultiplier: 1.4,
        duration: 30000
    },
    SCORE_MULT_RARE: {
        id: 'score_mult_rare',
        name: 'Point Rush',
        description: '1.7x score multiplier for 40s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.RARE,
        scoreMultiplier: 1.7,
        duration: 40000
    },
    SCORE_MULT_EPIC: {
        id: 'score_mult_epic',
        name: 'Jackpot',
        description: '2.0x score multiplier for 50s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.EPIC,
        scoreMultiplier: 2.0,
        duration: 50000
    },
    SCORE_MULT_LEGENDARY: {
        id: 'score_mult_legendary',
        name: 'Fortune',
        description: '2.5x score multiplier for 60s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.LEGENDARY,
        scoreMultiplier: 2.5,
        duration: 60000
    },
    SCORE_MULT_STIER: {
        id: 'score_mult_stier',
        name: 'Golden Touch',
        description: '3.5x score multiplier for 90s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.STIER,
        scoreMultiplier: 3.5,
        duration: 90000
    },

    // Bullet Size - All 6 rarities
    BULLET_SIZE_COMMON: {
        id: 'bullet_size_common',
        name: 'Bigger Bullets',
        description: '+30% bullet size for 25s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.COMMON,
        sizeBoost: 0.30,
        duration: 25000
    },
    BULLET_SIZE_UNCOMMON: {
        id: 'bullet_size_uncommon',
        name: 'Large Bullets',
        description: '+50% bullet size for 40s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.UNCOMMON,
        sizeBoost: 0.50,
        duration: 40000
    },
    BULLET_SIZE_RARE: {
        id: 'bullet_size_rare',
        name: 'Massive Bullets',
        description: '+75% bullet size for 55s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.RARE,
        sizeBoost: 0.75,
        duration: 55000
    },
    BULLET_SIZE_EPIC: {
        id: 'bullet_size_epic',
        name: 'Giant Bullets',
        description: '+100% bullet size for 70s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.EPIC,
        sizeBoost: 1.0,
        duration: 70000
    },
    BULLET_SIZE_LEGENDARY: {
        id: 'bullet_size_legendary',
        name: 'Mega Bullets',
        description: '+150% bullet size for 90s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.LEGENDARY,
        sizeBoost: 1.5,
        duration: 90000
    },
    BULLET_SIZE_STIER: {
        id: 'bullet_size_stier',
        name: 'Colossal Bullets',
        description: '+200% bullet size for 120s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.STIER,
        sizeBoost: 2.0,
        duration: 120000
    },

    // Range Boost - All 6 rarities
    RANGE_COMMON: {
        id: 'range_common',
        name: 'Far Shot',
        description: '+25% bullet range for 30s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.COMMON,
        rangeBoost: 0.25,
        duration: 30000
    },
    RANGE_UNCOMMON: {
        id: 'range_uncommon',
        name: 'Long Shot',
        description: '+45% bullet range for 45s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.UNCOMMON,
        rangeBoost: 0.45,
        duration: 45000
    },
    RANGE_RARE: {
        id: 'range_rare',
        name: 'Marksman',
        description: '+70% bullet range for 60s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.RARE,
        rangeBoost: 0.70,
        duration: 60000
    },
    RANGE_EPIC: {
        id: 'range_epic',
        name: 'Sniper',
        description: '+100% bullet range for 75s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.EPIC,
        rangeBoost: 1.0,
        duration: 75000
    },
    RANGE_LEGENDARY: {
        id: 'range_legendary',
        name: 'Artillery',
        description: '+150% bullet range for 90s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.LEGENDARY,
        rangeBoost: 1.5,
        duration: 90000
    },
    RANGE_STIER: {
        id: 'range_stier',
        name: 'Sniper Range',
        description: '+250% bullet range for 120s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.STIER,
        rangeBoost: 2.5,
        duration: 120000
    },

    // Damage Aura - All 6 rarities
    DAMAGE_AURA_COMMON: {
        id: 'damage_aura_common',
        name: 'Weak Aura',
        description: 'Tiny damage aura (20s)',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.COMMON,
        auraRadius: 50,
        auraDamage: 1,
        duration: 20000
    },
    DAMAGE_AURA_UNCOMMON: {
        id: 'damage_aura_uncommon',
        name: 'Pain Field',
        description: 'Small damage aura (35s)',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.UNCOMMON,
        auraRadius: 75,
        auraDamage: 1,
        duration: 35000
    },
    DAMAGE_AURA_RARE: {
        id: 'damage_aura_rare',
        name: 'Damage Aura',
        description: 'Medium damage aura (50s)',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.RARE,
        auraRadius: 100,
        auraDamage: 1,
        duration: 50000
    },
    DAMAGE_AURA_EPIC: {
        id: 'damage_aura_epic',
        name: 'Kill Zone',
        description: 'Large damage aura (65s)',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.EPIC,
        auraRadius: 140,
        auraDamage: 2,
        duration: 65000
    },
    DAMAGE_AURA_LEGENDARY: {
        id: 'damage_aura_legendary',
        name: 'Death Field',
        description: 'Huge damage aura (80s)',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.LEGENDARY,
        auraRadius: 200,
        auraDamage: 3,
        duration: 80000
    },
    DAMAGE_AURA_STIER: {
        id: 'damage_aura_stier',
        name: 'Annihilation',
        description: 'Massive damage aura (120s)',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.STIER,
        auraRadius: 300,
        auraDamage: 5,
        duration: 120000
    }
};

// Get all rewards as array for random selection
export function getAllRewards() {
    return Object.values(REWARDS);
}

// Get rewards filtered by rarity
export function getRewardsByRarity(rarity) {
    return Object.values(REWARDS).filter(r => r.rarity === rarity);
}

// Get rewards filtered by category
export function getRewardsByCategory(category) {
    return Object.values(REWARDS).filter(r => r.category === category);
}

// Weighted random selection based on rarity
export function getRandomReward() {
    const allRewards = getAllRewards();
    const totalWeight = Object.values(RARITY).reduce((sum, r) => sum + r.weight, 0);

    // First, pick a rarity based on weights
    let roll = Math.random() * totalWeight;
    let selectedRarity = RARITY.COMMON;

    for (const rarity of Object.values(RARITY)) {
        roll -= rarity.weight;
        if (roll <= 0) {
            selectedRarity = rarity;
            break;
        }
    }

    // Then pick a random reward of that rarity
    const rarityRewards = allRewards.filter(r => r.rarity === selectedRarity);
    if (rarityRewards.length === 0) {
        // Fallback to any reward
        return allRewards[Math.floor(Math.random() * allRewards.length)];
    }

    return rarityRewards[Math.floor(Math.random() * rarityRewards.length)];
}
