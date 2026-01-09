export class Display{
    constructor(game){
        this.scoreX = game.width*0.45;
        this.scoreY = game.height*0.05;

        this.enemyTakeDowns = 0;
        this.enemyHitStreak = 0;

        this.scoreText = 0;
        this.displayedScore = 0;  // For smooth score animation

        this.eCoolDownTime = 0;
        this.fCoolDownTime = 0;
        this.qCoolDownTime = 0;

        // Animation state
        this.streakPulse = 0;
        this.killFlash = 0;

        // Boss progress tracking
        this.bossProgress = 0;
        this.bossThreshold = 70;
        this.bossDefeated = 0;
        this.bossActive = false;
        this.bossPulse = 0;
    }
    reset(){
        this.scoreText = 0;
        this.displayedScore = 0;

        this.eCoolDownTime = 0;
        this.fCoolDownTime = 0;
        this.qCoolDownTime = 0;

        this.streakPulse = 0;
        this.killFlash = 0;

        // Reset boss progress
        this.bossProgress = 0;
        this.bossThreshold = 70;
        this.bossDefeated = 0;
        this.bossActive = false;
        this.bossPulse = 0;
    }
    update(game){
        const prevKills = this.enemyTakeDowns;

        this.scoreText = game.score;
        this.enemyHitStreak = game.enemies.hitStreak;
        this.enemyTakeDowns = game.enemies.enemiesTakenDown;

        // Smooth score animation
        const diff = this.scoreText - this.displayedScore;
        this.displayedScore += diff * 0.15;
        if (Math.abs(diff) < 1) this.displayedScore = this.scoreText;

        // Trigger kill flash when kills increase
        if (this.enemyTakeDowns > prevKills) {
            this.killFlash = 1;
        }
        this.killFlash *= 0.92;

        // Pulse animation for streak
        this.streakPulse += 0.15;

        // Update boss progress from enemies controller
        this.bossProgress = game.enemies.bossTowardsScore;
        this.bossThreshold = game.enemies.currentBossThreshold;
        this.bossDefeated = game.enemies.bossDefeated;
        this.bossActive = game.enemies.bossActive;
        this.bossPulse += 0.1;

        this.eCoolDownTime = (game.player.eCoolDown - game.player.eCoolDownElapsed);
        this.fCoolDownTime = (game.player.fCoolDown - game.player.fCoolDownElapsed);
        this.qCoolDownTime = (game.player.qCoolDown - game.player.qCoolDownElapsed);
    }
    draw(context, game){
        // Hide score UI when in test room
        if (game.testRoom && game.testRoom.active) {
            return;
        }

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;
        const centerX = window.innerWidth * 0.5;
        const topY = 45 * rY;

        context.save();

        // === SCORE (Center) ===
        const scoreSize = 52 * rX;
        context.font = `bold ${scoreSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Score glow
        context.shadowColor = '#00ffff';
        context.shadowBlur = 15 * rX;
        context.fillStyle = '#ffffff';
        context.fillText(Math.floor(this.displayedScore).toLocaleString(), centerX, topY);
        context.shadowBlur = 0;

        // === KILLS (Left of score) ===
        if (this.enemyTakeDowns > 0) {
            const killX = centerX - 180 * rX;

            // Draw skull icon
            this.drawSkullIcon(context, killX - 25 * rX, topY, 22 * rX, this.killFlash);

            // Kill count
            const killSize = 38 * rX;
            context.font = `bold ${killSize}px Arial`;
            context.textAlign = 'left';

            // Flash effect on new kill
            const flashIntensity = this.killFlash;
            if (flashIntensity > 0.1) {
                context.shadowColor = '#ff4444';
                context.shadowBlur = 20 * rX * flashIntensity;
            }
            context.fillStyle = `rgb(${255}, ${180 + 75 * (1 - flashIntensity)}, ${180 + 75 * (1 - flashIntensity)})`;
            context.fillText(this.enemyTakeDowns.toString(), killX, topY);
            context.shadowBlur = 0;
        }

        // === STREAK (Right of score) ===
        if (this.enemyHitStreak > 0) {
            const streakX = centerX + 140 * rX;

            // Pulsing effect for active streak
            const pulse = 1 + Math.sin(this.streakPulse) * 0.08;
            const streakSize = 38 * rX * pulse;

            context.font = `bold ${streakSize}px Arial`;
            context.textAlign = 'left';

            // Streak glow (more intense with higher streak)
            const glowIntensity = Math.min(this.enemyHitStreak / 10, 1);
            context.shadowColor = '#ffaa00';
            context.shadowBlur = (10 + glowIntensity * 15) * rX;

            // Color shifts from yellow to orange with higher streaks
            const r = 255;
            const g = Math.max(150, 255 - this.enemyHitStreak * 8);
            const b = 50;
            context.fillStyle = `rgb(${r}, ${g}, ${b})`;

            // Draw lightning bolt icon
            this.drawStreakIcon(context, streakX - 8 * rX, topY, 18 * rX);

            context.fillText(`${this.enemyHitStreak}`, streakX + 18 * rX, topY);
            context.shadowBlur = 0;
        }

        // === BOSS PROGRESS BAR (Below score) ===
        this.drawBossProgress(context, centerX, topY + 40 * rY, rX, rY);

        context.restore();
    }

    /**
     * Draw boss progress indicator
     */
    drawBossProgress(context, centerX, y, rX, rY) {
        const barWidth = 200 * rX;
        const barHeight = 12 * rY;
        const barX = centerX - barWidth / 2;

        context.save();

        if (this.bossActive) {
            // Boss is active - show "BOSS FIGHT" indicator
            const pulse = 1 + Math.sin(this.bossPulse * 2) * 0.1;
            const fontSize = 18 * rX * pulse;

            context.font = `bold ${fontSize}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            // Pulsing red glow
            context.shadowColor = '#ff0000';
            context.shadowBlur = 15 * rX + Math.sin(this.bossPulse * 2) * 5;
            context.fillStyle = '#ff4444';

            const bossNum = this.bossDefeated + 1;
            context.fillText(`BOSS ${bossNum}`, centerX, y);
        } else {
            // Show progress bar towards next boss
            const progress = Math.min(this.bossProgress / this.bossThreshold, 1);
            const killsNeeded = Math.ceil(this.bossThreshold / 10); // Each kill = 10 score
            const currentKills = Math.floor(this.bossProgress / 10);

            // Background bar
            context.fillStyle = 'rgba(40, 40, 60, 0.7)';
            context.strokeStyle = 'rgba(100, 100, 150, 0.5)';
            context.lineWidth = 1;
            this.roundRect(context, barX, y - barHeight / 2, barWidth, barHeight, 4);
            context.fill();
            context.stroke();

            // Progress fill with gradient
            if (progress > 0) {
                const fillWidth = barWidth * progress;
                const gradient = context.createLinearGradient(barX, 0, barX + barWidth, 0);

                // Color shifts from cyan to red as progress increases
                if (progress < 0.5) {
                    gradient.addColorStop(0, '#00aaff');
                    gradient.addColorStop(1, '#00ffaa');
                } else if (progress < 0.8) {
                    gradient.addColorStop(0, '#ffaa00');
                    gradient.addColorStop(1, '#ff6600');
                } else {
                    // Near boss spawn - pulsing effect
                    const pulseIntensity = 0.3 + Math.sin(this.bossPulse * 3) * 0.2;
                    gradient.addColorStop(0, '#ff4400');
                    gradient.addColorStop(1, `rgba(255, 0, 0, ${0.8 + pulseIntensity})`);
                }

                context.fillStyle = gradient;
                this.roundRect(context, barX, y - barHeight / 2, fillWidth, barHeight, 4);
                context.fill();

                // Glow effect when near full
                if (progress >= 0.8) {
                    context.shadowColor = '#ff0000';
                    context.shadowBlur = 10 * rX * (1 + Math.sin(this.bossPulse * 3) * 0.3);
                }
            }

            // Boss icon on the right side of bar
            this.drawBossIcon(context, barX + barWidth + 15 * rX, y, 10 * rX, progress);

            // Progress text
            const textSize = 11 * rX;
            context.font = `bold ${textSize}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.shadowColor = '#000000';
            context.shadowBlur = 3;
            context.fillStyle = '#ffffff';
            context.fillText(`${currentKills}/${killsNeeded}`, centerX, y);
        }

        context.restore();
    }

    /**
     * Draw a small boss skull icon
     */
    drawBossIcon(context, x, y, size, progress) {
        context.save();

        // Color based on progress
        let color = '#666688';
        if (progress >= 0.8) {
            const pulse = 0.7 + Math.sin(this.bossPulse * 3) * 0.3;
            color = `rgba(255, ${Math.floor(80 * (1 - pulse))}, ${Math.floor(80 * (1 - pulse))}, 1)`;
        } else if (progress >= 0.5) {
            color = '#ffaa44';
        }

        context.fillStyle = color;

        // Simple skull shape
        context.beginPath();
        context.arc(x, y - size * 0.2, size * 0.8, Math.PI, 0, false);
        context.lineTo(x + size * 0.8, y + size * 0.3);
        context.lineTo(x + size * 0.4, y + size * 0.5);
        context.lineTo(x - size * 0.4, y + size * 0.5);
        context.lineTo(x - size * 0.8, y + size * 0.3);
        context.closePath();
        context.fill();

        // Eyes
        context.fillStyle = '#000';
        context.beginPath();
        context.arc(x - size * 0.3, y, size * 0.15, 0, Math.PI * 2);
        context.arc(x + size * 0.3, y, size * 0.15, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    /**
     * Helper to draw rounded rectangles
     */
    roundRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    }

    /**
     * Draw a skull icon for kills
     */
    drawSkullIcon(context, x, y, size, flash = 0) {
        context.save();

        const flashColor = flash > 0.1 ? `rgba(255, ${100 + 155 * (1 - flash)}, ${100 + 155 * (1 - flash)}, 1)` : '#ff6666';

        // Skull glow on flash
        if (flash > 0.1) {
            context.shadowColor = '#ff0000';
            context.shadowBlur = 15 * flash;
        }

        context.fillStyle = flashColor;
        context.strokeStyle = '#aa0000';
        context.lineWidth = size * 0.08;

        // Skull head (rounded top)
        context.beginPath();
        context.arc(x, y - size * 0.15, size * 0.7, Math.PI, 0, false);
        context.lineTo(x + size * 0.7, y + size * 0.2);
        context.quadraticCurveTo(x + size * 0.7, y + size * 0.5, x + size * 0.4, y + size * 0.55);
        context.lineTo(x - size * 0.4, y + size * 0.55);
        context.quadraticCurveTo(x - size * 0.7, y + size * 0.5, x - size * 0.7, y + size * 0.2);
        context.closePath();
        context.fill();

        // Eye sockets
        context.fillStyle = '#220000';
        context.beginPath();
        context.ellipse(x - size * 0.28, y, size * 0.18, size * 0.22, 0, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.ellipse(x + size * 0.28, y, size * 0.18, size * 0.22, 0, 0, Math.PI * 2);
        context.fill();

        // Nose hole
        context.beginPath();
        context.moveTo(x, y + size * 0.15);
        context.lineTo(x - size * 0.1, y + size * 0.3);
        context.lineTo(x + size * 0.1, y + size * 0.3);
        context.closePath();
        context.fill();

        // Teeth
        context.fillStyle = flashColor;
        const teethY = y + size * 0.55;
        for (let i = -2; i <= 2; i++) {
            context.fillRect(x + i * size * 0.15 - size * 0.06, teethY, size * 0.11, size * 0.2);
        }

        context.restore();
    }

    /**
     * Draw a lightning/fire icon for streak
     */
    drawStreakIcon(context, x, y, size) {
        context.save();

        context.fillStyle = '#ffaa00';
        context.strokeStyle = '#ff6600';
        context.lineWidth = size * 0.1;

        // Lightning bolt shape
        context.beginPath();
        context.moveTo(x + size * 0.1, y - size * 0.8);
        context.lineTo(x - size * 0.4, y + size * 0.1);
        context.lineTo(x, y + size * 0.05);
        context.lineTo(x - size * 0.2, y + size * 0.8);
        context.lineTo(x + size * 0.5, y - size * 0.15);
        context.lineTo(x + size * 0.1, y - size * 0.1);
        context.closePath();
        context.fill();
        context.stroke();

        context.restore();
    }
}