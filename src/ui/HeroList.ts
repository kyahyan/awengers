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
    private currentSort: string = '';
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

    public getSelectedHeroes(): string[] {
        return Array.from(this.selectedHeroes);
    }

    private setFilter(attribute: string) {
        this.currentFilter = attribute;
        this.render();
    }

    private sortHeroes(sortOption: string) {
        if (sortOption === 'Sort By...') return;

        this.heroes.sort((a, b) => {
            switch (sortOption) {
                case 'Star ↓': return b.stars - a.stars;
                case 'Star ↑': return a.stars - b.stars;
                case 'Level ↓': return b.level - a.level;
                case 'Level ↑': return a.level - b.level;
                case 'Power ↓': return (this.calculateHeroPower(b) || 0) - (this.calculateHeroPower(a) || 0);
                case 'Power ↑': return (this.calculateHeroPower(a) || 0) - (this.calculateHeroPower(b) || 0);
                case 'Species': return a.species.localeCompare(b.species);
                case 'Mythic': return (b.stars >= 5 ? 1 : 0) - (a.stars >= 5 ? 1 : 0);
                default: return 0;
            }
        });
        this.render();
    }

    private calculateHeroPower(hero: HeroData): number {
        // Simple power formula based on level and stars
        const basePower = hero.level * 100;
        const starMultiplier = 1 + (hero.stars - 1) * 0.5;
        return Math.round(basePower * starMultiplier);
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
            filterBar.style.cssText = `
                position: absolute; top: 100px; left: 50%; transform: translateX(-50%);
                width: 90%; max-width: 900px;
                display: flex; justify-content: space-between; align-items: center;
                z-index: 100; pointer-events: auto;
            `;

            // LEFT SIDE: Attribute Filters
            const attrGroup = document.createElement('div');
            attrGroup.style.cssText = `display: flex; gap: 8px; align-items: center;`;

            const attrFilters = [
                { name: 'Strength', icon: '/assets/attr/attribute/str.svg', color: '#dc2626' },
                { name: 'Agility', icon: '/assets/attr/attribute/agi.svg', color: '#16a34a' },
                { name: 'Intelligence', icon: '/assets/attr/attribute/int.svg', color: '#2563eb' }
            ];

            attrFilters.forEach(attr => {
                const btn = document.createElement('button');
                const isActive = this.currentFilter === attr.name;
                btn.style.cssText = `
                    display: flex; align-items: center; gap: 6px;
                    background: ${isActive
                        ? `linear-gradient(180deg, ${attr.color}cc 0%, ${attr.color}99 100%)`
                        : 'linear-gradient(180deg, #8b6542 0%, #5c3d25 100%)'};
                    color: #fff;
                    border: 2px solid ${isActive ? attr.color : '#3d2815'};
                    padding: 8px 14px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-family: 'SF Pro Rounded', sans-serif;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    transition: all 0.2s ease;
                    pointer-events: auto;
                    box-shadow: ${isActive ? `0 0 12px ${attr.color}66` : 'none'};
                `;
                btn.innerHTML = `
                    <img src="${attr.icon}" style="width: 18px; height: 18px; filter: brightness(0) invert(1);" />
                    <span>${attr.name.substring(0, 3).toUpperCase()}</span>
                `;
                btn.addEventListener('click', () => this.setFilter(attr.name));
                btn.onmouseenter = () => {
                    if (this.currentFilter !== attr.name) {
                        btn.style.background = `linear-gradient(180deg, ${attr.color}88 0%, ${attr.color}66 100%)`;
                        btn.style.borderColor = attr.color;
                    }
                };
                btn.onmouseleave = () => {
                    if (this.currentFilter !== attr.name) {
                        btn.style.background = 'linear-gradient(180deg, #8b6542 0%, #5c3d25 100%)';
                        btn.style.borderColor = '#3d2815';
                    }
                };
                attrGroup.appendChild(btn);
            });
            filterBar.appendChild(attrGroup);

            // RIGHT SIDE: Sort Buttons
            const sortGroup = document.createElement('div');
            sortGroup.style.cssText = `display: flex; gap: 6px; align-items: center;`;

            const sortOptions = [
                { icon: '⭐', label: 'Star', value: 'Star', tooltip: 'Sort by Stars' },
                { icon: '📊', label: 'Level', value: 'Level', tooltip: 'Sort by Level' },
                { icon: '⚔️', label: 'Power', value: 'Power', tooltip: 'Sort by Combat Power' },
                { icon: '🐾', label: 'Species', value: 'Species', tooltip: 'Sort by Species' },
                { icon: '✨', label: 'Mythic', value: 'Mythic', tooltip: 'Mythic First' }
            ];

            sortOptions.forEach(sort => {
                const btn = document.createElement('button');
                const isActive = this.currentSort.includes(sort.value);
                const isDesc = this.currentSort === sort.value + ' ↓';
                btn.title = sort.tooltip;
                btn.style.cssText = `
                    display: flex; align-items: center; justify-content: center; gap: 5px;
                    background: ${isActive ? 'linear-gradient(180deg, #c9a66b 0%, #8b6542 100%)' : 'linear-gradient(180deg, #8b6542 0%, #5c3d25 100%)'};
                    color: ${isActive ? '#3d2815' : '#fff'};
                    border: 2px solid ${isActive ? '#dec88f' : '#3d2815'};
                    padding: 8px 12px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-family: 'SF Pro Rounded', sans-serif;
                    font-size: 0.8rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    pointer-events: auto;
                    box-shadow: ${isActive ? '0 0 10px rgba(222, 200, 143, 0.5)' : 'none'};
                `;
                btn.innerHTML = `<span style="font-size: 1rem;">${sort.icon}</span> ${sort.label}${isActive ? (isDesc ? ' ↓' : ' ↑') : ''}`;
                btn.addEventListener('click', () => {
                    // Toggle between ascending and descending, or activate
                    if (this.currentSort === sort.value + ' ↓') {
                        this.currentSort = sort.value + ' ↑';
                    } else if (this.currentSort === sort.value + ' ↑') {
                        this.currentSort = ''; // Reset
                    } else {
                        this.currentSort = sort.value + ' ↓';
                    }
                    this.sortHeroes(this.currentSort);
                });
                btn.onmouseenter = () => {
                    if (!isActive) btn.style.background = 'linear-gradient(180deg, #9a6e48 0%, #6b4830 100%)';
                };
                btn.onmouseleave = () => {
                    if (!isActive) btn.style.background = 'linear-gradient(180deg, #8b6542 0%, #5c3d25 100%)';
                };
                sortGroup.appendChild(btn);
            });



            filterBar.appendChild(sortGroup);

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

        // Star-based border colors with glow effect
        let borderColor = '#d4af37'; // Default Gold
        let glowColor = 'rgba(212, 175, 55, 0.6)';
        if (hero.stars === 1) {
            borderColor = '#4ade80'; // Bright Green
            glowColor = 'rgba(74, 222, 128, 0.7)';
        } else if (hero.stars === 2) {
            borderColor = '#60a5fa'; // Bright Blue
            glowColor = 'rgba(96, 165, 250, 0.7)';
        } else if (hero.stars === 3) {
            borderColor = '#facc15'; // Bright Yellow
            glowColor = 'rgba(250, 204, 21, 0.7)';
        } else if (hero.stars === 4) {
            borderColor = '#fb923c'; // Bright Orange
            glowColor = 'rgba(251, 146, 60, 0.7)';
        } else if (hero.stars === 5) {
            borderColor = '#f472b6'; // Bright Pink/Magenta
            glowColor = 'rgba(244, 114, 182, 0.7)';
        }

        // Card styling with glowing border effect matching reference
        card.style.cssText = `
            width: 180px; height: 220px; 
            background: linear-gradient(145deg, ${borderColor} 0%, ${borderColor}88 50%, ${borderColor} 100%);
            border: none;
            border-radius: 16px; 
            padding: 4px;
            position: relative; 
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 0 15px ${glowColor}, 0 0 30px ${glowColor}44, inset 0 0 8px rgba(255,255,255,0.1);
        `;

        // Inner container for the actual card content
        const innerCard = document.createElement('div');
        innerCard.style.cssText = `
            width: 100%; height: 100%;
            background: #1a1a2e;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
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

        // Hover effect with enhanced glow
        card.onmouseenter = () => {
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 60px ${glowColor}66`;
        };
        card.onmouseleave = () => {
            card.style.transform = 'scale(1)';
            card.style.boxShadow = `0 0 15px ${glowColor}, 0 0 30px ${glowColor}44, inset 0 0 8px rgba(255,255,255,0.1)`;
        };

        // --- Inner Content ---

        // Map stat to attribute icon and color
        const attrColorMap = { 'Strength': '#dc2626', 'Agility': '#16a34a', 'Intelligence': '#2563eb' }; // Red, Green, Blue
        const attrColor = (attrColorMap as any)[hero.attribute] || '#1f2937';

        // Icon Paths
        let iconPath = '/assets/attr/attribute/str.svg';
        if (hero.attribute === 'Agility') iconPath = '/assets/attr/attribute/agi.svg';
        if (hero.attribute === 'Intelligence') iconPath = '/assets/attr/attribute/int.svg';

        // Stars HTML (smaller size)
        let starsHtml = '';
        for (let i = 0; i < hero.stars; i++) {
            starsHtml += `<span style="color: #fbbf24; font-size: 1.2rem; margin: 0 -1px;">★</span>`;
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

            // Derive portrait path from spritesheet path
            // e.g., "/assets/Character/heroes/antelope_mage_with_animation_spritesheets/side-left/..." 
            // -> "/assets/Character/heroes/antelope_mage_with_animation_spritesheets/portrait/antelope mage.jpg"
            const spritePath = asset.sprite2D.spritesheetPath;
            const heroFolderMatch = spritePath.match(/\/assets\/Character\/heroes\/([^\/]+)/);

            let portraitPath = '';
            if (heroFolderMatch) {
                const heroFolder = heroFolderMatch[1];
                // Convert folder name to portrait filename
                // e.g., "antelope_mage_with_animation_spritesheets" -> "antelope mage"
                const portraitName = heroFolder.replace('_with_animation_spritesheets', '').replace(/_/g, ' ');
                portraitPath = `/assets/Character/heroes/${heroFolder}/portrait/${portraitName}.jpg`;
            }

            const spritePreview = document.createElement('div');
            spritePreview.style.cssText = `
                width: ${displaySize}px;
                height: ${displaySize}px;
                background-image: url('${portraitPath}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
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

        // Build the inner card with the portrait and overlays
        innerCard.innerHTML = `
            <!-- Card Image (Background) -->
            <div class="card-image-slot" style="width:100%; height:100%; position: absolute; top: 0; left: 0;"></div>

            <!-- Bottom Info Bar -->
            <div style="
                position: absolute; bottom: 0; left: 0; right: 0;
                z-index: 10;
            ">
                <!-- Level Bar with border color background -->
                <div style="
                    background: ${borderColor}cc;
                    padding: 5px 0;
                    text-align: center;
                ">
                    <span style="
                        color: #fff; 
                        font-size: 0.95rem; 
                        font-weight: 700;
                        font-family: 'SF Pro Rounded', sans-serif;
                        text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
                    ">Level ${hero.level}</span>
                </div>
                <!-- Stars Row -->
                <div style="
                    background: rgba(0, 0, 0, 0.8);
                    padding: 4px 0 6px 0;
                    display: flex; justify-content: center; gap: 1px;
                    border-radius: 0 0 8px 8px;
                ">
                    ${starsHtml}
                </div>
            </div>
        `;

        // Append the inner card to the main card (creates the border frame effect)
        card.appendChild(innerCard);

        // Icons are absolute positioned on the CARD (outer element) so they overlap the border
        const iconsHtml = `
            <!-- Attribute Icon (Top Left) -->
            <div style="
                position: absolute; top: -8px; left: -8px; 
                width: 28px; height: 28px; 
                background: ${attrColor}; border: 2px solid #fff; border-radius: 50%;
                display: flex; justify-content: center; align-items: center; z-index: 20;
                box-shadow: 2px 2px 6px rgba(0,0,0,0.6);
            " title="Attribute: ${hero.attribute}">
                <img src="${iconPath}" style="width: 16px; height: 16px; filter: brightness(0) invert(1);">
            </div>

            <!-- Class Icon (Below Attribute) -->
            <div style="
                position: absolute; top: 26px; left: -8px; 
                width: 28px; height: 28px; 
                background: ${classColor}; border: 2px solid #fff; border-radius: 50%;
                display: flex; justify-content: center; align-items: center; z-index: 19;
                box-shadow: 2px 2px 6px rgba(0,0,0,0.6);
            " title="Class: ${heroClass}">
                <span style="font-size: 13px;">${classIconChar}</span>
            </div>

            <!-- Species Icon (Below Class) -->
            <div style="
                position: absolute; top: 60px; left: -8px; 
                width: 28px; height: 28px; 
                background: ${speciesColor}; border: 2px solid #fff; border-radius: 50%;
                display: flex; justify-content: center; align-items: center; z-index: 18;
                box-shadow: 2px 2px 6px rgba(0,0,0,0.6);
            " title="Species: ${heroSpecies}">
                <span style="font-size: 13px;">${speciesIconChar}</span>
            </div>
        `;
        card.insertAdjacentHTML('beforeend', iconsHtml);

        innerCard.querySelector('.card-image-slot')?.appendChild(imgContainer);

        return card;
    }
}
