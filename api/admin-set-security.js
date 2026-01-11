// API endpoint to set security question for any account (admin/dev mode)

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

function encryptSecurityAnswer(answer) {
    const normalized = answer.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    return encrypt(hash);
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

async function updateSecurityQuestion(playerName, securityQuestion, securityAnswerHash) {
    const url = `${SUPABASE_URL}/rest/v1/leaderboard?player_name=eq.${encodeURIComponent(playerName)}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
            security_question: securityQuestion,
            security_answer_hash: securityAnswerHash,
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
        const { playerName, securityQuestion, securityAnswer } = req.body;

        // Validate required fields
        if (!playerName || playerName.trim() === '') {
            return res.status(400).json({ error: 'Player name required' });
        }
        if (!securityQuestion || securityQuestion.trim() === '') {
            return res.status(400).json({ error: 'Security question required' });
        }
        if (!securityAnswer || securityAnswer.trim().length < 1) {
            return res.status(400).json({ error: 'Security answer required' });
        }

        const name = playerName.trim();

        // Get player
        const player = await getPlayer(name);

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Encrypt and save security question/answer (overwrite existing)
        const securityAnswerHash = encryptSecurityAnswer(securityAnswer);
        await updateSecurityQuestion(name, securityQuestion.trim(), securityAnswerHash);

        console.log(`[ADMIN] Set security question for: ${name}`);

        return res.status(200).json({ success: true, message: 'Security question set successfully' });
    } catch (error) {
        console.error('admin-set-security error:', error);
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
}
