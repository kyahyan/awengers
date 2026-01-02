
import { UserProfile } from '../data/UserProfile';
import { ModalWrapper } from './ModalWrapper';

export interface ShopItem {
    id: string;
    name: string;
    xpAmount?: number;
    coinAmount?: number;
    materialAmount?: number; // For materials like polishing powder
    cost: number;
    currencyType?: 'gem' | 'coin';
    icon: string;
    description: string;
    itemType?: 'xp' | 'summon' | 'coin' | 'tier1_item' | 'material';
    quantity?: number;
    stats?: { [key: string]: number };
}

export const SHOP_ITEMS: ShopItem[] = [
    // XP Potions
    { id: 'xp_small', name: 'Small XP Potion', xpAmount: 100, cost: 500, icon: 'small', description: '+100 XP', itemType: 'xp' },
    { id: 'xp_medium', name: 'Medium XP Potion', xpAmount: 1000, cost: 2000, icon: 'medium', description: '+1,000 XP', itemType: 'xp' },
    { id: 'xp_large', name: 'Large XP Potion', xpAmount: 10000, cost: 10000, icon: 'large', description: '+10,000 XP', itemType: 'xp' },
    // Grand Summon Scrolls
    { id: 'grand_summon_8', name: 'Grand Summon x8', quantity: 8, cost: 1000, icon: 'grand-summon', description: '8 Grand Summon Scrolls', itemType: 'summon' },
    { id: 'grand_summon_1', name: 'Grand Summon x1', quantity: 1, cost: 150, icon: 'grand-summon', description: '1 Grand Summon Scroll', itemType: 'summon' },
    // Polishing Powder (for item enhancement)
    { id: 'polish_powder_5', name: 'Polishing Powder x5', materialAmount: 5, cost: 50, currencyType: 'gem', icon: 'Polishing Powder', description: '5 Polishing Powder for item enhancement', itemType: 'material' },
    { id: 'polish_powder_box', name: 'Box of Polishing Powder', materialAmount: 50, cost: 400, currencyType: 'gem', icon: 'Polishing Powder', description: '50 Polishing Powder - Best Value!', itemType: 'material' },
    // Coin Packs
    { id: 'coin_few', name: 'Few Coins', coinAmount: 500000, cost: 100, icon: 'few-coin', description: '500,000 Coins', itemType: 'coin' },
    { id: 'coin_bag', name: 'Bag of Coins', coinAmount: 1500000, cost: 499, icon: 'bag-coins', description: '1,500,000 Coins', itemType: 'coin' },
    // Unavailable Items (Coming Soon)
    { id: 'common_summon', name: 'Common Summon', quantity: 1, cost: 0, icon: 'common-summon', description: 'Coming Soon...', itemType: 'summon' },
    { id: 'mythic_summon', name: 'Mythic Summon', quantity: 1, cost: 0, icon: 'mythic-summon', description: 'Coming Soon...', itemType: 'summon' },
    { id: 'shards', name: 'Hero Shards', quantity: 1, cost: 0, icon: 'shards', description: 'Coming Soon...', itemType: 'summon' },
    // Tier 1 Items (Cost: 500 Coins)
    { id: 'iron_leaf', name: 'Iron Leaf', cost: 500, currencyType: 'coin', icon: 'Iron Leaf', description: '+5 Defense', itemType: 'tier1_item', stats: { defense: 5 } },
    { id: 'bear_claw', name: 'Bear Claw', cost: 500, currencyType: 'coin', icon: 'Bear Claw', description: '+5 Strength', itemType: 'tier1_item', stats: { strength: 5 } },
    { id: 'swift_paw', name: 'Swift Paw', cost: 500, currencyType: 'coin', icon: 'Swift Paw', description: '+5 Agility', itemType: 'tier1_item', stats: { agility: 5 } },
    { id: 'wisdom_plume', name: 'Wisdom Plume', cost: 500, currencyType: 'coin', icon: 'Wisdom Plume', description: '+5 Intelligence', itemType: 'tier1_item', stats: { intelligence: 5 } },
    { id: 'turtle_shell', name: 'Turtle Shell Fragment', cost: 500, currencyType: 'coin', icon: 'Turtle Shell Fragment', description: '+8 Defense', itemType: 'tier1_item', stats: { defense: 8 } },
    { id: 'ring_life', name: 'Ring of Life', cost: 500, currencyType: 'coin', icon: 'Ring of Life', description: '+50 Max HP', itemType: 'tier1_item', stats: { hp: 50 } },
    { id: 'vampire_tooth', name: 'Vampire Tooth', cost: 500, currencyType: 'coin', icon: 'Vampire Tooth', description: '+3% Lifesteal', itemType: 'tier1_item', stats: { lifesteal: 3 } },
    { id: 'basic_boots', name: 'Basic Boots', cost: 500, currencyType: 'coin', icon: 'Basic Boots', description: '+5 Move Speed', itemType: 'tier1_item', stats: { speed: 5 } },
];

