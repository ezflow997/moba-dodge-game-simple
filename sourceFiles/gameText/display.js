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
    }
    reset(){
        this.scoreText = 0;
        this.displayedScore = 0;

        this.eCoolDownTime = 0;
        this.fCoolDownTime = 0;
        this.qCoolDownTime = 0;

        this.streakPulse = 0;
        this.killFlash = 0;
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

        context.restore();
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