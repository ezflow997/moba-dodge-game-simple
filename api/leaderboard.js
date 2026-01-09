// API endpoint to get leaderboard (with pagination and daily filter)

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
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
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

async function getLeaderboard(difficulty, limit = 10, offset = 0, dailyOnly = false) {
    const cols = getDifficultyColumns(difficulty);

    // Use daily score columns if daily filter, otherwise all-time
    const scoreCol = dailyOnly ? cols.dailyScore : cols.score;
    const dateCol = cols.dailyDate;

    // Select columns we need
    const selectCols = `player_name,${cols.score},${cols.kills},${cols.streak},${cols.dailyScore},${cols.dailyKills},${cols.dailyStreak},${cols.dailyDate},updated_at`;

    // Build URL with filters
    let url = `${SUPABASE_URL}/rest/v1/leaderboard?select=${selectCols}&${scoreCol}=gt.0&order=${scoreCol}.desc&limit=${limit}&offset=${offset}`;

    // Add daily filter if requested - only show entries from today
    if (dailyOnly) {
        const today = getTodayDate();
        url += `&${dateCol}=eq.${today}`;
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase HTTP ${response.status}: ${errorText}`);
    }

    // Get total count from headers
    const contentRange = response.headers.get('content-range');
    let totalCount = 0;
    if (contentRange) {
        const match = contentRange.match(/\/(\d+)/);
        if (match) {
            totalCount = parseInt(match[1]);
        }
    }

    const data = await response.json();
    return { data, totalCount, dailyOnly };
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
        console.error('Missing environment variables:', {
            hasUrl: !!SUPABASE_URL,
            hasKey: !!SUPABASE_KEY
        });
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'Database not configured'
        });
    }

    try {
        const { difficulty, limit, page, daily } = req.query;

        if (!difficulty) {
            return res.status(400).json({ error: 'Difficulty required' });
        }

        const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
        const diff = difficulty.toUpperCase();
        if (!validDifficulties.includes(diff)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        const maxLimit = Math.min(parseInt(limit) || 10, 50);
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const offset = (pageNum - 1) * maxLimit;
        const dailyOnly = daily === 'true' || daily === '1';

        const result = await getLeaderboard(diff, maxLimit, offset, dailyOnly);
        const { data, totalCount } = result;
        const cols = getDifficultyColumns(diff);

        // Transform to expected format - use daily stats if daily filter
        const safeData = data.map(entry => ({
            player_name: entry.player_name,
            score: dailyOnly ? (entry[cols.dailyScore] || 0) : (entry[cols.score] || 0),
            kills: dailyOnly ? (entry[cols.dailyKills] || 0) : (entry[cols.kills] || 0),
            best_streak: dailyOnly ? (entry[cols.dailyStreak] || 0) : (entry[cols.streak] || 0),
            difficulty: diff
        }));

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / maxLimit);

        return res.status(200).json({
            entries: safeData,
            pagination: {
                page: pageNum,
                limit: maxLimit,
                totalEntries: totalCount,
                totalPages: totalPages
            }
        });
    } catch (error) {
        console.error('leaderboard error:', error.message);
        return res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
}
