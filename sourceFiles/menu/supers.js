export class superFunctions {
    constructor(){
        this.data = [];
    }

    // Enhanced text with glow effect
    drawGlowText(context, x, y, text, size, color, glowColor, glowSize = 10, centered = false) {
        let rX = window.innerWidth / 2560;
        let rY = window.innerHeight / 1440;

        context.save();
        context.shadowColor = glowColor;
        context.shadowBlur = glowSize * rX;
        // Use a cleaner, more modern font
        context.font = `bold ${size * rX}px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
        context.fillStyle = color;
        if (centered) {
            context.textAlign = 'center';
            context.fillText("" + text, x * rX, y * rY);
        } else {
            context.fillText("" + text, x * rX, y * rY);
        }
        context.restore();
    }

    // Gradient-filled rectangle
    drawGradientRect(context, x, y, w, h, colorStart, colorEnd, vertical = true) {
        let rX = window.innerWidth / 2560;
        let rY = window.innerHeight / 1440;

        let gradient;
        if (vertical) {
            gradient = context.createLinearGradient(x * rX, y * rY, x * rX, (y + h) * rY);
        } else {
            gradient = context.createLinearGradient(x * rX, y * rY, (x + w) * rX, y * rY);
        }
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);

        context.fillStyle = gradient;
        context.fillRect(x * rX, y * rY, w * rX, h * rY);
    }

    // Radial gradient (for glowing effects)
    drawRadialGlow(context, x, y, innerRadius, outerRadius, innerColor, outerColor) {
        let rX = window.innerWidth / 2560;
        let rY = window.innerHeight / 1440;

        let gradient = context.createRadialGradient(
            x * rX, y * rY, innerRadius * rX,
            x * rX, y * rY, outerRadius * rX
        );
        gradient.addColorStop(0, innerColor);
        gradient.addColorStop(1, outerColor);

        context.beginPath();
        context.fillStyle = gradient;
        context.arc(x * rX, y * rY, outerRadius * rX, 0, Math.PI * 2);
        context.fill();
    }

    drawText(context, x, y, text, size, color){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        context.beginPath();
        context.font = size*rX + "px Arial Black";
        context.fillStyle = color;
        context.fillText(""+text, x*rX, y*rY);
        context.closePath();
    }
    drawTypingWindow(context, game, menu){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        context.beginPath();
        context.fillStyle = 'black';
        context.fillRect(300*rX, 300*rY, 1200*rX, 350*rY);
        context.closePath();

        context.beginPath();
        context.strokeStyle = 'red';
        context.lineWidth = 10*rX;
        context.strokeRect(300*rX, 300*rY, 1200*rX, 350*rY);
        context.closePath();
        
        if(menu.typingPassword == false){
            let chars = game.input.information;
            let charsToText = '';
            for(let i = 0; i < chars.length; i++){
                charsToText = '' + charsToText + '' + chars[i];
            }
            menu.super.drawText(context, 360, 460, ''+charsToText, 50, 'white');
        }
        else{
            let chars = game.input.information;
            let charsToText = '';
            for(let i = 0; i < chars.length; i++){
                if(i != chars.length - 1){
                    charsToText = '' + charsToText + '*';
                }
                else{
                    charsToText = '' + charsToText + '' + chars[i];
                }
            }
            menu.super.drawText(context, 360, 460, ''+charsToText, 50, 'white'); 
        }
    }
    drawMessageWindow(context, menu, msPassed = 0){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Animated time for effects
        const time = performance.now() / 1000;

        // Delay before retry button appears (1.5 seconds for player reaction time)
        const retryButtonDelay = 1500;
        const showRetryButton = msPassed > retryButtonDelay;

        context.save();

        // Draw semi-transparent overlay with vignette effect
        const vignetteGradient = context.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(window.innerWidth, window.innerHeight) * 0.7
        );
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        vignetteGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.75)');
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        context.fillStyle = vignetteGradient;
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Panel dimensions
        const panelW = 900 * rX;
        const panelH = 500 * rY;
        const panelX = centerX - panelW / 2;
        const panelY = centerY - panelH / 2;
        const cornerRadius = 20 * rX;

        // Draw panel background with gradient
        const bgGradient = context.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
        bgGradient.addColorStop(0, 'rgba(15, 25, 45, 0.98)');
        bgGradient.addColorStop(0.5, 'rgba(10, 20, 40, 0.98)');
        bgGradient.addColorStop(1, 'rgba(5, 15, 35, 0.98)');

        this.drawRoundedRectPath(context, panelX, panelY, panelW, panelH, cornerRadius);
        context.fillStyle = bgGradient;
        context.fill();

        // Animated glowing border
        const glowPulse = 0.7 + Math.sin(time * 2) * 0.3;
        context.shadowColor = '#ff4444';
        context.shadowBlur = 25 * rX * glowPulse;
        context.strokeStyle = `rgba(255, 68, 68, ${0.8 + glowPulse * 0.2})`;
        context.lineWidth = 3 * rX;
        context.stroke();

        // Inner border
        context.shadowBlur = 0;
        context.strokeStyle = 'rgba(255, 100, 100, 0.3)';
        context.lineWidth = 1 * rX;
        this.drawRoundedRectPath(context, panelX + 8 * rX, panelY + 8 * rY, panelW - 16 * rX, panelH - 16 * rY, cornerRadius - 5 * rX);
        context.stroke();

        // Draw skull icon at top
        this.drawGameOverSkull(context, centerX, panelY + 85 * rY, 50 * rX, time);

        // "GAME OVER" title with animated glow
        context.font = `bold ${56 * rX}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = '#ff0000';
        context.shadowBlur = 20 * rX * glowPulse;
        context.fillStyle = '#ff4444';
        context.fillText('GAME OVER', centerX, panelY + 160 * rY);

        // Divider line
        context.shadowBlur = 0;
        const dividerGradient = context.createLinearGradient(panelX + 50 * rX, 0, panelX + panelW - 50 * rX, 0);
        dividerGradient.addColorStop(0, 'rgba(255, 68, 68, 0)');
        dividerGradient.addColorStop(0.5, 'rgba(255, 68, 68, 0.6)');
        dividerGradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
        context.strokeStyle = dividerGradient;
        context.lineWidth = 2 * rX;
        context.beginPath();
        context.moveTo(panelX + 50 * rX, panelY + 195 * rY);
        context.lineTo(panelX + panelW - 50 * rX, panelY + 195 * rY);
        context.stroke();

        // Main message (score info)
        let messageY = panelY + 260 * rY;

        if(menu.showMessage != ''){
            // Check if it's a high score message
            const isHighScore = menu.showMessage.toLowerCase().includes('high score');

            context.font = `bold ${38 * rX}px Arial`;
            context.textAlign = 'center';

            if (isHighScore) {
                // High score celebration
                context.shadowColor = '#ffdd00';
                context.shadowBlur = 15 * rX;
                context.fillStyle = '#ffdd00';

                // Measure text width to position stars outside of it
                const textWidth = context.measureText(menu.showMessage).width;
                const starOffset = (textWidth / 2) + 30 * rX;

                // Draw star decorations outside the text
                this.drawStar(context, centerX - starOffset, messageY, 15 * rX, time);
                this.drawStar(context, centerX + starOffset, messageY, 15 * rX, time + 1);
            } else {
                context.shadowColor = '#00ffff';
                context.shadowBlur = 10 * rX;
                context.fillStyle = '#ffffff';
            }

            context.fillText(menu.showMessage, centerX, messageY);
            messageY += 55 * rY;
        }

        // Additional message rows
        context.shadowBlur = 8 * rX;
        context.font = `${32 * rX}px Arial`;

        if(menu.showMessageRow2 != '' && menu.showMessageRow2 != undefined){
            context.shadowColor = '#00ff88';
            context.fillStyle = '#00ff88';
            context.fillText(menu.showMessageRow2, centerX, messageY);
            messageY += 48 * rY;
        }

        if(menu.showMessageRow3 != '' && menu.showMessageRow3 != undefined){
            context.shadowColor = '#00ffff';
            context.fillStyle = '#88ffff';
            context.fillText(menu.showMessageRow3, centerX, messageY);
        }

        // Draw retry button after delay
        if (showRetryButton) {
            // Retry button dimensions
            const btnW = 280 * rX;
            const btnH = 60 * rY;
            const btnX = centerX - btnW / 2;
            const btnY = panelY + panelH - 100 * rY;
            const btnRadius = 10 * rX;

            // Fade in animation
            const fadeInProgress = Math.min(1, (msPassed - retryButtonDelay) / 300);

            // Store button bounds for click detection
            menu.retryButtonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

            // Check hover state (game object has input, menu object doesn't directly)
            const mouseX = menu.input ? menu.input.inX : 0;
            const mouseY = menu.input ? menu.input.inY : 0;
            const isHovered = mouseX > btnX && mouseX < btnX + btnW &&
                             mouseY > btnY && mouseY < btnY + btnH;

            // Button glow and animation
            const hoverPulse = isHovered ? (0.8 + Math.sin(time * 4) * 0.2) : 0.6;

            context.save();
            context.globalAlpha = fadeInProgress;

            // Button shadow/glow
            if (isHovered) {
                context.shadowColor = '#00ff88';
                context.shadowBlur = 20 * rX;
            }

            // Button background gradient
            const btnGradient = context.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
            if (isHovered) {
                btnGradient.addColorStop(0, 'rgba(0, 120, 80, 0.95)');
                btnGradient.addColorStop(0.5, 'rgba(0, 100, 60, 0.95)');
                btnGradient.addColorStop(1, 'rgba(0, 80, 50, 0.95)');
            } else {
                btnGradient.addColorStop(0, 'rgba(0, 80, 50, 0.9)');
                btnGradient.addColorStop(0.5, 'rgba(0, 60, 40, 0.9)');
                btnGradient.addColorStop(1, 'rgba(0, 50, 30, 0.9)');
            }

            // Draw button background
            this.drawRoundedRectPath(context, btnX, btnY, btnW, btnH, btnRadius);
            context.fillStyle = btnGradient;
            context.fill();

            // Button border
            context.strokeStyle = isHovered ? 'rgba(0, 255, 136, 0.9)' : 'rgba(0, 200, 100, 0.7)';
            context.lineWidth = (isHovered ? 3 : 2) * rX;
            context.stroke();

            // Button text
            context.shadowColor = '#00ff88';
            context.shadowBlur = isHovered ? 15 * rX : 8 * rX;
            context.font = `bold ${32 * rX}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillStyle = isHovered ? '#ffffff' : '#00ff88';
            context.fillText('RETRY', centerX, btnY + btnH / 2);

            context.restore();

            // "or click anywhere to continue" prompt below button
            context.shadowBlur = 0;
            const promptAlpha = (0.4 + Math.sin(time * 3) * 0.2) * fadeInProgress;
            context.font = `${18 * rX}px Arial`;
            context.fillStyle = `rgba(120, 120, 120, ${promptAlpha})`;
            context.fillText('or click elsewhere to return to menu', centerX, panelY + panelH - 25 * rY);
        } else {
            // Show loading text while waiting for retry button
            context.shadowBlur = 0;
            const loadingAlpha = 0.4 + Math.sin(time * 5) * 0.2;
            context.font = `${20 * rX}px Arial`;
            context.fillStyle = `rgba(150, 150, 150, ${loadingAlpha})`;
            context.fillText('...', centerX, panelY + panelH - 50 * rY);

            // Clear button bounds while not shown
            menu.retryButtonBounds = null;
        }

        context.restore();
    }

    /**
     * Draw a decorative skull for game over screen
     */
    drawGameOverSkull(context, x, y, size, time) {
        context.save();

        const pulse = 1 + Math.sin(time * 2) * 0.05;
        const s = size * pulse;

        // Glow effect
        context.shadowColor = '#ff4444';
        context.shadowBlur = 15;

        context.fillStyle = '#ff6666';
        context.strokeStyle = '#cc0000';
        context.lineWidth = s * 0.06;

        // Skull head
        context.beginPath();
        context.arc(x, y - s * 0.1, s * 0.8, Math.PI, 0, false);
        context.lineTo(x + s * 0.8, y + s * 0.3);
        context.quadraticCurveTo(x + s * 0.8, y + s * 0.7, x + s * 0.45, y + s * 0.75);
        context.lineTo(x - s * 0.45, y + s * 0.75);
        context.quadraticCurveTo(x - s * 0.8, y + s * 0.7, x - s * 0.8, y + s * 0.3);
        context.closePath();
        context.fill();
        context.stroke();

        // Eye sockets
        context.shadowBlur = 0;
        context.fillStyle = '#330000';
        context.beginPath();
        context.ellipse(x - s * 0.32, y + s * 0.05, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.ellipse(x + s * 0.32, y + s * 0.05, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
        context.fill();

        // Glowing red eyes
        const eyeGlow = 0.5 + Math.sin(time * 4) * 0.5;
        context.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
        context.shadowColor = '#ff0000';
        context.shadowBlur = 10 * eyeGlow;
        context.beginPath();
        context.arc(x - s * 0.32, y + s * 0.05, s * 0.08, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(x + s * 0.32, y + s * 0.05, s * 0.08, 0, Math.PI * 2);
        context.fill();

        // Nose
        context.shadowBlur = 0;
        context.fillStyle = '#330000';
        context.beginPath();
        context.moveTo(x, y + s * 0.2);
        context.lineTo(x - s * 0.12, y + s * 0.4);
        context.lineTo(x + s * 0.12, y + s * 0.4);
        context.closePath();
        context.fill();

        // Teeth
        context.fillStyle = '#ff6666';
        const teethY = y + s * 0.75;
        for (let i = -3; i <= 3; i++) {
            context.fillRect(x + i * s * 0.12 - s * 0.05, teethY, s * 0.09, s * 0.2);
        }

        // Teeth lines
        context.strokeStyle = '#cc0000';
        context.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
            context.beginPath();
            context.moveTo(x + i * s * 0.12, teethY);
            context.lineTo(x + i * s * 0.12, teethY + s * 0.18);
            context.stroke();
        }

        context.restore();
    }

    /**
     * Draw a decorative star
     */
    drawStar(context, x, y, size, time) {
        context.save();

        const rotation = time * 0.5;
        const pulse = 1 + Math.sin(time * 3) * 0.2;

        context.translate(x, y);
        context.rotate(rotation);
        context.scale(pulse, pulse);

        context.fillStyle = '#ffdd00';
        context.shadowColor = '#ffaa00';
        context.shadowBlur = 10;

        context.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const radius = i === 0 ? size : size;
            if (i === 0) {
                context.moveTo(Math.cos(angle) * size, Math.sin(angle) * size);
            } else {
                context.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
            }
            const innerAngle = angle + Math.PI / 5;
            context.lineTo(Math.cos(innerAngle) * size * 0.4, Math.sin(innerAngle) * size * 0.4);
        }
        context.closePath();
        context.fill();

        context.restore();
    }

    /**
     * Helper to draw rounded rectangle path
     */
    drawRoundedRectPath(context, x, y, w, h, r) {
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + w - r, y);
        context.quadraticCurveTo(x + w, y, x + w, y + r);
        context.lineTo(x + w, y + h - r);
        context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        context.lineTo(x + r, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
    }

    getOffset(bullets, x, y, aR, C){
        bullets.offY = y + (Math.sin(aR) * C);
        bullets.offX = x + (Math.cos(aR) * C);

        //console.log(bullets.offX, x);
        //console.log(bullets.offY, y);
    }
    
    getTravel(bullets, x, y, aR, C){
        bullets.endY = y + (Math.sin(aR) * C);
        bullets.endX = x + (Math.cos(aR) * C);

        //console.log(bullets.endX, x);
        //console.log(bullets.endY, y);
    }
    
    getAngle(bullets, sX, sY, eX, eY){
        bullets.dirX = 1;
        if(eX - sX < 0){
            bullets.dirX = -1;
        }
    
        bullets.dirY = 1;
        if(eY - sY < 0){
            bullets.dirY = -1;
        }
    
        // FIX: Use atan2 for proper full-angle calculation
        bullets.angle = Math.atan2(eY - sY, eX - sX);

        //console.log(bullets.angle, sX, sY, eX, eY, bullets.dirX, bullets.dirY, c);
    }
}

export class Button {
    constructor(x, y, w, h, text, textSize, textX, textY, isHovered, has_border, text_color, border_color){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.text = text;
        this.textSize = textSize;
        this.textX = textX;
        this.textY = textY;
        this.isHovered = isHovered;

        this.has_border = has_border;
        if(has_border == undefined){
            this.has_border = true;
        }

        this.text_color = text_color;
        if(text_color == undefined){
            this.text_color = 'white';
        }

        this.border_color = border_color;
        if(border_color == undefined){
            this.border_color = 'white';
        }

        // Animation properties
        this.hoverProgress = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.glowIntensity = 0;
        this.wasHovered = false;
    }
    draw(context){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        drawButtonEnhanced(context, this.x*rX, this.y*rY, this.w*rX, this.h*rY, this.isHovered, this.text, this.textSize*rX, this.textX*rX, this.textY*rY, this.has_border, this.text_color, this.border_color, this.hoverProgress, this.pulsePhase, this.glowIntensity);
    }
    update(inX, inY){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        var hovered = checkHover(inX, inY, this.x*rX, this.y*rY, this.w*rX, this.h*rY);
        if(hovered == true){
            this.isHovered = true;
            // Play hover sound when first entering button
            if (!this.wasHovered && window.gameSound) {
                window.gameSound.playMenuHover();
            }
        }
        else{
            this.isHovered = false;
        }
        this.wasHovered = hovered;

        // Smooth hover transition
        if (this.isHovered) {
            this.hoverProgress = Math.min(1, this.hoverProgress + 0.15);
            this.glowIntensity = Math.min(20, this.glowIntensity + 3);
        } else {
            this.hoverProgress = Math.max(0, this.hoverProgress - 0.25);
            this.glowIntensity = Math.max(0, this.glowIntensity - 4);
        }

        // Update pulse
        this.pulsePhase += 0.06;
    }
}

function checkHover(inX, inY, btnX, btnY, btnW, btnH){
    if(inX > btnX && inX < btnX + btnW){
        if(inY > btnY && inY < btnY + btnH){
            return true;
        }
        else{
            return false;
        }
    }
    else{
        return false;
    }
}

function drawButton(ctx, btnX, btnY, btnW, btnH, hovered, text, textSize, textX, textY, has_border, text_color, border_color){
    if(has_border == true){
        let rY = window.innerHeight/1440;
        ctx.beginPath();
        ctx.strokeStyle = border_color;
        ctx.lineWidth = 5*rY;
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.closePath();
    }

    if(hovered == true){
        ctx.beginPath();
        ctx.fillStyle = 'cyan';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.font = textSize + "px Arial Black";
    ctx.fillStyle = text_color;
    ctx.fillText(""+text, btnX + textX, btnY + textY);
    ctx.closePath();
}

// Enhanced button with gradients, glow, and smooth animations
function drawButtonEnhanced(ctx, btnX, btnY, btnW, btnH, hovered, text, textSize, textX, textY, has_border, text_color, border_color, hoverProgress, pulsePhase, glowIntensity) {
    let rY = window.innerHeight / 1440;
    let rX = window.innerWidth / 2560;
    const radius = 8 * rX; // Rounded corner radius

    ctx.save();

    // Helper to draw rounded rectangle
    function roundedRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // Outer glow when hovered
    if (hoverProgress > 0) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = (15 + hoverProgress * 20) * rX;
    }

    // Background gradient - dark glass effect
    const bgGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    if (hoverProgress > 0) {
        // Hovered: cyan glow fill
        bgGradient.addColorStop(0, `rgba(0, 80, 100, ${0.7 + hoverProgress * 0.2})`);
        bgGradient.addColorStop(0.4, `rgba(0, 60, 80, ${0.85 + hoverProgress * 0.1})`);
        bgGradient.addColorStop(1, `rgba(0, 40, 60, ${0.9})`);
    } else {
        // Normal: dark semi-transparent
        bgGradient.addColorStop(0, 'rgba(20, 30, 50, 0.85)');
        bgGradient.addColorStop(0.5, 'rgba(15, 25, 45, 0.9)');
        bgGradient.addColorStop(1, 'rgba(10, 20, 40, 0.95)');
    }

    ctx.fillStyle = bgGradient;
    roundedRect(btnX, btnY, btnW, btnH, radius);
    ctx.fill();

    // Inner highlight at top (glass effect)
    ctx.save();
    const highlightGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH * 0.5);
    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.08 + hoverProgress * 0.12})`);
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    roundedRect(btnX + 2 * rX, btnY + 2 * rX, btnW - 4 * rX, btnH * 0.5, radius - 2 * rX);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Border
    if (has_border) {
        ctx.save();
        const borderPulse = 0.7 + Math.sin(pulsePhase * 0.5) * 0.3;

        if (hoverProgress > 0) {
            // Glowing cyan border when hovered
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10 * rX * hoverProgress;
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 + hoverProgress * 0.2})`;
            ctx.lineWidth = (2 + hoverProgress * 1.5) * rX;
        } else {
            // Subtle pulsing border
            ctx.strokeStyle = `rgba(80, 120, 160, ${borderPulse})`;
            ctx.lineWidth = 1.5 * rX;
        }

        roundedRect(btnX, btnY, btnW, btnH, radius);
        ctx.stroke();

        // Inner border line for depth
        if (hoverProgress > 0.2) {
            ctx.strokeStyle = `rgba(0, 200, 255, ${hoverProgress * 0.3})`;
            ctx.lineWidth = 1 * rX;
            roundedRect(btnX + 3 * rX, btnY + 3 * rX, btnW - 6 * rX, btnH - 6 * rX, radius - 2 * rX);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Text - centered and with better font
    ctx.save();

    // Text glow when hovered
    if (hoverProgress > 0.2) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = (3 + hoverProgress * 10) * rX;
    }

    // Use a cleaner font, properly scaled
    const fontSize = Math.max(12, textSize);
    ctx.font = `600 ${fontSize}px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text color transitions from normal to white when hovered
    if (hoverProgress > 0.3) {
        ctx.fillStyle = '#ffffff';
    } else {
        ctx.fillStyle = text_color;
    }

    // Draw text centered in button
    ctx.fillText(text, btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
}

/**
 * RetryWarningPopup - Shows warning when retrying with quantity-based loadout items
 */
export class RetryWarningPopup {
    constructor() {
        this.isVisible = false;
        this.items = []; // Items that will be consumed { id, name, rarity, quantity, isPermanent, isDepleted, isRemoved }
        this.depletedItems = []; // Items that were depleted during gameplay
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;

        // Buttons
        this.retryButton = new Button(0, 0, 200, 50, 'Retry', 20, 0, 0, false, true, '#00ff88', '#00ff88');
        this.cancelButton = new Button(0, 0, 200, 50, 'Cancel', 20, 0, 0, false, true, '#ff6666', '#ff6666');

        // Item remove buttons (dynamically created)
        this.removeButtons = [];

        // Animation
        this.fadeProgress = 0;
    }

    /**
     * Show the popup with loadout info
     * @param {Array} loadoutRewardsWithOwnership - Array of { reward, isPermanent, quantity }
     * @param {Object} weaponInfo - { reward, isPermanent, quantity, usesRemaining }
     * @param {Object} inventory - Current inventory { rewardId: { quantity, permanentUnlock } }
     */
    show(loadoutRewardsWithOwnership, weaponInfo, inventory) {
        this.isVisible = true;
        this.fadeProgress = 0;
        this.scrollOffset = 0;
        this.items = [];
        this.depletedItems = [];
        this.removeButtons = [];

        // Process each loadout item
        for (const item of loadoutRewardsWithOwnership) {
            if (!item.isPermanent) {
                const invData = inventory[item.reward.id] || { quantity: 0 };
                const willBeDepleted = invData.quantity <= 1;

                this.items.push({
                    id: item.reward.id,
                    name: item.reward.name,
                    rarity: item.reward.rarity,
                    quantity: invData.quantity,
                    isPermanent: false,
                    isDepleted: false, // Will set if weapon uses were exhausted
                    willBeDepleted: willBeDepleted,
                    isRemoved: false,
                    isWeapon: item.reward.category === 'gun'
                });
            }
        }

        // Check weapon specifically for depletion during gameplay
        if (weaponInfo && !weaponInfo.isPermanent) {
            const weaponItem = this.items.find(i => i.id === weaponInfo.reward.id);
            if (weaponItem) {
                // If no uses remaining, weapon was depleted
                if (weaponInfo.usesRemaining <= 0) {
                    weaponItem.isDepleted = true;
                }
            }
        }

        // Create remove buttons for each item
        for (let i = 0; i < this.items.length; i++) {
            this.removeButtons.push(new Button(0, 0, 100, 35, 'Remove', 16, 0, 0, false, true, '#ff8888', '#ff6666'));
        }
    }

    hide() {
        this.isVisible = false;
    }

    /**
     * Get the items that should be kept in the loadout (not removed)
     */
    getKeptItemIds() {
        return this.items.filter(i => !i.isRemoved).map(i => i.id);
    }

    /**
     * Get the items that were removed by the user
     */
    getRemovedItemIds() {
        return this.items.filter(i => i.isRemoved).map(i => i.id);
    }

    /**
     * Check if any non-permanent items exist in loadout
     */
    hasQuantityItems() {
        return this.items.length > 0;
    }

    update(game) {
        if (!this.isVisible) return null;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const inX = game.input.mouseX;
        const inY = game.input.mouseY;

        // Fade in animation
        if (this.fadeProgress < 1) {
            this.fadeProgress = Math.min(1, this.fadeProgress + 0.08);
        }

        // Panel dimensions
        const panelW = 700 * rX;
        const panelH = 550 * rY;
        const panelX = centerX - panelW / 2;
        const panelY = centerY - panelH / 2;

        // Update buttons
        const btnY = panelY + panelH - 80 * rY;
        const btnSpacing = 220 * rX;

        this.retryButton.x = (centerX - btnSpacing / 2 - 100 * rX) / rX;
        this.retryButton.y = btnY / rY;
        this.retryButton.update(inX, inY);

        this.cancelButton.x = (centerX + btnSpacing / 2 - 100 * rX) / rX;
        this.cancelButton.y = btnY / rY;
        this.cancelButton.update(inX, inY);

        // Update item remove buttons
        const itemStartY = panelY + 190 * rY;
        const itemHeight = 60 * rY;
        const itemsAreaHeight = panelH - 290 * rY;
        const maxVisibleItems = Math.floor(itemsAreaHeight / itemHeight);

        this.maxScrollOffset = Math.max(0, (this.items.length - maxVisibleItems) * itemHeight);

        for (let i = 0; i < this.items.length; i++) {
            const itemY = itemStartY + i * itemHeight - this.scrollOffset;

            // Only update if visible
            if (itemY >= itemStartY - itemHeight && itemY < itemStartY + itemsAreaHeight) {
                // Center button vertically in item row (row height is 50, button height is 35)
                const btnX = panelX + panelW - 150 * rX;
                this.removeButtons[i].x = btnX / rX;
                this.removeButtons[i].y = itemY / rY + 7; // Centered: (50-35)/2 ≈ 7
                this.removeButtons[i].text = this.items[i].isRemoved ? 'Restore' : 'Remove';
                this.removeButtons[i].text_color = this.items[i].isRemoved ? '#88ff88' : '#ff8888';
                this.removeButtons[i].border_color = this.items[i].isRemoved ? '#66cc66' : '#ff6666';
                this.removeButtons[i].update(inX, inY);
            }
        }

        // Handle clicks
        const clicked = game.input.buttons.indexOf(0) > -1;
        if (clicked) {
            game.input.buttons = game.input.buttons.filter(b => b !== 0);

            if (this.retryButton.isHovered) {
                if (window.gameSound) window.gameSound.playMenuClick();
                return 'retry';
            }

            if (this.cancelButton.isHovered) {
                if (window.gameSound) window.gameSound.playMenuClick();
                return 'cancel';
            }

            // Check remove button clicks
            for (let i = 0; i < this.removeButtons.length; i++) {
                const itemY = itemStartY + i * itemHeight - this.scrollOffset;
                if (itemY >= itemStartY - itemHeight && itemY < itemStartY + itemsAreaHeight) {
                    if (this.removeButtons[i].isHovered) {
                        if (window.gameSound) window.gameSound.playMenuClick();
                        this.items[i].isRemoved = !this.items[i].isRemoved;
                    }
                }
            }
        }

        // Handle scroll
        if (game.input.wheelDelta) {
            this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset,
                this.scrollOffset - game.input.wheelDelta * 30));
            game.input.wheelDelta = 0;
        }

        return null;
    }

    draw(ctx) {
        if (!this.isVisible) return;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const time = performance.now() / 1000;

        ctx.save();
        ctx.globalAlpha = this.fadeProgress;

        // Darkened background overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Panel dimensions
        const panelW = 700 * rX;
        const panelH = 550 * rY;
        const panelX = centerX - panelW / 2;
        const panelY = centerY - panelH / 2;
        const radius = 15 * rX;

        // Panel background gradient
        const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
        panelGradient.addColorStop(0, 'rgba(40, 30, 50, 0.98)');
        panelGradient.addColorStop(0.5, 'rgba(30, 25, 45, 0.98)');
        panelGradient.addColorStop(1, 'rgba(25, 20, 40, 0.98)');

        // Draw panel
        this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, radius);
        ctx.fillStyle = panelGradient;
        ctx.fill();

        // Glowing border (warning color - orange/yellow)
        const borderPulse = 0.7 + Math.sin(time * 3) * 0.3;
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 20 * rX * borderPulse;
        ctx.strokeStyle = `rgba(255, 170, 0, ${borderPulse})`;
        ctx.lineWidth = 3 * rX;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Warning icon (triangle with exclamation)
        this.drawWarningIcon(ctx, centerX, panelY + 50 * rY, 30 * rX, time);

        // Title
        ctx.font = `bold ${32 * rX}px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 10 * rX;
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('Loadout Warning', centerX, panelY + 100 * rY);
        ctx.shadowBlur = 0;

        // Subtitle
        ctx.font = `${16 * rX}px 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = '#cccccc';
        ctx.fillText('These items will be consumed when you return to the menu:', centerX, panelY + 135 * rY);
        ctx.fillStyle = '#999999';
        ctx.font = `${14 * rX}px 'Segoe UI', Arial, sans-serif`;
        ctx.fillText('(Remove items now to keep them for later)', centerX, panelY + 158 * rY);

        // Items list area
        const itemStartY = panelY + 190 * rY;
        const itemHeight = 60 * rY;
        const itemsAreaHeight = panelH - 290 * rY;

        // Clip items to visible area
        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 20 * rX, itemStartY - 5 * rY, panelW - 40 * rX, itemsAreaHeight + 10 * rY);
        ctx.clip();

        // Draw items
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const itemY = itemStartY + i * itemHeight - this.scrollOffset;

            // Only draw if visible
            if (itemY >= itemStartY - itemHeight && itemY < itemStartY + itemsAreaHeight + itemHeight) {
                this.drawItemRow(ctx, panelX + 30 * rX, itemY, panelW - 60 * rX, itemHeight - 10 * rY, item, i, rX, rY);
            }
        }

        ctx.restore();

        // Scroll indicators
        if (this.scrollOffset > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = `${20 * rX}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('▲', centerX, itemStartY - 10 * rY);
        }
        if (this.scrollOffset < this.maxScrollOffset) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = `${20 * rX}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('▼', centerX, itemStartY + itemsAreaHeight + 15 * rY);
        }

        // Draw buttons
        this.retryButton.draw(ctx);
        this.cancelButton.draw(ctx);

        // Draw remove buttons
        for (let i = 0; i < this.removeButtons.length; i++) {
            const itemY = itemStartY + i * itemHeight - this.scrollOffset;
            if (itemY >= itemStartY - itemHeight && itemY < itemStartY + itemsAreaHeight) {
                this.removeButtons[i].draw(ctx);
            }
        }

        // Bottom hint (positioned below buttons)
        ctx.font = `${14 * rX}px 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'center';
        ctx.fillText('Remove items to keep them for future games', centerX, panelY + panelH - 15 * rY);

        ctx.restore();
    }

    drawItemRow(ctx, x, y, w, h, item, index, rX, rY) {
        const radius = 8 * rX;

        // Background - different for removed items
        const bgGradient = ctx.createLinearGradient(x, y, x, y + h);
        if (item.isRemoved) {
            bgGradient.addColorStop(0, 'rgba(40, 40, 40, 0.5)');
            bgGradient.addColorStop(1, 'rgba(30, 30, 30, 0.5)');
        } else if (item.isDepleted) {
            bgGradient.addColorStop(0, 'rgba(80, 30, 30, 0.7)');
            bgGradient.addColorStop(1, 'rgba(60, 20, 20, 0.7)');
        } else if (item.willBeDepleted) {
            bgGradient.addColorStop(0, 'rgba(80, 60, 20, 0.7)');
            bgGradient.addColorStop(1, 'rgba(60, 40, 10, 0.7)');
        } else {
            bgGradient.addColorStop(0, 'rgba(30, 40, 60, 0.7)');
            bgGradient.addColorStop(1, 'rgba(20, 30, 50, 0.7)');
        }

        this.drawRoundedRect(ctx, x, y, w, h, radius);
        ctx.fillStyle = bgGradient;
        ctx.fill();

        // Border with rarity color
        const rarityColor = item.rarity?.color || '#ffffff';
        ctx.strokeStyle = item.isRemoved ? 'rgba(100, 100, 100, 0.5)' : rarityColor;
        ctx.lineWidth = 2 * rX;
        ctx.stroke();

        // Item name
        ctx.font = `${item.isRemoved ? 'normal' : 'bold'} ${18 * rX}px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillStyle = item.isRemoved ? '#666666' : rarityColor;
        if (item.isRemoved) {
            // Strike-through effect
            ctx.fillText(item.name, x + 15 * rX, y + h / 2 + 6 * rY);
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1 * rX;
            ctx.beginPath();
            ctx.moveTo(x + 15 * rX, y + h / 2);
            const textWidth = ctx.measureText(item.name).width;
            ctx.lineTo(x + 15 * rX + textWidth, y + h / 2);
            ctx.stroke();
        } else {
            ctx.fillText(item.name, x + 15 * rX, y + h / 2 + 6 * rY);
        }

        // Quantity indicator
        ctx.font = `${14 * rX}px 'Segoe UI', Arial, sans-serif`;
        const quantityX = x + 250 * rX;

        if (item.isRemoved) {
            ctx.fillStyle = '#88ff88';
            ctx.fillText('(Kept - will not be consumed)', quantityX, y + h / 2 + 5 * rY);
        } else if (item.isDepleted && item.willBeDepleted) {
            ctx.fillStyle = '#ff6666';
            ctx.fillText('Uses exhausted! Last one - remove to save', quantityX, y + h / 2 + 5 * rY);
        } else if (item.isDepleted) {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText(`Uses exhausted (${item.quantity} in inventory)`, quantityX, y + h / 2 + 5 * rY);
        } else if (item.willBeDepleted) {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText(`Last one! (${item.quantity} remaining)`, quantityX, y + h / 2 + 5 * rY);
        } else {
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText(`${item.quantity} remaining in inventory`, quantityX, y + h / 2 + 5 * rY);
        }
    }

    drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    drawWarningIcon(ctx, x, y, size, time) {
        const pulse = 1 + Math.sin(time * 4) * 0.1;
        const s = size * pulse;

        ctx.save();
        ctx.translate(x, y);

        // Glow
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 15;

        // Triangle
        ctx.fillStyle = '#ffcc00';
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.866, s * 0.5);
        ctx.lineTo(-s * 0.866, s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Exclamation mark
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${s * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, s * 0.1);

        ctx.restore();
    }
}