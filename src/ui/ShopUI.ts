
import { UserProfile } from '../data/UserProfile';
import { ModalWrapper } from './ModalWrapper';

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
    private modal: ModalWrapper;
    private user: UserProfile;
    private onClose: () => void;
    private onBuy: (item: ShopItem) => void;
    private gridContainer!: HTMLElement;

    constructor(user: UserProfile, onClose: () => void, onBuy: (item: ShopItem) => void) {
        this.user = user;
        this.onClose = onClose;
        this.onBuy = onBuy;
        this.modal = new ModalWrapper('ITEM SHOP', onClose, '70%', '70%');
        this.init();
    }

    private init() {
        const content = this.modal.getContentArea();
        content.innerHTML = `
            <div class="shop-items-grid"></div>
            <style>
                .shop-items-grid {
                    display: flex;
                    gap: 30px;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    flex-wrap: wrap;
                }
                .shop-item-card {
                    background: rgba(0,0,0,0.4);
                    border: 2px solid #555;
                    border-radius: 15px;
                    padding: 25px;
                    width: 200px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    transition: transform 0.2s, border-color 0.2s, background 0.2s;
                }
                .shop-item-card:hover {
                    transform: translateY(-8px);
                    border-color: #ffd700;
                    background: rgba(0,0,0,0.6);
                }
                .item-icon-container {
                    width: 120px;
                    height: 120px;
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
                    font-size: 1.2rem;
                    font-family: 'SF Pro Rounded', sans-serif;
                }
                .item-desc {
                    color: #aaa;
                    font-size: 1rem;
                }
                .buy-btn {
                    margin-top: 10px;
                    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
                    border: none;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    font-size: 1.1rem;
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
                    font-size: 1.3rem;
                    line-height: 1;
                }
            </style>
        `;

        this.gridContainer = content.querySelector('.shop-items-grid') as HTMLElement;
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
        this.renderItems();
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public destroy() {
        this.modal.close();
    }
}
