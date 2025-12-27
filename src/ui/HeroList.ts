import { HERO_DEFINITIONS, HeroDef, calculateHeroStats, STAR_RANK_CONFIG } from '../data/HeroDefinitions';

export interface HeroData {
    name: string; // The Code Name
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
    private currentFilter: string = 'Strength'; // Default to Strength (no 'All' filter)
    private selectedHeroes: Set<string>;
    private ownedHeroes: Set<string>; // New: Track owned heroes
    private onSelect: (selectedNames: string[]) => void;
    private onView?: (heroName: string) => void;

    constructor(onSelect: (selectedNames: string[]) => void, onView?: (heroName: string) => void) {
        this.onSelect = onSelect;
        this.onView = onView;
        this.container = document.createElement('div');
        this.container.className = 'hero-list-container';
        // Add padding at top for the filter bar
        this.container.style.paddingTop = '60px';

        this.selectedHeroes = new Set();
        this.ownedHeroes = new Set();
        this.currentMode = 'VIEW';
        this.currentFilter = 'Strength'; // Default to Strength (no 'All' filter)

        this.heroes = [];
        this.loadHeroes();
    }

    public setOwned(owned: string[]) {
        this.ownedHeroes = new Set(owned);
        this.render();
    }

    public getVisibleHeroNames(): string[] {
        return this.heroes
            .filter(h => this.currentFilter === 'All' || h.attribute === this.currentFilter)
            .filter(h => this.ownedHeroes.has(h.name))
            .map(h => h.name);
    }

    // ... existing methods ...

    // Spritesheet configuration per hero - defines background-size and position for grid vs horizontal layouts
    private heroSpriteConfig: Record<string, { bgSize: string; bgPos: string }> = {
        // Elephant Mage: 2560x5120 grid layout (5 cols x 10 rows, 512x512 per frame)
        // Zoomed into face/upper body area
        'Elephant Mage': { bgSize: '1500% 2200%', bgPos: '7% 2%' },
    };

