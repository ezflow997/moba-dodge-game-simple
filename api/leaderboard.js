// API endpoint to get leaderboard

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function getHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };
}

async function getLeaderboard(difficulty, limit = 10) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?difficulty=eq.${difficulty}&order=score.desc&limit=${limit}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
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
        const { difficulty, limit } = req.query;

        if (!difficulty) {
            return res.status(400).json({ error: 'Difficulty required' });
        }

        const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
        if (!validDifficulties.includes(difficulty.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        const maxLimit = Math.min(parseInt(limit) || 10, 50);
        const data = await getLeaderboard(difficulty.toUpperCase(), maxLimit);

        // Remove sensitive fields before sending
        const safeData = data.map(entry => ({
            player_name: entry.player_name,
            score: entry.score,
            kills: entry.kills,
            best_streak: entry.best_streak,
            difficulty: entry.difficulty
        }));

        return res.status(200).json(safeData);
    } catch (error) {
        console.error('leaderboard error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
