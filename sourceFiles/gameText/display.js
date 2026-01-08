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

        // draw E Cool Down Time
        if(this.eCoolDownTime != game.player.eCoolDown && this.eCoolDownTime > 0){
            context.fillText('E: '+(this.eCoolDownTime/1000).toFixed(1), window.innerWidth*(0.08), window.innerHeight*0.96);
        }
        // draw F Cool Down Time
        if(this.fCoolDownTime != game.player.fCoolDown && this.fCoolDownTime > 0){
            context.fillText('F: '+(this.fCoolDownTime/1000).toFixed(1), window.innerWidth*(0.08 + (0.12*1)), window.innerHeight*0.96);
        }
        // draw Q Cool Down Time
        if(this.qCoolDownTime != game.player.qCoolDown && this.qCoolDownTime > 0){
            context.fillText('Q: '+(this.qCoolDownTime/1000).toFixed(1), window.innerWidth*(0.08 + (0.12*2)), window.innerHeight*0.96);
        }
        context.closePath();
    }
}