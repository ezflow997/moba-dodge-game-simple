// API endpoint to get ELO-based ranked leaderboard

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