    private loadHeroes() {
        // Mapping of hero names to their spritesheet folder names
        const heroSpriteMap: Record<string, string> = {
            // Standard Heroes
            'Antelope Mage': 'antelope_mage_with_animation_spritesheets',
            'Antelope Ranger': 'antelope_ranger_with_animation_spritesheets',
            'Boar Assassin': 'boar_assassin_with_animation_spritesheets',
            'Bull Assassin': 'bull_assassin_with_anim_spritesheets',
            'Bull Mage': 'bull_mage_with_animation_spritesheets',
            'Bull Ranger': 'bull_ranger_with_animation_spritesheets',
            'Crocodile Assassin': 'crocodile_assassin_with_animation_spritesheets',
            'Crocodile Knight': 'crocodile_knight_with_animation_spritesheets',
            'Crocodile Mage': 'crocodile_mage_with_animation_spritesheets',
            'Crocodile Warrior': 'crocodile_warrior_with_animation_spritesheets',
            'Dog Mage': 'dog_mage_with_animation_spritesheets',
            'Dog Ranger': 'dog_ranger_with_animation_spritesheets',
            'Dog Warrior': 'dog_warrior_with_animation_spritesheets',
            'Elephant Mage': 'elephant_mage_with_animation_spritesheets',
            // Mythic Heroes
            'Rabbit Ranger': 'Mythic/rabbit_ranger_heavy_artillery_pioneer_with_anim_spritesheets',
        };

        // Iterate over attributes: Strength, Agility, Intelligence
        for (const [attribute, heroDefs] of Object.entries(HERO_DEFINITIONS)) {
            heroDefs.forEach((def: HeroDef) => {
                const species = def.name.split(' ')[0];
                let stars = 1;
                if (def.rarity === 'Mythic') stars = 5;
                else if (def.rarity === 'Legendary') stars = 4;
                else if (def.rarity === 'Rare') stars = 3;

                // Determine image path based on hero name
                let imagePath: string | undefined = undefined;
                const folderName = heroSpriteMap[def.name];
                if (folderName) {
                    imagePath = `/assets/heroes/${folderName}/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png`;
                }

                this.heroes.push({
                    name: def.codeName,
                    species: species,
                    classType: def.class,
                    attribute: attribute,
                    level: 1,
                    stars: stars,
                    imagePath: imagePath,
                    stats: def
                });
            });
        }
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
        this.container.innerHTML = '';
        this.container.style.paddingTop = '0'; // Reset padding for absolute layout
        this.container.style.position = 'relative';
        this.container.style.height = '100%';
        this.container.style.overflow = 'hidden';

        // --- Filter Bar ---
        const filterBar = document.createElement('div');
        filterBar.className = 'filter-bar';
        filterBar.style.position = 'absolute';
        filterBar.style.top = '10px';
        filterBar.style.left = '240px'; // Moved to the left, after sidebar
        filterBar.style.width = 'auto';
        filterBar.style.height = '50px';
        filterBar.style.display = 'flex';
        filterBar.style.justifyContent = 'flex-start'; // Align to left
        filterBar.style.alignItems = 'center';
        filterBar.style.gap = '10px';
        filterBar.style.zIndex = '10';

        const filters = ['Strength', 'Agility', 'Intelligence']; // Removed 'All'
        filters.forEach(filter => {
            const btn = document.createElement('button');
            btn.innerText = filter;
            btn.className = `filter-btn ${this.currentFilter === filter ? 'active' : ''}`;
            btn.addEventListener('click', () => this.setFilter(filter));
            filterBar.appendChild(btn);
        });

        // Add filter styles
        const style = document.createElement('style');
        style.innerText = `
            .filter-btn {
                background: #333; color: #888; border: 1px solid #555;
                padding: 5px 15px; border-radius: 15px; cursor: pointer;
            }
            .filter-btn.active {
                background: #ffd700; color: #000; font-weight: bold; border-color: #ffd700;
            }
        `;
        filterBar.appendChild(style);
        this.container.appendChild(filterBar);

        // --- Main Content ---
        if (this.currentFilter === 'All') {
            this.renderCategorizedColumns();
        } else {
            this.renderFilteredGrid();
        }

        const cardStyle = document.createElement('style');
        cardStyle.innerText = `
            /* Columns Layout - Fixed positioning after sidebar */
            .columns-container {
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 70px; /* Below filter bar */
                left: 240px; /* After sidebar */
                right: 20px; /* Right margin */
                bottom: 20px; /* Bottom margin */
                padding: 12px;
                gap: 12px;
                overflow-y: auto;
                overflow-x: hidden;
                box-sizing: border-box;
                /* Hide scrollbar */
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            .columns-container::-webkit-scrollbar {
                display: none;
            }
            .attr-column {
                display: flex;
                flex-direction: column;
                gap: 12px;
                width: 100%;
            }
            .attr-header {
                display: flex;
                align-items: center;
                gap: 10px;
                padding-bottom: 8px;
                border-bottom: 2px solid #333;
                font-family: 'SF Pro Display', sans-serif;
                font-size: 1rem;
                color: #fff;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .header-icon {
                width: 20px; height: 20px;
                border-radius: 50%;
                border: 2px solid #fff;
            }
            .header-strength { color: #e74c3c; border-color: #e74c3c; }
            .header-agility { color: #2ecc71; border-color: #2ecc71; }
            .header-intelligence { color: #3498db; border-color: #3498db; }

            /* Grid Layout - 10 cards horizontally per attribute */
            .hero-grid {
                display: grid;
                grid-template-columns: repeat(10, 1fr); /* 10 cards per row */
                gap: 12px; /* Uniform gap all sides */
                width: 100%;
                justify-items: center;
            }

            /* ... Existing Card Styles ... */
            .hero-card {
                position: relative;
                width: 100%;
                max-width: 250px; /* Increased card size */
                aspect-ratio: 7 / 10; /* Taller card proportion */
                display: flex;
                justify-content: center;
                align-items: center;
                transition: transform 0.1s;
                margin: 0;
                overflow: hidden; 
                background: transparent;
            }
            .hero-card:hover {
                transform: scale(1.1);
                z-index: 100;
            }
            .hero-card.locked {
                filter: grayscale(100%) brightness(50%);
                opacity: 0.7;
            }
            
            .hero-image {
                width: 100%; height: 100%;
                object-fit: cover;
                position: absolute; top: 0; left: 0;
                z-index: 1;
            }
            
            .hero-image-sprite {
                width: 100%; height: 100%;
                position: absolute; top: 0; left: 0;
                z-index: 1;
                background-size: 14000% 220%;
                background-position: 0.70% 42%;
                background-repeat: no-repeat;
            }
            
            .hero-frame {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                z-index: 10;
                pointer-events: none;
                object-fit: fill;
            }

            .info-overlay {
                position: absolute; top: 0; width: 100%; height: 100%;
                z-index: 30; pointer-events: none;
            }
            .info-overlay * {
                pointer-events: none !important;
            }

            .class-icon {
                position: absolute; top: 5px; left: 5px;
                width: 18px; height: 18px;
                background: rgba(0,0,0,0.6); color: #fff;
                border-radius: 50%; display: flex; justify-content: center; align-items: center;
                font-size: 10px; border: 1px solid #fff; font-weight: bold; z-index: 20;
                pointer-events: none;
            }
            .attr-icon {
                position: absolute; top: 5px; right: 5px;
                width: 18px; height: 18px;
                border-radius: 50%; display: flex; justify-content: center; align-items: center;
                font-size: 8px; color: #fff; font-weight: bold;
                border: 1px solid rgba(255,255,255,0.5); z-index: 20;
                pointer-events: none;
            }
            .attr-strength { background: #e74c3c; }
            .attr-agility { background: #2ecc71; }
            .attr-intelligence { background: #3498db; }

            .notification-badge {
                position: absolute; top: 0; right: 0;
                width: 14px; height: 14px; background: red; color: white;
                border-radius: 50%; font-size: 9px; font-weight: bold;
                display: flex; justify-content: center; align-items: center;
                border: 1px solid white; z-index: 30;
                pointer-events: none;
            }

            .hero-level {
                position: absolute; bottom: 48px; left: 15px;
                font-size: 20px; color: #fff; font-weight: 900;
                font-family: 'SF Pro Display', sans-serif;
                text-transform: uppercase; text-shadow: 2px 2px 0 #000; z-index: 20;
                pointer-events: none;
            }

            .hero-stars {
                position: absolute; bottom: 12px; left: 0; width: 100%; height: 38px;
                display: flex; justify-content: center; align-items: center;
                gap: 2px; z-index: 20; padding-bottom: 2px;
                pointer-events: none;
            }
            .star-icon { width: 18px; height: 18px; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.8)); pointer-events: none; }
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

            // Header
            const header = document.createElement('div');
            header.className = `attr-header header-${attr.toLowerCase()}`;
            header.innerHTML = `<span style="font-size:24px;">${attr === 'Strength' ? '🔴' : attr === 'Agility' ? '🟢' : '🔵'}</span> ${attr}`;
            col.appendChild(header);

            // Grid
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
        const grid = document.createElement('div');
        grid.className = 'columns-container'; // Reuse container for padding/bg
        grid.style.display = 'block'; // Override flex for single filtering

        const innerGrid = document.createElement('div');
        innerGrid.className = 'hero-grid';
        innerGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(110px, 1fr))';

        this.heroes.forEach(hero => {
            if (this.currentFilter !== 'All' && hero.attribute !== this.currentFilter) return;
            innerGrid.appendChild(this.createHeroCard(hero));
        });

        grid.appendChild(innerGrid);
        this.container.appendChild(grid);
    }

    private createHeroCard(hero: HeroData): HTMLElement {
        // Calculate Stats & Max Level
        const config = STAR_RANK_CONFIG[hero.stars] || STAR_RANK_CONFIG[1];
        const stats = calculateHeroStats(hero.stats!, hero.level, hero.stars);

        // Determine Border Asset (Retaining existing logic)
        let borderAsset = 'blue.png';
        if (hero.stars <= 3) borderAsset = 'blue.png';
        else if (hero.stars === 4) borderAsset = 'purple.png';
        else if (hero.stars >= 5 && hero.stars <= 8) borderAsset = 'orange.png';
        else if (hero.stars === 9) borderAsset = 'red.png';
        else if (hero.stars >= 10) borderAsset = 'ultra.png';
        const borderUrl = `/assets/Border%20Cards/${borderAsset}`;

        const card = document.createElement('div');
        card.className = 'hero-card';

        const isOwned = this.ownedHeroes.has(hero.name);
        if (!isOwned) {
            card.classList.add('locked');
        }

        // Selection Logic
        if (this.selectedHeroes.has(hero.name)) card.classList.add('selected');
        if (this.currentMode === 'SELECT') {
            // Only allow selecting owned heroes? For now allow all or just owned?
            // Usually you can only deploy owned heroes.
            if (isOwned) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    if (this.selectedHeroes.has(hero.name)) this.selectedHeroes.delete(hero.name);
                    else {
                        if (this.selectedHeroes.size >= 6) { alert("Team is full!"); return; }
                        this.selectedHeroes.add(hero.name);
                    }
                    this.render();
                    this.onSelect(Array.from(this.selectedHeroes));
                });
            } else {
                card.style.cursor = 'not-allowed';
            }
        } else {
            // VIEW Mode
            if (isOwned && this.onView) {
                card.style.cursor = 'pointer';
                card.setAttribute('data-clickable', 'true'); // Debug attribute
                card.addEventListener('click', (e) => {
                    console.log(`[HeroList] Clicked on hero: ${hero.name}`);
                    if (this.onView) this.onView(hero.name);
                });
            } else {
                card.style.cursor = 'default';
            }
        }

        // Image - Use div with background-image for spritesheets
        if (hero.imagePath && hero.imagePath.includes('spritesheet')) {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'hero-image-sprite';
            imgDiv.style.backgroundImage = `url('${hero.imagePath}')`;

            // Check for per-hero sprite config (for different spritesheet layouts)
            const heroDefName = hero.stats?.name;
            if (heroDefName && this.heroSpriteConfig[heroDefName]) {
                const config = this.heroSpriteConfig[heroDefName];
                // Use cssText with !important to override class styles
                imgDiv.style.cssText = `
                    background-image: url('${hero.imagePath}');
                    background-size: ${config.bgSize} !important;
                    background-position: ${config.bgPos} !important;
                    width: 100%; height: 100%;
                    position: absolute; top: 0; left: 0;
                    z-index: 1;
                    background-repeat: no-repeat;
                `;
                console.log(`[HeroList] Applied custom sprite config for ${heroDefName}:`, config);
            }

            card.appendChild(imgDiv);
        } else {
            const img = document.createElement('img');
            img.className = 'hero-image';
            img.src = hero.imagePath || `https://via.placeholder.com/100x140?text=${hero.name.substring(0, 3)}`;
            card.appendChild(img);
        }

