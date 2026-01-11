import { Button, superFunctions } from "./supers.js";
import { performanceMode, setPerformanceMode } from "../controller/enemy.js";

// UI Scale setting - exported for use by other modules
let uiScale = 1.0;

export function getUIScale() {
    return uiScale;
}

export function setUIScale(value) {
    uiScale = Math.max(0.5, Math.min(2.0, value));
    localStorage.setItem('uiScale', uiScale.toString());
}

// Load UI scale from localStorage on module init
const savedUIScale = localStorage.getItem('uiScale');
if (savedUIScale !== null) {
    uiScale = parseFloat(savedUIScale);
}

export class PauseMenu {
    constructor() {
        this.super = new superFunctions();
        this.isPaused = false;
        this.clicked = false;
        this.capturedKey = null;

        this.keybindWaitStart = 0; // Timestamp when keybind wait started
        this.keybindWaitDelay = 300; // Delay in ms before accepting input

        // Main pause menu buttons - centered text, clean sizing
        const btnX = 930;
        const btnW = 700;
        const btnH = 70;
        const btnSpace = 85;
        const fontSize = 32;

        this.resumeButton = new Button(btnX, 280, btnW, btnH, "Resume (ESC)", fontSize, 0, 0, false, true, 'white', 'white');
        this.audioButton = new Button(btnX, 280 + btnSpace, btnW, btnH, "Audio", fontSize, 0, 0, false, true, 'white', 'white');
        this.controlsButton = new Button(btnX, 280 + btnSpace * 2, btnW, btnH, "Controls", fontSize, 0, 0, false, true, 'white', 'white');
        this.uiScaleButton = new Button(btnX, 280 + btnSpace * 3, btnW, btnH, "UI Scale", fontSize, 0, 0, false, true, 'white', 'white');
        this.performanceButton = new Button(btnX, 280 + btnSpace * 4, btnW, btnH, "Performance Mode: OFF", fontSize, 0, 0, false, true, 'white', 'white');
        this.devModeButton = new Button(btnX, 280 + btnSpace * 5, btnW, btnH, "Dev Mode: OFF", fontSize, 0, 0, false, true, 'white', 'white');
        this.exitTestRoomButton = new Button(btnX, 280 + btnSpace * 6, btnW, btnH, "Exit Test Room", fontSize, 0, 0, false, true, 'white', 'white');
        this.quitButton = new Button(btnX, 280 + btnSpace * 7, btnW, btnH, "Quit to Menu", fontSize, 0, 0, false, true, 'white', 'white');

        // Audio submenu buttons
        this.audioToggleButton = new Button(btnX, 280, btnW, btnH, "Audio: ON", fontSize, 0, 0, false, true, 'white', 'white');
        this.volumeButton = new Button(btnX, 280 + btnSpace, btnW, btnH, "Volume", fontSize, 0, 0, false, true, 'white', 'white');
        this.musicSelectionButton = new Button(btnX, 280 + btnSpace * 2, btnW, btnH, "Music Selection", fontSize, 0, 0, false, true, 'white', 'white');
        this.audioBackButton = new Button(btnX, 280 + btnSpace * 3, btnW, btnH, "Back", fontSize, 0, 0, false, true, 'white', 'white');

        // Initialize audio toggle button text based on saved state
        const savedAudioEnabled = localStorage.getItem('audioEnabled');
        if (savedAudioEnabled === 'false') {
            this.audioToggleButton.text = "Audio: OFF";
        }

        // Controls submenu buttons
        this.controlSchemeButton = new Button(btnX, 280, btnW, btnH, "Controls: Mouse", fontSize, 0, 0, false, true, 'white', 'white');
        this.keybindsButton = new Button(btnX, 280 + btnSpace, btnW, btnH, "Keybinds", fontSize, 0, 0, false, true, 'white', 'white');
        this.controlsBackButton = new Button(btnX, 280 + btnSpace * 2, btnW, btnH, "Back", fontSize, 0, 0, false, true, 'white', 'white');

        // Load performance mode setting from localStorage
        const savedPerfMode = localStorage.getItem('performanceMode') === 'true';
        if (savedPerfMode) {
            setPerformanceMode(true);
            this.performanceButton.text = "Performance Mode: ON";
        }

        // Dev mode visibility - hidden by default, revealed with konami code
        this.devModeVisible = false;
        this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight'];
        this.konamiProgress = 0;
        this.lastKonamiTime = 0;
        this.lastCheckedPlayer = ''; // Track which player we last checked
        this.gameRef = null; // Reference to game for event handlers

        // Submenu states
        this.showAudio = false;
        this.showControls = false;
        this.showKeybinds = false;
        this.showVolume = false;
        this.showUIScale = false;
        this.showMusicSelection = false;

        // Keybinds submenu - centered like other panels
        this.keybindQButton = new Button(btnX, 280, btnW, btnH, "Shoot: Q", fontSize, 0, 0, false, true, 'white', 'white');
        this.keybindEButton = new Button(btnX, 280 + btnSpace, btnW, btnH, "Dash: E", fontSize, 0, 0, false, true, 'white', 'white');
        this.keybindFButton = new Button(btnX, 280 + btnSpace * 2, btnW, btnH, "Ultimate: F", fontSize, 0, 0, false, true, 'white', 'white');
        // Mouse mode: Move button (slot 3)
        this.keybindMoveButton = new Button(btnX, 280 + btnSpace * 3, btnW, btnH, "Move: Right Click", fontSize, 0, 0, false, true, 'white', 'white');
        // WASD mode: Movement direction buttons (slots 3-6)
        this.keybindUpButton = new Button(btnX, 280 + btnSpace * 3, btnW, btnH, "Up: W", fontSize, 0, 0, false, true, 'white', 'white');
        this.keybindDownButton = new Button(btnX, 280 + btnSpace * 4, btnW, btnH, "Down: S", fontSize, 0, 0, false, true, 'white', 'white');
        this.keybindLeftButton = new Button(btnX, 280 + btnSpace * 5, btnW, btnH, "Left: A", fontSize, 0, 0, false, true, 'white', 'white');
        this.keybindRightButton = new Button(btnX, 280 + btnSpace * 6, btnW, btnH, "Right: D", fontSize, 0, 0, false, true, 'white', 'white');
        // Pause button position varies by control scheme (set dynamically)
        this.keybindPauseButton = new Button(btnX, 280 + btnSpace * 4, btnW, btnH, "Pause: Escape", fontSize, 0, 0, false, true, 'white', 'white');
        this.keybindBackButton = new Button(btnX, 280 + btnSpace * 5, btnW, btnH, "Back", fontSize, 0, 0, false, true, 'white', 'white');
        this.waitingForKey = null; // 'q', 'e', 'f', 'move', 'up', 'down', 'left', 'right', or 'pause'

        // Load custom keys from localStorage or use defaults
        const savedCustomKeys = localStorage.getItem('customKeys');
        this.customKeys = savedCustomKeys ? JSON.parse(savedCustomKeys) : { q: 'q', e: 'e', f: 'f', move: 2 };
        // Ensure move key exists for older saves
        if (this.customKeys.move === undefined) this.customKeys.move = 2;

        // Control scheme: 'mouse' or 'wasd' - load from localStorage
        this.controlScheme = localStorage.getItem('controlScheme') || 'mouse';
        this.controlSchemeButton.text = `Controls: ${this.controlScheme === 'mouse' ? 'Mouse' : 'WASD'}`;

        // WASD mode keybinds - load from localStorage or use defaults
        const savedWasdKeys = localStorage.getItem('wasdKeys');
        this.wasdKeys = savedWasdKeys ? JSON.parse(savedWasdKeys) : {
            shoot: 0,  // Left click (mouse button 0)
            dash: 'e',
            ult: 'q',
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd'
        };
        // Ensure movement keys exist for older saves
        if (this.wasdKeys.up === undefined) this.wasdKeys.up = 'w';
        if (this.wasdKeys.down === undefined) this.wasdKeys.down = 's';
        if (this.wasdKeys.left === undefined) this.wasdKeys.left = 'a';
        if (this.wasdKeys.right === undefined) this.wasdKeys.right = 'd';

        // Pause key - load from localStorage or use default (Escape)
        this.pauseKey = localStorage.getItem('pauseKey') || 'Escape';

        // Update keybind button text based on loaded control scheme
        this.updateKeybindButtons();

        // Volume submenu - centered like other panels
        this.musicVolumeSlider = new Slider(930, 340, 700, 30, 0, 1);
        this.sfxVolumeSlider = new Slider(930, 460, 700, 30, 0, 1);
        this.volumeBackButton = new Button(btnX, 560, btnW, btnH, "Back", fontSize, 0, 0, false, true, 'white', 'white');

        // UI Scale submenu - centered like other panels
        this.uiScaleSlider = new Slider(930, 350, 700, 30, 0.5, 2.0);
        this.uiScaleSlider.setValue(uiScale); // Initialize with current value
        this.uiScaleBackButton = new Button(btnX, 480, btnW, btnH, "Back", fontSize, 0, 0, false, true, 'white', 'white');

        // Music Selection submenu
        this.musicSelectionBackButton = new Button(1280, 680, 300, 60, "Back", 32, 0, 0, false, true, 'white', 'white');
        this.musicEnableButton = new Button(1030, 580, 200, 55, "Enable", 28, 0, 0, false, true, '#66ff66', '#88ff88');
        this.musicDisableButton = new Button(1260, 580, 200, 55, "Disable", 28, 0, 0, false, true, '#ff6666', '#ff8888');
        this.selectedTrackIndex = 0; // Currently selected track in the list
        this.trackListScrollOffset = 0; // For scrolling if many tracks
        this.visibleTrackCount = 5; // How many tracks visible at once

        // Music category tabs (game vs menu music)
        this.musicCategoryTab = 'game'; // 'game' or 'menu'
        this.gameTabButton = new Button(1030, 140, 200, 45, "Game", 24, 0, 0, false, true, '#00ffff', '#00ffff');
        this.menuTabButton = new Button(1260, 140, 200, 45, "Menu", 24, 0, 0, false, true, 'white', 'white');

        // keyboard key down listener
        this.keydownHandler = (ev) => {
            if (this.waitingForKey) {
                ev.preventDefault();
                this.capturedKey = ev.key;
            }

            // Konami code detection (only when pause menu is open and not in submenu)
            if (this.isPaused && !this.showAudio && !this.showControls && !this.showKeybinds && !this.showVolume && !this.showUIScale && !this.showMusicSelection && !this.waitingForKey) {
                this.checkKonamiCode(ev.key, this.gameRef);
            }
        };
        window.addEventListener('keydown', this.keydownHandler);

        // mouse button listener
        this.mouseButtonHandler = (ev) => {
            if (this.waitingForKey) {
                ev.preventDefault();
                this.capturedKey = ev.button;
            }
        };
        window.addEventListener('mousedown', this.mouseButtonHandler);
    }

