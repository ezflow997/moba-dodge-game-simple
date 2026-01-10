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
        this.keybindsButton = new Button(btnX, 280 + btnSpace, btnW, btnH, "Keybinds", fontSize, 0, 0, false, true, 'white', 'white');
        this.volumeButton = new Button(btnX, 280 + btnSpace * 2, btnW, btnH, "Volume", fontSize, 0, 0, false, true, 'white', 'white');
        this.uiScaleButton = new Button(btnX, 280 + btnSpace * 3, btnW, btnH, "UI Scale", fontSize, 0, 0, false, true, 'white', 'white');
        this.controlSchemeButton = new Button(btnX, 280 + btnSpace * 4, btnW, btnH, "Controls: Mouse", fontSize, 0, 0, false, true, 'white', 'white');
        this.performanceButton = new Button(btnX, 280 + btnSpace * 5, btnW, btnH, "Performance Mode: OFF", fontSize, 0, 0, false, true, 'white', 'white');
        this.devModeButton = new Button(btnX, 280 + btnSpace * 6, btnW, btnH, "Dev Mode: OFF", fontSize, 0, 0, false, true, 'white', 'white');
        this.exitTestRoomButton = new Button(btnX, 280 + btnSpace * 7, btnW, btnH, "Exit Test Room", fontSize, 0, 0, false, true, 'white', 'white');
        this.quitButton = new Button(btnX, 280 + btnSpace * 8, btnW, btnH, "Quit to Menu", fontSize, 0, 0, false, true, 'white', 'white');

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
        this.showKeybinds = false;
        this.showVolume = false;
        this.showUIScale = false;

        // Keybinds submenu
        this.keybindQButton = new Button(700, 300, 600, 80, "Shoot: Q", 50, 140, 60, false, true, 'white', 'white');
        this.keybindEButton = new Button(700, 400, 600, 80, "Dash: E", 50, 150, 60, false, true, 'white', 'white');
        this.keybindFButton = new Button(700, 500, 600, 80, "Ultimate: F", 50, 100, 60, false, true, 'white', 'white');
        this.keybindBackButton = new Button(880, 620, 400, 80, "Back", 50, 140, 60, false, true, 'white', 'white');
        this.waitingForKey = null; // 'q', 'e', or 'f'

        // Load custom keys from localStorage or use defaults
        const savedCustomKeys = localStorage.getItem('customKeys');
        this.customKeys = savedCustomKeys ? JSON.parse(savedCustomKeys) : { q: 'q', e: 'e', f: 'f' };

        // Control scheme: 'mouse' or 'wasd' - load from localStorage
        this.controlScheme = localStorage.getItem('controlScheme') || 'mouse';
        this.controlSchemeButton.text = `Controls: ${this.controlScheme === 'mouse' ? 'Mouse' : 'WASD'}`;

        // WASD mode keybinds - load from localStorage or use defaults
        const savedWasdKeys = localStorage.getItem('wasdKeys');
        this.wasdKeys = savedWasdKeys ? JSON.parse(savedWasdKeys) : {
            shoot: 0,  // Left click (mouse button 0)
            dash: 'e',
            ult: 'q'
        };

        // Update keybind button text based on loaded control scheme
        this.updateKeybindButtons();

        // Volume submenu
        this.musicVolumeSlider = new Slider(700, 350, 800, 30, 0, 1);
        this.sfxVolumeSlider = new Slider(700, 500, 800, 30, 0, 1);
        this.volumeBackButton = new Button(880, 600, 400, 80, "Back", 50, 140, 60, false, true, 'white', 'white');

        // UI Scale submenu
        this.uiScaleSlider = new Slider(700, 400, 800, 30, 0.5, 2.0);
        this.uiScaleSlider.setValue(uiScale); // Initialize with current value
        this.uiScaleBackButton = new Button(880, 550, 400, 80, "Back", 50, 140, 60, false, true, 'white', 'white');

        // keyboard key down listener
        this.keydownHandler = (ev) => {
            if (this.waitingForKey) {
                ev.preventDefault();
                this.capturedKey = ev.key;
            }

            // Konami code detection (only when pause menu is open and not in submenu)
            if (this.isPaused && !this.showKeybinds && !this.showVolume && !this.showUIScale && !this.waitingForKey) {
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
            this.showKeybinds = false;
            this.showVolume = false;
            this.showUIScale = false;
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
            
            // Cancel if ESC is pressed - go back to main pause menu
            if (pressedKey === 'Escape') {
                this.waitingForKey = null;
                this.showKeybinds = false;
                this.updateKeybindButtons();
                // Clear escapePressed so main.js doesn't also close the pause menu
                input.escapePressed = false;
                return;
            }
            
            // In mouse mode, ONLY allow keyboard keys (not mouse buttons)
            if (this.controlScheme === 'mouse' && typeof pressedKey === 'number') {
                // Reject mouse buttons in mouse mode
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
            const slots = this.controlScheme === 'mouse' ? ['q', 'e', 'f'] : ['shoot', 'dash', 'ult'];
            const currentSlotName = this.controlScheme === 'mouse' ? this.waitingForKey : 
                (this.waitingForKey === 'q' ? 'shoot' : this.waitingForKey === 'e' ? 'dash' : 'ult');
            
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
                    const wasdSlot = this.waitingForKey === 'q' ? 'shoot' :
                                this.waitingForKey === 'e' ? 'dash' : 'ult';
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
                
                if (currentSlot === 'q') {
                    this.keybindQButton.text = "Shoot: Already in use!";
                } else if (currentSlot === 'e') {
                    this.keybindEButton.text = "Dash: Already in use!";
                } else if (currentSlot === 'f') {
                    this.keybindFButton.text = "Ultimate: Already in use!";
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
            }
        }

        // Capture mouse button clicks for rebinding (ONLY in WASD mode)
        if (this.waitingForKey && this.controlScheme === 'wasd' && input.buttons.length > 0) {
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

        // ADD: Also capture mouse button clicks for rebinding
        if (this.waitingForKey && input.buttons.length > 0) {
            for (let i = 0; i < input.buttons.length; i++) {
                const button = input.buttons[i];
                // Check if it's a mouse button (number)
                if (typeof button === 'number') {
                    this.capturedKey = button;
                    break;
                }
            }
        }

        // Main pause menu
        if (!this.showKeybinds && !this.showVolume && !this.showUIScale) {
            this.resumeButton.update(inX, inY);
            if (this.resumeButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.toggle();
            }

            this.keybindsButton.update(inX, inY);
            if (this.keybindsButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showKeybinds = true;
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

            // Base position after Performance button (index 5, since UI Scale is index 3)
            let nextButtonIndex = 6;

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
                    this.showKeybinds = false;
                    this.showVolume = false;
                    this.showUIScale = false;
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
                this.showKeybinds = false;
                this.showVolume = false;
                this.showUIScale = false;
            }

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
                    this.customKeys = savedCustomKeys ? JSON.parse(savedCustomKeys) : { q: 'q', e: 'e', f: 'f' };
                } else {
                    const savedWasdKeys = localStorage.getItem('wasdKeys');
                    this.wasdKeys = savedWasdKeys ? JSON.parse(savedWasdKeys) : {
                        shoot: 0,  // Left click
                        dash: 'e',
                        ult: 'q'
                    };
                }

                this.updateKeybindButtons();
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
        // Keybinds submenu
        else if (this.showKeybinds) {
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

            this.keybindBackButton.update(inX, inY);
            if (this.keybindBackButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked && !this.waitingForKey) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showKeybinds = false;
                this.waitingForKey = null;
            }
        }
        // Volume submenu
        else if (this.showVolume) {
            // Update sliders (only if not just opened - prevents click-through)
            const mouseDown = input.buttons.indexOf(0) > -1 && !this.clicked;
            this.musicVolumeSlider.update(inX, inY, mouseDown);
            this.sfxVolumeSlider.update(inX, inY, mouseDown);

            // Apply volume changes in real-time
            if (window.gameSound) {
                window.gameSound.setBgMusicVolume(this.musicVolumeSlider.value);
                window.gameSound.setSfxVolume(this.sfxVolumeSlider.value);
            }

            this.volumeBackButton.update(inX, inY);
            if (this.volumeBackButton.isHovered && input.buttons.indexOf(0) > -1 && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.showVolume = false;
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
        
        if (this.controlScheme === 'mouse') {
            // Mouse mode: Q/E/F abilities
            const qKey = typeof this.customKeys.q === 'string' ? this.customKeys.q : 'q';
            const eKey = typeof this.customKeys.e === 'string' ? this.customKeys.e : 'e';
            const fKey = typeof this.customKeys.f === 'string' ? this.customKeys.f : 'f';

            let shootKey = `${formatKey(qKey)}`;
            let dashKey = `${formatKey(eKey)}`;
            let ultKey = `${formatKey(fKey)}`;
            let textsArray = [shootKey, dashKey, ultKey];
            for(let i = 0; i < textsArray.length; i++){
                if(textsArray[i] == ' '){
                    textsArray[i] = 'Space';
                }
                //console.log(''+ i + ' key is ' + textsArray[i]);
            }
            this.keybindQButton.text = `Shoot: ` + textsArray[0];
            this.keybindEButton.text = `Dash: ` + textsArray[1];
            this.keybindFButton.text = `Ultimate: ` + textsArray[2];

        } 
        else {
            // WASD mode: Shoot/Dash/Ultimate
            let shootKey = `${formatKey(this.wasdKeys.shoot)}`;
            let dashKey = `${formatKey(this.wasdKeys.dash)}`;
            let ultKey = `${formatKey(this.wasdKeys.ult)}`;
            let textsArray = [shootKey, dashKey, ultKey];
            for(let i = 0; i < textsArray.length; i++){
                if(textsArray[i] == ' '){
                    textsArray[i] = 'Space';
                }
                //console.log(''+ i + ' key is ' + textsArray[i]);
            }
            this.keybindQButton.text = `Shoot: ` + textsArray[0];
            this.keybindEButton.text = `Dash: ` + textsArray[1];
            this.keybindFButton.text = `Ultimate: ` + textsArray[2];
        }
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
        if (!this.showKeybinds && !this.showVolume && !this.showUIScale) {
            // Check if in test room for extra button
            const inTestRoom = game.testRoom && game.testRoom.active;
            const devModeVisible = game.devMode && (this.devModeVisible || game.devMode.isEnabled());

            // Calculate panel height based on visible buttons
            // Base: Resume, Keybinds, Volume, UI Scale, Controls, Performance = 6 buttons
            let buttonCount = 6;
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
            this.keybindsButton.draw(context);
            this.volumeButton.draw(context);
            this.uiScaleButton.draw(context);
            this.controlSchemeButton.draw(context);
            this.performanceButton.draw(context);
            // Only draw dev mode button if visible (konami code entered or dev mode ON)
            if (devModeVisible) {
                this.devModeButton.draw(context);
            }
            if (!inMainMenu) {
                // Calculate button positions based on what's visible
                // Base position after Performance button (index 4)
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
        // Keybinds submenu
        else if (this.showKeybinds) {
            // Draw keybinds background
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(650 * rX, 200 * rY, 700 * rX, 550 * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(650 * rX, 200 * rY, 700 * rX, 550 * rY);
            context.restore();

            // Draw title
            this.super.drawGlowText(context, 850, 260, "KEYBINDS", 60, '#ffffff', '#00ffff', 12);

            // Draw buttons
            this.keybindQButton.draw(context);
            this.keybindEButton.draw(context);
            this.keybindFButton.draw(context);

            // Draw waiting message or back button (not both to avoid overlap)
            if (this.waitingForKey) {
                if (this.controlScheme === 'mouse') {
                    this.super.drawGlowText(context, 700, 620, "Press any keyboard key...", 40, '#ffff00', '#ffaa00', 8);
                    this.super.drawGlowText(context, 700, 665, "(Mouse buttons not allowed)", 32, '#ff8888', '#ff4444', 6);
                    this.super.drawGlowText(context, 700, 705, "Press ESC to go back", 28, '#aaaaaa', '#888888', 6);
                } else {
                    this.super.drawGlowText(context, 700, 620, "Press any key or mouse button...", 40, '#ffff00', '#ffaa00', 8);
                    this.super.drawGlowText(context, 700, 665, "Press ESC to go back", 32, '#aaaaaa', '#888888', 6);
                }
            } else {
                this.keybindBackButton.draw(context);
            }
        }
        // Volume submenu
        else if (this.showVolume) {
            // Draw volume background
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(650 * rX, 200 * rY, 900 * rX, 500 * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(650 * rX, 200 * rY, 900 * rX, 500 * rY);
            context.restore();

            // Draw title
            this.super.drawGlowText(context, 950, 260, "VOLUME", 60, '#ffffff', '#00ffff', 12);

            // Draw music volume
            this.super.drawGlowText(context, 720, 320, "Music Volume", 40, '#ffffff', '#00ffff', 8);
            this.musicVolumeSlider.draw(context);
            this.super.drawGlowText(context, 1420, 415, `${Math.round(this.musicVolumeSlider.value * 100)}%`, 35, '#00ff88', '#00ff00', 6);

            // Draw SFX volume
            this.super.drawGlowText(context, 720, 470, "SFX Volume", 40, '#ffffff', '#00ffff', 8);
            this.sfxVolumeSlider.draw(context);
            this.super.drawGlowText(context, 1420, 565, `${Math.round(this.sfxVolumeSlider.value * 100)}%`, 35, '#00ff88', '#00ff00', 6);

            // Draw back button
            this.volumeBackButton.draw(context);
        }
        // UI Scale submenu
        else if (this.showUIScale) {
            // Draw UI scale background
            context.save();
            context.fillStyle = 'rgba(10, 20, 40, 0.95)';
            context.fillRect(650 * rX, 250 * rY, 900 * rX, 400 * rY);
            context.strokeStyle = '#00ffff';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.lineWidth = 3 * rY;
            context.strokeRect(650 * rX, 250 * rY, 900 * rX, 400 * rY);
            context.restore();

            // Draw title
            this.super.drawGlowText(context, 950, 310, "UI SCALE", 60, '#ffffff', '#00ffff', 12);

            // Draw UI scale slider
            this.super.drawGlowText(context, 720, 380, "HUD Size", 40, '#ffffff', '#00ffff', 8);
            this.uiScaleSlider.draw(context);
            this.super.drawGlowText(context, 1420, 465, `${Math.round(this.uiScaleSlider.value * 100)}%`, 35, '#00ff88', '#00ff00', 6);

            // Draw preview hint
            this.super.drawGlowText(context, 1100, 520, "Adjusts ability bar, powerups, and weapon slots", 20, '#888888', '#666666', 4, true);

            // Draw back button
            this.uiScaleBackButton.draw(context);
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