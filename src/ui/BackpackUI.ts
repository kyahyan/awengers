
import { UserProfile } from "../data/UserProfile";
import { ITEMS } from "../data/Items";
import { ModalWrapper } from "./ModalWrapper";

export class BackpackUI {
    private modal: ModalWrapper;
    private user: UserProfile;

    constructor(user: UserProfile, onClose?: () => void) {
        this.user = user;
        this.modal = new ModalWrapper('INVENTORY', onClose || (() => { }), '70%', '70%');
        this.initialize();
    }

    private initialize() {
        const content = this.modal.getContentArea();
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.alignItems = 'center';
        content.style.gap = '20px';

        // Grid Container
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        grid.style.gap = '20px';
        grid.style.width = '100%';
        grid.style.padding = '10px';
        grid.style.background = 'rgba(0,0,0,0.2)';
        grid.style.borderRadius = '15px';
        grid.style.border = '1px solid rgba(255,255,255,0.1)';
        grid.style.overflowY = 'auto';
        grid.style.flex = '1';

        if (this.user.inventory && Object.keys(this.user.inventory).length > 0) {
            Object.entries(this.user.inventory).forEach(([itemId, count]) => {
                const itemDef = ITEMS[itemId];
                if (itemDef) {
                    const itemCard = this.createItemCard(itemDef, count);
                    grid.appendChild(itemCard);
                } else {
                    console.warn(`Item ${itemId} not found in definitions.`);
                }
            });
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.innerText = "No items in inventory.";
            emptyMsg.style.color = '#777';
            emptyMsg.style.gridColumn = '1 / -1';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.fontSize = '1.2rem';
            emptyMsg.style.padding = '40px';
            grid.appendChild(emptyMsg);
        }

        content.appendChild(grid);
    }

    private createItemCard(itemDef: any, count: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.style.position = 'relative';
        card.style.background = 'rgba(255, 255, 255, 0.05)';
        card.style.border = '2px solid #444';
        card.style.borderRadius = '12px';
        card.style.padding = '15px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s, border-color 0.2s, background 0.2s';

        card.onmouseover = () => {
            card.style.transform = 'scale(1.08)';
            card.style.borderColor = '#ffd700';
            card.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        card.onmouseout = () => {
            card.style.transform = 'scale(1)';
            card.style.borderColor = '#444';
            card.style.background = 'rgba(255, 255, 255, 0.05)';
        };

        const img = document.createElement('img');
        img.src = itemDef.icon;
        img.style.width = '64px';
        img.style.height = '64px';
        img.style.objectFit = 'contain';
        img.style.marginBottom = '5px';
        img.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))';
        card.appendChild(img);

        const countBadge = document.createElement('div');
        countBadge.innerText = count.toString();
        countBadge.style.position = 'absolute';
        countBadge.style.bottom = '8px';
        countBadge.style.right = '8px';
        countBadge.style.background = 'rgba(0,0,0,0.85)';
        countBadge.style.color = '#ffd700';
        countBadge.style.fontSize = '0.9rem';
        countBadge.style.fontWeight = 'bold';
        countBadge.style.padding = '3px 8px';
        countBadge.style.borderRadius = '12px';
        countBadge.style.border = '1px solid #ffd700';
        card.appendChild(countBadge);

        card.title = itemDef.name + "\n" + itemDef.description;

        return card;
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public close() {
        this.modal.close();
    }
}