export class ShopUI {
    private modal: ModalWrapper;
    private user: UserProfile;
    private onClose: () => void;
    private onBuy: (item: ShopItem) => void;
    private gridContainer!: HTMLElement;

    constructor(user: UserProfile, onClose: () => void, onBuy: (item: ShopItem) => void) {
        this.user = user;
        this.onClose = onClose;
        this.onBuy = onBuy;
        this.modal = new ModalWrapper('ITEM SHOP', onClose, '80%', '80%');
        this.init();
    }

    private init() {
        const content = this.modal.getContentArea();
        content.innerHTML = `
            <div class="shop-items-grid"></div>
            <style>
                .shop-items-grid {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    align-items: flex-start;
                    width: 100%;
                    height: 100%;
                    flex-wrap: wrap;
                    padding: 20px;
                    overflow-y: auto;
                }
                .shop-item-card {
                    background: rgba(0,0,0,0.4);
                    border: 2px solid #555;
                    border-radius: 15px;
                    padding: 20px;
                    width: 180px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    transition: transform 0.2s, border-color 0.2s, background 0.2s;
                }
                .shop-item-card:hover {
                    transform: translateY(-8px);
                    border-color: #ffd700;
                    background: rgba(0,0,0,0.6);
                }
                .shop-item-card.unavailable {
                    opacity: 0.5;
                    pointer-events: none;
                }
                .shop-item-card.unavailable:hover {
                    transform: none;
                    border-color: #555;
                }
                .item-icon-container {
                    width: 100px;
                    height: 100px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .item-icon {
                    max-width: 100%;
                    max-height: 100%;
                    filter: drop-shadow(0 0 15px rgba(255,255,255,0.3));
                }
                .item-name {
                    color: white;
                    font-weight: bold;
                    text-align: center;
                    font-size: 1rem;
                    font-family: 'SF Pro Rounded', sans-serif;
                }
                .item-desc {
                    color: #aaa;
                    font-size: 0.9rem;
                    text-align: center;
                }
                .buy-btn {
                    margin-top: 8px;
                    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
                    border: none;
                    color: white;
                    padding: 10px 16px;
                    border-radius: 25px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    font-size: 1rem;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                    transition: transform 0.2s, filter 0.2s;
                }
                .buy-btn:hover {
                    filter: brightness(1.15);
                    transform: scale(1.05);
                }
                .buy-btn.disabled {
                    background: #444;
                    cursor: not-allowed;
                    filter: grayscale(1);
                }
                .cost-icon {
                    font-size: 1.1rem;
                    line-height: 1;
                }
                .unavailable-badge {
                    background: #666;
                    color: #ccc;
                    padding: 8px 16px;
                    border-radius: 25px;
                    font-size: 0.9rem;
                    font-weight: bold;
                }
            </style>
        `;

        this.gridContainer = content.querySelector('.shop-items-grid') as HTMLElement;
        this.renderItems();
    }

    private renderItems() {
        this.gridContainer.innerHTML = SHOP_ITEMS.map(item => this.renderItem(item)).join('');

        // Re-attach listeners
        this.gridContainer.querySelectorAll('.buy-btn:not(.disabled)').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const itemId = target.dataset.id;
                const item = SHOP_ITEMS.find(i => i.id === itemId);
                if (item) {
                    this.onBuy(item);
                }
            });
        });
    }

    private renderItem(item: ShopItem): string {
        const isUnavailable = item.cost === 0;
        const canAfford = item.currencyType === 'coin'
            ? this.user.gold >= item.cost
            : this.user.gems >= item.cost;

        // Determine icon path based on item type
        let iconPath = '';
        if (item.itemType === 'summon') {
            iconPath = `/assets/home/scroll/${item.icon}.png`;
        } else if (item.itemType === 'coin') {
            iconPath = `/assets/shop/${item.icon}.png`;
        } else if (item.itemType === 'tier1_item') {
            iconPath = `/assets/item/Tier 1/${item.icon}.png`;
        } else if (item.itemType === 'material') {
            iconPath = `/assets/craft/${item.icon}.png`;
        } else {
            iconPath = `/assets/shop/exp-icons/${item.icon}.png`;
        }

        return `
            <div class="shop-item-card ${isUnavailable ? 'unavailable' : ''}">
                <div class="item-icon-container">
                    <img src="${iconPath}" class="item-icon" />
                </div>
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.description}</div>
                ${isUnavailable ? `
                    <div class="unavailable-badge">Coming Soon</div>
                ` : `
                    <button class="buy-btn ${!canAfford ? 'disabled' : ''}" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
                        <span>${item.cost.toLocaleString()}</span>
                        <span class="cost-icon">${item.currencyType === 'coin' ? '🪙' : '💎'}</span>
                    </button>
                `}
            </div>
        `;
    }

    public update(user: UserProfile) {
        this.user = user;
        this.renderItems();
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public destroy() {
        this.modal.close();
    }
}