        // Frame
        const frame = document.createElement('img');
        frame.className = 'hero-frame';
        frame.src = borderUrl;
        card.appendChild(frame);

        // Info
        const info = document.createElement('div');
        info.className = 'info-overlay';

        // Class Icon
        const classIcon = document.createElement('div');
        classIcon.className = 'class-icon';
        classIcon.innerText = hero.classType[0];
        classIcon.title = `${hero.name}\n${hero.classType}`;
        info.appendChild(classIcon);

        // Attr Icon
        const attrIcon = document.createElement('div');
        attrIcon.className = `attr-icon attr-${hero.attribute.toLowerCase()}`;
        attrIcon.innerText = hero.attribute[0];
        info.appendChild(attrIcon);

        // Level
        const level = document.createElement('div');
        level.className = 'hero-level';
        level.innerText = `LVL ${hero.level}`;
        info.appendChild(level);

        // Stars
        const stars = document.createElement('div');
        stars.className = 'hero-stars';
        for (let i = 0; i < hero.stars; i++) {
            const s = document.createElement('img');
            s.src = '/assets/star.png';
            s.className = 'star-icon';
            stars.appendChild(s);
        }
        info.appendChild(stars);

        if (hero.hasNotification) {
            const n = document.createElement('div');
            n.className = 'notification-badge';
            n.innerText = '!';
            info.appendChild(n);
        }

        card.appendChild(info);
        return card;
    }
}
