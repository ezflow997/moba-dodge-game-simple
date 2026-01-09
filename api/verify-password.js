// API endpoint to verify password for existing player (single row per player)

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
        console.error('Missing environment variables:', {
            hasUrl: !!SUPABASE_URL,
            hasKey: !!SUPABASE_KEY,
            hasEncKey: !!ENCRYPTION_KEY
        });
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'Database not configured'
        });
    }

    try {
        const { playerName, password } = req.body;

        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name required' });
        }

        if (!password || password.trim() === '') {
            return res.status(400).json({ error: 'Password required' });
        }

        const player = await checkPlayerExists(playerName.trim());

        if (!player) {
            return res.status(200).json({ exists: false, valid: false });
        }

        if (!player.password_hash || player.password_hash.trim() === '') {
            return res.status(200).json({ exists: true, valid: false, noPassword: true });
        }

        const isValid = verifyPassword(password, player.password_hash);

        return res.status(200).json({
            exists: true,
            valid: isValid
        });
    } catch (error) {
        console.error('verify-password error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
