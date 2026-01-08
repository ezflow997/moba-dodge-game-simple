// API endpoint to get leaderboard (with pagination and daily filter)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
        streak: `${diff}_streak`
    };
}

// Get start of today in UTC
function getTodayStart() {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    return todayStart.toISOString();
}

async function getLeaderboard(difficulty, limit = 10, offset = 0, dailyOnly = false) {
    const cols = getDifficultyColumns(difficulty);

    // Select columns we need
    const selectCols = `player_name,${cols.score},${cols.kills},${cols.streak},updated_at`;

    // Build URL with filters
    let url = `${SUPABASE_URL}/rest/v1/leaderboard?select=${selectCols}&${cols.score}=gt.0&order=${cols.score}.desc&limit=${limit}&offset=${offset}`;

    // Add daily filter if requested
    if (dailyOnly) {
        const todayStart = getTodayStart();
        url += `&updated_at=gte.${todayStart}`;
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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
    return { data, totalCount };
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
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

        const { data, totalCount } = await getLeaderboard(diff, maxLimit, offset, dailyOnly);
        const cols = getDifficultyColumns(diff);

        // Transform to expected format
        const safeData = data.map(entry => ({
            player_name: entry.player_name,
            score: entry[cols.score] || 0,
            kills: entry[cols.kills] || 0,
            best_streak: entry[cols.streak] || 0,
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
        console.error('leaderboard error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
