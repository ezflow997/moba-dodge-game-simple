// API endpoint to recover password using security question

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

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

// Hash security answer (case-insensitive, trimmed)
function hashSecurityAnswer(answer) {
    const normalized = answer.trim().toLowerCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function verifySecurityAnswer(answer, storedEncryptedHash) {
    if (!storedEncryptedHash || storedEncryptedHash.trim() === '') {
        return false;
    }

    const storedHash = decrypt(storedEncryptedHash);
    if (!storedHash) {
        return false;
    }

    const providedHash = hashSecurityAnswer(answer);
    return storedHash === providedHash;
}

async function getPlayer(playerName) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}&select=player_name,security_question,security_answer_hash&limit=1`;
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

async function updatePassword(playerName, newPasswordHash) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
            password_hash: newPasswordHash,
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}

export default async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY || !ENCRYPTION_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { playerName, action, securityAnswer, newPassword } = req.body;

        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name required' });
        }

        const player = await getPlayer(playerName.trim());

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Action: getQuestion - returns the security question for the player
        if (action === 'getQuestion') {
            if (!player.security_question) {
                return res.status(400).json({ error: 'No security question set for this account' });
            }
            return res.status(200).json({
                success: true,
                securityQuestion: player.security_question
            });
        }

        // Action: recover - verify answer and set new password
        if (action === 'recover') {
            if (!player.security_question || !player.security_answer_hash) {
                return res.status(400).json({ error: 'No security question set for this account' });
            }

            if (!securityAnswer || securityAnswer.trim() === '') {
                return res.status(400).json({ error: 'Security answer required' });
            }

            if (!newPassword || newPassword.length < 4) {
                return res.status(400).json({ error: 'New password must be at least 4 characters' });
            }

            // Verify security answer
            const isValid = verifySecurityAnswer(securityAnswer, player.security_answer_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Incorrect security answer' });
            }

            // Update password
            const newPasswordHash = encryptPassword(newPassword);
            await updatePassword(playerName.trim(), newPasswordHash);

            return res.status(200).json({ success: true, message: 'Password reset successfully' });
        }

        return res.status(400).json({ error: 'Invalid action. Use "getQuestion" or "recover"' });
    } catch (error) {
        console.error('recover-password error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
