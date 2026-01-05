import { HeroAssetConfig } from '../data/HeroAssetsMap';
import { createOryxHero, createSableHero, createRazorHero, createTauronHero, createBarrukHero, HeroProgressionManager, SkillDefinition } from '../data/HeroProgression';
import { BattleArenaUI } from './BattleArenaUI';

export class GalleryHeroModal {
    private backdrop: HTMLElement;
    private container: HTMLElement;
    private animInterval: number | null = null;
    private heroManager: HeroProgressionManager;
    private escHandler: ((e: KeyboardEvent) => void) | null = null;
    private activeTooltip: HTMLElement | null = null;
    private documentClickHandler: ((e: MouseEvent) => void) | null = null;
    private heroAssetName: string;

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

    constructor(hero: HeroAssetConfig, onClose: () => void, heroLevel: number = 250) {
        this.heroAssetName = hero.name;
        // Determine which hero progression to use based on hero name
        const heroNameLower = hero.name.toLowerCase();

        if (heroNameLower.includes('ranger')) {
            // Sable - Antelope Ranger
            this.heroManager = createSableHero(heroLevel);
            this.skillIconPaths = {
                'wind_piercer': '/assets/Character/heroes/antelope_ranger_with_animation_spritesheets/skills/Wind-Piercer.png',
                'back_kick_vault': '/assets/Character/heroes/antelope_ranger_with_animation_spritesheets/skills/Back-Kick Vault.png',
                'hunters_mark': "/assets/Character/heroes/antelope_ranger_with_animation_spritesheets/skills/Hunter's Mark.png",
                'spirit_barrage': '/assets/Character/heroes/antelope_ranger_with_animation_spritesheets/skills/Spirit Barrage.png'
            };
        } else if (heroNameLower.includes('razor')) {
            // Razor - Boar Assassin
            this.heroManager = createRazorHero(heroLevel);
            this.skillIconPaths = {
                'tusk_gore': '/assets/Character/heroes/boar_assassin_with_animation_spritesheets/skills/Tusk Gore.png',
                'wild_charge': '/assets/Character/heroes/boar_assassin_with_animation_spritesheets/skills/Wild Charge.png',
                'blood_scent': '/assets/Character/heroes/boar_assassin_with_animation_spritesheets/skills/Blood Scent.png',
                'guillotine_breaker': '/assets/Character/heroes/boar_assassin_with_animation_spritesheets/skills/Guillotine Breaker.png'
            };
        } else if (heroNameLower.includes('tauron')) {
            // Tauron - Bull Mage
            this.heroManager = createTauronHero(heroLevel);
            this.skillIconPaths = {
                'spirit_bolt': '/assets/Character/heroes/bull_mage_with_animation_spritesheets/skills/Spirit Bolt.png',
                'ancestral_ward': '/assets/Character/heroes/bull_mage_with_animation_spritesheets/skills/Ancestral Ward.png',
                'mystic_hide': '/assets/Character/heroes/bull_mage_with_animation_spritesheets/skills/Mystic Hide.png',
                'stampede_of_souls': '/assets/Character/heroes/bull_mage_with_animation_spritesheets/skills/Stampede of Souls.png'
            };
        } else if (heroNameLower.includes('barruk')) {
            // Barruk - Bull Ranger
            this.heroManager = createBarrukHero(heroLevel);
            this.skillIconPaths = {
                'heavy_bolt': '/assets/Character/heroes/bull_ranger_with_animation_spritesheets/skills/Heavy Bolt.png',
                'explosive_bolas': '/assets/Character/heroes/bull_ranger_with_animation_spritesheets/skills/Explosive Bolas.png',
                'big_game_hunter': '/assets/Character/heroes/bull_ranger_with_animation_spritesheets/skills/Big Game Hunter.png',
                'siege_mode': '/assets/Character/heroes/bull_ranger_with_animation_spritesheets/skills/Siege Mode.png'
            };
        } else {
            // Default: Oryx - Antelope Mage
            this.heroManager = createOryxHero(heroLevel);
            this.skillIconPaths = {
                'horn_bolt': '/assets/Character/heroes/antelope_mage_with_animation_spritesheets/skills/Horn Bolt.png',
                'astral_leap': '/assets/Character/heroes/antelope_mage_with_animation_spritesheets/skills/Astral Leap.png',
                'static_hooves': '/assets/Character/heroes/antelope_mage_with_animation_spritesheets/skills/Static Hooves.png',
                'natures_wrath': "/assets/Character/heroes/antelope_mage_with_animation_spritesheets/skills/Nature's Wrath.png"
            };
        }

        const stats = this.heroManager.getCurrentStats();
        const config = this.heroManager.getConfig();
        const skills = config.skills;
        const currentLevelCap = this.heroManager.getCurrentLevelCap();
        const nextLevelCost = this.heroManager.getNextLevelCost(heroLevel);

        // Calculate Total Hero Power
        const heroPower = this.calculateHeroPower(stats, skills, heroLevel);

        // Determine front-view sprite path based on hero
        let heroBasePath = '/assets/Character/heroes/antelope_mage_with_animation_spritesheets';
        let spriteFilename = 'Armature_Armature_idle_Base_Layer_spritesheet.png';

        if (heroNameLower.includes('ranger')) {
            heroBasePath = '/assets/Character/heroes/antelope_ranger_with_animation_spritesheets';
        } else if (heroNameLower.includes('razor')) {
            heroBasePath = '/assets/Character/heroes/boar_assassin_with_animation_spritesheets';
            spriteFilename = 'Armature_Armature_idle_Base_Layer_001_spritesheet.png';
        } else if (heroNameLower.includes('tauron')) {
            heroBasePath = '/assets/Character/heroes/bull_mage_with_animation_spritesheets';
        } else if (heroNameLower.includes('barruk')) {
            heroBasePath = '/assets/Character/heroes/bull_ranger_with_animation_spritesheets';
        }

        // Front-view idle spritesheet config
        const frontViewSprite = {
            path: `${heroBasePath}/front-view/${spriteFilename}`,
            framesPerRow: 5,
            totalFrames: 48,
            fps: 24
        };


        // Create backdrop for click-outside to close
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
        this.container.className = 'gallery-hero-modal';
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

        // Add animations - using GPU-accelerated properties only (transform, opacity)
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes modalIn { 
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); } 
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); } 
            }
            @keyframes modalOut { 
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); } 
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.95); } 
            }
            @keyframes slideInLeft { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.02); } }
            @keyframes glow { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
            @keyframes powerPulse { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); } }
            @keyframes tooltipIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);

        // === LEFT PANEL - Hero Info & Stats ===
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

        // Level Badge with Progress Bar
        const xpCurrent = 0;
        const xpMax = 25000;
        const xpPercent = (xpCurrent / xpMax) * 100;
        const isMaxLevel = heroLevel >= config.maxLevel;

        const levelBadge = document.createElement('div');
        levelBadge.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 10px;
        `;

        if (isMaxLevel) {
            // Max level layout - show MAX badge
            levelBadge.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="color: #fff; font-weight: bold; font-size: 1.1rem;">LEVEL ${heroLevel}</div>
                    <div style="display: flex; align-items: center; gap: 4px; background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 2px 8px; border-radius: 10px;">
                        <span style="font-size: 0.7rem;">⭐</span>
                        <span style="color: #000; font-size: 0.65rem; font-weight: bold;">MAX</span>
                    </div>
                </div>
            `;
        } else {
            // Normal level layout - show XP and progress
            levelBadge.innerHTML = `
                <div style="color: #fff; font-weight: bold; font-size: 1.1rem;">LEVEL ${heroLevel}</div>
                <div style="color: #fb923c; font-size: 0.7rem; margin: 2px 0;">${xpCurrent.toLocaleString()} / ${xpMax.toLocaleString()} XP</div>
                <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden; margin: 4px 0;">
                    <div style="width: ${Math.max(xpPercent, 0)}%; height: 100%; background: linear-gradient(90deg, #f97316, #fbbf24); border-radius: 2px; min-width: ${xpPercent > 0 ? '4px' : '0'};"></div>
                </div>
                <div style="color: #6b7280; font-size: 0.6rem;">Max Level: ${config.maxLevel}</div>
            `;
        }
        leftPanel.appendChild(levelBadge);

        // Hero Name
        const heroName = document.createElement('div');
        heroName.style.cssText = `
            font-size: 2.2rem;
            font-weight: bold;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 3px;
        `;
        heroName.innerText = config.name;
        leftPanel.appendChild(heroName);

        // Role subtitle
        const roleInfo = document.createElement('div');
        roleInfo.style.cssText = `color: #06b6d4; font-size: 0.8rem; margin-bottom: 5px;`;
        roleInfo.innerText = `${config.displayName} • ${config.role}`;
        leftPanel.appendChild(roleInfo);

        // Main Stat Badge
        const mainStatBadge = document.createElement('div');
        mainStatBadge.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(90deg, #10b981, #059669);
            padding: 4px 12px;
            border-radius: 20px;
            width: fit-content;
            font-size: 0.75rem;
            font-weight: bold;
            color: #fff;
        `;
        mainStatBadge.innerHTML = `MAIN STAT: <span style="color: #fff;">${config.mainStat}</span>`;
        leftPanel.appendChild(mainStatBadge);

        // Divider with stats header
        const statsHeader = document.createElement('div');
        statsHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;
        statsHeader.innerHTML = `
            <span style="color: #8b8b8b; font-size: 0.75rem; letter-spacing: 1px;">STATS (LVL ${heroLevel})</span>
            <span style="color: #f97316; font-size: 0.75rem; font-weight: bold;">CAP: ${currentLevelCap}</span>
        `;
        leftPanel.appendChild(statsHeader);

        // Stats Grid - No background, larger icons
        const statsData = [
            { key: 'attack', label: 'ATTACK', value: stats.atk.toLocaleString(), color: '#a855f7' },
            { key: 'hp', label: 'HP', value: stats.hp.toLocaleString(), color: '#ef4444' },
            { key: 'armor', label: 'ARMOR', value: stats.armor.toLocaleString(), color: '#3b82f6' },
            { key: 'aspd', label: 'ATK SPEED', value: stats.aspd.toFixed(2), color: '#22c55e' },
            { key: 'moveSpeed', label: 'MOVE SPEED', value: stats.moveSpeed.toString(), color: '#f59e0b' },
        ];

        statsData.forEach(stat => {
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            `;
            row.innerHTML = `
                <img src="${this.attrIconPaths[stat.key]}" style="width: 36px; height: 36px; margin-right: 12px; object-fit: contain;" />
                <span style="color: #9ca3af; font-size: 0.8rem; flex: 1;">${stat.label}</span>
                <span style="color: ${stat.color}; font-weight: bold; font-size: 1.1rem;">${stat.value}</span>
            `;
            leftPanel.appendChild(row);
        });

        // Next Level Cost Box or Max Level indicator
        const costBox = document.createElement('div');
        costBox.style.cssText = `
            background: ${isMaxLevel ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))' : 'rgba(0,0,0,0.4)'};
            border-radius: 10px;
            padding: 10px 12px;
            margin-top: 8px;
            border: 1px solid ${isMaxLevel ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255,255,255,0.1)'};
        `;

        if (isMaxLevel) {
            costBox.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">⭐</span>
                    <div>
                        <div style="color: #fbbf24; font-size: 0.9rem; font-weight: bold; letter-spacing: 1px;">MAX LEVEL REACHED</div>
                        <div style="color: #9ca3af; font-size: 0.7rem;">This hero has reached maximum potential</div>
                    </div>
                </div>
            `;
        } else {
            costBox.innerHTML = `
                <div style="color: #6b7280; font-size: 0.7rem; margin-bottom: 6px; letter-spacing: 1px;">NEXT LEVEL COST</div>
                <div style="display: flex; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #fbbf24;">🪙</span>
                        <span style="color: #fbbf24; font-weight: bold; font-size: 0.85rem;">${nextLevelCost.gold.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #22c55e;">🧪</span>
                        <span style="color: #22c55e; font-weight: bold; font-size: 0.85rem;">${nextLevelCost.soulPotion.toLocaleString()}</span>
                    </div>
                </div>
            `;
        }
        leftPanel.appendChild(costBox);

        // === Demo Hero Button ===
        const demoHeroBtn = document.createElement('button');
        demoHeroBtn.innerText = '🎮 Demo Hero';
        demoHeroBtn.style.cssText = `
            width: 100%;
            margin-top: 15px;
            padding: 12px 20px;
            font-size: 1rem;
            font-weight: bold;
            font-family: 'SF Pro Display', sans-serif;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            border: none;
            border-radius: 10px;
            color: #fff;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            transition: all 0.2s ease;
            letter-spacing: 1px;
        `;
        demoHeroBtn.onmouseenter = () => {
            demoHeroBtn.style.transform = 'scale(1.02)';
            demoHeroBtn.style.boxShadow = '0 6px 25px rgba(139, 92, 246, 0.6)';
        };
        demoHeroBtn.onmouseleave = () => {
            demoHeroBtn.style.transform = '';
            demoHeroBtn.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
        };
        demoHeroBtn.onclick = (e) => {
            e.stopPropagation();
            this.openBattleArena();
        };
        leftPanel.appendChild(demoHeroBtn);

        this.container.appendChild(leftPanel);

        // === CENTER - Large Hero Sprite with Skills at Bottom ===
        const centerSection = document.createElement('div');
        centerSection.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            animation: scaleIn 0.5s ease;
            min-width: 400px;
            overflow: hidden;
        `;

        // Purple glow effect
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            width: 450px;
            height: 450px;
            background: radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(147, 51, 234, 0.1) 40%, transparent 70%);
            border-radius: 50%;
            animation: pulse 4s ease-in-out infinite;
            left: 50%;
            top: 45%;
            transform: translate(-50%, -50%);
        `;
        centerSection.appendChild(glow);

        // Hero Power Display - Positioned at top of center section
        const powerBox = document.createElement('div');
        powerBox.style.cssText = `
            position: absolute;
            top: 20px;
            left: 10%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 10px 20px;
            z-index: 10;
        `;
        powerBox.innerHTML = `
            <img src="/assets/attr/fist.png" style="width: 100px; height: 100px; object-fit: contain;" />
            <div>
                <div style="color: #6b7280; font-size: 0.6rem; letter-spacing: 1px;">Combat Power</div>
                <div style="color: #fbbf24; font-size: 1.4rem; font-weight: bold;">${heroPower.toLocaleString()}</div>
            </div>
        `;
        centerSection.appendChild(powerBox);

        // Large animated sprite (using front-view idle)
        const spriteSize = 950;
        const framesPerRow = frontViewSprite.framesPerRow;
        const totalRows = Math.ceil(frontViewSprite.totalFrames / framesPerRow);
        const scaledSheetWidth = framesPerRow * spriteSize;
        const scaledSheetHeight = totalRows * spriteSize;

        const sprite = document.createElement('div');
        sprite.style.cssText = `
            position: absolute;
            left: 50%;
            top: 45%;
            transform: translate(-50%, -50%);
            width: ${spriteSize}px;
            height: ${spriteSize}px;
            background-image: url('${frontViewSprite.path}');
            background-size: ${scaledSheetWidth}px ${scaledSheetHeight}px;
            background-position: 0 0;
            background-repeat: no-repeat;
            filter: drop-shadow(0 0 30px rgba(147, 51, 234, 0.7)) saturate(1.2) contrast(1.1) brightness(1.1);
            z-index: 1;
            animation: glow 3s ease-in-out infinite;
        `;
        centerSection.appendChild(sprite);

        // Animate
        let frameIndex = 0;
        this.animInterval = window.setInterval(() => {
            frameIndex = (frameIndex + 1) % frontViewSprite.totalFrames;
            const col = frameIndex % framesPerRow;
            const row = Math.floor(frameIndex / framesPerRow);
            sprite.style.backgroundPosition = `-${col * spriteSize}px -${row * spriteSize}px`;
        }, 1000 / frontViewSprite.fps);

        // === SKILLS BAR at Bottom ===
        const skillsBar = document.createElement('div');
        skillsBar.style.cssText = `
            position: absolute;
            bottom: 40px;
            left: 13%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            padding: 18px 30px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 18px;
            border: 1px solid rgba(147, 51, 234, 0.4);
            backdrop-filter: blur(10px);
            z-index: 10;
            animation: slideInUp 0.5s ease 0.2s both;
        `;

        skills.forEach(skill => {
            const typeColors: Record<string, { bg: string; border: string; badge: string }> = {
                'active': { bg: 'rgba(249, 115, 22, 0.3)', border: '#f97316', badge: '#f97316' },
                'passive': { bg: 'rgba(34, 197, 94, 0.3)', border: '#22c55e', badge: '#22c55e' },
                'ultimate': { bg: 'rgba(168, 85, 247, 0.3)', border: '#a855f7', badge: '#a855f7' },
            };
            const colors = typeColors[skill.type] || typeColors['active'];
            const iconPath = this.skillIconPaths[skill.id] || '';

            const skillIcon = document.createElement('div');
            skillIcon.style.cssText = `
                width: 100px;
                height: 100px;
                background: ${colors.bg};
                border: 4px solid ${colors.border};
                border-radius: 16px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            `;
            skillIcon.innerHTML = `
                <img src="${iconPath}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
            `;

            // Hover effects
            skillIcon.onmouseenter = () => {
                skillIcon.style.transform = 'scale(1.1)';
                skillIcon.style.boxShadow = `0 0 20px ${colors.border}`;
            };
            skillIcon.onmouseleave = () => {
                skillIcon.style.transform = '';
                skillIcon.style.boxShadow = '';
            };

            // Click to show tooltip with rank progression
            skillIcon.onclick = (e) => {
                e.stopPropagation();
                this.showSkillTooltip(skill, skillIcon, colors, heroLevel);
            };

            skillsBar.appendChild(skillIcon);
        });

        centerSection.appendChild(skillsBar);

        this.container.appendChild(centerSection);

        // === Close Button ===
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
        closeBtn.onmouseover = () => {
            closeBtn.style.color = '#f97316';
            closeBtn.style.transform = 'scale(1.2) rotate(90deg)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.color = 'rgba(255,255,255,0.4)';
            closeBtn.style.transform = '';
        };
        closeBtn.onclick = () => {
            this.close();
            onClose();
        };
        this.container.appendChild(closeBtn);

        // ESC key to close
        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.close();
                onClose();
            }
        };
        document.addEventListener('keydown', this.escHandler);

        // Click anywhere to close tooltip
        this.container.onclick = () => {
            this.hideTooltip();
        };
    }

    /**
     * Show skill tooltip with rank progression
     */
    private showSkillTooltip(skill: SkillDefinition, anchor: HTMLElement, colors: { bg: string; border: string; badge: string }, heroLevel: number) {
        // Hide existing tooltip
        this.hideTooltip();

        const currentRank = this.heroManager.getSkillRank(skill.id);
        const currentRankIndex = this.getCurrentRankIndex(skill, heroLevel);

        // Get anchor position to place tooltip above it
        const anchorRect = anchor.getBoundingClientRect();
        const tooltipWidth = 400;

        // Calculate left position - try to center on the skill icon
        const iconCenterX = anchorRect.left + (anchorRect.width / 2);
        let tooltipLeft = iconCenterX - (tooltipWidth / 2);

        // Boundary checks - keep tooltip within viewport
        const margin = 20;
        if (tooltipLeft < margin) {
            tooltipLeft = margin;
        } else if (tooltipLeft + tooltipWidth > window.innerWidth - margin) {
            tooltipLeft = window.innerWidth - tooltipWidth - margin;
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            left: ${tooltipLeft}px;
            bottom: auto;
            top: auto;
            background: rgba(13, 13, 26, 0.95);
            border: 2px solid ${colors.border};
            border-radius: 12px;
            padding: 15px;
            width: ${tooltipWidth}px;
            z-index: 100001;
            animation: tooltipIn 0.2s ease;
            backdrop-filter: blur(10px);
        `;

        // Append first to measure height, then position
        document.body.appendChild(tooltip);

        // Header
        let tooltipHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                <div style="width: 48px; height: 48px; background: ${colors.bg}; border: 2px solid ${colors.border}; border-radius: 10px; overflow: hidden;">
                    <img src="${this.skillIconPaths[skill.id] || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
                </div>
                <div style="flex: 1;">
                    <div style="color: #fff; font-weight: bold; font-size: 1rem;">${skill.name}</div>
                    <div style="color: ${colors.badge}; font-size: 0.7rem; text-transform: uppercase;">${skill.type}</div>
                </div>
                <span style="color: #22c55e; font-size: 0.7rem; font-weight: bold;">✓ UNLOCKED</span>
            </div>
            <div style="color: #9ca3af; font-size: 0.8rem; margin-bottom: 12px; line-height: 1.4;">${currentRank?.description || skill.description}</div>
            ${currentRank?.effect ? `<div style="color: #fbbf24; font-size: 0.75rem; margin-bottom: 12px;">✨ ${currentRank.effect}</div>` : ''}
            <div style="color: #6b7280; font-size: 0.65rem; letter-spacing: 1px; margin-bottom: 8px;">RANK PROGRESSION</div>
        `;

        // Rank list
        skill.ranks.forEach((rank, index) => {
            const isCurrentRank = index === currentRankIndex;
            const isUnlocked = rank.unlockLevel <= heroLevel;

            tooltipHTML += `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 10px;
                    background: ${isCurrentRank ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0,0,0,0.3)'};
                    border-radius: 6px;
                    margin-bottom: 4px;
                    border: ${isCurrentRank ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid transparent'};
                    opacity: ${isUnlocked ? '1' : '0.5'};
                ">
                    <div style="width: 22px; height: 22px; background: ${isUnlocked ? colors.border : '#374151'}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 0.65rem; font-weight: bold; color: #fff;">${index + 1}</div>
                    <span style="color: ${isUnlocked ? '#22c55e' : '#9ca3af'}; font-size: 0.65rem; min-width: 45px;">Lv.${rank.unlockLevel}</span>
                    <span style="color: ${isUnlocked ? '#e5e7eb' : '#6b7280'}; font-size: 0.7rem; flex: 1;">${rank.description}</span>
                    ${rank.effect ? `<span style="color: ${isUnlocked ? '#fbbf24' : '#6b7280'}; font-size: 0.65rem;">• ${rank.effect}</span>` : ''}
                </div>
            `;
        });

        tooltip.innerHTML = tooltipHTML;

        // Prevent click from closing when clicking on tooltip
        tooltip.onclick = (e) => e.stopPropagation();

        // Now measure tooltip height and position it above the skill icon
        const tooltipHeight = tooltip.offsetHeight;
        const tooltipTop = anchorRect.top - tooltipHeight - 15;
        tooltip.style.top = `${Math.max(20, tooltipTop)}px`;

        this.activeTooltip = tooltip;

        // Add document click handler to close tooltip when clicking outside
        setTimeout(() => {
            this.documentClickHandler = (e: MouseEvent) => {
                if (this.activeTooltip && !this.activeTooltip.contains(e.target as Node)) {
                    this.hideTooltip();
                }
            };
            document.addEventListener('click', this.documentClickHandler);
        }, 0);
    }

    /**
     * Hide active tooltip
     */
    private hideTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }
        if (this.documentClickHandler) {
            document.removeEventListener('click', this.documentClickHandler);
            this.documentClickHandler = null;
        }
    }

    /**
     * Calculate Total Hero Power based on stats and skills
     */
    private calculateHeroPower(stats: { hp: number; atk: number; armor: number; aspd: number; moveSpeed: number }, skills: SkillDefinition[], level: number): number {
        // Base power from stats
        const hpPower = stats.hp * 0.1;
        const atkPower = stats.atk * 5;
        const armorPower = stats.armor * 10;
        const aspdPower = stats.aspd * 1000;
        const speedPower = stats.moveSpeed * 2;

        // Skill power based on unlocked ranks
        let skillPower = 0;
        skills.forEach(skill => {
            skill.ranks.forEach((rank, index) => {
                if (rank.unlockLevel <= level) {
                    skillPower += (index + 1) * 5000; // Each rank adds power
                    if (rank.damagePercent) {
                        skillPower += rank.damagePercent * 50;
                    }
                }
            });
        });

        // Level bonus
        const levelPower = level * 500;

        return Math.floor(hpPower + atkPower + armorPower + aspdPower + speedPower + skillPower + levelPower);
    }

    /**
     * Get current rank index for a skill based on hero level
     */
    private getCurrentRankIndex(skill: SkillDefinition, level: number): number {
        let currentIndex = -1;
        skill.ranks.forEach((rank, index) => {
            if (rank.unlockLevel <= level) {
                currentIndex = index;
            }
        });
        return currentIndex;
    }

    close() {
        if (this.animInterval) {
            clearInterval(this.animInterval);
            this.animInterval = null;
        }
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
        this.hideTooltip();

        // Animate out before removing
        this.backdrop.style.animation = 'fadeOut 0.2s ease forwards';
        this.container.style.animation = 'modalOut 0.2s ease forwards';

        setTimeout(() => {
            this.backdrop.remove();
            this.container.remove();
        }, 200);
    }

    getElement(): HTMLElement {
        return this.container;
    }

    getBackdrop(): HTMLElement {
        return this.backdrop;
    }

    /**
     * Open the battle arena demo
     */
    /**
     * Open the battle arena demo
     */
    private openBattleArena() {
        // Use the stored asset name which matches HERO_ASSETS keys
        const assetName = this.heroAssetName;

        // Mock Team: Single Hero at max level
        const stats = this.heroManager.getStats(250);
        const skills = this.heroManager.getSkills();

        const heroTeam = [{
            name: assetName,
            level: 250,
            instanceId: 'demo_hero',
            stars: 5,
            stats: {
                hp: stats.hp,
                atk: stats.atk,
                def: stats.armor, // Map armor to def
                speed: stats.aspd, // Map aspd to speed
                crit: '25%'
            },
            skills: skills,
            moveSpeed: stats.moveSpeed
        }];

        // Mock Enemy for Demo
        const enemyIds = ['dummy_target', 'dummy_target', 'dummy_target', 'dummy_target', 'dummy_target', 'dummy_target'];

        const battleArena = new BattleArenaUI(
            heroTeam,
            () => {
                // onClose
                battleArena.getElement().remove();
            },
            (_result) => {
                // onBattleEnd
                battleArena.close();
            },
            enemyIds,
            250, // Stage Level
            false, // Auto
            1, // Map ID
            false, // First Clear
            2 // Speed
        );
        document.body.appendChild(battleArena.getElement());
    }
}
