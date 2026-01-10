// API endpoint to get ranked queue status and player ELO
// Also auto-resolves timed-out queues when checked

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const MIN_PLAYERS_FOR_TOURNAMENT = 2;
const MAX_ATTEMPTS_PER_PLAYER = 5;
const QUEUE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const K_FACTOR = 32; // ELO sensitivity factor
const DEFAULT_ELO = 1000; // Starting ELO for all players

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

// Get current year-month string (e.g., "2026-01")
function getCurrentYearMonth() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Get the last ELO reset month from system settings
async function getLastResetMonth() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/system_settings?key=eq.last_elo_reset_month&limit=1`;
        const response = await fetch(url, { method: 'GET', headers: getHeaders() });
        if (!response.ok) return null;
        const data = await response.json();
        return data.length > 0 ? data[0].value : null;
    } catch (error) {
        console.error('getLastResetMonth error:', error);
        return null;
    }
}

// Update the last ELO reset month in system settings
async function setLastResetMonth(yearMonth) {
    try {
        // Try to update first
        const updateUrl = `${SUPABASE_URL}/rest/v1/system_settings?key=eq.last_elo_reset_month`;
        const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: { ...getHeaders(), 'Prefer': 'return=representation' },
            body: JSON.stringify({ value: yearMonth, updated_at: new Date().toISOString() })
        });

        // If no rows updated, insert new record
        if (updateResponse.ok) {
            const updated = await updateResponse.json();
            if (updated.length === 0) {
                await fetch(`${SUPABASE_URL}/rest/v1/system_settings`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ key: 'last_elo_reset_month', value: yearMonth })
                });
            }
        }
    } catch (error) {
        console.error('setLastResetMonth error:', error);
    }
}

// Get the current #1 ranked player (highest ELO with at least 1 game played)
async function getCurrentChampion() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/player_elo?games_played=gt.0&order=elo.desc,games_played.desc&limit=1`;
        const response = await fetch(url, { method: 'GET', headers: getHeaders() });
        if (!response.ok) return null;
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('getCurrentChampion error:', error);
        return null;
    }
}

// Save the monthly champion to the champions table
async function saveChampion(playerName, elo, gamesPlayed, wins, yearMonth) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ranked_champions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                player_name: playerName,
                final_elo: elo,
                games_played: gamesPlayed,
                wins: wins,
                season_month: yearMonth,
                awarded_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log(`[CHAMPION] ${playerName} saved as champion for ${yearMonth} with ELO ${elo}`);
        return true;
    } catch (error) {
        console.error('saveChampion error:', error);
        return false;
    }
}

