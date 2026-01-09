import { Button, superFunctions } from "./supers.js";
import { REWARDS, CATEGORY } from "../controller/rewardTypes.js";

// Category display names
const CATEGORY_INFO = {
    [CATEGORY.GUN]: { name: 'Weapons', icon: 'W' },
    [CATEGORY.COOLDOWN]: { name: 'Cooldowns', icon: 'C' },
    [CATEGORY.SURVIVABILITY]: { name: 'Defense', icon: 'D' },
    [CATEGORY.MOVEMENT]: { name: 'Movement', icon: 'M' },
    [CATEGORY.OFFENSE]: { name: 'Offense', icon: 'O' }
};

export class LoadoutMenu {
    constructor() {
        this.super = new superFunctions();
        this.isVisible = false;
        this.clicked = false;

        // Player inventory
        this.inventory = {}; // { rewardId: { quantity, permanentUnlock } }

        // Selected rewards for this game
        this.selectedRewards = []; // Array of reward objects

        // Scrolling
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.isDraggingScrollbar = false;
        this.scrollbarDragStartY = 0;
        this.scrollbarDragStartOffset = 0;

        // Buttons
        this.startButton = new Button(0, 0, 220, 70, "Start Game", 30, 0, 0, false, true, 'white', 'white');
        this.cancelButton = new Button(0, 0, 180, 70, "Cancel", 28, 0, 0, false, true, 'white', 'white');
        this.clearButton = new Button(0, 0, 160, 50, "Clear All", 20, 0, 0, false, true, 'white', 'white');
    }

    show() {
        this.isVisible = true;
        this.clicked = false;
        this.scrollOffset = 0;
        this.selectedRewards = [];
    }

    hide() {
        this.isVisible = false;
    }

    setInventory(inventory) {
        this.inventory = inventory || {};
    }

    getSelectedRewards() {
        return this.selectedRewards;
    }

    getSelectedRewardIds() {
        return this.selectedRewards.map(r => r.id);
    }

    // Get available items (owned quantity > 0 or permanently unlocked)
    getAvailableItems() {
        const available = [];
        for (const [rewardId, data] of Object.entries(this.inventory)) {
            if (data.permanentUnlock || data.quantity > 0) {
                const reward = Object.values(REWARDS).find(r => r.id === rewardId);
                if (reward) {
                    available.push({
                        reward,
                        quantity: data.quantity,
                        isPermanent: data.permanentUnlock
                    });
                }
            }
        }
        // Sort by category then rarity
        available.sort((a, b) => {
            if (a.reward.category !== b.reward.category) {
                return Object.keys(CATEGORY_INFO).indexOf(a.reward.category) - Object.keys(CATEGORY_INFO).indexOf(b.reward.category);
            }
            return 0;
        });
        return available;
    }

    // Count how many times a reward is selected
    getSelectedCount(rewardId) {
        return this.selectedRewards.filter(r => r.id === rewardId).length;
    }

    // Check if a gun is already selected
    hasGunSelected() {
        return this.selectedRewards.some(r => r.category === CATEGORY.GUN);
    }

    // Check if we can add this reward
    canAddReward(rewardId) {
        const data = this.inventory[rewardId];
        if (!data) return false;

        // Each item can only be selected once
        if (this.getSelectedCount(rewardId) > 0) return false;

        // Find the reward to check its category
        const reward = Object.values(REWARDS).find(r => r.id === rewardId);
        if (!reward) return false;

        // Only one gun can be selected at a time
        if (reward.category === CATEGORY.GUN && this.hasGunSelected()) return false;

        // For non-permanent items, check quantity
        if (!data.permanentUnlock && data.quantity <= 0) return false;

        return true;
    }

    // Add a reward to selection
    addReward(reward) {
        if (this.canAddReward(reward.id)) {
            this.selectedRewards.push(reward);
            return true;
        }
        return false;
    }

    // Remove a reward from selection
    removeReward(rewardId) {
        const index = this.selectedRewards.findIndex(r => r.id === rewardId);
        if (index !== -1) {
            this.selectedRewards.splice(index, 1);
            return true;
        }
        return false;
    }

