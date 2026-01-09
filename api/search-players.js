// API endpoint to search for players and return their ranks

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Helper to set CORS headers
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

// Get column names for a difficulty
function getDifficultyColumns(difficulty) {
    const diff = difficulty.toLowerCase();
    return {
        score: `${diff}_score`,
        kills: `${diff}_kills`,
        streak: `${diff}_streak`,
        dailyScore: `${diff}_daily_score`,
        dailyKills: `${diff}_daily_kills`,
        dailyStreak: `${diff}_daily_streak`,
        dailyDate: `${diff}_daily_date`
    };
}

// Get today's date in YYYY-MM-DD format (UTC)
function getTodayDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

async function searchPlayers(difficulty, searchQuery, dailyOnly = false) {
    const cols = getDifficultyColumns(difficulty);
    const scoreCol = dailyOnly ? cols.dailyScore : cols.score;
    const dateCol = cols.dailyDate;

    // First, get ALL players ordered by score to calculate ranks
    // We need to get all entries to properly calculate rank positions
    let allPlayersUrl = `${SUPABASE_URL}/rest/v1/leaderboard?select=player_name,${scoreCol}&${scoreCol}=gt.0&order=${scoreCol}.desc`;

    if (dailyOnly) {
        const today = getTodayDate();
        allPlayersUrl += `&${dateCol}=eq.${today}`;
    }

    const response = await fetch(allPlayersUrl, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase HTTP ${response.status}: ${errorText}`);
    }

    const allPlayers = await response.json();

    // Search through and find matching players with their ranks
    const searchLower = searchQuery.toLowerCase();
    const matches = [];

    for (let i = 0; i < allPlayers.length; i++) {
        const player = allPlayers[i];
        if (player.player_name.toLowerCase().includes(searchLower)) {
            matches.push({
                player_name: player.player_name,
                rank: i + 1,  // Rank is 1-indexed
                score: player[scoreCol]
            });
        }
    }

    return { matches };
}

export default async function handler(req, res) {
    // Always set CORS headers first
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if environment variables are configured
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'Database not configured'
        });
    }

    try {
        const { difficulty, search, daily } = req.query;

        if (!difficulty) {
            return res.status(400).json({ error: 'Difficulty required' });
        }

        if (!search || search.trim().length === 0) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
        const diff = difficulty.toUpperCase();
        if (!validDifficulties.includes(diff)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        const dailyOnly = daily === 'true' || daily === '1';
        const result = await searchPlayers(diff, search.trim(), dailyOnly);

        return res.status(200).json(result);
    } catch (error) {
        console.error('search-players error:', error.message);
        return res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
}
