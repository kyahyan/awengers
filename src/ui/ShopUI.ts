
import { UserProfile } from '../data/UserProfile';

export interface ShopItem {
    id: string;
    name: string;
    xpAmount: number;
    cost: number;
    icon: string; // "small", "medium", "large"
    description: string;
}

export const SHOP_ITEMS: ShopItem[] = [
    { id: 'xp_small', name: 'Small XP Potion', xpAmount: 100, cost: 500, icon: 'small', description: '+100 XP' },
    { id: 'xp_medium', name: 'Medium XP Potion', xpAmount: 1000, cost: 2000, icon: 'medium', description: '+1,000 XP' },
    { id: 'xp_large', name: 'Large XP Potion', xpAmount: 10000, cost: 10000, icon: 'large', description: '+10,000 XP' },
];

export class ShopUI {
    private container: HTMLElement;
    private user: UserProfile;
    private onClose: () => void;
    private onBuy: (item: ShopItem) => void;
    private gridContainer!: HTMLElement;

    constructor(user: UserProfile, onClose: () => void, onBuy: (item: ShopItem) => void) {
        this.user = user;
        this.onClose = onClose;
        this.onBuy = onBuy;
        this.container = document.createElement('div');
        this.container.className = 'shop-modal-overlay';
        this.init();
    }

    private init() {
        this.container.innerHTML = `
            <div class="shop-screen">
                <div class="shop-title">ITEM SHOP</div>
                <div class="shop-items-grid"></div>
            </div>
            <style>
                .shop-modal-overlay {
                    position: absolute; /* Changed from fixed to absolute to sit in UI container */
                    top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.85); /* Semi-transparent */
                    z-index: 500; /* Below Header */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    pointer-events: auto;
                }
                .shop-screen {
                    width: 100%;
                    height: 100%;
                    background-image: url('/assets/shop/shop.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center; /* Or flex-start with padding-top if needed */
                    padding-top: 100px; /* Space for Header */
                    box-sizing: border-box;
                }
                .shop-title {
                    font-size: 3rem;
                    font-weight: 900;
                    color: #ffd700;
                    text-shadow: 0 4px 4px rgba(0,0,0,0.9), 0 0 20px rgba(255, 215, 0, 0.5);
                    margin-bottom: 40px;
                    font-family: 'SF Pro Display', sans-serif;
                }
                .shop-items-grid {
                    display: flex;
                    gap: 30px;
                    justify-content: center;
                    width: 100%;
                }
                .shop-item-card {
                    background: rgba(0,0,0,0.6);
                    border: 2px solid #555;
                    border-radius: 15px;
                    padding: 20px;
                    width: 180px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    transition: transform 0.2s, border-color 0.2s;
                }
                .shop-item-card:hover {
                    transform: translateY(-5px);
                    border-color: #ffd700;
                    background: rgba(0,0,0,0.8);
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
                    filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));
                }
                .item-name {
                    color: white;
                    font-weight: bold;
                    text-align: center;
                    font-size: 1.1rem;
                }
                .item-desc {
                    color: #aaa;
                    font-size: 0.9rem;
                }
                .buy-btn {
                    margin-top: 10px;
                    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 5px;
                    font-size: 1rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }
                .buy-btn:hover {
                    filter: brightness(1.1);
                    transform: scale(1.05);
                }
                .buy-btn.disabled {
                    background: #555;
                    cursor: not-allowed;
                    filter: grayscale(1);
                }
                .cost-icon {
                    font-size: 1.2rem;
                    line-height: 1;
                }
            </style>
        `;

        this.gridContainer = this.container.querySelector('.shop-items-grid') as HTMLElement;
        // Removed close button listener
        this.renderItems();
    }

    private renderItems() {
        this.gridContainer.innerHTML = SHOP_ITEMS.map(item => this.renderItem(item)).join('');

        // Re-attach listeners
        this.gridContainer.querySelectorAll('.buy-btn').forEach((btn) => {
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
        const canAfford = this.user.gems >= item.cost;
        return `
            <div class="shop-item-card">
                <div class="item-icon-container">
                    <img src="/assets/shop/exp-icons/${item.icon}.png" class="item-icon" />
                </div>
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.description}</div>
                <button class="buy-btn ${!canAfford ? 'disabled' : ''}" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
                    <span>${item.cost.toLocaleString()}</span>
                    <span class="cost-icon">💎</span>
                </button>
            </div>
        `;
    }

    public update(user: UserProfile) {
        this.user = user;
        // Only re-render items, not the whole modal
        this.renderItems();
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public destroy() {
        this.container.remove();
        this.onClose();
    }
}
