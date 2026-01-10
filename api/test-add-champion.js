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
        // First, delete ALL existing champion data to start fresh
        const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/ranked_champions?player_name=neq.NEVER_MATCH`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        // Insert test champion data with different months and players
        const testChampions = [
            // 2025 Champions
            {
                player_name: 'ezflow997',
                final_elo: 1456,
                games_played: 28,
                wins: 18,
                season_month: '2025-12',
                awarded_at: new Date('2026-01-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'NightHawk',
                final_elo: 1423,
                games_played: 32,
                wins: 21,
                season_month: '2025-11',
                awarded_at: new Date('2025-12-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ProGamer99',
                final_elo: 1312,
                games_played: 22,
                wins: 14,
                season_month: '2025-10',
                awarded_at: new Date('2025-11-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ezflow997',
                final_elo: 1378,
                games_played: 26,
                wins: 17,
                season_month: '2025-09',
                awarded_at: new Date('2025-10-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ShadowKing',
                final_elo: 1345,
                games_played: 24,
                wins: 15,
                season_month: '2025-08',
                awarded_at: new Date('2025-09-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'BlazeMaster',
                final_elo: 1298,
                games_played: 20,
                wins: 12,
                season_month: '2025-07',
                awarded_at: new Date('2025-08-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ezflow997',
                final_elo: 1267,
                games_played: 19,
                wins: 11,
                season_month: '2025-06',
                awarded_at: new Date('2025-07-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'VortexPro',
                final_elo: 1234,
                games_played: 18,
                wins: 10,
                season_month: '2025-05',
                awarded_at: new Date('2025-06-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'NightHawk',
                final_elo: 1289,
                games_played: 21,
                wins: 13,
                season_month: '2025-04',
                awarded_at: new Date('2025-05-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ShadowKing',
                final_elo: 1256,
                games_played: 17,
                wins: 10,
                season_month: '2025-03',
                awarded_at: new Date('2025-04-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ezflow997',
                final_elo: 1198,
                games_played: 15,
                wins: 9,
                season_month: '2025-02',
                awarded_at: new Date('2025-03-01T00:00:00Z').toISOString()
            },
            {
                player_name: 'ThunderBolt',
                final_elo: 1167,
                games_played: 14,
                wins: 8,
                season_month: '2025-01',
                awarded_at: new Date('2025-02-01T00:00:00Z').toISOString()
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
                results.push({ success: true, season: champion.season_month, player: champion.player_name });
            } else {
                const error = await response.text();
                results.push({ success: false, error, season: champion.season_month });
            }
        }

        return res.status(200).json({
            message: 'Test champion data reset and inserted',
            deleted: deleteResponse.ok,
            results
        });
    } catch (error) {
        console.error('test-add-champion error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
