/**
 * Forge UI - Crafting and Enhancement Interface
 * Allows players to:
 * 1. Enhance items (Star-Up from 0★ to 5★)
 * 2. Craft higher tier items from 5★ ingredients
 */

import { ModalWrapper } from './ModalWrapper';
import { UserProfile } from '../data/UserProfile';
import {
    ItemDefinition,
    ItemInstance,
    ItemTier,
    getItemById,
    getStatsWithStars,
    getEnhancementCost,
    canCraftItem,
    getItemsByTier,
    getRarityColor,
    getTierName
} from '../data/ItemSystem';

export class ForgeUI {
    private modal: ModalWrapper;
    private user: UserProfile;
    private onClose: () => void;
    private onUserUpdate?: (user: UserProfile) => void;
    private activeTab: 'enhance' | 'craft' = 'enhance';
    private selectedItem: ItemInstance | null = null;
    private selectedItemIndex: number = -1;  // Index in equipmentInventory
    private selectedRecipe: ItemDefinition | null = null;
    private contentArea!: HTMLElement;

    // Filter & Sort state
    private currentSort: 'name' | 'stars' | 'tier' = 'name';

    constructor(user: UserProfile, onClose: () => void, onUserUpdate?: (user: UserProfile) => void) {
        this.user = user;
        this.onClose = onClose;
        this.onUserUpdate = onUserUpdate;
        this.modal = new ModalWrapper('THE FORGE', onClose, '90%', '85%');
        this.init();
    }

