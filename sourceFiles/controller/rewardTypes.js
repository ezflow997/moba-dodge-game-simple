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
        description: '7 bullets in a wide cone, 50% range',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'shotgun',
        durability: 15,
        bulletCount: 7,
        spreadAngle: 45,
        rangeMultiplier: 0.5
    },
    SHOTGUN_RARE: {
        id: 'shotgun_rare',
        name: 'Heavy Shotgun',
        description: '9 bullets in a wide cone, 60% range',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'shotgun',
        durability: 30,
        bulletCount: 9,
        spreadAngle: 50,
        rangeMultiplier: 0.6
    },
    SHOTGUN_LEGENDARY: {
        id: 'shotgun_legendary',
        name: 'Devastator Shotgun',
        description: '12 bullets in a massive cone, 70% range',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'shotgun',
        durability: 50,
        bulletCount: 12,
        spreadAngle: 60,
        rangeMultiplier: 0.7
    },

    // Rapid Fire - Fast shooting
    RAPIDFIRE_UNCOMMON: {
        id: 'rapidfire_uncommon',
        name: 'Rapid Fire',
        description: '50% faster shooting',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'rapidfire',
        durability: 25,
        cooldownMultiplier: 0.5
    },
    RAPIDFIRE_EPIC: {
        id: 'rapidfire_epic',
        name: 'Turbo Cannon',
        description: '65% faster shooting',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'rapidfire',
        durability: 45,
        cooldownMultiplier: 0.35
    },
    RAPIDFIRE_STIER: {
        id: 'rapidfire_stier',
        name: 'Minigun',
        description: '80% faster shooting, dual bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'rapidfire',
        durability: 60,
        cooldownMultiplier: 0.2,
        bulletCount: 2
    },

    // Piercing - Goes through enemies
    PIERCING_RARE: {
        id: 'piercing_rare',
        name: 'Piercing Shot',
        description: 'Bullets pass through enemies',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'piercing',
        durability: 20,
        pierceCount: 2
    },
    PIERCING_LEGENDARY: {
        id: 'piercing_legendary',
        name: 'Void Piercer',
        description: 'Bullets pierce through all enemies',
        category: CATEGORY.GUN,
        rarity: RARITY.LEGENDARY,
        gunType: 'piercing',
        durability: 40,
        pierceCount: 999
    },

    // Ricochet - Bounces off walls
    RICOCHET_UNCOMMON: {
        id: 'ricochet_uncommon',
        name: 'Ricochet',
        description: 'Bullets bounce once off walls',
        category: CATEGORY.GUN,
        rarity: RARITY.UNCOMMON,
        gunType: 'ricochet',
        durability: 22,
        bounceCount: 1
    },
    RICOCHET_EPIC: {
        id: 'ricochet_epic',
        name: 'Pinball',
        description: 'Bullets bounce 3 times off walls',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'ricochet',
        durability: 35,
        bounceCount: 3
    },
    RICOCHET_STIER: {
        id: 'ricochet_stier',
        name: 'Chaos Bouncer',
        description: 'Bullets bounce 5 times, +50% speed',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'ricochet',
        durability: 45,
        bounceCount: 5,
        speedMultiplier: 1.5
    },

    // Homing - Tracks enemies
    HOMING_RARE: {
        id: 'homing_rare',
        name: 'Homing Missile',
        description: 'Slow bullets that track enemies',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'homing',
        durability: 18,
        turnSpeed: 0.03,
        speedMultiplier: 0.6
    },
    HOMING_EPIC: {
        id: 'homing_epic',
        name: 'Smart Missile',
        description: 'Fast tracking missiles',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'homing',
        durability: 30,
        turnSpeed: 0.05,
        speedMultiplier: 0.8
    },

    // Twin Cannons - Double shots
    TWIN_COMMON: {
        id: 'twin_common',
        name: 'Twin Shot',
        description: 'Fire 2 parallel bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.COMMON,
        gunType: 'twin',
        durability: 30,
        bulletCount: 2,
        spacing: 15
    },
    TWIN_RARE: {
        id: 'twin_rare',
        name: 'Triple Shot',
        description: 'Fire 3 parallel bullets',
        category: CATEGORY.GUN,
        rarity: RARITY.RARE,
        gunType: 'twin',
        durability: 45,
        bulletCount: 3,
        spacing: 12
    },

    // Nova - 360 degree burst
    NOVA_EPIC: {
        id: 'nova_epic',
        name: 'Nova Burst',
        description: '12 bullets in all directions',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'nova',
        durability: 12,
        bulletCount: 12
    },
    NOVA_STIER: {
        id: 'nova_stier',
        name: 'Supernova',
        description: '24 bullets in all directions, double range',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'nova',
        durability: 20,
        bulletCount: 24,
        rangeMultiplier: 2.0
    },

    // Chain Lightning - Jumps between enemies
    CHAIN_EPIC: {
        id: 'chain_epic',
        name: 'Chain Lightning',
        description: 'Hits jump to 2 nearby enemies',
        category: CATEGORY.GUN,
        rarity: RARITY.EPIC,
        gunType: 'chain',
        durability: 15,
        chainCount: 2,
        chainRange: 150
    },
    CHAIN_STIER: {
        id: 'chain_stier',
        name: 'Storm Caller',
        description: 'Hits jump to 4 enemies, larger range',
        category: CATEGORY.GUN,
        rarity: RARITY.STIER,
        gunType: 'chain',
        durability: 30,
        chainCount: 4,
        chainRange: 250
    },

    // ============ COOLDOWN REDUCTIONS ============

    // Q Cooldown
    Q_CD_COMMON: {
        id: 'q_cd_common',
        name: 'Quick Trigger',
        description: '-15% Q cooldown for 60s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.COMMON,
        ability: 'q',
        reduction: 0.15,
        duration: 60000
    },
    Q_CD_RARE: {
        id: 'q_cd_rare',
        name: 'Rapid Trigger',
        description: '-30% Q cooldown for 90s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.RARE,
        ability: 'q',
        reduction: 0.30,
        duration: 90000
    },
    Q_CD_LEGENDARY: {
        id: 'q_cd_legendary',
        name: 'Instant Trigger',
        description: '-50% Q cooldown permanently',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.LEGENDARY,
        ability: 'q',
        reduction: 0.50,
        duration: -1 // permanent
    },

    // E Cooldown
    E_CD_UNCOMMON: {
        id: 'e_cd_uncommon',
        name: 'Swift Dash',
        description: '-20% E cooldown for 45s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.UNCOMMON,
        ability: 'e',
        reduction: 0.20,
        duration: 45000
    },
    E_CD_EPIC: {
        id: 'e_cd_epic',
        name: 'Flash Step',
        description: '-40% E cooldown for 120s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.EPIC,
        ability: 'e',
        reduction: 0.40,
        duration: 120000
    },
    E_CD_STIER: {
        id: 'e_cd_stier',
        name: 'Blink Master',
        description: '-60% E cooldown permanently',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.STIER,
        ability: 'e',
        reduction: 0.60,
        duration: -1
    },

    // F Cooldown
    F_CD_RARE: {
        id: 'f_cd_rare',
        name: 'Ultimate Haste',
        description: '-25% F cooldown for 60s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.RARE,
        ability: 'f',
        reduction: 0.25,
        duration: 60000
    },
    F_CD_LEGENDARY: {
        id: 'f_cd_legendary',
        name: 'Ascension',
        description: '-50% F cooldown for 180s',
        category: CATEGORY.COOLDOWN,
        rarity: RARITY.LEGENDARY,
        ability: 'f',
        reduction: 0.50,
        duration: 180000
    },

    // ============ SURVIVABILITY ============

    EXTRA_LIFE: {
        id: 'extra_life',
        name: 'Second Chance',
        description: 'Survive one fatal hit',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.EPIC,
        lives: 1
    },
    EXTRA_LIFE_STIER: {
        id: 'extra_life_stier',
        name: 'Phoenix Soul',
        description: 'Survive two fatal hits',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.STIER,
        lives: 2
    },
    SHIELD_RARE: {
        id: 'shield_rare',
        name: 'Energy Shield',
        description: 'Block 1 projectile (30s)',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.RARE,
        blockCount: 1,
        duration: 30000
    },
    SHIELD_LEGENDARY: {
        id: 'shield_legendary',
        name: 'Barrier',
        description: 'Block 3 projectiles (45s)',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.LEGENDARY,
        blockCount: 3,
        duration: 45000
    },
    SHRINK_UNCOMMON: {
        id: 'shrink_uncommon',
        name: 'Compact Form',
        description: '25% smaller hitbox for 45s',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.UNCOMMON,
        sizeReduction: 0.25,
        duration: 45000
    },
    SHRINK_EPIC: {
        id: 'shrink_epic',
        name: 'Micro Mode',
        description: '40% smaller hitbox for 60s',
        category: CATEGORY.SURVIVABILITY,
        rarity: RARITY.EPIC,
        sizeReduction: 0.40,
        duration: 60000
    },

    // ============ MOVEMENT ============

    SPEED_COMMON: {
        id: 'speed_common',
        name: 'Quick Feet',
        description: '+15% speed for 30s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.COMMON,
        speedBoost: 0.15,
        duration: 30000
    },
    SPEED_RARE: {
        id: 'speed_rare',
        name: 'Swift Runner',
        description: '+25% speed for 60s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.RARE,
        speedBoost: 0.25,
        duration: 60000
    },
    SPEED_LEGENDARY: {
        id: 'speed_legendary',
        name: 'Velocity',
        description: '+40% speed permanently',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.LEGENDARY,
        speedBoost: 0.40,
        duration: -1
    },
    DASH_DISTANCE_UNCOMMON: {
        id: 'dash_distance_uncommon',
        name: 'Extended Dash',
        description: '+50% dash distance for 60s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.UNCOMMON,
        dashBoost: 0.50,
        duration: 60000
    },
    DASH_DISTANCE_EPIC: {
        id: 'dash_distance_epic',
        name: 'Warp Dash',
        description: '+100% dash distance for 90s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.EPIC,
        dashBoost: 1.0,
        duration: 90000
    },
    GHOST_LEGENDARY: {
        id: 'ghost_legendary',
        name: 'Ghost Mode',
        description: 'Phase through enemies for 12s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.LEGENDARY,
        duration: 12000,
        phaseThrough: true
    },
    GHOST_STIER: {
        id: 'ghost_stier',
        name: 'Ethereal Form',
        description: 'Phase through enemies for 25s',
        category: CATEGORY.MOVEMENT,
        rarity: RARITY.STIER,
        duration: 25000,
        phaseThrough: true
    },

    // ============ OFFENSE ============

    SCORE_MULT_UNCOMMON: {
        id: 'score_mult_uncommon',
        name: 'Score Boost',
        description: '1.5x score multiplier for 30s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.UNCOMMON,
        scoreMultiplier: 1.5,
        duration: 30000
    },
    SCORE_MULT_EPIC: {
        id: 'score_mult_epic',
        name: 'Jackpot',
        description: '2x score multiplier for 45s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.EPIC,
        scoreMultiplier: 2.0,
        duration: 45000
    },
    SCORE_MULT_STIER: {
        id: 'score_mult_stier',
        name: 'Golden Touch',
        description: '3x score multiplier for 60s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.STIER,
        scoreMultiplier: 3.0,
        duration: 60000
    },
    BULLET_SIZE_COMMON: {
        id: 'bullet_size_common',
        name: 'Big Bullets',
        description: '+50% bullet size for 30s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.COMMON,
        sizeBoost: 0.50,
        duration: 30000
    },
    BULLET_SIZE_RARE: {
        id: 'bullet_size_rare',
        name: 'Massive Bullets',
        description: '+100% bullet size for 45s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.RARE,
        sizeBoost: 1.0,
        duration: 45000
    },
    RANGE_UNCOMMON: {
        id: 'range_uncommon',
        name: 'Long Shot',
        description: '+50% bullet range for 45s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.UNCOMMON,
        rangeBoost: 0.50,
        duration: 45000
    },
    RANGE_EPIC: {
        id: 'range_epic',
        name: 'Sniper',
        description: '+100% bullet range for 60s',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.EPIC,
        rangeBoost: 1.0,
        duration: 60000
    },
    DAMAGE_AURA_RARE: {
        id: 'damage_aura_rare',
        name: 'Damage Aura',
        description: 'Nearby enemies take damage (45s)',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.RARE,
        auraRadius: 100,
        auraDamage: 1,
        duration: 45000
    },
    DAMAGE_AURA_LEGENDARY: {
        id: 'damage_aura_legendary',
        name: 'Death Field',
        description: 'Large damage aura (60s)',
        category: CATEGORY.OFFENSE,
        rarity: RARITY.LEGENDARY,
        auraRadius: 180,
        auraDamage: 2,
        duration: 60000
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
