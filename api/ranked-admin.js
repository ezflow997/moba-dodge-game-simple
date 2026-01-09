// API endpoint for ranked mode admin operations (force-complete stuck queues)

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const MIN_PLAYERS_FOR_TOURNAMENT = 2;
const K_FACTOR = 32;

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

// Get or create player ELO record
async function getOrCreatePlayerElo(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/player_elo?player_name=eq.${encodeURIComponent(playerName)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.length > 0) {
        return data[0];
    }

    // Create new ELO record with default 1000
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/player_elo`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            player_name: playerName,
            elo: 1000,
            games_played: 0
        })
    });

    if (!insertResponse.ok) throw new Error(`HTTP ${insertResponse.status}`);
    const insertedData = await insertResponse.json();
    return insertedData[0];
}

// Get all queue entries
async function getAllQueueEntries() {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?order=submitted_at.asc`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Get entries for a specific queue
async function getQueueEntries(queueId) {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?queue_id=eq.${encodeURIComponent(queueId)}&order=submitted_at.asc`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Calculate expected win probability based on ELO difference
function getExpectedScore(playerElo, opponentElo) {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

// Calculate ELO changes for tournament
function calculateEloChanges(entries, eloMap) {
    const total = entries.length;
    if (total < 2) return entries.map(e => ({ ...e, placement: 1, eloChange: 0 }));

    const avgScore = entries.reduce((sum, e) => sum + e.score, 0) / total;
    const maxScore = entries[0].score;
    const minScore = entries[total - 1].score;
    const scoreRange = maxScore - minScore || 1;

    const avgElo = entries.reduce((sum, e) => sum + (eloMap[e.player_name] || 1000), 0) / total;

    return entries.map((entry, index) => {
        const placement = index + 1;
        const playerElo = eloMap[entry.player_name] || 1000;
        const expectedScore = getExpectedScore(playerElo, avgElo);
        const actualScore = (total - index - 1) / (total - 1);
        const scoreDeviation = (entry.score - avgScore) / scoreRange;
        const performanceFactor = 1 + (scoreDeviation * 0.5);
        const baseChange = K_FACTOR * (actualScore - expectedScore);
        const eloChange = Math.round(baseChange * performanceFactor);

        return {
            ...entry,
            placement,
            eloChange,
            playerElo
        };
    });
}

// Update opponent tracking after a match
async function updateOpponentTracking(playerName, opponentName) {
    const eloRecord = await getOrCreatePlayerElo(playerName);

    let newConsecutiveCount;
    if (eloRecord.last_opponent === opponentName) {
        newConsecutiveCount = (eloRecord.consecutive_opponent_count || 0) + 1;
    } else {
        newConsecutiveCount = 1;
    }

    await fetch(`${SUPABASE_URL}/rest/v1/player_elo?player_name=eq.${encodeURIComponent(playerName)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
            last_opponent: opponentName,
            consecutive_opponent_count: newConsecutiveCount
        })
    });

    return newConsecutiveCount;
}

// Force resolve a tournament
async function forceResolveTournament(allEntries) {
    const tournamentId = crypto.randomUUID();

    // Sort entries by score descending
    const sortedEntries = [...allEntries].sort((a, b) => b.score - a.score);

    // Fetch all player ELO records
    const eloRecordMap = {};
    for (const entry of sortedEntries) {
        const eloRecord = await getOrCreatePlayerElo(entry.player_name);
        eloRecordMap[entry.player_name] = eloRecord;
    }

    // Create simple elo map for calculation function
    const eloMap = {};
    for (const [name, record] of Object.entries(eloRecordMap)) {
        eloMap[name] = record.elo;
    }

    // Calculate ELO changes
    const results = calculateEloChanges(sortedEntries, eloMap);
    const totalPlayers = results.length;

    // Process each player
    for (const result of results) {
        const playerEloRecord = eloRecordMap[result.player_name];
        const eloBefore = playerEloRecord.elo;
        const eloAfter = eloBefore + result.eloChange;

        // Update player ELO
        await fetch(`${SUPABASE_URL}/rest/v1/player_elo?player_name=eq.${encodeURIComponent(result.player_name)}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
                elo: eloAfter,
                games_played: (playerEloRecord.games_played || 0) + 1,
                updated_at: new Date().toISOString()
            })
        });

        // Upsert history record
        const historyCheck = await fetch(`${SUPABASE_URL}/rest/v1/ranked_history?player_name=eq.${encodeURIComponent(result.player_name)}&limit=1`, {
            method: 'GET',
            headers: getHeaders()
        });
        const existingHistory = await historyCheck.json();

        const historyData = {
            tournament_id: tournamentId,
            player_name: result.player_name,
            score: result.score,
            placement: result.placement,
            total_players: totalPlayers,
            elo_before: eloBefore,
            elo_after: eloAfter,
            elo_change: result.eloChange,
            resolved_at: new Date().toISOString()
        };

        if (existingHistory.length > 0) {
            await fetch(`${SUPABASE_URL}/rest/v1/ranked_history?player_name=eq.${encodeURIComponent(result.player_name)}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(historyData)
            });
        } else {
            await fetch(`${SUPABASE_URL}/rest/v1/ranked_history`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(historyData)
            });
        }

        result.eloBefore = eloBefore;
        result.eloAfter = eloAfter;
    }

    // Delete ALL queue entries after resolution
    for (const entry of allEntries) {
        await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue?id=eq.${entry.id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    }

    // Track opponents for consecutive match limit (for 2-player queues)
    if (totalPlayers === 2) {
        const player1 = results[0].player_name;
        const player2 = results[1].player_name;
        await updateOpponentTracking(player1, player2);
        await updateOpponentTracking(player2, player1);
    }

    return {
        tournamentId,
        results,
        totalPlayers
    };
}

