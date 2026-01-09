// API endpoint to submit ranked score and trigger tournament resolution

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const MIN_PLAYERS_FOR_TOURNAMENT = 2;
const MAX_ATTEMPTS_PER_PLAYER = 5;
const QUEUE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MIN_TIME_TO_JOIN_QUEUE_MS = 10 * 60 * 1000; // 10 minutes - don't join queues with less time remaining
const K_FACTOR = 32; // ELO sensitivity factor
const MAX_CONSECUTIVE_MATCHES = 5; // Max times you can play the same opponent in a row

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

// Get player from leaderboard table (for password verification)
async function getPlayer(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
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

// Update opponent tracking after a match
async function updateOpponentTracking(playerName, opponentName) {
    const eloRecord = await getOrCreatePlayerElo(playerName);

    let newConsecutiveCount;
    if (eloRecord.last_opponent === opponentName) {
        // Same opponent, increment count
        newConsecutiveCount = (eloRecord.consecutive_opponent_count || 0) + 1;
    } else {
        // New opponent, reset count
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

// Check if player would exceed consecutive match limit with anyone in a queue
async function wouldExceedConsecutiveLimit(playerName, queueEntries) {
    if (queueEntries.length === 0) return false;

    const eloRecord = await getOrCreatePlayerElo(playerName);
    const lastOpponent = eloRecord.last_opponent;
    const consecutiveCount = eloRecord.consecutive_opponent_count || 0;

    // Check if any player in the queue is the same as last opponent
    for (const entry of queueEntries) {
        if (entry.player_name === lastOpponent && consecutiveCount >= MAX_CONSECUTIVE_MATCHES) {
            return true; // Would exceed limit
        }
    }

    return false;
}

// Get player's queue entry (single entry per player with attempts count)
async function getPlayerQueueEntry(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?player_name=eq.${encodeURIComponent(playerName)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
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

// Find an available queue (has room, not exceeding consecutive match limit) or return null
async function findAvailableQueue(allEntries, playerName) {
    // Group entries by queue_id
    const queues = {};
    for (const entry of allEntries) {
        const qid = entry.queue_id || 'default';
        if (!queues[qid]) queues[qid] = [];
        queues[qid].push(entry);
    }

    // Find a queue with room that doesn't exceed consecutive match limit
    for (const [queueId, entries] of Object.entries(queues)) {
        if (entries.length < MIN_PLAYERS_FOR_TOURNAMENT) {
            // Check if joining this queue would exceed consecutive match limit
            const wouldExceed = await wouldExceedConsecutiveLimit(playerName, entries);
            if (!wouldExceed) {
                return queueId;
            }
            // Skip this queue - would exceed consecutive limit
        }
    }

    return null; // All queues are full or would exceed consecutive limit
}

// Generate a new queue ID
function generateQueueId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Submit or update score in ranked queue (one entry per player per queue)
async function submitToQueue(playerName, score, kills, bestStreak, queueId) {
    // Check if player already has an entry
    const existing = await getPlayerQueueEntry(playerName);

    if (existing) {
        // Update existing entry - increment attempts, update score if higher
        const newScore = score > existing.score ? score : existing.score;
        const newKills = score > existing.score ? (kills || 0) : existing.kills;
        const newStreak = score > existing.score ? (bestStreak || 0) : existing.best_streak;

        const response = await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
                score: newScore,
                kills: newKills,
                best_streak: newStreak,
                attempts: (existing.attempts || 1) + 1,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { updated: true, newHighScore: score > existing.score, attempts: (existing.attempts || 1) + 1, queueId: existing.queue_id };
    } else {
        // Insert new entry with queue_id
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                player_name: playerName,
                score: score,
                kills: kills || 0,
                best_streak: bestStreak || 0,
                attempts: 1,
                queue_id: queueId
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { updated: false, newHighScore: true, attempts: 1, queueId };
    }
}

// Calculate expected win probability based on ELO difference
function getExpectedScore(playerElo, opponentElo) {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

// Calculate ELO changes for tournament using dynamic ELO system
// Factors in: player ELO vs average opponent ELO, score performance vs average
function calculateEloChanges(entries, eloMap) {
    const total = entries.length;
    if (total < 2) return entries.map(e => ({ ...e, placement: 1, eloChange: 0 }));

    // Calculate average score for performance comparison
    const avgScore = entries.reduce((sum, e) => sum + e.score, 0) / total;
    const maxScore = entries[0].score; // Already sorted by score desc
    const minScore = entries[total - 1].score;
    const scoreRange = maxScore - minScore || 1; // Avoid division by zero

    // Calculate average ELO of all players
    const avgElo = entries.reduce((sum, e) => sum + (eloMap[e.player_name] || 1000), 0) / total;

    return entries.map((entry, index) => {
        const placement = index + 1;
        const playerElo = eloMap[entry.player_name] || 1000;

        // Calculate expected score against average opponent
        const expectedScore = getExpectedScore(playerElo, avgElo);

        // Actual score: 1 for winner (1st place), 0 for last place, scaled in between
        const actualScore = (total - index - 1) / (total - 1);

        // Score performance factor: how much better/worse than average
        // Ranges from 0.5 (way below avg) to 1.5 (way above avg)
        const scoreDeviation = (entry.score - avgScore) / scoreRange;
        const performanceFactor = 1 + (scoreDeviation * 0.5);

        // Base ELO change from expected vs actual outcome
        const baseChange = K_FACTOR * (actualScore - expectedScore);

        // Apply performance factor - amplifies gains for dominant wins, losses for bad performances
        const eloChange = Math.round(baseChange * performanceFactor);

        return {
            ...entry,
            placement,
            eloChange,
            playerElo // Include for reference
        };
    });
}

// Resolve tournament
async function resolveTournament(allEntries) {
    const tournamentId = crypto.randomUUID();

    // Sort entries by score descending (each entry is already one per player with best score)
    const sortedEntries = [...allEntries].sort((a, b) => b.score - a.score);

    // Fetch all player ELOs first for the calculation
    const eloMap = {};
    for (const entry of sortedEntries) {
        const eloRecord = await getOrCreatePlayerElo(entry.player_name);
        eloMap[entry.player_name] = eloRecord.elo;
    }

    // Calculate ELO changes using dynamic system
    const results = calculateEloChanges(sortedEntries, eloMap);
    const totalPlayers = results.length;

    // Process each player
    for (const result of results) {
        const eloBefore = eloMap[result.player_name];
        const eloAfter = eloBefore + result.eloChange;

        // Update player ELO
        await fetch(`${SUPABASE_URL}/rest/v1/player_elo?player_name=eq.${encodeURIComponent(result.player_name)}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
                elo: eloAfter,
                games_played: eloRecord.games_played + 1,
                updated_at: new Date().toISOString()
            })
        });

        // Upsert history record (one entry per player, updated each tournament)
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
            // Update existing entry
            await fetch(`${SUPABASE_URL}/rest/v1/ranked_history?player_name=eq.${encodeURIComponent(result.player_name)}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(historyData)
            });
        } else {
            // Insert new entry
            await fetch(`${SUPABASE_URL}/rest/v1/ranked_history`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(historyData)
            });
        }

        // Add ELO info to result for response
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

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY || !ENCRYPTION_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { playerName, password, score, kills, bestStreak } = req.body;

        // Validate required fields
        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name required' });
        }
        if (!password || password.length < 4) {
            return res.status(400).json({ error: 'Password required' });
        }
        if (typeof score !== 'number') {
            return res.status(400).json({ error: 'Valid score required' });
        }

        // Ensure score is at least 0 (negative scores count as 0)
        const finalScore = Math.max(0, score);

        const name = playerName.trim();

        // Verify player exists and password is correct
        const player = await getPlayer(name);
        if (!player) {
            return res.status(401).json({ error: 'Player not found. Please register first.' });
        }

        if (!verifyPassword(password, player.password_hash)) {
            return res.status(401).json({ error: 'Invalid password', passwordError: true });
        }

        // Check player's current queue entry
        const playerEntry = await getPlayerQueueEntry(name);
        const attemptsUsed = playerEntry ? (playerEntry.attempts || 1) : 0;

        if (attemptsUsed >= MAX_ATTEMPTS_PER_PLAYER) {
            return res.status(400).json({
                error: 'Maximum attempts reached',
                attemptsUsed: attemptsUsed,
                maxAttempts: MAX_ATTEMPTS_PER_PLAYER,
                bestScore: playerEntry.score,
                message: 'Wait for the tournament to close before queuing again.'
            });
        }

        // Determine which queue to use
        let targetQueueId;
        if (playerEntry) {
            // Player already in a queue, use that one
            targetQueueId = playerEntry.queue_id || 'default';
        } else {
            // Find an available queue or create a new one
            const allEntries = await getAllQueueEntries();
            targetQueueId = await findAvailableQueue(allEntries, name);

            if (!targetQueueId) {
                // All queues are full, create a new one
                targetQueueId = generateQueueId();
            }
        }

        // Submit to queue (inserts new or updates existing)
        const submitResult = await submitToQueue(name, finalScore, kills, bestStreak, targetQueueId);
        const newAttemptsUsed = submitResult.attempts;

        // Get entries for the player's specific queue
        const queue = await getQueueEntries(targetQueueId);

        // Check queue status
        const uniquePlayers = queue.length;
        const playersReady = queue.filter(p => (p.attempts || 1) >= MAX_ATTEMPTS_PER_PLAYER).length;

        // Sort queue by submission time for timeout calculations
        const sortedByTime = [...queue].sort((a, b) =>
            new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
        );

        // For cancellation check (insufficient players), use oldest entry
        const oldestEntryTime = new Date(sortedByTime[0].submitted_at).getTime();
        const oldestQueueAge = Date.now() - oldestEntryTime;
        const shouldCancelEmpty = oldestQueueAge >= QUEUE_TIMEOUT_MS && uniquePlayers < MIN_PLAYERS_FOR_TOURNAMENT;

        // For resolution timeout (minimum players reached), use the entry that triggered minimum
        let isTimedOut = false;
        if (uniquePlayers >= MIN_PLAYERS_FOR_TOURNAMENT) {
            const triggerEntry = sortedByTime[MIN_PLAYERS_FOR_TOURNAMENT - 1];
            const triggerTime = new Date(triggerEntry.submitted_at).getTime();
            const queueAge = Date.now() - triggerTime;
            isTimedOut = queueAge >= QUEUE_TIMEOUT_MS;
        }

        // Handle timed out queue with insufficient players - cancel without resolving
        if (shouldCancelEmpty) {
            // Delete all entries in this queue without resolving
            for (const entry of queue) {
                await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue?id=eq.${entry.id}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
            }

            return res.status(200).json({
                success: true,
                tournamentResolved: false,
                queueCancelled: true,
                message: 'Queue cancelled - not enough players joined before timeout',
                playersNeeded: MIN_PLAYERS_FOR_TOURNAMENT
            });
        }

        // Check if leader has no reason to continue (they're #1 and the only one with attempts left)
        const playersWithAttemptsLeft = queue.filter(p => (p.attempts || 1) < MAX_ATTEMPTS_PER_PLAYER);
        const sortedByScore = [...queue].sort((a, b) => b.score - a.score);
        const leader = sortedByScore[0];
        const leaderIsOnlyOneWithAttempts = playersWithAttemptsLeft.length === 1 &&
            playersWithAttemptsLeft[0].player_name === leader.player_name;

        // Debug logging
        console.log('[RANKED DEBUG] Queue state:', {
            uniquePlayers,
            playersWithAttemptsLeft: playersWithAttemptsLeft.map(p => ({ name: p.player_name, attempts: p.attempts })),
            leader: { name: leader?.player_name, score: leader?.score, attempts: leader?.attempts },
            leaderIsOnlyOneWithAttempts,
            allPlayersAttempts: queue.map(p => ({ name: p.player_name, attempts: p.attempts || 1, score: p.score }))
        });

        // Tournament resolves when: min players AND (all attempts complete OR timed out OR leader is only one with attempts left)
        const allReady = queue.every(p => (p.attempts || 1) >= MAX_ATTEMPTS_PER_PLAYER);
        const shouldResolveEarly = uniquePlayers >= MIN_PLAYERS_FOR_TOURNAMENT && leaderIsOnlyOneWithAttempts;

        console.log('[RANKED DEBUG] Resolution check:', { allReady, isTimedOut, shouldResolveEarly, willResolve: allReady || isTimedOut || shouldResolveEarly });

        if (uniquePlayers >= MIN_PLAYERS_FOR_TOURNAMENT && (allReady || isTimedOut || shouldResolveEarly)) {
            // Resolve tournament for this queue!
            const tournamentResult = await resolveTournament(queue);

            // Find this player's result
            const playerResult = tournamentResult.results.find(r => r.player_name === name);

            return res.status(200).json({
                success: true,
                tournamentResolved: true,
                tournamentId: tournamentResult.tournamentId,
                totalPlayers: tournamentResult.totalPlayers,
                playerResult: {
                    placement: playerResult.placement,
                    score: playerResult.score,
                    eloChange: playerResult.eloChange,
                    eloBefore: playerResult.eloBefore,
                    eloAfter: playerResult.eloAfter
                },
                allResults: tournamentResult.results.map(r => ({
                    playerName: r.player_name,
                    placement: r.placement,
                    score: r.score,
                    eloChange: r.eloChange
                }))
            });
        } else {
            // Not ready yet - get player's entry for best score
            const updatedEntry = await getPlayerQueueEntry(name);
            const bestScore = updatedEntry ? updatedEntry.score : score;

            return res.status(200).json({
                success: true,
                tournamentResolved: false,
                attemptsUsed: newAttemptsUsed,
                attemptsRemaining: MAX_ATTEMPTS_PER_PLAYER - newAttemptsUsed,
                maxAttempts: MAX_ATTEMPTS_PER_PLAYER,
                bestScore: bestScore,
                currentScore: finalScore,
                uniquePlayers: uniquePlayers,
                playersNeeded: Math.max(0, MIN_PLAYERS_FOR_TOURNAMENT - uniquePlayers),
                playersReady: playersReady,
                totalQueuedPlayers: uniquePlayers,
                queueId: targetQueueId,
                // Debug info
                _debug: {
                    leaderIsOnlyOneWithAttempts,
                    shouldResolveEarly,
                    allReady,
                    isTimedOut,
                    leader: leader?.player_name,
                    leaderAttempts: leader?.attempts,
                    playersWithAttemptsLeft: playersWithAttemptsLeft.map(p => p.player_name)
                }
            });
        }
    } catch (error) {
        console.error('ranked-submit error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
