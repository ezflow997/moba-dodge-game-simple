import { Button, superFunctions } from "./supers.js";
import { REWARDS, CATEGORY, RARITY } from "../controller/rewardTypes.js";

// Pricing structures
const SINGLE_USE_PRICES = {
    'Common': 20,
    'Uncommon': 40,
    'Rare': 80,
    'Epic': 150,
    'Legendary': 300,
    'S-Tier': 600
};

const PERMANENT_PRICES = {
    'Common': 500,
    'Uncommon': 1000,
    'Rare': 2000,
    'Epic': 4000,
    'Legendary': 8000,
    'S-Tier': 15000
};

// Category display names and order
const CATEGORY_INFO = {
    [CATEGORY.GUN]: { name: 'Weapons', icon: 'W' },
    [CATEGORY.COOLDOWN]: { name: 'Cooldowns', icon: 'C' },
    [CATEGORY.SURVIVABILITY]: { name: 'Defense', icon: 'D' },
    [CATEGORY.MOVEMENT]: { name: 'Movement', icon: 'M' },
    [CATEGORY.OFFENSE]: { name: 'Offense', icon: 'O' }
};

export class ShopMenu {
    constructor() {
        this.super = new superFunctions();
        this.isVisible = false;
        this.clicked = false;

        // Player data
        this.playerPoints = 0;
        this.inventory = {}; // { rewardId: { quantity, permanentUnlock } }

        // Category tabs
        this.categories = Object.keys(CATEGORY_INFO);
        this.selectedCategory = CATEGORY.GUN;

        // Scrolling
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.isDraggingScrollbar = false;
        this.scrollbarDragStartY = 0;
        this.scrollbarDragStartOffset = 0;

        // Selected item for purchase
        this.selectedReward = null;
        this.purchaseMode = null; // 'single' or 'permanent'

        // Buttons
        this.closeButton = new Button(0, 0, 180, 60, "Close", 28, 0, 0, false, true, 'white', 'white');
        this.buyOneButton = new Button(0, 0, 160, 50, "Buy 1x", 22, 0, 0, false, true, 'white', 'white');
        this.buyPermButton = new Button(0, 0, 160, 50, "Unlock", 22, 0, 0, false, true, 'white', 'white');

        // Category tab buttons
        this.categoryButtons = {};
        for (const cat of this.categories) {
            this.categoryButtons[cat] = new Button(0, 0, 120, 45, CATEGORY_INFO[cat].name, 16, 0, 0, false, true, 'white', 'white');
        }

        // Message display
        this.message = null;
        this.messageTime = 0;

        // Organize rewards by category
        this.rewardsByCategory = {};
        for (const cat of this.categories) {
            this.rewardsByCategory[cat] = Object.values(REWARDS).filter(r => r.category === cat);
        }
    }

    show() {
        this.isVisible = true;
        this.clicked = false;
        this.scrollOffset = 0;
        this.selectedReward = null;
        this.message = null;
    }

    hide() {
        this.isVisible = false;
        this.selectedReward = null;
    }

    setShopData(data) {
        if (data.points !== undefined) {
            this.playerPoints = data.points;
        }
        if (data.inventory) {
            this.inventory = data.inventory;
        }
    }

    setMessage(text, isError = false) {
        this.message = { text, isError };
        this.messageTime = Date.now();
    }

    getOwnedQuantity(rewardId) {
        const item = this.inventory[rewardId];
        if (!item) return 0;
        return item.quantity || 0;
    }

    isPermanentlyUnlocked(rewardId) {
        const item = this.inventory[rewardId];
        return item ? item.permanentUnlock : false;
    }

