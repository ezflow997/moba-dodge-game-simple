// Poki SDK Integration
// Documentation: https://sdk.poki.com/

class PokiIntegration {
    constructor() {
        this.initialized = false;
        this.isPlaying = false;
        this.onPauseCallback = null;
        this.onResumeCallback = null;
    }

    // Initialize Poki SDK - call this before starting the game
    async init() {
        if (typeof PokiSDK === 'undefined') {
            console.warn('[Poki] SDK not loaded - running in standalone mode');
            this.initialized = false;
            return false;
        }

        try {
            await PokiSDK.init();
            this.initialized = true;
            console.log('[Poki] SDK initialized successfully');

            // Set up pause/resume handlers for when ads play
            PokiSDK.onPause(() => {
                console.log('[Poki] Game paused (ad playing)');
                if (this.onPauseCallback) {
                    this.onPauseCallback();
                }
            });

            PokiSDK.onResume(() => {
                console.log('[Poki] Game resumed (ad finished)');
                if (this.onResumeCallback) {
                    this.onResumeCallback();
                }
            });

            return true;
        } catch (error) {
            console.error('[Poki] Failed to initialize:', error);
            this.initialized = false;
            return false;
        }
    }

    // Set callbacks for pause/resume events
    setPauseCallbacks(onPause, onResume) {
        this.onPauseCallback = onPause;
        this.onResumeCallback = onResume;
    }

    // Call when gameplay starts (player starts playing)
    gameplayStart() {
        if (!this.initialized) return;

        if (!this.isPlaying) {
            PokiSDK.gameplayStart();
            this.isPlaying = true;
            console.log('[Poki] Gameplay started');
        }
    }

    // Call when gameplay stops (player dies, pauses, returns to menu)
    gameplayStop() {
        if (!this.initialized) return;

        if (this.isPlaying) {
            PokiSDK.gameplayStop();
            this.isPlaying = false;
            console.log('[Poki] Gameplay stopped');
        }
    }

    // Show a commercial break (interstitial ad)
    // Returns a promise that resolves when ad is done
    async commercialBreak() {
        if (!this.initialized) {
            console.log('[Poki] Skipping commercial break (not initialized)');
            return;
        }

        try {
            console.log('[Poki] Showing commercial break...');
            await PokiSDK.commercialBreak();
            console.log('[Poki] Commercial break finished');
        } catch (error) {
            console.error('[Poki] Commercial break error:', error);
        }
    }

    // Show a rewarded ad (player chooses to watch for reward)
    // Returns true if player watched the full ad, false otherwise
    async rewardedBreak() {
        if (!this.initialized) {
            console.log('[Poki] Skipping rewarded break (not initialized)');
            return false;
        }

        try {
            console.log('[Poki] Showing rewarded break...');
            const success = await PokiSDK.rewardedBreak();
            console.log('[Poki] Rewarded break result:', success);
            return success;
        } catch (error) {
            console.error('[Poki] Rewarded break error:', error);
            return false;
        }
    }

    // Check if SDK is ready
    isReady() {
        return this.initialized;
    }
}

// Export singleton instance
export const poki = new PokiIntegration();
