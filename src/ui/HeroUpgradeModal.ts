import { HeroAssetConfig, HERO_ASSETS } from '../data/HeroAssetsMap';
import { createOryxHero, createSableHero, createRazorHero, HeroProgressionManager, SkillDefinition, HeroInstance } from '../data/HeroProgression';
import { ITEMS } from '../data/Items';

export class HeroUpgradeModal {
    private backdrop: HTMLElement;
    private container: HTMLElement;
    private animInterval: number | null = null;
    private heroManager: HeroProgressionManager;
    private escHandler: ((e: KeyboardEvent) => void) | null = null;
    private activeTooltip: HTMLElement | null = null;
    private documentClickHandler: ((e: MouseEvent) => void) | null = null;
    private instanceId: string;
    private heroAssetName: string;
    private user: any;
    private onUpdate: (updatedUser: any) => void;

    // Skill icon mappings per hero
    private skillIconPaths: Record<string, string> = {};

    // Attribute icon mappings
    private attrIconPaths: Record<string, string> = {
        'attack': '/assets/attr/attack.png',
        'hp': '/assets/attr/health.png',
        'armor': '/assets/attr/armor.png',
        'aspd': '/assets/attr/atk-speed.png',
        'moveSpeed': '/assets/attr/boots.png'
    };


    // State
    private activeTab: 'equipment' | 'evolution' = 'equipment';
    private selectedSacrifices: Map<number, string> = new Map(); // slot index -> instanceId
    private heroSelectionModal: HTMLElement | null = null;

