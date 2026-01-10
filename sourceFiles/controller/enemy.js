import { makeMovements } from "./makeMovement.js";
var move = new makeMovements();

// Global performance mode flag - reduces visual effects for better FPS
export let performanceMode = false;
export function setPerformanceMode(enabled) {
    performanceMode = enabled;
}

export class Enemy {
    constructor(newX, newY, newSize, newColor, newSpeed){
        this.x = newX;
        this.y = newY;

        this.size = newSize * window.innerWidth/2560;
        this.color = newColor;
        this.speed = newSpeed * window.innerWidth/2560;

        this.bulletCollision = false;
        this.playerCollision = false;

        this.pulsePhase = Math.random() * Math.PI * 2;
        this.rotationAngle = Math.random() * Math.PI * 2;
        this.spikes = 6;
        this.spikeLength = this.size * 0.4;

        this.prevWindowW = window.innerWidth;
        this.prevWindowH = window.innerHeight;
    }
    update(player){
        if(window.innerWidth != this.prevWindowW || window.innerHeight != this.prevWindowH){
            this.x = this.x * window.innerWidth / this.prevWindowW;
            this.y = this.y * window.innerHeight / this.prevWindowH;
            this.size = this.size * window.innerWidth / this.prevWindowW;
            this.speed = this.speed * window.innerWidth / this.prevWindowW;

            this.prevWindowW = window.innerWidth;
            this.prevWindowH = window.innerHeight;
        }

        if(this.x != player.x || this.y != player.y){
            var values = move.make(this.x, this.y, this.speed, player.x, player.y);
            this.x = values[0];
            this.y = values[1];
            //console.log(values);
        }
        this.prevWindowW = window.innerWidth;
        this.prevWindowH = window.innerHeight;
    }
    draw(context){
        // Use simplified rendering in performance mode
        if (performanceMode) {
            this.drawSimple(context);
            return;
        }

        const rX = window.innerWidth / 2560;

        // Update animations
        this.pulsePhase += 0.06;
        this.rotationAngle += 0.02;
        const pulse = 0.9 + Math.sin(this.pulsePhase) * 0.1;
        const threatPulse = Math.sin(this.pulsePhase * 2);

        context.save();

        // Menacing outer glow
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.4);
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.4)');
        gradient.addColorStop(0.5, 'rgba(200, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 1.4 * pulse, 0, Math.PI * 2);
        context.fill();

        // Rotating threat indicator ring
        context.strokeStyle = `rgba(255, 0, 0, ${0.6 + threatPulse * 0.3})`;
        context.shadowColor = '#ff0000';
        context.shadowBlur = 15 * rX;
        context.lineWidth = 2 * rX;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
        context.stroke();

        // Draw spiky protrusions
        context.fillStyle = '#ff3333';
        context.shadowColor = '#ff0000';
        context.shadowBlur = 10 * rX;

        for (let i = 0; i < this.spikes; i++) {
            const angle = (Math.PI * 2 / this.spikes) * i + this.rotationAngle;
            const spikeLen = this.spikeLength * (0.8 + Math.sin(this.pulsePhase + i) * 0.2);

            const baseX1 = this.x + Math.cos(angle - 0.15) * this.size * 0.7;
            const baseY1 = this.y + Math.sin(angle - 0.15) * this.size * 0.7;
            const baseX2 = this.x + Math.cos(angle + 0.15) * this.size * 0.7;
            const baseY2 = this.y + Math.sin(angle + 0.15) * this.size * 0.7;
            const tipX = this.x + Math.cos(angle) * (this.size + spikeLen);
            const tipY = this.y + Math.sin(angle) * (this.size + spikeLen);

            context.beginPath();
            context.moveTo(baseX1, baseY1);
            context.lineTo(tipX, tipY);
            context.lineTo(baseX2, baseY2);
            context.closePath();
            context.fill();
        }

        // Main body - dark gradient
        const bodyGradient = context.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
        );
        bodyGradient.addColorStop(0, '#ff6666');
        bodyGradient.addColorStop(0.5, '#cc0000');
        bodyGradient.addColorStop(1, '#880000');

        context.shadowColor = '#ff0000';
        context.shadowBlur = 20 * rX * pulse;
        context.fillStyle = bodyGradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.8 * pulse, 0, Math.PI * 2);
        context.fill();

        // Corrupted core
        context.shadowBlur = 15 * rX;
        context.fillStyle = '#330000';
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.4 * pulse, 0, Math.PI * 2);
        context.fill();

        // Evil eye/core
        context.globalAlpha = 0.7 + threatPulse * 0.3;
        context.fillStyle = '#ff0000';
        context.shadowColor = '#ff0000';
        context.shadowBlur = 20 * rX;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.15 * pulse, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    // Simplified draw for performance mode - no shadows, no gradients
    drawSimple(context) {
        this.rotationAngle += 0.02;

        // Simple red circle with spikes
        context.fillStyle = '#cc0000';
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
        context.fill();

        // Simple spikes (no shadows)
        context.fillStyle = '#ff3333';
        for (let i = 0; i < this.spikes; i++) {
            const angle = (Math.PI * 2 / this.spikes) * i + this.rotationAngle;
            const baseX1 = this.x + Math.cos(angle - 0.15) * this.size * 0.7;
            const baseY1 = this.y + Math.sin(angle - 0.15) * this.size * 0.7;
            const baseX2 = this.x + Math.cos(angle + 0.15) * this.size * 0.7;
            const baseY2 = this.y + Math.sin(angle + 0.15) * this.size * 0.7;
            const tipX = this.x + Math.cos(angle) * (this.size + this.spikeLength);
            const tipY = this.y + Math.sin(angle) * (this.size + this.spikeLength);

            context.beginPath();
            context.moveTo(baseX1, baseY1);
            context.lineTo(tipX, tipY);
            context.lineTo(baseX2, baseY2);
            context.closePath();
            context.fill();
        }

        // Dark core
        context.fillStyle = '#660000';
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
        context.fill();
    }
    checkCollision(player, bullets, rewardManager = null){
        var distX = Math.abs(this.x - player.x);
        var distY = Math.abs(this.y - player.y);
        var distC = Math.sqrt(Math.pow(distX,2) + Math.pow(distY,2));

        // Ghost mode - ignore player collision entirely
        if (rewardManager && rewardManager.ghostMode) {
            this.playerCollision = false;
        } else if(distC < (this.size + player.size)){
            this.playerCollision = true;
        }
        else{
            this.playerCollision = false;
        }

        // Only check bullet collisions if not already marked as hit
        // (ricochet bullets set bulletCollision directly when bouncing)
        if(bullets.length > 0 && !this.bulletCollision){
            for(let i = 0; i < bullets.length; i++){
                let bullet = bullets[i];
                var distX = Math.abs(this.x - bullet.x);
                var distY = Math.abs(this.y - bullet.y);
                var distC = Math.sqrt(Math.pow(distX,2) + Math.pow(distY,2));

                if(distC < (this.size + bullet.size)){
                    this.bulletCollision = true;
                    switch(bullets.bulletType){
                        case 'Initial':{
                            bullets.bulletsInitialHitTarget = true;
                            break;
                        }
                        case 'Split-Right':{
                            bullets.bulletsSplitRightHitTarget = true;
                            break;
                        }
                        case 'Split-Left':{
                            bullets.bulletsSplitLeftHitTarget = true;
                            break;
                        }
                    }
                    break;
                }
            }
        }

    }
}