    toggle(inMainMenu = false) {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            // Only pause music when in gameplay, not in main menu
            if (window.gameSound && !inMainMenu) {
                window.gameSound.pauseMusic();
            }
            // Reset konami progress when opening menu
            this.konamiProgress = 0;
        } else {
            // Only resume music when in gameplay, not in main menu
            if (window.gameSound && !inMainMenu) {
                window.gameSound.resumeMusic();
            }
            // Close all submenus when unpausing
            this.showAudio = false;
            this.showControls = false;
            this.showKeybinds = false;
            this.showVolume = false;
            this.showUIScale = false;
            this.showMusicSelection = false;
            this.waitingForKey = null;
            // Reset konami progress
            this.konamiProgress = 0;
        }
    }

    /**
     * Check for konami code input to reveal dev mode
     */
    checkKonamiCode(key, game) {
        const now = performance.now();

        // Reset if too much time passed (2 seconds)
        if (now - this.lastKonamiTime > 2000) {
            this.konamiProgress = 0;
        }
        this.lastKonamiTime = now;

        // Check if key matches next in sequence
        if (key === this.konamiCode[this.konamiProgress]) {
            this.konamiProgress++;

            // Complete code entered
            if (this.konamiProgress === this.konamiCode.length) {
                this.devModeVisible = true;
                this.konamiProgress = 0;
                if (window.gameSound) window.gameSound.playMenuClick();

                // Save unlock state for logged-in player
                if (game && game.playerName) {
                    localStorage.setItem(`devModeUnlocked_${game.playerName}`, 'true');
                }
            }
        } else {
            // Wrong key, reset
            this.konamiProgress = 0;
        }
    }

    /**
     * Check if dev mode is unlocked for the current player
     */
    checkDevModeUnlock(game) {
        if (!game) return;

        // Only check when player changes
        const currentPlayer = game.playerName || '';
        if (currentPlayer === this.lastCheckedPlayer) return;
        this.lastCheckedPlayer = currentPlayer;

        // Check if this player has unlocked dev mode
        if (currentPlayer) {
            const isUnlocked = localStorage.getItem(`devModeUnlocked_${currentPlayer}`) === 'true';
            if (isUnlocked) {
                this.devModeVisible = true;
            }
        } else {
            // Not logged in - reset visibility unless dev mode is already on
            if (!game.devMode || !game.devMode.isEnabled()) {
                this.devModeVisible = false;
            }
        }
    }

    update(game) {
        // Store game reference for event handlers
        this.gameRef = game;

        // Check if dev mode is unlocked for current player
        this.checkDevModeUnlock(game);

        if (!this.isPaused) return;

        const input = game.input;
        const inX = input.mouseX;
        const inY = input.mouseY;

        // Handle click state
        if (this.clicked && input.buttons.indexOf(0) == -1) {
            this.clicked = false;
        }

        // Handle keybind waiting state
        if (this.waitingForKey && this.capturedKey !== null) {
            // Check if enough time has passed since starting to wait
            const timeSinceStart = performance.now() - this.keybindWaitStart;
            if (timeSinceStart < this.keybindWaitDelay) {
                // Too soon, ignore this input
                this.capturedKey = null;
                return;
            }

            const pressedKey = this.capturedKey;
            this.capturedKey = null;

            // Handle pause key binding separately (only keyboard keys allowed)
            if (this.waitingForKey === 'pause') {
                // Reject mouse buttons for pause key
                if (typeof pressedKey === 'number') {
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.keybindPauseButton.text = "Pause: Keyboard only!";
                    setTimeout(() => {
                        if (this.waitingForKey === 'pause') {
                            this.keybindPauseButton.text = "Pause: Press any key...";
                        }
                    }, 500);
                    return;
                }

                // Valid key, assign it
                this.pauseKey = pressedKey;
                localStorage.setItem('pauseKey', this.pauseKey);
                this.waitingForKey = null;
                this.updateKeybindButtons();
                if (window.gameSound) window.gameSound.playMenuClick();
                return;
            }

            // Cancel if ESC is pressed - go back to Controls submenu
            if (pressedKey === 'Escape') {
                this.waitingForKey = null;
                this.showKeybinds = false;
                this.updateKeybindButtons();
                // Clear key flags so main.js doesn't also close the pause menu
                input.escapePressed = false;
                input.pauseKeyPressed = false;
                return;
            }

            // In mouse mode, ONLY allow keyboard keys (not mouse buttons) for ability keys (q, e, f)
            // BUT allow mouse buttons for the 'move' keybind
            if (this.controlScheme === 'mouse' && typeof pressedKey === 'number' && this.waitingForKey !== 'move') {
                // Reject mouse buttons in mouse mode for abilities
                if (window.gameSound) window.gameSound.playMenuClick();
                const currentSlot = this.waitingForKey;

                if (currentSlot === 'q') {
                    this.keybindQButton.text = "Shoot: Keyboard only!";
                } else if (currentSlot === 'e') {
                    this.keybindEButton.text = "Dash: Keyboard only!";
                } else if (currentSlot === 'f') {
                    this.keybindFButton.text = "Ultimate: Keyboard only!";
                }

                setTimeout(() => {
                    if (this.waitingForKey === currentSlot) {
                        if (currentSlot === 'q') {
                            this.keybindQButton.text = "Shoot: Press any key...";
                        } else if (currentSlot === 'e') {
                            this.keybindEButton.text = "Dash: Press any key...";
                        } else if (currentSlot === 'f') {
                            this.keybindFButton.text = "Ultimate: Press any key...";
                        }
                    }
                }, 500);
                return;
            }

            // Check if key is already assigned to another slot
            let isAlreadyUsed = false;
            const currentKeys = this.controlScheme === 'mouse' ? this.customKeys : this.wasdKeys;
            const slots = this.controlScheme === 'mouse'
                ? ['q', 'e', 'f', 'move']
                : ['shoot', 'dash', 'ult', 'up', 'down', 'left', 'right'];

            // Map waitingForKey to actual slot name
            let currentSlotName;
            if (this.controlScheme === 'mouse') {
                currentSlotName = this.waitingForKey; // 'q', 'e', 'f', or 'move' maps directly
            } else {
                // WASD mode mapping
                const wasdSlotMap = { 'q': 'shoot', 'e': 'dash', 'f': 'ult', 'up': 'up', 'down': 'down', 'left': 'left', 'right': 'right' };
                currentSlotName = wasdSlotMap[this.waitingForKey] || this.waitingForKey;
            }

            for (let slot of slots) {
                if (slot !== currentSlotName && currentKeys[slot] === pressedKey) {
                    isAlreadyUsed = true;
                    break;
                }
            }

            if (!isAlreadyUsed) {
                // Valid key, assign it
                if (this.controlScheme === 'mouse') {
                    this.customKeys[this.waitingForKey] = pressedKey;
                    localStorage.setItem('customKeys', JSON.stringify(this.customKeys));
                } else {
                    const wasdSlotMap = { 'q': 'shoot', 'e': 'dash', 'f': 'ult', 'up': 'up', 'down': 'down', 'left': 'left', 'right': 'right' };
                    const wasdSlot = wasdSlotMap[this.waitingForKey] || this.waitingForKey;
                    this.wasdKeys[wasdSlot] = pressedKey;
                    localStorage.setItem('wasdKeys', JSON.stringify(this.wasdKeys));
                }
                this.waitingForKey = null;
                this.updateKeybindButtons();
                if (window.gameSound) window.gameSound.playMenuClick();
            } else {
                // Key already in use, show error
                if (window.gameSound) window.gameSound.playMenuClick();
                const currentSlot = this.waitingForKey;

                // Show error on the appropriate button
                const errorButtons = {
                    'q': this.keybindQButton, 'e': this.keybindEButton, 'f': this.keybindFButton,
                    'move': this.keybindMoveButton,
                    'up': this.keybindUpButton, 'down': this.keybindDownButton,
                    'left': this.keybindLeftButton, 'right': this.keybindRightButton
                };
                const errorLabels = {
                    'q': 'Shoot', 'e': 'Dash', 'f': 'Ult',
                    'move': 'Move',
                    'up': 'Up', 'down': 'Down', 'left': 'Left', 'right': 'Right'
                };

                if (errorButtons[currentSlot]) {
                    errorButtons[currentSlot].text = `${errorLabels[currentSlot]}: Already in use!`;
                    setTimeout(() => {
                        if (this.waitingForKey === currentSlot) {
                            errorButtons[currentSlot].text = `${errorLabels[currentSlot]}: Press any key...`;
                        }
                    }, 500);
                }
            }
        }

        // Capture mouse button clicks for rebinding (in WASD mode or for 'move' keybind in mouse mode)
        const allowMouseCapture = this.controlScheme === 'wasd' || this.waitingForKey === 'move';
        if (this.waitingForKey && allowMouseCapture && input.buttons.length > 0) {
            // Check if enough time has passed
            const timeSinceStart = performance.now() - this.keybindWaitStart;
            if (timeSinceStart >= this.keybindWaitDelay) {
                for (let i = 0; i < input.buttons.length; i++) {
                    const button = input.buttons[i];
                    // Check if it's a mouse button (number)
                    if (typeof button === 'number') {
                        this.capturedKey = button;
                        break;
                    }
                }
            }
        }

        // Main pause menu
        if (!this.showAudio && !this.showControls && !this.showKeybinds && !this.showVolume && !this.showUIScale && !this.showMusicSelection) {
            this.resumeButton.update(inX, inY);
            if (this.resumeButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.toggle();
            }

            this.audioButton.update(inX, inY);
            if (this.audioButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showAudio = true;
            }

            this.controlsButton.update(inX, inY);
            if (this.controlsButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showControls = true;
            }

            this.uiScaleButton.update(inX, inY);
            if (this.uiScaleButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showUIScale = true;
                // Initialize slider with current UI scale
                this.uiScaleSlider.setValue(uiScale);
            }

            // Calculate button positions based on what's visible
            const inTestRoom = game.testRoom && game.testRoom.active;
            const devModeVisible = game.devMode && (this.devModeVisible || game.devMode.isEnabled());

            // Base position after Performance button (index 4)
            let nextButtonIndex = 5;

            // Dev mode takes slot 5 if visible
            if (devModeVisible) nextButtonIndex++;

            // Exit Test Room button (only when in test room)
            if (inTestRoom) {
                this.exitTestRoomButton.y = 280 + 85 * nextButtonIndex;
                this.exitTestRoomButton.update(inX, inY);
                if (this.exitTestRoomButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    // Just exit test room, return to game
                    game.testRoom.exit();
                    this.isPaused = false;
                    this.showAudio = false;
                    this.showControls = false;
                    this.showKeybinds = false;
                    this.showVolume = false;
                    this.showUIScale = false;
                    this.showMusicSelection = false;
                    // Resume music since we bypassed toggle()
                    if (window.gameSound) window.gameSound.resumeMusic();
                }
                nextButtonIndex++;
            }

            // Quit button comes last
            this.quitButton.y = 280 + 85 * nextButtonIndex;
            this.quitButton.update(inX, inY);
            if (this.quitButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                // Quit to main menu - clear test room without restoring state
                if (game.testRoom && game.testRoom.active) {
                    game.testRoom.active = false;
                    game.testRoom.dummies = [];
                    game.testRoom.pickupGrid = [];
                    game.testRoom.savedState = null;
                }
                game.gameOver = true;
                game.score = 0;
                game.showMessage = 'None';  // Trigger menu transition
                game.player.reset(game);
                game.projectiles.reset();
                game.display.reset();
                game.bullets.reset();
                game.voidBolts.reset();
                game.enemies.reset();
                game.effects.reset();
                game.world.reset();
                game.rewardManager.reset();
                this.isPaused = false;
                this.showAudio = false;
                this.showControls = false;
                this.showKeybinds = false;
                this.showVolume = false;
                this.showUIScale = false;
                this.showMusicSelection = false;
            }

            // Performance Mode button
            this.performanceButton.update(inX, inY);
            if (this.performanceButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();

                // Toggle performance mode
                const newMode = !performanceMode;
                setPerformanceMode(newMode);
                this.performanceButton.text = `Performance Mode: ${newMode ? 'ON' : 'OFF'}`;

                // Save to localStorage
                localStorage.setItem('performanceMode', newMode.toString());
            }

            // Dev Mode button (only visible if konami code entered or dev mode is ON)
            if (game.devMode) {
                // Keep visible if dev mode is ON, otherwise need konami code
                const shouldShow = this.devModeVisible || game.devMode.isEnabled();

                if (shouldShow) {
                    this.devModeButton.text = `Dev Mode: ${game.devMode.isEnabled() ? 'ON' : 'OFF'}`;
                    this.devModeButton.update(inX, inY);
                    if (this.devModeButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                        this.clicked = true;
                        if (window.gameSound) window.gameSound.playMenuClick();

                        // Toggle dev mode
                        game.devMode.setEnabled(!game.devMode.isEnabled());
                        this.devModeButton.text = `Dev Mode: ${game.devMode.isEnabled() ? 'ON' : 'OFF'}`;

                        // If turning OFF, hide the button again (unless player has permanent unlock)
                        if (!game.devMode.isEnabled()) {
                            const hasUnlock = game.playerName && localStorage.getItem(`devModeUnlocked_${game.playerName}`) === 'true';
                            if (!hasUnlock) {
                                this.devModeVisible = false;
                            }
                        }
                    }
                }
            }
        }
        // Audio submenu
        else if (this.showAudio && !this.showVolume && !this.showMusicSelection) {
            // Audio On/Off toggle
            this.audioToggleButton.update(inX, inY);
            if (this.audioToggleButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) {
                    window.gameSound.toggle();
                    this.audioToggleButton.text = window.gameSound.isEnabled() ? "Audio: ON" : "Audio: OFF";
                    // Play click sound only if audio is now enabled
                    if (window.gameSound.isEnabled()) {
                        window.gameSound.playMenuClick();
                    }
                }
            }

            this.volumeButton.update(inX, inY);
            if (this.volumeButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showVolume = true;
                // Initialize sliders with current volumes
                if (window.gameSound) {
                    this.musicVolumeSlider.setValue(window.gameSound.bgMusicVolume);
                    this.sfxVolumeSlider.setValue(window.gameSound.sfxVolume);
                }
            }

            this.musicSelectionButton.update(inX, inY);
            if (this.musicSelectionButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showMusicSelection = true;
                // Reset selection and scroll
                this.selectedTrackIndex = 0;
                this.trackListScrollOffset = 0;
            }

            this.audioBackButton.update(inX, inY);
            if (this.audioBackButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showAudio = false;
            }
        }
        // Controls submenu
        else if (this.showControls && !this.showKeybinds) {
            this.controlSchemeButton.update(inX, inY);
            if (this.controlSchemeButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();

                // Toggle control scheme
                this.controlScheme = this.controlScheme === 'mouse' ? 'wasd' : 'mouse';
                this.controlSchemeButton.text = `Controls: ${this.controlScheme === 'mouse' ? 'Mouse' : 'WASD'}`;

                // Save to localStorage
                localStorage.setItem('controlScheme', this.controlScheme);

                // Load saved keybinds for the new mode, or use defaults
                if (this.controlScheme === 'mouse') {
                    const savedCustomKeys = localStorage.getItem('customKeys');
                    this.customKeys = savedCustomKeys ? JSON.parse(savedCustomKeys) : { q: 'q', e: 'e', f: 'f', move: 2 };
                    if (this.customKeys.move === undefined) this.customKeys.move = 2;
                } else {
                    const savedWasdKeys = localStorage.getItem('wasdKeys');
                    this.wasdKeys = savedWasdKeys ? JSON.parse(savedWasdKeys) : {
                        shoot: 0,  // Left click
                        dash: 'e',
                        ult: 'q',
                        up: 'w',
                        down: 's',
                        left: 'a',
                        right: 'd'
                    };
                    if (this.wasdKeys.up === undefined) this.wasdKeys.up = 'w';
                    if (this.wasdKeys.down === undefined) this.wasdKeys.down = 's';
                    if (this.wasdKeys.left === undefined) this.wasdKeys.left = 'a';
                    if (this.wasdKeys.right === undefined) this.wasdKeys.right = 'd';
                }

                this.updateKeybindButtons();
            }

            this.keybindsButton.update(inX, inY);
            if (this.keybindsButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showKeybinds = true;
            }

            this.controlsBackButton.update(inX, inY);
            if (this.controlsBackButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showControls = false;
            }
        }
        // Keybinds submenu
        else if (this.showKeybinds) {
            const btnSpace = 85;

            this.keybindQButton.update(inX, inY);
            if (this.keybindQButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.waitingForKey = 'q';
                this.keybindWaitStart = performance.now();
                this.keybindQButton.text = "Shoot: Press any key...";
            }

            this.keybindEButton.update(inX, inY);
            if (this.keybindEButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.waitingForKey = 'e';
                this.keybindWaitStart = performance.now();
                this.keybindEButton.text = "Dash: Press any key...";
            }

            this.keybindFButton.update(inX, inY);
            if (this.keybindFButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.waitingForKey = 'f';
                this.keybindWaitStart = performance.now();
                this.keybindFButton.text = "Ult: Press any key...";
            }

            // Mouse mode: Move button
            if (this.controlScheme === 'mouse') {
                this.keybindMoveButton.y = 280 + btnSpace * 3;
                this.keybindMoveButton.update(inX, inY);
                if (this.keybindMoveButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.waitingForKey = 'move';
                    this.keybindWaitStart = performance.now();
                    this.keybindMoveButton.text = "Move: Press any key...";
                }
                // Pause and Back buttons for mouse mode
                this.keybindPauseButton.y = 280 + btnSpace * 4;
                this.keybindBackButton.y = 280 + btnSpace * 5;
            }
            // WASD mode: Direction buttons
            else {
                this.keybindUpButton.y = 280 + btnSpace * 3;
                this.keybindUpButton.update(inX, inY);
                if (this.keybindUpButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.waitingForKey = 'up';
                    this.keybindWaitStart = performance.now();
                    this.keybindUpButton.text = "Up: Press any key...";
                }

                this.keybindDownButton.y = 280 + btnSpace * 4;
                this.keybindDownButton.update(inX, inY);
                if (this.keybindDownButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.waitingForKey = 'down';
                    this.keybindWaitStart = performance.now();
                    this.keybindDownButton.text = "Down: Press any key...";
                }

                this.keybindLeftButton.y = 280 + btnSpace * 5;
                this.keybindLeftButton.update(inX, inY);
                if (this.keybindLeftButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.waitingForKey = 'left';
                    this.keybindWaitStart = performance.now();
                    this.keybindLeftButton.text = "Left: Press any key...";
                }

                this.keybindRightButton.y = 280 + btnSpace * 6;
                this.keybindRightButton.update(inX, inY);
                if (this.keybindRightButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.waitingForKey = 'right';
                    this.keybindWaitStart = performance.now();
                    this.keybindRightButton.text = "Right: Press any key...";
                }
                // Pause and Back buttons for WASD mode
                this.keybindPauseButton.y = 280 + btnSpace * 7;
                this.keybindBackButton.y = 280 + btnSpace * 8;
            }

            this.keybindPauseButton.update(inX, inY);
            if (this.keybindPauseButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.waitingForKey = 'pause';
                this.keybindWaitStart = performance.now();
                this.keybindPauseButton.text = "Pause: Press any key...";
            }

            this.keybindBackButton.update(inX, inY);
            if (this.keybindBackButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showKeybinds = false;
                this.waitingForKey = null;
                // Go back to Controls submenu
            }
        }
        // Volume submenu (accessed via Audio submenu)
        else if (this.showVolume) {
            // Update sliders (only if not just opened - prevents click-through)
            const mouseDown = input.buttons.indexOf(0) > -1 && !this.clicked;
            this.musicVolumeSlider.update(inX, inY, mouseDown);
            this.sfxVolumeSlider.update(inX, inY, mouseDown);

            // Apply volume changes in real-time and save to localStorage
            if (window.gameSound) {
                window.gameSound.setBgMusicVolume(this.musicVolumeSlider.value);
                window.gameSound.setSfxVolume(this.sfxVolumeSlider.value);
                // Save to localStorage
                localStorage.setItem('musicVolume', this.musicVolumeSlider.value.toString());
                localStorage.setItem('sfxVolume', this.sfxVolumeSlider.value.toString());
            }

            this.volumeBackButton.update(inX, inY);
            if (this.volumeBackButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showVolume = false;
                // Go back to Audio submenu
            }
        }
        // UI Scale submenu
        else if (this.showUIScale) {
            // Update slider (only if not just opened - prevents click-through)
            const mouseDown = input.buttons.indexOf(0) > -1 && !this.clicked;
            this.uiScaleSlider.update(inX, inY, mouseDown);

            // Apply UI scale changes in real-time
            setUIScale(this.uiScaleSlider.value);

            this.uiScaleBackButton.update(inX, inY);
            if (this.uiScaleBackButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showUIScale = false;
            }
        }
        // Music Selection submenu
        else if (this.showMusicSelection) {
            if (!window.gameSound) return;

            // Get the correct playlist based on selected tab
            const playlist = this.musicCategoryTab === 'game'
                ? window.gameSound.gameMusicPlaylist
                : window.gameSound.menuMusicPlaylist;
            const rX = window.innerWidth / 2560;
            const rY = window.innerHeight / 1440;

            // Use same positioning as draw method
            const panelY = 200;

            // Tab buttons positioning - must match draw() method
            const tabY = panelY + 55;
            const tabSpacing = 30;
            const totalTabWidth = 200 + 200 + tabSpacing;
            const tabStartX = (2560 - totalTabWidth) / 2;

            this.gameTabButton.x = tabStartX;
            this.gameTabButton.y = tabY;
            this.menuTabButton.x = tabStartX + 200 + tabSpacing;
            this.menuTabButton.y = tabY;

            // Update tab button colors based on selection
            this.gameTabButton.color = this.musicCategoryTab === 'game' ? '#00ffff' : 'white';
            this.gameTabButton.hoverColor = this.musicCategoryTab === 'game' ? '#00ffff' : '#aaffff';
            this.menuTabButton.color = this.musicCategoryTab === 'menu' ? '#00ffff' : 'white';
            this.menuTabButton.hoverColor = this.musicCategoryTab === 'menu' ? '#00ffff' : '#aaffff';

            // Tab button clicks
            this.gameTabButton.update(inX, inY);
            if (this.gameTabButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                if (this.musicCategoryTab !== 'game') {
                    this.musicCategoryTab = 'game';
                    this.selectedTrackIndex = 0;
                    this.trackListScrollOffset = 0;
                }
            }

            this.menuTabButton.update(inX, inY);
            if (this.menuTabButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                if (this.musicCategoryTab !== 'menu') {
                    this.musicCategoryTab = 'menu';
                    this.selectedTrackIndex = 0;
                    this.trackListScrollOffset = 0;
                }
            }

            const listWidth = 700;
            const listX = (2560 - listWidth) / 2;
            const listY = panelY + 160;
            const itemHeight = 55;
            const listHeight = this.visibleTrackCount * itemHeight;

            // Convert to screen coordinates
            const listXScreen = listX * rX;
            const listYScreen = listY * rY;
            const listWidthScreen = listWidth * rX;
            const itemHeightScreen = itemHeight * rY;
            const listHeightScreen = listHeight * rY;

            // Check for clicks on track items
            const visibleCount = Math.min(this.visibleTrackCount, playlist.length);
            for (let i = 0; i < visibleCount; i++) {
                const trackIndex = i + this.trackListScrollOffset;
                if (trackIndex >= playlist.length) break;

                const itemYScreen = listYScreen + i * itemHeightScreen;
                const isHovered = inX >= listXScreen && inX <= listXScreen + listWidthScreen &&
                                  inY >= itemYScreen && inY <= itemYScreen + itemHeightScreen;

                if (isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                    this.clicked = true;
                    if (window.gameSound) window.gameSound.playMenuClick();
                    this.selectedTrackIndex = trackIndex;
                }
            }

            // Scroll up/down detection
            const canScrollUp = this.trackListScrollOffset > 0;
            const canScrollDown = this.trackListScrollOffset + this.visibleTrackCount < playlist.length;

            // Scroll button areas (wider clickable area for easier use)
            const scrollBtnWidth = 200 * rX;
            const scrollBtnHeight = 30 * rY;
            const centerXScreen = (2560 / 2) * rX;
            const scrollBtnX = centerXScreen - scrollBtnWidth / 2;

            // Check scroll up click - offset must match draw() method (-15)
            if (canScrollUp) {
                const scrollUpY = listYScreen - 15 * rY;
                const isHoveredUp = inX >= scrollBtnX && inX <= scrollBtnX + scrollBtnWidth &&
                                    inY >= scrollUpY && inY <= scrollUpY + scrollBtnHeight;
                if (isHoveredUp && input.buttons.indexOf(0) > -1 && !this.clicked) {
                    this.clicked = true;
                    this.trackListScrollOffset--;
                    if (window.gameSound) window.gameSound.playMenuClick();
                }
            }

            // Check scroll down click - offset must match draw() method (+20)
            if (canScrollDown) {
                const scrollDownY = listYScreen + listHeightScreen + 20 * rY;
                const isHoveredDown = inX >= scrollBtnX && inX <= scrollBtnX + scrollBtnWidth &&
                                      inY >= scrollDownY && inY <= scrollDownY + scrollBtnHeight;
                if (isHoveredDown && input.buttons.indexOf(0) > -1 && !this.clicked) {
                    this.clicked = true;
                    this.trackListScrollOffset++;
                    if (window.gameSound) window.gameSound.playMenuClick();
                }
            }

            // Update button positions to match draw method
            const buttonsY = listY + listHeight + 60;
            const buttonSpacing = 30;
            const totalButtonWidth = 200 + 200 + buttonSpacing;
            const buttonsStartX = (2560 - totalButtonWidth) / 2;

            this.musicEnableButton.x = buttonsStartX;
            this.musicEnableButton.y = buttonsY;
            this.musicDisableButton.x = buttonsStartX + 200 + buttonSpacing;
            this.musicDisableButton.y = buttonsY;

            // Enable button - use correct methods based on tab
            this.musicEnableButton.update(inX, inY);
            if (this.musicEnableButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) {
                    window.gameSound.playMenuClick();
                    const trackPath = playlist[this.selectedTrackIndex];
                    if (this.musicCategoryTab === 'game') {
                        if (window.gameSound.isTrackBlocked(trackPath)) {
                            window.gameSound.toggleTrackBlocked(trackPath);
                        }
                    } else {
                        if (window.gameSound.isMenuTrackBlocked(trackPath)) {
                            window.gameSound.toggleMenuTrackBlocked(trackPath);
                        }
                    }
                }
            }

            // Disable button - use correct methods based on tab
            this.musicDisableButton.update(inX, inY);
            if (this.musicDisableButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) {
                    window.gameSound.playMenuClick();
                    const trackPath = playlist[this.selectedTrackIndex];
                    if (this.musicCategoryTab === 'game') {
                        if (!window.gameSound.isTrackBlocked(trackPath)) {
                            window.gameSound.toggleTrackBlocked(trackPath);
                        }
                    } else {
                        if (!window.gameSound.isMenuTrackBlocked(trackPath)) {
                            window.gameSound.toggleMenuTrackBlocked(trackPath);
                        }
                    }
                }
            }

            // Update back button position
            const noteY = buttonsY + 70;
            const backY = noteY + 40;
            this.musicSelectionBackButton.x = 2560 / 2;
            this.musicSelectionBackButton.y = backY;

            // Back button
            this.musicSelectionBackButton.update(inX, inY);
            if (this.musicSelectionBackButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showMusicSelection = false;
                // Go back to Audio submenu
            }
        }
    }

    updateKeybindButtons() {
        const formatKey = (key) => {
            if (typeof key === 'number') {
                // Mouse buttons
                if (key === 0) return 'Left Click';
                if (key === 1) return 'Middle Click';
                if (key === 2) return 'Right Click';
                if (key === 3) return 'Mouse 4';
                if (key === 4) return 'Mouse 5';
                return `Mouse ${key}`;
            }
            if (typeof key === 'string') {
                if (key.length === 1) return key.toUpperCase();
                return key.charAt(0).toUpperCase() + key.slice(1);
            }
            return String(key);
        };
        
        // Helper to format with Space handling
        const formatWithSpace = (key) => {
            let formatted = formatKey(key);
            if (formatted === ' ') formatted = 'Space';
            return formatted;
        };

        if (this.controlScheme === 'mouse') {
            // Mouse mode: Q/E/F abilities + Move
            this.keybindQButton.text = `Shoot: ${formatWithSpace(this.customKeys.q)}`;
            this.keybindEButton.text = `Dash: ${formatWithSpace(this.customKeys.e)}`;
            this.keybindFButton.text = `Ultimate: ${formatWithSpace(this.customKeys.f)}`;
            this.keybindMoveButton.text = `Move: ${formatWithSpace(this.customKeys.move)}`;
        }
        else {
            // WASD mode: Shoot/Dash/Ultimate + Movement directions
            this.keybindQButton.text = `Shoot: ${formatWithSpace(this.wasdKeys.shoot)}`;
            this.keybindEButton.text = `Dash: ${formatWithSpace(this.wasdKeys.dash)}`;
            this.keybindFButton.text = `Ultimate: ${formatWithSpace(this.wasdKeys.ult)}`;
            this.keybindUpButton.text = `Up: ${formatWithSpace(this.wasdKeys.up)}`;
            this.keybindDownButton.text = `Down: ${formatWithSpace(this.wasdKeys.down)}`;
            this.keybindLeftButton.text = `Left: ${formatWithSpace(this.wasdKeys.left)}`;
            this.keybindRightButton.text = `Right: ${formatWithSpace(this.wasdKeys.right)}`;
        }

        // Pause key (applies to both control schemes)
        let pauseKeyText = formatKey(this.pauseKey);
        if (pauseKeyText === ' ') pauseKeyText = 'Space';
        this.keybindPauseButton.text = `Pause: ${pauseKeyText}`;
    }

    draw(context, game, inMainMenu = false) {
        if (!this.isPaused) return;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Draw semi-transparent overlay
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, game.width, game.height);
        context.restore();

        // Main pause menu
        if (!this.showAudio && !this.showControls && !this.showKeybinds && !this.showVolume && !this.showUIScale && !this.showMusicSelection) {
            // Check if in test room for extra button
            const inTestRoom = game.testRoom && game.testRoom.active;
            const devModeVisible = game.devMode && (this.devModeVisible || game.devMode.isEnabled());

            // Calculate panel height based on visible buttons
            // Base: Resume, Audio, Controls, UI Scale, Performance = 5 buttons
            let buttonCount = 5;
            if (devModeVisible) buttonCount++;  // Dev Mode button
            if (inTestRoom) buttonCount++;      // Exit Test Room button
            if (!inMainMenu) buttonCount++;     // Quit button

            const panelHeight = 110 + (buttonCount * 85);  // Title area + buttons

            // Draw pause menu background
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(880 * rX, 200 * rY, 800 * rX, panelHeight * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(880 * rX, 200 * rY, 800 * rX, panelHeight * rY);
            context.restore();

            // Draw title centered in panel
            if(!inMainMenu){
                if (inTestRoom) {
                    this.super.drawGlowText(context, 1280, 250, "TEST ROOM", 55, '#ffaa00', '#ff6600', 15, true);
                } else {
                    this.super.drawGlowText(context, 1280, 250, "PAUSED", 55, '#ffffff', '#00ffff', 15, true);
                }
            }
            else{
                this.super.drawGlowText(context, 1280, 250, "SETTINGS", 55, '#ffffff', '#00ffff', 15, true);
            }

            // Draw buttons
            this.resumeButton.draw(context);
            this.audioButton.draw(context);
            this.controlsButton.draw(context);
            this.uiScaleButton.draw(context);
            this.performanceButton.draw(context);
            // Only draw dev mode button if visible (konami code entered or dev mode ON)
            if (devModeVisible) {
                this.devModeButton.draw(context);
            }
            if (!inMainMenu) {
                // Calculate button positions based on what's visible
                // Base position after Performance button (index 4), Dev Mode is at index 5
                let nextButtonIndex = 5;

                // Dev mode takes slot 5 if visible
                if (devModeVisible) nextButtonIndex++;

                // Draw Exit Test Room button when in test room
                if (inTestRoom) {
                    this.exitTestRoomButton.y = 280 + 85 * nextButtonIndex;
                    this.exitTestRoomButton.draw(context);
                    nextButtonIndex++;
                }

                // Quit button comes last
                this.quitButton.y = 280 + 85 * nextButtonIndex;
                this.quitButton.draw(context);
            }
        }
        // Audio submenu
        else if (this.showAudio && !this.showVolume && !this.showMusicSelection) {
            // Draw audio submenu background (taller to fit 4 buttons)
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(880 * rX, 200 * rY, 800 * rX, 460 * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(880 * rX, 200 * rY, 800 * rX, 460 * rY);
            context.restore();

            // Draw title
            this.super.drawGlowText(context, 1280, 250, "AUDIO", 55, '#ffffff', '#00ffff', 15, true);

            // Draw buttons
            this.audioToggleButton.draw(context);
            this.volumeButton.draw(context);
            this.musicSelectionButton.draw(context);
            this.audioBackButton.draw(context);
        }
        // Controls submenu
        else if (this.showControls && !this.showKeybinds) {
            // Draw controls submenu background
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(880 * rX, 200 * rY, 800 * rX, 380 * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(880 * rX, 200 * rY, 800 * rX, 380 * rY);
            context.restore();

            // Draw title
            this.super.drawGlowText(context, 1280, 250, "CONTROLS", 55, '#ffffff', '#00ffff', 15, true);

            // Draw buttons
            this.controlSchemeButton.draw(context);
            this.keybindsButton.draw(context);
            this.controlsBackButton.draw(context);
        }
        // Keybinds submenu
        else if (this.showKeybinds) {
            // Calculate panel height based on control scheme
            // Mouse mode: Shoot, Dash, Ult, Move, Pause, Back = 6 buttons (550 height)
            // WASD mode: Shoot, Dash, Ult, Up, Down, Left, Right, Pause, Back = 9 buttons (805 height)
            const panelHeight = this.controlScheme === 'mouse' ? 605 : 860;

            // Draw keybinds background - centered like other panels
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(880 * rX, 200 * rY, 800 * rX, panelHeight * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(880 * rX, 200 * rY, 800 * rX, panelHeight * rY);
            context.restore();

            // Draw title
            this.super.drawGlowText(context, 1280, 250, "KEYBINDS", 55, '#ffffff', '#00ffff', 15, true);

            // Draw common buttons (Shoot, Dash, Ult)
            this.keybindQButton.draw(context);
            this.keybindEButton.draw(context);
            this.keybindFButton.draw(context);

            // Draw mode-specific buttons
            if (this.controlScheme === 'mouse') {
                // Mouse mode: Move button
                this.keybindMoveButton.draw(context);
            } else {
                // WASD mode: Direction buttons
                this.keybindUpButton.draw(context);
                this.keybindDownButton.draw(context);
                this.keybindLeftButton.draw(context);
                this.keybindRightButton.draw(context);
            }

            // Draw Pause button (dynamically positioned in update())
            this.keybindPauseButton.draw(context);

            // Calculate message Y position based on control scheme
            const messageY = this.controlScheme === 'mouse' ? 700 : 955;

            // Draw waiting message or back button (not both to avoid overlap)
            if (this.waitingForKey) {
                if (this.waitingForKey === 'pause') {
                    this.super.drawGlowText(context, 1280, messageY, "Press any keyboard key...", 32, '#ffff00', '#ffaa00', 8, true);
                    this.super.drawGlowText(context, 1280, messageY + 40, "(Mouse buttons not allowed)", 24, '#ff8888', '#ff4444', 6, true);
                } else if (this.controlScheme === 'mouse' && this.waitingForKey !== 'move') {
                    this.super.drawGlowText(context, 1280, messageY, "Press any keyboard key...", 32, '#ffff00', '#ffaa00', 8, true);
                    this.super.drawGlowText(context, 1280, messageY + 40, "(Mouse buttons not allowed)", 24, '#ff8888', '#ff4444', 6, true);
                    this.super.drawGlowText(context, 1280, messageY + 80, "Press ESC to go back", 22, '#aaaaaa', '#888888', 6, true);
                } else {
                    this.super.drawGlowText(context, 1280, messageY, "Press any key or mouse button...", 32, '#ffff00', '#ffaa00', 8, true);
                    this.super.drawGlowText(context, 1280, messageY + 40, "Press ESC to go back", 24, '#aaaaaa', '#888888', 6, true);
                }
            } else {
                this.keybindBackButton.draw(context);
            }
        }
        // Volume submenu
        else if (this.showVolume) {
            // Draw volume background - centered like other panels
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(880 * rX, 200 * rY, 800 * rX, 460 * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(880 * rX, 200 * rY, 800 * rX, 460 * rY);
            context.restore();

            // Draw title
            this.super.drawGlowText(context, 1280, 250, "VOLUME", 55, '#ffffff', '#00ffff', 15, true);

            // Draw music volume
            this.super.drawGlowText(context, 1280, 310, "Music Volume", 32, '#ffffff', '#00ffff', 8, true);
            this.musicVolumeSlider.draw(context);
            this.super.drawGlowText(context, 1280, 390, `${Math.round(this.musicVolumeSlider.value * 100)}%`, 28, '#00ff88', '#00ff00', 6, true);

            // Draw SFX volume
            this.super.drawGlowText(context, 1280, 435, "SFX Volume", 32, '#ffffff', '#00ffff', 8, true);
            this.sfxVolumeSlider.draw(context);
            this.super.drawGlowText(context, 1280, 510, `${Math.round(this.sfxVolumeSlider.value * 100)}%`, 28, '#00ff88', '#00ff00', 6, true);

            // Draw back button
            this.volumeBackButton.draw(context);
        }
        // UI Scale submenu
        else if (this.showUIScale) {
            // Draw UI scale background - centered like other panels
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(880 * rX, 200 * rY, 800 * rX, 380 * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(880 * rX, 200 * rY, 800 * rX, 380 * rY);
            context.restore();

            // Draw title
            this.super.drawGlowText(context, 1280, 250, "UI SCALE", 55, '#ffffff', '#00ffff', 15, true);

            // Draw UI scale slider
            this.super.drawGlowText(context, 1280, 310, "HUD Size", 32, '#ffffff', '#00ffff', 8, true);
            this.uiScaleSlider.draw(context);
            this.super.drawGlowText(context, 1280, 420, `${Math.round(this.uiScaleSlider.value * 100)}%`, 32, '#00ff88', '#00ff00', 6, true);

            // Draw preview hint
            this.super.drawGlowText(context, 1280, 460, "Adjusts ability bar, powerups, and weapon slots", 18, '#888888', '#666666', 4, true);

            // Draw back button
            this.uiScaleBackButton.draw(context);
        }
        // Music Selection submenu
        else if (this.showMusicSelection) {
            if (!window.gameSound) return;

            // Get the correct playlist based on selected tab
            const playlist = this.musicCategoryTab === 'game'
                ? window.gameSound.gameMusicPlaylist
                : window.gameSound.menuMusicPlaylist;

            // Panel dimensions - centered
            const panelWidth = 800;
            const panelHeight = 680;
            const panelX = (2560 - panelWidth) / 2; // Center horizontally
            const panelY = 200;

            // Draw music selection background
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(panelX * rX, panelY * rY, panelWidth * rX, panelHeight * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(panelX * rX, panelY * rY, panelWidth * rX, panelHeight * rY);
            context.restore();

            // Center X for text
            const centerX = 2560 / 2;

            // Draw title
            this.super.drawGlowText(context, centerX, panelY + 35, "MUSIC SELECTION", 40, '#ffffff', '#00ffff', 12, true);

            // Draw tab buttons
            const tabY = panelY + 55;
            const tabSpacing = 30;
            const totalTabWidth = 200 + 200 + tabSpacing;
            const tabStartX = (2560 - totalTabWidth) / 2;

            this.gameTabButton.x = tabStartX;
            this.gameTabButton.y = tabY;
            this.menuTabButton.x = tabStartX + 200 + tabSpacing;
            this.menuTabButton.y = tabY;

            // Draw tab underline for selected tab
            context.save();
            const underlineY = (tabY + 45) * rY;
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 8 * rX;
            context.lineWidth = 3 * rY;
            context.beginPath();
            if (this.musicCategoryTab === 'game') {
                context.moveTo(tabStartX * rX, underlineY);
                context.lineTo((tabStartX + 200) * rX, underlineY);
            } else {
                context.moveTo((tabStartX + 200 + tabSpacing) * rX, underlineY);
                context.lineTo((tabStartX + 200 + tabSpacing + 200) * rX, underlineY);
            }
            context.stroke();
            context.restore();

            this.gameTabButton.draw(context);
            this.menuTabButton.draw(context);

            // Draw subtitle - positioned below tabs with room for scroll indicator
            const categoryLabel = this.musicCategoryTab === 'game' ? 'In-Game Music' : 'Menu Music';
            this.super.drawGlowText(context, centerX, panelY + 128, categoryLabel, 22, '#888888', '#666666', 4, true);

            // Track list area - centered in panel
            const listWidth = 700;
            const listX = (2560 - listWidth) / 2;
            const listY = panelY + 160;
            const itemHeight = 55;
            const listHeight = this.visibleTrackCount * itemHeight;

            // Draw list background
            context.save();
            context.fillStyle = 'rgba(20, 30, 50, 0.8)';
            context.fillRect(listX * rX, listY * rY, listWidth * rX, listHeight * rY);
            context.strokeStyle = '#006688';
            context.lineWidth = 2 * rY;
            context.strokeRect(listX * rX, listY * rY, listWidth * rX, listHeight * rY);
            context.restore();

            // Draw scroll up indicator if can scroll
            const canScrollUp = this.trackListScrollOffset > 0;
            const canScrollDown = this.trackListScrollOffset + this.visibleTrackCount < playlist.length;

            if (canScrollUp) {
                this.super.drawGlowText(context, centerX, listY - 15, "▲ Click to Scroll Up ▲", 18, '#00ffff', '#0088aa', 4, true);
            }

            // Draw visible tracks
            const visibleCount = Math.min(this.visibleTrackCount, playlist.length);
            for (let i = 0; i < visibleCount; i++) {
                const trackIndex = i + this.trackListScrollOffset;
                if (trackIndex >= playlist.length) break;

                const trackPath = playlist[trackIndex];
                const trackName = window.gameSound.getTrackName(trackPath);
                // Use correct isBlocked method based on tab
                const isBlocked = this.musicCategoryTab === 'game'
                    ? window.gameSound.isTrackBlocked(trackPath)
                    : window.gameSound.isMenuTrackBlocked(trackPath);
                const isSelected = trackIndex === this.selectedTrackIndex;

                const itemY = listY + i * itemHeight;

                // Draw selection highlight
                context.save();
                if (isSelected) {
                    context.fillStyle = 'rgba(0, 150, 200, 0.4)';
                    context.fillRect(listX * rX, itemY * rY, listWidth * rX, itemHeight * rY);
                    context.strokeStyle = '#00ffff';
                    context.lineWidth = 2 * rY;
                    context.strokeRect(listX * rX, itemY * rY, listWidth * rX, itemHeight * rY);
                }
                context.restore();

                // Draw track status indicator
                const statusColor = isBlocked ? '#ff4444' : '#44ff44';
                const statusText = isBlocked ? 'OFF' : 'ON';

                // Draw status box
                context.save();
                context.fillStyle = isBlocked ? 'rgba(100, 30, 30, 0.8)' : 'rgba(30, 100, 30, 0.8)';
                context.fillRect((listX + 10) * rX, (itemY + 12) * rY, 50 * rX, 30 * rY);
                context.strokeStyle = statusColor;
                context.lineWidth = 2 * rY;
                context.strokeRect((listX + 10) * rX, (itemY + 12) * rY, 50 * rX, 30 * rY);
                context.restore();

                // Draw status text
                context.save();
                context.font = `bold ${16 * rY}px Arial`;
                context.fillStyle = statusColor;
                context.textAlign = 'center';
                context.fillText(statusText, (listX + 35) * rX, (itemY + 33) * rY);
                context.restore();

                // Draw track name
                const nameColor = isSelected ? '#ffffff' : (isBlocked ? '#aa8888' : '#88ffaa');
                context.save();
                context.font = `${22 * rY}px Arial`;
                context.fillStyle = nameColor;
                context.textAlign = 'left';
                context.fillText(trackName, (listX + 75) * rX, (itemY + 35) * rY);
                context.restore();
            }

            // Draw scroll down indicator if can scroll
            if (canScrollDown) {
                const scrollDownY = listY + listHeight + 20;
                this.super.drawGlowText(context, centerX, scrollDownY, "▼ Click to Scroll Down ▼", 18, '#00ffff', '#0088aa', 4, true);
            }

            // Buttons positioned below the list with proper spacing
            const buttonsY = listY + listHeight + 60;
            this.musicEnableButton.y = buttonsY;
            this.musicDisableButton.y = buttonsY;

            // Center the enable/disable buttons
            const buttonSpacing = 30;
            const totalButtonWidth = 200 + 200 + buttonSpacing;
            const buttonsStartX = (2560 - totalButtonWidth) / 2;
            this.musicEnableButton.x = buttonsStartX;
            this.musicDisableButton.x = buttonsStartX + 200 + buttonSpacing;

            // Draw Enable/Disable buttons
            this.musicEnableButton.draw(context);
            this.musicDisableButton.draw(context);

            // Draw note about minimum tracks
            const noteY = buttonsY + 70;
            this.super.drawGlowText(context, centerX, noteY, "At least one song must remain enabled", 18, '#ffaa00', '#ff8800', 4, true);

            // Position and draw back button
            const backY = noteY + 40;
            this.musicSelectionBackButton.y = backY;
            this.musicSelectionBackButton.x = centerX;
            this.musicSelectionBackButton.draw(context);
        }
    }
}

// Slider class for volume controls
class Slider {
    constructor(x, y, width, height, min, max) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.min = min;
        this.max = max;
        this.value = 0.5;
        this.isDragging = false;
    }

    setValue(val) {
        this.value = Math.max(this.min, Math.min(this.max, val));
    }

    update(mouseX, mouseY, isMouseDown) {
        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        const sliderX = this.x * rX;
        const sliderY = this.y * rY;
        const sliderW = this.width * rX;
        const sliderH = this.height * rY;

        // Check if mouse is over slider
        const isOver = mouseX > sliderX && mouseX < sliderX + sliderW &&
                       mouseY > sliderY - 20 && mouseY < sliderY + sliderH + 20;

        if (isMouseDown && isOver) {
            this.isDragging = true;
        }

        if (!isMouseDown) {
            this.isDragging = false;
        }

        if (this.isDragging) {
            const percent = (mouseX - sliderX) / sliderW;
            this.value = Math.max(this.min, Math.min(this.max, percent * (this.max - this.min) + this.min));
        }
    }

    draw(context) {
        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        const sliderX = this.x * rX;
        const sliderY = this.y * rY;
        const sliderW = this.width * rX;
        const sliderH = this.height * rY;

        // Draw track
        context.save();
        context.fillStyle = 'rgba(50, 50, 80, 0.8)';
        context.fillRect(sliderX, sliderY, sliderW, sliderH);
        context.strokeStyle = '#00ffff';
        context.lineWidth = 2 * rY;
        context.strokeRect(sliderX, sliderY, sliderW, sliderH);

        // Draw fill
        const fillWidth = (this.value - this.min) / (this.max - this.min) * sliderW;
        context.fillStyle = '#00ff88';
        context.fillRect(sliderX, sliderY, fillWidth, sliderH);

        // Draw handle
        const handleX = sliderX + fillWidth;
        const handleRadius = 15 * rX;
        context.shadowColor = '#00ffff';
        context.shadowBlur = 10 * rX;
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(handleX, sliderY + sliderH / 2, handleRadius, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }
}