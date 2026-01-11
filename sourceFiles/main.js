import { InputHandler } from "./controller/input.js";
import { Player } from "./controller/player.js";
import { World } from "./world/world.js";
import { Projectiles } from "./controller/projectiles.js";
import { Bullets } from "./controller/bullets.js";
import { Enemies } from "./controller/enemies.js";
import { Display } from "./gameText/display.js";
import { Menu } from "./menu/menu.js";
import { superFunctions } from "./menu/supers.js";
import { EffectsManager } from "./effects/effects.js";
import { SoundManager } from "./audio/soundManager.js";
import { PauseMenu } from "./menu/pauseMenu.js";
import { VoidBolts } from "./controller/voidBolts.js";
import { SupabaseLeaderboard } from "./supabase/supabase.js";
import { LeaderboardMenu } from "./menu/leaderboardMenu.js";
import { NameInputMenu } from "./menu/nameInputMenu.js";
import { RankedMenu } from "./menu/rankedMenu.js";
import { AccountMenu } from "./menu/accountMenu.js";
import { ShopMenu } from "./menu/shopMenu.js";
import { LoadoutMenu } from "./menu/loadoutMenu.js";
import { RewardManager } from "./controller/rewardManager.js";
import { DevMode } from "./dev/DevMode.js";
import { CommandRegistry } from "./dev/CommandRegistry.js";
import { DebugConsole } from "./dev/DebugConsole.js";
import { TestRoom } from "./dev/TestRoom.js";
import { PowerupHUD } from "./ui/PowerupHUD.js";

// Simple Score class for local session tracking
class SimpleScore {
	constructor() {
		this.value = 0;
		this.kills = 0;
		this.best_streak = 0;
		this.q_presses = 0;
		this.e_presses = 0;
		this.f_presses = 0;
	}
}

