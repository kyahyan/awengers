import { UserProfile } from '../data/UserProfile';
import { ModalWrapper } from './ModalWrapper';
import {
    LootReward,
    MAP_SHARD_DROPS,
    ShardDefinition
} from '../data/LootSystem';
import {
    canBuildFromShards,
    getItemById,
    ItemTier,
    SHARD_REQUIREMENTS,
    SHARD_TO_ITEM_MAPPING
} from '../data/ItemSystem';

// Combine mappings for easy access
// In a real scenario, we might want a unified registry. 
// For now, we iterate over known shard keys.

export class ShardsUI {
    private modal: ModalWrapper;
    private user: UserProfile;
    private onClose: () => void;
    private onBuild: (shardId: string) => void;
    private contentArea!: HTMLElement;
    private activeTab: 'HERO' | 'ITEM' = 'ITEM';

    constructor(user: UserProfile, onClose: () => void, onBuild: (shardId: string) => void) {
        this.user = user;
        this.onClose = onClose;
        this.onBuild = onBuild;
        this.modal = new ModalWrapper('MY SHARDS', onClose, '90%', '85%');
        this.init();
    }

    private init() {
        const content = this.modal.getContentArea();

        // --- Toolbar / Tabs ---
        const tabsContainer = document.createElement('div');
        tabsContainer.style.display = 'flex';
        tabsContainer.style.justifyContent = 'center';
        tabsContainer.style.gap = '20px';
        tabsContainer.style.marginBottom = '20px';

        const heroTab = this.createTab('Hero Shards', 'HERO');
        const itemTab = this.createTab('Item Shards', 'ITEM');

        tabsContainer.appendChild(heroTab);
        tabsContainer.appendChild(itemTab);
        content.appendChild(tabsContainer);

        // --- Grid Area ---
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'shards-grid';
        this.contentArea.style.display = 'grid';
        this.contentArea.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        this.contentArea.style.gap = '20px';
        this.contentArea.style.width = '100%';
        this.contentArea.style.overflowY = 'auto'; // Scrollable
        this.contentArea.style.padding = '10px';
        // Hide scrollbar but keep functionality
        this.contentArea.style.scrollbarWidth = 'none';

        content.appendChild(this.contentArea);

        // Render Initial View
        this.render();
    }

    private createTab(label: string, id: 'HERO' | 'ITEM'): HTMLElement {
        const btn = document.createElement('div');
        btn.innerText = label;
        btn.className = `shard-tab ${this.activeTab === id ? 'active' : ''}`;
        btn.style.padding = '10px 30px';
        btn.style.borderRadius = '20px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '1.1rem';
        btn.style.transition = 'all 0.2s';

        // Dynamic styles handle in render or by toggling class manually
        // But for simplicity, we re-render whole UI on tab switch
        if (this.activeTab === id) {
            btn.style.background = '#d97706'; // Amber-600
            btn.style.color = 'white';
            btn.style.boxShadow = '0 0 10px rgba(217, 119, 6, 0.5)';
        } else {
            btn.style.background = '#374151'; // Gray-700
            btn.style.color = '#9ca3af';
        }

        btn.onclick = () => {
            this.activeTab = id;
            // Clear and re-init tabs to update styles (lazy way)
            const parent = btn.parentElement;
            if (parent) {
                parent.innerHTML = '';
                parent.appendChild(this.createTab('Hero Shards', 'HERO'));
                parent.appendChild(this.createTab('Item Shards', 'ITEM'));
            }
            this.render();
        };

        return btn;
    }

    private render() {
        this.contentArea.innerHTML = '';

        if (this.activeTab === 'HERO') {
            this.renderHeroShards();
        } else {
            this.renderItemShards();
        }
    }

    private renderHeroShards() {
        // Placeholder or actual hero shard logic if it existed
        // User request focuses on item shard tiers logic? 
        // Screenshot shows "Ring of Life Shard x12" under what looks like Item Shards (User highlighted Item Shards)
        // I'll leave Hero Shards empty or "Coming Soon" for now unless I find data

        const empty = document.createElement('div');
        empty.style.gridColumn = '1 / -1';
        empty.style.textAlign = 'center';
        empty.style.color = '#666';
        empty.style.marginTop = '50px';
        empty.style.fontSize = '1.2rem';
        empty.innerText = 'No Hero Shards collected yet.';
        this.contentArea.appendChild(empty);
    }