    update(game) {
        if (!this.isVisible) return true;

        // Handle ESC to close
        if (game.input.escapePressed) {
            this.hide();
            game.input.escapePressed = false;
            return true;
        }

        const inX = game.input.mouseX;
        const inY = game.input.mouseY;
        const clicking = game.input.buttons.indexOf(0) > -1;

        if (!clicking) {
            this.clicked = false;
            this.isDraggingScrollbar = false;
        }

        // Reference coordinates (2560x1440)
        const refCenterX = 1280;
        const refPanelW = 1400;
        const refPanelH = 900;
        const refPanelTop = 720 - refPanelH / 2;
        const refPanelBottom = 720 + refPanelH / 2;

        // Update category buttons
        const catBtnY = refPanelTop + 80;
        const catBtnStartX = refCenterX - (this.categories.length * 130) / 2;

        for (let i = 0; i < this.categories.length; i++) {
            const cat = this.categories[i];
            const btn = this.categoryButtons[cat];
            btn.x = catBtnStartX + i * 130;
            btn.y = catBtnY;
            btn.w = 120;
            btn.h = 45;
            btn.update(inX, inY);

            if (btn.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedCategory = cat;
                this.scrollOffset = 0;
                this.selectedReward = null;
            }
        }

        // Update close button
        this.closeButton.x = refCenterX - 90;
        this.closeButton.y = refPanelBottom - 80;
        this.closeButton.update(inX, inY);

        if (this.closeButton.isHovered && clicking && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            this.hide();
            return true;
        }

        // Scale factors for coordinate conversion
        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Handle item grid clicks and scrolling
        // Grid coordinates (matching draw function)
        const refPanelLeft = refCenterX - 700; // Panel half-width is 700
        const gridLeft = refPanelLeft + 30;    // 610 in reference coords
        const gridTop = refPanelTop + 150;
        const gridBottom = refPanelBottom - 100;
        const gridHeight = gridBottom - gridTop;
        const gridWidth = 950;

        // Calculate content height for current category
        const rewards = this.rewardsByCategory[this.selectedCategory] || [];
        const itemHeight = 80;
        const contentHeight = rewards.length * itemHeight;
        this.maxScrollOffset = Math.max(0, contentHeight - gridHeight);

        // Convert to screen pixels
        const gridLeftPx = gridLeft * rX;
        const gridRightPx = (gridLeft + gridWidth) * rX;
        const gridTopPx = gridTop * rY;
        const gridBottomPx = gridBottom * rY;
        const gridHeightPx = gridHeight * rY;

        // Scrollbar dimensions (in screen coordinates)
        const scrollbarX = gridRightPx + 10 * rX;
        const scrollbarY = gridTopPx;
        const scrollbarHeight = gridHeightPx;
        const scrollbarWidth = 40 * rX; // Wide hit area

        // Calculate thumb size and position
        const thumbHeight = this.maxScrollOffset > 0
            ? Math.max(50 * rY, (gridHeight / (this.maxScrollOffset + gridHeight)) * scrollbarHeight)
            : scrollbarHeight;
        const thumbY = this.maxScrollOffset > 0
            ? scrollbarY + (this.scrollOffset / this.maxScrollOffset) * (scrollbarHeight - thumbHeight)
            : scrollbarY;

        // Handle scrollbar dragging (check first before other interactions)
        if (this.isDraggingScrollbar) {
            if (clicking) {
                const dragDelta = inY - this.scrollbarDragStartY;
                const scrollRatio = dragDelta / Math.max(1, scrollbarHeight - thumbHeight);
                this.scrollOffset = this.scrollbarDragStartOffset + scrollRatio * this.maxScrollOffset;
                this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset));
            } else {
                this.isDraggingScrollbar = false;
            }
        } else if (clicking && !this.clicked && this.maxScrollOffset > 0) {
            // Check if clicking on scrollbar area to start drag
            const hitPadding = 20 * rX;
            if (inX >= scrollbarX - hitPadding && inX <= scrollbarX + scrollbarWidth + hitPadding &&
                inY >= scrollbarY && inY <= scrollbarY + scrollbarHeight) {
                this.isDraggingScrollbar = true;
                this.scrollbarDragStartY = inY;
                this.scrollbarDragStartOffset = this.scrollOffset;
                this.clicked = true;
            }
        }

        // Handle mouse wheel scroll
        if (game.input.wheelDelta) {
            this.scrollOffset += game.input.wheelDelta > 0 ? -60 : 60;
            this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset));
        }

        // Handle item selection (don't select when dragging scrollbar)
        if (clicking && !this.clicked && !this.isDraggingScrollbar &&
            inX >= gridLeftPx && inX <= gridRightPx && inY >= gridTopPx && inY <= gridBottomPx) {
            // Find which item was clicked
            const relY = inY - gridTopPx + this.scrollOffset * rY;
            const itemIndex = Math.floor(relY / (itemHeight * rY));

            if (itemIndex >= 0 && itemIndex < rewards.length) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedReward = rewards[itemIndex];
            }
        }

        // Handle purchase buttons if item is selected
        if (this.selectedReward) {
            // Detail panel position (matching draw function)
            const refPanelLeft = refCenterX - 700;
            const detailX = refPanelLeft + 1025; // 1605 in ref coords
            const detailW = 345;
            const detailCenterX = detailX + detailW / 2; // 1777.5 in ref coords
            const detailY = refPanelTop + 150;

            this.buyOneButton.x = detailCenterX - 80;
            this.buyOneButton.y = detailY + 220;
            this.buyOneButton.update(inX, inY);

            this.buyPermButton.x = detailCenterX - 80;
            this.buyPermButton.y = detailY + 285;
            this.buyPermButton.update(inX, inY);

            if (this.buyOneButton.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                return { action: 'purchase', rewardId: this.selectedReward.id, rarityName: this.selectedReward.rarity.name, isPermanent: false };
            }

            if (this.buyPermButton.isHovered && clicking && !this.clicked && !this.isPermanentlyUnlocked(this.selectedReward.id)) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                return { action: 'purchase', rewardId: this.selectedReward.id, rarityName: this.selectedReward.rarity.name, isPermanent: true };
            }
        }

        return true;
    }

    draw(context, game) {
        if (!this.isVisible) return;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        context.save();

        // Draw overlay
        context.fillStyle = 'rgba(0, 0, 0, 0.85)';
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Panel dimensions
        const panelW = 1400 * rX;
        const panelH = 900 * rY;
        const panelX = centerX - panelW / 2;
        const panelY = centerY - panelH / 2;

        // Draw panel background
        context.beginPath();
        context.roundRect(panelX, panelY, panelW, panelH, 15 * rX);
        const gradient = context.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
        gradient.addColorStop(0, 'rgba(20, 35, 60, 0.98)');
        gradient.addColorStop(1, 'rgba(10, 20, 40, 0.98)');
        context.fillStyle = gradient;
        context.fill();

        // Draw border
        context.strokeStyle = '#ffcc00';
        context.shadowColor = '#ffcc00';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 3 * rX;
        context.stroke();
        context.shadowBlur = 0;

        // Title
        context.font = `bold ${48 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = '#ffcc00';
        context.shadowColor = '#ffcc00';
        context.shadowBlur = 15 * rX;
        context.fillText('SHOP', centerX, panelY + 55 * rY);
        context.shadowBlur = 0;

        // Points display
        context.font = `${28 * rX}px Arial`;
        context.fillStyle = '#00ff88';
        context.textAlign = 'right';
        context.fillText(`${this.playerPoints.toLocaleString()} Points`, panelX + panelW - 30 * rX, panelY + 55 * rY);

        // Draw category tabs
        this.drawCategoryTabs(context, rX, rY, panelX, panelY);

        // Draw item grid
        this.drawItemGrid(context, rX, rY, panelX, panelY, panelW, panelH);

        // Draw selected item details
        if (this.selectedReward) {
            this.drawItemDetails(context, rX, rY, panelX, panelY, panelW);
        }

        // Draw close button
        this.closeButton.draw(context);

        // Draw message (above close button)
        if (this.message && Date.now() - this.messageTime < 3000) {
            context.font = `bold ${22 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = this.message.isError ? '#ff4444' : '#00ff88';
            context.fillText(this.message.text, centerX, panelY + panelH - 115 * rY);
        }

        context.restore();
    }

    drawCategoryTabs(context, rX, rY, panelX, panelY) {
        for (const cat of this.categories) {
            const btn = this.categoryButtons[cat];
            const bx = btn.x * rX;
            const by = btn.y * rY;
            const bw = btn.w * rX;
            const bh = btn.h * rY;

            const isActive = cat === this.selectedCategory;

            context.beginPath();
            context.roundRect(bx, by, bw, bh, 8 * rX);

            if (isActive) {
                context.fillStyle = 'rgba(255, 204, 0, 0.3)';
                context.fill();
                context.strokeStyle = '#ffcc00';
                context.lineWidth = 2 * rX;
                context.stroke();
            } else if (btn.isHovered) {
                context.fillStyle = 'rgba(255, 255, 255, 0.1)';
                context.fill();
                context.strokeStyle = '#666666';
                context.lineWidth = 1 * rX;
                context.stroke();
            } else {
                context.fillStyle = 'rgba(30, 40, 60, 0.8)';
                context.fill();
                context.strokeStyle = '#444444';
                context.lineWidth = 1 * rX;
                context.stroke();
            }

            context.font = `${16 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = isActive ? '#ffcc00' : '#aaaaaa';
            context.fillText(CATEGORY_INFO[cat].name, bx + bw / 2, by + bh / 2 + 5 * rY);
        }
    }

    drawItemGrid(context, rX, rY, panelX, panelY, panelW, panelH) {
        const gridLeft = panelX + 30 * rX;
        const gridTop = panelY + 150 * rY;
        const gridWidth = 950 * rX;
        const gridHeight = panelH - 270 * rY;

        // Clip region
        context.save();
        context.beginPath();
        context.rect(gridLeft, gridTop, gridWidth, gridHeight);
        context.clip();

        const rewards = this.rewardsByCategory[this.selectedCategory] || [];
        const itemHeight = 80 * rY;

        for (let i = 0; i < rewards.length; i++) {
            const reward = rewards[i];
            const itemY = gridTop + i * itemHeight - this.scrollOffset * rY;

            // Skip if outside visible area
            if (itemY + itemHeight < gridTop || itemY > gridTop + gridHeight) continue;

            const isSelected = this.selectedReward && this.selectedReward.id === reward.id;
            const owned = this.getOwnedQuantity(reward.id);
            const isPerm = this.isPermanentlyUnlocked(reward.id);

            // Item background
            context.beginPath();
            context.roundRect(gridLeft + 5 * rX, itemY + 5 * rY, gridWidth - 10 * rX, itemHeight - 10 * rY, 8 * rX);

            if (isSelected) {
                context.fillStyle = 'rgba(255, 204, 0, 0.2)';
                context.strokeStyle = '#ffcc00';
                context.lineWidth = 2 * rX;
            } else {
                context.fillStyle = 'rgba(30, 40, 60, 0.6)';
                context.strokeStyle = reward.rarity.color;
                context.lineWidth = 1 * rX;
            }
            context.fill();
            context.stroke();

            // Rarity color bar
            context.fillStyle = reward.rarity.color;
            context.fillRect(gridLeft + 5 * rX, itemY + 5 * rY, 6 * rX, itemHeight - 10 * rY);

            // Item name
            context.font = `bold ${20 * rX}px Arial`;
            context.textAlign = 'left';
            context.fillStyle = reward.rarity.color;
            context.fillText(reward.name, gridLeft + 25 * rX, itemY + 30 * rY);

            // Description
            context.font = `${16 * rX}px Arial`;
            context.fillStyle = '#aaaaaa';
            context.fillText(reward.description, gridLeft + 25 * rX, itemY + 55 * rY);

            // Rarity name
            context.font = `${14 * rX}px Arial`;
            context.fillStyle = reward.rarity.color;
            context.fillText(reward.rarity.name, gridLeft + 400 * rX, itemY + 30 * rY);

            // Price
            const price = SINGLE_USE_PRICES[reward.rarity.name] || 0;
            context.font = `${18 * rX}px Arial`;
            context.fillStyle = '#ffcc00';
            context.fillText(`${price} pts`, gridLeft + 550 * rX, itemY + 30 * rY);

            // Owned count
            if (isPerm) {
                context.fillStyle = '#00ff88';
                context.fillText('UNLOCKED', gridLeft + 700 * rX, itemY + 35 * rY);
            } else if (owned > 0) {
                context.fillStyle = '#88ffff';
                context.fillText(`Owned: ${owned}`, gridLeft + 700 * rX, itemY + 35 * rY);
            }
        }

        context.restore();

        // Draw scrollbar if needed
        if (this.maxScrollOffset > 0) {
            const scrollbarX = gridLeft + gridWidth + 10 * rX;
            const scrollbarHeight = gridHeight;
            const scrollbarWidth = 22 * rX;

            // Track
            context.beginPath();
            context.roundRect(scrollbarX, gridTop, scrollbarWidth, scrollbarHeight, 8 * rX);
            context.fillStyle = 'rgba(255, 255, 255, 0.15)';
            context.fill();

            // Thumb
            const thumbHeight = Math.max(50 * rY, (gridHeight / (this.maxScrollOffset + gridHeight)) * scrollbarHeight);
            const thumbY = gridTop + (this.scrollOffset / this.maxScrollOffset) * (scrollbarHeight - thumbHeight);

            context.beginPath();
            context.roundRect(scrollbarX + 3 * rX, thumbY, scrollbarWidth - 6 * rX, thumbHeight, 6 * rX);
            context.fillStyle = '#ffcc00';
            context.fill();
        }
    }

    drawItemDetails(context, rX, rY, panelX, panelY, panelW) {
        const reward = this.selectedReward;
        const detailX = panelX + 1025 * rX; // Moved right to avoid scrollbar overlap
        const detailY = panelY + 150 * rY;
        const detailW = 345 * rX; // Slightly narrower to fit panel
        const detailH = 400 * rY;

        // Detail panel background
        context.beginPath();
        context.roundRect(detailX, detailY, detailW, detailH, 10 * rX);
        context.fillStyle = 'rgba(20, 30, 50, 0.9)';
        context.fill();
        context.strokeStyle = reward.rarity.color;
        context.lineWidth = 2 * rX;
        context.stroke();

        // Item name
        context.font = `bold ${26 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = reward.rarity.color;
        context.shadowColor = reward.rarity.glowColor;
        context.shadowBlur = 10 * rX;
        context.fillText(reward.name, detailX + detailW / 2, detailY + 40 * rY);
        context.shadowBlur = 0;

        // Rarity
        context.font = `${18 * rX}px Arial`;
        context.fillStyle = reward.rarity.color;
        context.fillText(reward.rarity.name, detailX + detailW / 2, detailY + 70 * rY);

        // Description
        context.font = `${16 * rX}px Arial`;
        context.fillStyle = '#cccccc';
        context.fillText(reward.description, detailX + detailW / 2, detailY + 110 * rY);

        // Category
        context.fillStyle = '#888888';
        context.fillText(`Category: ${CATEGORY_INFO[reward.category].name}`, detailX + detailW / 2, detailY + 145 * rY);

        // Owned status
        const owned = this.getOwnedQuantity(reward.id);
        const isPerm = this.isPermanentlyUnlocked(reward.id);

        context.font = `${20 * rX}px Arial`;
        if (isPerm) {
            context.fillStyle = '#00ff88';
            context.fillText('Permanently Unlocked!', detailX + detailW / 2, detailY + 185 * rY);
        } else {
            context.fillStyle = '#88ffff';
            context.fillText(`Owned: ${owned}`, detailX + detailW / 2, detailY + 185 * rY);
        }

        // Prices
        const singlePrice = SINGLE_USE_PRICES[reward.rarity.name] || 0;
        const permPrice = PERMANENT_PRICES[reward.rarity.name] || 0;

        // Buy single button
        const canBuySingle = this.playerPoints >= singlePrice;
        this.buyOneButton.x = (detailX + detailW / 2 - 80 * rX) / rX;
        this.buyOneButton.y = (detailY + 220 * rY) / rY;

        context.beginPath();
        context.roundRect(detailX + detailW / 2 - 80 * rX, detailY + 220 * rY, 160 * rX, 50 * rY, 8 * rX);
        context.fillStyle = canBuySingle ? 'rgba(0, 150, 0, 0.6)' : 'rgba(50, 50, 50, 0.6)';
        context.fill();
        context.strokeStyle = canBuySingle ? '#00ff88' : '#666666';
        context.lineWidth = 2 * rX;
        context.stroke();

        context.font = `${18 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = canBuySingle ? '#ffffff' : '#666666';
        context.fillText(`Buy 1x - ${singlePrice} pts`, detailX + detailW / 2, detailY + 252 * rY);

        // Buy permanent button
        const canBuyPerm = this.playerPoints >= permPrice && !isPerm;
        this.buyPermButton.x = (detailX + detailW / 2 - 80 * rX) / rX;
        this.buyPermButton.y = (detailY + 285 * rY) / rY;

        context.beginPath();
        context.roundRect(detailX + detailW / 2 - 80 * rX, detailY + 285 * rY, 160 * rX, 50 * rY, 8 * rX);
        if (isPerm) {
            context.fillStyle = 'rgba(0, 100, 50, 0.6)';
            context.strokeStyle = '#00ff88';
        } else {
            context.fillStyle = canBuyPerm ? 'rgba(150, 100, 0, 0.6)' : 'rgba(50, 50, 50, 0.6)';
            context.strokeStyle = canBuyPerm ? '#ffcc00' : '#666666';
        }
        context.fill();
        context.lineWidth = 2 * rX;
        context.stroke();

        context.font = `${18 * rX}px Arial`;
        context.fillStyle = isPerm ? '#00ff88' : (canBuyPerm ? '#ffffff' : '#666666');
        if (isPerm) {
            context.fillText('Already Unlocked', detailX + detailW / 2, detailY + 317 * rY);
        } else {
            context.fillText(`Unlock - ${permPrice.toLocaleString()} pts`, detailX + detailW / 2, detailY + 317 * rY);
        }

        // Info text
        context.font = `${14 * rX}px Arial`;
        context.fillStyle = '#888888';
        context.fillText('Single-use: consumed after 1 game', detailX + detailW / 2, detailY + 360 * rY);
        context.fillText('Unlock: use unlimited times', detailX + detailW / 2, detailY + 380 * rY);
    }
}
