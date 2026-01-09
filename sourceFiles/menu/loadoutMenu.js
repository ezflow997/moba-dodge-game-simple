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

// Gun type display names and order
const GUN_TYPE_INFO = {
    'shotgun': { name: 'Shotguns', order: 0 },
    'rapidfire': { name: 'Rapid Fire', order: 1 },
    'piercing': { name: 'Piercing', order: 2 },
    'ricochet': { name: 'Ricochet', order: 3 },
    'homing': { name: 'Homing', order: 4 },
    'twin': { name: 'Twin Shot', order: 5 },
    'nova': { name: 'Nova', order: 6 },
    'chain': { name: 'Chain Lightning', order: 7 }
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

        // Category tabs
        this.categories = Object.keys(CATEGORY_INFO);
        this.selectedCategory = CATEGORY.GUN;

        // Category tab buttons
        this.categoryButtons = {};
        for (const cat of this.categories) {
            this.categoryButtons[cat] = new Button(0, 0, 110, 40, CATEGORY_INFO[cat].name, 14, 0, 0, false, true, 'white', 'white');
        }

        // Scrolling
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.isDraggingScrollbar = false;
        this.scrollbarDragStartY = 0;
        this.scrollbarDragStartOffset = 0;

        // Collapsed groups (for gun types)
        this.collapsedGroups = {}; // { gunType: true/false }

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
        this.selectedCategory = CATEGORY.GUN;
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

    // Get available items for current category (owned quantity > 0 or permanently unlocked)
    // For weapons, groups items by gun type with separators
    getAvailableItems() {
        const items = [];
        for (const [rewardId, data] of Object.entries(this.inventory)) {
            if (data.permanentUnlock || data.quantity > 0) {
                const reward = Object.values(REWARDS).find(r => r.id === rewardId);
                // Filter by selected category
                if (reward && reward.category === this.selectedCategory) {
                    items.push({
                        reward,
                        quantity: data.quantity,
                        isPermanent: data.permanentUnlock,
                        isSeparator: false
                    });
                }
            }
        }

        // For weapons category, group by gun type with separators
        if (this.selectedCategory === CATEGORY.GUN && items.length > 0) {
            // Group by gun type
            const groups = {};
            for (const item of items) {
                const gunType = item.reward.gunType || 'other';
                if (!groups[gunType]) groups[gunType] = [];
                groups[gunType].push(item);
            }

            // Sort groups by order and build result with separators
            const result = [];
            const sortedTypes = Object.keys(groups).sort((a, b) => {
                const orderA = GUN_TYPE_INFO[a]?.order ?? 99;
                const orderB = GUN_TYPE_INFO[b]?.order ?? 99;
                return orderA - orderB;
            });

            for (const gunType of sortedTypes) {
                const typeName = GUN_TYPE_INFO[gunType]?.name || gunType;
                const isCollapsed = this.collapsedGroups[gunType] === true;
                const itemCount = groups[gunType].length;

                // Add separator with collapse info
                result.push({
                    isSeparator: true,
                    separatorName: typeName,
                    gunType: gunType,
                    isCollapsed: isCollapsed,
                    itemCount: itemCount
                });

                // Add items only if not collapsed
                if (!isCollapsed) {
                    result.push(...groups[gunType]);
                }
            }
            return result;
        }

        return items;
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

        // Update category buttons
        const refPanelLeft = refCenterX - 600;
        const catBtnY = refPanelTop + 95;
        const catBtnStartX = refPanelLeft + 40;

        for (let i = 0; i < this.categories.length; i++) {
            const cat = this.categories[i];
            const btn = this.categoryButtons[cat];
            btn.x = catBtnStartX + i * 120;
            btn.y = catBtnY;
            btn.w = 110;
            btn.h = 40;
            btn.update(inX, inY);

            if (btn.isHovered && clicking && !this.clicked) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedCategory = cat;
                this.scrollOffset = 0;
            }
        }

        // Handle scrolling
        const available = this.getAvailableItems();
        const itemHeight = 70;
        const separatorHeight = 35;

        // Calculate total content height accounting for separators
        let contentHeight = 0;
        for (const item of available) {
            contentHeight += item.isSeparator ? separatorHeight : itemHeight;
        }

        // Grid coordinates (matching draw function)
        const gridLeft = refPanelLeft + 30;    // List starts at panelX + 30
        const gridTop = refPanelTop + 160;     // Adjusted for category tabs
        const gridWidth = 730;
        const gridHeight = refPanelH - 300;
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
            const relY = (inY - gridTopPx) / rY + this.scrollOffset;

            // Find which item was clicked accounting for different heights
            let accumulatedHeight = 0;
            let clickedItem = null;
            let clickedSeparator = null;
            for (const item of available) {
                const thisHeight = item.isSeparator ? separatorHeight : itemHeight;
                if (relY >= accumulatedHeight && relY < accumulatedHeight + thisHeight) {
                    if (item.isSeparator) {
                        clickedSeparator = item;
                    } else {
                        clickedItem = item;
                    }
                    break;
                }
                accumulatedHeight += thisHeight;
            }

            // Handle separator click - toggle collapse
            if (clickedSeparator && clickedSeparator.gunType) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.collapsedGroups[clickedSeparator.gunType] = !this.collapsedGroups[clickedSeparator.gunType];
            }
            // Handle item click
            else if (clickedItem) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();

                // Toggle: if selected, remove; if not selected, try to add
                if (this.getSelectedCount(clickedItem.reward.id) > 0) {
                    this.removeReward(clickedItem.reward.id);
                } else {
                    this.addReward(clickedItem.reward);
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
        context.font = `${18 * rX}px Arial`;
        context.fillStyle = '#aaaaaa';
        context.fillText('Click to select rewards for your next game', centerX, panelY + 82 * rY);

        // Draw category tabs
        this.drawCategoryTabs(context, rX, rY, panelX, panelY);

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

    drawCategoryTabs(context, rX, rY, panelX, panelY) {
        const tabY = panelY + 95 * rY;
        const tabStartX = panelX + 40 * rX;

        for (let i = 0; i < this.categories.length; i++) {
            const cat = this.categories[i];
            const btn = this.categoryButtons[cat];
            const bx = tabStartX + i * 120 * rX;
            const by = tabY;
            const bw = 110 * rX;
            const bh = 40 * rY;

            const isActive = cat === this.selectedCategory;

            context.beginPath();
            context.roundRect(bx, by, bw, bh, 6 * rX);

            if (isActive) {
                context.fillStyle = 'rgba(0, 255, 170, 0.25)';
                context.fill();
                context.strokeStyle = '#00ffaa';
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

            context.font = `${14 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = isActive ? '#00ffaa' : '#aaaaaa';
            context.fillText(CATEGORY_INFO[cat].name, bx + bw / 2, by + bh / 2 + 5 * rY);
        }
    }

    drawAvailableItems(context, rX, rY, panelX, panelY, panelH) {
        const listX = panelX + 30 * rX;
        const listY = panelY + 145 * rY;
        const listW = 730 * rX;
        const listH = panelH - 290 * rY;

        // List header removed - category tabs show the current category
        const gridTop = listY;

        // Clip region
        context.save();
        context.beginPath();
        context.rect(listX, gridTop, listW, listH);
        context.clip();

        const available = this.getAvailableItems();
        const itemHeight = 70 * rY;
        const separatorHeight = 35 * rY;
        const categoryName = CATEGORY_INFO[this.selectedCategory]?.name || 'items';

        if (available.length === 0) {
            context.font = `${18 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = '#666666';
            context.fillText(`No ${categoryName.toLowerCase()} owned`, listX + listW / 2, gridTop + 60 * rY);
            context.fillText('Visit the Shop to purchase!', listX + listW / 2, gridTop + 90 * rY);
        }

        // Calculate Y positions accounting for separators
        let currentY = gridTop - this.scrollOffset * rY;

        for (let i = 0; i < available.length; i++) {
            const item = available[i];
            const thisHeight = item.isSeparator ? separatorHeight : itemHeight;

            // Skip if outside visible area
            if (currentY + thisHeight < gridTop) {
                currentY += thisHeight;
                continue;
            }
            if (currentY > gridTop + listH) break;

            if (item.isSeparator) {
                // Draw separator background (clickable area)
                context.fillStyle = 'rgba(0, 255, 170, 0.08)';
                context.fillRect(listX + 5 * rX, currentY + 2 * rY, listW - 10 * rX, separatorHeight - 4 * rY);

                // Draw collapse arrow
                context.fillStyle = '#00ffaa';
                context.font = `${14 * rX}px Arial`;
                context.textAlign = 'left';
                const arrow = item.isCollapsed ? '▶' : '▼';
                context.fillText(arrow, listX + 12 * rX, currentY + 23 * rY);

                // Draw separator name
                context.font = `bold ${15 * rX}px Arial`;
                context.fillText(item.separatorName, listX + 32 * rX, currentY + 23 * rY);

                // Draw item count
                context.font = `${13 * rX}px Arial`;
                context.textAlign = 'right';
                context.fillStyle = '#888888';
                context.fillText(`(${item.itemCount})`, listX + listW - 15 * rX, currentY + 23 * rY);

                // Draw subtle line
                context.strokeStyle = 'rgba(0, 255, 170, 0.2)';
                context.lineWidth = 1 * rX;
                context.beginPath();
                context.moveTo(listX + 15 * rX, currentY + 32 * rY);
                context.lineTo(listX + listW - 15 * rX, currentY + 32 * rY);
                context.stroke();
            } else {
                // Draw regular item
                const isSelected = this.getSelectedCount(item.reward.id) > 0;
                const canAdd = this.canAddReward(item.reward.id);
                const isDisabled = !isSelected && !canAdd;

                // Item background
                context.beginPath();
                context.roundRect(listX + 5 * rX, currentY + 3 * rY, listW - 10 * rX, itemHeight - 6 * rY, 8 * rX);

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
                context.fillRect(listX + 5 * rX, currentY + 3 * rY, 5 * rX, itemHeight - 6 * rY);

                // Item name
                context.font = `bold ${16 * rX}px Arial`;
                context.textAlign = 'left';
                context.fillStyle = isDisabled ? '#666666' : item.reward.rarity.color;
                context.fillText(item.reward.name, listX + 20 * rX, currentY + 25 * rY);

                // Description (truncated)
                context.font = `${13 * rX}px Arial`;
                context.fillStyle = isDisabled ? '#555555' : '#aaaaaa';
                const desc = item.reward.description.length > 45
                    ? item.reward.description.substring(0, 42) + '...'
                    : item.reward.description;
                context.fillText(desc, listX + 20 * rX, currentY + 45 * rY);

                // Right side info - quantity and status on separate lines
                context.font = `${14 * rX}px Arial`;
                context.textAlign = 'right';

                // Status indicator
                if (isSelected) {
                    context.fillStyle = '#00ffaa';
                    context.fillText('SELECTED', listX + listW - 15 * rX, currentY + 25 * rY);
                } else if (isDisabled && item.reward.category === CATEGORY.GUN) {
                    context.fillStyle = '#ff6666';
                    context.fillText('Locked', listX + listW - 15 * rX, currentY + 25 * rY);
                } else if (item.isPermanent) {
                    context.fillStyle = '#00ff88';
                    context.fillText('UNLIMITED', listX + listW - 15 * rX, currentY + 25 * rY);
                } else {
                    context.fillStyle = '#88ffff';
                    context.fillText(`x${item.quantity}`, listX + listW - 15 * rX, currentY + 25 * rY);
                }

                // Rarity on second line
                context.font = `${12 * rX}px Arial`;
                context.fillStyle = isDisabled ? '#444444' : item.reward.rarity.color;
                context.fillText(item.reward.rarity.name, listX + listW - 15 * rX, currentY + 45 * rY);
            }

            currentY += thisHeight;
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
