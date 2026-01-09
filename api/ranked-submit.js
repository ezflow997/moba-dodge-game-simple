// API endpoint to submit ranked score and trigger tournament resolution

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const MIN_PLAYERS_FOR_TOURNAMENT = 10;
const MAX_ATTEMPTS_PER_PLAYER = 5;
const BASE_ELO_GAIN = 25;
const BASE_ELO_LOSS = 20;

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

// Get player's queue entry (single entry per player with attempts count)
async function getPlayerQueueEntry(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?player_name=eq.${encodeURIComponent(playerName)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

// Submit or update score in ranked queue (one entry per player)
async function submitToQueue(playerName, score, kills, bestStreak) {
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
        return { updated: true, newHighScore: score > existing.score, attempts: (existing.attempts || 1) + 1 };
    } else {
        // Insert new entry
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                player_name: playerName,
                score: score,
                kills: kills || 0,
                best_streak: bestStreak || 0,
                attempts: 1
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { updated: false, newHighScore: true, attempts: 1 };
    }
}

// Get all queue entries (entries are deleted after resolution)
async function getUnresolvedQueue() {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?order=submitted_at.asc`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Calculate ELO changes for tournament
function calculateEloChanges(entries) {
    const total = entries.length;
    const top25Cutoff = Math.ceil(total * 0.25);
    const bottom25Start = Math.floor(total * 0.75);

    return entries.map((entry, index) => {
        const placement = index + 1;
        let eloChange = 0;

        if (index < top25Cutoff) {
            // Top 25% - gain ELO (higher placement = more ELO)
            const positionInTop = index / top25Cutoff;
            const multiplier = 1 + (1 - positionInTop) * 0.5;
            eloChange = Math.round(BASE_ELO_GAIN * multiplier);
        } else if (index >= bottom25Start) {
            // Bottom 25% - lose ELO (lower placement = more loss)
            const positionInBottom = (index - bottom25Start) / (total - bottom25Start);
            const multiplier = 1 + positionInBottom * 0.5;
            eloChange = -Math.round(BASE_ELO_LOSS * multiplier);
        }

        return {
            ...entry,
            placement,
            eloChange
        };
    });
}

// Resolve tournament
async function resolveTournament(allEntries) {
    const tournamentId = crypto.randomUUID();

    // Sort entries by score descending (each entry is already one per player with best score)
    const sortedEntries = [...allEntries].sort((a, b) => b.score - a.score);
    const results = calculateEloChanges(sortedEntries);
    const totalPlayers = results.length;

    // Process each player
    for (const result of results) {
        // Get current ELO
        const eloRecord = await getOrCreatePlayerElo(result.player_name);
        const eloBefore = eloRecord.elo;
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
        if (typeof score !== 'number' || score <= 0) {
            return res.status(400).json({ error: 'Valid score required (must be > 0)' });
        }

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

        // Check if queue is full (10 players) and player is not already in it
        if (!playerEntry) {
            const currentQueue = await getUnresolvedQueue();

            if (currentQueue.length >= MIN_PLAYERS_FOR_TOURNAMENT) {
                return res.status(400).json({
                    error: 'Queue is full',
                    queueSize: currentQueue.length,
                    message: 'Tournament queue is full. Please wait for it to resolve before joining.'
                });
            }
        }

        // Submit to queue (inserts new or updates existing)
        const submitResult = await submitToQueue(name, score, kills, bestStreak);
        const newAttemptsUsed = submitResult.attempts;

        // Get current queue state
        const queue = await getUnresolvedQueue();

        // Each entry now has attempts field directly
        const uniquePlayers = queue.length;
        const playersReady = queue.filter(p => (p.attempts || 1) >= MAX_ATTEMPTS_PER_PLAYER).length;

        // Tournament resolves when: 10+ players AND all players have completed all attempts
        const allReady = queue.every(p => (p.attempts || 1) >= MAX_ATTEMPTS_PER_PLAYER);
        if (uniquePlayers >= MIN_PLAYERS_FOR_TOURNAMENT && allReady) {
            // Resolve tournament!
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
            // Not ready yet - find player's best score
            const updatedAttempts = await getPlayerAttempts(name);
            const bestScore = Math.max(...updatedAttempts.map(a => a.score));

            return res.status(200).json({
                success: true,
                tournamentResolved: false,
                attemptsUsed: newAttemptsUsed,
                attemptsRemaining: MAX_ATTEMPTS_PER_PLAYER - newAttemptsUsed,
                maxAttempts: MAX_ATTEMPTS_PER_PLAYER,
                bestScore: bestScore,
                currentScore: score,
                uniquePlayers: uniquePlayers,
                playersNeeded: Math.max(0, MIN_PLAYERS_FOR_TOURNAMENT - uniquePlayers),
                playersReady: playersReady,
                totalQueuedPlayers: uniquePlayers
            });
        }
    } catch (error) {
        console.error('ranked-submit error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
