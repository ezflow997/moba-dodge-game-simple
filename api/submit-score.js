// API endpoint to submit score (single row per player, all difficulties)

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
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

function encrypt(text) {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
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

function encryptPassword(password) {
    const hash = hashPassword(password);
    return encrypt(hash);
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

// Get column names for a difficulty
function getDifficultyColumns(difficulty) {
    const diff = difficulty.toLowerCase();
    return {
        score: `${diff}_score`,
        kills: `${diff}_kills`,
        streak: `${diff}_streak`
    };
}

async function getPlayer(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&limit=1`;
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

async function insertPlayer(playerName, difficulty, score, kills, bestStreak, passwordHash) {
    const cols = getDifficultyColumns(difficulty);

    const body = {
        player_name: playerName,
        password_hash: passwordHash,
        [cols.score]: score,
        [cols.kills]: kills,
        [cols.streak]: bestStreak
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { inserted: true, data: data };
}

async function updatePlayerScore(playerName, difficulty, score, kills, bestStreak) {
    const cols = getDifficultyColumns(difficulty);

    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
            [cols.score]: score,
            [cols.kills]: kills,
            [cols.streak]: bestStreak,
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { updated: true, data: data };
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
        const { playerName, difficulty, score, kills, bestStreak, password } = req.body;

        // Validate required fields
        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name required' });
        }
        if (!difficulty) {
            return res.status(400).json({ error: 'Difficulty required' });
        }
        if (!password || password.length < 4) {
            return res.status(400).json({ error: 'Password required (min 4 characters)' });
        }
        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({ error: 'Valid score required' });
        }

        const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
        if (!validDifficulties.includes(difficulty.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        const name = playerName.trim();
        const diff = difficulty.toUpperCase();
        const cols = getDifficultyColumns(diff);

        console.log('Submitting score for:', name, 'difficulty:', diff);

        // Check if player exists
        const existing = await getPlayer(name);

        if (existing) {
            console.log('Found existing player');

            // Verify password
            if (existing.password_hash && existing.password_hash.trim() !== '') {
                const isValid = verifyPassword(password, existing.password_hash);
                if (!isValid) {
                    console.log('Password verification failed');
                    return res.status(401).json({ error: 'Invalid password', passwordError: true });
                }
            } else {
                console.log('Player exists without password');
                return res.status(401).json({ error: 'Username exists but has no password', passwordError: true });
            }

            // Get current score for this difficulty
            const currentScore = existing[cols.score] || 0;

            // Only update if new score is higher
            if (score > currentScore) {
                const result = await updatePlayerScore(name, diff, score, kills || 0, bestStreak || 0);
                return res.status(200).json({ updated: true, ...result });
            }

            return res.status(200).json({ updated: false, reason: 'Existing score is higher' });
        } else {
            console.log('New player - creating account');

            // Encrypt password for storage
            const encryptedHash = encryptPassword(password);

            // Insert new player
            const result = await insertPlayer(name, diff, score, kills || 0, bestStreak || 0, encryptedHash);
            return res.status(200).json({ inserted: true, ...result });
        }
    } catch (error) {
        console.error('submit-score error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
