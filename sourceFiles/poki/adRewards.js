// Ad Rewards System
// Handles rewarded ads that give players shop points and random rewards

import { poki } from './pokiSDK.js';
import { REWARDS, RARITY } from '../controller/rewardTypes.js';

// Map rarity names to RARITY constants
const RARITY_MAP = {
    'Common': RARITY.COMMON,
    'Uncommon': RARITY.UNCOMMON,
    'Rare': RARITY.RARE,
    'Epic': RARITY.EPIC,
    'Legendary': RARITY.LEGENDARY,
    'S-Tier': RARITY.STIER
};

class AdRewardSystem {
    constructor() {
        this.isProcessing = false;
        this.lastRewardTime = 0;
        this.cooldownMs = 60000; // 1 minute cooldown between ad rewards

        // Notification state
        this.notification = null;
        this.notificationStartTime = 0;
        this.notificationDuration = 5000; // 5 seconds
    }

    // Check if running on Poki domain
    isOnPoki() {
        return window.location.hostname.includes('poki.com');
    }

    // Check if ad reward is available
    canWatchAd() {
        if (this.isProcessing) return false;
        const elapsed = Date.now() - this.lastRewardTime;
        return elapsed >= this.cooldownMs;
    }

    // Get remaining cooldown in seconds
    getCooldownRemaining() {
        const elapsed = Date.now() - this.lastRewardTime;
        const remaining = Math.max(0, this.cooldownMs - elapsed);
        return Math.ceil(remaining / 1000);
    }

    // Get all rewards of a specific rarity
    getRewardsByRarity(rarityName) {
        const rarity = RARITY_MAP[rarityName];
        if (!rarity) return [];

        return Object.values(REWARDS).filter(reward => reward.rarity === rarity);
    }

    // Select a random reward from a rarity tier
    selectRandomReward(rarityName) {
        const rewards = this.getRewardsByRarity(rarityName);
        if (rewards.length === 0) return null;

        const index = Math.floor(Math.random() * rewards.length);
        return rewards[index];
    }

    // Watch ad and claim reward
    async watchAdForReward(game) {
        // Only allow rewards on Poki domain
        if (!this.isOnPoki()) {
            this.showNotification({
                type: 'info',
                message: 'Ad rewards are only available on Poki.com'
            });
            return null;
        }

        if (!this.canWatchAd()) {
            const remaining = this.getCooldownRemaining();
            this.showNotification({
                type: 'error',
                message: `Please wait ${remaining}s before watching another ad`
            });
            return null;
        }

        if (!game.playerName || !game.playerPassword) {
            this.showNotification({
                type: 'error',
                message: 'Please log in to claim ad rewards'
            });
            return null;
        }

        this.isProcessing = true;

        try {
            // Show rewarded ad via Poki SDK
            const watched = await poki.rewardedBreak();

            if (!watched) {
                this.isProcessing = false;
                this.showNotification({
                    type: 'info',
                    message: 'Ad skipped - no reward given'
                });
                return null;
            }

            // Claim reward from server (gets rarity roll and points)
            const result = await game.supabase.claimAdReward(
                game.playerName,
                game.playerPassword
            );

            if (result.error) {
                this.isProcessing = false;
                this.showNotification({
                    type: 'error',
                    message: result.error
                });
                return null;
            }

            // Select a random reward of the given rarity
            const selectedReward = this.selectRandomReward(result.rewardRarity);

            if (!selectedReward) {
                this.isProcessing = false;
                // Still got points even if no reward selected
                this.showNotification({
                    type: 'success',
                    message: `+${result.bonusPoints} Shop Points!`,
                    points: result.bonusPoints
                });
                return result;
            }

            // Grant the reward to player's inventory
            const grantResult = await game.supabase.grantReward(
                game.playerName,
                game.playerPassword,
                selectedReward.id,
                result.isPermanent
            );

            if (grantResult.error) {
                console.error('Failed to grant reward:', grantResult.error);
            }

            this.lastRewardTime = Date.now();
            this.isProcessing = false;

            // Update menu shop points if available
            if (game.menu) {
                game.menu.shopPoints = result.newPoints;
            }

            // Show notification with reward details
            this.showNotification({
                type: 'reward',
                message: result.isPermanent ? 'PERMANENT UNLOCK!' : 'New Item!',
                points: result.bonusPoints,
                reward: selectedReward,
                isPermanent: result.isPermanent,
                rarity: result.rewardRarity
            });

            return {
                ...result,
                reward: selectedReward
            };

        } catch (error) {
            console.error('Ad reward error:', error);
            this.isProcessing = false;
            this.showNotification({
                type: 'error',
                message: 'Failed to claim reward'
            });
            return null;
        }
    }

