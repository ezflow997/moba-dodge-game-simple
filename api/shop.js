// API endpoint for shop - get inventory, purchase items, consume items

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Pricing structure by rarity name
const SINGLE_USE_PRICES = {
    'Common': 20,
    'Uncommon': 40,
    'Rare': 80,
    'Epic': 150,
    'Legendary': 300,
    'S-Tier': 600
};

const PERMANENT_PRICES = {
    'Common': 500,
    'Uncommon': 1000,
    'Rare': 2000,
    'Epic': 4000,
    'Legendary': 8000,
    'S-Tier': 15000
};

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

function decrypt(encryptedBase64) {
    if (!encryptedBase64 || typeof encryptedBase64 !== 'string' || encryptedBase64.trim() === '') {
        return null;
    }
    try {
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
        const combined = Buffer.from(encryptedBase64, 'base64');
        if (combined.length < 28) return null;
        const iv = combined.slice(0, 12);
        const authTag = combined.slice(12, 28);
        const encrypted = combined.slice(28);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    } catch (error) {
        return null;
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, storedEncrypted) {
    if (!storedEncrypted || storedEncrypted.trim() === '') return false;
    const storedHash = decrypt(storedEncrypted);
    if (!storedHash) return false;
    return storedHash === hashPassword(password);
}

// Get player from leaderboard
async function getPlayer(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

// Get player's shop points
async function getPlayerPoints(playerName) {
    const player = await getPlayer(playerName);
    return player ? (player.shop_points || 0) : 0;
}

// Update player's shop points
async function updatePlayerPoints(playerName, newPoints) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
            shop_points: newPoints,
            updated_at: new Date().toISOString()
        })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// Get player's inventory
