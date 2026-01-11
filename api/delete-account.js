// API endpoint to delete a player account (dev mode only)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { playerName } = req.body;

    if (!playerName) {
        return res.status(400).json({ error: 'playerName required' });
    }

    try {
        // Delete from leaderboard table (main account data)
        const deleteLeaderboardUrl = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}`;
        const leaderboardResponse = await fetch(deleteLeaderboardUrl, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!leaderboardResponse.ok) {
            const errorText = await leaderboardResponse.text();
            throw new Error(`Failed to delete from leaderboard: ${errorText}`);
        }

        // Also delete from player_presence if exists
        const deletePresenceUrl = `${SUPABASE_URL}/rest/v1/player_presence?player_name=eq.${encodeURIComponent(playerName)}`;
        await fetch(deletePresenceUrl, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Also delete from player_inventory if exists
        const deleteInventoryUrl = `${SUPABASE_URL}/rest/v1/player_inventory?player_name=eq.${encodeURIComponent(playerName)}`;
        await fetch(deleteInventoryUrl, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`[DELETE-ACCOUNT] Deleted account: ${playerName}`);

        return res.status(200).json({
            success: true,
            message: `Account '${playerName}' deleted successfully`
        });
    } catch (error) {
        console.error('delete-account error:', error.message);
        return res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
}
