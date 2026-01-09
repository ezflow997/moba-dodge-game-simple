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

				this.msDraw = window.performance.now();
				this.msUpdate = window.performance.now();
				this.msScore = window.performance.now();
				this.game_time = 0;

				this.score = 0;
				this.scorePrev = 0;
				this.gameOver = true;
				this.showMessage = '';
				this.showMessageNow = window.performance.now();

				this.difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'INSANE'];
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

				// Check for pause toggle
				if(this.input.escapePressed) {
					this.pauseMenu.toggle();
					this.input.escapePressed = false;
				}

				// Don't update game if paused
				if(this.pauseMenu.isPaused) {
					this.pauseMenu.update(this);
					return;
				}

				if(msNow2 - this.msUpdate < 1000 / this.logic_fps) return;
				this.msUpdate = window.performance.now();

				this.player.update(this.input, this);
				
				// Always update bullets/voidBolts so player can shoot
				if(this.challenge_level == 0){
					this.bullets.update(this.player, this.input, this.enemies, this);
				}
				else if(this.challenge_level == 1){
					this.voidBolts.update(this.enemies, this);
				}
				
				// Only update enemies and projectiles when NOT in test room
				if(!this.testRoom.active) {
					if(this.challenge_level == 0){
						this.enemies.update(this, this.player, this.bullets, msNow2);
					}
					else if(this.challenge_level == 1){
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
				if(this.challenge_level == 0){
					this.bullets.draw(context);
				}
				else if(this.challenge_level == 1){
					this.voidBolts.draw(context);
				}
				this.enemies.draw(context);
				this.projectiles.draw(context);
				this.effects.draw(context);
				// Draw rewards (drops and on-player effects only)
				this.rewardManager.draw(context, this.player);

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
			reset(){
				this.score = 0;
				this.scorePrev = 0;
				this.gameOver = true;
				this.showMessage = '';
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
							this.supabase.consumeItems(this.playerName, this.playerPassword, this.usedLoadoutRewardIds).then(consumeResult => {
								console.log('[LOADOUT] Consumed items:', consumeResult);
							}).catch(err => {
								console.error('[LOADOUT] Failed to consume items:', err);
							});
						}
					}
					// Clear loadout tracking
					this.pendingLoadoutRewards = [];
					this.usedLoadoutRewardIds = [];
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

			if(game.input.escapePressed && game.pauseMenu.isPaused) {
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

			// Check for pause menu toggle in main menu (not when leaderboard or ranked menu is open)
			if(game.input.escapePressed && !game.pauseMenu.isPaused && !game.leaderboardMenu.isVisible && !game.rankedMenu.isVisible) {
				game.pauseMenu.toggle(true); // Pass true to indicate we're in main menu
				game.input.escapePressed = false;
			}

			// Update pause menu if active in main menu
			if(game.pauseMenu.isPaused) {
				game.pauseMenu.update(game);
				// Check if escape was pressed to close pause menu
				if(game.input.escapePressed) {
					game.pauseMenu.toggle(true);
					game.input.escapePressed = false;
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
					game.leaderboardMenu.showRanked();
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