    private renderItemShards() {
        // 1. Identify all possible item shards from mapping or inventory
        // Iterating MAP_SHARD_DROPS is a good start for "known" shards
        // Also check inventory for any ID ending in '_shard' just in case

        const shardIds = new Set<string>();

        // Add from Config
        Object.values(MAP_SHARD_DROPS).forEach(def => shardIds.add(def.id));

        // Add from Inventory
        if (this.user.inventory) {
            Object.keys(this.user.inventory).forEach(k => {
                if (k.endsWith('_shard')) shardIds.add(k);
            });
        }

        if (shardIds.size === 0) {
            const empty = document.createElement('div');
            empty.style.gridColumn = '1 / -1';
            empty.style.textAlign = 'center';
            empty.style.color = '#666';
            empty.style.marginTop = '50px';
            empty.style.fontSize = '1.2rem';
            empty.innerText = 'No Item Shards collected yet. Explore maps to find them!';
            this.contentArea.appendChild(empty);
            return;
        }

        shardIds.forEach(shardId => {
            const owned = this.user.inventory ? (this.user.inventory[shardId] || 0) : 0;

            // Only show if we know what it builds, otherwise it's a mystery item
            const buildInfo = canBuildFromShards(shardId, this.user.inventory || {});

            // If we don't have an item definition, we might fallback to just showing the shard icon/name from MAP_SHARD_DROPS
            let name = shardId;
            let icon = ''; // Need a fallback
            let tier = 1;

            // Try to find definition in MAP_SHARD_DROPS
            const knownDef = Object.values(MAP_SHARD_DROPS).find(d => d.id === shardId);
            if (knownDef) {
                name = knownDef.name;
                icon = knownDef.icon;
            } else if (buildInfo.item) {
                // Fallback: Infer from item
                name = buildInfo.item.name + " Shard";
                icon = buildInfo.item.icon; // Use item icon? Or a generic shard overlay?
            }

            // Create Card
            const card = document.createElement('div');
            card.className = 'shard-card';
            card.style.background = '#2a2a2a'; // Dark gray
            card.style.borderRadius = '15px';
            card.style.padding = '15px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.gap = '10px';
            card.style.border = '2px solid #444';
            card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

            // Icon
            const img = document.createElement('img');
            img.src = icon;
            img.style.width = '64px';
            img.style.height = '64px';
            img.style.objectFit = 'contain';
            card.appendChild(img);

            // Name
            const title = document.createElement('div');
            title.innerText = name;
            title.style.color = '#fff';
            title.style.fontWeight = 'bold';
            title.style.textAlign = 'center';
            title.style.fontSize = '0.9rem';
            title.style.height = '40px'; // fixed height for alignment
            title.style.display = 'flex';
            title.style.alignItems = 'center';
            card.appendChild(title);

            // Count / Progress
            const req = buildInfo.cost || 20; // Default to 20 if unknown
            const progressColor = owned >= req ? '#4ade80' : '#fbbf24'; // Green or Yellow

            const countDiv = document.createElement('div');
            countDiv.innerHTML = `<span style="color:${progressColor};font-size:1.2rem;font-weight:bold;">${owned}</span> <span style="color:#666;">/ ${req}</span>`;
            card.appendChild(countDiv);

            // Build Button
            if (buildInfo.item) {
                const btn = document.createElement('button');
                btn.innerText = 'Build';
                btn.className = `build-btn ${buildInfo.canBuild ? 'ready' : ''}`;
                btn.disabled = !buildInfo.canBuild;
                btn.style.width = '100%';
                btn.style.padding = '8px';
                btn.style.borderRadius = '8px';
                btn.style.border = 'none';
                btn.style.fontWeight = 'bold';
                btn.style.cursor = buildInfo.canBuild ? 'pointer' : 'not-allowed';
                btn.style.marginTop = 'auto';

                if (buildInfo.canBuild) {
                    btn.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                    btn.style.color = 'white';
                    btn.onclick = () => this.onBuild(shardId);
                } else {
                    btn.style.background = '#374151';
                    btn.style.color = '#6b7280';
                }

                card.appendChild(btn);
            } else {
                const info = document.createElement('div');
                info.innerText = 'Cannot Build';
                info.style.fontSize = '0.8rem';
                info.style.color = '#666';
                card.appendChild(info);
            }

            this.contentArea.appendChild(card);
        });
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public update(user: UserProfile) {
        this.user = user;
        this.render();
    }
}
