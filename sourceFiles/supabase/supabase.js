// Leaderboard API Client
// Calls serverless functions instead of Supabase directly
// No API keys exposed to the client!

// API base URL - use production API for both local and deployed
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'https://moba-dodge-simple.vercel.app/api'  // Use production API for local testing
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

    // Get leaderboard for a specific difficulty with pagination and daily filter
    async getLeaderboard(difficulty, limit = 10, page = 1, daily = false) {
        try {
            let url = `${this.apiBase}/leaderboard?difficulty=${encodeURIComponent(difficulty)}&limit=${limit}&page=${page}`;
            if (daily) {
                url += '&daily=true';
            }

            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Return format: { entries: [], pagination: { page, limit, totalEntries, totalPages } }
            return data;
        } catch (error) {
            console.error('getLeaderboard error:', error);
            return { entries: [], pagination: { page: 1, limit: 10, totalEntries: 0, totalPages: 0 } };
        }
    }

    // Get all leaderboards (for all difficulties) - first page only
    async getAllLeaderboards(limit = 10) {
        const difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
        const results = {};

        for (const diff of difficulties) {
            const data = await this.getLeaderboard(diff, limit, 1, false);
            results[diff] = data.entries || [];
        }

        return results;
    }
}
