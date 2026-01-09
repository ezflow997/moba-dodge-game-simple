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

// Get all queue entries (entries are deleted after resolution)
async function getAllQueueEntries() {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?order=submitted_at.asc`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Group queue entries by queue_id
function groupByQueue(entries) {
    const queues = {};
    for (const entry of entries) {
        const qid = entry.queue_id || 'default';
        if (!queues[qid]) queues[qid] = [];
        queues[qid].push(entry);
    }
    return queues;
}

// Find player's queue or an available queue
function findPlayerQueue(queues, playerName) {
    // First check if player is in any queue
    for (const [queueId, entries] of Object.entries(queues)) {
        if (entries.some(e => e.player_name === playerName)) {
            return { queueId, entries, isPlayerQueue: true };
        }
    }

    // Find an available queue (< 10 players)
    for (const [queueId, entries] of Object.entries(queues)) {
        if (entries.length < 10) {
            return { queueId, entries, isPlayerQueue: false };
        }
    }

    // All queues full, would create a new one
    return { queueId: null, entries: [], isPlayerQueue: false };
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

        // Get all queue entries
        const allEntries = await getAllQueueEntries();
        const queues = groupByQueue(allEntries);
        const totalQueues = Object.keys(queues).length;

        // Basic response without player info - show first queue (available or full)
        if (!playerName) {
            // Get first queue (prefer available, but show full if none available)
            const queueList = Object.values(queues);
            let targetQueue = queueList.find(entries => entries.length < 10) || queueList[0] || [];

            const queueStandings = targetQueue
                .map(entry => ({
                    player_name: entry.player_name,
                    score: entry.score,
                    attempts: entry.attempts || 1
                }))
                .sort((a, b) => b.score - a.score);

            const uniquePlayers = targetQueue.length;
            const playersReady = targetQueue.filter(p => (p.attempts || 1) >= MAX_ATTEMPTS_PER_PLAYER).length;

            return res.status(200).json({
                queueSize: uniquePlayers,
                totalEntries: uniquePlayers,
                playersNeeded: Math.max(0, 10 - uniquePlayers),
                queueStandings,
                playersReady,
                totalQueuedPlayers: uniquePlayers,
                totalQueues
            });
        }

        const name = playerName.trim();

        // Get player-specific info
        const eloRecord = await getPlayerElo(name);

        // Find player's queue or an available one
        const { queueId, entries: queue, isPlayerQueue } = findPlayerQueue(queues, name);

        // Build queue standings sorted by score
        const queueStandings = queue
            .map(entry => ({
                player_name: entry.player_name,
                score: entry.score,
                attempts: entry.attempts || 1
            }))
            .sort((a, b) => b.score - a.score);

        const uniquePlayers = queue.length;
        const playersReady = queue.filter(p => (p.attempts || 1) >= MAX_ATTEMPTS_PER_PLAYER).length;

        // Get player's queue entry
        const playerEntry = queue.find(e => e.player_name === name);
        const isQueued = !!playerEntry;
        const attemptsUsed = playerEntry ? (playerEntry.attempts || 1) : 0;
        const attemptsRemaining = MAX_ATTEMPTS_PER_PLAYER - attemptsUsed;

        // Get player's best score in current queue
        const bestScore = playerEntry ? playerEntry.score : null;

        // Get queue position (by score ranking)
        const queuePosition = isQueued ? queueStandings.findIndex(e => e.player_name === name) + 1 : null;

        // Get player rank
        const playerRank = eloRecord ? await getPlayerRank(name, eloRecord.elo) : null;

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
            queueId,
            totalQueues
        });
    } catch (error) {
        console.error('ranked-status error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
