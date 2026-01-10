// Temporary API endpoint to add test champion data
// DELETE THIS FILE AFTER TESTING

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Insert test champion data for ezflow997
        const testChampions = [
            {
                player_name: 'ezflow997',
                final_elo: 1247,
                games_played: 15,
                wins: 9,
                season_month: '2024-12',
                awarded_at: new Date('2025-01-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ezflow997',
                final_elo: 1312,
                games_played: 22,
                wins: 14,
                season_month: '2025-01',
                awarded_at: new Date('2025-02-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ezflow997',
                final_elo: 1189,
                games_played: 18,
                wins: 10,
                season_month: '2025-12',
                awarded_at: new Date('2026-01-01T00:00:00Z').toISOString()
            }
        ];

        const results = [];

        for (const champion of testChampions) {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/ranked_champions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(champion)
            });

            if (response.ok) {
                const data = await response.json();
                results.push({ success: true, data: data[0] });
            } else {
                const error = await response.text();
                results.push({ success: false, error, season: champion.season_month });
            }
        }

        return res.status(200).json({
            message: 'Test champion data inserted for ezflow997',
            results
        });
    } catch (error) {
        console.error('test-add-champion error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
