// API endpoint for player presence (online count) tracking

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Players are considered online if they pinged in the last 6 minutes
const ONLINE_THRESHOLD_MINUTES = 6;

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };
}

// Get count of online players (pinged within threshold)
async function getOnlineCount() {
    const thresholdTime = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const url = `${SUPABASE_URL}/rest/v1/player_presence?select=id&last_ping=gte.${thresholdTime}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            ...getHeaders(),
            'Prefer': 'count=exact'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get online count: ${response.status}`);
    }

    // Get count from content-range header
    const contentRange = response.headers.get('content-range');
    let count = 0;
    if (contentRange) {
        const match = contentRange.match(/\/(\d+)/);
        if (match) {
            count = parseInt(match[1]);
        }
    }

    return count;
}

// Get list of online players (for dev mode)
async function getOnlinePlayers() {
    const thresholdTime = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const url = `${SUPABASE_URL}/rest/v1/player_presence?select=player_name,last_ping&last_ping=gte.${thresholdTime}&order=last_ping.desc`;
    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to get online players: ${response.status}`);
    }

    const data = await response.json();
    return data.map(p => ({
        name: p.player_name,
        lastPing: p.last_ping
    }));
}

// Register or update a player's presence (unique by player_name)
async function pingPresence(sessionId, playerName) {
    const now = new Date().toISOString();

    // Delete any existing entries for this player (ensures uniqueness by player_name)
    const deleteUrl = `${SUPABASE_URL}/rest/v1/player_presence?player_name=eq.${encodeURIComponent(playerName)}`;
    await fetch(deleteUrl, {
        method: 'DELETE',
        headers: getHeaders()
    });

    // Insert fresh entry for this player
    const insertUrl = `${SUPABASE_URL}/rest/v1/player_presence`;
    const insertResponse = await fetch(insertUrl, {
        method: 'POST',
        headers: {
            ...getHeaders(),
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            session_id: sessionId,
            player_name: playerName,
            last_ping: now
        })
    });

    if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to insert presence: ${errorText}`);
    }

    return true;
}

// Clean up stale sessions (older than 1 hour)
async function cleanupStale() {
    const staleTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const url = `${SUPABASE_URL}/rest/v1/player_presence?last_ping=lt.${staleTime}`;
    await fetch(url, {
        method: 'DELETE',
        headers: getHeaders()
    });
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
        if (req.method === 'GET') {
            // Check if requesting player list (dev mode)
            const { list } = req.query;
            if (list === 'true') {
                const players = await getOnlinePlayers();
                return res.status(200).json({ online: players.length, players });
            }
            // Get online player count only
            const count = await getOnlineCount();
            return res.status(200).json({ online: count });
        }

        if (req.method === 'POST') {
            // Ping presence (heartbeat) - only for logged-in users
            const { sessionId, playerName } = req.body;

            if (!sessionId) {
                return res.status(400).json({ error: 'sessionId required' });
            }

            if (!playerName) {
                return res.status(400).json({ error: 'playerName required - only logged-in users are tracked' });
            }

            await pingPresence(sessionId, playerName);

            // Occasionally clean up stale sessions (1 in 10 requests)
            if (Math.random() < 0.1) {
                cleanupStale().catch(console.error);
            }

            // Return current online count with the ping response
            const count = await getOnlineCount();
            return res.status(200).json({ success: true, online: count });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('presence error:', error.message);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
