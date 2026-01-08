export class World {
    constructor(){
        this.scale = 1;
        this.xOffset = 0;
        this.yOffset = 0;

        // Screen shake properties
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    update() {
        if (this.shakeDuration > 0) {
            this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeDuration--;
            this.shakeIntensity *= 0.95; // Decay shake
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
            this.shakeIntensity = 0;
        }
    }

    draw(context, width, height){
        context.save();

        // Apply screen shake offset
        if (this.shakeDuration > 0) {
            context.translate(this.shakeOffsetX, this.shakeOffsetY);
        }

        // Draw dark gradient background for gameplay
        const gradient = context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0a15');
        gradient.addColorStop(0.5, '#0f1020');
        gradient.addColorStop(1, '#050510');

        context.beginPath();
        context.fillStyle = gradient;
        context.fillRect(this.xOffset - 100, this.yOffset - 100, width + 200, height + 200);
        context.closePath();

        // Draw subtle grid pattern
        this.drawGrid(context, width, height);

        context.restore();
    }

    drawGrid(context, width, height) {
        const rX = window.innerWidth / 2560;
        const gridSize = 100 * rX;
        const alpha = 0.05;

        context.save();
        context.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        context.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < width; x += gridSize) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < height; y += gridSize) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        context.restore();
    }

    reset() {
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }
}