// Cancel a queue without resolving (delete all entries)
async function cancelQueue(entries) {
    for (const entry of entries) {
        await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue?id=eq.${entry.id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    }
    return { cancelled: true, entriesRemoved: entries.length };
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

    if (!ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'Admin not configured' });
    }

    try {
        const { adminPassword, action, queueId } = req.body;

        // Verify admin password
        if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Invalid admin password' });
        }

        // Get all queues for reference
        const allEntries = await getAllQueueEntries();
        const queues = {};
        for (const entry of allEntries) {
            const qid = entry.queue_id || 'default';
            if (!queues[qid]) queues[qid] = [];
            queues[qid].push(entry);
        }

        if (action === 'list') {
            // List all queues with their status
            const queueSummary = Object.entries(queues).map(([qid, entries]) => ({
                queueId: qid,
                playerCount: entries.length,
                players: entries.map(e => ({
                    name: e.player_name,
                    score: e.score,
                    attempts: e.attempts || 1
                })),
                canResolve: entries.length >= MIN_PLAYERS_FOR_TOURNAMENT
            }));

            return res.status(200).json({
                success: true,
                totalQueues: Object.keys(queues).length,
                totalPlayers: allEntries.length,
                queues: queueSummary
            });
        }

        if (action === 'force_resolve') {
            // Force resolve a specific queue
            if (!queueId) {
                return res.status(400).json({ error: 'Queue ID required for force_resolve' });
            }

            const queueEntries = queues[queueId];
            if (!queueEntries || queueEntries.length === 0) {
                return res.status(404).json({ error: 'Queue not found or empty' });
            }

            if (queueEntries.length < MIN_PLAYERS_FOR_TOURNAMENT) {
                return res.status(400).json({
                    error: 'Cannot resolve queue with less than minimum players',
                    playerCount: queueEntries.length,
                    minRequired: MIN_PLAYERS_FOR_TOURNAMENT
                });
            }

            const result = await forceResolveTournament(queueEntries);
            return res.status(200).json({
                success: true,
                action: 'force_resolve',
                queueId,
                tournamentId: result.tournamentId,
                totalPlayers: result.totalPlayers,
                results: result.results.map(r => ({
                    playerName: r.player_name,
                    placement: r.placement,
                    score: r.score,
                    eloChange: r.eloChange,
                    eloBefore: r.eloBefore,
                    eloAfter: r.eloAfter
                }))
            });
        }

        if (action === 'force_resolve_all') {
            // Force resolve ALL queues that have minimum players
            const resolved = [];
            const skipped = [];

            for (const [qid, entries] of Object.entries(queues)) {
                if (entries.length >= MIN_PLAYERS_FOR_TOURNAMENT) {
                    const result = await forceResolveTournament(entries);
                    resolved.push({
                        queueId: qid,
                        tournamentId: result.tournamentId,
                        totalPlayers: result.totalPlayers
                    });
                } else {
                    skipped.push({
                        queueId: qid,
                        playerCount: entries.length,
                        reason: 'Below minimum players'
                    });
                }
            }

            return res.status(200).json({
                success: true,
                action: 'force_resolve_all',
                resolved,
                skipped
            });
        }

        if (action === 'cancel_queue') {
            // Cancel a specific queue without resolving
            if (!queueId) {
                return res.status(400).json({ error: 'Queue ID required for cancel_queue' });
            }

            const queueEntries = queues[queueId];
            if (!queueEntries || queueEntries.length === 0) {
                return res.status(404).json({ error: 'Queue not found or empty' });
            }

            const result = await cancelQueue(queueEntries);
            return res.status(200).json({
                success: true,
                action: 'cancel_queue',
                queueId,
                entriesRemoved: result.entriesRemoved
            });
        }

        if (action === 'clear_all') {
            // Clear all queues without resolving
            let totalRemoved = 0;
            for (const entries of Object.values(queues)) {
                await cancelQueue(entries);
                totalRemoved += entries.length;
            }

            return res.status(200).json({
                success: true,
                action: 'clear_all',
                queuesCleared: Object.keys(queues).length,
                entriesRemoved: totalRemoved
            });
        }

        return res.status(400).json({ error: 'Invalid action. Use: list, force_resolve, force_resolve_all, cancel_queue, or clear_all' });
    } catch (error) {
        console.error('ranked-admin error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
