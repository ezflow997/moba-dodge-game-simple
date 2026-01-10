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

    if (!lastResetMonth || lastResetMonth !== currentMonth) {
        console.log(`[ELO RESET] New month detected. Last reset: ${lastResetMonth}, Current: ${currentMonth}`);

        const resetSuccess = await resetAllPlayerElo();
        if (resetSuccess) {
            await setLastResetMonth(currentMonth);
            console.log(`[ELO RESET] Monthly reset complete for ${currentMonth}`);
            return true;
        }
    }

    return false;
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

        // Get total count
        const countUrl = `${SUPABASE_URL}/rest/v1/player_elo?select=id`;
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

        const entries = await response.json();

        // Add rank to each entry
        const rankedEntries = entries.map((entry, index) => ({
            rank: offset + index + 1,
            playerName: entry.player_name,
            elo: entry.elo,
            gamesPlayed: entry.games_played,
            wins: entry.wins || 0
        }));

        return res.status(200).json({
            entries: rankedEntries,
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
