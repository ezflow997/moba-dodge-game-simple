import { Button, superFunctions } from "./supers.js";
import { REWARDS, CATEGORY, RARITY } from "../controller/rewardTypes.js";
import { adRewards } from "../poki/adRewards.js";

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

// Group type info for all categories
const GROUP_TYPE_INFO = {
    // Cooldown groups
    'q_cooldown': { name: 'Q Cooldown', order: 0 },
    'e_cooldown': { name: 'E Cooldown', order: 1 },
    'f_cooldown': { name: 'F Cooldown', order: 2 },
    // Survivability groups
    'extra_life': { name: 'Extra Lives', order: 0 },
    'shield': { name: 'Shields', order: 1 },
    'shrink': { name: 'Size Reduction', order: 2 },
    // Movement groups
    'speed': { name: 'Speed Boost', order: 0 },
    'dash': { name: 'Dash Distance', order: 1 },
    'phase': { name: 'Phase', order: 2 },
    // Offense groups
    'score_mult': { name: 'Score Multiplier', order: 0 },
    'bullet_size': { name: 'Bullet Size', order: 1 },
    'range': { name: 'Range', order: 2 },
    'aura': { name: 'Damage Aura', order: 3 }
};

// Helper to determine item group type based on properties
function getItemGroupType(reward) {
    if (!reward) return 'other';

    // Gun category uses gunType directly
    if (reward.category === CATEGORY.GUN) {
        return reward.gunType || 'other';
    }

    // Cooldown - check ability property
    if (reward.category === CATEGORY.COOLDOWN) {
        if (reward.ability === 'q') return 'q_cooldown';
        if (reward.ability === 'e') return 'e_cooldown';
        if (reward.ability === 'f') return 'f_cooldown';
        return 'other';
    }

    // Survivability - check specific properties
    if (reward.category === CATEGORY.SURVIVABILITY) {
        if (reward.lives !== undefined) return 'extra_life';
        if (reward.blockCount !== undefined) return 'shield';
        if (reward.sizeReduction !== undefined) return 'shrink';
        return 'other';
    }

    // Movement - check specific properties
    if (reward.category === CATEGORY.MOVEMENT) {
        if (reward.speedBoost !== undefined) return 'speed';
        if (reward.dashDistanceMod !== undefined) return 'dash';
        if (reward.phaseDuration !== undefined) return 'phase';
        return 'other';
    }

    // Offense - check specific properties
    if (reward.category === CATEGORY.OFFENSE) {
        if (reward.scoreMultiplier !== undefined) return 'score_mult';
        if (reward.sizeMultiplier !== undefined) return 'bullet_size';
        if (reward.auraRadius !== undefined) return 'aura';
        if (reward.rangeMultiplier !== undefined) return 'range';
        return 'other';
    }

    return 'other';
}

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

        // Collapsed groups (for all categories) - collapsed by default
        this.collapsedGroups = {
            // Gun types
            'shotgun': true,
            'rapidfire': true,
            'piercing': true,
            'ricochet': true,
            'homing': true,
            'twin': true,
            'nova': true,
            'chain': true,
            // Cooldown groups
            'q_cooldown': true,
            'e_cooldown': true,
            'f_cooldown': true,
            // Survivability groups
            'extra_life': true,
            'shield': true,
            'shrink': true,
            // Movement groups
            'speed': true,
            'dash': true,
            'phase': true,
            // Offense groups
            'score_mult': true,
            'bullet_size': true,
            'range': true,
            'aura': true
        };

        // Selected item for purchase
        this.selectedReward = null;
        this.purchaseMode = null; // 'single' or 'permanent'

        // Buttons
        this.closeButton = new Button(0, 0, 180, 60, "Close", 28, 0, 0, false, true, 'white', 'white');
        this.buyOneButton = new Button(0, 0, 160, 50, "Buy 1x", 22, 0, 0, false, true, 'white', 'white');
        this.buyPermButton = new Button(0, 0, 160, 50, "Unlock", 22, 0, 0, false, true, 'white', 'white');
        this.watchAdButton = new Button(0, 0, 160, 45, "Watch Ad", 20, 0, 0, false, true, '#ffdd00', '#ffdd00');

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

    // Get display items for current category with collapsible separators
    getDisplayItems() {
        const rewards = this.rewardsByCategory[this.selectedCategory] || [];

        if (rewards.length === 0) return [];

        // Group items by type with separators (works for all categories)
        const groups = {};
        for (const reward of rewards) {
            const groupType = getItemGroupType(reward);
            if (!groups[groupType]) groups[groupType] = [];
            groups[groupType].push(reward);
        }

        // Get the appropriate type info based on category
        const typeInfo = this.selectedCategory === CATEGORY.GUN ? GUN_TYPE_INFO : GROUP_TYPE_INFO;

        // Sort groups by order and build result with separators
        const result = [];
        const sortedTypes = Object.keys(groups).sort((a, b) => {
            const orderA = typeInfo[a]?.order ?? 99;
            const orderB = typeInfo[b]?.order ?? 99;
            return orderA - orderB;
        });

        for (const groupType of sortedTypes) {
            const typeName = typeInfo[groupType]?.name || groupType;
            const isCollapsed = this.collapsedGroups[groupType] === true;
            const itemCount = groups[groupType].length;

            // Add separator
            result.push({
                isSeparator: true,
                separatorName: typeName,
                groupType: groupType,
                isCollapsed: isCollapsed,
                itemCount: itemCount
            });

            // Add items only if not collapsed
            if (!isCollapsed) {
                for (const reward of groups[groupType]) {
                    result.push({ isSeparator: false, reward });
                }
            }
        }
        return result;
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

        // Click outside to close (using reference coordinates)
        const rX = window.innerWidth / 2560;
        const rY = window.innerHeight / 1440;
        const panelLeft = (1280 - 700) * rX;
        const panelRight = (1280 + 700) * rX;
        const panelTop = (720 - 450) * rY;
        const panelBottom = (720 + 450) * rY;

        if (clicking && !this.clicked) {
            if (inX < panelLeft || inX > panelRight || inY < panelTop || inY > panelBottom) {
                this.clicked = true;
                this.hide();
                return true;
            }
        }

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

        // Update Watch Ad button (positioned near points display at top right)
        const refPanelRight = refCenterX + 700;
        this.watchAdButton.x = refPanelRight - 190;
        this.watchAdButton.y = refPanelTop + 70;
        this.watchAdButton.update(inX, inY);

        // Handle Watch Ad click (only if on Poki and not on cooldown)
        if (this.watchAdButton.isHovered && clicking && !this.clicked) {
            this.clicked = true;
            if (adRewards.isOnPoki() && adRewards.canWatchAd()) {
                if (window.gameSound) window.gameSound.playMenuClick();
                adRewards.watchAdForReward(game);
            }
        }

        // Handle ad reward notification dismiss
        if (adRewards.hasNotification() && clicking && !this.clicked) {
            this.clicked = true;
            adRewards.dismissNotification();
        }

        // Handle item grid clicks and scrolling
        // Grid coordinates (matching draw function)
        const refPanelLeft = refCenterX - 700; // Panel half-width is 700
        const gridLeft = refPanelLeft + 30;    // 610 in reference coords
        const gridTop = refPanelTop + 150;
        const gridBottom = refPanelBottom - 100;
        const gridHeight = gridBottom - gridTop;
        const gridWidth = 950;

        // Calculate content height for current category with separators
        const displayItems = this.getDisplayItems();
        const itemHeight = 80;
        const separatorHeight = 35;
        let contentHeight = 0;
        for (const item of displayItems) {
            contentHeight += item.isSeparator ? separatorHeight : itemHeight;
        }
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
                this.scrollOffset = this.scrollbarDragStartOffset - scrollRatio * this.maxScrollOffset;
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
            this.scrollOffset += game.input.wheelDelta > 0 ? 60 : -60;
            this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset));
        }

        // Handle item selection (don't select when dragging scrollbar)
        if (clicking && !this.clicked && !this.isDraggingScrollbar &&
            inX >= gridLeftPx && inX <= gridRightPx && inY >= gridTopPx && inY <= gridBottomPx) {
            // Find which item was clicked accounting for separators
            const relY = (inY - gridTopPx) / rY + this.scrollOffset;

            let accumulatedHeight = 0;
            let clickedItem = null;
            let clickedSeparator = null;
            for (const item of displayItems) {
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
            if (clickedSeparator && clickedSeparator.groupType) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.collapsedGroups[clickedSeparator.groupType] = !this.collapsedGroups[clickedSeparator.groupType];
            }
            // Handle item click
            else if (clickedItem) {
                this.clicked = true;
                if (window.gameSound) window.gameSound.playMenuClick();
                this.selectedReward = clickedItem.reward;
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

        // Draw Watch Ad button
        this.watchAdButton.draw(context);

        // Show overlay on Watch Ad button if not on Poki or on cooldown
        if (!adRewards.isOnPoki()) {
            const btnX = this.watchAdButton.x * rX;
            const btnY = this.watchAdButton.y * rY;
            const btnW = this.watchAdButton.w * rX;
            const btnH = this.watchAdButton.h * rY;

            context.fillStyle = 'rgba(0, 0, 0, 0.75)';
            context.fillRect(btnX, btnY, btnW, btnH);
            context.fillStyle = '#888888';
            context.font = `bold ${14 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillText('Poki Only', btnX + btnW / 2, btnY + btnH / 2 + 5 * rY);
        } else if (!adRewards.canWatchAd()) {
            const remaining = adRewards.getCooldownRemaining();
            const btnX = this.watchAdButton.x * rX;
            const btnY = this.watchAdButton.y * rY;
            const btnW = this.watchAdButton.w * rX;
            const btnH = this.watchAdButton.h * rY;

            context.fillStyle = 'rgba(0, 0, 0, 0.6)';
            context.fillRect(btnX, btnY, btnW, btnH);
            context.fillStyle = '#ffdd00';
            context.font = `bold ${18 * rX}px Arial`;
            context.textAlign = 'center';
            context.fillText(`${remaining}s`, btnX + btnW / 2, btnY + btnH / 2 + 6 * rY);
        }

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

        // Update and draw ad reward notification (on top of everything)
        adRewards.update();
        adRewards.draw(context, game);
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
        const gridHeight = panelH - 250 * rY; // 150 top offset + 100 bottom offset

        // Clip region
        context.save();
        context.beginPath();
        context.rect(gridLeft, gridTop, gridWidth, gridHeight);
        context.clip();

        const displayItems = this.getDisplayItems();
        const itemHeight = 80 * rY;
        const separatorHeight = 35 * rY;

        // Calculate Y positions accounting for separators
        let currentY = gridTop - this.scrollOffset * rY;

        for (let i = 0; i < displayItems.length; i++) {
            const item = displayItems[i];
            const thisHeight = item.isSeparator ? separatorHeight : itemHeight;

            // Skip if outside visible area
            if (currentY + thisHeight < gridTop) {
                currentY += thisHeight;
                continue;
            }
            if (currentY > gridTop + gridHeight) break;

            if (item.isSeparator) {
                // Draw separator background (clickable area)
                context.fillStyle = 'rgba(255, 204, 0, 0.08)';
                context.fillRect(gridLeft + 5 * rX, currentY + 2 * rY, gridWidth - 10 * rX, separatorHeight - 4 * rY);

                // Draw collapse arrow
                context.fillStyle = '#ffcc00';
                context.font = `${14 * rX}px Arial`;
                context.textAlign = 'left';
                const arrow = item.isCollapsed ? '▶' : '▼';
                context.fillText(arrow, gridLeft + 12 * rX, currentY + 23 * rY);

                // Draw separator name
                context.font = `bold ${15 * rX}px Arial`;
                context.fillText(item.separatorName, gridLeft + 32 * rX, currentY + 23 * rY);

                // Draw item count
                context.font = `${13 * rX}px Arial`;
                context.textAlign = 'right';
                context.fillStyle = '#888888';
                context.fillText(`(${item.itemCount})`, gridLeft + gridWidth - 15 * rX, currentY + 23 * rY);

                // Draw subtle line
                context.strokeStyle = 'rgba(255, 204, 0, 0.2)';
                context.lineWidth = 1 * rX;
                context.beginPath();
                context.moveTo(gridLeft + 15 * rX, currentY + 32 * rY);
                context.lineTo(gridLeft + gridWidth - 15 * rX, currentY + 32 * rY);
                context.stroke();
            } else {
                const reward = item.reward;
                const isSelected = this.selectedReward && this.selectedReward.id === reward.id;
                const owned = this.getOwnedQuantity(reward.id);
                const isPerm = this.isPermanentlyUnlocked(reward.id);

                // Item background
                context.beginPath();
                context.roundRect(gridLeft + 5 * rX, currentY + 5 * rY, gridWidth - 10 * rX, itemHeight - 10 * rY, 8 * rX);

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
                context.fillRect(gridLeft + 5 * rX, currentY + 5 * rY, 6 * rX, itemHeight - 10 * rY);

                // Item name
                context.font = `bold ${18 * rX}px Arial`;
                context.textAlign = 'left';
                context.fillStyle = reward.rarity.color;
                context.fillText(reward.name, gridLeft + 25 * rX, currentY + 28 * rY);

                // Description (truncated)
                context.font = `${14 * rX}px Arial`;
                context.fillStyle = '#aaaaaa';
                const desc = reward.description.length > 50
                    ? reward.description.substring(0, 47) + '...'
                    : reward.description;
                context.fillText(desc, gridLeft + 25 * rX, currentY + 50 * rY);

                // Right side info
                context.textAlign = 'right';

                // Price
                const price = SINGLE_USE_PRICES[reward.rarity.name] || 0;
                context.font = `${16 * rX}px Arial`;
                context.fillStyle = '#ffcc00';
                context.fillText(`${price} pts`, gridLeft + gridWidth - 20 * rX, currentY + 28 * rY);

                // Owned/Rarity on second line
                context.font = `${13 * rX}px Arial`;
                if (isPerm) {
                    context.fillStyle = '#00ff88';
                    context.fillText('UNLOCKED', gridLeft + gridWidth - 20 * rX, currentY + 50 * rY);
                } else if (owned > 0) {
                    context.fillStyle = '#88ffff';
                    context.fillText(`Owned: ${owned}`, gridLeft + gridWidth - 20 * rX, currentY + 50 * rY);
                } else {
                    context.fillStyle = reward.rarity.color;
                    context.fillText(reward.rarity.name, gridLeft + gridWidth - 20 * rX, currentY + 50 * rY);
                }
            }

            currentY += thisHeight;
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
