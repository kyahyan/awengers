import { HERO_DEFINITIONS, HeroDef } from '../data/HeroDefinitions';
import { HERO_ASSETS } from '../data/HeroAssetsMap';
import { HeroUpgradeModal } from './HeroUpgradeModal';

export interface HeroData {
    name: string; // The Code Name
    instanceId: string; // Unique Instance ID
    species: string; // For asset path construction
    classType: string; // 'Warrior', 'Mage', etc.
    attribute: string; // 'Strength', 'Agility', 'Intelligence'
    level: number;
    stars: number;
    imagePath?: string; // Optional direct path, otherwise constructed
    hasNotification?: boolean;
    // Optional: Add full stats reference for tooltip/details later
    stats?: HeroDef;
}

export class HeroList {
    private container: HTMLElement;
    private heroes: HeroData[];
    private currentMode: 'VIEW' | 'SELECT' = 'VIEW';
    private currentFilter: string = 'Strength';
    private selectedHeroes: Set<string>;
    // private ownedHeroes: Set<string>; // Deprecated
    private onSelect: (selectedNames: string[]) => void;
    private onView?: (heroName: string) => void;
    private showFilterBar: boolean = true;
    private user: any = null;
    private onUserUpdate?: (updatedUser: any) => void;

    constructor(onSelect: (selectedNames: string[]) => void, onView?: (heroName: string) => void, showFilterBar: boolean = true, user: any = null, onUserUpdate?: (u: any) => void) {
        this.onSelect = onSelect;
        this.onView = onView;
        this.showFilterBar = showFilterBar;
        this.user = user;
        this.onUserUpdate = onUserUpdate;
        console.log('[HeroList] Constructed. User provided:', !!this.user);

        this.container = document.createElement('div');
        this.container.className = 'hero-list-container';
        this.container.style.paddingTop = showFilterBar ? '60px' : '20px';

        this.selectedHeroes = new Set();
        // this.ownedHeroes = new Set();
        this.currentMode = 'VIEW';
        this.currentFilter = 'Strength';

        this.heroes = [];
        this.loadHeroes();
    }

    public setUser(user: any) {
        this.user = user;
        this.loadHeroes();
        this.render();
    }

    public setOwned(_owned: string[]) {
        // this.ownedHeroes = new Set(owned);
        this.render();
    }

    public getVisibleHeroNames(): string[] {
        return this.heroes
            .filter(h => this.currentFilter === 'All' || h.attribute === this.currentFilter)
            .map(h => h.name);
    }

    private loadHeroes() {
        console.log('[HeroList] Loading Heroes from User Profile...');
        this.heroes = [];
        const userHeroes = this.user ? (this.user.heroes || {}) : {};

        // Convert Map or Object to entries array
        let entries: [string, any][] = [];
        if (userHeroes instanceof Map) {
            entries = Array.from(userHeroes.entries());
        } else {
            entries = Object.entries(userHeroes);
        }

        // Iterate through all hero instances in user profile
        entries.forEach(([instanceId, heroData]) => {
            // 1. Determine the Code Name
            // Priority: stored heroCodeName -> parsed from instanceId (razor_123 -> razor) -> instanceId itself
            let rawCodeName = heroData.heroCodeName;

            if (!rawCodeName) {
                if (instanceId.includes('_')) {
                    rawCodeName = instanceId.split('_')[0]; // e.g. "razor" from "razor_123..."
                } else {
                    rawCodeName = instanceId; // Legacy or fallback
                }
            }

            // 2. Find Definition (Case-Insensitive Search)
            let def: HeroDef | undefined;
            let attribute = 'Strength'; // Default

            for (const [attr, list] of Object.entries(HERO_DEFINITIONS)) {
                // Case-insensitive match
                const found = list.find(h => h.codeName.toLowerCase() === rawCodeName.toLowerCase());
                if (found) {
                    def = found;
                    attribute = attr;
                    break;
                }
            }

            if (!def) return; // Unknown hero type

            // Use the definition's canonical codeName (e.g. "Razor") for assets
            const canonicalName = def.codeName;

            const species = def.name.split(' ')[0];

            // Use actual star level from hero data (set by merge), or default to 1
            const stars = heroData.stars || 1;

            // Find asset data (using canonical name)
            const asset = HERO_ASSETS.find(a => a.name === canonicalName);

            this.heroes.push({
                name: canonicalName, // Display Name
                instanceId: instanceId, // Unique Check for upgrades
                species: species,
                classType: def.class,
                attribute: attribute,
                level: heroData.level || 1,
                stars: stars,
                imagePath: asset ? asset.sprite2D?.spritesheetPath : undefined,
                stats: def
            } as any);
        });
    }

