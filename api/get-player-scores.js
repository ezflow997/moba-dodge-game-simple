// API endpoint to get player's high scores for all difficulties

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

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

function decrypt(encryptedBase64) {
    if (!encryptedBase64 || typeof encryptedBase64 !== 'string' || encryptedBase64.trim() === '') {
        return null;
    }

    try {
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
        const combined = Buffer.from(encryptedBase64, 'base64');

        if (combined.length < 28) {
            return null;
        }

        const iv = combined.slice(0, 12);
        const authTag = combined.slice(12, 28);
        const encrypted = combined.slice(28);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, storedEncrypted) {
    if (!storedEncrypted || storedEncrypted.trim() === '') {
        return false;
    }

    const storedHash = decrypt(storedEncrypted);
    if (!storedHash) {
        return false;
    }

    const providedHash = hashPassword(password);
    return storedHash === providedHash;
}

async function getPlayerData(playerName) {
    // Get all score columns for all difficulties
    const selectCols = [
        'player_name',
        'password_hash',
        'easy_score', 'easy_kills', 'easy_streak',
        'medium_score', 'medium_kills', 'medium_streak',
        'hard_score', 'hard_kills', 'hard_streak',
        'expert_score', 'expert_kills', 'expert_streak',
        'insane_score', 'insane_kills', 'insane_streak'
    ].join(',');

    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&select=${selectCols}&limit=1`;
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

export default async function handler(req, res) {
    // Always set CORS headers first
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if environment variables are configured
    if (!SUPABASE_URL || !SUPABASE_KEY || !ENCRYPTION_KEY) {
        console.error('Missing environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { playerName, password } = req.body;

        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name required' });
        }

        if (!password || password.trim() === '') {
            return res.status(400).json({ error: 'Password required' });
        }

        const player = await getPlayerData(playerName.trim());

        if (!player) {
            return res.status(200).json({ exists: false });
        }

        // Verify password
        if (!player.password_hash || !verifyPassword(password, player.password_hash)) {
            return res.status(200).json({ exists: true, valid: false });
        }

        // Return high scores for all difficulties
        const difficulties = ['easy', 'medium', 'hard', 'expert', 'insane'];
        const scores = {};

        for (const diff of difficulties) {
            scores[diff] = {
                score: player[`${diff}_score`] || 0,
                kills: player[`${diff}_kills`] || 0,
                streak: player[`${diff}_streak`] || 0
            };
        }

        return res.status(200).json({
            exists: true,
            valid: true,
            scores: scores
        });
    } catch (error) {
        console.error('get-player-scores error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
