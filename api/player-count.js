// API endpoint to get unique player count (dev mode only)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
        // Check if requesting full list (dev mode)
        const { list } = req.query;

        // Get registered players (those with password_hash set) - include banned status
        const url = `${SUPABASE_URL}/rest/v1/leaderboard?select=player_name,created_at,banned&password_hash=neq.&password_hash=not.is.null&order=created_at.desc`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Supabase HTTP ${response.status}: ${errorText}`);
        }

        // Get total count from content-range header
        const contentRange = response.headers.get('content-range');
        let totalCount = 0;
        if (contentRange) {
            const match = contentRange.match(/\/(\d+)/);
            if (match) {
                totalCount = parseInt(match[1]);
            }
        }

        // If list requested, return player names with banned status
        if (list === 'true') {
            const data = await response.json();
            const accounts = data.map(p => ({
                name: p.player_name,
                createdAt: p.created_at,
                banned: p.banned || false
            }));
            return res.status(200).json({
                registeredPlayers: totalCount,
                accounts
            });
        }

        return res.status(200).json({
            registeredPlayers: totalCount
        });
    } catch (error) {
        console.error('player-count error:', error.message);
        return res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
}