    public getElement(): HTMLElement {
        this.render();
        return this.container;
    }

    public setMode(mode: 'VIEW' | 'SELECT') {
        this.currentMode = mode;
        this.render();
    }

    public setSelected(names: string[]) {
        this.selectedHeroes = new Set(names);
        this.render();
    }

    private setFilter(attribute: string) {
        this.currentFilter = attribute;
        this.render();
    }

    private render() {
        console.log(`[HeroList] Rendering. Heroes: ${this.heroes.length}, Mode: ${this.currentMode}, Filter: ${this.currentFilter}`);
        this.container.innerHTML = '';
        this.container.style.paddingTop = '0'; // Reset padding for absolute layout
        this.container.style.position = 'relative';
        this.container.style.height = '100%';
        this.container.style.overflow = 'hidden';
        this.container.style.pointerEvents = 'none'; // Allow clicks to pass through to tabs

        // --- Filter Bar (only show if enabled) ---
        if (this.showFilterBar) {
            const filterBar = document.createElement('div');
            filterBar.className = 'filter-bar';
            filterBar.style.position = 'absolute';
            filterBar.style.top = '100px';
            filterBar.style.left = '50%';
            filterBar.style.transform = 'translateX(-50%)';
            filterBar.style.width = 'auto';
            filterBar.style.height = '50px';
            filterBar.style.display = 'flex';
            filterBar.style.justifyContent = 'center';
            filterBar.style.alignItems = 'center';
            filterBar.style.gap = '15px';
            filterBar.style.zIndex = '100';
            filterBar.style.pointerEvents = 'auto';

            const filters = ['Strength', 'Agility', 'Intelligence'];
            filters.forEach(filter => {
                const btn = document.createElement('button');
                btn.innerText = filter;
                btn.className = `filter-btn ${this.currentFilter === filter ? 'active' : ''}`;
                btn.addEventListener('click', () => this.setFilter(filter));
                filterBar.appendChild(btn);
            });

            // Isolate styles
            const style = document.createElement('style');
            style.innerText = `
                .filter-btn {
                    background: linear-gradient(180deg, #8b6542 0%, #5c3d25 100%);
                    color: #d4b896;
                    border: 2px solid #3d2815;
                    padding: 10px 28px;
                    border-radius: 22px;
                    cursor: pointer;
                    font-family: 'SF Pro Rounded', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 700;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    transition: all 0.3s ease;
                    pointer-events: auto;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .filter-btn:hover {
                    background: linear-gradient(180deg, #9a6e48 0%, #6b4830 100%);
                }
                .filter-btn.active {
                    background: linear-gradient(180deg, #c9a66b 0%, #8b6542 100%);
                    color: #3d2815;
                    font-weight: bold;
                    border-color: #dec88f;
                    box-shadow: 0 0 10px rgba(222, 200, 143, 0.5);
                }
            `;
            filterBar.appendChild(style);
            this.container.appendChild(filterBar);
        }

        // --- Main Content ---
        if (this.currentFilter === 'All') {
            this.renderCategorizedColumns();
        } else {
            this.renderFilteredGrid();
        }

        const cardStyle = document.createElement('style');
        cardStyle.innerText = `
            /* Columns Layout */
            .columns-container {
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 160px;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 1400px;
                bottom: 100px;
                padding: 12px;
                gap: 12px;
                overflow-y: auto;
                overflow-x: hidden;
                box-sizing: border-box;
                -ms-overflow-style: none; /* Hide scrollbar for layout cleanliness */
                scrollbar-width: none;
                pointer-events: auto;
            }
            .columns-container::-webkit-scrollbar { display: none; }

            .attr-column { display: flex; flex-direction: column; gap: 12px; width: 100%; }
            .attr-header {
                display: flex; align-items: center; gap: 10px; padding-bottom: 8px;
                border-bottom: 2px solid #5c3d25;
                font-family: 'SF Pro Display', sans-serif; font-size: 1rem; color: #d4b896;
                text-transform: uppercase; letter-spacing: 2px;
            }

            /* Grid Layout */
            .hero-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 20px;
                width: 100%;
                justify-items: center;
                padding-bottom: 40px;
            }

            /* New Card Style */
            .hero-card {
                position: relative;
                width: 100%;
                max-width: 180px;
                background: linear-gradient(135deg, #3d2815 0%, #5c3d25 100%);
                border-radius: 15px;
                padding: 2px;
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                border: 2px solid #8b6542;
                box-sizing: border-box;
                pointer-events: auto;
            }
            .hero-card:hover {
                transform: translateY(-5px) scale(1.02);
                border-color: #ffd700;
                z-index: 10;
            }
            .hero-card.selected {
                border-color: #00ff00;
                box-shadow: 0 0 15px #00ff00;
            }
            .hero-card.locked {
                filter: grayscale(100%) brightness(50%);
                opacity: 0.7;
            }
        `;
        this.container.appendChild(cardStyle);
    }

