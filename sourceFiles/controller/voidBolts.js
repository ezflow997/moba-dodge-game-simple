import { VoidBolt } from "./voidBolt.js";

export class VoidBolts {
    constructor() {
        this.bolts = [];
        this.canRecast = false;
        this.activeBolt = null; // The main bolt that can be split
        this.splitScoreMultiplier = 5;
        this.mainBoltHit = false;
        this.splitBoltHit = false;
        this.anyBoltHit = false;
    }
    
    shoot(player, mouseX, mouseY) {
        // Clear any existing bolts
        this.reset();
        
        // Create new bolt
        const bolt = new VoidBolt(
            player.x,
            player.y,
            mouseX,
            mouseY,
            12, // speed
            26  // size
        );
        
        this.bolts.push(bolt);
        this.activeBolt = bolt;
        this.canRecast = true;
        this.mainBoltHit = false;
        this.splitBoltHit = false;
        this.anyBoltHit = false;
        
        if (window.gameSound) window.gameSound.playShoot();
    }
    
    recast() {
        if (!this.canRecast || !this.activeBolt || this.activeBolt.hasSplit) {
            return false;
        }
        
        // Split the active bolt
        const splitBolts = this.activeBolt.split();
        
        if (splitBolts) {
            this.bolts.push(...splitBolts);
            this.canRecast = false;
            this.activeBolt = null;
            return true;
        }
        
        return false;
    }
    
    update(enemies, game) {
        // Track cooldown for display
        if(game.player.qPressed == true){
            let msNow = window.performance.now();
            game.player.qCoolDownElapsed = msNow - game.player.qPressedNow;
            
            // Check for cooldown refund if only split bolts scored
            if(!this.mainBoltHit && this.splitBoltHit && game.player.qCoolDownElapsed > 0){
                // Instant reset
                game.player.qPressed = false;
                game.player.qTriggered = true;
                game.player.qPressed_Recast = false;
                game.player.qRecastReady = false;
                game.player.qCoolDownElapsed = 0;
                game.player.qPressedNow = window.performance.now();
            }
            // Reset when cooldown complete AND bolts are gone
            else if(game.player.qCoolDownElapsed >= game.player.qCoolDown && this.bolts.length === 0){
                game.player.qPressed = false;
                game.player.qTriggered = true;
                game.player.qPressed_Recast = false;
                game.player.qRecastReady = false;
            }
        }

        // Update all bolts
        for (let i = this.bolts.length - 1; i >= 0; i--) {
            const bolt = this.bolts[i];
            
            bolt.update();
            
            // Check collision
            const collision = bolt.checkCollision(enemies.enemiesList, enemies.boss);

            // Track hits BEFORE auto-split changes state
            if (collision && (collision.type === 'enemy' || collision.type === 'boss' || collision.type === 'orbital')) {
                this.anyBoltHit = true;
                if (bolt === this.activeBolt && !bolt.hasSplit) {
                    this.mainBoltHit = true;
                } else if (bolt !== this.activeBolt || bolt.hasSplit) {
                    this.splitBoltHit = true;
                }
            }

            // Auto-split main bolt on hit or range limit
            if (bolt === this.activeBolt && !bolt.hasSplit && this.canRecast) {
                if (collision || bolt.distanceTraveled >= bolt.maxRange) {
                    this.recast(); // Auto-split
                }
            }
            
            if (collision) {
                // Check if this is a split bolt (not the main bolt, or main bolt after it split)
                const isSplitBolt = bolt !== this.activeBolt || bolt.hasSplit;
                const scoreMultiplier = isSplitBolt ? this.splitScoreMultiplier : 1;

                if (collision.type === 'enemy') {
                    // Track if main bolt scored
                    if (bolt === this.activeBolt && !bolt.hasSplit) {
                        this.mainBoltHit = true;
                    }
                    // Track if split bolt scored
                    else if (bolt !== this.activeBolt) {
                        this.splitBoltHit = true;
                    }
                    // Enemy hit - apply split multiplier if applicable
                    enemies.hitStreak += 1;
                    if (enemies.hitStreak > enemies.best_streak) {
                        enemies.best_streak = enemies.hitStreak;
                    }
                    game.rewardManager.addScore(game, enemies.enemyScoreValue * enemies.hitStreak * scoreMultiplier);
                    enemies.enemiesTakenDown += 1;

                    // Add to boss score tracking
                    if (!enemies.bossActive) {
                        enemies.bossTowardsScore += enemies.enemyScoreValue;
                    }
                } else if (collision.type === 'boss') {
                    // Boss hit - increase streak and add score with split multiplier
                    enemies.hitStreak += 1;
                    if (enemies.hitStreak > enemies.best_streak) {
                        enemies.best_streak = enemies.hitStreak;
                    }
                    game.rewardManager.addScore(game, enemies.enemyScoreValue * enemies.hitStreak * scoreMultiplier);
                } else if (collision.type === 'orbital') {
                    // Vortex boss orbital hit - counts towards streak with split multiplier
                    enemies.hitStreak += 1;
                    if (enemies.hitStreak > enemies.best_streak) {
                        enemies.best_streak = enemies.hitStreak;
                    }
                    game.rewardManager.addScore(game, enemies.enemyScoreValue * enemies.hitStreak * scoreMultiplier);
                }
            }
            
            // Remove destroyed bolts
            if (bolt.destroy) {
                this.bolts.splice(i, 1);
                
                // Clear active bolt if it was destroyed
                if (bolt === this.activeBolt) {
                    this.activeBolt = null;
                    this.canRecast = false;
                }
            }
        }
        
        // Reset recast if all bolts are gone
        if (this.bolts.length === 0) {
            this.canRecast = false;
            this.activeBolt = null;

            // Reset streak ONLY if NO bolts hit anything
            if (!this.anyBoltHit) {
                enemies.hitStreak = 0;
            }
        }
    }
    
    draw(context) {
        for (let bolt of this.bolts) {
            bolt.draw(context);
        }
    }
    
    reset() {
        this.bolts = [];
        this.canRecast = false;
        this.activeBolt = null;
    }
    
    isEmpty() {
        return this.bolts.length === 0;
    }
}