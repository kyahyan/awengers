import { HeroDef, HERO_DEFINITIONS } from '../data/HeroDefinitions';
import { HERO_ASSETS } from '../data/HeroAssetsMap';

// Mapping for heroes without explicit sprite configs
const HERO_SPRITE_MAP: Record<string, { path: string; frames: number; fps: number }> = {
    'Antelope Mage': { path: '/assets/Character/heroes/antelope_mage_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Antelope Ranger': { path: '/assets/Character/heroes/antelope_ranger_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Boar Assassin': { path: '/assets/Character/heroes/boar_assassin_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_001_spritesheet.png', frames: 14, fps: 12 },
    'Bull Assassin': { path: '/assets/Character/heroes/bull_assassin_with_anim_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Bull Mage': { path: '/assets/Character/heroes/bull_mage_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Bull Ranger': { path: '/assets/Character/heroes/bull_ranger_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Crocodile Assassin': { path: '/assets/Character/heroes/crocodile_assassin_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Crocodile Knight': { path: '/assets/Character/heroes/crocodile_knight_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Crocodile Mage': { path: '/assets/Character/heroes/crocodile_mage_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Crocodile Warrior': { path: '/assets/Character/heroes/crocodile_warrior_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Dog Mage': { path: '/assets/Character/heroes/dog_mage_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Dog Ranger': { path: '/assets/Character/heroes/dog_ranger_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Dog Warrior': { path: '/assets/Character/heroes/dog_warrior_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Elephant Mage': { path: '/assets/Character/heroes/elephant_mage_with_animation_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 14, fps: 12 },
    'Rabbit Ranger': { path: '/assets/Character/heroes/Mythic/rabbit_ranger_heavy_artillery_pioneer_with_anim_spritesheets/front-view/Armature_Armature_idle_Base_Layer_spritesheet.png', frames: 48, fps: 24 },
};

export class HeroDetailUI {
    private container: HTMLElement;
    private heroDef: HeroDef;
    private onClose: () => void;
    private onPrev?: () => void;
    private onNext?: () => void;
    private panel: HTMLElement | null = null;
    private animationId: number | null = null;

    constructor(heroName: string, onClose: () => void, onPrev?: () => void, onNext?: () => void) {
        this.onClose = onClose;
        this.onPrev = onPrev;
        this.onNext = onNext;
        this.heroDef = this.findHeroDef(heroName);
        this.container = document.createElement('div');
        this.container.className = 'hero-detail-ui';

        // Create a fixed overlay container directly on body
        // This MUST be outside any scaled containers
        this.container.id = 'hero-detail-fixed-overlay';
        this.initialize();
    }

    private animateClose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.panel) {
            this.panel.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                this.onClose();
            }, 280);
        } else {
            this.onClose();
        }
    }

    private getSpriteConfig(): { path: string; frames: number; fps: number } | null {
        // First check the mapping
        if (HERO_SPRITE_MAP[this.heroDef.name]) {
            return HERO_SPRITE_MAP[this.heroDef.name];
        }
        // Then check HERO_ASSETS
        const asset = HERO_ASSETS.find(a => a.name === this.heroDef.name && a.sprite2D);
        if (asset && asset.sprite2D) {
            return {
                path: asset.sprite2D.spritesheetPath,
                frames: asset.sprite2D.totalFrames,
                fps: asset.sprite2D.fps || 12
            };
        }
        return null;
    }

    private findHeroDef(name: string): HeroDef {
        // Search through all categories (by name OR codeName)
        for (const cat in HERO_DEFINITIONS) {
            // @ts-ignore
            const hero = HERO_DEFINITIONS[cat].find(h => h.name === name || h.codeName === name);
            if (hero) return hero;
        }
        // Fallback dummy
        return {
            name: name,
            codeName: name,
            class: 'Unknown',
            rarity: 'Common',
            baseStats: { str: 10, agi: 10, int: 10 },
            growth: { str: 1, agi: 1, int: 1 },
            skillCd: 0,
            ultCd: 0
        };
    }

    private initialize() {
        // Styles
        const style = document.createElement('style');
        style.innerHTML = `
            #hero-detail-fixed-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 99999;
                pointer-events: none;
            }
            .detail-panel {
                position: fixed !important;
                top: 50px !important;
                right: 20px !important;
                width: 280px !important;
                height: 500px !important;
                background-color: #111111;
                border-radius: 20px;
                pointer-events: auto;
                display: flex; 
                flex-direction: column;
                color: white;
                font-family: 'SF Pro Display', sans-serif;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transform: none !important;
                animation: none !important;
                padding: 20px;
                box-sizing: border-box;
                overflow: auto;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0.5; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .detail-panel.closing {
                animation: slideOut 0.3s forwards;
            }
            .header {
                padding-bottom: 20px;
                border-bottom: 1px solid #333;
                display: flex; 
                align-items: center; 
                justify-content: space-between;
                margin-bottom: 20px;
            }
            .hero-title {
                font-size: 28px; font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #fca311;
            }
            .hero-class {
                font-size: 14px; color: #aaa;
                display: flex; align-items: center; gap: 5px;
                margin-top: 5px;
            }
            .rarity-badge {
                padding: 4px 8px; border-radius: 4px;
                font-size: 12px; font-weight: bold;
                text-transform: uppercase;
            }
            .rarity-Mythic { background: #e74c3c; color: white; }
            .rarity-Legendary { background: #9b59b6; color: white; }
            .rarity-Rare { background: #3498db; color: white; }
            .rarity-Common { background: #555; color: white; }
            .rarity-Standard { background: #3498db; color: white; }
            
            .content {
                flex: 1;
                overflow-y: auto;
                /* Hide scrollbar */
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            .content::-webkit-scrollbar {
                display: none;
            }
            
            .section-title {
                font-size: 14px; 
                color: #888; 
                margin-bottom: 15px;
                text-transform: uppercase; 
                letter-spacing: 2px;
            }
            
            .stat-row {
                display: flex; justify-content: space-between;
                padding: 10px 0; 
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .stat-label { color: #ccc; font-size: 15px; }
            .stat-value { font-weight: bold; color: #fff; font-size: 15px; }
            
            .skill-card {
                background: rgba(255,255,255,0.03);
                border-radius: 10px; 
                padding: 12px 15px; 
                margin-bottom: 10px;
                border-left: 3px solid #5dade2;
            }
            .skill-name { color: #5dade2; font-weight: bold; margin-bottom: 4px; font-size: 15px; }
            .skill-desc { font-size: 13px; color: #aaa; line-height: 1.4; }

            .back-btn-container {
                padding-top: 20px;
                border-top: 1px solid #333;
                margin-top: auto;
            }
            .back-btn {
                width: 100%;
                padding: 12px 20px;
                background: transparent;
                border: 2px solid #555;
                border-radius: 10px;
                color: #888;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-family: 'SF Pro Display', sans-serif;
            }
            .back-btn:hover { 
                border-color: #ffd700; 
                color: #ffd700;
                background: rgba(255, 215, 0, 0.05);
            }
            .back-arrow {
                width: 0; height: 0; 
                border-top: 6px solid transparent; 
                border-bottom: 6px solid transparent;
                border-right: 10px solid currentColor;
            }

            /* Hero Sprite Preview - Fixed Position */
            .hero-sprite-preview {
                position: fixed !important;
                left: 350px !important;
                top: 150px !important;
                width: 400px !important;
                height: 400px !important;
                pointer-events: none;
                z-index: 99998;
            }
            .hero-sprite-canvas {
                width: 400px !important;
                height: 400px !important;
                image-rendering: auto;
            }

            /* Navigation Arrows - Fixed Position */
            .nav-arrow {
                position: fixed !important;
                top: 300px !important;
                width: 60px !important;
                height: 60px !important;
                cursor: pointer;
                pointer-events: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                opacity: 0.8;
            }
            .nav-arrow:hover {
                opacity: 1;
            }
            .nav-arrow.prev {
                left: 250px !important;
            }
            .nav-arrow.next {
                left: 800px !important;
            }
            .nav-arrow img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
            }
            .nav-arrow:hover img {
                filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));
            }
        `;
        this.container.appendChild(style);

        // Add Hero Sprite Preview in Center
        const spriteConfig = this.getSpriteConfig();
        if (spriteConfig) {
            this.createSpritePreview(spriteConfig);
        }

        // Add Navigation Arrows
        if (this.onPrev) {
            const prevArrow = document.createElement('div');
            prevArrow.className = 'nav-arrow prev';
            prevArrow.innerHTML = `<img src="/assets/buttons/previous.png" alt="Previous" />`;
            prevArrow.onclick = () => {
                if (this.onPrev) this.onPrev();
            };
            this.container.appendChild(prevArrow);
        }

        if (this.onNext) {
            const nextArrow = document.createElement('div');
            nextArrow.className = 'nav-arrow next';
            nextArrow.innerHTML = `<img src="/assets/buttons/next.png" alt="Next" />`;
            nextArrow.onclick = () => {
                if (this.onNext) this.onNext();
            };
            this.container.appendChild(nextArrow);
        }

        // Panel
        this.panel = document.createElement('div');
        this.panel.className = 'detail-panel';
        const panel = this.panel;

        // Header
        const header = document.createElement('div');
        header.className = 'header';

        const info = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'hero-title';
        name.textContent = this.heroDef.name;

        const subInfo = document.createElement('div');
        subInfo.className = 'hero-class';
        subInfo.innerHTML = `
            <span class="rarity-badge rarity-${this.heroDef.rarity}">${this.heroDef.rarity}</span>
            <span>${this.heroDef.class}</span>
        `;

        info.appendChild(name);
        info.appendChild(subInfo);
        header.appendChild(info);
        panel.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'content';

        // Stats Section
        const statTitle = document.createElement('div');
        statTitle.className = 'section-title';
        statTitle.textContent = 'Attributes';
        content.appendChild(statTitle);

        const stats = this.heroDef.baseStats;
        this.addStat(content, 'Strength', stats.str);
        this.addStat(content, 'Agility', stats.agi);
        this.addStat(content, 'Intelligence', stats.int);

        // Derived Mock Stats for Visuals
        const estHp = stats.str * 20;
        const estAtk = (stats.str + stats.agi + stats.int) * 2;
        this.addStat(content, 'Est. HP', estHp);
        this.addStat(content, 'Est. Attack', estAtk);

        // Spacer
        content.appendChild(document.createElement('br'));

        // Skills Section (Mockup for now if data missing)
        const skillTitle = document.createElement('div');
        skillTitle.className = 'section-title';
        skillTitle.textContent = 'Abilities';
        content.appendChild(skillTitle);

        if (this.heroDef.skills) {
            // If we had skills structure, loop here. For now, mock based on potential data or default.
            // Assuming we might add skills later.
            this.addSkill(content, 'Normal Attack', 'Deals 100% damage to a single target.', '0s');
        } else {
            const estDmg = (stats.str + stats.agi);
            this.addSkill(content, 'Basic Attack', `Deals ${estDmg} damage to enemy.`, '0s');
            this.addSkill(content, 'Ultimate', `Deals heavy damage to enemies.`, `${this.heroDef.ultCd}s`);
        }

        panel.appendChild(content);

        // Back Button (Inside Panel at Bottom)
        const backBtnContainer = document.createElement('div');
        backBtnContainer.className = 'back-btn-container';
        const backBtn = document.createElement('button');
        backBtn.className = 'back-btn';
        backBtn.innerHTML = '<div class="back-arrow"></div> BACK TO HEROES';
        backBtn.onclick = () => this.animateClose();
        backBtnContainer.appendChild(backBtn);
        panel.appendChild(backBtnContainer);

        this.container.appendChild(panel);
    }

    private createSpritePreview(config: { path: string; frames: number; fps: number }) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'hero-sprite-preview';

        const canvas = document.createElement('canvas');
        canvas.className = 'hero-sprite-canvas';
        canvas.width = 400;
        canvas.height = 400;
        previewContainer.appendChild(canvas);

        this.container.appendChild(previewContainer);

        // Load spritesheet and animate
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Enable smooth scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const frameWidth = 512;
            const frameHeight = 512;
            const totalFrames = config.frames;
            const framesPerRow = Math.floor(img.width / frameWidth);
            const fps = config.fps;
            const frameDuration = 1000 / fps;

            let currentFrame = 0;
            let lastFrameTime = 0;

            const animate = (timestamp: number) => {
                if (!lastFrameTime) lastFrameTime = timestamp;
                const elapsed = timestamp - lastFrameTime;

                if (elapsed >= frameDuration) {
                    // Clear and draw current frame
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const col = currentFrame % framesPerRow;
                    const row = Math.floor(currentFrame / framesPerRow);
                    const sx = col * frameWidth;
                    const sy = row * frameHeight;

                    ctx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, 400, 400);

                    currentFrame = (currentFrame + 1) % totalFrames;
                    lastFrameTime = timestamp;
                }

                this.animationId = requestAnimationFrame(animate);
            };

            this.animationId = requestAnimationFrame(animate);
        };
        img.onerror = () => {
            console.error(`Failed to load spritesheet: ${config.path}`);
        };
        img.src = config.path;
    }

    private addStat(parent: HTMLElement, label: string, value: number) {
        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `
            <span class="stat-label">${label}</span>
            <span class="stat-value">${value}</span>
        `;
        parent.appendChild(row);
    }

    private addSkill(parent: HTMLElement, name: string, desc: string, cd: string) {
        const card = document.createElement('div');
        card.className = 'skill-card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="skill-name">${name}</div>
                <div style="font-size:11px; color:#888;">CD: ${cd}</div>
            </div>
            <div class="skill-desc">${desc}</div>
        `;
        parent.appendChild(card);
    }

    public getElement(): HTMLElement {
        return this.container;
    }
}
