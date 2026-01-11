// 8-bit Sound Manager using Web Audio API
export class SoundManager {
    constructor() {
        this.audioContext = null;
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
        this.musicUnlocked = false;
        this.pendingMusic = null; // Store which music to play after unlock

        // Load saved volume settings from localStorage or use defaults
        const savedSfxVolume = localStorage.getItem('sfxVolume');
        const savedMusicVolume = localStorage.getItem('musicVolume');
        this.sfxVolume = savedSfxVolume !== null ? parseFloat(savedSfxVolume) : 0.05;
        this.bgMusicVolume = savedMusicVolume !== null ? parseFloat(savedMusicVolume) : 0.01;
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
            this.pendingMusic = 'menu';
            return;
        }

        if (this.currentMusic === 'menu' || this.pendingMusic === 'menu') return; // Already playing or waiting

        this.stopAllMusic();

        if (!this.menuMusic) this.loadBackgroundMusic();

        this.pendingMusic = 'menu'; // Mark as attempting
        this.menuMusic.play().then(() => {
            console.log('Menu music playing');
            this.currentMusic = 'menu';
            this.pendingMusic = null;
        }).catch(err => {
            // Silently wait for user interaction
            this.pendingMusic = 'menu';
        });
    }

    playGameMusic() {
        if (!this.musicUnlocked) {
            this.pendingMusic = 'game';
            return;
        }

        if (this.currentMusic === 'game' || this.pendingMusic === 'game') return; // Already playing or waiting

        this.stopAllMusic();

        if (!this.gameMusic) this.loadBackgroundMusic();

        this.pendingMusic = 'game'; // Mark as attempting
        this.gameMusic.play().then(() => {
            console.log('Game music playing');
            this.currentMusic = 'game';
            this.pendingMusic = null;
        }).catch(err => {
            // Silently wait for user interaction
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

    // ========== WEAPON-SPECIFIC SOUNDS ==========

    // Shotgun - powerful blast with spread effect
    playShootShotgun() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Low punch
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        // Noise burst for spread
        const bufferSize = this.audioContext.sampleRate * 0.08;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        noise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        noise.start(now);
        noise.stop(now + 0.1);
    }

    // Rapid Fire - quick staccato shots
    playShootRapidfire() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Piercing - sharp penetrating sound
    playShootPiercing() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Ricochet - bouncy metallic ping
    playShootRicochet() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.02);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Ricochet bounce sound
    playRicochetBounce() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Homing - missile launch with ascending tone
    playShootHoming() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.2);

        // Slight whoosh
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(400, now);
        osc2.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain2.gain.setValueAtTime(0.08 * this.sfxVolume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.15);
    }

    // Twin/Multi-shot - double blip
    playShootTwin() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        // First shot
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(700, now);
        osc1.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain1.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);
        osc1.start(now);
        osc1.stop(now + 0.08);

        // Second shot slightly delayed
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(750, now + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(450, now + 0.07);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(0.12 * this.sfxVolume, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.1);
    }

    // Nova - expanding burst
    playShootNova() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.25);

        // Add shimmer
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1000, now);
        osc2.frequency.exponentialRampToValueAtTime(500, now + 0.15);
        gain2.gain.setValueAtTime(0.08 * this.sfxVolume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.2);
    }

    // Chain Lightning - electric zap
    playShootChain() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        // Electric crackle using rapid frequency modulation
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        // Rapid frequency jumps for electric effect
        for (let i = 0; i < 5; i++) {
            const t = now + i * 0.02;
            osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
        }
        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        // High pitched zap
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(2000, now);
        osc2.frequency.exponentialRampToValueAtTime(500, now + 0.08);
        gain2.gain.setValueAtTime(0.1 * this.sfxVolume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.12);
    }

    // Chain lightning jump between enemies
    playChainJump() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
        gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // ========== BOSS ATTACK SOUNDS ==========

    // Standard Boss projectile fire
    playBossShoot() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Charge Boss windup warning
    playBossChargeWindup() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.5);
        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.65);
    }

    // Charge Boss dash attack
    playBossChargeDash() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        // Whoosh
        const bufferSize = this.audioContext.sampleRate * 0.25;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        noise.start(now);
        noise.stop(now + 0.3);
    }

    // Vortex Boss homing missile launch
    playBossHomingMissile() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.2);
        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Vortex Boss spiral attack
    playBossSpiralAttack() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        // Spinning up sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        // Release burst
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, now + 0.25);
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.4);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(0.15 * this.sfxVolume, now + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.5);
    }

    // Vortex Boss pulse expansion
    playBossPulse() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    // Vortex Boss void zone spawn
    playBossVoidZone() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // ========== SHOOTER BOSS SOUNDS ==========

    // Shooter Boss unique projectile fire (fiery, aggressive)
    playShooterBossShoot() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Main fire sound - aggressive sawtooth
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.18);

        // Crackling overlay
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain2.gain.setValueAtTime(0.08 * this.sfxVolume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.12);
    }

    // ========== PHANTOM BOSS SOUNDS ==========

    // Phantom Boss teleport (glitchy, ethereal)
    playBossTeleport() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Glitchy digital sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(800, now + 0.05);
        osc.frequency.setValueAtTime(1500, now + 0.1);
        osc.frequency.setValueAtTime(400, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        // Whoosh/phase shift
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, now);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain2.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.3);
    }

    // Phantom Boss toxic burst attack
    playPhantomBurst() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Toxic spray sound
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        filter.Q.value = 2;
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        noise.start(now);
        noise.stop(now + 0.25);

        // Acidic tone
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Phantom Boss afterimage attack
    playPhantomAfterimage() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Ghostly whisper/echo
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.25);

        // Phasing overlay
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(350, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.18);
        gain2.gain.setValueAtTime(0.08 * this.sfxVolume, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.25);
    }

    // Phantom Boss toxic fog spawn
    playPhantomFog() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Low rumble with hiss
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        // Hissing
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        noise.start(now);
        noise.stop(now + 0.35);
    }

    // Phantom Boss shadow clone spawn
    playPhantomClone() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Dark splitting sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        // Echo effect
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(200, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.35);
        gain2.gain.setValueAtTime(0.1 * this.sfxVolume, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.45);
    }

    // Orbital shield hit
    playOrbitalHit() {
        if (!this.enabled) return;
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.1);
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