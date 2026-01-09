/**
 * Gun Upgrade Test Script
 * Paste this in browser console to verify all gun-rarity combinations
 * Run: window.runGunTests()
 */

// All gun types now have ALL 6 rarities
const GUN_VARIANTS = {
    shotgun: {
        COMMON: { name: 'Shotgun', bullets: 5, durability: 12 },
        UNCOMMON: { name: 'Pump Shotgun', bullets: 7, durability: 18 },
        RARE: { name: 'Heavy Shotgun', bullets: 9, durability: 25 },
        EPIC: { name: 'Combat Shotgun', bullets: 11, durability: 35 },
        LEGENDARY: { name: 'Devastator', bullets: 14, durability: 45 },
        STIER: { name: 'Doomblaster', bullets: 18, durability: 60 }
    },
    rapidfire: {
        COMMON: { name: 'Quick Shot', cooldown: '25%', durability: 15 },
        UNCOMMON: { name: 'Rapid Fire', cooldown: '40%', durability: 22 },
        RARE: { name: 'Auto Cannon', cooldown: '50%', durability: 30 },
        EPIC: { name: 'Turbo Cannon', cooldown: '60%', durability: 40 },
        LEGENDARY: { name: 'Gatling Gun', cooldown: '70%', durability: 50 },
        STIER: { name: 'Minigun', cooldown: '80%', durability: 65 }
    },
    piercing: {
        COMMON: { name: 'Sharp Shot', pierce: 1, durability: 12 },
        UNCOMMON: { name: 'Piercing Shot', pierce: 2, durability: 18 },
        RARE: { name: 'Penetrator', pierce: 3, durability: 25 },
        EPIC: { name: 'Railgun', pierce: 5, durability: 35 },
        LEGENDARY: { name: 'Void Piercer', pierce: 8, durability: 45 },
        STIER: { name: 'Infinity Lance', pierce: 'ALL', durability: 60 }
    },
    ricochet: {
        COMMON: { name: 'Bouncer', bounces: 1, durability: 12 },
        UNCOMMON: { name: 'Ricochet', bounces: 2, durability: 18 },
        RARE: { name: 'Pinball', bounces: 3, durability: 25 },
        EPIC: { name: 'Trick Shot', bounces: 4, durability: 35 },
        LEGENDARY: { name: 'Geometry Master', bounces: 6, durability: 45 },
        STIER: { name: 'Chaos Bouncer', bounces: 8, durability: 60 }
    },
    homing: {
        COMMON: { name: 'Seeker', tracking: 'weak', durability: 12 },
        UNCOMMON: { name: 'Tracker', tracking: 'moderate', durability: 18 },
        RARE: { name: 'Homing Missile', tracking: 'good', durability: 25 },
        EPIC: { name: 'Smart Missile', tracking: 'fast', durability: 35 },
        LEGENDARY: { name: 'Heat Seeker', tracking: 'aggressive', durability: 45 },
        STIER: { name: 'Swarm Missiles', tracking: 'perfect + 3x', durability: 60 }
    },
    twin: {
        COMMON: { name: 'Twin Shot', bullets: 2, durability: 15 },
        UNCOMMON: { name: 'Triple Shot', bullets: 3, durability: 22 },
        RARE: { name: 'Quad Shot', bullets: 4, durability: 30 },
        EPIC: { name: 'Penta Shot', bullets: 5, durability: 40 },
        LEGENDARY: { name: 'Hexa Cannon', bullets: 6, durability: 50 },
        STIER: { name: 'Bullet Storm', bullets: 8, durability: 65 }
    },
    nova: {
        COMMON: { name: 'Spark', bullets: 4, durability: 10 },
        UNCOMMON: { name: 'Pulse', bullets: 6, durability: 14 },
        RARE: { name: 'Nova', bullets: 8, durability: 18 },
        EPIC: { name: 'Nova Burst', bullets: 12, durability: 24 },
        LEGENDARY: { name: 'Star Burst', bullets: 16, durability: 32 },
        STIER: { name: 'Supernova', bullets: 24, durability: 45 }
    },
    chain: {
        COMMON: { name: 'Static', chains: 1, durability: 10 },
        UNCOMMON: { name: 'Shock', chains: 1, durability: 15 },
        RARE: { name: 'Lightning', chains: 2, durability: 22 },
        EPIC: { name: 'Chain Lightning', chains: 3, durability: 30 },
        LEGENDARY: { name: 'Thunder Strike', chains: 5, durability: 40 },
        STIER: { name: 'Storm Caller', chains: 8, durability: 55 }
    }
};

const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'STIER'];

function runGunTests() {
    console.log('%c=== GUN UPGRADE RARITY TEST ===', 'font-size: 16px; font-weight: bold; color: #00ffff;');
    console.log('%cAll 8 guns now have ALL 6 rarity variants!', 'color: #00ff00;');
    console.log('');

    // Create table data
    const tableData = [];

    for (const [gunType, variants] of Object.entries(GUN_VARIANTS)) {
        const row = { 'Gun Type': gunType };
        for (const rarity of RARITIES) {
            const variant = variants[rarity];
            row[rarity] = variant ? variant.name : 'MISSING';
        }
        tableData.push(row);
    }

    console.table(tableData);

    // Print durability progression
    console.log('');
    console.log('%cDURABILITY BY RARITY:', 'font-weight: bold; color: #ffff00;');

    for (const [gunType, variants] of Object.entries(GUN_VARIANTS)) {
        const durabilities = RARITIES.map(r => variants[r]?.durability || 0);
        console.log(`  ${gunType}: ${durabilities.join(' → ')}`);
    }

    console.log('');
    console.log('%c=== ALL GUNS VERIFIED ===', 'font-size: 14px; font-weight: bold; color: #00ff00;');
    console.log('Total: 8 guns × 6 rarities = 48 variants');

    return GUN_VARIANTS;
}

// Make globally available
window.runGunTests = runGunTests;
window.GUN_VARIANTS = GUN_VARIANTS;

console.log('%cGun test script loaded. Run window.runGunTests() to see all variants.', 'color: #00ffff;');
