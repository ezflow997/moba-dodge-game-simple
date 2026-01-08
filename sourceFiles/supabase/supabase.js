// Leaderboard API Client
// Calls serverless functions instead of Supabase directly
// No API keys exposed to the client!

// API base URL - will be same origin when deployed to Vercel
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'  // For local development with vercel dev
    : '/api';  // For production (same origin)

export class SupabaseLeaderboard {
    constructor() {
        this.apiBase = API_BASE;
    }

    // Check if a player name exists
    async checkPlayerExists(playerName) {
        try {
            const response = await fetch(`${this.apiBase}/check-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            // Return format compatible with existing code
            return data.exists ? { player_name: playerName, hasPassword: data.hasPassword } : null;
        } catch (error) {
            console.error('checkPlayerExists error:', error);
            return null;
        }
    }

    // Verify password for existing player
    async verifyPassword(playerName, password) {
        try {
            const response = await fetch(`${this.apiBase}/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName, password })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('verifyPassword error:', error);
            return { exists: false, error: error.message };
        }
    }

    // Submit score
    async submitScore(playerName, difficulty, score, kills, bestStreak, password) {
        try {
            const response = await fetch(`${this.apiBase}/submit-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    difficulty,
                    score,
                    kills,
                    bestStreak,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error, passwordError: data.passwordError || false };
            }

            return data;
        } catch (error) {
            console.error('submitScore error:', error);
            return { error: error.message };
        }
    }

    // Get leaderboard for a specific difficulty
    async getLeaderboard(difficulty, limit = 10) {
        try {
            const response = await fetch(
                `${this.apiBase}/leaderboard?difficulty=${encodeURIComponent(difficulty)}&limit=${limit}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('getLeaderboard error:', error);
            return [];
        }
    }

    // Get all leaderboards (for all difficulties)
    async getAllLeaderboards(limit = 10) {
        const difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
        const results = {};

        for (const diff of difficulties) {
            results[diff] = await this.getLeaderboard(diff, limit);
        }

        return results;
    }
}
