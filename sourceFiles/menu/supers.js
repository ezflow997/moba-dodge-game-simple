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
    drawMessageWindow(context, menu){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Animated time for effects
        const time = performance.now() / 1000;

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

        // "Click to continue" prompt with pulsing animation
        context.shadowBlur = 0;
        const promptAlpha = 0.5 + Math.sin(time * 3) * 0.3;
        context.font = `${22 * rX}px Arial`;
        context.fillStyle = `rgba(150, 150, 150, ${promptAlpha})`;
        context.fillText('Click anywhere to continue', centerX, panelY + panelH - 35 * rY);

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
            this.hoverProgress = Math.min(1, this.hoverProgress + 0.12);
            this.glowIntensity = Math.min(20, this.glowIntensity + 2);
        } else {
            this.hoverProgress = Math.max(0, this.hoverProgress - 0.08);
            this.glowIntensity = Math.max(0, this.glowIntensity - 1.5);
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