    private init() {
        const content = this.modal.getContentArea();
        content.innerHTML = `
            <div class="forge-container">
                <div class="forge-header-bar">
                    <div class="forge-tabs"></div>
                    <div class="forge-resources">
                        <div class="resource-item" title="Polishing Powder">
                            <img src="/assets/craft/Polishing Powder.png" class="resource-icon" />
                            <span class="resource-count" id="powder-count">${this.user.polishingPowder || 0}</span>
                        </div>
                    </div>
                </div>
                <div class="forge-content"></div>
            </div>
            <style>
                .forge-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    gap: 20px;
                }
                .forge-header-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 20px;
                }
                .forge-tabs {
                    display: flex;
                    gap: 10px;
                }
                .forge-resources {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }
                .resource-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0,0,0,0.5);
                    padding: 8px 16px;
                    border-radius: 12px;
                    border: 1px solid #555;
                }
                .resource-icon {
                    width: 32px;
                    height: 32px;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }
                .resource-count {
                    color: #fbbf24;
                    font-weight: bold;
                    font-size: 1.1rem;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                }
                .forge-tab {
                    padding: 12px 32px;
                    background: rgba(0,0,0,0.4);
                    border: 2px solid #555;
                    border-radius: 12px;
                    color: #aaa;
                    font-weight: bold;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .forge-tab:hover {
                    border-color: #888;
                    color: #fff;
                }
                .forge-tab.active {
                    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
                    border-color: #a855f7;
                    color: #fff;
                }
                .forge-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 20px 20px;
                }
                .forge-section {
                    display: flex;
                    gap: 30px;
                    height: 100%;
                }
                .forge-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .forge-right {
                    width: 350px;
                    background: rgba(0,0,0,0.4);
                    border-radius: 15px;
                    padding: 20px;
                    border: 1px solid #444;
                }
                .tier-section {
                    margin-bottom: 20px;
                }
                .tier-header {
                    font-size: 1.1rem;
                    font-weight: bold;
                    color: #fff;
                    margin-bottom: 10px;
                    padding: 8px 12px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .tier-badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: bold;
                }
                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 12px;
                }
                .item-card {
                    background: rgba(0,0,0,0.5);
                    border: 2px solid #444;
                    border-radius: 12px;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .item-card:hover {
                    transform: translateY(-4px);
                    border-color: #888;
                }
                .item-card.selected {
                    border-color: #a855f7;
                    box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
                }
                .item-card img {
                    width: 64px;
                    height: 64px;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }
                .item-name {
                    font-size: 0.75rem;
                    color: #fff;
                    text-align: center;
                    font-weight: 500;
                }
                .item-stars {
                    color: #fbbf24;
                    font-size: 0.8rem;
                }
                .detail-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    height: 100%;
                }
                .detail-header {
                    text-align: center;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #444;
                }
                .detail-icon {
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 10px;
                    display: block;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
                }
                .detail-name {
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #fff;
                }
                .detail-rarity {
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-top: 4px;
                }
                .detail-stats {
                    background: rgba(0,0,0,0.3);
                    padding: 12px;
                    border-radius: 8px;
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    color: #ccc;
                    font-size: 0.9rem;
                }
                .stat-value {
                    color: #4ade80;
                    font-weight: bold;
                }
                .passive-box {
                    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
                    border: 1px solid #a855f7;
                    padding: 12px;
                    border-radius: 8px;
                }
                .passive-name {
                    color: #a855f7;
                    font-weight: bold;
                    font-size: 0.95rem;
                    margin-bottom: 4px;
                }
                .passive-desc {
                    color: #ccc;
                    font-size: 0.85rem;
                }
                .action-section {
                    margin-top: auto;
                }
                .enhance-btn, .craft-btn {
                    width: 100%;
                    padding: 14px;
                    border: none;
                    border-radius: 12px;
                    font-weight: bold;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .enhance-btn {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: #fff;
                }
                .craft-btn {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: #fff;
                }
                .enhance-btn:hover, .craft-btn:hover {
                    transform: scale(1.02);
                    filter: brightness(1.1);
                }
                .enhance-btn:disabled, .craft-btn:disabled {
                    background: #444;
                    cursor: not-allowed;
                    transform: none;
                    filter: grayscale(1);
                }
                .cost-info {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 12px;
                    color: #ccc;
                    font-size: 0.9rem;
                }
                .cost-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .recipe-display {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin: 15px 0;
                    padding: 15px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 10px;
                }
                .recipe-item {
                    text-align: center;
                }
                .recipe-item img {
                    width: 50px;
                    height: 50px;
                }
                .recipe-item .name {
                    font-size: 0.7rem;
                    color: #aaa;
                    margin-top: 4px;
                }
                .recipe-plus {
                    font-size: 1.5rem;
                    color: #888;
                }
                .recipe-arrow {
                    font-size: 1.5rem;
                    color: #4ade80;
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #666;
                    font-size: 1rem;
                }
                .empty-state-icon {
                    font-size: 3rem;
                    margin-bottom: 10px;
                }
                .filter-sort-bar {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                    margin-bottom: 15px;
                }
                .filter-group, .sort-group {
                    display: flex;
                    gap: 5px;
                    align-items: center;
                }
                .filter-label {
                    color: #888;
                    font-size: 0.85rem;
                    margin-right: 5px;
                }
                .filter-btn, .sort-btn {
                    padding: 6px 12px;
                    background: rgba(0,0,0,0.4);
                    border: 1px solid #444;
                    border-radius: 8px;
                    color: #aaa;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .filter-btn:hover, .sort-btn:hover {
                    border-color: #888;
                    color: #fff;
                }
                .filter-btn.active, .sort-btn.active {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-color: #60a5fa;
                    color: #fff;
                }
                .items-scroll-area {
                    flex: 1;
                    overflow-y: auto;
                    padding-right: 10px;
                }
            </style>
        `;

        const tabsContainer = content.querySelector('.forge-tabs') as HTMLElement;
        this.contentArea = content.querySelector('.forge-content') as HTMLElement;

        // Create tabs
        const enhanceTab = document.createElement('div');
        enhanceTab.className = 'forge-tab active';
        enhanceTab.textContent = '⬆️ ENHANCE';
        enhanceTab.onclick = () => this.switchTab('enhance');

        const craftTab = document.createElement('div');
        craftTab.className = 'forge-tab';
        craftTab.textContent = '🔨 CRAFT';
        craftTab.onclick = () => this.switchTab('craft');

        tabsContainer.appendChild(enhanceTab);
        tabsContainer.appendChild(craftTab);

        this.renderContent();
    }

