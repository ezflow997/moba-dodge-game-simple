import { makeMovements } from "./makeMovement.js";

var move = new makeMovements();
var colorsList = ['red', 'blue', 'green', 'purple'];

export class Player {
    constructor(game, playerID){
        this.playerID = playerID;

        this.x = game.width/2;
        this.y = game.height/2;

        this.baseSpeed = 4.1 * window.innerWidth/2560 * 120/60;
        this.speed = this.baseSpeed;
        this.size = 40 * window.innerWidth/2560;

        this.dx = 0;
        this.dy = 0;
        this.desiredX = this.x;
        this.desiredY = this.y;

        this.prevWindowWidth = window.innerWidth;
        this.prevWindowHeight = window.innerHeight;

        this.qCoolDown = 1600;
        this.qCoolDownElapsed = 0;
        this.qPressed = false;
        this.qPressedNow = window.performance.now();
        this.qTriggered = true;
        this.qPresses = 0;
        this.qPressed_Recast = false;
        this.qTriggered_Recast = true;
        this.qPresses_Recast = 0;

        this.eCoolDown = 6100;
        this.ePressed = false;
        this.eCoolDownElapsed = 0;
        this.ePressedNow = window.performance.now();
        this.eTriggered = true;
        this.ePresses = 0;
        this.ePenalty = -250;

        this.fCoolDown = 24000;
        this.fCoolDownElapsed = 0;
        this.fPressed = false;
        this.fPressedNow = window.performance.now();
        this.fTriggered = true;
        this.fPresses = 0;
        this.fPenalty = -750;

        this.pulsePhase = 0;
        this.rotationAngle = 0;
        this.energyParticles = [];
        this.maxParticles = 6;

        // Initialize energy particles
        for (let i = 0; i < this.maxParticles; i++) {
            this.energyParticles.push({
                angle: (Math.PI * 2 / this.maxParticles) * i,
                distance: 0,
                speed: 0.05 + Math.random() * 0.03
            });
        }

        this.projectileCollision = false;
        this.enemyCollision = false;
    }
    reset(game){
        this.speed = 4.8 * window.innerWidth/2560 * 120/60;
        
        this.x = game.width/2;
        this.y = game.height/2;
        this.desiredX = this.x;
        this.desiredY = this.y;

        this.qCoolDownElapsed = 0;
        this.qPressed = false;
        this.qTriggered = true;
        this.qPresses = 0;
        this.qPressed_Recast = false;
        this.qTriggered_Recast = true;
        this.qPresses_Recast = 0;

        this.qRecastNow = window.performance.now();

        this.ePressed = false;
        this.eCoolDownElapsed = 0;
        this.eTriggered = true;
        this.ePresses = 0;

        this.fCoolDownElapsed = 0;
        this.fPressed = false;
        this.fTriggered = true;
        this.fPresses = 0;
    }
    update(input, game){
        if(window.innerWidth != this.prevWindowWidth || window.innerHeight != this.prevWindowHeight){
            this.x = this.x * window.innerWidth/this.prevWindowWidth;
            this.y = this.y * window.innerHeight/this.prevWindowHeight;
            this.size = this.size * window.innerWidth/this.prevWindowWidth;
            this.speed = this.speed * window.innerWidth/this.prevWindowWidth;
            //this.speed = 7 * window.innerWidth/2560;
            //this.size = 32 * window.innerWidth/2560;

            this.prevWindowWidth = window.innerWidth;
            this.prevWindowHeight = window.innerHeight;
        }
        const controlScheme = game.pauseMenu ? game.pauseMenu.controlScheme : 'mouse';
        let shootKey, dashKey, ultKey;

        if (controlScheme === 'mouse') {
            // Mouse mode: Q shoots, E dashes, F ults
            shootKey = game.pauseMenu ? game.pauseMenu.customKeys.q : 'q';
            dashKey = game.pauseMenu ? game.pauseMenu.customKeys.e : 'e';
            ultKey = game.pauseMenu ? game.pauseMenu.customKeys.f : 'f';
        } else {
            // WASD mode: different bindings
            shootKey = game.pauseMenu ? game.pauseMenu.wasdKeys.shoot : 2;
            dashKey = game.pauseMenu ? game.pauseMenu.wasdKeys.dash : 'e';
            ultKey = game.pauseMenu ? game.pauseMenu.wasdKeys.ult : 'q';
        }
        if(input.buttons.indexOf(shootKey) == -1){
            input.q_key = 0;
        }
        
        if(input.buttons.indexOf(shootKey) > -1){
            if(game.challenge_level == 0){
                // Normal mode - regular bullets
                if(this.qPressed == false && this.qTriggered == true && input.q_key <= 30){
                    input.q_key += 30;
                    this.qPresses += 1;
                    this.qPressed = true;
                    this.qPressedNow = window.performance.now();
                    this.qTriggered = false;
                    if (window.gameSound) window.gameSound.playShoot();
                }
            } else {
                // Vel'koz mode - void bolts
                if(this.qPressed == false && this.qTriggered == true && input.q_key <= 30){
                    input.q_key += 30;
                    this.qPresses += 1;
                    this.qPressed = true;
                    this.qPressedNow = window.performance.now();
                    this.qTriggered = false;
                    
                    // Shoot void bolt
                    game.voidBolts.shoot(this, input.mouseX, input.mouseY);
                }
                else if(this.qPressed == true && input.q_key <= 30){
                    // Recast to split
                    if(game.voidBolts.recast()){
                        input.q_key += 30;
                        this.qPresses_Recast += 1;
                    }
                }
            }
        }
        
        // Mouse mode: move towards clicked position
        if (controlScheme === 'mouse') {
            if((this.desiredX != this.x || this.desiredY != this.y) && (game.challenge_level === 1 && performance.now() - this.qPressedNow > 70 || performance.now() - this.qPressedNow > 130)){
                var values = move.make(this.x, this.y, this.speed, this.desiredX, this.desiredY);
                this.x = values[0];
                this.y = values[1];
            }
        }

        // WASD mode: direct movement
        if (controlScheme === 'wasd') {
            // Check if dashing (E or F pressed)
            const isDashing = this.ePressed || this.fPressed;
            
            if (isDashing && (this.desiredX != this.x || this.desiredY != this.y)) {
                // When dashing, move towards mouse position
                var values = move.make(this.x, this.y, this.speed, this.desiredX, this.desiredY);
                this.x = values[0];
                this.y = values[1];
            } else {
                // Normal WASD movement
                const moveSpeed = this.speed;
                let dx = 0;
                let dy = 0;
                
                if (input.buttons.indexOf('w') > -1) dy -= moveSpeed;
                if (input.buttons.indexOf('s') > -1) dy += moveSpeed;
                if (input.buttons.indexOf('a') > -1) dx -= moveSpeed;
                if (input.buttons.indexOf('d') > -1) dx += moveSpeed;
                
                // Normalize diagonal movement
                if (dx !== 0 && dy !== 0) {
                    const magnitude = Math.sqrt(dx * dx + dy * dy);
                    dx = (dx / magnitude) * moveSpeed;
                    dy = (dy / magnitude) * moveSpeed;
                }
                
                this.x += dx;
                this.y += dy;
                
                // Update desired position to current position when not dashing
                this.desiredX = this.x;
                this.desiredY = this.y;
            }
            
            // Keep player in bounds
            const rX = window.innerWidth / 2560;
            if (this.x < this.size * rX) this.x = this.size * rX;
            if (this.x > window.innerWidth - this.size * rX) this.x = window.innerWidth - this.size * rX;
            if (this.y < this.size * rX) this.y = this.size * rX;
            if (this.y > window.innerHeight - this.size * rX) this.y = window.innerHeight - this.size * rX;
        }

        if(controlScheme === 'mouse' && input.buttons.indexOf('g') > -1){
            this.desiredX = this.x;
            this.desiredY = this.y;
        }

        if(controlScheme === 'mouse' && input.buttons.indexOf(2) > -1){
            this.desiredX = input.mouseX + this.size/2 - 10;
            this.desiredY = input.mouseY + this.size/2 - 10;
        }

        if(this.ePressed == true){
            let msNow = window.performance.now();
            this.eCoolDownElapsed = msNow - this.ePressedNow;
            if(this.eCoolDownElapsed > this.eCoolDown){
                this.ePressed = false;
            }
            if(this.eCoolDownElapsed > 80 && this.eTriggered == false){
                this.speed = 4.8 * window.innerWidth/2560 * 120/60;
                this.eTriggered = true;
            }
        }
        if(input.buttons.indexOf(dashKey) > -1 && this.ePressed == false && this.fTriggered == true){
            this.ePressed = true;
            this.ePressedNow = window.performance.now();
            this.eTriggered = false;
            this.speed = this.speed * (20 * innerWidth/2560);
            this.ePresses += 1;
            game.score = game.score + this.ePenalty;
            
            // In WASD mode, dash towards mouse
            if (controlScheme === 'wasd') {
                this.desiredX = input.mouseX;
                this.desiredY = input.mouseY;
            }
            
            if (window.gameSound) window.gameSound.playDash();
        }
        if(this.fPressed == true){
            let msNow = window.performance.now();
            this.fCoolDownElapsed = msNow - this.fPressedNow;
            if(this.fCoolDownElapsed > this.fCoolDown){
                this.fPressed = false;
            }
            if(this.fCoolDownElapsed > 80 && this.fTriggered == false){
                this.speed = 4.8 * window.innerWidth/2560 * 120/60;
                this.fTriggered = true;
            }
        }
        if((input.buttons.indexOf(ultKey) > -1) && this.fPressed == false && this.eTriggered == true){
            this.fPressed = true;
            this.fPressedNow = window.performance.now();
            this.fTriggered = false;
            this.speed = this.speed * (20 * innerWidth/2560);
            this.fPresses += 1;
            game.score = game.score + this.fPenalty;
            
            // In WASD mode, dash towards mouse
            if (controlScheme === 'wasd') {
                this.desiredX = input.mouseX;
                this.desiredY = input.mouseY;
            }
            
            if (window.gameSound) window.gameSound.playDash();
        }
        this.prevWindowWidth = window.innerWidth;
        this.prevWindowHeight = window.innerHeight;
    }
    draw(context){
        const rX = window.innerWidth / 2560;
        
        // Update animations
        this.pulsePhase += 0.08;
        this.rotationAngle += 0.03;
        const pulse = 0.9 + Math.sin(this.pulsePhase) * 0.1;
        
        context.save();
        
        // Outer glow aura
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.5);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 1.5 * pulse, 0, Math.PI * 2);
        context.fill();
        
        // Energy particles orbiting
        for (let i = 0; i < this.energyParticles.length; i++) {
            const particle = this.energyParticles[i];
            particle.distance = this.size * 0.8;
            particle.angle += particle.speed;
            
            const px = this.x + Math.cos(particle.angle + this.rotationAngle) * particle.distance;
            const py = this.y + Math.sin(particle.angle + this.rotationAngle) * particle.distance;
            
            context.shadowColor = '#00ffff';
            context.shadowBlur = 15 * rX;
            context.fillStyle = '#00ffff';
            context.beginPath();
            context.arc(px, py, this.size * 0.15, 0, Math.PI * 2);
            context.fill();
        }
        
        // Rotating energy rings
        context.shadowColor = '#00ddff';
        context.shadowBlur = 20 * rX;
        context.strokeStyle = '#00ddff';
        context.lineWidth = 3 * rX;
        
        for (let i = 0; i < 2; i++) {
            const ringSize = this.size * (0.7 + i * 0.3) * pulse;
            const offset = i * Math.PI / 2;
            context.beginPath();
            context.arc(this.x, this.y, ringSize, this.rotationAngle + offset, this.rotationAngle + offset + Math.PI * 1.5);
            context.stroke();
        }
        
        // Main body - gradient fill
        const bodyGradient = context.createRadialGradient(
            this.x - this.size * 0.3, this.y - this.size * 0.3, 0,
            this.x, this.y, this.size
        );
        bodyGradient.addColorStop(0, '#ffffff');
        bodyGradient.addColorStop(0.3, '#00ffff');
        bodyGradient.addColorStop(1, colorsList[this.playerID]);
        
        context.shadowColor = '#00ffff';
        context.shadowBlur = 25 * rX * pulse;
        context.fillStyle = bodyGradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        context.fill();
        
        // Inner core
        context.shadowBlur = 15 * rX;
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.4 * pulse, 0, Math.PI * 2);
        context.fill();
        
        // Core pulse
        context.globalAlpha = 0.5 + Math.sin(this.pulsePhase * 2) * 0.3;
        context.fillStyle = '#00ffff';
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.2 * pulse, 0, Math.PI * 2);
        context.fill();
        
        context.restore();
    }
}