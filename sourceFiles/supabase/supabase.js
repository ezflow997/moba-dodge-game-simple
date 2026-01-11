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
            return data.exists ? {
                player_name: playerName,
                hasPassword: data.hasPassword,
                hasSecurityQuestion: data.hasSecurityQuestion
            } : null;
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

    // Submit score (with optional security question for new accounts)
    async submitScore(playerName, difficulty, score, kills, bestStreak, password, securityQuestion = null, securityAnswer = null) {
        try {
            const body = {
                playerName,
                difficulty,
                score,
                kills,
                bestStreak,
                password
            };

            // Add security question/answer if provided (for new accounts)
            if (securityQuestion && securityAnswer) {
                body.securityQuestion = securityQuestion;
                body.securityAnswer = securityAnswer;
            }

            const response = await fetch(`${this.apiBase}/submit-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
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

    // Change password (requires current password)
    async changePassword(playerName, currentPassword, newPassword) {
        try {
            const response = await fetch(`${this.apiBase}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error };
            }

            return data;
        } catch (error) {
            console.error('changePassword error:', error);
            return { error: error.message };
        }
    }

    // Get security question for password recovery
    async getSecurityQuestion(playerName) {
        try {
            const response = await fetch(`${this.apiBase}/recover-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    action: 'getQuestion'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error };
            }

            return data;
        } catch (error) {
            console.error('getSecurityQuestion error:', error);
            return { error: error.message };
        }
    }

    // Recover password using security answer
    async recoverPassword(playerName, securityAnswer, newPassword) {
        try {
            const response = await fetch(`${this.apiBase}/recover-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    action: 'recover',
                    securityAnswer,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error };
            }

            return data;
        } catch (error) {
            console.error('recoverPassword error:', error);
            return { error: error.message };
        }
    }

    // Search for players by name and get their ranks
    async searchPlayers(difficulty, searchQuery, daily = false) {
        try {
            let url = `${this.apiBase}/search-players?difficulty=${encodeURIComponent(difficulty)}&search=${encodeURIComponent(searchQuery)}`;
            if (daily) {
                url += '&daily=true';
            }

            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[Supabase] searchPlayers error:', error);
            return { matches: [] };
        }
    }

    // Get leaderboard for a specific difficulty with pagination and daily filter
    async getLeaderboard(difficulty, limit = 10, page = 1, daily = false, devMode = false) {
        try {
            let url = `${this.apiBase}/leaderboard?difficulty=${encodeURIComponent(difficulty)}&limit=${limit}&page=${page}`;
            if (daily) {
                url += '&daily=true';
            }
            if (devMode) {
                url += '&devMode=true';
            }

            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Supabase] Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('[Supabase] Data received:', data);

            // Return format: { entries: [], pagination: { page, limit, totalEntries, totalPages } }
            return data;
        } catch (error) {
            console.error('[Supabase] getLeaderboard error:', error);
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

    // =====================================================
    // RANKED TOURNAMENT METHODS
    // =====================================================

    // Submit ranked score
    async submitRankedScore(playerName, password, score, kills, bestStreak) {
        try {
            const response = await fetch(`${this.apiBase}/ranked-submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    password,
                    score,
                    kills,
                    bestStreak
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error, passwordError: data.passwordError || false };
            }

            return data;
        } catch (error) {
            console.error('submitRankedScore error:', error);
            return { error: error.message };
        }
    }

    // Get ranked queue status and player ELO
    async getRankedStatus(playerName = null) {
        try {
            let url = `${this.apiBase}/ranked-status`;
            if (playerName) {
                url += `?playerName=${encodeURIComponent(playerName)}`;
            }

            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('getRankedStatus error:', error);
            return { queueSize: 0, playersNeeded: 10 };
        }
    }

    // Get ELO-based ranked leaderboard
    async getRankedLeaderboard(limit = 10, page = 1) {
        try {
            const url = `${this.apiBase}/ranked-leaderboard?limit=${limit}&page=${page}`;
            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('getRankedLeaderboard error:', error);
            return { entries: [], pagination: { page: 1, limit: 10, totalEntries: 0, totalPages: 0 } };
        }
    }

    // Search ranked players by name
    async searchRankedPlayers(searchQuery) {
        try {
            const url = `${this.apiBase}/ranked-search?search=${encodeURIComponent(searchQuery)}`;
            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('searchRankedPlayers error:', error);
            return { matches: [] };
        }
    }

    // Admin: Force resolve all stuck ranked queues
    async fixStuckQueues(adminPassword) {
        try {
            const response = await fetch(`${this.apiBase}/ranked-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminPassword,
                    action: 'force_resolve_all'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error || `HTTP ${response.status}` };
            }

            return data;
        } catch (error) {
            console.error('fixStuckQueues error:', error);
            return { error: error.message };
        }
    }

    // Set security question for existing account (one-time only)
    async setSecurityQuestion(playerName, password, securityQuestion, securityAnswer) {
        try {
            const response = await fetch(`${this.apiBase}/set-security-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    password,
                    securityQuestion,
                    securityAnswer
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error };
            }

            return data;
        } catch (error) {
            console.error('setSecurityQuestion error:', error);
            return { error: error.message };
        }
    }

    // Change security question (requires password verification)
    async changeSecurityQuestion(playerName, password, securityQuestion, securityAnswer) {
        try {
            const response = await fetch(`${this.apiBase}/change-security-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    password,
                    securityQuestion,
                    securityAnswer
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error };
            }

            return data;
        } catch (error) {
            console.error('changeSecurityQuestion error:', error);
            return { error: error.message };
        }
    }

    // =====================================================
    // SHOP SYSTEM
    // =====================================================

    // Get shop data (points and inventory)
    async getShopData(playerName) {
        try {
            const url = `${this.apiBase}/shop?playerName=${encodeURIComponent(playerName)}`;
            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                const data = await response.json();
                return { error: data.error || `HTTP ${response.status}` };
            }

            return await response.json();
        } catch (error) {
            console.error('getShopData error:', error);
            return { error: error.message, points: 0, inventory: {} };
        }
    }

    // Purchase an item from the shop
    async purchaseItem(playerName, password, rewardId, rarityName, isPermanent) {
        try {
            const response = await fetch(`${this.apiBase}/shop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    password,
                    action: 'purchase',
                    rewardId,
                    rarityName,
                    isPermanent
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error || `HTTP ${response.status}` };
            }

            return data;
        } catch (error) {
            console.error('purchaseItem error:', error);
            return { error: error.message };
        }
    }

    // Consume single-use items after a game
    async consumeItems(playerName, password, rewardIds) {
        try {
            const response = await fetch(`${this.apiBase}/shop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    password,
                    action: 'consume',
                    rewardIds
                })
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: data.error || `HTTP ${response.status}` };
            }

            return data;
        } catch (error) {
            console.error('consumeItems error:', error);
            return { error: error.message };
        }
    }
}
