// API endpoint to search ranked players by name

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
        const { search } = req.query;

        if (!search || search.trim().length === 0) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const searchTerm = search.trim().toLowerCase();

        // Search for players in the player_elo table
        // Using ilike for case-insensitive partial match
        const url = `${SUPABASE_URL}/rest/v1/player_elo?player_name=ilike.*${encodeURIComponent(searchTerm)}*&order=elo.desc&limit=10`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const players = await response.json();

        // Get total count of all ranked players for rank calculation
        const countUrl = `${SUPABASE_URL}/rest/v1/player_elo?select=id`;
        const countResponse = await fetch(countUrl, {
            method: 'GET',
            headers: { ...getHeaders(), 'Prefer': 'count=exact' }
        });

        // Calculate rank for each matched player
        const matches = await Promise.all(players.map(async (player) => {
            // Count players with higher ELO to determine rank
            const rankUrl = `${SUPABASE_URL}/rest/v1/player_elo?elo=gt.${player.elo}&select=id`;
            const rankResponse = await fetch(rankUrl, {
                method: 'GET',
                headers: { ...getHeaders(), 'Prefer': 'count=exact' }
            });

            let rank = 1;
            const countHeader = rankResponse.headers.get('content-range');
            if (countHeader) {
                const match = countHeader.match(/\/(\d+)/);
                if (match) {
                    rank = parseInt(match[1]) + 1;
                }
            }

            return {
                player_name: player.player_name,
                elo: player.elo,
                games_played: player.games_played,
                rank: rank
            };
        }));

        return res.status(200).json({ matches });
    } catch (error) {
        console.error('ranked-search error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