// Reset all player ELO to default (1000) for monthly reset
async function resetAllPlayerElo() {
    try {
        // Reset all player_elo records to default ELO, reset games_played and wins
        const url = `${SUPABASE_URL}/rest/v1/player_elo`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { ...getHeaders(), 'Prefer': 'return=minimal' },
            body: JSON.stringify({
                elo: DEFAULT_ELO,
                games_played: 0,
                wins: 0,
                last_opponent: null,
                consecutive_opponent_count: 0,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('[ELO RESET] All player ELO reset to', DEFAULT_ELO);
        return true;
    } catch (error) {
        console.error('resetAllPlayerElo error:', error);
        return false;
    }
}

// Check if monthly reset is needed and perform it
async function checkAndPerformMonthlyReset() {
    const currentMonth = getCurrentYearMonth();
    const lastResetMonth = await getLastResetMonth();

    // Only proceed if we have a recorded last reset month AND it's different from current
    // This prevents saving champions on first run or if system_settings table doesn't exist
    if (lastResetMonth && lastResetMonth !== currentMonth) {
        console.log(`[ELO RESET] New month detected. Last reset: ${lastResetMonth}, Current: ${currentMonth}`);

        // Capture the champion BEFORE resetting (use last recorded month for the award)
        const champion = await getCurrentChampion();
        if (champion && champion.games_played > 0) {
            await saveChampion(
                champion.player_name,
                champion.elo,
                champion.games_played,
                champion.wins || 0,
                lastResetMonth
            );
        }

        const resetSuccess = await resetAllPlayerElo();
        if (resetSuccess) {
            await setLastResetMonth(currentMonth);
            console.log(`[ELO RESET] Monthly reset complete for ${currentMonth}`);
            return true;
        }
    } else if (!lastResetMonth) {
        // First time setup - just record current month without resetting or saving champion
        console.log(`[ELO RESET] First time setup - recording current month: ${currentMonth}`);
        await setLastResetMonth(currentMonth);
    }

    return false;
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

    // Find an available queue (< MIN_PLAYERS_FOR_TOURNAMENT)
    for (const [queueId, entries] of Object.entries(queues)) {
        if (entries.length < MIN_PLAYERS_FOR_TOURNAMENT) {
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

// Get or create player ELO record (for auto-resolution)
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
        headers: { ...getHeaders(), 'Prefer': 'return=representation' },
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

        return { ...entry, placement, eloChange, playerElo };
    });
}

// Auto-resolve a timed-out tournament
async function autoResolveTournament(queueEntries) {
    const tournamentId = crypto.randomUUID();

    // Sort entries by score descending
    const sortedEntries = [...queueEntries].sort((a, b) => b.score - a.score);

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
    for (const entry of queueEntries) {
        await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue?id=eq.${entry.id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    }

    console.log(`[RANKED AUTO-RESOLVE] Resolved tournament ${tournamentId} with ${totalPlayers} players`);

    return { tournamentId, results, totalPlayers };
}

// Check if a queue has timed out and should be resolved
function isQueueTimedOut(entries) {
    if (entries.length < MIN_PLAYERS_FOR_TOURNAMENT) return false;

    const sortedByTime = [...entries].sort((a, b) =>
        new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );
    const triggerEntry = sortedByTime[MIN_PLAYERS_FOR_TOURNAMENT - 1];
    const triggerTime = new Date(triggerEntry.submitted_at).getTime();
    const queueAge = Date.now() - triggerTime;

    return queueAge >= QUEUE_TIMEOUT_MS;
}

// Check and auto-resolve any timed-out queues
async function checkAndResolveTimedOutQueues(queues) {
    const resolved = [];

    for (const [queueId, entries] of Object.entries(queues)) {
        if (isQueueTimedOut(entries)) {
            try {
                const result = await autoResolveTournament(entries);
                resolved.push({
                    queueId,
                    tournamentId: result.tournamentId,
                    totalPlayers: result.totalPlayers
                });
            } catch (error) {
                console.error(`[RANKED AUTO-RESOLVE] Failed to resolve queue ${queueId}:`, error);
            }
        }
    }

    return resolved;
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
        // Check for monthly ELO reset at the start of each status check
        await checkAndPerformMonthlyReset();

        const { playerName } = req.query;

        // Get all queue entries
        let allEntries = await getAllQueueEntries();
        let queues = groupByQueue(allEntries);

        // Auto-resolve any timed-out queues before returning status
        const resolvedQueues = await checkAndResolveTimedOutQueues(queues);
        if (resolvedQueues.length > 0) {
            console.log(`[RANKED STATUS] Auto-resolved ${resolvedQueues.length} timed-out queue(s)`);
            // Re-fetch entries after resolution
            allEntries = await getAllQueueEntries();
            queues = groupByQueue(allEntries);
        }

        const totalQueues = Object.keys(queues).length;
        const totalPlayersAllQueues = allEntries.length;

        // Build all queues summary for the queue list view
        const allQueuesSummary = Object.entries(queues).map(([queueId, entries]) => {
            // Only calculate time remaining if queue has minimum players
            // Timer starts from when minimum players was reached (Nth oldest entry)
            let timeRemaining = null;
            if (entries.length >= MIN_PLAYERS_FOR_TOURNAMENT) {
                // Sort by submission time and get the entry that triggered minimum players
                const sortedByTime = [...entries].sort((a, b) =>
                    new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
                );
                const triggerEntry = sortedByTime[MIN_PLAYERS_FOR_TOURNAMENT - 1];
                const triggerTime = new Date(triggerEntry.submitted_at).getTime();
                const queueAge = Date.now() - triggerTime;
                timeRemaining = Math.max(0, QUEUE_TIMEOUT_MS - queueAge);
            }

            return {
                queueId,
                players: entries
                    .map(e => ({
                        name: e.player_name,
                        score: e.score,
                        attempts: e.attempts || 1
                    }))
                    .sort((a, b) => b.score - a.score), // Sort by score descending
                playerCount: entries.length,
                playersReady: entries.filter(e => (e.attempts || 1) >= MAX_ATTEMPTS_PER_PLAYER).length,
                timeRemaining
            };
        });

        // Basic response without player info - show first queue (available or full)
        if (!playerName) {
            // Get first queue (prefer available, but show full if none available)
            const queueList = Object.values(queues);
            let targetQueue = queueList.find(entries => entries.length < MIN_PLAYERS_FOR_TOURNAMENT) || queueList[0] || [];

            const queueStandings = targetQueue
                .map(entry => ({
                    player_name: entry.player_name,
                    score: entry.score,
                    attempts: entry.attempts || 1
                }))
                .sort((a, b) => b.score - a.score);

            const uniquePlayers = targetQueue.length;
            const playersReady = targetQueue.filter(p => (p.attempts || 1) >= MAX_ATTEMPTS_PER_PLAYER).length;

            // Calculate queue timeout info - only if minimum players reached
            // Timer starts from when minimum players was reached
            let timeRemaining = null;
            if (targetQueue.length >= MIN_PLAYERS_FOR_TOURNAMENT) {
                const sortedByTime = [...targetQueue].sort((a, b) =>
                    new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
                );
                const triggerEntry = sortedByTime[MIN_PLAYERS_FOR_TOURNAMENT - 1];
                const triggerTime = new Date(triggerEntry.submitted_at).getTime();
                const queueAge = Date.now() - triggerTime;
                timeRemaining = Math.max(0, QUEUE_TIMEOUT_MS - queueAge);
            }

            return res.status(200).json({
                queueSize: uniquePlayers,
                totalEntries: uniquePlayers,
                playersNeeded: Math.max(0, MIN_PLAYERS_FOR_TOURNAMENT - uniquePlayers),
                queueStandings,
                playersReady,
                totalQueuedPlayers: uniquePlayers,
                totalQueues,
                totalPlayersAllQueues,
                allQueuesSummary,
                timeRemaining,
                maxPlayers: MIN_PLAYERS_FOR_TOURNAMENT
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

        // Calculate queue timeout info - only if minimum players reached
        // Timer starts from when minimum players was reached
        let timeRemaining = null;
        if (queue.length >= MIN_PLAYERS_FOR_TOURNAMENT) {
            const sortedByTime = [...queue].sort((a, b) =>
                new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
            );
            const triggerEntry = sortedByTime[MIN_PLAYERS_FOR_TOURNAMENT - 1];
            const triggerTime = new Date(triggerEntry.submitted_at).getTime();
            const queueAge = Date.now() - triggerTime;
            timeRemaining = Math.max(0, QUEUE_TIMEOUT_MS - queueAge);
        }

        return res.status(200).json({
            queueSize: uniquePlayers,
            totalEntries: queue.length,
            playersNeeded: Math.max(0, MIN_PLAYERS_FOR_TOURNAMENT - uniquePlayers),
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
            totalQueues,
            totalPlayersAllQueues,
            allQueuesSummary,
            timeRemaining,
            maxPlayers: MIN_PLAYERS_FOR_TOURNAMENT
        });
    } catch (error) {
        console.error('ranked-status error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