    private switchTab(tab: 'enhance' | 'craft') {
        this.activeTab = tab;
        this.selectedItem = null;
        this.selectedRecipe = null;

        // Update tab styles
        const tabs = this.modal.getContentArea().querySelectorAll('.forge-tab');
        tabs.forEach((t, i) => {
            t.classList.toggle('active', (i === 0 && tab === 'enhance') || (i === 1 && tab === 'craft'));
        });

        this.renderContent();
    }

    private renderContent() {
        if (this.activeTab === 'enhance') {
            this.renderEnhanceTab();
        } else {
            this.renderCraftTab();
        }
    }

    private renderEnhanceTab() {
        // Get player's inventory items
        let playerItems = this.getPlayerItems();

        // Apply sorting
        playerItems = [...playerItems].sort((a, b) => {
            const itemA = getItemById(a.itemId);
            const itemB = getItemById(b.itemId);
            if (!itemA || !itemB) return 0;

            switch (this.currentSort) {
                case 'name':
                    return itemA.name.localeCompare(itemB.name);
                case 'stars':
                    return b.stars - a.stars; // Higher stars first
                case 'tier':
                    return itemB.tier - itemA.tier; // Higher tier first
                default:
                    return 0;
            }
        });

        this.contentArea.innerHTML = `
            <div class="forge-section">
                <div class="forge-left">
                    <div class="filter-sort-bar">
                        <div class="sort-group">
                            <span class="filter-label">Sort:</span>
                            <button class="sort-btn ${this.currentSort === 'name' ? 'active' : ''}" data-sort="name">Name</button>
                            <button class="sort-btn ${this.currentSort === 'stars' ? 'active' : ''}" data-sort="stars">★ Stars</button>
                            <button class="sort-btn ${this.currentSort === 'tier' ? 'active' : ''}" data-sort="tier">Tier</button>
                        </div>
                    </div>
                    <div class="items-scroll-area">
                        <div class="items-grid" id="player-items-grid"></div>
                    </div>
                </div>
                <div class="forge-right">
                    <div class="detail-panel" id="enhance-detail">
                        <div class="empty-state">
                            <div class="empty-state-icon">⚒️</div>
                            <div>Select an item to enhance</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add sort button handlers
        this.contentArea.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentSort = (btn as HTMLElement).dataset.sort as any;
                this.renderEnhanceTab();
            });
        });

        const grid = this.contentArea.querySelector('#player-items-grid') as HTMLElement;

        if (playerItems.length === 0) {
            grid.innerHTML = '<div style="color:#666;padding:20px;">No items in inventory. Obtain items from adventure maps!</div>';
        } else {
            playerItems.forEach((inst, index) => {
                const item = getItemById(inst.itemId);
                if (!item) return;

                const card = document.createElement('div');
                card.className = 'item-card';
                card.style.borderColor = getRarityColor(item.rarity);
                card.innerHTML = `
                    <img src="${item.icon}" alt="${item.name}" />
                    <div class="item-stars">${'★'.repeat(inst.stars)}${'☆'.repeat(5 - inst.stars)}</div>
                    <div class="item-name">${item.name}</div>
                `;
                // Find the original index in equipmentInventory for enhancement
                const originalIndex = this.user.equipmentInventory?.findIndex(
                    eq => eq.itemId === inst.itemId && eq.stars === inst.stars
                ) ?? -1;
                card.onclick = () => this.selectItemForEnhanceByIndex(originalIndex);
                grid.appendChild(card);
            });
        }
    }

    private selectItemForEnhance(inst: ItemInstance) {
        this.selectedItem = inst;
        const item = getItemById(inst.itemId);
        if (!item) return;

        const detailPanel = this.contentArea.querySelector('#enhance-detail') as HTMLElement;
        const currentStats = getStatsWithStars(item.baseStats, inst.stars);
        const nextStats = inst.stars < 5 ? getStatsWithStars(item.baseStats, inst.stars + 1) : null;
        const enhanceCost = inst.stars < 5 ? getEnhancementCost(item.tier, inst.stars + 1) : null;

        // Check all requirements for enhancement
        let canEnhance = false;
        let disableReason = '';

        if (enhanceCost) {
            const hasGold = this.user.gold >= enhanceCost.gold;
            const hasPowder = !enhanceCost.polishingPowder || (this.user.polishingPowder || 0) >= enhanceCost.polishingPowder;
            const hasDuplicate = !enhanceCost.duplicateRequired || (this.user.equipmentInventory?.filter(
                eq => eq.itemId === inst.itemId && eq.stars >= inst.stars
            ).length || 0) >= 2;

            canEnhance = hasGold && hasPowder && hasDuplicate;

            if (!hasGold) disableReason = 'Not enough Gold';
            else if (!hasPowder) disableReason = 'Not enough Polishing Powder';
            else if (!hasDuplicate) disableReason = 'Need duplicate item for 5★';
        }

        detailPanel.innerHTML = `
            <div class="detail-header">
                <img src="${item.icon}" class="detail-icon" />
                <div class="detail-name">${item.name}</div>
                <div class="detail-rarity" style="color: ${getRarityColor(item.rarity)}">
                    ${item.rarity} • ${item.slot}
                </div>
                <div class="item-stars" style="font-size:1.2rem;margin-top:8px;">
                    ${'★'.repeat(inst.stars)}${'☆'.repeat(5 - inst.stars)}
                </div>
            </div>

            <div class="detail-stats">
                <div style="font-weight:bold;color:#fff;margin-bottom:8px;">Current Stats</div>
                ${this.renderStats(currentStats as Record<string, number | undefined>)}
            </div>

            ${nextStats ? `
                <div class="detail-stats" style="border: 1px solid #4ade80;">
                    <div style="font-weight:bold;color:#4ade80;margin-bottom:8px;">After Enhancement (+1★)</div>
                    ${this.renderStatsComparison(currentStats as Record<string, number | undefined>, nextStats as Record<string, number | undefined>)}
                </div>
            ` : `
                <div class="detail-stats" style="border: 1px solid #f59e0b;">
                    <div style="font-weight:bold;color:#f59e0b;">MAX LEVEL - Ready to Craft!</div>
                </div>
            `}

            ${item.passiveEffect ? `
                <div class="passive-box">
                    <div class="passive-name">${item.passiveEffect.name}</div>
                    <div class="passive-desc">${item.passiveEffect.description}</div>
                </div>
            ` : ''}

            <div class="action-section">
                ${enhanceCost ? `
                    <div class="cost-info">
                        <div class="cost-item">🪙 ${enhanceCost.gold.toLocaleString()}</div>
                        ${enhanceCost.polishingPowder ? `<div class="cost-item">✨ ${enhanceCost.polishingPowder} Powder</div>` : ''}
                        ${enhanceCost.duplicateRequired ? `<div class="cost-item">📦 +1 Duplicate</div>` : ''}
                    </div>
                    ${!canEnhance && disableReason ? `<div style="text-align:center;color:#f87171;font-size:0.85rem;margin-bottom:10px;">${disableReason}</div>` : ''}
                    <button class="enhance-btn" id="enhance-action-btn" ${!canEnhance ? 'disabled' : ''}>
                        Enhance to ${inst.stars + 1}★
                    </button>
                ` : `
                    <button class="craft-btn" id="go-craft-btn">
                        Go to Crafting
                    </button>
                `}
            </div>
        `;

        // Add button event listeners
        const enhanceBtn = detailPanel.querySelector('#enhance-action-btn');
        if (enhanceBtn) {
            enhanceBtn.addEventListener('click', () => {
                this.enhanceItem(this.selectedItemIndex);
            });
        }

        const goCraftBtn = detailPanel.querySelector('#go-craft-btn');
        if (goCraftBtn) {
            goCraftBtn.addEventListener('click', () => {
                this.switchTab('craft');
            });
        }
    }

    private renderCraftTab() {
        this.contentArea.innerHTML = `
            <div class="forge-section">
                <div class="forge-left">
                    ${[2, 3, 4].map(tier => `
                        <div class="tier-section">
                            <div class="tier-header">
                                <span class="tier-badge" style="background: ${this.getTierColor(tier as ItemTier)};">T${tier}</span>
                                ${getTierName(tier as ItemTier)}
                            </div>
                            <div class="items-grid tier-${tier}-grid"></div>
                        </div>
                    `).join('')}
                </div>
                <div class="forge-right">
                    <div class="detail-panel" id="craft-detail">
                        <div class="empty-state">
                            <div class="empty-state-icon">🔨</div>
                            <div>Select a recipe to craft</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render items by tier
        [2, 3, 4].forEach(tier => {
            const grid = this.contentArea.querySelector(`.tier-${tier}-grid`) as HTMLElement;
            const items = getItemsByTier(tier as ItemTier);

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';
                card.style.borderColor = getRarityColor(item.rarity);
                card.innerHTML = `
                    <img src="${item.icon}" alt="${item.name}" />
                    <div class="item-name">${item.name}</div>
                `;
                card.onclick = () => this.selectRecipe(item);
                grid.appendChild(card);
            });
        });
    }

    private selectRecipe(item: ItemDefinition) {
        this.selectedRecipe = item;
        const recipe = item.recipe;
        if (!recipe) return;

        const ing1 = getItemById(recipe.ingredient1);
        const ing2 = getItemById(recipe.ingredient2);

        const detailPanel = this.contentArea.querySelector('#craft-detail') as HTMLElement;

        // Check if player can craft
        const playerItems = this.getPlayerItems();
        const craftCheck = canCraftItem(item.id, playerItems, this.user.gold);

        detailPanel.innerHTML = `
            <div class="detail-header">
                <img src="${item.icon}" class="detail-icon" />
                <div class="detail-name">${item.name}</div>
                <div class="detail-rarity" style="color: ${getRarityColor(item.rarity)}">
                    ${item.rarity} • ${item.slot}
                </div>
            </div>

            <div class="recipe-display">
                <div class="recipe-item">
                    <img src="${ing1?.icon}" />
                    <div class="name">${ing1?.name} (5★)</div>
                </div>
                <div class="recipe-plus">+</div>
                <div class="recipe-item">
                    <img src="${ing2?.icon}" />
                    <div class="name">${ing2?.name} (5★)</div>
                </div>
                <div class="recipe-arrow">→</div>
                <div class="recipe-item">
                    <img src="${item.icon}" />
                    <div class="name">${item.name} (0★)</div>
                </div>
            </div>

            <div class="detail-stats">
                <div style="font-weight:bold;color:#fff;margin-bottom:8px;">Base Stats</div>
                ${this.renderStats(item.baseStats as Record<string, number | undefined>)}
            </div>

            ${item.passiveEffect ? `
                <div class="passive-box">
                    <div class="passive-name">${item.passiveEffect.name}</div>
                    <div class="passive-desc">${item.passiveEffect.description}</div>
                </div>
            ` : ''}

            <div class="action-section">
                <div class="cost-info">
                    <div class="cost-item">🪙 ${recipe.goldCost.toLocaleString()}</div>
                </div>
                ${!craftCheck.canCraft ? `
                    <div style="text-align:center;color:#f87171;font-size:0.85rem;margin-bottom:10px;">
                        ${craftCheck.reason}
                    </div>
                ` : ''}
                <button class="craft-btn" id="craft-action-btn" ${!craftCheck.canCraft ? 'disabled' : ''}>
                    Forge Item
                </button>
            </div>
        `;

        // Add button event listener
        const craftBtn = detailPanel.querySelector('#craft-action-btn');
        if (craftBtn) {
            craftBtn.addEventListener('click', () => {
                this.craftItem(item.id);
            });
        }
    }

    private renderStats(stats: Record<string, number | undefined>): string {
        const statNames: Record<string, string> = {
            hp: 'Max HP',
            atk: 'Attack',
            armor: 'Defense',
            str: 'Strength',
            agi: 'Agility',
            int: 'Intelligence',
            moveSpeed: 'Move Speed',
            lifesteal: 'Lifesteal',
            critRate: 'Crit Rate',
            hitRate: 'Hit Rate',
            dodge: 'Dodge',
            damageReflect: 'Damage Reflect'
        };

        return Object.entries(stats)
            .filter(([_, v]) => v !== undefined && v > 0)
            .map(([key, value]) => `
                <div class="stat-row">
                    <span>${statNames[key] || key}</span>
                    <span class="stat-value">+${key.includes('Rate') || key === 'lifesteal' || key === 'dodge' || key === 'damageReflect' ? value + '%' : value}</span>
                </div>
            `).join('');
    }

    private renderStatsComparison(current: Record<string, number | undefined>, next: Record<string, number | undefined>): string {
        const statNames: Record<string, string> = {
            hp: 'Max HP', atk: 'Attack', armor: 'Defense', str: 'Strength',
            agi: 'Agility', int: 'Intelligence', moveSpeed: 'Move Speed',
            lifesteal: 'Lifesteal', critRate: 'Crit Rate', hitRate: 'Hit Rate',
            dodge: 'Dodge', damageReflect: 'Damage Reflect'
        };

        return Object.entries(next)
            .filter(([_, v]) => v !== undefined && v > 0)
            .map(([key, value]) => {
                const curr = current[key] || 0;
                const diff = (value || 0) - curr;
                const isPercent = key.includes('Rate') || key === 'lifesteal' || key === 'dodge' || key === 'damageReflect';
                return `
                    <div class="stat-row">
                        <span>${statNames[key] || key}</span>
                        <span class="stat-value">+${isPercent ? value + '%' : value} <span style="color:#4ade80;font-size:0.8rem;">(+${isPercent ? diff.toFixed(1) + '%' : diff})</span></span>
                    </div>
                `;
            }).join('');
    }

    private getTierColor(tier: ItemTier): string {
        switch (tier) {
            case 1: return '#9ca3af';
            case 2: return '#3b82f6';
            case 3: return '#a855f7';
            case 4: return '#f59e0b';
        }
    }

    // Get player items from UserProfile.equipmentInventory
    // Also checks legacy inventory and migrates equipment items
    private getPlayerItems(): ItemInstance[] {
        const items: ItemInstance[] = [];

        // First, add items from new equipmentInventory
        if (this.user.equipmentInventory) {
            this.user.equipmentInventory.forEach(eq => {
                items.push({
                    itemId: eq.itemId,
                    stars: eq.stars
                });
            });
        }

        // Also check legacy inventory for equipment items and migrate them
        if (this.user.inventory) {
            Object.entries(this.user.inventory).forEach(([itemId, count]) => {
                // Check if this is an equipment item in our new system
                const itemDef = getItemById(itemId);
                if (itemDef && count > 0) {
                    // Check if it's already in equipmentInventory
                    const alreadyMigrated = this.user.equipmentInventory?.some(eq => eq.itemId === itemId);
                    if (!alreadyMigrated) {
                        // Add each copy as a 0★ item
                        for (let i = 0; i < count; i++) {
                            items.push({
                                itemId: itemId,
                                stars: 0
                            });
                        }

                        // Migrate to new format (keep in both places for Backpack compatibility)
                        if (!this.user.equipmentInventory) {
                            this.user.equipmentInventory = [];
                        }
                        for (let i = 0; i < count; i++) {
                            this.user.equipmentInventory.push({ itemId: itemId, stars: 0 });
                        }

                        // Persist migration
                        this.persistChanges();
                    }
                }
            });
        }

        return items;
    }

    // Enhance an item (increase star level)
    private enhanceItem(index: number) {
        if (!this.user.equipmentInventory || index < 0) return;

        const equipment = this.user.equipmentInventory[index];
        if (!equipment || equipment.stars >= 5) return;

        const item = getItemById(equipment.itemId);
        if (!item) return;

        const cost = getEnhancementCost(item.tier, equipment.stars + 1);
        if (!cost) return;

        // Check resources
        if (this.user.gold < cost.gold) {
            console.log('[Forge] Not enough gold');
            return;
        }

        if (cost.polishingPowder && (this.user.polishingPowder || 0) < cost.polishingPowder) {
            console.log('[Forge] Not enough polishing powder');
            return;
        }

        // Check for duplicate if required
        if (cost.duplicateRequired) {
            const duplicateIndex = this.user.equipmentInventory.findIndex(
                (eq, i) => i !== index && eq.itemId === equipment.itemId && eq.stars >= equipment.stars
            );
            if (duplicateIndex === -1) {
                console.log('[Forge] No duplicate found for sacrifice');
                return;
            }
            // Remove duplicate
            this.user.equipmentInventory.splice(duplicateIndex, 1);
            // Adjust index if needed
            if (duplicateIndex < index) {
                this.selectedItemIndex--;
            }
        }

        // Deduct resources
        this.user.gold -= cost.gold;
        if (cost.polishingPowder) {
            this.user.polishingPowder = (this.user.polishingPowder || 0) - cost.polishingPowder;
        }

        // Upgrade item
        equipment.stars++;

        // Persist changes
        this.persistChanges();

        // Update resource display
        this.updateResourceDisplay();

        // Re-render
        this.renderContent();

        // Re-select to show updated stats
        if (this.selectedItemIndex >= 0 && this.user.equipmentInventory[this.selectedItemIndex]) {
            this.selectItemForEnhanceByIndex(this.selectedItemIndex);
        }

        console.log(`[Forge] Enhanced ${item.name} to ${equipment.stars}★`);
    }

    // Update the resource display in the header
    private updateResourceDisplay() {
        const powderEl = this.modal.getContentArea().querySelector('#powder-count');
        if (powderEl) {
            powderEl.textContent = String(this.user.polishingPowder || 0);
        }
    }

    // Craft a new item from 5★ ingredients
    private craftItem(itemId: string) {
        const item = getItemById(itemId);
        if (!item || !item.recipe) return;

        const { ingredient1, ingredient2, goldCost } = item.recipe;

        if (!this.user.equipmentInventory) {
            this.user.equipmentInventory = [];
        }

        // Find ingredients
        const ing1Idx = this.user.equipmentInventory.findIndex(eq => eq.itemId === ingredient1 && eq.stars >= 5);
        const ing2Idx = this.user.equipmentInventory.findIndex(eq => eq.itemId === ingredient2 && eq.stars >= 5);

        if (ing1Idx === -1 || ing2Idx === -1) {
            console.log('[Forge] Missing ingredients');
            return;
        }

        if (this.user.gold < goldCost) {
            console.log('[Forge] Not enough gold');
            return;
        }

        // Remove ingredients (remove higher index first to avoid shifting issues)
        const indicesToRemove = [ing1Idx, ing2Idx].sort((a, b) => b - a);
        indicesToRemove.forEach(i => this.user.equipmentInventory!.splice(i, 1));

        // Deduct gold
        this.user.gold -= goldCost;

        // Add new item at 0★
        this.user.equipmentInventory.push({ itemId: itemId, stars: 0 });

        // Persist changes
        this.persistChanges();

        // Re-render
        this.renderContent();

        console.log(`[Forge] Crafted ${item.name}!`);
    }

    private persistChanges() {
        // Save to localStorage
        localStorage.setItem('awengers_session', JSON.stringify(this.user));

        // Notify parent of update
        if (this.onUserUpdate) {
            this.onUserUpdate(this.user);
        }
    }

    private selectItemForEnhanceByIndex(index: number) {
        if (!this.user.equipmentInventory || index < 0) return;
        const equipment = this.user.equipmentInventory[index];
        if (!equipment) return;

        this.selectedItemIndex = index;
        this.selectItemForEnhance({ itemId: equipment.itemId, stars: equipment.stars });
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public destroy() {
        this.modal.close();
    }
}