window.addEventListener('load', function () {
	async function Main(){
		const canvas = document.getElementById('canvas1');
		const ctx = canvas.getContext('2d');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		class Game {
			constructor(width, height) {
				this.width = width;
				this.height = height;

				this.logic_fps = 60;
				this.render_fps = -1;

				this.player = new Player(this, 1);
				this.world = new World();
				this.input = new InputHandler();
				this.projectiles = new Projectiles(this.player);
				this.bullets = new Bullets();
				this.voidBolts = new VoidBolts();
				this.enemies = new Enemies();
				this.display = new Display(this);
				this.menu = new Menu();
				this.super = new superFunctions();
				this.effects = new EffectsManager();
				this.sound = new SoundManager();
				this.rewardManager = new RewardManager();
				window.gameSound = this.sound; // Global reference for menu sounds
				this.pauseMenu = new PauseMenu();

				// Leaderboard system
				this.supabase = new SupabaseLeaderboard();
				this.leaderboardMenu = new LeaderboardMenu();
				this.nameInputMenu = new NameInputMenu();
				this.rankedMenu = new RankedMenu();
				this.accountMenu = new AccountMenu();
				this.shopMenu = new ShopMenu();
				this.loadoutMenu = new LoadoutMenu();
				this.playerName = localStorage.getItem('playerName') || '';
				this.playerPassword = localStorage.getItem('playerPassword') || '';
				this.sessionAccountCreated = sessionStorage.getItem('sessionAccountCreated') === 'true'; // Track if account was created this session
				this.pendingScore = null;
				this.awaitingNameInput = false;
				this.submitError = '';
				this.pendingSecurityQuestion = null;
				this.pendingSecurityAnswer = null;
				this.hasSecurityQuestion = true; // Assume true by default, updated on login

				// Ranked system
				this.isRankedGame = false;
				this.pendingRankedScore = null;

				// Shop/Loadout system
				this.pendingLoadoutRewards = []; // Rewards selected for next game
				this.usedLoadoutRewardIds = []; // IDs of rewards to consume after game
				this.pendingLoadoutWeapon = null; // Weapon with ownership info for reactivation

				this.msDraw = window.performance.now();
				this.msUpdate = window.performance.now();
				this.msScore = window.performance.now();
				this.game_time = 0;

				this.score = 0;
				this.scorePrev = 0;
				this.gameOver = true;
				this.showMessage = '';
				this.showMessageRow2 = '';
				this.showMessageNow = window.performance.now();

				this.difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
				this.difficultyPointMultipliers = { 'EASY': 0.5, 'MEDIUM': 1, 'HARD': 1.5, 'EXPERT': 2, 'INSANE': 3 };
				this.difficulty_level = 0;

				this.challenges = ['NORMAL', 'CHALLENGING'];
				this.challenge_level = 0;

				this.loggedIn = false;
				this.player_data = {
					high_score: [new SimpleScore(), new SimpleScore(), new SimpleScore(), new SimpleScore(), new SimpleScore()],
					last_score: [new SimpleScore(), new SimpleScore(), new SimpleScore(), new SimpleScore(), new SimpleScore()]
				};

				// Set up one-time music unlock on first click
				this.setupMusicUnlock();

				// Dev mode system
				this.devMode = new DevMode();
				this.commandRegistry = new CommandRegistry(this, this.devMode);
				this.debugConsole = new DebugConsole(this.commandRegistry, this.input);
				this.testRoom = new TestRoom(this);

				// HUD system
				this.powerupHUD = new PowerupHUD();

				// Online presence tracking
				this.sessionId = this.generateSessionId();
				this.onlineCount = 0;
				this.lastPresencePing = 0;
				this.presencePingInterval = 5 * 60 * 1000; // 5 minutes
				console.log('[Presence] Initializing with session:', this.sessionId);
				this.pingPresence(); // Initial ping
			}

			generateSessionId() {
				// Reuse existing session ID from sessionStorage, or generate a new one
				let sessionId = sessionStorage.getItem('presenceSessionId');
				if (!sessionId) {
					sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
					sessionStorage.setItem('presenceSessionId', sessionId);
				}
				return sessionId;
			}

			getApiBaseUrl() {
				// If running on localhost (Go Live), use production API
				// Otherwise use relative path (works on Vercel)
				if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
					return 'https://moba-dodge-simple.vercel.app';
				}
				return '';
			}

			async pingPresence() {
				const baseUrl = this.getApiBaseUrl();

				// Only track presence for logged-in users
				if (!this.playerName) {
					// Still fetch online count for display
					try {
						const response = await fetch(`${baseUrl}/api/presence`, { method: 'GET' });
						if (response.ok) {
							const data = await response.json();
							this.onlineCount = data.online || 0;
							console.log('[Presence] Online count (anonymous):', this.onlineCount);
						} else {
							console.error('[Presence] GET failed:', response.status);
						}
					} catch (error) {
						console.error('[Presence] GET error:', error);
					}
					this.lastPresencePing = performance.now();
					return;
				}

				console.log('[Presence] Pinging as:', this.playerName);
				try {
					const response = await fetch(`${baseUrl}/api/presence`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							sessionId: this.sessionId,
							playerName: this.playerName
						})
					});
					if (response.ok) {
						const data = await response.json();
						this.onlineCount = data.online || 0;
						console.log('[Presence] Online count:', this.onlineCount);
					} else {
						const errorText = await response.text();
						console.error('[Presence] API error:', response.status, errorText);
					}
				} catch (error) {
					console.error('[Presence] Ping failed:', error);
				}
				this.lastPresencePing = performance.now();
			}

			setupMusicUnlock() {
				const unlockOnInteraction = () => {
					if (window.gameSound && !window.gameSound.musicUnlocked) {
						window.gameSound.unlockMusic();
					}
				};

				// Listen for first user interaction
				document.addEventListener('click', unlockOnInteraction, { once: true });
				document.addEventListener('keydown', unlockOnInteraction, { once: true });
			}
			set_difficulty(){
				this.projectiles.set_difficulty(this);
				this.enemies.set_difficulty(this);
			}
			update() {
				const msNow2 = window.performance.now();

				// Update debug console
				if (this.devMode.isEnabled()) {
					this.debugConsole.update(this);
					
					// If console is visible, don't process game updates
					if (this.debugConsole.visible) {
						return;
					}
					
					// Update FPS counter
					this.devMode.updateFPS();

					// Fetch player count for dev stats
					this.devMode.fetchPlayerCount();

					// Update test room if active
					if (this.testRoom.active) {
						this.testRoom.update();
					}
					
					// Apply instant cooldowns if enabled
					if (this.devMode.instantCooldowns) {
						this.player.qCoolDownElapsed = this.player.qCoolDown;
						this.player.eCoolDownElapsed = this.player.eCoolDown;
						this.player.fCoolDownElapsed = this.player.fCoolDown;
					}
				}

				// Check for pause toggle (skip if waiting for keybind - let pause menu handle ESC)
				if(this.input.escapePressed && !this.pauseMenu.waitingForKey) {
					this.pauseMenu.toggle();
					this.input.escapePressed = false;
				}

				// Handle dev menu button click and scroll
				if (this.devMode.isEnabled()) {
					if (this.input.buttons.indexOf(0) > -1) {
						if (this.devMode.handleClick(this.input.mouseX, this.input.mouseY)) {
							// Click was handled by dev menu, consume it
							this.input.buttons = this.input.buttons.filter(b => b !== 0);
						}
					}
					// Handle scroll when dev menu is open
					if (this.devMode.devMenuOpen && this.input.wheelDelta) {
						this.devMode.handleScroll(this.input.wheelDelta);
						this.input.resetWheelDelta();
					}
				}

				// Don't update game if paused
				if(this.pauseMenu.isPaused) {
					this.pauseMenu.update(this);
					return;
				}

				// Check for weapon choice (pauses game while choosing)
				if (this.rewardManager && this.rewardManager.showingWeaponChoice) {
					// Handle 1/2 key input for choice
					if (this.input.buttons.includes('1')) {
						this.rewardManager.keepCurrentWeapon();
						const idx = this.input.buttons.indexOf('1');
						if (idx > -1) this.input.buttons.splice(idx, 1);
					} else if (this.input.buttons.includes('2')) {
						this.rewardManager.takeNewWeapon();
						const idx = this.input.buttons.indexOf('2');
						if (idx > -1) this.input.buttons.splice(idx, 1);
					}

					// Handle mouse click for choice
					if (this.input.buttons.includes(0)) {  // Left mouse button
						const choice = this.rewardManager.checkWeaponChoiceClick(this.input.mouseX, this.input.mouseY);
						if (choice === 'keep') {
							this.rewardManager.keepCurrentWeapon();
						} else if (choice === 'swap') {
							this.rewardManager.takeNewWeapon();
						}
						// Remove mouse button to prevent repeat
						const idx = this.input.buttons.indexOf(0);
						if (idx > -1) this.input.buttons.splice(idx, 1);
					}

					return; // Don't update game while choosing
				}

				if(msNow2 - this.msUpdate < 1000 / this.logic_fps) return;
				this.msUpdate = window.performance.now();

				this.player.update(this.input, this);
				
				// Always update bullets/voidBolts so player can shoot
				// Use bullets if normal mode OR if gun is equipped in challenging mode
				const activeGun = this.rewardManager ? this.rewardManager.activeGun : null;
				const useRegularBullets = this.challenge_level == 0 || activeGun != null;

				if(useRegularBullets){
					this.bullets.update(this.player, this.input, this.enemies, this);
				} else {
					this.voidBolts.update(this.enemies, this);
				}

				// Only update enemies and projectiles when NOT in test room
				if(!this.testRoom.active) {
					if(useRegularBullets){
						this.enemies.update(this, this.player, this.bullets, msNow2);
					} else {
						this.enemies.update(this, this.player, this.voidBolts, msNow2);
					}
					this.projectiles.update(this.player, this, msNow2);
				}
				this.display.update(this);

				// Handle weapon slot cycling with Tab
				if (this.input.tabPressed) {
					this.rewardManager.cycleWeaponSlot();
					this.input.tabPressed = false;
				}

				// Handle loadout weapon reactivation with R key
				if (this.input.buttons.indexOf('r') > -1) {
					if (this.rewardManager.hasLoadoutWeapon()) {
						this.rewardManager.reactivateLoadoutWeapon();
					}
					// Remove 'r' from buttons to prevent repeated triggering
					const rIndex = this.input.buttons.indexOf('r');
					if (rIndex > -1) this.input.buttons.splice(rIndex, 1);
				}

				// Update reward manager
				this.rewardManager.update(this.player, this);

				// Update effects and world
				this.effects.update();
				this.world.update();

				// Only increase time-based score when NOT in boss fight and NOT in test room
				if (!this.enemies.bossActive && !this.testRoom.active) {
					// Apply score multiplier from rewards
					const multiplier = this.rewardManager.scoreMultiplier || 1;
					this.score = Math.ceil(this.score + 0.75 * multiplier);
				}
			}
			draw(context) {
				context.clearRect(-100, -100, this.width*2, this.height*2);
				this.world.draw(context, game.width, game.height);
				
				// Draw test room if active
				if (this.devMode.isEnabled() && this.testRoom.active) {
					this.testRoom.draw(context);
				}
				
				this.player.draw(context, this);
				// Draw bullets if normal mode OR if gun is equipped in challenging mode
				const activeGun = this.rewardManager ? this.rewardManager.activeGun : null;
				const useRegularBullets = this.challenge_level == 0 || activeGun != null;

				if(useRegularBullets){
					this.bullets.draw(context);
				} else {
					this.voidBolts.draw(context);
				}
				this.enemies.draw(context);
				this.projectiles.draw(context);
				this.effects.draw(context);
				// Draw rewards (drops and on-player effects only)
				this.rewardManager.draw(context, this.player);

				// Draw weapon choice overlay if active
				if (this.rewardManager.showingWeaponChoice) {
					this.rewardManager.drawWeaponChoice(context);
				}

				// Draw unified PowerupHUD (abilities, weapon slots, active timers, permanent upgrades)
				this.powerupHUD.draw(context, this);

				// Draw score/kills display (top of screen)
				this.display.draw(context, this);
				
				// Draw dev mode overlays
				if (this.devMode.isEnabled()) {
					this.devMode.drawGridOverlay(context, this);
					this.devMode.drawHitboxes(context, this);
					this.devMode.drawIndicators(context, this);
					this.devMode.drawFPS(context);
					this.devMode.drawStats(context, this);
					this.devMode.drawDevMenuButton(context);
					this.devMode.drawDevMenuPanel(context);
				}
				
				this.pauseMenu.draw(context, this, false);
				
				// Draw debug console (always last so it's on top)
				if (this.devMode.isEnabled()) {
					this.debugConsole.draw(context, this);
				}
			}
			drawGameOverWindow(context){
				context.clearRect(-100, -100, this.width*2, this.height*2);
				this.super.drawMessageWindow(context, this);
			}
			setScores(score){
				score.value = this.score;
				score.kills = this.enemies.enemiesTakenDown;
				score.best_streak = this.enemies.best_streak;
				score.q_presses = this.player.qPresses;
				score.e_presses = this.player.ePresses;
				score.f_presses = this.player.fPresses;
			}
			calculateShopPoints(score, difficulty) {
				const basePoints = 10;
				const scorePoints = Math.floor(score / 500);
				const multiplier = this.difficultyPointMultipliers[difficulty] || 1;
				return Math.floor((basePoints + scorePoints) * multiplier);
			}
			reset(){
				this.score = 0;
				this.scorePrev = 0;
				this.gameOver = true;
				this.showMessage = '';
				this.showMessageRow2 = '';
				this.showMessageNow = window.performance.now();

				this.loggedIn = false;
				this.player_data = {
					high_score: [new SimpleScore(), new SimpleScore(), new SimpleScore(), new SimpleScore(), new SimpleScore()],
					last_score: [new SimpleScore(), new SimpleScore(), new SimpleScore(), new SimpleScore(), new SimpleScore()]
				};

				// Reset effects, world, and rewards
				this.effects.reset();
				this.world.reset();
				this.voidBolts.reset();
				this.rewardManager.reset();

				// Clear loadout tracking
				this.pendingLoadoutRewards = [];
				this.usedLoadoutRewardIds = [];
			}

			// Submit score to Supabase leaderboard
			async submitScoreToLeaderboard() {
				if (!this.pendingScore || !this.playerName || !this.playerPassword) return;

				try {
					const result = await this.supabase.submitScore(
						this.playerName,
						this.pendingScore.difficulty,
						this.pendingScore.score,
						this.pendingScore.kills,
						this.pendingScore.bestStreak,
						this.playerPassword,
						this.pendingSecurityQuestion,
						this.pendingSecurityAnswer
					);
					console.log('Score submitted:', result);

					// Clear security question/answer after first submission
					if (this.pendingSecurityQuestion) {
						this.pendingSecurityQuestion = null;
						this.pendingSecurityAnswer = null;
					}

					// Handle password error - clear stored credentials and prompt again
					if (result.passwordError) {
						this.submitError = 'Invalid password for this username';
						localStorage.removeItem('playerPassword');
						this.playerPassword = '';
						// Will prompt for credentials again next game
					} else {
						// Refresh player scores display after successful submission
						if (this.menu) {
							this.menu.forceRefreshScores();
							this.menu.fetchPlayerScores(this);
							// Update shop points display
							if (result.totalPoints !== undefined) {
								this.menu.shopPoints = result.totalPoints;
							}
						}

						// Consume used loadout items (if any)
						if (this.usedLoadoutRewardIds && this.usedLoadoutRewardIds.length > 0) {
							// Build consumption list - include weapon ID for each use
							const consumeList = [...this.usedLoadoutRewardIds];

							// Check for loadout weapon uses - need to add extra copies for reactivations
							const weaponUsesConsumed = this.rewardManager.getLoadoutWeaponUsesConsumed();
							if (this.pendingLoadoutWeapon && !this.pendingLoadoutWeapon.isPermanent && weaponUsesConsumed > 1) {
								// First use is already in the list, add extra uses
								const weaponId = this.pendingLoadoutWeapon.reward.id;
								for (let i = 1; i < weaponUsesConsumed; i++) {
									consumeList.push(weaponId);
								}
								console.log('[LOADOUT] Weapon uses consumed:', weaponUsesConsumed);
							}

							this.supabase.consumeItems(this.playerName, this.playerPassword, consumeList).then(consumeResult => {
								console.log('[LOADOUT] Consumed items:', consumeResult);
							}).catch(err => {
								console.error('[LOADOUT] Failed to consume items:', err);
							});
						}
					}
					// Clear loadout tracking
					this.pendingLoadoutRewards = [];
					this.usedLoadoutRewardIds = [];
					this.pendingLoadoutWeapon = null;
				} catch (error) {
					console.error('Failed to submit score:', error);
				}
				this.pendingScore = null;
			}
		}

		const game = new Game(canvas.width, canvas.height);
		window.game = game; // Global reference for account menu

		// Handle window resize - only resize canvas when window actually changes
		function handleResize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			game.width = window.innerWidth;
			game.height = window.innerHeight;
		}
		window.addEventListener('resize', handleResize);

		function animate() {
			// Canvas size is now handled by resize event listener

			if(game.input.escapePressed && game.pauseMenu.isPaused && !game.pauseMenu.waitingForKey) {
				game.pauseMenu.toggle();
				game.input.escapePressed = false;
			}

			if(game.gameOver == false){
				game.draw(ctx);
				game.update();
			}

			if(game.gameOver == true){
				if(game.showMessage == '' && game.score != 0){
					// Check if dev mode was used this session - don't save scores
					if (game.devMode && game.devMode.wasUsedThisSession()) {
						game.showMessage = 'Dev Mode - Score not saved (' + game.score + ')';
						game.showMessageRow2 = '';
						game.showMessageNow = window.performance.now();
						game.pendingScore = null;
						game.pendingRankedScore = null;
						game.isRankedGame = false;
					} else if (game.isRankedGame) {
						// Ranked game - store for ranked submission
						console.log('[RANKED] Game over. Score:', game.score, 'Player:', game.playerName);
						game.pendingRankedScore = {
							score: game.score,
							kills: game.enemies.enemiesTakenDown,
							bestStreak: game.enemies.best_streak
						};
						game.showMessage = 'Ranked Score: ' + game.score;
						game.showMessageRow2 = 'Ranked games do not award Shop Points';
						game.showMessageNow = window.performance.now();
						game.pendingScore = null; // Don't submit to regular leaderboard
					} else {
						// Store pending score for leaderboard submission
						game.pendingScore = {
							score: game.score,
							kills: game.enemies.enemiesTakenDown,
							bestStreak: game.enemies.best_streak,
							difficulty: game.difficulties[game.difficulty_level]
						};

						// Calculate and show shop points earned
						const pointsEarned = game.calculateShopPoints(game.score, game.difficulties[game.difficulty_level]);
						game.showMessageRow2 = '+' + pointsEarned + ' Shop Points';

						// Check for high score
						if(game.score > parseInt(game.player_data.high_score[game.difficulty_level].value) || !(parseInt(game.player_data.high_score[game.difficulty_level].value) > 0)){
							game.showMessage = 'New High Score of ' + game.score + ' !';
							game.showMessageNow = window.performance.now();
							game.setScores(game.player_data.high_score[game.difficulty_level]);
							game.setScores(game.player_data.last_score[game.difficulty_level]);
						}
						else{
							game.showMessage = 'Your Score is ' + game.score;
							game.showMessageNow = window.performance.now();
							game.setScores(game.player_data.last_score[game.difficulty_level]);
						}
					}

					game.score = 0;
					game.player.reset(game);
					game.projectiles.reset();
					game.display.reset();
					game.bullets.reset();
					game.voidBolts.reset();
					game.enemies.reset();
					game.effects.reset();
					game.world.reset();
					game.rewardManager.reset();
					game.drawGameOverWindow(ctx);
				}

				if(game.showMessage != 'None' && game.showMessage != '' && game.score == 0){
					game.drawGameOverWindow(ctx);

					let msNow = window.performance.now();
					let msPassed = msNow - game.showMessageNow;

					// Allow click to skip after minimum read time (500ms)
					const minReadTime = 500;
					const clicked = game.input.buttons.indexOf(0) > -1;
					if(msPassed > 5000 || (msPassed > minReadTime && clicked)){
						game.showMessage = 'None';

						// Handle ranked score submission
						if (game.pendingRankedScore) {
							console.log('[RANKED] Attempting to submit. Name:', game.playerName, 'Has password:', !!game.playerPassword);
							if (game.playerName && game.playerPassword) {
								console.log('[RANKED] Submitting score:', game.pendingRankedScore.score);
								game.supabase.submitRankedScore(
									game.playerName,
									game.playerPassword,
									game.pendingRankedScore.score,
									game.pendingRankedScore.kills,
									game.pendingRankedScore.bestStreak
								).then(result => {
									console.log('[RANKED] Submit result:', result);
									if (result.error) {
										console.log('[RANKED] Error:', result.error);
										game.rankedMenu.setError(result.error);
										game.rankedMenu.show('confirm');
									} else if (result.tournamentResolved) {
										console.log('[RANKED] Tournament resolved!');
										game.rankedMenu.setTournamentResults(result);
										game.rankedMenu.isVisible = true;
									} else {
										console.log('[RANKED] Queued successfully');
										game.rankedMenu.setQueuedState(result);
										game.rankedMenu.isVisible = true;
									}
								}).catch(err => {
									console.error('[RANKED] Submit failed:', err);
									game.rankedMenu.setError('Failed to submit score');
									game.rankedMenu.show('confirm');
								});
							} else {
								// Missing credentials - show error
								game.rankedMenu.setError('Login required to submit ranked score');
								game.rankedMenu.show('confirm');
							}
							game.pendingRankedScore = null;
							game.isRankedGame = false;
						}
						// After showing score message, check if we need name/password input
						else if(game.pendingScore && (!game.playerName || !game.playerPassword)) {
							game.awaitingNameInput = true;
							game.nameInputMenu.show((result) => {
								if(result && result.name && result.password) {
									game.playerName = result.name;
									game.playerPassword = result.password;
									// Track security question status
									if (result.isNewPlayer) {
										game.pendingSecurityQuestion = result.securityQuestion;
										game.pendingSecurityAnswer = result.securityAnswer;
										game.hasSecurityQuestion = true;
									} else {
										game.hasSecurityQuestion = result.hasSecurityQuestion !== false;
									}
									localStorage.setItem('playerName', result.name);
									localStorage.setItem('playerPassword', result.password);
									game.submitScoreToLeaderboard();
								}
								game.awaitingNameInput = false;
								game.pendingScore = null;
							});
						} else if(game.pendingScore && game.playerName && game.playerPassword) {
							// Already have name and password, submit directly
							game.submitScoreToLeaderboard();
						}
					}
					else{
						requestAnimationFrame(animate);
					}
				}
				if(game.showMessage == 'None' && game.score == 0 && !game.awaitingNameInput){
					game.menu.mainMenuShow = true;
					game.showMessage = '';
					// Clear escape flag to prevent pause menu from opening after closing name input
					game.input.escapePressed = false;

					// Force refresh leaderboard scores when returning to menu
					game.menu.forceRefreshScores();

					// Switch to menu music when returning to menu
					if (window.gameSound) {
						window.gameSound.playMenuMusic();
					}

					requestAnimationFrame(drawMenu);
					return;
				}

				// If awaiting name input, render and update name input menu
				if(game.awaitingNameInput) {
					game.nameInputMenu.update(game);
					game.nameInputMenu.draw(ctx, game);
					requestAnimationFrame(animate);
				}
			}
			else if(game.gameOver == false){
				requestAnimationFrame(animate);
			}
		}

		function drawMenu() {
			// Canvas size is now handled by resize event listener
			ctx.clearRect(-100, -100, game.width * 2, game.height * 2);
			var M = game.menu;

			// Try to play menu music (will queue if not unlocked yet)
			if (window.gameSound) {
				window.gameSound.playMenuMusic();
			}

			// Periodic presence ping (every 5 minutes)
			if (performance.now() - game.lastPresencePing > game.presencePingInterval) {
				game.pingPresence();
			}

			// Check for pause menu toggle in main menu (not when leaderboard, ranked menu, or name input is open)
			// Also skip if a menu was just closed (to prevent key repeat from opening pause menu)
			const nameInputJustClosed = game.nameInputMenu.closedAt && (performance.now() - game.nameInputMenu.closedAt < 200);
			const accountMenuJustClosed = game.accountMenu.closedAt && (performance.now() - game.accountMenu.closedAt < 200);
			const menuJustClosed = nameInputJustClosed || accountMenuJustClosed;
			if(game.input.escapePressed && !game.pauseMenu.isPaused && !game.leaderboardMenu.isVisible && !game.rankedMenu.isVisible && !game.nameInputMenu.isVisible && !game.accountMenu.isVisible && !game.pauseMenu.waitingForKey && !menuJustClosed) {
				game.pauseMenu.toggle(true); // Pass true to indicate we're in main menu
				game.input.escapePressed = false;
			}

			// Update pause menu if active in main menu
			if(game.pauseMenu.isPaused) {
				game.pauseMenu.update(game);
				// Check if escape was pressed to close pause menu (skip if waiting for keybind)
				if(game.input.escapePressed && !game.pauseMenu.waitingForKey) {
					game.pauseMenu.toggle(true);
					game.input.escapePressed = false;
				}
			}

			// Handle dev menu button click and scroll (before other menus)
			if (game.devMode.isEnabled()) {
				if (game.input.buttons.indexOf(0) > -1) {
					if (game.devMode.handleClick(game.input.mouseX, game.input.mouseY)) {
						// Click was handled by dev menu, consume it
						game.input.buttons = game.input.buttons.filter(b => b !== 0);
					}
				}
				// Handle scroll when dev menu is open
				if (game.devMode.devMenuOpen && game.input.wheelDelta) {
					game.devMode.handleScroll(game.input.wheelDelta);
					game.input.resetWheelDelta();
				}
			}

			if(M.mainMenuShow == true){
				M.drawMain(ctx, game);
				M.updateMain(game);
			}

			// Draw and update leaderboard menu if visible
			if(game.leaderboardMenu.isVisible) {
				const leaderboardResult = game.leaderboardMenu.update(game);
				game.leaderboardMenu.draw(ctx, game);

				// Return to ranked panel if leaderboard was opened from there
				if (leaderboardResult === 'return_to_ranked') {
					game.rankedMenu.show('confirm');
				}
			}

			// Draw and update ranked menu if visible
			if(game.rankedMenu.isVisible) {
				const rankedResult = game.rankedMenu.update(game);
				game.rankedMenu.draw(ctx, game);
				// Reset wheel delta after ranked menu processes scroll
				game.input.resetWheelDelta();

				// Check if player confirmed to start ranked game
				if (rankedResult === 'start_ranked') {
					console.log('[RANKED] Starting ranked game for:', game.playerName);
					game.rankedMenu.hide();
					game.isRankedGame = true;
					game.difficulty_level = 2; // Force HARD
					game.gameOver = false;
					M.mainMenuShow = false;
					if (game.devMode) {
						game.devMode.resetSession();
					}
				}

				// Check if player wants to open ranked leaderboard
				if (rankedResult === 'open_ranked_leaderboard') {
					game.rankedMenu.hide();
					game.leaderboardMenu.showRanked(game);
				}

				// Check if player wants to view queue standings
				if (rankedResult === 'view_queue') {
					// Fetch fresh queue standings
					game.supabase.getRankedStatus(game.playerName).then(status => {
						game.rankedMenu.setQueueStatus(status);
						game.rankedMenu.state = 'queue_view';
					});
				}

				// Refresh ranked status after returning from queued state
				if (rankedResult === 'refresh_ranked_status') {
					game.supabase.getRankedStatus(game.playerName).then(status => {
						game.rankedMenu.setQueueStatus(status);
					});
				}

				// Handle fix stuck queues (admin action)
				if (rankedResult === 'fix_stuck_queues') {
					const adminPassword = prompt('Enter admin password to force-resolve all stuck queues:');
					if (adminPassword) {
						game.supabase.fixStuckQueues(adminPassword).then(result => {
							if (result.success) {
								const resolvedCount = result.resolved ? result.resolved.length : 0;
								alert(`Successfully resolved ${resolvedCount} queue(s).`);
								// Refresh the queue status
								game.supabase.getRankedStatus(game.playerName).then(status => {
									game.rankedMenu.setQueueStatus(status);
								});
							} else {
								alert('Failed: ' + (result.error || 'Unknown error'));
							}
						}).catch(err => {
							alert('Error: ' + err.message);
						});
					}
				}
			}

			// Draw and update name input menu if visible
			if(game.awaitingNameInput) {
				game.nameInputMenu.update(game);
				game.nameInputMenu.draw(ctx, game);
			}

			// Draw and update account menu if visible
			if(game.accountMenu.isVisible) {
				game.accountMenu.update(game);
				game.accountMenu.draw(ctx, game);
			}

			// Draw and update shop menu if visible
			if(game.shopMenu.isVisible) {
				const shopResult = game.shopMenu.update(game);
				game.shopMenu.draw(ctx, game);
				game.input.resetWheelDelta();

				// Handle purchase action
				if (shopResult && shopResult.action === 'purchase') {
					// Check if password is available
					if (!game.playerPassword) {
						game.shopMenu.setMessage('Please log out and log back in to purchase', true);
					} else {
						game.supabase.purchaseItem(
							game.playerName,
							game.playerPassword,
							shopResult.rewardId,
							shopResult.rarityName,
							shopResult.isPermanent
						).then(result => {
							if (result.success) {
								game.shopMenu.setMessage(result.message, false);
								// Refresh shop data
								game.supabase.getShopData(game.playerName).then(data => {
									game.shopMenu.setShopData(data);
									game.menu.shopPoints = data.points || 0;
								});
							} else {
								// More helpful message for password errors
								if (result.error === 'Invalid password') {
									game.shopMenu.setMessage('Session expired - please log out and log back in', true);
								} else {
									game.shopMenu.setMessage(result.error || 'Purchase failed', true);
								}
							}
						}).catch(err => {
							game.shopMenu.setMessage(err.message, true);
						});
					}
				}
			}

			// Draw and update loadout menu if visible
			if(game.loadoutMenu.isVisible) {
				const loadoutResult = game.loadoutMenu.update(game);
				game.loadoutMenu.draw(ctx, game);
				game.input.resetWheelDelta();

				if (loadoutResult === 'start') {
					// Get selected rewards and start game
					game.pendingLoadoutRewards = game.loadoutMenu.getSelectedRewards();
					game.usedLoadoutRewardIds = game.loadoutMenu.getSelectedRewardIds();
					game.pendingLoadoutWeapon = game.loadoutMenu.getSelectedWeaponWithOwnership();
					game.loadoutMenu.hide();
					game.gameOver = false;
					game.menu.mainMenuShow = false;
					if (game.devMode) {
						game.devMode.resetSession();
					}
				} else if (loadoutResult === 'cancel') {
					game.loadoutMenu.hide();
				}
			}

			// Dev mode and debug console in main menu
			game.debugConsole.update(game);
			if (game.devMode.isEnabled()) {
				game.devMode.drawIndicators(ctx, game);
				game.devMode.drawDevMenuButton(ctx);
				game.devMode.drawDevMenuPanel(ctx);
				game.debugConsole.draw(ctx, game);
			}

			game.pauseMenu.draw(ctx, game, true);

			if(game.gameOver == true) {
				requestAnimationFrame(drawMenu);
			}
			else{
				game.game_time = window.performance.now();
				game.set_difficulty();

				// Apply starter rewards if any (non-ranked games only)
				if (!game.isRankedGame && game.pendingLoadoutRewards && game.pendingLoadoutRewards.length > 0) {
					game.rewardManager.applyStarterRewards(game.pendingLoadoutRewards);
					console.log('[LOADOUT] Applied', game.pendingLoadoutRewards.length, 'starter rewards');

					// Set up loadout weapon for reactivation
					if (game.pendingLoadoutWeapon) {
						game.rewardManager.setLoadoutWeapon(game.pendingLoadoutWeapon);
						console.log('[LOADOUT] Weapon set for reactivation:', game.pendingLoadoutWeapon.reward.name,
							game.pendingLoadoutWeapon.isPermanent ? '(Permanent)' : `(${game.pendingLoadoutWeapon.quantity} uses)`);
					}
				}

				// Switch to game music when starting game
				if (window.gameSound) {
					window.gameSound.playGameMusic();
				}
				timeout(100);
				requestAnimationFrame(animate);
			}
		}
		game.menu.mainMenuShow = true;
		drawMenu();

		async function timeout(ms) {
			console.log("timeout: " + ms);
			let timeNow = performance.now();
			while(performance.now() - timeNow < ms){};
		}
	}
	Main();

});