    private renderCategorizedColumns() {
        const columnsContainer = document.createElement('div');
        columnsContainer.className = 'columns-container';

        const attributes = ['Strength', 'Agility', 'Intelligence'];
        attributes.forEach(attr => {
            const col = document.createElement('div');
            col.className = 'attr-column';

            const header = document.createElement('div');
            header.className = `attr-header`;
            header.innerHTML = `<span style="font-size:20px;">${attr === 'Strength' ? '🔴' : attr === 'Agility' ? '🟢' : '🔵'}</span> ${attr}`;
            col.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'hero-grid';

            this.heroes.filter(h => h.attribute === attr).forEach(hero => {
                grid.appendChild(this.createHeroCard(hero));
            });

            col.appendChild(grid);
            columnsContainer.appendChild(col);
        });

        this.container.appendChild(columnsContainer);
    }

    private renderFilteredGrid() {
        const container = document.createElement('div');
        container.className = 'columns-container';

        const grid = document.createElement('div');
        grid.className = 'hero-grid';

        this.heroes.forEach(hero => {
            if (this.currentFilter !== 'All' && hero.attribute !== this.currentFilter) return;

            // Show all heroes loaded from user profile
            grid.appendChild(this.createHeroCard(hero));
        });

        container.appendChild(grid);
        this.container.appendChild(container);
    }

