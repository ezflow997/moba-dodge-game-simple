// API endpoint to submit score

const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

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

    // Combine IV + authTag + encrypted data
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

async function checkPlayerExists(playerName) {
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

async function getPlayerScore(playerName, difficulty) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&difficulty=eq.${difficulty}`;
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

async function insertScore(playerName, difficulty, score, kills, bestStreak, passwordHash) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            player_name: playerName,
            difficulty: difficulty,
            score: score,
            kills: kills,
            best_streak: bestStreak,
            password_hash: passwordHash
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { inserted: true, data: data };
}

async function updateScore(playerName, difficulty, score, kills, bestStreak) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&difficulty=eq.${difficulty}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
            score: score,
            kills: kills,
            best_streak: bestStreak,
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { updated: true, data: data };
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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

        console.log('Submitting score for:', name, 'difficulty:', diff);

        // Check if entry exists for this player+difficulty
        const existing = await getPlayerScore(name, diff);

        if (existing) {
            console.log('Found existing entry for this difficulty');

            // Verify password
            if (existing.password_hash && existing.password_hash.trim() !== '') {
                const isValid = verifyPassword(password, existing.password_hash);
                if (!isValid) {
                    console.log('Password verification failed');
                    return res.status(401).json({ error: 'Invalid password', passwordError: true });
                }
            } else {
                console.log('Entry exists without password');
                return res.status(401).json({ error: 'Username exists but has no password', passwordError: true });
            }

            // Only update if new score is higher
            if (score > existing.score) {
                const result = await updateScore(name, diff, score, kills || 0, bestStreak || 0);
                return res.status(200).json({ updated: true, ...result });
            }

            return res.status(200).json({ updated: false, reason: 'Existing score is higher' });
        } else {
            // Check if player exists with different difficulty
            const playerExists = await checkPlayerExists(name);

            if (playerExists) {
                console.log('Player exists with different difficulty');

                if (playerExists.password_hash && playerExists.password_hash.trim() !== '') {
                    const isValid = verifyPassword(password, playerExists.password_hash);
                    if (!isValid) {
                        console.log('Password verification failed for existing player');
                        return res.status(401).json({ error: 'Invalid password', passwordError: true });
                    }
                    console.log('Password verified for existing player');
                } else {
                    console.log('Player exists without password');
                    return res.status(401).json({ error: 'Username exists but has no password', passwordError: true });
                }
            } else {
                console.log('New player - creating account');
            }

            // Encrypt password for storage
            const encryptedHash = encryptPassword(password);

            // Insert new entry
            const result = await insertScore(name, diff, score, kills || 0, bestStreak || 0, encryptedHash);
            return res.status(200).json({ inserted: true, ...result });
        }
    } catch (error) {
        console.error('submit-score error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
