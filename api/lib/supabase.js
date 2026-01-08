// Supabase server-side client
// Environment variables are set in Vercel dashboard

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service key for server-side

// Encryption key for password storage
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const crypto = require('crypto');

// Create headers for Supabase requests
function getHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

// Encrypt text using AES-256-GCM
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

// Decrypt text using AES-256-GCM
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

// Hash password using SHA-256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Hash and encrypt password for storage
function encryptPassword(password) {
    const hash = hashPassword(password);
    return encrypt(hash);
}

// Verify password against stored encrypted hash
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

// Check if player exists
async function checkPlayerExists(playerName) {
    try {
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
    } catch (error) {
        console.error('checkPlayerExists error:', error);
        return null;
    }
}

// Get player score for specific difficulty
async function getPlayerScore(playerName, difficulty) {
    try {
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
    } catch (error) {
        console.error('getPlayerScore error:', error);
        return null;
    }
}

// Get leaderboard
async function getLeaderboard(difficulty, limit = 10) {
    try {
        const url = `${SUPABASE_URL}/rest/v1/leaderboard?difficulty=eq.${difficulty}&order=score.desc&limit=${limit}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('getLeaderboard error:', error);
        return [];
    }
}

// Insert new score
async function insertScore(playerName, difficulty, score, kills, bestStreak, passwordHash) {
    try {
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
    } catch (error) {
        console.error('insertScore error:', error);
        return { error: error.message };
    }
}

// Update existing score
async function updateScore(playerName, difficulty, score, kills, bestStreak) {
    try {
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
    } catch (error) {
        console.error('updateScore error:', error);
        return { error: error.message };
    }
}

module.exports = {
    encrypt,
    decrypt,
    hashPassword,
    encryptPassword,
    verifyPassword,
    checkPlayerExists,
    getPlayerScore,
    getLeaderboard,
    insertScore,
    updateScore
};
