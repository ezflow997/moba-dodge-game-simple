// API endpoint to get ranked queue status and player ELO

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const MAX_ATTEMPTS_PER_PLAYER = 5;

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

        // Build queue standings (best score per player, sorted by score)
        const playerData = {};
        for (const entry of queue) {
            const name = entry.player_name;
            if (!playerData[name]) {
                playerData[name] = {
                    player_name: name,
                    score: entry.score,
                    attempts: 1
                };
            } else {
                playerData[name].attempts++;
                if (entry.score > playerData[name].score) {
                    playerData[name].score = entry.score;
                }
            }
        }

        // Sort by score descending
        const queueStandings = Object.values(playerData).sort((a, b) => b.score - a.score);
        const uniquePlayers = queueStandings.length;

        // Count players who have completed all attempts
        const playersReady = queueStandings.filter(p => p.attempts >= MAX_ATTEMPTS_PER_PLAYER).length;

        // Basic response without player info
        if (!playerName) {
            return res.status(200).json({
                queueSize: uniquePlayers,
                totalEntries: queue.length,
                playersNeeded: Math.max(0, 10 - uniquePlayers),
                queueStandings,
                playersReady,
                totalQueuedPlayers: uniquePlayers
            });
        }

        const name = playerName.trim();

        // Get player-specific info
        const eloRecord = await getPlayerElo(name);

        // Get player's queue entries
        const playerEntries = queue.filter(e => e.player_name === name);
        const isQueued = playerEntries.length > 0;
        const attemptsUsed = playerEntries.length;
        const attemptsRemaining = MAX_ATTEMPTS_PER_PLAYER - attemptsUsed;

        // Get player's best score in current queue
        const bestScore = isQueued ? Math.max(...playerEntries.map(e => e.score)) : null;

        // Get queue position (first entry)
        const queuePosition = isQueued ? queue.findIndex(e => e.player_name === name) + 1 : null;

        // Get player rank
        const playerRank = eloRecord ? await getPlayerRank(name, eloRecord.elo) : null;

        // Get recent history
        const history = await getPlayerHistory(name, 5);

        return res.status(200).json({
            queueSize: uniquePlayers,
            totalEntries: queue.length,
            playersNeeded: Math.max(0, 10 - uniquePlayers),
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
            attemptsUsed,
            attemptsRemaining,
            maxAttempts: MAX_ATTEMPTS_PER_PLAYER,
            bestScore,
            queueStandings,
            playersReady,
            totalQueuedPlayers: uniquePlayers,
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
