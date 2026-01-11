// API endpoint for banning/unbanning players (admin only)

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Verify admin password
function verifyAdminPassword(password) {
    if (!password || !ADMIN_PASSWORD) return false;
    return hashPassword(password) === hashPassword(ADMIN_PASSWORD);
}

// Get player from leaderboard table
async function getPlayer(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

// Update player's banned status
async function setBannedStatus(playerName, banned) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
            banned: banned,
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update ban status: ${errorText}`);
    }

    return await response.json();
}

// If player was banned and is a ranked champion, replace them with the previous month's winner
async function handleChampionBan(playerName) {
    // Check if the player is in the ranked_champions table
    const champUrl = `${SUPABASE_URL}/rest/v1/ranked_champions?player_name=eq.${encodeURIComponent(playerName)}`;
    const champResponse = await fetch(champUrl, { method: 'GET', headers: getHeaders() });

    if (!champResponse.ok) return;

    const champions = await champResponse.json();
    if (champions.length === 0) return;

    // For each season this player won, we need to find the runner-up from that season's history
    // Since we don't have detailed history, we'll just remove them and the slot stays empty
    // (or could be filled by next month's winner later)
    // For now, we just delete their champion entries
    for (const champ of champions) {
        await fetch(`${SUPABASE_URL}/rest/v1/ranked_champions?id=eq.${champ.id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        console.log(`[BAN] Removed champion entry for ${playerName} (season: ${champ.season_month})`);
    }
}

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { playerName, adminPassword, action } = req.body;

        // Validate required fields
        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name required' });
        }

        if (!adminPassword) {
            return res.status(400).json({ error: 'Admin password required' });
        }

        if (!verifyAdminPassword(adminPassword)) {
            return res.status(401).json({ error: 'Invalid admin password' });
        }

        if (action !== 'ban' && action !== 'unban') {
            return res.status(400).json({ error: 'Action must be "ban" or "unban"' });
        }

        const name = playerName.trim();

        // Check if player exists
        const player = await getPlayer(name);
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const newBannedStatus = action === 'ban';

        // Update ban status
        await setBannedStatus(name, newBannedStatus);

        // If banning, handle champion removal
        if (newBannedStatus) {
            await handleChampionBan(name);
        }

        console.log(`[ADMIN] ${action === 'ban' ? 'Banned' : 'Unbanned'} player: ${name}`);

        return res.status(200).json({
            success: true,
            message: `Player ${name} has been ${action === 'ban' ? 'banned' : 'unbanned'}`,
            banned: newBannedStatus
        });
    } catch (error) {
        console.error('admin-ban error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