    private createHeroCard(hero: HeroData): HTMLElement {
        const card = document.createElement('div');
        card.className = 'hero-card';

        // Star-based border colors
        let borderColor = '#d4af37'; // Default Gold
        if (hero.stars === 1) borderColor = '#22c55e'; // Green
        else if (hero.stars === 2) borderColor = '#3b82f6'; // Blue
        else if (hero.stars === 3) borderColor = '#eab308'; // Yellow
        else if (hero.stars === 4) borderColor = '#f97316'; // Orange
        else if (hero.stars === 5) borderColor = '#ef4444'; // Red

        // Basic card styling to match the new design
        card.style.cssText = `
            width: 180px; height: 180px; 
            background: #2a2a2a; 
            border: 3px solid ${borderColor};
            border-radius: 12px; 
            position: relative; 
            cursor: pointer;
            transition: transform 0.1s;
        `;

        // Selection Logic Reuse
        if (this.selectedHeroes.has(hero.name)) {
            card.classList.add('selected');
            card.style.boxShadow = '0 0 15px #00ff00';
            card.style.borderColor = '#00ff00';
        }

        const clickHandler = () => {
            console.log('[HeroList] Card clicked for:', hero.name, 'ID:', hero.instanceId);
            if (this.currentMode === 'SELECT') {
                if (this.selectedHeroes.has(hero.name)) this.selectedHeroes.delete(hero.name);
                else {
                    if (this.selectedHeroes.size >= 6) { alert("Team is full!"); return; }
                    this.selectedHeroes.add(hero.name);
                }
                this.render();
                this.onSelect(Array.from(this.selectedHeroes));
            } else {
                // VIEW MODE - OPEN UPGRADE UI
                const asset = HERO_ASSETS.find(a => a.name === hero.name);
                if (asset && this.user) {
                    if (!hero.instanceId) {
                        console.error('[HeroList] ERROR: Hero instanceId is missing!', hero);
                        alert('Error: Hero data is corrupted. Please refresh.');
                        return;
                    }
                    const upgradeModal = new HeroUpgradeModal(asset, hero.instanceId, this.user,
                        () => { this.render(); },
                        (updatedUser) => {
                            console.log('[HeroList] onUserUpdate called with gold:', updatedUser.gold);
                            this.user = updatedUser;
                            if (this.onUserUpdate) this.onUserUpdate(updatedUser);
                            this.loadHeroes();
                            this.render();
                        }
                    );
                    document.body.appendChild(upgradeModal.getBackdrop());
                    document.body.appendChild(upgradeModal.getElement());
                } else {
                    if (this.onView) this.onView(hero.name);
                }
            }
        };
        card.onclick = clickHandler;

        // Hover effect (scale only, no animation)
        card.onmouseenter = () => { card.style.transform = 'scale(1.05)'; };
        card.onmouseleave = () => { card.style.transform = 'scale(1)'; };

        // --- Inner Content ---

        // Map stat to attribute icon and color
        const attrColorMap = { 'Strength': '#dc2626', 'Agility': '#16a34a', 'Intelligence': '#2563eb' }; // Red, Green, Blue
        const attrColor = (attrColorMap as any)[hero.attribute] || '#1f2937';

        // Icon Paths
        let iconPath = '/assets/attr/attribute/str.svg';
        if (hero.attribute === 'Agility') iconPath = '/assets/attr/attribute/agi.svg';
        if (hero.attribute === 'Intelligence') iconPath = '/assets/attr/attribute/int.svg';

        // Stars HTML
        let starsHtml = '';
        for (let i = 0; i < hero.stars; i++) {
            starsHtml += `<span style="color: #fbbf24; font-size: 2rem; margin: 0 -2px;">★</span>`;
        }

        const asset = HERO_ASSETS.find(a => a.name === hero.name);

        // Image Container
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `
            width: 100%; height: 100%;
            border-radius: 9px;
            overflow: hidden;
            position: relative;
        `;

        if (asset && asset.sprite2D) {
            const displaySize = 180; // Match card size (updated by user)
            const framesPerRow = asset.sprite2D.framesPerRow;
            const totalRows = Math.ceil(asset.sprite2D.totalFrames / framesPerRow);
            const scaledSheetWidth = framesPerRow * displaySize;
            const scaledSheetHeight = totalRows * displaySize;

            const spritePreview = document.createElement('div');
            spritePreview.style.cssText = `
                width: ${displaySize}px;
                height: ${displaySize}px;
                background-image: url('${asset.sprite2D.spritesheetPath}');
                background-size: ${scaledSheetWidth}px ${scaledSheetHeight}px;
                background-position: 0 0;
                background-repeat: no-repeat;
                /* Scale to zoom in on the character face/body */
                transform: scale(3.5) translateY(10%) translateX(4%); 
                transform-origin: center center;
                filter: saturate(1.1) contrast(1.1);
            `;
            imgContainer.appendChild(spritePreview);
        } else {
            // Fallback
            imgContainer.innerHTML = '<div style="font-size:40px; text-align:center; line-height:100px;">?</div>';
        }

        // Determine Class and Species based on Hero Name
        let heroClass = 'Unknown';
        let heroSpecies = 'Unknown';
        let classIconChar = '?';
        let speciesIconChar = '?';
        let classColor = '#4b2c20'; // Brown default
        let speciesColor = '#2d4a22'; // Green default

        const lowerName = hero.name.toLowerCase();
        if (lowerName.includes('oryx') || lowerName.includes('mage')) {
            heroClass = 'Mage';
            heroSpecies = 'Antelope';
            classIconChar = '🔮';
            speciesIconChar = '🦌';
            classColor = '#9333ea'; // Purple
            speciesColor = '#ca8a04'; // Dark Yellow/Brown
        } else if (lowerName.includes('sable') || lowerName.includes('ranger')) {
            heroClass = 'Ranger';
            heroSpecies = 'Antelope';
            classIconChar = '🏹';
            speciesIconChar = '🦌';
            classColor = '#16a34a'; // Green
            speciesColor = '#ca8a04'; // Dark Yellow/Brown
        } else if (lowerName.includes('razor') || lowerName.includes('assassin') || lowerName.includes('boar')) {
            heroClass = 'Assassin';
            heroSpecies = 'Boar';
            classIconChar = '🗡️';
            speciesIconChar = '🐗';
            classColor = '#dc2626'; // Red
            speciesColor = '#7f1d1d'; // Dark Red/Brown
        }

        card.innerHTML = `
            <!-- Attribute Icon (Top Left) -->
            <div style="
                position: absolute; top: -8px; left: -8px; 
                width: 28px; height: 28px; 
                background: ${attrColor}; border: 1px solid #fff; border-radius: 50%;
                display: flex; justify-content: center; align-items: center; z-index: 10;
                box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            " title="Attribute: ${hero.attribute}">
                <img src="${iconPath}" style="width: 18px; height: 18px; filter: brightness(0) invert(1);">
            </div>

            <!-- Class Icon (Below Attribute) -->
            <div style="
                position: absolute; top: 24px; left: -8px; 
                width: 28px; height: 28px; 
                background: ${classColor}; border: 1px solid #fff; border-radius: 50%;
                display: flex; justify-content: center; align-items: center; z-index: 9;
                box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            " title="Class: ${heroClass}">
                <span style="font-size: 14px;">${classIconChar}</span>
            </div>

            <!-- Species Icon (Below Class) -->
            <div style="
                position: absolute; top: 56px; left: -8px; 
                width: 28px; height: 28px; 
                background: ${speciesColor}; border: 1px solid #fff; border-radius: 50%;
                display: flex; justify-content: center; align-items: center; z-index: 8;
                box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            " title="Species: ${heroSpecies}">
                <span style="font-size: 14px;">${speciesIconChar}</span>
            </div>

            <!-- Level (Top Right) -->
                <div style="
                position: absolute; top: 5px; right: 8px; 
                color: #fff; font-size: 1.1rem; font-weight: bold; text-shadow: 1px 1px 2px #000;
                z-index: 10; font-family: 'SF Pro Rounded', sans-serif;
            ">${hero.level}</div>

            <!-- Card Image (Appended via JS) -->
            <div class="card-image-slot" style="width:100%; height:100%;"></div>

            <!-- Stars (Bottom) -->
            <div style="
                position: absolute; bottom: 5px; 
                width: 100%; text-align: center; 
                display: flex; justify-content: center;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                z-index: 10;
            ">
                ${starsHtml}
            </div>
        `;

        card.querySelector('.card-image-slot')?.appendChild(imgContainer);

        return card;
    }
}
