
import { UserProfile } from "../data/UserProfile";
import { ITEMS } from "../data/Items";

export class BackpackUI {
    private element: HTMLElement;
    private user: UserProfile;

    constructor(user: UserProfile) {
        this.user = user;
        this.element = document.createElement('div');
        this.initialize();
    }

    private initialize() {
        // Full screen container with background
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        // Dark background or use a specific image. Using dark overlay for now to match other screens.
        this.element.style.backgroundColor = '#1a1a1a';
        // Add a background image if desired, e.g. wood texture
        this.element.style.backgroundImage = 'radial-gradient(circle at center, #2e2e2e, #111)';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.alignItems = 'center';
        this.element.style.color = 'white';
        this.element.style.fontFamily = "'SF Pro Display', sans-serif";
        this.element.style.zIndex = '100'; // Below Header but above game

        // Title
        const title = document.createElement('div');
        title.innerText = 'INVENTORY';
        title.style.marginTop = '100px'; // Space for Header
        title.style.fontSize = '3rem';
        title.style.fontWeight = 'bold';
        title.style.letterSpacing = '2px';
        title.style.color = '#ffd700';
        title.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
        this.element.appendChild(title);

        // Grid Container
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))'; // Responsive grid
        grid.style.gap = '20px';
        grid.style.width = '80%';
        grid.style.maxWidth = '1000px';
        grid.style.marginTop = '40px';
        grid.style.padding = '20px';
        grid.style.background = 'rgba(0,0,0,0.3)';
        grid.style.borderRadius = '15px';
        grid.style.border = '1px solid #444';
        grid.style.overflowY = 'auto'; // Scrollable if many items
        grid.style.maxHeight = 'calc(100% - 200px)';

        if (this.user.inventory) {
            Object.entries(this.user.inventory).forEach(([itemId, count]) => {
                const itemDef = ITEMS[itemId];
                if (itemDef) {
                    const itemCard = this.createItemCard(itemDef, count);
                    grid.appendChild(itemCard);
                } else {
                    // Item not defined in ITEMS? Show fallback?
                    // Skipping for now
                    console.warn(`Item ${itemId} not found in definitions.`);
                }
            });
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.innerText = "No items in inventory.";
            emptyMsg.style.color = '#777';
            emptyMsg.style.gridColumn = '1 / -1';
            emptyMsg.style.textAlign = 'center';
            grid.appendChild(emptyMsg);
        }

        this.element.appendChild(grid);
    }

    private createItemCard(itemDef: any, count: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.style.position = 'relative';
        card.style.background = 'rgba(255, 255, 255, 0.05)';
        card.style.border = '1px solid #555';
        card.style.borderRadius = '10px';
        card.style.padding = '10px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.1s, border-color 0.1s';

        card.onmouseover = () => {
            card.style.transform = 'scale(1.05)';
            card.style.borderColor = '#ffd700';
            card.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        card.onmouseout = () => {
            card.style.transform = 'scale(1)';
            card.style.borderColor = '#555';
            card.style.background = 'rgba(255, 255, 255, 0.05)';
        };

        const img = document.createElement('img');
        img.src = itemDef.icon;
        img.style.width = '64px';
        img.style.height = '64px';
        img.style.objectFit = 'contain';
        img.style.marginBottom = '5px';
        card.appendChild(img);

        const countBadge = document.createElement('div');
        countBadge.innerText = count.toString();
        countBadge.style.position = 'absolute';
        countBadge.style.bottom = '5px';
        countBadge.style.right = '5px';
        countBadge.style.background = 'rgba(0,0,0,0.8)';
        countBadge.style.color = '#fff';
        countBadge.style.fontSize = '0.8rem';
        countBadge.style.padding = '2px 6px';
        countBadge.style.borderRadius = '10px';
        countBadge.style.border = '1px solid #777';
        card.appendChild(countBadge);

        // Tooltip (simple title)
        card.title = itemDef.name + "\n" + itemDef.description;

        return card;
    }

    public getElement(): HTMLElement {
        return this.element;
    }
}