    update(game) {
        if (!this.isVisible) return true;

        // Handle ESC to cancel
        if (game.input.escapePressed) {
            this.hide();
            game.input.escapePressed = false;
            return 'cancel';
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
        const refPanelH = 800;
        const refPanelTop = 720 - refPanelH / 2;
        const refPanelBottom = 720 + refPanelH / 2;

        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;

        // Update buttons
        this.startButton.x = refCenterX - 230;
        this.startButton.y = refPanelBottom - 90;
        this.startButton.update(inX, inY);

        this.cancelButton.x = refCenterX + 30;
        this.cancelButton.y = refPanelBottom - 90;
        this.cancelButton.update(inX, inY);

        this.clearButton.x = refCenterX + 300;
        this.clearButton.y = refPanelTop + 70;
        this.clearButton.update(inX, inY);

        // Handle button clicks
        if (this.startButton.isHovered && clicking && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            return 'start';
        }

        if (this.cancelButton.isHovered && clicking && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            this.hide();
            return 'cancel';
        }

        if (this.clearButton.isHovered && clicking && !this.clicked) {
            this.clicked = true;
            if (window.gameSound) window.gameSound.playMenuClick();
            this.selectedRewards = [];
        }

        // Handle scrolling
        const available = this.getAvailableItems();
        const itemHeight = 70;

        // Grid coordinates (matching draw function)
        const refPanelLeft = refCenterX - 600; // Panel half-width is 600
        const gridLeft = refPanelLeft + 30;    // List starts at panelX + 30
        const gridTop = refPanelTop + 140;
        const gridWidth = 730;
        const gridHeight = refPanelH - 280;
        const contentHeight = available.length * itemHeight;
        this.maxScrollOffset = Math.max(0, contentHeight - gridHeight);

        // Convert to screen pixels
        const gridLeftPx = gridLeft * rX;
        const gridRightPx = (gridLeft + gridWidth) * rX;
        const gridTopPx = gridTop * rY;
        const gridBottomPx = (gridTop + gridHeight) * rY;
        const gridHeightPx = gridHeight * rY;

        // Scrollbar dimensions (in screen coordinates)
        const scrollbarX = gridRightPx + 5 * rX;
        const scrollbarY = gridTopPx + 20 * rY; // Account for header offset
        const scrollbarHeight = gridHeightPx;
        const scrollbarWidth = 40 * rX; // Wide hit area

        // Calculate thumb size and position
        const thumbHeight = this.maxScrollOffset > 0
            ? Math.max(50 * rY, (gridHeight / (this.maxScrollOffset + gridHeight)) * scrollbarHeight)
            : scrollbarHeight;

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
            this.scrollOffset += game.input.wheelDelta > 0 ? -50 : 50;
            this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset));
        }

        // Handle item clicks (don't process when dragging scrollbar)
        if (clicking && !this.clicked && !this.isDraggingScrollbar &&
            inX >= gridLeftPx && inX <= gridRightPx && inY >= gridTopPx && inY <= gridBottomPx) {
            const relY = inY - gridTopPx + this.scrollOffset * rY;
            const itemIndex = Math.floor(relY / (itemHeight * rY));

            if (itemIndex >= 0 && itemIndex < available.length) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();

                const item = available[itemIndex];
                // Toggle: if selected, remove; if not selected, try to add
                if (this.getSelectedCount(item.reward.id) > 0) {
                    this.removeReward(item.reward.id);
                } else {
                    this.addReward(item.reward);
                }
            }
        }

        // Handle selected items clicks (to remove)
        // Selected items panel is at panelX + 800 in draw, which is centerX - 600 + 800 = centerX + 200
        const selectedX = (refCenterX + 200) * rX;
        const selectedRight = (refCenterX + 570) * rX;
        const selectedTopPx = (refPanelTop + 160) * rY;
        const selectedItemH = 55 * rY;

        if (clicking && !this.clicked && !this.isDraggingScrollbar &&
            inX >= selectedX && inX <= selectedRight && inY >= selectedTopPx) {
            const relY = inY - selectedTopPx;
            const itemIndex = Math.floor(relY / selectedItemH);

            if (itemIndex >= 0 && itemIndex < this.selectedRewards.length) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedRewards.splice(itemIndex, 1);
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
        const panelW = 1200 * rX;
        const panelH = 800 * rY;
        const panelX = centerX - panelW / 2;
        const panelY = centerY - panelH / 2;

        // Draw panel background
        context.beginPath();
        context.roundRect(panelX, panelY, panelW, panelH, 15 * rX);
        const gradient = context.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
        gradient.addColorStop(0, 'rgba(20, 40, 60, 0.98)');
        gradient.addColorStop(1, 'rgba(10, 25, 45, 0.98)');
        context.fillStyle = gradient;
        context.fill();

        // Draw border
        context.strokeStyle = '#00ffaa';
        context.shadowColor = '#00ffaa';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 3 * rX;
        context.stroke();
        context.shadowBlur = 0;

        // Title
        context.font = `bold ${42 * rX}px Arial`;
        context.textAlign = 'center';
        context.fillStyle = '#00ffaa';
        context.shadowColor = '#00ffaa';
        context.shadowBlur = 15 * rX;
        context.fillText('SELECT LOADOUT', centerX, panelY + 55 * rY);
        context.shadowBlur = 0;

        // Subtitle
        context.font = `${20 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText('Choose rewards to start with (click to add/remove)', centerX, panelY + 90 * rY);

        // Draw available items
        this.drawAvailableItems(context, rX, rY, panelX, panelY, panelH);

        // Draw selected items
        this.drawSelectedItems(context, rX, rY, panelX, panelY);

        // Draw buttons
        this.startButton.draw(context);
        this.cancelButton.draw(context);
        this.clearButton.draw(context);

        context.restore();
    }

    drawAvailableItems(context, rX, rY, panelX, panelY, panelH) {
        const listX = panelX + 30 * rX;
        const listY = panelY + 130 * rY;
        const listW = 730 * rX;
        const listH = panelH - 270 * rY;

        // List header
        context.font = `bold ${22 * rX}px Arial`;
        context.textAlign = 'left';
        context.fillStyle = '#ffffff';
        context.fillText('Available Items', listX + 10 * rX, listY);

        const gridTop = listY + 20 * rY;

        // Clip region
        context.save();
        context.beginPath();
        context.rect(listX, gridTop, listW, listH);
        context.clip();

        const available = this.getAvailableItems();
        const itemHeight = 70 * rY;

        if (available.length === 0) {
            context.font = `${20 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = '#666666';
            context.fillText('No items owned', listX + listW / 2, gridTop + 60 * rY);
            context.fillText('Visit the Shop to purchase items!', listX + listW / 2, gridTop + 90 * rY);
        }

        for (let i = 0; i < available.length; i++) {
            const item = available[i];
            const itemY = gridTop + i * itemHeight - this.scrollOffset * rY;

            if (itemY + itemHeight < gridTop || itemY > gridTop + listH) continue;

            const isSelected = this.getSelectedCount(item.reward.id) > 0;
            const canAdd = this.canAddReward(item.reward.id);
            const isDisabled = !isSelected && !canAdd;

            // Item background
            context.beginPath();
            context.roundRect(listX + 5 * rX, itemY + 5 * rY, listW - 10 * rX, itemHeight - 10 * rY, 8 * rX);

            if (isSelected) {
                context.fillStyle = 'rgba(0, 255, 170, 0.15)';
                context.strokeStyle = '#00ffaa';
            } else if (isDisabled) {
                context.fillStyle = 'rgba(20, 20, 30, 0.6)';
                context.strokeStyle = '#444444';
            } else {
                context.fillStyle = 'rgba(30, 40, 60, 0.6)';
                context.strokeStyle = item.reward.rarity.color;
            }
            context.fill();
            context.lineWidth = isSelected ? 2 * rX : 1 * rX;
            context.stroke();

            // Rarity bar
            context.fillStyle = isDisabled ? '#444444' : item.reward.rarity.color;
            context.fillRect(listX + 5 * rX, itemY + 5 * rY, 5 * rX, itemHeight - 10 * rY);

            // Item name
            context.font = `bold ${18 * rX}px Arial`;
            context.textAlign = 'left';
            context.fillStyle = isDisabled ? '#666666' : item.reward.rarity.color;
            context.fillText(item.reward.name, listX + 22 * rX, itemY + 28 * rY);

            // Description
            context.font = `${14 * rX}px Arial`;
            context.fillStyle = isDisabled ? '#555555' : '#aaaaaa';
            context.fillText(item.reward.description, listX + 22 * rX, itemY + 50 * rY);

            // Quantity/status
            context.font = `${16 * rX}px Arial`;
            context.textAlign = 'right';
            if (item.isPermanent) {
                context.fillStyle = isDisabled ? '#555555' : '#00ff88';
                context.fillText('UNLIMITED', listX + listW - 20 * rX, itemY + 28 * rY);
            } else {
                context.fillStyle = isDisabled ? '#555555' : '#88ffff';
                context.fillText(`x${item.quantity}`, listX + listW - 20 * rX, itemY + 28 * rY);
            }

            // Selected indicator or disabled reason
            if (isSelected) {
                context.fillStyle = '#00ffaa';
                context.fillText('SELECTED', listX + listW - 20 * rX, itemY + 50 * rY);
            } else if (isDisabled && item.reward.category === CATEGORY.GUN) {
                context.fillStyle = '#ff6666';
                context.fillText('Gun already selected', listX + listW - 20 * rX, itemY + 50 * rY);
            }
        }

        context.restore();

        // Scrollbar
        if (this.maxScrollOffset > 0) {
            const scrollX = listX + listW + 5 * rX;
            const scrollH = listH;
            const scrollW = 22 * rX;

            context.beginPath();
            context.roundRect(scrollX, gridTop, scrollW, scrollH, 8 * rX);
            context.fillStyle = 'rgba(255, 255, 255, 0.15)';
            context.fill();

            const thumbH = Math.max(50 * rY, (listH / (this.maxScrollOffset + listH)) * scrollH);
            const thumbY = gridTop + (this.scrollOffset / this.maxScrollOffset) * (scrollH - thumbH);

            context.beginPath();
            context.roundRect(scrollX + 3 * rX, thumbY, scrollW - 6 * rX, thumbH, 6 * rX);
            context.fillStyle = '#00ffaa';
            context.fill();
        }
    }

    drawSelectedItems(context, rX, rY, panelX, panelY) {
        const listX = panelX + 800 * rX;
        const listY = panelY + 130 * rY;
        const listW = 370 * rX;

        // Header with clear button
        context.font = `bold ${22 * rX}px Arial`;
        context.textAlign = 'left';
        context.fillStyle = '#ffffff';
        context.fillText(`Selected (${this.selectedRewards.length})`, listX + 10 * rX, listY);

        // Draw selected items
        const itemStartY = listY + 30 * rY;
        const itemHeight = 55 * rY;
        const maxVisible = 8;

        if (this.selectedRewards.length === 0) {
            context.font = `${18 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = '#666666';
            context.fillText('No items selected', listX + listW / 2, itemStartY + 40 * rY);
            context.fillText('Click items on the left to add', listX + listW / 2, itemStartY + 70 * rY);
        }

        for (let i = 0; i < Math.min(this.selectedRewards.length, maxVisible); i++) {
            const reward = this.selectedRewards[i];
            const itemY = itemStartY + i * itemHeight;

            // Item background
            context.beginPath();
            context.roundRect(listX, itemY, listW, itemHeight - 8 * rY, 6 * rX);
            context.fillStyle = 'rgba(0, 255, 170, 0.1)';
            context.fill();
            context.strokeStyle = reward.rarity.color;
            context.lineWidth = 1 * rX;
            context.stroke();

            // Rarity bar
            context.fillStyle = reward.rarity.color;
            context.fillRect(listX, itemY, 4 * rX, itemHeight - 8 * rY);

            // Name
            context.font = `${16 * rX}px Arial`;
            context.textAlign = 'left';
            context.fillStyle = reward.rarity.color;
            context.fillText(reward.name, listX + 15 * rX, itemY + 22 * rY);

            // Remove hint
            context.font = `${12 * rX}px Arial`;
            context.textAlign = 'right';
            context.fillStyle = '#888888';
            context.fillText('click to remove', listX + listW - 10 * rX, itemY + 35 * rY);
        }

        if (this.selectedRewards.length > maxVisible) {
            context.font = `${16 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = '#ffaa00';
            context.fillText(`+${this.selectedRewards.length - maxVisible} more...`, listX + listW / 2, itemStartY + maxVisible * itemHeight + 20 * rY);
        }
    }
}
