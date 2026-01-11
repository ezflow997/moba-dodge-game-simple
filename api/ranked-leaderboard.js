// API endpoint to get ELO-based ranked leaderboard

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
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
        const updateUrl = `${SUPABASE_URL}/rest/v1/system_settings?key=eq.last_elo_reset_month`;
        const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: { ...getHeaders(), 'Prefer': 'return=representation' },
            body: JSON.stringify({ value: yearMonth, updated_at: new Date().toISOString() })
        });

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

// Save the monthly champion to the champions table (overwrites existing entry for same month)
async function saveChampion(playerName, elo, gamesPlayed, wins, yearMonth) {
    try {
        // Extract just the month (01-12) to allow overwriting across years
        const monthOnly = yearMonth.split('-')[1];

        // First, delete any existing entry for this month (any year)
        const deleteUrl = `${SUPABASE_URL}/rest/v1/ranked_champions?season_month=like.*-${monthOnly}`;
        await fetch(deleteUrl, {
            method: 'DELETE',
            headers: getHeaders()
        });

        // Now insert the new champion
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

        console.log(`[CHAMPION] ${playerName} saved as champion for ${yearMonth} with ELO ${elo} (overwrote any previous ${monthOnly} entries)`);
        return true;
    } catch (error) {
        console.error('saveChampion error:', error);
        return false;
    }
}

// Get previous year-month string (for awarding the champion)
function getPreviousYearMonth() {
    const now = new Date();
    now.setUTCMonth(now.getUTCMonth() - 1);
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Reset all player ELO to default (1000) for monthly reset
async function resetAllPlayerElo() {
    try {
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

// Get all champions (players who won a monthly season)
async function getAllChampions() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/ranked_champions?select=player_name,season_month,final_elo&order=season_month.desc`;
        const response = await fetch(url, { method: 'GET', headers: getHeaders() });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('getAllChampions error:', error);
        return [];
    }
}

// Get set of banned player names
async function getBannedPlayerNames() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/leaderboard?select=player_name&banned=eq.true`;
        const response = await fetch(url, { method: 'GET', headers: getHeaders() });
        if (!response.ok) return new Set();
        const data = await response.json();
        return new Set(data.map(p => p.player_name));
    } catch (error) {
        console.error('getBannedPlayerNames error:', error);
        return new Set();
    }
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
        // Check for monthly ELO reset before showing leaderboard
        await checkAndPerformMonthlyReset();

        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const offset = (page - 1) * limit;
        const viewerIsBanned = req.query.viewerBanned === 'true' || req.query.viewerBanned === '1';

        // Build filter for banned players
        // We need to join with leaderboard table to check ban status
        // Since player_elo doesn't have banned column, we'll need a different approach
        // For now, we filter after fetching by checking against leaderboard table

        // Get total count (we'll adjust after filtering if needed)
        let countUrl = `${SUPABASE_URL}/rest/v1/player_elo?select=id`;
        const countResponse = await fetch(countUrl, {
            method: 'GET',
            headers: { ...getHeaders(), 'Prefer': 'count=exact' }
        });

        if (!countResponse.ok) throw new Error(`HTTP ${countResponse.status}`);

        let totalEntries = 0;
        const countHeader = countResponse.headers.get('content-range');
        if (countHeader) {
            const match = countHeader.match(/\/(\d+)/);
            if (match) totalEntries = parseInt(match[1]);
        }

        // Get leaderboard entries (include wins for winrate calculation)
        const url = `${SUPABASE_URL}/rest/v1/player_elo?select=player_name,elo,games_played,wins&order=elo.desc,games_played.desc&limit=${limit}&offset=${offset}`;
        const response = await fetch(url, { method: 'GET', headers: getHeaders() });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let entries = await response.json();

        // Fetch all champions to mark them in the leaderboard
        const champions = await getAllChampions();
        const championNames = new Set(champions.map(c => c.player_name));

        // Get banned player names and filter if viewer is not banned
        let bannedNames = new Set();
        if (!viewerIsBanned) {
            bannedNames = await getBannedPlayerNames();
            // Filter out banned players from entries
            entries = entries.filter(e => !bannedNames.has(e.player_name));
            // Adjust total count (approximate - this is for display purposes)
            totalEntries = Math.max(0, totalEntries - bannedNames.size);
        }

        // Add rank and champion status to each entry
        const rankedEntries = entries.map((entry, index) => ({
            rank: offset + index + 1,
            playerName: entry.player_name,
            elo: entry.elo,
            gamesPlayed: entry.games_played,
            wins: entry.wins || 0,
            isChampion: championNames.has(entry.player_name)
        }));

        return res.status(200).json({
            entries: rankedEntries,
            champions: viewerIsBanned ? champions : champions.filter(c => !bannedNames.has(c.player_name)), // Filter champions too
            pagination: {
                page,
                limit,
                totalEntries,
                totalPages: Math.ceil(totalEntries / limit)
            }
        });
    } catch (error) {
        console.error('ranked-leaderboard error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
