// API endpoint to check if player exists (single row per player)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Helper to set CORS headers
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };
}

async function checkPlayerExists(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&select=player_name,password_hash&limit=1`;
    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

module.exports = async (req, res) => {
    // Always set CORS headers first
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
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
        const { playerName } = req.body;

        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name required' });
        }

        const player = await checkPlayerExists(playerName.trim());

        return res.status(200).json({
            exists: !!player,
            hasPassword: player ? !!(player.password_hash && player.password_hash.trim() !== '') : false
        });
    } catch (error) {
        console.error('check-player error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
};
