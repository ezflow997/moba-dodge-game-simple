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

// Get player's unresolved attempts count
async function getPlayerAttempts(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?player_name=eq.${encodeURIComponent(playerName)}&resolved=eq.false`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
}

// Submit score to ranked queue
async function submitToQueue(playerName, score, kills, bestStreak) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            player_name: playerName,
            score: score,
            kills: kills || 0,
            best_streak: bestStreak || 0,
            resolved: false
        })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Get all unresolved queue entries
async function getUnresolvedQueue() {
    const url = `${SUPABASE_URL}/rest/v1/ranked_queue?resolved=eq.false&order=submitted_at.asc`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// Get unique players with their best scores from queue entries
function getPlayerBestScores(entries) {
    const playerBests = {};

    for (const entry of entries) {
        const name = entry.player_name;
        if (!playerBests[name] || entry.score > playerBests[name].score) {
            playerBests[name] = {
                player_name: name,
                score: entry.score,
                kills: entry.kills,
                best_streak: entry.best_streak,
                entryIds: playerBests[name] ? [...playerBests[name].entryIds, entry.id] : [entry.id]
            };
        } else {
            playerBests[name].entryIds.push(entry.id);
        }
    }

    // Sort by score descending
    return Object.values(playerBests).sort((a, b) => b.score - a.score);
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

    // Get best score per player
    const playerBests = getPlayerBestScores(allEntries);
    const results = calculateEloChanges(playerBests);
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

        // Insert history record
        await fetch(`${SUPABASE_URL}/rest/v1/ranked_history`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                tournament_id: tournamentId,
                player_name: result.player_name,
                score: result.score,
                placement: result.placement,
                total_players: totalPlayers,
                elo_before: eloBefore,
                elo_after: eloAfter,
                elo_change: result.eloChange
            })
        });

        // Add ELO info to result for response
        result.eloBefore = eloBefore;
        result.eloAfter = eloAfter;
    }

    // Mark ALL queue entries as resolved
    for (const entry of allEntries) {
        await fetch(`${SUPABASE_URL}/rest/v1/ranked_queue?id=eq.${entry.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
                resolved: true,
                tournament_id: tournamentId
            })
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

        // Check player's current attempts
        const playerAttempts = await getPlayerAttempts(name);
        const attemptsUsed = playerAttempts.length;

        if (attemptsUsed >= MAX_ATTEMPTS_PER_PLAYER) {
            // Find their best score
            const bestScore = Math.max(...playerAttempts.map(a => a.score));
            return res.status(400).json({
                error: 'Maximum attempts reached',
                attemptsUsed: attemptsUsed,
                maxAttempts: MAX_ATTEMPTS_PER_PLAYER,
                bestScore: bestScore,
                message: 'Wait for the tournament to close before queuing again.'
            });
        }

        // Submit to queue
        await submitToQueue(name, score, kills, bestStreak);
        const newAttemptsUsed = attemptsUsed + 1;

        // Get current queue state
        const queue = await getUnresolvedQueue();

        // Count unique players
        const uniquePlayers = new Set(queue.map(e => e.player_name)).size;

        if (uniquePlayers >= MIN_PLAYERS_FOR_TOURNAMENT) {
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
            // Not enough players yet - find player's best score
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
                playersNeeded: MIN_PLAYERS_FOR_TOURNAMENT - uniquePlayers
            });
        }
    } catch (error) {
        console.error('ranked-submit error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
