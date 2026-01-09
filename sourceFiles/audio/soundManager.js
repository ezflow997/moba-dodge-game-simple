// 8-bit Sound Manager using Web Audio API
export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sfxVolume = 0.05;
        this.enabled = true;
        this.initialized = false;
        this.musicInterval = null;
        this.isMusicPlaying = false;
        this.currentMeasure = 0;
        this.currentChord = 'Cm';

        // Background music properties
        this.menuMusic = null;
        this.gameMusic = null;
        this.currentMusic = null;
        this.bgMusicVolume = 0.01;
        this.musicUnlocked = false;
        this.pendingMusic = null; // Store which music to play after unlock
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Resume audio context (required after user interaction)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Create oscillator with envelope
    createOscillator(type, frequency, startTime, duration, volume = 1) {
        if (!this.enabled || !this.audioContext) return null;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(volume * this.sfxVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);

        return { osc, gain };
    }

    // Shoot sound - quick high-pitched blip
    playShoot() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Quick descending tone
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Explosion sound - noise burst with low rumble
    playExplosion() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // White noise burst
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        noise.start(now);
        noise.stop(now + 0.3);

        // Low frequency punch
        const osc = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

        oscGain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(oscGain);
        oscGain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Dash sound - quick whoosh
    playDash() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Filtered noise swoosh
        const bufferSize = this.audioContext.sampleRate * 0.15;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        filter.Q.setValueAtTime(5, now);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        noise.start(now);
        noise.stop(now + 0.15);

        // Add a quick high tone
        const osc = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

        oscGain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Player death - sad descending tones
    playPlayerDeath() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Descending arpeggio
        const notes = [523, 440, 349, 262, 196, 131];
        const noteLength = 0.12;

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * noteLength);

            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + i * noteLength);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLength + noteLength * 0.9);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(now + i * noteLength);
            osc.stop(now + i * noteLength + noteLength);
        });

        // Final explosion
        setTimeout(() => this.playExplosion(), notes.length * noteLength * 1000);
    }

    // Enemy death - quick pop
    playEnemyDeath() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Quick descending pop
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.12);

        // Small noise pop
        const bufferSize = this.audioContext.sampleRate * 0.05;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        noise.start(now);
        noise.stop(now + 0.06);
    }

    // Boss death - epic explosion sequence
    playBossDeath() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Multiple explosion hits
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playExplosion();
            }, i * 150);
        }

        // Victory fanfare after explosions
        setTimeout(() => {
            const notes = [523, 659, 784, 1047];
            const noteLength = 0.15;

            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * noteLength);

                gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.audioContext.currentTime + i * noteLength);
                gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.audioContext.currentTime + i * noteLength + noteLength * 0.8);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + i * noteLength + noteLength);

                osc.connect(gain);
                gain.connect(this.audioContext.destination);

                osc.start(this.audioContext.currentTime + i * noteLength);
                osc.stop(this.audioContext.currentTime + i * noteLength + noteLength);
            });
        }, 800);
    }

    // Boss hit sound
    playBossHit() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Heavy impact
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.2);

        // Crunch noise
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        noise.start(now);
        noise.stop(now + 0.12);
    }

    // Menu click sound
    playMenuClick() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Quick blip
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1000, now + 0.02);

        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Menu hover sound
    playMenuHover() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);

        gain.gain.setValueAtTime(0.05 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    // Boss spawn warning
    playBossWarning() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Warning siren
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            const startTime = now + i * 0.3;
            osc.frequency.setValueAtTime(440, startTime);
            osc.frequency.setValueAtTime(880, startTime + 0.15);

            gain.gain.setValueAtTime(0.2 * this.sfxVolume, startTime);
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, startTime + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        }
    }

    // ===== BACKGROUND MUSIC METHODS =====

    // Unlock music on first user interaction
    unlockMusic() {
        if (this.musicUnlocked) return;
        
        console.log('Music unlocked by user interaction');
        this.musicUnlocked = true;
        
        // Load the music files
        if (!this.menuMusic) {
            this.loadBackgroundMusic();
        }
        
        // If there was a pending music request, play it now
        if (this.pendingMusic === 'menu') {
            this.playMenuMusic();
        } else if (this.pendingMusic === 'game') {
            this.playGameMusic();
        }
        this.pendingMusic = null;
    }

    loadBackgroundMusic() {
        // Load menu music
        this.menuMusic = new Audio('audio/music/menu-music.mp3');
        this.menuMusic.volume = this.bgMusicVolume;
        this.menuMusic.loop = true;

        // Load game music
        this.gameMusic = new Audio('audio/music/game-music.mp3');
        this.gameMusic.volume = this.bgMusicVolume;
        this.gameMusic.loop = true;
        
        console.log('Background music loaded');
    }

    playMenuMusic() {
        if (!this.musicUnlocked) {
            console.log('Music not unlocked yet, waiting for user interaction');
            this.pendingMusic = 'menu';
            return;
        }
        
        if (this.currentMusic === 'menu') return; // Already playing
        
        this.stopAllMusic();
        
        if (!this.menuMusic) this.loadBackgroundMusic();
        
        this.menuMusic.play().then(() => {
            console.log('Menu music playing');
            this.currentMusic = 'menu';
        }).catch(err => {
            console.log('Menu music autoplay prevented:', err);
            this.pendingMusic = 'menu';
        });
    }

    playGameMusic() {
        if (!this.musicUnlocked) {
            console.log('Music not unlocked yet, waiting for user interaction');
            this.pendingMusic = 'game';
            return;
        }
        
        if (this.currentMusic === 'game') return; // Already playing
        
        this.stopAllMusic();
        
        if (!this.gameMusic) this.loadBackgroundMusic();
        
        this.gameMusic.play().then(() => {
            console.log('Game music playing');
            this.currentMusic = 'game';
        }).catch(err => {
            console.log('Game music autoplay prevented:', err);
            this.pendingMusic = 'game';
        });
    }

    stopAllMusic() {
        if (this.menuMusic) {
            this.menuMusic.pause();
            this.menuMusic.currentTime = 0;
        }
        if (this.gameMusic) {
            this.gameMusic.pause();
            this.gameMusic.currentTime = 0;
        }
        this.currentMusic = null;
    }

    setBgMusicVolume(vol) {
        this.bgMusicVolume = Math.max(0, Math.min(1, vol));
        if (this.menuMusic) this.menuMusic.volume = this.bgMusicVolume;
        if (this.gameMusic) this.gameMusic.volume = this.bgMusicVolume;
    }

    pauseMusic() {
        if (this.menuMusic) this.menuMusic.pause();
        if (this.gameMusic) this.gameMusic.pause();
    }

    resumeMusic() {
        if (this.currentMusic === 'menu' && this.menuMusic) {
            this.menuMusic.play();
        } else if (this.currentMusic === 'game' && this.gameMusic) {
            this.gameMusic.play();
        }
    }

    // Optional: Fade out music smoothly
    fadeOutMusic(callback, duration = 1000) {
        const currentAudio = this.currentMusic === 'menu' ? this.menuMusic : this.gameMusic;
        if (!currentAudio) return;
        
        const startVolume = currentAudio.volume;
        const steps = 50;
        const stepDuration = duration / steps;
        const volumeStep = startVolume / steps;
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            currentAudio.volume = Math.max(0, startVolume - (volumeStep * currentStep));
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                currentAudio.pause();
                currentAudio.volume = startVolume;
                if (callback) callback();
            }
        }, stepDuration);
    }

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setSfxVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
    }

    // Set master volume (0-1) - kept for backwards compatibility
    setVolume(vol) {
        this.setSfxVolume(vol);
    }
}