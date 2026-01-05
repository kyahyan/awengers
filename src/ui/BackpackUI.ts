
import { UserProfile } from "../data/UserProfile";
import { ITEMS } from "../data/Items";
import { ModalWrapper } from "./ModalWrapper";

export class BackpackUI {
    private currentTab: 'ALL' | 'MATERIALS' | 'ITEMS' | 'ORBS' = 'ALL';
    private contentArea!: HTMLElement;
    private modal: ModalWrapper;
    private user: UserProfile;
    private selectedItem: any = null; // Store selected item definition
    private selectedCount: number = 0;

    constructor(user: UserProfile, onClose?: () => void) {
        this.user = user;
        this.modal = new ModalWrapper('INVENTORY', onClose || (() => { }), '900px', '700px');
        this.initialize();
    }

    private initialize() {
        this.contentArea = this.modal.getContentArea();
        this.contentArea.style.display = 'flex';
        this.contentArea.style.flexDirection = 'column';
        this.contentArea.style.gap = '20px';
        this.contentArea.style.height = '100%';
        this.contentArea.style.padding = '0';
        this.contentArea.style.overflow = 'hidden';

        this.render();
    }

    private render() {
        this.contentArea.innerHTML = '';

        // --- Tabs ---
        const tabsContainer = document.createElement('div');
        tabsContainer.style.display = 'flex';
        tabsContainer.style.gap = '10px';
        tabsContainer.style.padding = '0 20px';
        tabsContainer.style.width = '100%';
        tabsContainer.style.borderBottom = '2px solid rgba(255,255,255,0.1)';

        const tabs = [
            { id: 'ALL', label: 'All Items' },
            { id: 'MATERIALS', label: 'Materials' },
            { id: 'ITEMS', label: 'Items' },
            { id: 'ORBS', label: 'Hero Orbs' }
        ];

        tabs.forEach(tab => {
            const btn = document.createElement('button');
            const isActive = this.currentTab === tab.id;
            btn.innerText = tab.label;
            btn.style.background = isActive ? ('#4488ff') : 'rgba(255,255,255,0.05)';
            btn.style.border = 'none';
            btn.style.color = isActive ? 'white' : '#aaa';
            btn.style.padding = '10px 24px';
            btn.style.fontSize = '1.0rem';
            btn.style.fontWeight = 'bold';
            btn.style.cursor = 'pointer';
            btn.style.fontFamily = "'SF Pro Rounded', sans-serif";
            btn.style.transition = 'all 0.2s';
            btn.style.borderRadius = '5px';

            btn.onclick = () => {
                this.currentTab = tab.id as any;
                this.render();
            };

            btn.onmouseenter = () => {
                if (!isActive) {
                    btn.style.background = 'rgba(255,255,255,0.1)';
                    btn.style.color = 'white';
                }
            };
            btn.onmouseleave = () => {
                if (!isActive) {
                    btn.style.background = 'rgba(255,255,255,0.05)';
                    btn.style.color = '#aaa';
                }
            };

            tabsContainer.appendChild(btn);
        });

        this.contentArea.appendChild(tabsContainer);

        // Special rendering for ORBS tab
        if (this.currentTab === 'ORBS') {
            this.renderOrbsTab();
            return;
        }

        // --- Split Layout Container ---
        const splitContainer = document.createElement('div');
        splitContainer.style.display = 'flex';
        splitContainer.style.width = '100%';
        splitContainer.style.height = '100%';
        splitContainer.style.overflow = 'hidden';
        splitContainer.style.gap = '20px';
        splitContainer.style.padding = '0 20px 20px 20px';
        splitContainer.style.boxSizing = 'border-box';

        // --- Left: Grid Container ---
        const gridWrapper = document.createElement('div');
        gridWrapper.style.flex = '1';
        gridWrapper.style.overflowY = 'auto'; // Scrollable area
        gridWrapper.style.paddingRight = '10px'; // Space for scrollbar

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        grid.style.gap = '15px';
        grid.style.width = '100%';

        let hasItems = false;
        // Default selection if none selected
        let firstItem: any = null;
        let firstCount: number = 0;

        if (this.user.inventory) {
            Object.entries(this.user.inventory).forEach(([itemId, count]) => {
                const itemDef = ITEMS[itemId];
                if (itemDef) {
                    // FILTERING LOGIC
                    let show = false;
                    if (this.currentTab === 'ALL') show = true;
                    else if (this.currentTab === 'MATERIALS' && (itemDef.type === 'material' || itemDef.type === 'consumable')) show = true;
                    else if (this.currentTab === 'ITEMS' && itemDef.type === 'equipment') show = true;

                    if (show && count > 0) {
                        if (!firstItem) { firstItem = itemDef; firstCount = count; }
                        const itemCard = this.createItemCard(itemDef, count);
                        grid.appendChild(itemCard);
                        hasItems = true;
                    }
                }
            });
        }

        // Auto selection logic
        if (!this.selectedItem && firstItem) {
            this.selectedItem = firstItem;
            this.selectedCount = firstCount;
        }

        if (!hasItems) {
            const emptyMsg = document.createElement('div');
            emptyMsg.innerText = this.currentTab === 'ITEMS' ? "No items found." : "No items found.";
            emptyMsg.style.color = '#888';
            emptyMsg.style.gridColumn = '1 / -1';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.fontSize = '1.4rem';
            emptyMsg.style.padding = '60px';
            emptyMsg.style.fontStyle = 'italic';
            grid.appendChild(emptyMsg);
            this.selectedItem = null; // Clear selection if empty
        }

        gridWrapper.appendChild(grid);
        splitContainer.appendChild(gridWrapper);

        // --- Right: Details Panel ---
        const detailsPanel = document.createElement('div');
        detailsPanel.style.width = '300px';
        detailsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        detailsPanel.style.borderRadius = '15px';
        detailsPanel.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        detailsPanel.style.padding = '20px';
        detailsPanel.style.display = 'flex';
        detailsPanel.style.flexDirection = 'column';
        detailsPanel.style.alignItems = 'center';
        detailsPanel.style.gap = '15px';

        if (this.selectedItem) {
            // Icon
            const iconImg = document.createElement('img');
            iconImg.src = this.selectedItem.icon;
            iconImg.style.width = '100px';
            iconImg.style.height = '100px';
            iconImg.style.objectFit = 'contain';
            iconImg.style.filter = 'drop-shadow(0 0 15px rgba(255,215,0, 0.3))';
            detailsPanel.appendChild(iconImg);

            // Name
            const nameEl = document.createElement('div');
            nameEl.innerText = this.selectedItem.name;
            nameEl.style.color = 'white';
            nameEl.style.fontSize = '1.6rem';
            nameEl.style.fontWeight = 'bold';
            nameEl.style.fontFamily = "'SF Pro Rounded', sans-serif";
            nameEl.style.textAlign = 'center';
            detailsPanel.appendChild(nameEl);

            // Type
            const typeEl = document.createElement('div');
            typeEl.innerText = this.selectedItem.type.toUpperCase();
            typeEl.style.color = '#aaa';
            typeEl.style.fontSize = '0.9rem';
            typeEl.style.background = 'rgba(255,255,255,0.1)';
            typeEl.style.padding = '4px 12px';
            typeEl.style.borderRadius = '12px';
            typeEl.style.letterSpacing = '1px';
            detailsPanel.appendChild(typeEl);

            // Description Box
            const descBox = document.createElement('div');
            descBox.innerText = this.selectedItem.description;
            descBox.style.color = '#ccc';
            descBox.style.fontSize = '1rem';
            descBox.style.lineHeight = '1.5';
            descBox.style.textAlign = 'center';
            descBox.style.background = 'rgba(0,0,0,0.3)';
            descBox.style.padding = '15px';
            descBox.style.borderRadius = '10px';
            descBox.style.width = '100%';
            descBox.style.boxSizing = 'border-box';
            detailsPanel.appendChild(descBox);

            // Stats (if equipment) - Parsing basic description or having dedicated stats field would be better
            // For now, we rely on description which contains "+5 Strength" etc.

            // Quantity
            const qtyEl = document.createElement('div');
            qtyEl.innerText = `Owned: ${this.selectedCount}`;
            qtyEl.style.marginTop = 'auto'; // Push to bottom
            qtyEl.style.color = '#ffd700';
            qtyEl.style.fontSize = '1.1rem';
            qtyEl.style.fontWeight = 'bold';
            detailsPanel.appendChild(qtyEl);

        } else {
            // Empty State for Details
            const emptyText = document.createElement('div');
            emptyText.innerText = "Select an item to view details";
            emptyText.style.color = '#666';
            emptyText.style.marginTop = '100px';
            detailsPanel.appendChild(emptyText);
        }

        splitContainer.appendChild(detailsPanel);
        this.contentArea.appendChild(splitContainer);
    }

