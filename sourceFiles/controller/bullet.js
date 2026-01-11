import { makeMovements } from "./makeMovement.js";
var move = new makeMovements();

export class Bullet {
    constructor(newX, newY, newEndX, newEndY, newSize, newColor, newSpeed, newBulletType){
        this.x = newX;
        this.y = newY;
        this.endX = newEndX;
        this.endY = newEndY;

        this.size = newSize * window.innerWidth/2560;
        this.color = '#ff6600';  // Orange like boss projectiles
        this.glowColor = '#ffaa00';  // Yellow glow
        this.speed = newSpeed * window.innerWidth/2560;

        this.destroy = false;
        this.enemyCollision = false;

        this.bulletType = newBulletType;

        // Visual effects
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trail = [];
        this.maxTrailLength = 8;

        this.prevWindowW = window.innerWidth;
        this.prevWindowH = window.innerHeight;
    }
    
    update(){
        if(window.innerWidth != this.prevWindowW || window.innerHeight != this.prevWindowH){
            this.x = this.x * window.innerWidth / this.prevWindowW;
            this.y = this.y * window.innerHeight / this.prevWindowH;
            this.endX = this.endX * window.innerWidth / this.prevWindowW;
            this.endY = this.endY * window.innerHeight / this.prevWindowH;
            this.size = this.size * window.innerWidth / this.prevWindowW;
            this.speed = this.speed * window.innerWidth / this.prevWindowW;

            this.prevWindowW = window.innerWidth;
            this.prevWindowH = window.innerHeight;
        }

        // Store position for trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        if(this.x != this.endX || this.y != this.endY){
            var values = move.make(this.x, this.y, this.speed, this.endX, this.endY);
            this.x = values[0];
            this.y = values[1];
        }
        else{
            this.destroy = true;
        }
        
        // Update pulse
        this.pulsePhase += 0.15;
        
        this.prevWindowW = window.innerWidth;
        this.prevWindowH = window.innerHeight;
    }
    
    checkCollision(enemies){
        for(let i = 0; i < enemies.length; i++){
            let enemy = enemies[i];
            var distX = Math.abs(this.x - enemy.x);
            var distY = Math.abs(this.y - enemy.y);
            var distC = Math.sqrt(Math.pow(distX,2) + Math.pow(distY,2));
    
            if(distC <= (this.size + enemy.size)){
                this.enemyCollision = true;
            }
            else{
                this.enemyCollision = false;
            } 
        }
    }
    
    draw(context){
        // Viewport culling - skip drawing if outside visible area
        const cullBuffer = this.size * 2;
        if (this.x < -cullBuffer || this.x > window.innerWidth + cullBuffer ||
            this.y < -cullBuffer || this.y > window.innerHeight + cullBuffer) {
            return;
        }

        const rX = window.innerWidth / 2560;
        const pulse = 0.8 + Math.sin(this.pulsePhase) * 0.2;

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.5;
            const trailSize = this.size * (i / this.trail.length) * 0.7;

            context.save();
            context.globalAlpha = alpha;
            context.beginPath();
            context.fillStyle = this.glowColor;
            context.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }

        context.save();

        // Outer glow
        context.shadowColor = this.glowColor;
        context.shadowBlur = 20 * rX * pulse;

        // Main projectile
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        context.fill();

        // Inner bright core
        context.beginPath();
        context.fillStyle = '#ffffff';
        context.arc(this.x, this.y, this.size * 0.4 * pulse, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }
}