async function getPlayerInventory(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/shop_inventory?player_name=eq.${encodeURIComponent(playerName)}`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Get or create inventory entry for a reward
async function getInventoryEntry(playerName, rewardId) {
    const url = `${SUPABASE_URL}/rest/v1/shop_inventory?player_name=eq.${encodeURIComponent(playerName)}&reward_id=eq.${encodeURIComponent(rewardId)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

// Create or update inventory entry
async function upsertInventoryEntry(playerName, rewardId, quantity, permanentUnlock) {
    const existing = await getInventoryEntry(playerName, rewardId);

    if (existing) {
        // Update existing
        const response = await fetch(`${SUPABASE_URL}/rest/v1/shop_inventory?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
                quantity: quantity,
                permanent_unlock: permanentUnlock,
                updated_at: new Date().toISOString()
            })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } else {
        // Insert new
        const response = await fetch(`${SUPABASE_URL}/rest/v1/shop_inventory`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                player_name: playerName,
                reward_id: rewardId,
                quantity: quantity,
                permanent_unlock: permanentUnlock
            })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    }
}

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!SUPABASE_URL || !SUPABASE_KEY || !ENCRYPTION_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // GET - Fetch player shop data (points + inventory)
        if (req.method === 'GET') {
            const { playerName } = req.query;

            if (!playerName) {
                return res.status(400).json({ error: 'Player name required' });
            }

            const points = await getPlayerPoints(playerName);
            const inventory = await getPlayerInventory(playerName);

            // Convert inventory to a more usable format
            const inventoryMap = {};
            for (const item of inventory) {
                inventoryMap[item.reward_id] = {
                    quantity: item.quantity || 0,
                    permanentUnlock: item.permanent_unlock || false
                };
            }

            return res.status(200).json({
                success: true,
                points,
                inventory: inventoryMap,
                prices: {
                    singleUse: SINGLE_USE_PRICES,
                    permanent: PERMANENT_PRICES
                }
            });
        }

        // POST - Purchase or consume items
        if (req.method === 'POST') {
            const { playerName, password, action, rewardId, rarityName, isPermanent, rewardIds } = req.body;

            if (!playerName || !password) {
                return res.status(400).json({ error: 'Player name and password required' });
            }

            // Verify player and password
            const player = await getPlayer(playerName);
            if (!player) {
                return res.status(401).json({ error: 'Player not found' });
            }
            if (!verifyPassword(password, player.password_hash)) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            // Handle purchase action
            if (action === 'purchase') {
                if (!rewardId || !rarityName) {
                    return res.status(400).json({ error: 'Reward ID and rarity name required' });
                }

                const prices = isPermanent ? PERMANENT_PRICES : SINGLE_USE_PRICES;
                const price = prices[rarityName];

                if (!price) {
                    return res.status(400).json({ error: 'Invalid rarity name' });
                }

                const currentPoints = player.shop_points || 0;
                if (currentPoints < price) {
                    return res.status(400).json({
                        error: 'Not enough points',
                        currentPoints,
                        required: price
                    });
                }

                // Get current inventory entry
                const existing = await getInventoryEntry(playerName, rewardId);
                const currentQuantity = existing ? (existing.quantity || 0) : 0;
                const currentPermanent = existing ? (existing.permanent_unlock || false) : false;

                // Check if already permanently unlocked
                if (isPermanent && currentPermanent) {
                    return res.status(400).json({ error: 'Already permanently unlocked' });
                }

                // Deduct points
                await updatePlayerPoints(playerName, currentPoints - price);

                // Update inventory
                if (isPermanent) {
                    await upsertInventoryEntry(playerName, rewardId, currentQuantity, true);
                } else {
                    await upsertInventoryEntry(playerName, rewardId, currentQuantity + 1, currentPermanent);
                }

                return res.status(200).json({
                    success: true,
                    message: isPermanent ? 'Permanently unlocked!' : 'Item purchased!',
                    newPoints: currentPoints - price,
                    newQuantity: isPermanent ? currentQuantity : currentQuantity + 1,
                    permanentUnlock: isPermanent || currentPermanent
                });
            }

            // Handle ad reward action (grant random reward for watching ad)
            if (action === 'ad_reward') {
                // Bonus points for watching ad (25-50)
                const bonusPoints = Math.floor(Math.random() * 26) + 25;
                const currentPoints = player.shop_points || 0;

                // Roll for rarity using weights
                const rarityWeights = [
                    { rarity: 'Common', weight: 35 },
                    { rarity: 'Uncommon', weight: 25 },
                    { rarity: 'Rare', weight: 20 },
                    { rarity: 'Epic', weight: 12 },
                    { rarity: 'Legendary', weight: 6 },
                    { rarity: 'S-Tier', weight: 2 }
                ];

                const totalWeight = rarityWeights.reduce((sum, r) => sum + r.weight, 0);
                let roll = Math.random() * totalWeight;
                let selectedRarity = 'Common';

                for (const r of rarityWeights) {
                    roll -= r.weight;
                    if (roll <= 0) {
                        selectedRarity = r.rarity;
                        break;
                    }
                }

                // Roll for permanent unlock (5% chance, but only 1% for Legendary/S-Tier)
                const permChance = (selectedRarity === 'Legendary' || selectedRarity === 'S-Tier') ? 0.01 : 0.05;
                const isPermanentReward = Math.random() < permChance;

                // Award points
                await updatePlayerPoints(playerName, currentPoints + bonusPoints);

                // Return the reward info - let frontend pick the actual reward
                // (since reward definitions are in frontend)
                return res.status(200).json({
                    success: true,
                    bonusPoints,
                    newPoints: currentPoints + bonusPoints,
                    rewardRarity: selectedRarity,
                    isPermanent: isPermanentReward
                });
            }

            // Handle grant reward action (actually add the reward to inventory)
            if (action === 'grant_reward') {
                if (!rewardId) {
                    return res.status(400).json({ error: 'Reward ID required' });
                }

                const grantPermanent = isPermanent || false;
                const existing = await getInventoryEntry(playerName, rewardId);
                const currentQuantity = existing ? (existing.quantity || 0) : 0;
                const currentPermanent = existing ? (existing.permanent_unlock || false) : false;

                // If already permanent, don't downgrade
                if (grantPermanent && !currentPermanent) {
                    await upsertInventoryEntry(playerName, rewardId, currentQuantity, true);
                } else if (!currentPermanent) {
                    await upsertInventoryEntry(playerName, rewardId, currentQuantity + 1, false);
                }

                return res.status(200).json({
                    success: true,
                    rewardId,
                    newQuantity: grantPermanent ? currentQuantity : currentQuantity + 1,
                    permanentUnlock: grantPermanent || currentPermanent
                });
            }

            // Handle consume action (use items after game)
            if (action === 'consume') {
                if (!rewardIds || !Array.isArray(rewardIds) || rewardIds.length === 0) {
                    return res.status(400).json({ error: 'Reward IDs array required' });
                }

                const consumed = [];
                const failed = [];

                for (const rid of rewardIds) {
                    const entry = await getInventoryEntry(playerName, rid);

                    if (!entry) {
                        failed.push({ rewardId: rid, reason: 'Not in inventory' });
                        continue;
                    }

                    // If permanently unlocked, no consumption needed
                    if (entry.permanent_unlock) {
                        consumed.push({ rewardId: rid, wasPermanent: true });
                        continue;
                    }

                    // Check quantity
                    if ((entry.quantity || 0) <= 0) {
                        failed.push({ rewardId: rid, reason: 'No quantity available' });
                        continue;
                    }

                    // Decrement quantity
                    await upsertInventoryEntry(playerName, rid, entry.quantity - 1, false);
                    consumed.push({ rewardId: rid, wasPermanent: false, newQuantity: entry.quantity - 1 });
                }

                return res.status(200).json({
                    success: true,
                    consumed,
                    failed
                });
            }

            return res.status(400).json({ error: 'Invalid action. Use: purchase or consume' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('shop error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
