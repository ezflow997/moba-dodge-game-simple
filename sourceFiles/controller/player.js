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
        this.qRecastReady = false;
        this.qButtonHeld = false; // Track if button held from previous shot (for test room)

        this.eCoolDown = 6100;
        this.ePressed = false;
        this.eCoolDownElapsed = 0;
        this.ePressedNow = window.performance.now();
        this.eTriggered = true;
        this.ePresses = 0;
        this.ePenalty = -250;
        this.eButtonHeld = false; // Track if button held from previous dash (for test room)

        this.fCoolDown = 24000;
        this.fCoolDownElapsed = 0;
        this.fPressed = false;
        this.fPressedNow = window.performance.now();
        this.fTriggered = true;
        this.fPresses = 0;
        this.fPenalty = -750;
        this.fButtonHeld = false; // Track if button held from previous ult (for test room)

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
        // Reset baseSpeed to default, then set speed to match
        this.baseSpeed = 4.1 * window.innerWidth/2560 * 120/60;
        this.speed = this.baseSpeed;
        
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
        this.qRecastReady = false;

        this.qRecastNow = window.performance.now();
        this.qButtonHeld = false;

        this.ePressed = false;
        this.eCoolDownElapsed = 0;
        this.eTriggered = true;
        this.ePresses = 0;
        this.eButtonHeld = false;

        this.fCoolDownElapsed = 0;
        this.fPressed = false;
        this.fTriggered = true;
        this.fPresses = 0;
        this.fButtonHeld = false;
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
            this.qButtonHeld = false; // Track button release for test room
        }

        // Check if we have a rapid fire gun equipped
        const rewardManager = game.rewardManager;
        const activeGun = rewardManager ? rewardManager.activeGun : null;
        const isRapidFire = activeGun && activeGun.gunType === 'rapidfire';

        if(input.buttons.indexOf(shootKey) > -1){
            // Use regular bullets if in normal mode OR if a gun is equipped in challenging mode
            const useRegularBullets = game.challenge_level == 0 || activeGun != null;

            // Check if in test room for no cooldowns
            const inTestRoom = game.testRoom && game.testRoom.active;

            if(useRegularBullets){
                // Normal mode or equipped gun - regular bullets
                // For rapid fire guns, allow continuous shooting when held (skip q_key check)
                // In test room, require button release between shots (prevent rapid fire when held)
                const canShoot = this.qPressed == false && this.qTriggered == true && (!inTestRoom || !this.qButtonHeld) && (isRapidFire || inTestRoom || input.q_key <= 30);
                if(canShoot){
                    if (!isRapidFire && !inTestRoom) input.q_key += 30;
                    if (inTestRoom) this.qButtonHeld = true; // Mark button as held for test room
                    this.qPresses += 1;
                    this.qPressed = true;
                    this.qPressedNow = window.performance.now();
                    this.qTriggered = false;
                    if (window.gameSound) window.gameSound.playShoot();
                }
            } else {
                // Vel'koz mode without gun - void bolts
                // Use q_key <= 30 check to prevent double-firing when cooldown resets while button held
                // In test room, require button release between shots (prevent rapid fire when held)
                if(this.qPressed == false && this.qTriggered == true && (!inTestRoom || !this.qButtonHeld) && (inTestRoom || input.q_key <= 30)){
                    if (!inTestRoom) input.q_key += 30; // Prevent immediate re-fire (skip in test room)
                    if (inTestRoom) this.qButtonHeld = true; // Mark button as held for test room
                    this.qPresses += 1;
                    this.qPressed = true;
                    this.qPressedNow = window.performance.now();
                    this.qTriggered = false;
                    this.qRecastReady = false; // Must release button before recast

                    // Shoot void bolt
                    game.voidBolts.shoot(this, input.mouseX, input.mouseY);
                }
                else if(this.qPressed == true && this.qPressed_Recast == false && this.qRecastReady == true){
                    // Recast to split (must have released and re-pressed button)
                    if(game.voidBolts.recast()){
                        this.qPresses_Recast += 1;
                        this.qPressed_Recast = true;
                    }
                }
            }
        }
        // Track button release for void bolt recast
        if(input.buttons.indexOf(shootKey) == -1 && this.qPressed == true && this.qRecastReady == false){
            this.qRecastReady = true;
        }
        
        // Mouse mode: move towards clicked position
        if (controlScheme === 'mouse') {
            if(this.desiredX != this.x || this.desiredY != this.y){
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

            // Sync desired position to actual position when hitting bounds (fixes stuck after dash)
            if (isDashing) {
                this.desiredX = this.x;
                this.desiredY = this.y;
            }
        }

        if(controlScheme === 'mouse' && input.buttons.indexOf('g') > -1){
            this.desiredX = this.x;
            this.desiredY = this.y;
        }

        if(controlScheme === 'mouse' && input.buttons.indexOf(2) > -1){
            this.desiredX = input.mouseX + this.size/2 - 10;
            this.desiredY = input.mouseY + this.size/2 - 10;
        }

        // Check if in test room for no cooldowns
        const inTestRoomDash = game.testRoom && game.testRoom.active;

        // Track button release for test room (prevent rapid fire when held)
        if (input.buttons.indexOf(dashKey) == -1) {
            this.eButtonHeld = false;
        }
        if (input.buttons.indexOf(ultKey) == -1) {
            this.fButtonHeld = false;
        }

        if(this.ePressed == true){
            let msNow = window.performance.now();
            // Apply time scale from dev mode if available
            const timescale = game.devMode ? game.devMode.timescale : 1.0;
            // In test room, instantly complete cooldown
            this.eCoolDownElapsed = inTestRoomDash ? this.eCoolDown + 1 : (msNow - this.ePressedNow) * timescale;
            if(this.eCoolDownElapsed > this.eCoolDown){
                this.ePressed = false;
            }
            if(this.eCoolDownElapsed > 80 && this.eTriggered == false){
                this.speed = this.baseSpeed;  // Reset to baseSpeed (respects speed modifiers)
                this.eTriggered = true;
            }
        }
        // In test room, require button release before next dash
        const canDash = this.ePressed == false && this.fTriggered == true && (!inTestRoomDash || !this.eButtonHeld);
        if(input.buttons.indexOf(dashKey) > -1 && canDash){
            this.ePressed = true;
            this.ePressedNow = window.performance.now();
            this.eTriggered = false;
            this.eButtonHeld = true; // Mark button as held for test room
            // Apply dash distance modifier from rewards
            const dashMod = game.rewardManager ? game.rewardManager.dashDistanceMod : 1.0;
            this.speed = this.speed * (30 * dashMod * innerWidth/2560);
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
            // Apply time scale from dev mode if available
            const timescale = game.devMode ? game.devMode.timescale : 1.0;
            // In test room, instantly complete cooldown
            this.fCoolDownElapsed = inTestRoomDash ? this.fCoolDown + 1 : (msNow - this.fPressedNow) * timescale;
            if(this.fCoolDownElapsed > this.fCoolDown){
                this.fPressed = false;
            }
            if(this.fCoolDownElapsed > 80 && this.fTriggered == false){
                this.speed = this.baseSpeed;  // Reset to baseSpeed (respects speed modifiers)
                this.fTriggered = true;
            }
        }
        // In test room, require button release before next ult
        const canUlt = this.fPressed == false && this.eTriggered == true && (!inTestRoomDash || !this.fButtonHeld);
        if((input.buttons.indexOf(ultKey) > -1) && canUlt){
            this.fPressed = true;
            this.fPressedNow = window.performance.now();
            this.fTriggered = false;
            this.fButtonHeld = true; // Mark button as held for test room
            // Apply dash distance modifier from rewards
            const dashMod = game.rewardManager ? game.rewardManager.dashDistanceMod : 1.0;
            this.speed = this.speed * (30 * dashMod * innerWidth/2560);
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
    draw(context, game){
        const rX = window.innerWidth / 2560;

        // Update animations
        this.pulsePhase += 0.08;
        this.rotationAngle += 0.03;
        const pulse = 0.9 + Math.sin(this.pulsePhase) * 0.1;

        // Get active weapon for visual effects
        const activeGun = game?.rewardManager?.activeGun;
        const gunType = activeGun?.gunType || null;

        // Weapon color schemes
        const weaponColors = {
            shotgun: { primary: '#ff6600', secondary: '#ff9944', glow: '#ff4400' },
            rapidfire: { primary: '#ffee00', secondary: '#ffff66', glow: '#ffaa00' },
            piercing: { primary: '#00ffff', secondary: '#88ffff', glow: '#00aaff' },
            ricochet: { primary: '#44ff44', secondary: '#88ff88', glow: '#00ff00' },
            homing: { primary: '#ff44ff', secondary: '#ff88ff', glow: '#aa00ff' },
            twin: { primary: '#4488ff', secondary: '#88aaff', glow: '#0066ff' },
            nova: { primary: '#ff00ff', secondary: '#ff66ff', glow: '#ff00aa' },
            chain: { primary: '#00aaff', secondary: '#66ccff', glow: '#0088ff' }
        };

        const wc = gunType ? weaponColors[gunType] : null;
        const baseColor = wc ? wc.primary : '#00ffff';
        const glowColor = wc ? wc.glow : '#00ffff';
        const secondaryColor = wc ? wc.secondary : '#00ddff';

        context.save();

        // Draw weapon-specific effects BEFORE player
        if (gunType) {
            this.drawWeaponEffect(context, gunType, wc, rX, pulse);
        }

        // Outer glow aura (weapon colored)
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.5);
        gradient.addColorStop(0, this.hexToRgba(baseColor, 0.3));
        gradient.addColorStop(0.5, this.hexToRgba(baseColor, 0.1));
        gradient.addColorStop(1, this.hexToRgba(baseColor, 0));
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 1.5 * pulse, 0, Math.PI * 2);
        context.fill();

        // Energy particles orbiting (weapon colored)
        for (let i = 0; i < this.energyParticles.length; i++) {
            const particle = this.energyParticles[i];
            particle.distance = this.size * 0.8;
            particle.angle += particle.speed;

            const px = this.x + Math.cos(particle.angle + this.rotationAngle) * particle.distance;
            const py = this.y + Math.sin(particle.angle + this.rotationAngle) * particle.distance;

            context.shadowColor = glowColor;
            context.shadowBlur = 15 * rX;
            context.fillStyle = baseColor;
            context.beginPath();
            context.arc(px, py, this.size * 0.15, 0, Math.PI * 2);
            context.fill();
        }

        // Rotating energy rings (weapon colored)
        context.shadowColor = secondaryColor;
        context.shadowBlur = 20 * rX;
        context.strokeStyle = secondaryColor;
        context.lineWidth = 3 * rX;

        for (let i = 0; i < 2; i++) {
            const ringSize = this.size * (0.7 + i * 0.3) * pulse;
            const offset = i * Math.PI / 2;
            context.beginPath();
            context.arc(this.x, this.y, ringSize, this.rotationAngle + offset, this.rotationAngle + offset + Math.PI * 1.5);
            context.stroke();
        }

        // Main body - gradient fill (weapon colored)
        const bodyGradient = context.createRadialGradient(
            this.x - this.size * 0.3, this.y - this.size * 0.3, 0,
            this.x, this.y, this.size
        );
        bodyGradient.addColorStop(0, '#ffffff');
        bodyGradient.addColorStop(0.3, baseColor);
        bodyGradient.addColorStop(1, wc ? wc.glow : colorsList[this.playerID]);

        context.shadowColor = glowColor;
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

        // Core pulse (weapon colored)
        context.globalAlpha = 0.5 + Math.sin(this.pulsePhase * 2) * 0.3;
        context.fillStyle = baseColor;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.2 * pulse, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    // Helper to convert hex to rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Draw weapon-specific visual effects around player
    drawWeaponEffect(context, gunType, colors, rX, pulse) {
        const time = performance.now() / 1000;

        switch (gunType) {
            case 'shotgun':
                // Spread particles emanating outward
                for (let i = 0; i < 5; i++) {
                    const angle = (i - 2) * 0.3 + Math.sin(time * 2) * 0.1;
                    const dist = this.size * (1.2 + Math.sin(time * 4 + i) * 0.3);
                    const px = this.x + Math.cos(angle - Math.PI / 2) * dist;
                    const py = this.y + Math.sin(angle - Math.PI / 2) * dist;
                    context.fillStyle = colors.primary;
                    context.shadowColor = colors.glow;
                    context.shadowBlur = 10 * rX;
                    context.globalAlpha = 0.6;
                    context.beginPath();
                    context.arc(px, py, this.size * 0.12, 0, Math.PI * 2);
                    context.fill();
                }
                context.globalAlpha = 1;
                break;

            case 'rapidfire':
                // Speed lines trailing behind
                context.strokeStyle = colors.primary;
                context.lineWidth = 2 * rX;
                context.shadowColor = colors.glow;
                context.shadowBlur = 8 * rX;
                for (let i = 0; i < 4; i++) {
                    const offset = (i - 1.5) * this.size * 0.4;
                    const length = this.size * (0.8 + Math.sin(time * 10 + i) * 0.3);
                    context.globalAlpha = 0.5 + Math.sin(time * 8 + i) * 0.3;
                    context.beginPath();
                    context.moveTo(this.x + offset, this.y + this.size * 0.5);
                    context.lineTo(this.x + offset, this.y + this.size * 0.5 + length);
                    context.stroke();
                }
                context.globalAlpha = 1;
                break;

            case 'piercing':
                // Sharp pointed aura
                context.strokeStyle = colors.primary;
                context.lineWidth = 3 * rX;
                context.shadowColor = colors.glow;
                context.shadowBlur = 15 * rX;
                context.globalAlpha = 0.7;
                // Draw arrow pointing in movement direction
                const arrowDist = this.size * 1.5;
                context.beginPath();
                context.moveTo(this.x, this.y - arrowDist);
                context.lineTo(this.x - this.size * 0.4, this.y - this.size);
                context.moveTo(this.x, this.y - arrowDist);
                context.lineTo(this.x + this.size * 0.4, this.y - this.size);
                context.stroke();
                context.globalAlpha = 1;
                break;

            case 'ricochet':
                // Bouncing particle trails
                context.fillStyle = colors.primary;
                context.shadowColor = colors.glow;
                context.shadowBlur = 10 * rX;
                for (let i = 0; i < 3; i++) {
                    const bounceTime = (time * 3 + i * 0.7) % 2;
                    const bounceX = this.x + Math.sin(bounceTime * Math.PI) * this.size * 1.2 * (i % 2 ? 1 : -1);
                    const bounceY = this.y + Math.abs(Math.sin(bounceTime * Math.PI * 2)) * this.size * 0.8;
                    context.globalAlpha = 0.6 - bounceTime * 0.2;
                    context.beginPath();
                    context.arc(bounceX, bounceY, this.size * 0.15, 0, Math.PI * 2);
                    context.fill();
                }
                context.globalAlpha = 1;
                break;

            case 'homing':
                // Targeting reticle overlay
                context.strokeStyle = colors.primary;
                context.lineWidth = 2 * rX;
                context.shadowColor = colors.glow;
                context.shadowBlur = 12 * rX;
                context.globalAlpha = 0.6 + Math.sin(time * 5) * 0.2;
                const reticleSize = this.size * 1.8 * pulse;
                // Outer rotating segments
                for (let i = 0; i < 4; i++) {
                    const angle = this.rotationAngle * 2 + i * Math.PI / 2;
                    context.beginPath();
                    context.arc(this.x, this.y, reticleSize, angle, angle + Math.PI / 4);
                    context.stroke();
                }
                context.globalAlpha = 1;
                break;

            case 'twin':
                // Dual orbs orbiting
                context.fillStyle = colors.primary;
                context.shadowColor = colors.glow;
                context.shadowBlur = 15 * rX;
                for (let i = 0; i < 2; i++) {
                    const angle = this.rotationAngle * 1.5 + i * Math.PI;
                    const dist = this.size * 1.3;
                    const ox = this.x + Math.cos(angle) * dist;
                    const oy = this.y + Math.sin(angle) * dist;
                    context.globalAlpha = 0.7;
                    context.beginPath();
                    context.arc(ox, oy, this.size * 0.25, 0, Math.PI * 2);
                    context.fill();
                }
                context.globalAlpha = 1;
                break;

            case 'nova':
                // Pulsing radial waves
                context.strokeStyle = colors.primary;
                context.lineWidth = 2 * rX;
                context.shadowColor = colors.glow;
                context.shadowBlur = 15 * rX;
                for (let i = 0; i < 3; i++) {
                    const wavePhase = (time * 2 + i * 0.5) % 1.5;
                    const waveSize = this.size * (1 + wavePhase * 1.5);
                    context.globalAlpha = 0.6 * (1 - wavePhase / 1.5);
                    context.beginPath();
                    context.arc(this.x, this.y, waveSize, 0, Math.PI * 2);
                    context.stroke();
                }
                context.globalAlpha = 1;
                break;

            case 'chain':
                // Electric arcs
                context.strokeStyle = colors.primary;
                context.lineWidth = 2 * rX;
                context.shadowColor = colors.glow;
                context.shadowBlur = 20 * rX;
                context.lineCap = 'round';
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2 + time * 3;
                    const endDist = this.size * (1.3 + Math.random() * 0.3);
                    const endX = this.x + Math.cos(angle) * endDist;
                    const endY = this.y + Math.sin(angle) * endDist;
                    const midX = this.x + Math.cos(angle) * this.size * 0.7 + (Math.random() - 0.5) * this.size * 0.4;
                    const midY = this.y + Math.sin(angle) * this.size * 0.7 + (Math.random() - 0.5) * this.size * 0.4;
                    context.globalAlpha = 0.5 + Math.random() * 0.3;
                    context.beginPath();
                    context.moveTo(this.x + Math.cos(angle) * this.size * 0.5, this.y + Math.sin(angle) * this.size * 0.5);
                    context.lineTo(midX, midY);
                    context.lineTo(endX, endY);
                    context.stroke();
                }
                context.globalAlpha = 1;
                break;
        }
    }
}