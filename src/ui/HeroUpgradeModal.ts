import { HeroAssetConfig } from '../data/HeroAssetsMap';
import { createOryxHero, createSableHero, createRazorHero, HeroProgressionManager, SkillDefinition, HeroInstance } from '../data/HeroProgression';

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
            skillLevels: savedData.skillLevels || {}
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
            opacity: 0;
            animation: fadeIn 0.2s ease forwards;
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
            max-width: 1100px;
            height: 85%;
            background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 30%, #16213e 70%, #0d0d1a 100%);
            display: flex;
            z-index: 99999;
            opacity: 0;
            animation: modalIn 0.25s ease forwards;
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

        const heroLevel = this.heroManager.getCurrentLevel();
        const stats = this.heroManager.getCurrentStats();
        const config = this.heroManager.getConfig();
        const skills = config.skills;
        const currentLevelCap = this.heroManager.getCurrentLevelCap();
        const nextLevelCost = this.heroManager.getNextLevelCost(heroLevel);
        const heroPower = this.calculateHeroPower(stats, skills, heroLevel);

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
            animation: slideInLeft 0.4s ease;
            border-right: 1px solid rgba(147, 51, 234, 0.2);
            overflow-y: auto;
        `;

        // Level Badge
        leftPanel.appendChild(this.createLevelBadge(heroLevel, config.maxLevel));

        // Name & Role
        const heroName = document.createElement('div');
        heroName.style.cssText = `font-size: 2.2rem; font-weight: bold; color: #fff; text-transform: uppercase; letter-spacing: 3px;`;
        heroName.innerText = config.name;
        leftPanel.appendChild(heroName);

        const roleInfo = document.createElement('div');
        roleInfo.style.cssText = `color: #06b6d4; font-size: 0.8rem; margin-bottom: 5px;`;
        roleInfo.innerText = `${config.displayName} • ${config.role}`;
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
        const isAtCap = this.heroManager.isAtLevelCap();
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
                const currentMilestone = config.rankUpMilestones[this.heroManager.getHeroInstance().currentRankIndex];

                // Get hero's star level from user data
                let heroStars = 1;
                if (this.user.heroes) {
                    const heroInstance = this.user.heroes instanceof Map
                        ? this.user.heroes.get(this.instanceId)
                        : this.user.heroes[this.instanceId];
                    heroStars = heroInstance?.stars || 1;
                }

                // Check for star gating
                const needsEvolution = currentMilestone?.starRequirement && heroStars < currentMilestone.starRequirement;

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

            // Cost Display
            const costDiv = document.createElement('div');
            costDiv.innerHTML = `
                <div style="color: #6b7280; font-size: 0.7rem; margin-bottom: 6px;">${isRankUp ? 'PROMOTION COST' : 'NEXT LEVEL COST'}</div>
                <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #fbbf24;">🪙</span>
                        <span style="color: #fbbf24; font-weight: bold; font-size: 0.9rem;">${costGold.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: ${isRankUp ? '#a855f7' : '#22c55e'};">${secondResourceIcon}</span>
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
            leftPanel.appendChild(upgradeBox);
        }

        this.container.appendChild(leftPanel);

        // === CENTER - Sprite ===
        const centerSection = document.createElement('div');
        centerSection.style.cssText = `flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; overflow: hidden;`;

        this.renderSprite(centerSection);

        // Power Box
        const powerBox = document.createElement('div');
        powerBox.style.cssText = `position: absolute; top: 20px; left: 10%; transform: translateX(-50%); display: flex; align-items: center; gap: 5px; padding: 10px 20px; z-index: 10;`;
        powerBox.innerHTML = `
            <img src="/assets/attr/fist.png" style="width: 56px; height: 56px; object-fit: contain;" />
            <div>
                <div style="color: #6b7280; font-size: 0.6rem;">HERO POWER</div>
                <div style="color: #fbbf24; font-size: 1.4rem; font-weight: bold;">${heroPower.toLocaleString()}</div>
            </div>
        `;
        centerSection.appendChild(powerBox);

        // Skills
        const skillsBar = document.createElement('div');
        skillsBar.style.cssText = `position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; gap: 20px; padding: 18px 30px; background: rgba(0, 0, 0, 0.7); border-radius: 18px; backdrop-filter: blur(10px); z-index: 10;`;

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
                this.onUpdate(data.user);

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
                alert(data.reason ? `${data.message}: ${data.reason}` : (data.message || 'Level Up Failed'));
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
}