    // Show notification
    showNotification(data) {
        this.notification = data;
        this.notificationStartTime = Date.now();
    }

    // Update notification state
    update() {
        if (this.notification) {
            const elapsed = Date.now() - this.notificationStartTime;
            if (elapsed >= this.notificationDuration) {
                this.notification = null;
            }
        }
    }

    // Draw notification on screen
    draw(context, game) {
        if (!this.notification) return;

        const elapsed = Date.now() - this.notificationStartTime;
        const progress = elapsed / this.notificationDuration;

        // Fade in/out
        let alpha = 1;
        if (progress < 0.1) {
            alpha = progress / 0.1;
        } else if (progress > 0.8) {
            alpha = (1 - progress) / 0.2;
        }

        const rX = window.innerWidth / 2560;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        context.save();
        context.globalAlpha = alpha;

        // Background panel
        const panelWidth = 500 * rX;
        const panelHeight = this.notification.reward ? 280 * rX : 150 * rX;
        const panelX = centerX - panelWidth / 2;
        const panelY = centerY - panelHeight / 2;

        // Panel background
        context.fillStyle = 'rgba(0, 0, 0, 0.9)';
        context.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Border color based on type/rarity
        let borderColor = '#00ffff';
        if (this.notification.type === 'error') {
            borderColor = '#ff4444';
        } else if (this.notification.type === 'reward' && this.notification.reward) {
            borderColor = this.notification.reward.rarity.color;
        }

        context.strokeStyle = borderColor;
        context.lineWidth = 3 * rX;
        context.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Title
        context.fillStyle = borderColor;
        context.font = `bold ${32 * rX}px Arial`;
        context.textAlign = 'center';

        let title = 'AD REWARD';
        if (this.notification.type === 'error') title = 'ERROR';
        if (this.notification.isPermanent) title = 'PERMANENT UNLOCK!';

        context.fillText(title, centerX, panelY + 45 * rX);

        // Points earned
        if (this.notification.points) {
            context.fillStyle = '#ffdd00';
            context.font = `bold ${28 * rX}px Arial`;
            context.fillText(`+${this.notification.points} Shop Points`, centerX, panelY + 85 * rX);
        }

        // Reward details
        if (this.notification.reward) {
            const reward = this.notification.reward;

            // Reward name with rarity color
            context.fillStyle = reward.rarity.color;
            context.font = `bold ${26 * rX}px Arial`;
            context.fillText(reward.name, centerX, panelY + 135 * rX);

            // Rarity name
            context.fillStyle = reward.rarity.color;
            context.font = `${20 * rX}px Arial`;
            context.fillText(
                `${reward.rarity.name}${this.notification.isPermanent ? ' (PERMANENT)' : ''}`,
                centerX,
                panelY + 170 * rX
            );

            // Description
            context.fillStyle = '#aaaaaa';
            context.font = `${18 * rX}px Arial`;
            context.fillText(reward.description, centerX, panelY + 205 * rX);

            // Category
            context.fillStyle = '#888888';
            context.font = `${16 * rX}px Arial`;
            context.fillText(`Category: ${reward.category.toUpperCase()}`, centerX, panelY + 235 * rX);
        } else if (this.notification.message) {
            // Simple message
            context.fillStyle = '#ffffff';
            context.font = `${22 * rX}px Arial`;
            context.fillText(this.notification.message, centerX, panelY + (this.notification.points ? 120 : 90) * rX);
        }

        // Click to dismiss hint
        context.fillStyle = '#666666';
        context.font = `${14 * rX}px Arial`;
        context.fillText('Click anywhere to dismiss', centerX, panelY + panelHeight - 15 * rX);

        context.restore();
    }

    // Check if notification is visible (for click handling)
    hasNotification() {
        return this.notification !== null;
    }

    // Dismiss notification
    dismissNotification() {
        this.notification = null;
    }
}

// Export singleton instance
export const adRewards = new AdRewardSystem();
