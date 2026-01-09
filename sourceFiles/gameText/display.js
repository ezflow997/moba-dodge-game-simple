export class Display{
    constructor(game){
        this.scoreX = game.width*0.45;
        this.scoreY = game.height*0.05;

        this.enemyTakeDowns = 0;
        this.enemyHitStreak = 0;

        this.scoreText = 0;

        this.eCoolDownTime = 0;
        this.fCoolDownTime = 0;
        this.qCoolDownTime = 0;
    }
    reset(){
        this.scoreText = 0;

        this.eCoolDownTime = 0;
        this.fCoolDownTime = 0;
        this.qCoolDownTime = 0;
    }
    update(game){
        this.scoreText = game.score;

        this.enemyHitStreak = game.enemies.hitStreak;
        this.enemyTakeDowns = game.enemies.enemiesTakenDown;

        this.eCoolDownTime = (game.player.eCoolDown - game.player.eCoolDownElapsed);
        this.fCoolDownTime = (game.player.fCoolDown - game.player.fCoolDownElapsed);
        this.qCoolDownTime = (game.player.qCoolDown - game.player.qCoolDownElapsed);
    }
    draw(context, game){
        // Hide score UI when in test room
        if (game.testRoom && game.testRoom.active) {
            return;
        }

        let size = 0;

        // draw UI
        context.beginPath();
        size = 50 * (window.innerWidth/2560);
        context.font = size + "px Arial Black";
        context.fillStyle = 'white';

        // draw score UI
        context.fillText(""+this.scoreText, window.innerWidth*(0.45), window.innerHeight*0.05);

        // draw enemies hit streak
        if(this.enemyHitStreak > 0){
            context.fillText('x'+this.enemyHitStreak, window.innerWidth*(0.65), window.innerHeight*0.05);
        }
        // draw enemies taken down
        if(this.enemyTakeDowns > 0){
            context.fillText('K:'+this.enemyTakeDowns, window.innerWidth*(0.57), window.innerHeight*0.05);
        }

        // Note: Cooldown timers are now rendered by PowerupHUD with radial timer icons
        context.closePath();
    }
}