    private createItemCard(itemDef: any, count: number): HTMLElement {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.style.position = 'relative';

        // Highlight if selected
        const isSelected = this.selectedItem && this.selectedItem.id === itemDef.id;
        card.style.background = isSelected
            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)';

        card.style.border = isSelected ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.15)';
        card.style.borderRadius = '16px';
        card.style.aspectRatio = '1 / 1.2';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s';
        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';

        card.onmouseover = () => {
            if (!isSelected) {
                card.style.transform = 'translateY(-5px)';
                card.style.borderColor = 'rgba(255,255,255,0.5)';
                card.style.boxShadow = '0 8px 15px rgba(0,0,0,0.3)';
            }
        };
        card.onmouseout = () => {
            if (!isSelected) {
                card.style.transform = 'translateY(0)';
                card.style.borderColor = 'rgba(255,255,255,0.15)';
                card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
            }
        };

        card.onclick = () => {
            this.selectedItem = itemDef;
            this.selectedCount = count;
            this.render(); // Re-render to show details and highlight
        };

        const img = document.createElement('img');
        img.src = itemDef.icon;
        img.style.width = '70%';
        img.style.height = '70%';
        img.style.objectFit = 'contain';
        img.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))';
        card.appendChild(img);

        const nameEl = document.createElement('div');
        nameEl.innerText = itemDef.name;
        nameEl.style.fontSize = '0.9rem';
        nameEl.style.fontWeight = 'bold';
        nameEl.style.color = '#fff';
        nameEl.style.textAlign = 'center';
        nameEl.style.marginTop = '10px';
        nameEl.style.maxWidth = '100%';
        nameEl.style.fontFamily = "'SF Pro Rounded', sans-serif";
        nameEl.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
        card.appendChild(nameEl);

        const countBadge = document.createElement('div');
        countBadge.innerText = count.toString();
        countBadge.style.position = 'absolute';
        countBadge.style.bottom = '10px';
        countBadge.style.right = '10px';
        countBadge.style.background = '#222';
        countBadge.style.color = '#ffd700';
        countBadge.style.fontSize = '0.85rem';
        countBadge.style.fontWeight = 'bold';
        countBadge.style.padding = '2px 8px';
        countBadge.style.borderRadius = '10px';
        countBadge.style.border = '1px solid #444';
        countBadge.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
        card.appendChild(countBadge);

        card.title = itemDef.name + "\n" + itemDef.description;

        return card;
    }

    private renderOrbsTab() {
        // Use the same layout as the regular items - split container
        const splitContainer = document.createElement('div');
        splitContainer.style.display = 'flex';
        splitContainer.style.width = '100%';
        splitContainer.style.height = '100%';
        splitContainer.style.overflow = 'hidden';
        splitContainer.style.gap = '20px';
        splitContainer.style.padding = '0 20px 20px 20px';
        splitContainer.style.boxSizing = 'border-box';

        // Grid container for orb cards
        const gridWrapper = document.createElement('div');
        gridWrapper.style.flex = '1';
        gridWrapper.style.overflowY = 'auto';
        gridWrapper.style.paddingRight = '10px';

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        grid.style.gap = '15px';
        grid.style.width = '100%';

        const userAny = this.user as any;
        const orbs = [
            { id: 'agi_orb', name: 'Agility Orb', count: userAny.agiOrb || 0, icon: '/assets/home/scroll/hero-orb/agi.png' },
            { id: 'str_orb', name: 'Strength Orb', count: userAny.strOrb || 0, icon: '/assets/home/scroll/hero-orb/str.png' },
            { id: 'int_orb', name: 'Intelligence Orb', count: userAny.intOrb || 0, icon: '/assets/home/scroll/hero-orb/int.png' }
        ];

        let firstOrb: any = null;

        orbs.forEach(orb => {
            if (orb.count > 0) {
                if (!firstOrb) firstOrb = orb;

                const isSelected = this.selectedItem && this.selectedItem.id === orb.id;

                const card = document.createElement('div');
                card.className = 'item-card';
                card.style.position = 'relative';
                card.style.background = isSelected
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)';
                card.style.border = isSelected ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.15)';
                card.style.borderRadius = '16px';
                card.style.aspectRatio = '1 / 1.2';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.alignItems = 'center';
                card.style.justifyContent = 'center';
                card.style.cursor = 'pointer';
                card.style.transition = 'transform 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s';
                card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';

                card.onmouseover = () => {
                    if (!isSelected) {
                        card.style.transform = 'translateY(-5px)';
                        card.style.borderColor = 'rgba(255,255,255,0.5)';
                        card.style.boxShadow = '0 8px 15px rgba(0,0,0,0.3)';
                    }
                };
                card.onmouseout = () => {
                    if (!isSelected) {
                        card.style.transform = 'translateY(0)';
                        card.style.borderColor = 'rgba(255,255,255,0.15)';
                        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
                    }
                };
                card.onclick = () => {
                    this.selectedItem = { id: orb.id, name: orb.name, icon: orb.icon, type: 'orb', description: 'Used to summon heroes of this attribute type in the Summon menu.' };
                    this.selectedCount = orb.count;
                    this.render();
                };

                const img = document.createElement('img');
                img.src = orb.icon;
                img.style.width = '70%';
                img.style.height = '70%';
                img.style.objectFit = 'contain';
                img.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))';
                card.appendChild(img);

                const nameEl = document.createElement('div');
                nameEl.innerText = orb.name;
                nameEl.style.fontSize = '0.9rem';
                nameEl.style.fontWeight = 'bold';
                nameEl.style.color = '#fff';
                nameEl.style.textAlign = 'center';
                nameEl.style.marginTop = '10px';
                nameEl.style.maxWidth = '100%';
                nameEl.style.fontFamily = "'SF Pro Rounded', sans-serif";
                nameEl.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
                card.appendChild(nameEl);

                const countBadge = document.createElement('div');
                countBadge.innerText = orb.count.toString();
                countBadge.style.position = 'absolute';
                countBadge.style.bottom = '10px';
                countBadge.style.right = '10px';
                countBadge.style.background = '#222';
                countBadge.style.color = '#ffd700';
                countBadge.style.fontSize = '0.85rem';
                countBadge.style.fontWeight = 'bold';
                countBadge.style.padding = '2px 8px';
                countBadge.style.borderRadius = '10px';
                countBadge.style.border = '1px solid #444';
                countBadge.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
                card.appendChild(countBadge);

                grid.appendChild(card);
            }
        });

        // Auto-select first orb if nothing selected
        if (!this.selectedItem && firstOrb) {
            this.selectedItem = { id: firstOrb.id, name: firstOrb.name, icon: firstOrb.icon, type: 'orb', description: 'Used to summon heroes of this attribute type in the Summon menu.' };
            this.selectedCount = firstOrb.count;
        }

        // Empty state
        if (grid.children.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.innerText = 'No Hero Orbs yet. Decompose heroes in the Altar to earn orbs!';
            emptyMsg.style.color = '#888';
            emptyMsg.style.gridColumn = '1 / -1';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.fontSize = '1.2rem';
            emptyMsg.style.padding = '60px';
            emptyMsg.style.fontStyle = 'italic';
            grid.appendChild(emptyMsg);
            this.selectedItem = null;
        }

        gridWrapper.appendChild(grid);
        splitContainer.appendChild(gridWrapper);

        // Details Panel (same as regular items)
        const detailsPanel = document.createElement('div');
        detailsPanel.style.width = '300px';
        detailsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        detailsPanel.style.borderRadius = '15px';
        detailsPanel.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        detailsPanel.style.padding = '20px';
        detailsPanel.style.display = 'flex';
        detailsPanel.style.flexDirection = 'column';
        detailsPanel.style.alignItems = 'center';
        detailsPanel.style.gap = '15px';

        if (this.selectedItem && this.selectedItem.type === 'orb') {
            const iconImg = document.createElement('img');
            iconImg.src = this.selectedItem.icon;
            iconImg.style.width = '100px';
            iconImg.style.height = '100px';
            iconImg.style.objectFit = 'contain';
            iconImg.style.filter = 'drop-shadow(0 0 15px rgba(255,215,0, 0.3))';
            detailsPanel.appendChild(iconImg);

            const nameEl = document.createElement('div');
            nameEl.innerText = this.selectedItem.name;
            nameEl.style.color = 'white';
            nameEl.style.fontSize = '1.6rem';
            nameEl.style.fontWeight = 'bold';
            nameEl.style.fontFamily = "'SF Pro Rounded', sans-serif";
            nameEl.style.textAlign = 'center';
            detailsPanel.appendChild(nameEl);

            const typeEl = document.createElement('div');
            typeEl.innerText = 'HERO ORB';
            typeEl.style.color = '#aaa';
            typeEl.style.fontSize = '0.9rem';
            typeEl.style.background = 'rgba(255,255,255,0.1)';
            typeEl.style.padding = '4px 12px';
            typeEl.style.borderRadius = '12px';
            typeEl.style.letterSpacing = '1px';
            detailsPanel.appendChild(typeEl);

            const descBox = document.createElement('div');
            descBox.innerText = this.selectedItem.description;
            descBox.style.color = '#ccc';
            descBox.style.fontSize = '1rem';
            descBox.style.lineHeight = '1.5';
            descBox.style.textAlign = 'center';
            descBox.style.background = 'rgba(0,0,0,0.3)';
            descBox.style.padding = '15px';
            descBox.style.borderRadius = '10px';
            descBox.style.width = '100%';
            descBox.style.boxSizing = 'border-box';
            detailsPanel.appendChild(descBox);

            const qtyEl = document.createElement('div');
            qtyEl.innerText = `Owned: ${this.selectedCount}`;
            qtyEl.style.marginTop = 'auto';
            qtyEl.style.color = '#ffd700';
            qtyEl.style.fontSize = '1.1rem';
            qtyEl.style.fontWeight = 'bold';
            detailsPanel.appendChild(qtyEl);
        } else {
            const emptyText = document.createElement('div');
            emptyText.innerText = 'Select an orb to view details';
            emptyText.style.color = '#666';
            emptyText.style.marginTop = '100px';
            detailsPanel.appendChild(emptyText);
        }

        splitContainer.appendChild(detailsPanel);
        this.contentArea.appendChild(splitContainer);
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public close() {
        this.modal.close();
    }
}
