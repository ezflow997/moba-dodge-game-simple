// API endpoint to get ranked queue status and player ELO

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };
}

// Get player ELO record
async function getPlayerElo(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/player_elo?player_name=eq.${encodeURIComponent(playerName)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

// Get all unresolved queue entries
async function getUnresolvedQueue() {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?resolved=eq.false&order=submitted_at.asc`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Get player's recent ranked history
async function getPlayerHistory(playerName, limit = 5) {
    const url = `${SUPABASE_URL}/rest/v1/ranked_history?player_name=eq.${encodeURIComponent(playerName)}&order=resolved_at.desc&limit=${limit}`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Get player's rank in ELO leaderboard
async function getPlayerRank(playerName, playerElo) {
    if (!playerElo) return null;

    // Count players with higher ELO
    const url = `${SUPABASE_URL}/rest/v1/player_elo?elo=gt.${playerElo}&select=id`;
    const response = await fetch(url, { method: 'GET', headers: { ...getHeaders(), 'Prefer': 'count=exact' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const countHeader = response.headers.get('content-range');
    if (countHeader) {
        const match = countHeader.match(/\/(\d+)/);
        if (match) {
            return parseInt(match[1]) + 1; // +1 because we counted those higher
        }
    }
    return 1;
}

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { playerName } = req.query;

        // Get current queue
        const queue = await getUnresolvedQueue();
        const queueSize = queue.length;

        // Basic response without player info
        if (!playerName) {
            return res.status(200).json({
                queueSize,
                playersNeeded: Math.max(0, 10 - queueSize)
            });
        }

        const name = playerName.trim();

        // Get player-specific info
        const eloRecord = await getPlayerElo(name);
        const isQueued = queue.some(e => e.player_name === name);
        const queuePosition = isQueued ? queue.findIndex(e => e.player_name === name) + 1 : null;

        // Get player rank
        const playerRank = eloRecord ? await getPlayerRank(name, eloRecord.elo) : null;

        // Get recent history
        const history = await getPlayerHistory(name, 5);

        return res.status(200).json({
            queueSize,
            playersNeeded: Math.max(0, 10 - queueSize),
            player: eloRecord ? {
                elo: eloRecord.elo,
                gamesPlayed: eloRecord.games_played,
                rank: playerRank
            } : {
                elo: 1000,
                gamesPlayed: 0,
                rank: null,
                isNew: true
            },
            isQueued,
            queuePosition,
            recentHistory: history.map(h => ({
                placement: h.placement,
                totalPlayers: h.total_players,
                score: h.score,
                eloChange: h.elo_change,
                date: h.resolved_at
            }))
        });
    } catch (error) {
        console.error('ranked-status error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