    constructor(hero: HeroAssetConfig, instanceId: string, user: any, onClose: () => void, onUpdate: (updatedUser: any) => void) {
        this.heroAssetName = hero.name;
        this.instanceId = instanceId;
        this.user = user;
        this.onUpdate = onUpdate;

        // Get persisted hero data by Instance ID
        let savedData;
        if (this.user.heroes instanceof Map) {
            savedData = this.user.heroes.get(this.instanceId);
        } else if (this.user.heroes) {
            savedData = this.user.heroes[this.instanceId];
        }

        // Fallback for legacy data/mixed state
        if (!savedData && this.user.heroes instanceof Map) {
            savedData = this.user.heroes.get(hero.name);
        }

        const heroLevel = savedData ? savedData.level : 1;

        const heroInstance: HeroInstance | undefined = savedData ? {
            heroId: savedData.heroId || this.instanceId,
            level: savedData.level,
            currentRankIndex: savedData.currentRankIndex || 0,
            experience: savedData.experience || 0,
            skillLevels: savedData.skillLevels || {},
            equipment: savedData.equipment || new Array(9).fill(null)
        } : undefined;

        // Determine which hero progression to use based on hero name
        const heroNameLower = hero.name.toLowerCase();

        if (heroNameLower.includes('ranger') || heroNameLower.includes('sable')) {
            this.heroManager = createSableHero(heroLevel, heroInstance);
            this.skillIconPaths = {
                'wind_piercer': '/assets/heroes/antelope_ranger_with_animation_spritesheets/skills/Wind-Piercer.png',
                'back_kick_vault': '/assets/heroes/antelope_ranger_with_animation_spritesheets/skills/Back-Kick Vault.png',
                'hunters_mark': "/assets/heroes/antelope_ranger_with_animation_spritesheets/skills/Hunter's Mark.png",
                'spirit_barrage': '/assets/heroes/antelope_ranger_with_animation_spritesheets/skills/Spirit Barrage.png'
            };
        } else if (heroNameLower.includes('razor') || heroNameLower.includes('assassin')) {
            this.heroManager = createRazorHero(heroLevel, heroInstance);
            this.skillIconPaths = {
                'tusk_gore': '/assets/heroes/boar_assassin_with_animation_spritesheets/skills/Tusk Gore.png',
                'wild_charge': '/assets/heroes/boar_assassin_with_animation_spritesheets/skills/Wild Charge.png',
                'blood_scent': '/assets/heroes/boar_assassin_with_animation_spritesheets/skills/Blood Scent.png',
                'guillotine_breaker': '/assets/heroes/boar_assassin_with_animation_spritesheets/skills/Guillotine Breaker.png'
            };
        } else {
            this.heroManager = createOryxHero(heroLevel, heroInstance);
            this.skillIconPaths = {
                'horn_bolt': '/assets/heroes/antelope_mage_with_animation_spritesheets/skills/Horn Bolt.png',
                'astral_leap': '/assets/heroes/antelope_mage_with_animation_spritesheets/skills/Astral Leap.png',
                'static_hooves': '/assets/heroes/antelope_mage_with_animation_spritesheets/skills/Static Hooves.png',
                'natures_wrath': "/assets/heroes/antelope_mage_with_animation_spritesheets/skills/Nature's Wrath.png"
            };
        }

        // Create UI
        this.backdrop = document.createElement('div');
        this.backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 99998;
            pointer-events: auto;
            cursor: pointer;
            opacity: 1;
            will-change: opacity;
        `;
        this.backdrop.onclick = () => {
            this.close();
            onClose();
        };

        this.container = document.createElement('div');
        this.container.className = 'hero-upgrade-modal';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 1250px;
            height: 85%;
            background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 30%, #16213e 70%, #0d0d1a 100%);
            display: flex;
            z-index: 99999;
            opacity: 1;
            font-family: 'SF Pro Rounded', sans-serif;
            box-sizing: border-box;
            border-radius: 20px;
            box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
            overflow: hidden;
            pointer-events: auto;
            will-change: opacity, transform;
            backface-visibility: hidden;
        `;

        this.renderContent();

        // ESC key to close
        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.close();
                onClose();
            }
        };
        document.addEventListener('keydown', this.escHandler);

        // Tooltip close
        this.container.onclick = () => this.hideTooltip();
    }

    private renderContent() {
        this.container.innerHTML = ''; // Clear previous content

        // Sync fresh user data from localStorage for real-time resource updates
        const savedSession = localStorage.getItem('awengers_session');
        if (savedSession) {
            try {
                this.user = JSON.parse(savedSession);
            } catch (e) {
                console.warn('[HeroUpgradeModal] Failed to parse session from localStorage');
            }
        }

        const heroLevel = this.heroManager.getCurrentLevel();
        const stats = this.heroManager.getCurrentStats();
        const config = this.heroManager.getConfig();
        const skills = config.skills;
        const currentLevelCap = this.heroManager.getCurrentLevelCap();
        const nextLevelCost = this.heroManager.getNextLevelCost(heroLevel);
        const heroPower = this.calculateHeroPower(stats, skills, heroLevel);

        // Check for star gating logic early to decide layout
        const heroInstanceLocal = this.heroManager.getHeroInstance();
        const currentRankIndex = heroInstanceLocal.currentRankIndex;
        const currentMilestone = config.rankUpMilestones[currentRankIndex];

        let heroStars = 1;
        if (this.user.heroes) {
            const hData = this.user.heroes instanceof Map
                ? this.user.heroes.get(this.instanceId)
                : this.user.heroes[this.instanceId];
            heroStars = hData?.stars || 1;
            console.log('[HeroUpgradeModal] Star data:', { instanceId: this.instanceId, stars: hData?.stars, heroStars, hData });
        }

        const isAtCap = this.heroManager.isAtLevelCap();
        const needsEvolution = isAtCap && currentMilestone?.starRequirement && heroStars < currentMilestone.starRequirement;

        // Close Button
        const closeBtn = document.createElement('div');
        closeBtn.innerText = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 25px;
            font-size: 1.8rem;
            color: rgba(255,255,255,0.4);
            cursor: pointer;
            transition: all 0.2s;
            z-index: 100000;
            pointer-events: auto;
        `;
        closeBtn.onclick = () => this.backdrop.click();
        this.container.appendChild(closeBtn);


        // === LEFT PANEL - Hero Info & Upgrade ===
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            width: 320px;
            padding: 25px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-right: 1px solid rgba(147, 51, 234, 0.2);
            overflow-y: auto;
        `;

        // Level Badge
        leftPanel.appendChild(this.createLevelBadge(heroLevel, config.maxLevel));

        // Determine Class and Species Icons
        let heroClass = 'Unknown';
        let heroSpecies = 'Unknown';
        let classIconChar = '?';
        let speciesIconChar = '?';
        let classColor = '#4b2c20'; // Brown default
        let speciesColor = '#2d4a22'; // Green default

        const lowerName = config.name.toLowerCase();

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

        // Helper for Attribute Icon Badge
        const attrColorMap = { 'STR': '#dc2626', 'AGI': '#16a34a', 'INT': '#2563eb' };
        const attrColor = (attrColorMap as any)[config.mainStat] || '#1f2937';

        // Icon Paths
        let attrIconPath = '/assets/attr/attribute/str.svg';
        if (config.mainStat === 'AGI') attrIconPath = '/assets/attr/attribute/agi.svg';
        if (config.mainStat === 'INT') attrIconPath = '/assets/attr/attribute/int.svg';

        // Name & Role
        const heroName = document.createElement('div');
        heroName.style.cssText = `font-size: 2.2rem; font-weight: bold; color: #fff; text-transform: uppercase; letter-spacing: 3px;`;
        heroName.innerText = config.name;
        leftPanel.appendChild(heroName);

        const roleInfo = document.createElement('div');
        roleInfo.style.cssText = `color: #06b6d4; font-size: 0.8rem; margin-bottom: 5px; display: flex; align-items: center; gap: 8px;`;
        roleInfo.innerHTML = `
            <div style="width: 20px; height: 20px; background: ${attrColor}; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" title="${config.mainStat} Attribute">
                <img src="${attrIconPath}" style="width: 14px; height: 14px; filter: brightness(0) invert(1);">
            </div>
            
            <span>${config.role}</span>

            <div style="width: 20px; height: 20px; background: ${classColor}; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" title="Class: ${heroClass}">
                <span style="font-size: 12px;">${classIconChar}</span>
            </div>

            <div style="width: 20px; height: 20px; background: ${speciesColor}; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" title="Species: ${heroSpecies}">
                <span style="font-size: 12px;">${speciesIconChar}</span>
            </div>
        `;
        leftPanel.appendChild(roleInfo);

        // Stats
        const statsHeader = document.createElement('div');
        statsHeader.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);`;
        statsHeader.innerHTML = `<span style="color: #8b8b8b; font-size: 0.75rem;">STATS (LVL ${heroLevel})</span> <span style="color: #f97316; font-size: 0.75rem;">CAP: ${currentLevelCap}</span>`;
        leftPanel.appendChild(statsHeader);

        const statsData = [
            { key: 'attack', label: 'ATTACK', value: stats.atk.toLocaleString(), color: '#a855f7' },
            { key: 'hp', label: 'HP', value: stats.hp.toLocaleString(), color: '#ef4444' },
            { key: 'armor', label: 'ARMOR', value: stats.armor.toLocaleString(), color: '#3b82f6' },
            { key: 'aspd', label: 'ATK SPEED', value: stats.aspd.toFixed(2), color: '#22c55e' },
            { key: 'moveSpeed', label: 'MOVE SPEED', value: stats.moveSpeed.toString(), color: '#f59e0b' },
        ];

        statsData.forEach(stat => {
            const row = document.createElement('div');
            row.style.cssText = `display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);`;
            row.innerHTML = `
                <img src="${this.attrIconPaths[stat.key]}" style="width: 32px; height: 32px; margin-right: 12px; object-fit: contain;" />
                <span style="color: #9ca3af; font-size: 0.8rem; flex: 1;">${stat.label}</span>
                <span style="color: ${stat.color}; font-weight: bold; font-size: 1.1rem;">${stat.value}</span>
            `;
            leftPanel.appendChild(row);
        });

        // Upgrade Section
        const isMaxLevel = heroLevel >= config.maxLevel;

        if (!isMaxLevel) {
            const upgradeBox = document.createElement('div');
            upgradeBox.style.marginTop = '20px';

            let costGold = 0;
            let costSecondResource = 0;
            let secondResourceIcon = '';
            let buttonText = '';
            let buttonColor = '';
            let actionHandler: () => void = () => { };
            let isRankUp = false;

            if (isAtCap) {
                // RANK UP MODE
                const rankCost = this.heroManager.getRankUpCost();
                // currentMilestone and heroStars are already calculated at top of method

                if (needsEvolution && currentMilestone) {
                    // STAR-GATED - Show evolution required message

                    costGold = 0;
                    costSecondResource = 0;
                    secondResourceIcon = '⭐';
                    buttonText = `🔒 EVOLVE TO ${currentMilestone.starRequirement}★ FIRST`;
                    buttonColor = 'linear-gradient(135deg, #ef4444, #dc2626)'; // Red
                    actionHandler = () => {
                        alert(`Evolution Required!\n\nMerge this hero to ${currentMilestone.starRequirement}★ to break Level ${currentMilestone.levelCap}.`);
                    };
                    isRankUp = true;
                } else if (rankCost) {
                    costGold = rankCost.gold;
                    costSecondResource = rankCost.heroPotion;
                    secondResourceIcon = '🧪'; // Hero Potion
                    buttonText = '⬆ PROMOTE HERO';
                    buttonColor = 'linear-gradient(135deg, #a855f7, #7c3aed)'; // Purple
                    actionHandler = () => this.handleRankUp();
                    isRankUp = true;
                }
            } else {
                // LEVEL UP MODE
                costGold = nextLevelCost.gold;
                costSecondResource = nextLevelCost.soulPotion;
                secondResourceIcon = '🧪'; // Soul Potion
                buttonText = '⬆ LEVEL UP';
                buttonColor = 'linear-gradient(135deg, #10b981, #059669)'; // Green
                actionHandler = () => this.handleLevelUp();
            }

            // Calculate +10 level costs (only for level up mode, not rank up)
            let totalGold10 = 0;
            let totalSoul10 = 0;
            let levelsToMax = 0;
            if (!isRankUp && !isAtCap) {
                const maxPossibleLevels = Math.min(10, currentLevelCap - heroLevel);
                levelsToMax = maxPossibleLevels;
                for (let i = 0; i < maxPossibleLevels; i++) {
                    const cost = this.heroManager.getNextLevelCost(heroLevel + i);
                    totalGold10 += cost.gold;
                    totalSoul10 += cost.soulPotion;
                }
            }

            // Cost Display with potion icons
            const costDiv = document.createElement('div');
            const goldIconPath = '/assets/potions/coin-icon.png';
            const soulPotionIconPath = '/assets/potions/soul-potion-icon.png';
            const heroPotionIconPath = '/assets/potions/hero-potion-icon.png';

            costDiv.innerHTML = `
                <div style="color: #6b7280; font-size: 0.7rem; margin-bottom: 6px;">${isRankUp ? 'PROMOTION COST' : 'NEXT LEVEL COST'}</div>
                <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <img src="${goldIconPath}" style="width: 28px; height: 28px;" onerror="this.innerText='🪙'" />
                        <span style="color: #fbbf24; font-weight: bold; font-size: 0.9rem;">${costGold.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <img src="${isRankUp ? heroPotionIconPath : soulPotionIconPath}" style="width: 28px; height: 28px;" onerror="this.innerText='🧪'" />
                        <span style="color: ${isRankUp ? '#a855f7' : '#22c55e'}; font-weight: bold; font-size: 0.9rem;">${costSecondResource.toLocaleString()}</span>
                    </div>
                </div>
            `;
            upgradeBox.appendChild(costDiv);

            // Button
            const btn = document.createElement('button');
            btn.innerText = buttonText;
            btn.style.cssText = `
                width: 100%; padding: 12px; font-size: 1rem; font-weight: bold;
                background: ${buttonColor};
                border: none; border-radius: 10px; color: #fff; cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0, 0.4);
            `;

            // Check resources
            const userGold = this.user.gold !== undefined ? this.user.gold : (this.user.inventory?.['gold'] || 0);

            let canAfford = false;
            if (isRankUp) {
                const userHeroPotions = this.user.heroPotion !== undefined ? this.user.heroPotion : (this.user.inventory?.['hero_potion'] || 0);
                canAfford = userGold >= costGold && userHeroPotions >= costSecondResource;
                if (!canAfford) btn.innerText = `NEED: ${costGold.toLocaleString()} G, ${costSecondResource.toLocaleString()} HP`;
            } else {
                const userSoulPotions = this.user.soulPotion !== undefined ? this.user.soulPotion : (this.user.inventory?.['soul_potion'] || 0);
                canAfford = userGold >= costGold && userSoulPotions >= costSecondResource;
                if (!canAfford) btn.innerText = `NEED: ${costGold.toLocaleString()} G, ${costSecondResource.toLocaleString()} SP`;
            }

            if (!canAfford) {
                btn.style.filter = 'grayscale(100%)';
                btn.style.opacity = '0.6';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.onclick = actionHandler;
            }

            upgradeBox.appendChild(btn);

            // +10 LEVEL UP BUTTON (only show if not at cap and can afford)
            if (!isRankUp && !isAtCap && levelsToMax > 1) {
                const userSoulPotions = this.user.soulPotion !== undefined ? this.user.soulPotion : (this.user.inventory?.['soul_potion'] || 0);
                const canAfford10 = userGold >= totalGold10 && userSoulPotions >= totalSoul10;

                if (canAfford10) {
                    const btn10 = document.createElement('button');
                    btn10.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>⬆ +${levelsToMax} LEVELS</span>
                        </div>
                        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 2px;">
                            ${totalGold10.toLocaleString()} Gold • ${totalSoul10.toLocaleString()} Soul
                        </div>
                    `;
                    btn10.style.cssText = `
                        width: 100%; padding: 10px; font-size: 0.9rem; font-weight: bold;
                        margin-top: 8px;
                        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                        border: none; border-radius: 10px; color: #fff; cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0, 0.4);
                    `;
                    btn10.onclick = () => this.handleBulkLevelUp(levelsToMax);
                    upgradeBox.appendChild(btn10);
                }
            }

            leftPanel.appendChild(upgradeBox);
        }

        this.container.appendChild(leftPanel);

        // === CENTER - Sprite ===
        const centerSection = document.createElement('div');
        centerSection.style.cssText = `flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; overflow: hidden;`;

        this.renderSprite(centerSection);

        // Star Badge - Above hero
        let starsHtml = '';
        for (let i = 0; i < heroStars; i++) {
            starsHtml += `<span style="color: #fbbf24; font-size: 1.8rem; margin: 0 -2px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">★</span>`;
        }
        const starBadge = document.createElement('div');
        starBadge.style.cssText = `
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        `;
        starBadge.innerHTML = starsHtml;
        centerSection.appendChild(starBadge);

        // Power Box - Centered above skills
        const powerBox = document.createElement('div');
        powerBox.style.cssText = `
            position: absolute; 
            bottom: 160px; 
            left: 50%; 
            transform: translateX(-50%); 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            padding: 8px 20px; 
            z-index: 10;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 20px;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255,255,255,0.1);
        `;
        powerBox.innerHTML = `
            <img src="/assets/attr/fist.png" style="width: 54px; height: 54px; object-fit: contain;">
            <div>
                <div style="color: #9ca3af; font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase;">Combat Power</div>
                <div style="color: #fbbf24; font-size: 1.2rem; font-weight: 800; line-height: 1;">${heroPower.toLocaleString()}</div>
            </div>
        `;
        centerSection.appendChild(powerBox);

        // Skills
        const skillsBar = document.createElement('div');
        skillsBar.style.cssText = `position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 20px; padding: 18px 30px; background: rgba(0, 0, 0, 0.7); border-radius: 18px; backdrop-filter: blur(10px); z-index: 10; border: 1px solid rgba(255,255,255,0.1);`;

        skills.forEach(skill => {
            const currentRankIndex = this.getCurrentRankIndex(skill, heroLevel);
            const iconPath = this.skillIconPaths[skill.id] || '';
            const isUnlocked = skill.ranks[0].unlockLevel <= heroLevel;

            const typeColors: Record<string, { bg: string; border: string; badge: string }> = {
                'active': { bg: 'rgba(249, 115, 22, 0.3)', border: '#f97316', badge: '#f97316' },
                'passive': { bg: 'rgba(34, 197, 94, 0.3)', border: '#22c55e', badge: '#22c55e' },
                'ultimate': { bg: 'rgba(168, 85, 247, 0.3)', border: '#a855f7', badge: '#a855f7' },
            };
            const colors = typeColors[skill.type] || typeColors['active'];

            const skillIcon = document.createElement('div');
            skillIcon.style.cssText = `
                width: 80px; height: 80px;
                background: ${isUnlocked ? colors.bg : 'rgba(50,50,50,0.5)'};
                border: 3px solid ${isUnlocked ? colors.border : '#555'};
                border-radius: 12px; overflow: hidden; cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                ${!isUnlocked ? 'filter: grayscale(70%); opacity: 0.6;' : ''}
            `;
            skillIcon.innerHTML = `<img src="${iconPath}" style="width: 100%; height: 100%;" onerror="this.style.display='none'" />`;

            // Add lock icon overlay for locked skills
            if (!isUnlocked) {
                const lockOverlay = document.createElement('div');
                lockOverlay.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.4);`;
                lockOverlay.innerHTML = `<span style="font-size: 24px;">🔒</span>`;
                skillIcon.appendChild(lockOverlay);
            }

            // Hover effects
            skillIcon.onmouseenter = () => {
                skillIcon.style.transform = 'scale(1.1)';
                skillIcon.style.boxShadow = `0 0 15px ${colors.border}`;
            };
            skillIcon.onmouseleave = () => {
                skillIcon.style.transform = '';
                skillIcon.style.boxShadow = '';
            };

            skillIcon.onclick = (e) => {
                e.stopPropagation();
                this.showSkillTooltip(skill, skillIcon, colors, heroLevel);
            };
            skillsBar.appendChild(skillIcon);
        });
        centerSection.appendChild(skillsBar);

        this.container.appendChild(centerSection);



        // === RIGHT PANEL - Equipment & Evolution ===
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            width: 380px;
            padding: 20px;
            background: rgba(0,0,0,0.3);
            border-left: 1px solid rgba(255,255,255,0.05);
            display: flex;
            flex-direction: column;
            z-index: 2;
            overflow-y: auto;
        `;

        // TABS
        const tabsContainer = document.createElement('div');
        tabsContainer.style.cssText = `display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 15px;`;

        const createTab = (id: 'equipment' | 'evolution', label: string) => {
            const isActive = this.activeTab === id;
            const tab = document.createElement('div');
            tab.innerText = label;
            tab.style.cssText = `
                flex: 1; text-align: center; padding: 10px; cursor: pointer;
                font-size: 0.9rem; font-weight: bold; border-radius: 8px;
                background: ${isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
                color: ${isActive ? '#fbbf24' : '#6b7280'};
                transition: all 0.2s;
                border: ${isActive ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent'};
            `;
            tab.onmouseenter = () => { if (!isActive) tab.style.color = '#fff'; };
            tab.onmouseleave = () => { if (!isActive) tab.style.color = '#6b7280'; };
            tab.onclick = () => {
                this.activeTab = id;
                this.renderContent(); // Re-render to switch content
            };
            return tab;
        };

        tabsContainer.appendChild(createTab('equipment', 'EQUIPMENT'));
        tabsContainer.appendChild(createTab('evolution', 'EVOLUTION'));
        rightPanel.appendChild(tabsContainer);

        // CONTENT
        if (this.activeTab === 'equipment') {
            this.renderEquipmentPanel(rightPanel);
        } else {
            console.log("Evolution Tab - Needs Evolution?", needsEvolution);
            if (needsEvolution && currentMilestone) {
                this.renderMergePanel(rightPanel, currentMilestone, heroStars);
            } else if (isAtCap && !needsEvolution) {
                // Max Rank or no further evolution needed at this cap
                rightPanel.innerHTML += `<div style="text-align: center; color: #6b7280; margin-top: 50px;">Max Evolution Reached for now.</div>`;
            } else {
                // Not at cap - Find the next star-gated milestone the hero hasn't reached yet
                const nextStarGatedMilestone = config.rankUpMilestones.find(m => m.starRequirement && heroLevel < m.levelCap);
                const targetCap = nextStarGatedMilestone?.levelCap || currentLevelCap;
                rightPanel.innerHTML += `<div style="text-align: center; color: #6b7280; margin-top: 50px;">
                    <div>Level up to ${targetCap} to unlock evolution.</div>
                 </div>`;
            }
        }

        this.container.appendChild(rightPanel);

    }

    private createLevelBadge(level: number, max: number): HTMLElement {
        const div = document.createElement('div');
        div.innerHTML = `
            <div style="color: #fff; font-weight: bold; font-size: 1.1rem;">LEVEL ${level}</div>
            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.15); margin-top: 5px;">
                <div style="width: ${(level / max) * 100}%; height: 100%; background: #fbbf24;"></div>
            </div>
        `;
        return div;
    }

    private renderSprite(container: HTMLElement) {
        let heroBasePath = '/assets/heroes/antelope_mage_with_animation_spritesheets';
        let spriteFilename = 'Armature_Armature_idle_Base_Layer_spritesheet.png';
        const nameLower = this.heroAssetName.toLowerCase();

        if (nameLower.includes('ranger')) {
            heroBasePath = '/assets/heroes/antelope_ranger_with_animation_spritesheets';
        } else if (nameLower.includes('razor')) {
            heroBasePath = '/assets/heroes/boar_assassin_with_animation_spritesheets';
            spriteFilename = 'Armature_Armature_idle_Base_Layer_001_spritesheet.png';
        }

        const spriteSize = 950;
        const framesPerRow = 5;
        const totalFrames = 48;
        const fps = 24;
        const scaledSheetWidth = framesPerRow * spriteSize;
        const totalRows = Math.ceil(totalFrames / framesPerRow);
        const scaledSheetHeight = totalRows * spriteSize;

        const sprite = document.createElement('div');
        sprite.style.cssText = `
            position: absolute; left: 50%; top: 45%; transform: translate(-50%, -50%);
            width: ${spriteSize}px; height: ${spriteSize}px;
            background-image: url('${heroBasePath}/front-view/${spriteFilename}');
            background-size: ${scaledSheetWidth}px ${scaledSheetHeight}px;
            filter: drop-shadow(0 0 30px rgba(147, 51, 234, 0.7));
            z-index: 1;
        `;
        container.appendChild(sprite);

        let frameIndex = 0;
        this.animInterval = window.setInterval(() => {
            frameIndex = (frameIndex + 1) % totalFrames;
            const col = frameIndex % framesPerRow;
            const row = Math.floor(frameIndex / framesPerRow);
            sprite.style.backgroundPosition = `-${col * spriteSize}px -${row * spriteSize}px`;
        }, 1000 / fps);
    }

    private async handleLevelUp() {
        try {
            console.log('[HeroUpgradeModal] user:', this.user);
            const commanderName = this.user.commanderName;
            console.log(`[HeroUpgradeModal] Leveling up: instanceId=${this.instanceId}, commanderName=${commanderName}`);

            const res = await fetch('http://localhost:3000/api/hero/levelup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commanderName,
                    instanceId: this.instanceId
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Update local user object FIRST with server response
                this.user = data.user;
                console.log('[HeroUpgradeModal] Level up success, calling onUpdate with gold:', data.user.gold);
                this.onUpdate(data.user);
                // Persist to localStorage so header and modal read fresh data
                localStorage.setItem('awengers_session', JSON.stringify(data.user));

                // Now recreate manager with updated instance data from the NEW user
                let instanceData;
                if (this.user.heroes instanceof Map) {
                    instanceData = this.user.heroes.get(this.instanceId);
                } else {
                    instanceData = this.user.heroes[this.instanceId];
                }
                this.heroManager = this.recreateManager(data.newLevel, instanceData);

                // Re-render UI with updated state
                this.renderContent();
            } else {
                console.warn('[HeroUpgradeModal] Level Up Failed:', data);
                // Suppress alert for common errors like level cap; UI should handle state or user just needs to click promote
                if (data.reason && (data.reason.includes('Rank Up') || data.reason.includes('Level cap'))) {
                    // Force a re-render just in case, though without new data it might not change if local state is stale.
                    // But usually local state matches. 
                    this.renderContent();
                } else {
                    alert(data.reason ? `${data.message}: ${data.reason}` : (data.message || 'Level Up Failed'));
                }
            }
        } catch (e) {
            console.error(e);
            alert('Network Error');
        }
    }

    private async handleBulkLevelUp(levels: number) {
        try {
            const commanderName = this.user.commanderName;
            console.log(`[HeroUpgradeModal] Bulk leveling up ${levels} levels: instanceId=${this.instanceId}`);

            const res = await fetch('http://localhost:3000/api/hero/levelup-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commanderName,
                    instanceId: this.instanceId,
                    levels
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Update local user object with server response
                this.user = data.user;
                this.onUpdate(data.user);
                // Persist to localStorage so header and modal read fresh data
                localStorage.setItem('awengers_session', JSON.stringify(data.user));

                // Recreate manager with updated instance data
                let instanceData;
                if (this.user.heroes instanceof Map) {
                    instanceData = this.user.heroes.get(this.instanceId);
                } else {
                    instanceData = this.user.heroes[this.instanceId];
                }
                this.heroManager = this.recreateManager(data.newLevel, instanceData);

                // Re-render UI with updated state
                this.renderContent();
            } else {
                alert(data.reason ? `${data.message}: ${data.reason}` : (data.message || 'Bulk Level Up Failed'));
            }
        } catch (e) {
            console.error(e);
            alert('Network Error');
        }
    }

    private async handleRankUp() {
        try {
            const commanderName = this.user.commanderName;
            const res = await fetch('http://localhost:3000/api/hero/rankup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commanderName,
                    instanceId: this.instanceId
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                this.user = data.user;
                this.onUpdate(data.user);
                // Persist to localStorage so header and modal read fresh data
                localStorage.setItem('awengers_session', JSON.stringify(data.user));

                // Manually increment rank index for local manager view
                (this.heroManager as any).heroInstance.currentRankIndex++;

                // Success - no alert, just re-render
                this.renderContent();

                this.renderContent();
            } else {
                alert(data.message || 'Rank Up Failed');
            }
        } catch (e) {
            console.error(e);
            alert('Network Error');
        }
    }

    private recreateManager(level: number, instanceData?: any): HeroProgressionManager {
        const nameLower = this.heroAssetName.toLowerCase();
        let manager: HeroProgressionManager;

        if (nameLower.includes('ranger')) manager = createSableHero(level, instanceData);
        else if (nameLower.includes('razor')) manager = createRazorHero(level, instanceData);
        else manager = createOryxHero(level, instanceData);

        return manager;
    }

    private getCurrentRankIndex(skill: SkillDefinition, level: number): number {
        let currentIndex = -1;
        skill.ranks.forEach((rank, index) => {
            if (rank.unlockLevel <= level) {
                currentIndex = index;
            }
        });
        return currentIndex;
    }

    // Extract heroCodeName from instanceId format: "codename_timestamp_random" -> "codename"
    // Handles multi-word codeNames like "antelope ranger" -> "Antelope Ranger"
    private extractHeroCodeNameFromId(instanceId: string): string {
        if (!instanceId) return '';

        // Instance ID format: "razor_1234567890_123" or "antelope ranger_1234567890_123"
        // Split by underscore and find the timestamp (a long number) to determine where codename ends
        const parts = instanceId.split('_');

        // Find the first part that looks like a timestamp (13-digit number)
        let codeNameParts: string[] = [];
        for (const part of parts) {
            // If it's a long number (timestamp), stop
            if (/^\d{10,}$/.test(part)) break;
            codeNameParts.push(part);
        }

        // Title case the code name parts
        const codeName = codeNameParts.map(p =>
            p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
        ).join(' ');

        return codeName;
    }


    // Copied from GalleryHeroModal
    private calculateHeroPower(stats: { hp: number; atk: number; armor: number; aspd: number; moveSpeed: number }, skills: SkillDefinition[], level: number): number {
        const hpPower = stats.hp * 0.1;
        const atkPower = stats.atk * 5;
        const armorPower = stats.armor * 10;
        const aspdPower = stats.aspd * 1000;
        const speedPower = stats.moveSpeed * 2;
        let skillPower = 0;
        skills.forEach(skill => {
            skill.ranks.forEach((rank, index) => {
                if (rank.unlockLevel <= level) {
                    skillPower += (index + 1) * 5000;
                    if (rank.damagePercent) skillPower += rank.damagePercent * 50;
                }
            });
        });
        const levelPower = level * 500;
        return Math.floor(hpPower + atkPower + armorPower + aspdPower + speedPower + skillPower + levelPower);
    }

    private showSkillTooltip(skill: SkillDefinition, anchor: HTMLElement, colors: { bg: string; border: string; badge: string }, heroLevel: number) {
        this.hideTooltip();

        const currentRank = this.heroManager.getSkillRank(skill.id);
        const currentRankIndex = this.getCurrentRankIndex(skill, heroLevel);
        const isUnlocked = skill.ranks[0].unlockLevel <= heroLevel;

        const anchorRect = anchor.getBoundingClientRect();
        const tooltipWidth = 380;

        const iconCenterX = anchorRect.left + (anchorRect.width / 2);
        let tooltipLeft = iconCenterX - (tooltipWidth / 2);

        const margin = 20;
        if (tooltipLeft < margin) tooltipLeft = margin;
        else if (tooltipLeft + tooltipWidth > window.innerWidth - margin) tooltipLeft = window.innerWidth - tooltipWidth - margin;

        const tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            left: ${tooltipLeft}px;
            background: rgba(13, 13, 26, 0.95);
            border: 2px solid ${colors.border};
            border-radius: 12px;
            padding: 15px;
            width: ${tooltipWidth}px;
            z-index: 100001;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(tooltip);

        let tooltipHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                <div style="width: 42px; height: 42px; background: ${colors.bg}; border: 2px solid ${colors.border}; border-radius: 10px; overflow: hidden;">
                    <img src="${this.skillIconPaths[skill.id] || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
                </div>
                <div style="flex: 1;">
                    <div style="color: #fff; font-weight: bold; font-size: 1rem;">${skill.name}</div>
                    <div style="color: ${colors.badge}; font-size: 0.7rem; text-transform: uppercase;">${skill.type}</div>
                </div>
                <span style="color: ${isUnlocked ? '#22c55e' : '#ef4444'}; font-size: 0.7rem; font-weight: bold;">${isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}</span>
            </div>
            <div style="color: #9ca3af; font-size: 0.8rem; margin-bottom: 12px; line-height: 1.4;">${currentRank?.description || skill.description}</div>
            ${currentRank?.effect ? `<div style="color: #fbbf24; font-size: 0.75rem; margin-bottom: 12px;">✨ ${currentRank.effect}</div>` : ''}
            <div style="color: #6b7280; font-size: 0.65rem; letter-spacing: 1px; margin-bottom: 8px;">RANK PROGRESSION</div>
        `;

        skill.ranks.forEach((rank, index) => {
            const isCurrentRank = index === currentRankIndex;
            const rankUnlocked = rank.unlockLevel <= heroLevel;

            tooltipHTML += `
                <div style="
                    display: flex; align-items: center; gap: 8px;
                    padding: 6px 10px;
                    background: ${isCurrentRank ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0,0,0,0.3)'};
                    border-radius: 6px; margin-bottom: 4px;
                    border: ${isCurrentRank ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid transparent'};
                    opacity: ${rankUnlocked ? '1' : '0.5'};
                ">
                    <div style="width: 20px; height: 20px; background: ${rankUnlocked ? colors.border : '#374151'}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 0.6rem; font-weight: bold; color: #fff;">${index + 1}</div>
                    <span style="color: ${rankUnlocked ? '#22c55e' : '#9ca3af'}; font-size: 0.65rem; min-width: 40px;">Lv.${rank.unlockLevel}</span>
                    <span style="color: ${rankUnlocked ? '#e5e7eb' : '#6b7280'}; font-size: 0.7rem; flex: 1;">${rank.description}</span>
                    ${rank.effect ? `<span style="color: ${rankUnlocked ? '#fbbf24' : '#6b7280'}; font-size: 0.6rem;">• ${rank.effect}</span>` : ''}
                </div>
            `;
        });

        tooltip.innerHTML = tooltipHTML;
        tooltip.onclick = (e) => e.stopPropagation();

        const tooltipHeight = tooltip.offsetHeight;
        const tooltipTop = anchorRect.top - tooltipHeight - 15;
        tooltip.style.top = `${Math.max(20, tooltipTop)}px`;

        this.activeTooltip = tooltip;

        setTimeout(() => {
            this.documentClickHandler = (e: MouseEvent) => {
                if (this.activeTooltip && !this.activeTooltip.contains(e.target as Node)) {
                    this.hideTooltip();
                }
            };
            document.addEventListener('click', this.documentClickHandler);
        }, 0);
    }

    private hideTooltip() {
        if (this.activeTooltip) { this.activeTooltip.remove(); this.activeTooltip = null; }
        if (this.documentClickHandler) { document.removeEventListener('click', this.documentClickHandler); this.documentClickHandler = null; }
    }

    close() {
        if (this.animInterval) clearInterval(this.animInterval);
        this.backdrop.remove();
        this.container.remove();
        if (this.escHandler) document.removeEventListener('keydown', this.escHandler);
    }

    getElement(): HTMLElement {
        return this.container;
    }

    getBackdrop(): HTMLElement {
        return this.backdrop;
    }

    // Update user data and re-render (for real-time resource updates)
    public updateUser(user: any) {
        this.user = user;
        this.renderContent();
    }



    private renderMergePanel(container: HTMLElement, milestone: any, currentStars: number) {
        // The next star level is always currentStars + 1 (not milestone.starRequirement which is the gate)
        const nextStars = currentStars + 1;
        const heroLevel = this.heroManager.getCurrentLevel();

        console.log('[MergePanel] Rendering:', { currentStars, nextStars, heroLevel, milestone });

        // title
        const title = document.createElement('div');
        title.innerHTML = `<div style="color: #fbbf24; font-size: 1.2rem; font-weight: bold; text-align: center; margin-bottom: 20px;">EVOLUTION REQUIRED</div>`;
        container.appendChild(title);

        // Evolution visual (Hero -> New Hero)
        const evoVisual = document.createElement('div');
        evoVisual.style.cssText = `display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 30px;`;

        const heroMainStat = this.heroManager.getConfig().mainStat;
        // Map stat to attribute icon and color
        const attrColorMap = { 'STR': '#dc2626', 'AGI': '#16a34a', 'INT': '#2563eb' };

        const attrColor = attrColorMap[heroMainStat] || '#1f2937';

        // Inline SVGs (White fill)
        const fistSvg = `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M19.14,12.94c0.04-0.36,0.06-0.72,0.06-1.09c0-4.08-2.61-7.53-6.23-8.87C12.78,2.44,12.4,2,12,2S11.22,2.44,11.03,2.98C7.41,4.32,4.8,7.77,4.8,11.85c0,0.37,0.02,0.73,0.06,1.09C4.84,13.14,5,13.29,5.22,13.29h1.56c0.16,0,0.31-0.08,0.39-0.22c0.4-0.66,0.92-1.25,1.52-1.74c0.11-0.09,0.15-0.24,0.1-0.38L8.27,9.63c-0.12-0.34-0.03-0.73,0.22-0.98c0.26-0.25,0.65-0.32,0.98-0.17l0.87,0.39C10.68,8.99,11.05,9,11.41,8.91c0.43-0.11,0.68-0.54,0.57-0.97l-0.3-1.18c-0.09-0.35,0.02-0.72,0.29-0.97C12.23,5.54,12.63,5.46,12.97,5.6l0.87,0.38c0.35,0.15,0.74,0.08,1.01-0.19l1.63-1.63c0.39-0.39,1.02-0.39,1.41,0c0.39,0.39,0.39,1.02,0,1.41l-1.63,1.63c-0.27,0.27-0.35,0.66-0.19,1.01l0.38,0.87c0.14,0.31,0.05,0.68-0.21,0.91c-0.26,0.24-0.64,0.29-0.95,0.14l-0.87-0.39c-0.35-0.16-0.75-0.08-1.02,0.2l-0.23,0.23C13.04,9.39,13,9.65,13.06,9.89c0.41,1.56,1.83,2.71,3.53,2.71h1.56C18.66,12.6,18.99,12.97,19.14,12.94z M6,15v4c0,1.1,0.9,2,2,2h8c1.1,0,2-0.9,2-2v-4H6z"/></svg>`;

        const bowSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M12 12v10"/><path d="m19 19-7-7"/></svg>`;

        const staffSvg = `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12.5,2.5l-2,2l8,8l2-2L12.5,2.5z M9.5,8.5l-7,7l2,2l7-7L9.5,8.5z M18.5,14.5l-2,2l3.5,3.5l2-2L18.5,14.5z"/></svg>`;

        let attrSvg = fistSvg;
        if (heroMainStat === 'AGI') attrSvg = bowSvg;
        if (heroMainStat === 'INT') attrSvg = staffSvg;

        const asset = HERO_ASSETS.find(a => a.name === this.heroAssetName);

        const createHeroBox = (stars: number, showLevel: number) => {
            // Stars HTML
            let starsHtml = '';
            for (let i = 0; i < stars; i++) {
                starsHtml += `<span style="color: #fbbf24; font-size: 0.8rem; margin: 0 -1px;">★</span>`;
            }

            // Star-based border colors
            let borderColor = '#d4af37'; // Default Gold
            if (stars === 1) borderColor = '#22c55e'; // Green
            else if (stars === 2) borderColor = '#3b82f6'; // Blue
            else if (stars === 3) borderColor = '#eab308'; // Yellow
            else if (stars === 4) borderColor = '#f97316'; // Orange
            else if (stars === 5) borderColor = '#ef4444'; // Red

            // Image Container
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = `
                width: 100%; height: 100%;
                border-radius: 5px;
                overflow: hidden;
                position: relative;
            `;

            if (asset && asset.sprite2D) {
                const displaySize = 70; // Match box size
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
                    transform: scale(5) translateY(-12%); 
                    transform-origin: center center;
                    filter: saturate(1.1) contrast(1.1);
                `;
                imgContainer.appendChild(spritePreview);
            } else {
                imgContainer.innerHTML = '<div style="font-size:30px; text-align:center; line-height:70px; color:#6b7280;">?</div>';
            }

            return `
                <div style="
                    width: 70px; height: 70px; 
                    background: #2a2a2a; 
                    border: 3px solid ${borderColor};
                    border-radius: 8px; 
                    position: relative; 
                    box-shadow: 0 4px 6px rgba(0,0,0,0.5);
                ">
                    <!-- Attribute Icon (Top Left) -->
                    <div style="
                        position: absolute; top: -5px; left: -5px; 
                        width: 20px; height: 20px; 
                        background: ${attrColor}; border: 1px solid #fff; border-radius: 50%;
                        display: flex; justify-content: center; align-items: center; z-index: 10;
                    ">
                        ${attrSvg}
                    </div>

                    <!-- Level (Top Right) -->
                     <div style="
                        position: absolute; top: 2px; right: 4px; 
                        color: #fff; font-size: 0.7rem; font-weight: bold; text-shadow: 1px 1px 2px #000;
                        z-index: 10;
                    ">${showLevel}</div>

                    <!-- Card Image -->
                    <div style="width:100%; height:100%; overflow:hidden; border-radius:5px;">
                        ${imgContainer.outerHTML}
                    </div>

                    <!-- Stars (Bottom) -->
                    <div style="
                        position: absolute; bottom: 2px; 
                        width: 100%; text-align: center; 
                        display: flex; justify-content: center;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                        z-index: 10;
                    ">
                        ${starsHtml}
                    </div>
                </div>
            `;
        };

        evoVisual.innerHTML = `
            ${createHeroBox(currentStars, heroLevel)}
            <div style="font-size: 1.5rem; color: #6b7280;">➜</div>
            ${createHeroBox(nextStars, heroLevel)}
        `;
        container.appendChild(evoVisual);

        // Limit Info
        const limitInfo = document.createElement('div');
        limitInfo.style.cssText = `background: rgba(251, 191, 36, 0.1); padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 30px; border: 1px solid rgba(251, 191, 36, 0.3);`;
        limitInfo.innerHTML = `
            <div style="color: #fbbf24; font-size: 0.9rem; margin-bottom: 2px;">Max level increased to</div>
            <div style="color: #fff; font-size: 1.4rem; font-weight: bold;">${milestone.levelCap} ➜ ${milestone.newCap}</div>
        `;
        container.appendChild(limitInfo);

        // Requirements - Functional slots
        const reqTitle = document.createElement('div');
        reqTitle.style.cssText = `color: #d1d5db; font-size: 0.9rem; margin-bottom: 15px; font-weight: bold;`;
        reqTitle.innerText = 'Requirements';
        container.appendChild(reqTitle);

        const reqGrid = document.createElement('div');
        reqGrid.style.cssText = `display: flex; gap: 10px; justify-content: center; margin-bottom: 40px;`;

        // Define merge recipe based on current star level
        // Each slot can have different requirements
        type SlotReq = { type: 'sameHero' | 'sameAttr' | 'specificAttr'; attrType?: 'INT' | 'STR' | 'AGI'; starLevel: number };
        const recipes: Record<number, { slots: SlotReq[] }> = {
            1: {
                slots: [
                    { type: 'sameHero', starLevel: 1 },
                    { type: 'sameAttr', starLevel: 1 },
                    { type: 'sameAttr', starLevel: 1 }
                ]
            },
            2: {
                slots: [
                    { type: 'sameAttr', starLevel: 2 },
                    { type: 'sameAttr', starLevel: 2 },
                    { type: 'sameAttr', starLevel: 2 }
                ]
            },
            3: {
                slots: [
                    { type: 'sameHero', starLevel: 3 }
                ]
            },
            4: {
                slots: [
                    { type: 'sameAttr', starLevel: 4 }
                ]
            },
        };

        const recipe = recipes[currentStars];
        const reqCount = recipe?.slots.length || 0;

        // Get main hero data for matching
        let mainHeroData: any;
        if (this.user.heroes instanceof Map) {
            mainHeroData = this.user.heroes.get(this.instanceId);
        } else {
            mainHeroData = this.user.heroes[this.instanceId];
        }
        // Extract heroCodeName from data or derive from instanceId (format: codename_timestamp_random)
        const mainHeroCodeName = mainHeroData?.heroCodeName || this.extractHeroCodeNameFromId(this.instanceId);
        const mainHeroAttribute = mainHeroData?.attribute || 'STR';
        console.log('[MergePanel] Main hero:', { instanceId: this.instanceId, heroCodeName: mainHeroCodeName, attribute: mainHeroAttribute });

        for (let i = 0; i < reqCount; i++) {
            const slotIndex = i;
            const slotReq = recipe.slots[i];
            const selectedId = this.selectedSacrifices.get(slotIndex);
            const slot = document.createElement('div');

            // Determine slot label based on type
            let reqText = 'Same Hero';
            if (slotReq.type === 'sameAttr') {
                reqText = 'Same Attr';
            } else if (slotReq.type === 'specificAttr') {
                reqText = `${slotReq.attrType} Hero`;
            }

            if (selectedId) {
                // Show selected hero preview
                let selectedHero: any;
                if (this.user.heroes instanceof Map) {
                    selectedHero = this.user.heroes.get(selectedId);
                } else {
                    selectedHero = this.user.heroes[selectedId];
                }

                const heroStars = selectedHero?.stars || 1;
                let starsHtml = '';
                for (let s = 0; s < heroStars; s++) {
                    starsHtml += `<span style="color: #fbbf24; font-size: 0.5rem;">★</span>`;
                }

                slot.style.cssText = `
                    width: 60px; height: 60px; background: rgba(34, 197, 94, 0.2); 
                    border: 2px solid #22c55e; border-radius: 8px;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    cursor: pointer; transition: all 0.2s; position: relative;
                `;
                slot.innerHTML = `
                    <div style="font-size: 1.5rem;">✓</div>
                    <div style="font-size: 0.5rem; color: #22c55e; text-align: center;">${starsHtml}</div>
                `;
            } else {
                slot.style.cssText = `
                    width: 60px; height: 60px; background: rgba(0,0,0,0.4); 
                    border: 2px dashed #4b5563; border-radius: 8px;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    cursor: pointer; transition: all 0.2s;
                `;
                slot.innerHTML = `
                    <div style="font-size: 1.2rem; color: #6b7280;">+</div>
                    <div style="font-size: 0.5rem; color: #6b7280; text-align: center;">${reqText}</div>
                `;
            }

            slot.onmouseenter = () => {
                slot.style.borderColor = '#fbbf24';
                slot.style.background = selectedId ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)';
            };
            slot.onmouseleave = () => {
                slot.style.borderColor = selectedId ? '#22c55e' : '#4b5563';
                slot.style.background = selectedId ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.4)';
            };
            slot.onclick = () => this.showHeroSelectionModal(slotIndex, {
                sameHero: slotReq.type === 'sameHero',
                sameAttribute: slotReq.type === 'sameAttr',
                specificAttribute: slotReq.type === 'specificAttr' ? slotReq.attrType : undefined,
                requiredStars: slotReq.starLevel,
                mainHeroCodeName,
                mainHeroAttribute
            });
            reqGrid.appendChild(slot);
        }
        container.appendChild(reqGrid);

        // Forge Button
        const allSlotsFilled = this.selectedSacrifices.size >= reqCount;
        const forgeBtn = document.createElement('button');
        forgeBtn.innerText = allSlotsFilled ? 'FORGE' : 'Select Heroes';
        forgeBtn.style.cssText = `
            width: 100%; padding: 15px; font-size: 1.2rem; font-weight: bold;
            background: ${allSlotsFilled ? 'linear-gradient(to bottom, #fcd34d, #f59e0b)' : 'linear-gradient(to bottom, #4b5563, #374151)'};
            border: none; border-radius: 12px; 
            color: ${allSlotsFilled ? '#78350f' : '#9ca3af'}; 
            cursor: ${allSlotsFilled ? 'pointer' : 'not-allowed'};
            box-shadow: ${allSlotsFilled ? '0 4px 0 #b45309, 0 5px 10px rgba(0,0,0,0.3)' : '0 2px 0 #1f2937'};
            transition: all 0.1s;
        `;

        if (allSlotsFilled) {
            forgeBtn.onmousedown = () => { forgeBtn.style.transform = 'translateY(4px)'; forgeBtn.style.boxShadow = '0 0 0 #b45309, inset 0 2px 5px rgba(0,0,0,0.2)'; };
            forgeBtn.onmouseup = () => { forgeBtn.style.transform = 'translateY(0)'; forgeBtn.style.boxShadow = '0 4px 0 #b45309, 0 5px 10px rgba(0,0,0,0.3)'; };
            forgeBtn.onmouseleave = () => { forgeBtn.style.transform = 'translateY(0)'; forgeBtn.style.boxShadow = '0 4px 0 #b45309, 0 5px 10px rgba(0,0,0,0.3)'; };
            forgeBtn.onclick = () => this.handleMerge();
        }

        container.appendChild(forgeBtn);
    }

    private showHeroSelectionModal(slotIndex: number, requirements: {
        sameHero: boolean;
        sameAttribute: boolean;
        specificAttribute?: 'INT' | 'STR' | 'AGI';
        requiredStars: number;
        mainHeroCodeName: string;
        mainHeroAttribute: string;
    }) {
        // Remove any existing selection modal
        this.closeHeroSelectionModal();

        // Get all heroes and filter by requirements
        const heroes: { id: string; hero: any }[] = [];
        const heroesData = this.user.heroes;

        if (heroesData instanceof Map) {
            heroesData.forEach((hero: any, id: string) => {
                heroes.push({ id, hero });
            });
        } else if (heroesData) {
            Object.entries(heroesData).forEach(([id, hero]) => {
                heroes.push({ id, hero: hero as any });
            });
        }

        // Debug: Log requirements and available heroes
        console.log('[HeroSelection] Filter requirements:', requirements);
        console.log('[HeroSelection] All heroes:', heroes.map(({ id, hero }) => ({
            id,
            heroCodeName: hero.heroCodeName,
            stars: hero.stars || 1,
            attribute: hero.attribute
        })));

        // Filter heroes
        const filteredHeroes = heroes.filter(({ id, hero }) => {
            // Exclude main hero
            if (id === this.instanceId) {
                console.log(`[HeroSelection] Excluding ${id}: is main hero`);
                return false;
            }

            // Exclude already selected heroes
            for (const selectedId of this.selectedSacrifices.values()) {
                if (selectedId === id) {
                    console.log(`[HeroSelection] Excluding ${id}: already selected`);
                    return false;
                }
            }

            // Check star level
            const stars = hero.stars || 1;
            if (stars !== requirements.requiredStars) {
                console.log(`[HeroSelection] Excluding ${id}: stars ${stars} !== required ${requirements.requiredStars}`);
                return false;
            }

            // Check same hero requirement (case-insensitive comparison)
            if (requirements.sameHero) {
                // Get heroCodeName from data or extract from instanceId
                const sacHeroCodeName = hero.heroCodeName || this.extractHeroCodeNameFromId(id);
                const heroName = sacHeroCodeName.toLowerCase().trim();
                const mainName = (requirements.mainHeroCodeName || '').toLowerCase().trim();
                if (heroName !== mainName) {
                    console.log(`[HeroSelection] Excluding ${id}: heroCodeName "${sacHeroCodeName}" !== "${requirements.mainHeroCodeName}"`);
                    return false;
                }
            }

            // Check same attribute requirement
            if (requirements.sameAttribute) {
                const attr = hero.attribute || 'STR';
                if (attr !== requirements.mainHeroAttribute) {
                    console.log(`[HeroSelection] Excluding ${id}: attribute ${attr} !== ${requirements.mainHeroAttribute}`);
                    return false;
                }
            }

            // Check specific attribute requirement (e.g., must be INT hero)
            if (requirements.specificAttribute) {
                const attr = hero.attribute || 'STR';
                if (attr !== requirements.specificAttribute) {
                    console.log(`[HeroSelection] Excluding ${id}: attribute ${attr} !== required ${requirements.specificAttribute}`);
                    return false;
                }
            }

            console.log(`[HeroSelection] Including ${id}`);
            return true;
        });

        console.log('[HeroSelection] Filtered heroes:', filteredHeroes.length);

        // Create modal
        const modalBackdrop = document.createElement('div');
        modalBackdrop.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.8);
            z-index: 100010; display: flex; justify-content: center; align-items: center;
        `;
        modalBackdrop.onclick = (e) => {
            if (e.target === modalBackdrop) this.closeHeroSelectionModal();
        };

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 16px; padding: 20px; min-width: 400px; max-width: 80%;
            max-height: 70vh; overflow-y: auto;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);`;
        // Determine header text based on requirement type
        let reqLabel = 'Same Hero';
        if (requirements.sameAttribute) {
            reqLabel = 'Same Attribute';
        } else if (requirements.specificAttribute) {
            reqLabel = `${requirements.specificAttribute} Hero`;
        }
        header.innerHTML = `
            <div style="color: #fbbf24; font-size: 1.2rem; font-weight: bold;">Select Sacrifice Hero</div>
            <div style="color: #6b7280; font-size: 0.8rem;">
                ${reqLabel} • ${requirements.requiredStars}★
            </div>
        `;
        modal.appendChild(header);

        if (filteredHeroes.length === 0) {
            const noHeroes = document.createElement('div');
            noHeroes.style.cssText = `text-align: center; color: #9ca3af; padding: 40px 20px;`;
            noHeroes.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 10px;">😢</div>
                <div>No eligible heroes found.</div>
                <div style="font-size: 0.8rem; margin-top: 5px; color: #6b7280;">
                    Need: ${requirements.requiredStars}★ ${requirements.sameHero ? 'same hero' : `${requirements.mainHeroAttribute} attribute`}
                </div>
            `;
            modal.appendChild(noHeroes);
        } else {
            // Hero grid
            const grid = document.createElement('div');
            grid.style.cssText = `display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 12px;`;

            filteredHeroes.forEach(({ id, hero }) => {
                const card = document.createElement('div');
                const stars = hero.stars || 1;
                let starsHtml = '';
                for (let s = 0; s < stars; s++) {
                    starsHtml += `<span style="color: #fbbf24;">★</span>`;
                }

                // Find asset for sprite preview
                const asset = HERO_ASSETS.find(a =>
                    a.name.toLowerCase().includes(hero.heroCodeName?.toLowerCase() || '') ||
                    hero.heroCodeName?.toLowerCase().includes(a.name.toLowerCase())
                );

                let heroPreview = '<div style="font-size: 24px;">🦸</div>';
                if (asset?.sprite2D) {
                    const displaySize = 60;
                    const framesPerRow = asset.sprite2D.framesPerRow;
                    const totalRows = Math.ceil(asset.sprite2D.totalFrames / framesPerRow);
                    const scaledSheetWidth = framesPerRow * displaySize;
                    const scaledSheetHeight = totalRows * displaySize;
                    heroPreview = `
                        <div style="
                            width: ${displaySize}px; height: ${displaySize}px;
                            background-image: url('${asset.sprite2D.spritesheetPath}');
                            background-size: ${scaledSheetWidth}px ${scaledSheetHeight}px;
                            background-position: 0 0;
                            transform: scale(3.5) translateY(-10%);
                            transform-origin: center center;
                        "></div>
                    `;
                }

                card.style.cssText = `
                    background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1);
                    border-radius: 10px; padding: 8px; cursor: pointer; transition: all 0.2s;
                    display: flex; flex-direction: column; align-items: center; overflow: hidden;
                `;
                card.innerHTML = `
                    <div style="width: 60px; height: 60px; overflow: hidden; border-radius: 6px; margin-bottom: 5px; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.3);">
                        ${heroPreview}
                    </div>
                    <div style="font-size: 0.6rem; color: #fff; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
                        ${hero.heroCodeName || 'Hero'}
                    </div>
                    <div style="font-size: 0.7rem;">${starsHtml}</div>
                `;

                card.onmouseenter = () => {
                    card.style.borderColor = '#fbbf24';
                    card.style.background = 'rgba(251, 191, 36, 0.2)';
                };
                card.onmouseleave = () => {
                    card.style.borderColor = 'rgba(255,255,255,0.1)';
                    card.style.background = 'rgba(255,255,255,0.05)';
                };
                card.onclick = () => {
                    this.selectedSacrifices.set(slotIndex, id);
                    this.closeHeroSelectionModal();
                    this.renderContent(); // Re-render to show updated slots
                };

                grid.appendChild(card);
            });

            modal.appendChild(grid);
        }

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Cancel';
        closeBtn.style.cssText = `
            width: 100%; margin-top: 20px; padding: 12px; font-size: 1rem;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px; color: #fff; cursor: pointer; transition: all 0.2s;
        `;
        closeBtn.onmouseenter = () => { closeBtn.style.background = 'rgba(255,255,255,0.2)'; };
        closeBtn.onmouseleave = () => { closeBtn.style.background = 'rgba(255,255,255,0.1)'; };
        closeBtn.onclick = () => this.closeHeroSelectionModal();
        modal.appendChild(closeBtn);

        modalBackdrop.appendChild(modal);
        document.body.appendChild(modalBackdrop);
        this.heroSelectionModal = modalBackdrop;
    }

    private closeHeroSelectionModal() {
        if (this.heroSelectionModal) {
            this.heroSelectionModal.remove();
            this.heroSelectionModal = null;
        }
    }

    private async handleMerge() {
        try {
            const sacrificeIds = Array.from(this.selectedSacrifices.values());

            if (sacrificeIds.length === 0) {
                alert('Please select sacrifice heroes first.');
                return;
            }

            const res = await fetch('http://localhost:3000/api/hero/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commanderName: this.user.commanderName,
                    mainHeroId: this.instanceId,
                    sacrificeIds
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Update local user state
                this.user = data.user;
                this.onUpdate(data.user);
                // Persist to localStorage so renderContent reads fresh data
                localStorage.setItem('awengers_session', JSON.stringify(data.user));

                // Clear selections
                this.selectedSacrifices.clear();

                // Show success message
                const successMsg = document.createElement('div');
                successMsg.style.cssText = `
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px 50px;
                    border-radius: 16px; z-index: 100020; text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: scaleIn 0.3s ease;
                `;
                successMsg.innerHTML = `
                    <div style="font-size: 4rem; margin-bottom: 10px;">⭐</div>
                    <div style="color: #fff; font-size: 1.5rem; font-weight: bold;">Evolution Complete!</div>
                    <div style="color: rgba(255,255,255,0.8); font-size: 1rem; margin-top: 5px;">
                        Hero upgraded to ${data.newStars}★
                    </div>
                `;
                document.body.appendChild(successMsg);

                setTimeout(() => {
                    successMsg.remove();
                    // Re-render to show new state
                    this.renderContent();
                }, 1500);

            } else {
                alert(data.message || 'Merge failed. Please try again.');
            }
        } catch (e) {
            console.error('Merge Error:', e);
            alert('Network error. Please check your connection.');
        }
    }


    private renderEquipmentPanel(container: HTMLElement) {
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 10px; 
            margin-top: 10px;
        `;

        const equipment = this.heroManager.getHeroInstance().equipment;

        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            const itemId = equipment[i];

            slot.style.cssText = `
                aspect-ratio: 1;
                background: rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
                transition: all 0.2s;
            `;

            slot.onmouseenter = () => { slot.style.borderColor = '#fbbf24'; };
            slot.onmouseleave = () => { slot.style.borderColor = 'rgba(255,255,255,0.1)'; };
            slot.onclick = () => this.openEquipmentSelection(i);

            if (itemId) {
                // Item Exists
                const itemDef = ITEMS[itemId];
                if (itemDef) {
                    const iconPath = itemDef.icon || '/assets/items/unknown.png';
                    slot.innerHTML = `<img src="${iconPath}" style="width: 80%; height: 80%; object-fit: contain;">`;
                    slot.title = `${itemDef.name}\n${itemDef.description}\n\nStats:\n${this.formatStats(itemDef.stats)}`;
                } else {
                    slot.innerHTML = `?`;
                }
            } else {
                // Empty
                slot.innerHTML = `<span style="font-size: 2rem; color: rgba(255,255,255,0.2);">+</span>`;
            }

            grid.appendChild(slot);
        }

        container.appendChild(grid);

        // Display Current Equipment Stats Summary
        const eqStats = this.heroManager.getEquipmentStats();
        // Only show if there are some stats
        const hasStats = Object.values(eqStats).some(val => val > 0);

        if (hasStats) {
            const summary = document.createElement('div');
            summary.style.cssText = `margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.4); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);`;
            summary.innerHTML = `<div style="color: #fbbf24; font-size: 0.9rem; margin-bottom: 8px;">EQUIPMENT BONUSES</div>`;

            if (eqStats.hp) summary.innerHTML += `<div style="font-size: 0.85rem; color: #ccc;">HP: <span style="color:#fff">+${eqStats.hp}</span></div>`;
            if (eqStats.atk) summary.innerHTML += `<div style="font-size: 0.85rem; color: #ccc;">ATK: <span style="color:#fff">+${eqStats.atk}</span></div>`;
            if (eqStats.armor) summary.innerHTML += `<div style="font-size: 0.85rem; color: #ccc;">ARMOR: <span style="color:#fff">+${eqStats.armor}</span></div>`;
            if (eqStats.moveSpeed) summary.innerHTML += `<div style="font-size: 0.85rem; color: #ccc;">SPD: <span style="color:#fff">+${eqStats.moveSpeed}</span></div>`;
            if (eqStats.lifesteal) summary.innerHTML += `<div style="font-size: 0.85rem; color: #ccc;">L.STEAL: <span style="color:#fff">+${eqStats.lifesteal}%</span></div>`;

            container.appendChild(summary);
        }
    }

    private formatStats(stats: any): string {
        if (!stats) return '';
        return Object.entries(stats)
            .map(([key, val]) => `${key.toUpperCase()}: +${val}`)
            .join('\n');
    }

    private openEquipmentSelection(slotIndex: number) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
                position: absolute; inset: 0; background: rgba(0,0,0,0.95); 
                z-index: 20; display: flex; flex-direction: column; padding: 20px;
            `;

        // Check inventory for equipment
        const inventory = this.user.inventory || {};
        const items: { id: string, count: number }[] = [];

        // Handle Map vs Object
        if (this.user.inventory instanceof Map) {
            // If Map (shouldn't be in frontend typically unless serialized oddly, but legacy check)
            // Frontend usually receives object from JSON.
        }
        // Assume Object if not Map, or check
        // The sanitize helper returns object for inventory.
        if (inventory && typeof inventory === 'object') {
            Object.entries(inventory).forEach(([key, val]) => items.push({ id: key, count: val as number }));
        }

        const equipmentItems = items.filter(i => {
            const def = ITEMS[i.id];
            return def && def.type === 'equipment' && i.count > 0;
        });

        // Header
        const header = document.createElement('div');
        header.innerHTML = `
                <div style="font-weight: bold; font-size: 1.2rem; margin-bottom: 20px; color: #fff;">Select Equipment (Slot ${slotIndex + 1})</div>
            `;
        overlay.appendChild(header);

        if (equipmentItems.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.innerText = "No equipment available in items.";
            emptyMsg.style.color = '#888';
            overlay.appendChild(emptyMsg);
        } else {
            // List Container
            const list = document.createElement('div');
            list.style.cssText = `flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; align-content: start;`;

            equipmentItems.forEach(item => {
                const def = ITEMS[item.id];
                const el = document.createElement('div');
                el.style.cssText = `
                        aspect-ratio: 1; border: 1px solid #444; border-radius: 8px; 
                        background: rgba(40,40,40,0.8); cursor: pointer; display: flex; align-items: center; justify-content: center;
                        position: relative;
                     `;
                el.innerHTML = `
                    <div style="position: absolute; top: 2px; right: 4px; font-size: 0.7rem; color: #aaa;">x${item.count}</div>
                    <img src="${def.icon}" style="width: 70%; height: 70%; object-fit: contain;">
                `;
                el.onclick = () => {
                    this.handleEquip(slotIndex, item.id);
                    overlay.remove();
                };
                el.title = `${def.name}`;
                list.appendChild(el);
            });
            overlay.appendChild(list);
        }

        // Action Buttons
        const btnContainer = document.createElement('div');
        btnContainer.style.marginTop = 'auto';
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '10px';

        // Unequip Button
        const unequipBtn = document.createElement('button');
        unequipBtn.innerText = "Unequip Slot";
        unequipBtn.style.cssText = `flex: 1; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;`;
        unequipBtn.onclick = () => {
            this.handleEquip(slotIndex, null);
            overlay.remove();
        };

        // Close Button
        const closeBtn = document.createElement('button');
        closeBtn.innerText = "Cancel";
        closeBtn.style.cssText = `flex: 1; padding: 12px; background: #555; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;`;
        closeBtn.onclick = () => overlay.remove();

        btnContainer.appendChild(unequipBtn);
        btnContainer.appendChild(closeBtn);
        overlay.appendChild(btnContainer);

        // We append to local right panel or main container?
        // Right Panel is small (380px). List might be cramped but okay.
        // Let's modify render open logic to append to the RIGHT PANEL container specifically so it covers it.
        // But renderEquipmentPanel argument `container` is the right panel.
        // I don't have reference to it here easily unless I store it or pass it.
        // But `this.container` is the main modal.
        // If I append to `this.container` it covers the whole screen? No, `this.container` is the modal box.
        // Let's append to `this.container` but maybe style it to overlay the right side?
        // Or simpler: just cover the modal.
        this.container.appendChild(overlay);
    }

    private async handleEquip(slotIndex: number, itemId: string | null) {
        try {
            const commanderName = this.user.commanderName;
            const res = await fetch('http://localhost:3000/api/hero/equip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commanderName,
                    instanceId: this.instanceId,
                    slotIndex,
                    itemId
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Update local user
                this.user = data.user;
                this.onUpdate(data.user);
                localStorage.setItem('awengers_session', JSON.stringify(data.user));

                // Update Manager
                // Recreate or hack update
                // Since heroInstance is inside manager private, we need to recreate manager or cast to any
                // Recreating manager is safer

                let instanceData;
                if (this.user.heroes instanceof Map) {
                    instanceData = this.user.heroes.get(this.instanceId);
                } else {
                    instanceData = this.user.heroes[this.instanceId];
                }
                // Legacy handling for map/obj
                if (!instanceData && this.user.heroes instanceof Map) {
                    // Try converting key via string
                    // Actually instanceId is the key.
                }

                this.heroManager = this.recreateManager(data.user.heroes[this.instanceId]?.level || this.heroManager.getCurrentLevel(), data.user.heroes[this.instanceId]);

                this.renderContent();
            } else {
                alert(data.message || 'Equip Failed');
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
        }
    }
}
