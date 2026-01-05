import { HERO_ASSETS, HeroSpriteConfig } from '../data/HeroAssetsMap';
import { EnemyDefinition, EnemySprite, getEnemyById, getEnemyStatsForLevel, ENEMY_DEFINITIONS } from '../data/EnemyDefinitions';
import { calculateLoot, LootReward } from '../data/LootSystem';

const FPS = 24; // Balanced for smooth animations without lag
const MAX_AP = 10000;

const ANIM_FRAMES: Record<string, number> = {
    idle: 48, skill1: 24, skill2: 30, hit1: 15, dead: 40, dizzy: 40
};

// Enemy animation mapping
const ENEMY_ANIM_MAP: Record<string, string> = {
    idle: 'idle', skill1: 'attack', skill2: 'attack', hit1: 'hit', dead: 'dead', dizzy: 'dizzy'
};

// Map file assets to new Hero IDs
const ASSET_TO_HERO_ID: Record<string, string> = {
    'Antelope Mage': 'oryx_mage',
    'Antelope Ranger': 'sable_ranger',
    'Razor': 'razor_assassin',
    'Razor Left': 'razor_assassin',
    'Bull Mage': 'tauron_mage',
    'Bull Mage Left': 'tauron_mage'
};

const HERO_DATA: Record<string, any> = {
    'oryx_mage': {
        name: "Oryx", title: "The Psy-Horn", role: "Burst Nuke", class: 'Mage', type: 'Intelligence', icon: '/assets/attr/attack.png',
        statLevels: {
            1: { hp: 450, atk: 35, def: 2, speed: 0.8, crit: '5%' },
            100: { hp: 12000, atk: 850, def: 80, speed: 1.0, crit: '15%' },
            250: { hp: 145000, atk: 13000, def: 1200, speed: 1.8, crit: '25%' }
        },
        skills: [
            {
                id: "skill_1",
                name: "Horn Bolt",
                ranks: [
                    { lvl: 1, desc: "150% Dmg, 9s CD" },
                    { lvl: 81, desc: "180% Dmg, Silence 1.5s" },
                    { lvl: 161, desc: "220% Dmg" },
                    { lvl: 221, desc: "Pierce Effect (Hits 2 targets)" }
                ]
            },
            {
                id: "skill_2",
                name: "Astral Leap",
                ranks: [
                    { lvl: 10, desc: "Teleport + 20% Speed, 15s CD" },
                    { lvl: 101, desc: "30% Speed, 12s CD" },
                    { lvl: 181, desc: "10s CD" },
                    { lvl: 241, desc: "Leaves Stun Trap (1.5s)" }
                ]
            },
            {
                id: "passive",
                name: "Static Hooves",
                ranks: [
                    { lvl: 20, desc: "100 Steps = Bounce 2 Targets (80% Dmg)" },
                    { lvl: 121, desc: "80 Steps to Charge" },
                    { lvl: 201, desc: "Bounce 3 Targets (100% Dmg)" }
                ]
            },
            {
                id: "ultimate",
                name: "Nature's Wrath",
                ranks: [
                    { lvl: 40, desc: "400% AOE Dmg, 1.5s Cast" },
                    { lvl: 141, desc: "600% AOE Dmg, 1.0s Cast" },
                    { lvl: 250, desc: "800% AOE Dmg, Instant Cast" }
                ]
            }
        ],
        skillIcons: ['Horn Bolt.png', 'Astral Leap.png', 'Static Hooves.png', "Nature's Wrath.png"]
    },
    'sable_ranger': {
        name: "Sable", title: "The Velocity", role: "Sustained DPS", class: 'Ranger', type: 'Agility', icon: '/assets/attr/boots.png',
        statLevels: {
            1: { hp: 480, atk: 42, def: 4, speed: 0.9, crit: '10%' },
            100: { hp: 13500, atk: 950, def: 120, speed: 1.4, crit: '20%' },
            250: { hp: 165000, atk: 11200, def: 2400, speed: 2.8, crit: '35%' }
        },
        skills: [
            {
                id: "skill_1",
                name: "Wind-Piercer",
                ranks: [
                    { lvl: 1, desc: "140% Dmg, 8s CD" },
                    { lvl: 81, desc: "170% Dmg" },
                    { lvl: 161, desc: "200% Dmg, 7s CD" },
                    { lvl: 221, desc: "+30% Crit Rate" }
                ]
            },
            {
                id: "skill_2",
                name: "Back-Kick Vault",
                ranks: [
                    { lvl: 10, desc: "100% Dmg + Jump Back, 12s CD" },
                    { lvl: 101, desc: "Double Knockback Distance" },
                    { lvl: 181, desc: "9s CD" },
                    { lvl: 241, desc: "Stuns Target for 2.0s" }
                ]
            },
            {
                id: "passive",
                name: "Hunter's Mark",
                ranks: [
                    { lvl: 20, desc: "+3% Dmg per Stack (Max 5)" },
                    { lvl: 121, desc: "+5% Dmg per Stack" },
                    { lvl: 201, desc: "Max 10 Stacks (Total 50% Bonus)" }
                ]
            },
            {
                id: "ultimate",
                name: "Spirit Barrage",
                ranks: [
                    { lvl: 40, desc: "10 Arrows (400% Total Dmg)" },
                    { lvl: 141, desc: "15 Arrows (600% Total Dmg)" },
                    { lvl: 250, desc: "20 Arrows (800% Total Dmg), Auto-Target" }
                ]
            }
        ],
        skillIcons: ['Wind-Piercer.png', 'Back-Kick Vault.png', "Hunter's Mark.png", 'Spirit Barrage.png']
    },
    'razor_assassin': {
        name: "Razor", title: "The Tuskblade", role: "Burst Diver", class: 'Assassin', type: 'Agility', icon: '/assets/attr/atk-speed.png',
        statLevels: {
            1: { hp: 550, atk: 48, def: 5, speed: 0.8, crit: '15%' },
            100: { hp: 15000, atk: 1100, def: 100, speed: 1.1, crit: '30%' },
            250: { hp: 155000, atk: 16500, def: 1800, speed: 2.0, crit: '50%' }
        },
        skills: [
            { name: "Tusk Gore", type: "Active", desc: "Lvl 221: Double Dmg if Bleeding." },
            { name: "Wild Charge", type: "Active", desc: "Charge. Lvl 241: Knock Up (1.5s)." },
            { name: "Blood Scent", type: "Passive", desc: "+Dmg vs Low HP. Lvl 201: Heal on Kill." },
            { name: "Guillotine Breaker", type: "Ultimate", desc: "True Dmg. Lvl 250: Reset on Kill." }
        ],
        skillIcons: ['Tusk Gore.png', 'Wild Charge.png', 'Blood Scent.png', 'Guillotine Breaker.png']
    },
    'tauron_mage': {
        name: "Tauron", title: "The Earthseer", role: "Battle Mage", class: 'Mage', type: 'Intelligence', icon: '/assets/attr/attack.png',
        statLevels: {
            1: { hp: 600, atk: 38, def: 8, speed: 0.7, crit: '5%' },
            100: { hp: 16000, atk: 900, def: 150, speed: 0.9, crit: '12%' },
            250: { hp: 180000, atk: 12000, def: 3000, speed: 1.5, crit: '20%' }
        },
        skills: [
            {
                id: "skill_1",
                name: "Spirit Bolt",
                ranks: [
                    { lvl: 1, desc: "140% Mag Dmg + Knockback" },
                    { lvl: 81, desc: "180% Mag Dmg" },
                    { lvl: 161, desc: "Gain Splash Damage" },
                    { lvl: 221, desc: "Restore 5% MP on hit" }
                ]
            },
            {
                id: "skill_2",
                name: "Ancestral Ward",
                ranks: [
                    { lvl: 10, desc: "AOE Dmg + Slow (3s), 12s CD" },
                    { lvl: 101, desc: "Gain +20% Def Buff (5s)" },
                    { lvl: 181, desc: "8s CD" },
                    { lvl: 241, desc: "Effect changes to Immobilize (2s)" }
                ]
            },
            {
                id: "passive",
                name: "Mystic Hide",
                ranks: [
                    { lvl: 20, desc: "Convert 15% Magic Atk to Phys Def" },
                    { lvl: 121, desc: "Convert 25% Magic Atk to Phys Def" },
                    { lvl: 201, desc: "On Cast: Gain Shield (3s)" }
                ]
            },
            {
                id: "ultimate",
                name: "Stampede of Souls",
                ranks: [
                    { lvl: 40, desc: "400% AOE Dmg + Stun (1.5s)" },
                    { lvl: 141, desc: "600% AOE Dmg" },
                    { lvl: 250, desc: "Leave Burning Ground (5s)" }
                ]
            }
        ],
        skillIcons: ['Spirit Bolt.png', 'Ancestral Ward.png', 'Mystic Hide.png', 'Stampede of Souls.png']
    }
};

// Helper for linear interpolation
function lerp(start: number, end: number, t: number): number { return start * (1 - t) + end * t; }

function getStatsForLevel(heroId: string, level: number) {
    const table = HERO_DATA[heroId]?.statLevels;
    if (!table) return { hp: 1000, atk: 100, def: 10, speed: 1.0, crit: '10%' };

    // Exact match
    if (table[level]) return table[level];

    // Interpolate
    let minLvl = 1, maxLvl = 250;
    if (level < 100) { maxLvl = 100; }
    else { minLvl = 100; }

    const s1 = table[minLvl];
    const s2 = table[maxLvl];
    const t = (level - minLvl) / (maxLvl - minLvl);

    return {
        hp: Math.floor(lerp(s1.hp, s2.hp, t)),
        atk: Math.floor(lerp(s1.atk, s2.atk, t)),
        def: Math.floor(lerp(s1.def, s2.def, t)),
        speed: parseFloat(lerp(s1.speed, s2.speed, t).toFixed(2)),
        crit: s2.crit // Visual string, just take higher tier
    };
}


interface StatusEffect {
    id: string;
    type: 'stun' | 'buff_atk' | 'buff_def' | 'buff_speed' | 'dot' | 'mark' | 'silence' | 'shield' | 'slow' | 'immobilize' | 'burning';
    name: string;
    duration: number; // turns
    value: number; // multiplier or flat value
    icon: string;
}

interface BattleStats {
    damageDealt: number;
    healing: number;
    damageTaken: number;
}

const MELEE_CLASSES = ['Assassin', 'Warrior', 'Paladin', 'Tank'];

interface BattleEntity {
    id: string; name: string; maxHp: number; hp: number; level: number;
    element: HTMLElement; spriteEl: HTMLElement;
    hpBarFill: HTMLElement; apBarFill: HTMLElement; statusContainer: HTMLElement;
    shieldBarFill: HTMLElement; shieldBarTrack: HTMLElement; // Shield bar elements
    baseConfig: HeroSpriteConfig; isDead: boolean;
    cooldowns: { skill1: number; skill2: number; skill3: number; ult: number; };
    currentAnim: string; animFrame: number; animTimestamp: number; animReqId: number | null;
    currentAnimTotalFrames: number; loopAnim: boolean; onAnimComplete?: () => void;
    heroId: string; // 'oryx_mage' etc
    stats: { atk: number, def: number, speed: number, crit: string };
    ap: number;
    effects: StatusEffect[];
    passiveCharges: number; // Mage
    skillIcons: string[];
    isMelee: boolean;
    // Battle stats tracking
    battleStats: BattleStats;
    stars: number; // Added for CP calculation
    enemySpriteConfig?: EnemySprite; // Added for Enemy-specific sprite handling
    skills?: { name: string }[]; // Added for CP calculation
}

export class BattleArenaUI {
    private container: HTMLElement;
    private loadingScreen: HTMLElement | null = null;
    private arenaScreen: HTMLElement | null = null;
    private heroes: BattleEntity[] = [];
    private enemies: BattleEntity[] = [];
    // private onClose: () => void; // Defined in constructor
    private heroTeam: { name: string, level: number, instanceId: string, stars: number, stats?: { hp: number; atk: number; def: number; speed: number; crit: string }, skills?: any[], moveSpeed?: number }[];
    private enemyIds: string[];
    private stageLevel: number;

    // Core Logic
    private battleSpeed = 2;
    private isAuto: boolean = false;
    private isPaused: boolean = false;
    private isAnimatingAction: boolean = false;
    private battleLoopId: number | null = null;
    private lastTick: number = 0;
    private frameCount: number = 0; // For throttling UI updates
    private isBattleStarted = false; // New flag

    // HUD
    private skillBtns: HTMLElement[] = [];
    private speedBtn!: HTMLElement;
    private autoBtn!: HTMLElement;
    private startBtn!: HTMLElement; // New button
    private activeTooltip: HTMLElement | null = null;

    // Repeat Logic
    private isRepeat: boolean = false;
    private repeatBtn!: HTMLElement;
    private resultOverlay: HTMLElement | null = null;

    // Damage Stats UI
    private leftStatsPanel: HTMLElement | null = null;
    private rightStatsPanel: HTMLElement | null = null;

    private static NAME_ALIASES: Record<string, string> = {
        'Oryx': 'Antelope Mage',
        'Sable': 'Antelope Ranger',
        'Razor': 'Razor',
        // Fallbacks for safety
        'Mage': 'Antelope Mage',
        'Ranger': 'Antelope Ranger'
    };

    constructor(
        heroTeam: { name: string, level: number, instanceId: string, stars: number, stats?: { hp: number; atk: number; def: number; speed: number; crit: string }, skills?: any[], moveSpeed?: number }[],
        private onClose: () => void,
        private onBattleEnd: (result: { win: boolean, isAuto: boolean, rewards: LootReward[], finalSpeed: number, survivingHeroes: number }) => void,
        enemyIds: string[], // Changed from single enemyId to list
        stageLevel: number,
        isAuto: boolean,
        mapId: number,
        isFirstClear: boolean,
        initialSpeed: number = 2,
        private onRoundComplete?: (result: { win: boolean, isAuto: boolean, rewards: LootReward[], finalSpeed: number, survivingHeroes: number }) => void
    ) {
        this.heroTeam = heroTeam.map(h => ({
            ...h,
            name: BattleArenaUI.NAME_ALIASES[h.name] || h.name
        }));
        console.log('[BattleArenaUI] Constructor heroTeam:', this.heroTeam);
        this.enemyIds = enemyIds;
        this.stageLevel = stageLevel;
        this.onClose = onClose;
        this.onBattleEnd = onBattleEnd;
        this.isAuto = isAuto; // Set initial state
        this.battleSpeed = initialSpeed; // Set initial speed
        this.mapId = mapId;
        this.isFirstClear = isFirstClear;

        this.container = document.createElement('div');
        this.container.className = 'battle-arena-ui';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #000; z-index: 3000; overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            opacity: 0; transition: opacity 0.5s;
        `;
        document.body.appendChild(this.container);
        this.showLoadingScreen();
    }

    private mapId: number;
    private isFirstClear: boolean;

    private showLoadingScreen() {
        this.loadingScreen = document.createElement('div');
        this.loadingScreen.style.cssText = `position: absolute; inset: 0; background: #0a0a1a; display: flex; justify-content: center; align-items: center; z-index: 10;`;
        this.loadingScreen.innerHTML = `<div style="color:#fbbf24; font-size: 2rem; font-family: 'SF Pro Display';">LOADING BATTLE...</div>`;
        this.container.appendChild(this.loadingScreen);

        // Show container immediately for loading screen
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });

        setTimeout(() => {
            if (this.loadingScreen) {
                const skipBtn = document.createElement('button');
                skipBtn.innerText = "Skip";
                skipBtn.style.cssText = `margin-top:20px; padding:10px; background:transparent; border:1px solid #fff; color:#fff; cursor:pointer;`;
                skipBtn.onclick = () => this.showArena();
                this.loadingScreen.appendChild(skipBtn);
            }
        }, 2000);

        this.preloadAssets().then(() => setTimeout(() => this.showArena(), 500)).catch(() => this.showArena());
    }

    private async preloadAssets() {
        try {
            const assetsToLoad: string[] = [];
            const addAnimPaths = (basePath: string) => {
                if (basePath) {
                    Object.keys(ANIM_FRAMES).forEach(anim => {
                        // OPTIMIZATION: Skip heavy unused assets for battle
                        // dizzy is needed for stun!
                        if (anim === 'showidle' || anim === 'win') return;
                        assetsToLoad.push(basePath.replace('idle', anim));
                    });
                }
            };

            // Preload all heroes
            this.heroTeam.forEach(heroInfo => {
                const name = heroInfo.name;
                const configLeft = HERO_ASSETS.find(h => h.name === `${name} Left`);
                if (configLeft?.sprite2D) {
                    const spritePath = configLeft.sprite2D.spritesheetPath;
                    addAnimPaths(spritePath);
                    const heroId = ASSET_TO_HERO_ID[name] || name;
                    const heroData = HERO_DATA[heroId];
                    if (heroData && heroData.skillIcons) {
                        heroData.skillIcons.forEach((icon: string) => {
                            // Correct path logic: Extract hero folder from spritePath
                            // Structure: .../heroes/HERO_FOLDER/VIEW/file.png
                            // Skills:    .../heroes/HERO_FOLDER/VIEW/skills/icon.png
                            const parts = spritePath.split('/');
                            const viewIndex = parts.findIndex(p => p === 'side-left' || p === 'side-right' || p === 'iso-right');
                            if (viewIndex > 0) {
                                const heroRoot = parts.slice(0, viewIndex).join('/');
                                assetsToLoad.push(`${heroRoot}/skills/${icon}`);
                            } else {
                                // Fallback if view folder logic fails (unlikely given current structure)
                                if (parts.length > 4) assetsToLoad.push(`${parts.slice(0, 4).join('/')}/skills/${icon}`);
                            }
                        });
                    }
                }
            });

            // Preload Enemy Assets
            this.enemyIds.forEach(enemyId => {
                const enemyDef = getEnemyById(enemyId);
                if (enemyDef) {
                    if (enemyDef.icon) assetsToLoad.push(enemyDef.icon);
                    if (enemyDef.sprite && enemyDef.sprite.animations) {
                        Object.entries(enemyDef.sprite.animations).forEach(([key, anim]) => {
                            if (key === 'showidle' || key === 'win') return; // Loop dizzy for enemies too? Yes.
                            if (anim.file) assetsToLoad.push(`${enemyDef.sprite.basePath}${anim.file}`);
                        });
                    }
                }
            });


            // Preload Mock Enemies (Heroes used as enemies)
            const MOCK_ENEMIES = ['Antelope Mage', 'Antelope Ranger', 'Razor'];
            MOCK_ENEMIES.forEach(name => {
                const config = HERO_ASSETS.find(h => h.name === `${name} Left`);
                if (config?.sprite2D) addAnimPaths(config.sprite2D.spritesheetPath);
            });

            // Flatten and Dedup
            const uniqueAssets = Array.from(new Set(assetsToLoad));
            console.log(`[Battle] Preloading ${uniqueAssets.length} assets...`);

            // Batched Loading with Decode
            const loadAll = async () => {
                const BATCH_SIZE = 5;
                for (let i = 0; i < uniqueAssets.length; i += BATCH_SIZE) {
                    const batch = uniqueAssets.slice(i, i + BATCH_SIZE);
                    await Promise.all(batch.map(async (rawSrc) => {
                        const src = encodeURI(rawSrc);
                        const img = new Image();
                        img.src = src;
                        try {
                            await img.decode();
                        } catch (e) {
                            // Fallback to standard load if decode fails
                            await new Promise<void>((resolve) => {
                                if (img.complete) resolve();
                                else {
                                    img.onload = () => resolve();
                                    img.onerror = () => resolve();
                                }
                            });
                        }
                    }));
                }
            };

            // Increase timeout to 30s to ensure everything loads
            // If it takes longer, user waits, but battle will be smooth.
            await Promise.race([loadAll(), new Promise(r => setTimeout(r, 30000))]);
            console.log('[Battle] Assets preloaded (or timed out)');
        } catch (e) { console.error('Asset preload failed', e); }
    }

    private showArena() {
        console.log('[BattleArenaUI] showArena called');
        try {
            if (this.arenaScreen) return;
            if (this.loadingScreen) { this.loadingScreen.remove(); this.loadingScreen = null; }
            this.container.style.opacity = '1';

            this.arenaScreen = document.createElement('div');
            this.arenaScreen.style.cssText = `position: absolute; inset: 0; background: url('/assets/Background/arena2.png') center/cover;`;
            this.arenaScreen.appendChild(Object.assign(document.createElement('div'), { style: `position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4);` }));
            this.container.appendChild(this.arenaScreen);

            const battleContainer = document.createElement('div');
            battleContainer.style.cssText = `position: relative; width: 100%; height: 100%; z-index: 1; pointer-events: none;`;
            // Click listener removed to ensure pass-through
            this.arenaScreen.appendChild(battleContainer);

            // Create Heroes
            this.heroes = [];
            console.log('[BattleArenaUI] Starting Hero Spawn');
            this.heroTeam.forEach((heroInfo, index) => {
                const name = heroInfo.name;
                console.log(`[BattleArenaUI] Attempting to spawn hero: "${name}"`);

                // HEROES (Left Side) -> Use side-left sprites (facing right toward enemies)
                const heroConfig = HERO_ASSETS.find(h => h.name === name);

                if (!heroConfig) console.warn(`[BattleArenaUI] Config not found for "${name}"`);
                if (heroConfig?.sprite2D) {
                    // Use actual level from heroInfo
                    const levelStr = String(heroInfo.level);
                    const stars = heroInfo.stars || 1;
                    // Use stats from heroInfo if provided
                    const hero = this.createBattleEntity('hero', name, levelStr, '#22c55e', heroConfig.sprite2D, stars, heroInfo.stats, heroInfo.skills);

                    // Positioning will be handled after loop or inside via setIsometricPosition
                    // We will defer positioning until all are created or do it here.
                    // Refactor to use setIsometricPosition logic below.

                    battleContainer.appendChild(hero.element);
                    this.playAnim(hero, 'idle');
                    this.heroes.push(hero);
                }
            });

            // 2. Create Enemies (Use real IDs passed from constructor)
            this.enemies = [];
            this.enemyIds.forEach((enemyId, i) => {
                const def = ENEMY_DEFINITIONS.find(e => e.id === enemyId);
                if (def) {
                    // Determine Stars based on type
                    const stars = def.type === 'boss' ? 5 : (def.type === 'elite' ? 3 : 1);

                    // Map Enemy Sprite to HeroSpriteConfig-like structure for createBattleEntity
                    // We'll handle the differences in playAnim
                    const spriteConfig: HeroSpriteConfig = {
                        spritesheetPath: def.sprite.basePath + def.sprite.animations.idle.file,
                        frameWidth: def.sprite.frameSize,
                        frameHeight: def.sprite.frameSize,
                        framesPerRow: def.sprite.animations.idle.framesPerRow,
                        totalFrames: def.sprite.animations.idle.frames,
                        fps: 24
                    };

                    const enemy = this.createBattleEntity(
                        'enemy',
                        def.displayName,
                        String(this.stageLevel),
                        '#ef4444',
                        spriteConfig,
                        stars
                    );

                    // Attach specific enemy sprite config for animations
                    enemy.enemySpriteConfig = { ...def.sprite, icon: def.icon };

                    // Override Stats from EnemyDefinition
                    const stats = getEnemyStatsForLevel(def, this.stageLevel);
                    enemy.maxHp = stats.hp;
                    enemy.hp = stats.hp;
                    enemy.stats.atk = stats.atk;
                    enemy.stats.def = stats.def;
                    enemy.stats.speed = stats.speed;
                    enemy.stats.crit = stats.crit;
                    enemy.battleStats.damageDealt = 0; // Reset
                    // Note: AP/Crit/Speed logic might need refinement if using def.baseStats fully

                    // Positioning
                    // If 1 enemy, put in middle (Slot 2 or 5)
                    // If 2 enemies, slots 1, 2
                    // If 3 enemies, slots 1, 2, 3
                    // Reuse existing slot logic for now, simply 0, 1, 2...
                    const slotIndex = i; // 0, 1, 2
                    this.setIsometricPosition(enemy.element, slotIndex, false);

                    this.enemies.push(enemy);
                    this.arenaScreen?.appendChild(enemy.element);
                    this.playAnim(enemy, 'idle');
                }
            });

            // Isometric Position: Player Side update
            this.heroes.forEach((h, i) => {
                this.setIsometricPosition(h.element, i, true);
            });

            if (this.heroes.length > 0) {
                this.lastTick = performance.now();
                this.battleLoopId = requestAnimationFrame((t) => this.gameLoop(t));
            }

            this.arenaScreen.appendChild(battleContainer);


            // Exit button moved to HUD


            this.arenaScreen.appendChild(document.createElement('style')).textContent = `
            @keyframes floatUpFade { 0% { transform: translate3d(0,0,0); opacity: 0; } 20% { transform: translate3d(0,-20px,0); opacity: 1; } 100% { transform: translate3d(0,-60px,0); opacity: 0; } }
            @keyframes fadeInUp { from { opacity: 0; transform: translate3d(0,10px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
            @keyframes modalFadeIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
            .floating-damage { position: absolute; font-family: 'SF Pro Display'; font-weight: 900; color: #fff; text-shadow: 0 0 5px #000; animation: floatUpFade 1s forwards cubic-bezier(0.2, 0.8, 0.2, 1); z-index: 1000; font-size: 2rem; will-change: transform, opacity; pointer-events: none; }
            .hud-btn { transition: transform 0.1s; cursor: pointer; }
            .hud-btn:active { transform: scale(0.95); }
            .skill-tooltip { position: absolute; bottom: 130px; right: 0; width: 320px; background: rgba(16, 16, 24, 0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; color: #fff; font-family: 'SF Pro Display'; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); backdrop-filter: blur(10px); animation: fadeIn 0.1s; }
            .data-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 420px; max-height: 80vh; background: linear-gradient(180deg, #3d2a1a 0%, #2a1f14 100%); border: 3px solid #8b6914; border-radius: 16px; z-index: 2000; font-family: 'SF Pro Display'; color: #fff; animation: modalFadeIn 0.2s ease-out; overflow: hidden; }
            .data-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 2px solid #8b6914; background: #4a3520; }
            .data-modal-header h2 { margin: 0; font-size: 1.3rem; color: #fbbf24; }
            .data-modal-close { width: 32px; height: 32px; border-radius: 50%; background: #8b6914; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .data-modal-content { padding: 15px; max-height: 55vh; overflow-y: auto; }
            .data-row { display: flex; align-items: center; gap: 12px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 8px; }
            .data-row-avatar { width: 50px; height: 50px; border-radius: 8px; border: 2px solid #8b6914; background: #1a1a1a; overflow: hidden; }
            .data-row-info { flex: 1; }
            .data-row-name { font-weight: bold; color: #fbbf24; font-size: 0.95rem; }
            .data-row-status { font-size: 0.75rem; color: #9ca3af; }
            .data-row-value { font-weight: bold; font-size: 1.2rem; color: #4ade80; }
            .data-row-value.damage { color: #f87171; }
            .data-row-value.healing { color: #4ade80; }
            .data-modal-tabs { display: flex; border-top: 2px solid #8b6914; }
            .data-modal-tab { flex: 1; padding: 12px; text-align: center; background: #3d2a1a; cursor: pointer; font-weight: bold; font-size: 0.85rem; color: #9ca3af; transition: all 0.2s; border: none; }
            .data-modal-tab:hover { background: #4a3520; }
            .data-modal-tab.active { background: #8b6914; color: #fff; }
            .data-btn { position: absolute; top: 30px; left: 30px; width: 50px; height: 50px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 2px solid #8b6914; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; z-index: 100; transition: all 0.2s; }
            .data-btn:hover { background: rgba(139, 105, 20, 0.5); transform: scale(1.1); }
        `;
            this.createHUD(this.arenaScreen);
            this.createDamageStatsOverlay(this.arenaScreen);
            console.log('[BattleArenaUI] showArena completed successfully');
        } catch (e) {
            console.error('[BattleArenaUI] CRITICAL ERROR IN SHOWARENA:', e);
            alert('Error showing battle arena: ' + e);
        }
    }

    private createDamageStatsOverlay(parent: HTMLElement) {
        // Left Panel (Player)
        this.leftStatsPanel = document.createElement('div');
        this.leftStatsPanel.style.cssText = `
            position: absolute; top: 100px; left: 20px; bottom: 120px; width: 280px;
            display: flex; flex-direction: column; gap: 10px; pointer-events: none; z-index: 50;
        `;

        // Header with Total CP
        const leftHeader = document.createElement('div');
        const leftCP = this.calculateTeamCP(this.heroes);
        leftHeader.style.cssText = `
            background: rgba(0,0,0,0.8); color: #fbbf24; border: 1px solid #fbbf24;
            padding: 8px; border-radius: 8px; text-align: center; font-weight: bold;
            font-family: 'SF Pro Display'; 2box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
            display: flex; justify-content: space-between; align-items: center;
        `;
        leftHeader.innerHTML = `<span>HEROES CP</span> <span style="font-size: 1.2rem;">${this.formatNumber(leftCP)}</span>`;
        this.leftStatsPanel.appendChild(leftHeader);

        parent.appendChild(this.leftStatsPanel);

        // Right Panel (Enemy)
        this.rightStatsPanel = document.createElement('div');
        this.rightStatsPanel.style.cssText = `
            position: absolute; top: 100px; right: 20px; bottom: 120px; width: 280px;
            display: flex; flex-direction: column; gap: 10px; pointer-events: none; z-index: 50;
        `;

        // Header with Total CP
        const rightHeader = document.createElement('div');
        const rightCP = this.calculateTeamCP(this.enemies);
        rightHeader.style.cssText = `
            background: rgba(0,0,0,0.8); color: #f87171; border: 1px solid #f87171;
            padding: 8px; border-radius: 8px; text-align: center; font-weight: bold;
            font-family: 'SF Pro Display'; box-shadow: 0 0 10px rgba(248, 113, 113, 0.3);
            display: flex; justify-content: space-between; align-items: center;
        `;
        rightHeader.innerHTML = `<span>ENEMIES CP</span> <span style="font-size: 1.2rem;">${this.formatNumber(rightCP)}</span>`;
        this.rightStatsPanel.appendChild(rightHeader);

        parent.appendChild(this.rightStatsPanel);
    }

    private createStatCard(entity: BattleEntity, side: 'left' | 'right'): HTMLElement {
        const card = document.createElement('div');
        card.className = `stat-card-${entity.id}-${side}`; // Unique class for updates
        card.style.cssText = `
            display: flex; align-items: center; gap: 10px;
            background: rgba(0, 0, 0, 0.6); padding: 8px; border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(4px);
            font-family: 'SF Pro Display'; color: #fff;
            transition: all 0.2s;
        `;

        // Portrait
        const size = 50;
        const portrait = document.createElement('div');
        portrait.style.cssText = `
            width: ${size}px; height: ${size}px; border-radius: 6px;
            background: #333; overflow: hidden; border: 2px solid ${side === 'left' ? '#22c55e' : '#ef4444'};
            flex-shrink: 0;
        `;

        // Logic to extract portrait path (copied/adapted from HeroList.ts)
        let portraitPath = '';
        if (entity.enemySpriteConfig) {
            portraitPath = entity.enemySpriteConfig.icon || '';
        } else if (entity.baseConfig && entity.baseConfig.spritesheetPath) {
            const path = entity.baseConfig.spritesheetPath;
            const heroFolderMatch = path.match(/\/assets\/Character\/heroes\/([^\/]+)/);
            if (heroFolderMatch) {
                const folder = heroFolderMatch[1];
                const pName = folder.replace('_with_animation_spritesheets', '').replace(/_/g, ' ');
                portraitPath = `/assets/Character/heroes/${folder}/portrait/${pName}.jpg`;
            }
        }

        if (portraitPath) {
            portrait.style.backgroundImage = `url('${portraitPath}')`;
            portrait.style.backgroundSize = 'cover';
        } else {
            portrait.innerText = '?';
            portrait.style.display = 'flex';
            portrait.style.justifyContent = 'center';
            portrait.style.alignItems = 'center';
        }

        if (side === 'right') {
            // For enemies, maybe mirror? No, standard is fine.
        }

        const info = document.createElement('div');
        info.style.cssText = `flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden;`;

        const nameRow = document.createElement('div');
        nameRow.style.cssText = `display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: bold;`;
        nameRow.innerHTML = `<span>${entity.name}</span> <span class="dmg-val">0</span>`;
        info.appendChild(nameRow);

        // Damage Bar container
        const barTrack = document.createElement('div');
        barTrack.style.cssText = `width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;`;
        const barFill = document.createElement('div');
        barFill.className = 'dmg-bar-fill';
        barFill.style.cssText = `width: 0%; height: 100%; background: ${side === 'left' ? '#fbbf24' : '#f87171'}; transition: width 0.3s;`;
        barTrack.appendChild(barFill);
        if (entity.skills && entity.skills.length > 0 && side === 'left') {
            const skillRow = document.createElement('div');
            skillRow.className = 'skill-row';
            skillRow.style.cssText = `display: flex; gap: 4px; margin-top: 4px;`;

            // Map common fallback icons if paths are missing
            const tempIcons = ['/assets/icons/skill1.png', '/assets/icons/skill2.png', '/assets/icons/skill3.png', '/assets/icons/ult.png'];

            entity.skills.forEach((skill: any, i) => {
                const iconContainer = document.createElement('div');
                iconContainer.className = `skill-icon-container skill-idx-${i}`;
                iconContainer.style.cssText = `
                    width: 24px; height: 24px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); 
                    background: #222; overflow: hidden; position: relative; cursor: pointer; pointer-events: auto;
                `;

                // Try to find icon path
                let iconPath = '';
                // 1. Check if heroData has explicit skillIcons (from BattleEntity creation)
                if (entity.skillIcons && entity.skillIcons[i]) {
                    // Path logic similar to preloadAssets:
                    if (entity.baseConfig && entity.baseConfig.spritesheetPath) {
                        const path = entity.baseConfig.spritesheetPath;
                        const parts = path.split('/');
                        // Remove filename and view folder to get hero root
                        // e.g. .../heroes/bull_mage_with_animation/side-left/sheet.png -> .../heroes/bull_mage_with_animation/skills/Icon.png
                        // We need to go up 2 levels usually (from side-left/sheet)
                        const viewIndex = parts.findIndex(p => p.includes('side-') || p.includes('iso-'));
                        if (viewIndex > 0) {
                            const heroRoot = parts.slice(0, viewIndex).join('/');
                            iconPath = `${heroRoot}/skills/${entity.skillIcons[i]}`;
                        } else {
                            // Fallback
                            iconPath = tempIcons[i] || '';
                        }
                    }
                } else if (skill.icon && skill.icon.length > 2) {
                    // If skill object has full path or emoji? Emoji length is small. 
                    // Assuming emoji for now if not path
                    iconPath = '';
                }

                if (iconPath) {
                    const img = document.createElement('img');
                    img.src = iconPath;
                    img.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
                    iconContainer.appendChild(img);
                } else {
                    iconContainer.innerText = skill.icon || (i + 1).toString();
                    iconContainer.style.display = 'flex';
                    iconContainer.style.justifyContent = 'center';
                    iconContainer.style.alignItems = 'center';
                    iconContainer.style.fontSize = '12px';
                }

                // Cooldown Overlay
                const cdOverlay = document.createElement('div');
                cdOverlay.className = 'cd-overlay';
                cdOverlay.style.cssText = `
                    position: absolute; inset: 0; background: rgba(0,0,0,0.7); 
                    display: flex; justify-content: center; align-items: center;
                    color: #fff; font-weight: bold; font-size: 10px; opacity: 0; pointer-events: none;
                `;
                iconContainer.appendChild(cdOverlay);

                // Tooltip
                iconContainer.onclick = (e) => {
                    e.stopPropagation();
                    if (this.activeTooltip) this.activeTooltip.remove();

                    const tooltip = document.createElement('div');
                    tooltip.className = 'skill-tooltip';
                    tooltip.style.cssText = `
                        position: fixed; left: ${e.clientX + 10}px; top: ${e.clientY + 10}px;
                        background: rgba(10,10,15,0.95); border: 1px solid #444; border-radius: 8px;
                        padding: 12px; z-index: 5000; max-width: 250px; pointer-events: none;
                        font-family: 'SF Pro Display';
                    `;
                    // Find current rank based on level
                    let currentRank = skill.ranks ? skill.ranks[0] : null;
                    if (skill.ranks) {
                        for (let r = 0; r < skill.ranks.length; r++) {
                            if (skill.ranks[r].unlockLevel <= entity.level) {
                                currentRank = skill.ranks[r];
                            }
                        }
                    }

                    let detailsHtml = '';
                    if (currentRank) {
                        detailsHtml = `
                            <div style="font-size: 0.85rem; color: #ddd; margin-bottom: 8px; line-height: 1.3;">${currentRank.description}</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.75rem; color: #9ca3af; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px;">
                                ${currentRank.damagePercent ? `<div>Dmg: <span style="color:#ef4444; font-weight:bold;">${currentRank.damagePercent}%</span></div>` : ''}
                                ${currentRank.cooldown ? `<div>CD: <span style="color:#fbbf24; font-weight:bold;">${currentRank.cooldown}s</span></div>` : ''}
                                ${currentRank.effect ? `<div style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.1); paddingTop: 4px; marginTop: 2px;">Effect: <span style="color:#60a5fa">${currentRank.effect}</span></div>` : ''}
                            </div>
                        `;
                    } else {
                        detailsHtml = `<div style="font-size: 0.85rem; color: #ccc;">${skill.description || 'No description.'}</div>`;
                    }

                    tooltip.innerHTML = `
                        <div style="color: #fbbf24; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; display:flex; justify-content:space-between; align-items:center;">
                            <span>${skill.name}</span>
                            <span style="font-size: 0.7em; color: #666; font-weight: normal; background: #222; padding: 2px 6px; border-radius: 4px;">Lvl ${entity.level}</span>
                        </div>
                        ${detailsHtml}
                        <div style="font-size: 0.7rem; color: #555; margin-top: 8px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">
                            ${skill.type}
                        </div>
                    `;
                    document.body.appendChild(tooltip);
                    this.activeTooltip = tooltip;

                    // Auto-remove after time or click elsewhere (handled by container click)
                    setTimeout(() => tooltip.remove(), 4000);
                };

                skillRow.appendChild(iconContainer);
            });
            info.appendChild(skillRow);
        }

        // Status Effects Row (Buffs/Debuffs)
        const statusRow = document.createElement('div');
        statusRow.className = 'status-effects-row';
        statusRow.style.cssText = `display: flex; gap: 2px; margin-top: 2px; min-height: 16px; flex-wrap: wrap;`;
        info.appendChild(statusRow);

        card.appendChild(portrait);
        card.appendChild(info);

        return card;
    }

    private updateStatsOverlay() {
        if (!this.leftStatsPanel || !this.rightStatsPanel) return;

        // Calculate max damage for scaling
        let maxDmg = 1;
        [...this.heroes, ...this.enemies].forEach(e => maxDmg = Math.max(maxDmg, e.battleStats.damageDealt));

        const updateSide = (panel: HTMLElement, entities: BattleEntity[], side: 'left' | 'right') => {
            // Sort by damage desc (optional, or keeping slot order? User asked for "column", let's keep slot order for stability or damage for leaderboard feel? Reference image implies slot order usually, but damage meters usually sort. Let's Sort by Damage for utility.)
            // START SIMPLE: Slot order (stable) matches field.

            // Re-render or Update?
            // Fully re-rendering every frame is heavy. Let's update if exists, append if not.
            entities.forEach((entity, index) => {
                let card = panel.children[index + 1] as HTMLElement; // +1 to skip header
                if (!card) {
                    card = this.createStatCard(entity, side);
                    panel.appendChild(card);
                }

                // Update Values
                const valEl = card.querySelector('.dmg-val') as HTMLElement;
                const barEl = card.querySelector('.dmg-bar-fill') as HTMLElement;

                if (valEl) valEl.innerText = this.formatNumber(entity.battleStats.damageDealt);
                if (barEl) {
                    const pct = (entity.battleStats.damageDealt / maxDmg) * 100;
                    barEl.style.width = `${pct}%`;
                }

                // Grey out if dead
                if (entity.isDead) card.style.opacity = '0.5';
                else card.style.opacity = '1';

                // Update Skill Cooldowns
                if (side === 'left' && entity.skills) {
                    const cds = [entity.cooldowns.skill1, entity.cooldowns.skill2, entity.cooldowns.skill3, entity.cooldowns.ult];
                    entity.skills.forEach((_, i) => {
                        const iconContainer = card.querySelector(`.skill-idx-${i}`);
                        if (iconContainer) {
                            const overlay = iconContainer.querySelector('.cd-overlay') as HTMLElement;
                            const cd = cds[i];
                            if (overlay) {
                                if (cd > 0) {
                                    overlay.style.opacity = '1';
                                    overlay.innerText = cd.toString();
                                    (iconContainer as HTMLElement).style.filter = 'grayscale(1)';
                                    (iconContainer as HTMLElement).style.borderColor = '#555';
                                } else {
                                    overlay.style.opacity = '0';
                                    (iconContainer as HTMLElement).style.filter = 'none';
                                    (iconContainer as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                                }
                            }
                        }
                    });
                }

                // Update Status Effects
                const statusRow = card.querySelector('.status-effects-row');
                if (statusRow) {
                    const existingIcons = Array.from(statusRow.children) as HTMLElement[];
                    const currentEffects = (entity.effects || []).map((e, idx) => ({ ...e, tempId: e.id || `${e.type}-${idx}` }));

                    // Remove stale
                    existingIcons.forEach(icon => {
                        const iconId = icon.getAttribute('data-id');
                        if (!currentEffects.find(e => e.tempId === iconId)) icon.remove();
                    });

                    // Add/Update
                    currentEffects.forEach(effect => {
                        let icon = statusRow.querySelector(`[data-id="${effect.tempId}"]`) as HTMLElement;
                        if (!icon) {
                            icon = document.createElement('div');
                            icon.setAttribute('data-id', effect.tempId);
                            icon.style.cssText = `
                                width: 16px; height: 16px; border-radius: 50%;
                                background-size: cover; background-position: center;
                                border: 1px solid rgba(255,255,255,0.8); cursor: pointer; position: relative;
                                pointer-events: auto; flex-shrink: 0;
                            `;
                            // Visuals
                            if (effect.icon) {
                                icon.style.backgroundImage = `url('${effect.icon}')`;
                            } else {
                                switch (effect.type) {
                                    case 'stun': icon.style.background = '#fbbf24'; icon.innerText = '⚡'; break;
                                    case 'buff_atk': icon.style.background = '#ef4444'; icon.innerText = '⚔️'; break;
                                    case 'buff_def': icon.style.background = '#3b82f6'; icon.innerText = '🛡️'; break;
                                    case 'dot': icon.style.background = '#8b5cf6'; icon.innerText = '☠️'; break;
                                    default: icon.style.background = '#666'; icon.innerText = '?'; break;
                                }
                                if (!effect.icon) {
                                    icon.style.display = 'flex'; icon.style.justifyContent = 'center'; icon.style.alignItems = 'center'; icon.style.fontSize = '10px';
                                }
                            }

                            // Tooltip
                            icon.onclick = (e) => {
                                e.stopPropagation();
                                if (this.activeTooltip) this.activeTooltip.remove();
                                const tooltip = document.createElement('div');
                                tooltip.className = 'effect-tooltip';
                                tooltip.style.cssText = `
                                    position: fixed; left: ${e.clientX + 10}px; top: ${e.clientY + 10}px;
                                    background: rgba(10,10,15,0.95); border: 1px solid #444; border-radius: 6px;
                                    padding: 8px; z-index: 5000; min-width: 150px; pointer-events: none;
                                    font-family: 'SF Pro Display'; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                                `;
                                const tColor = effect.type === 'stun' ? '#fbbf24' : '#fff';
                                tooltip.innerHTML = `
                                    <div style="color: ${tColor}; font-weight: bold; font-size: 0.85rem; margin-bottom: 2px;">${effect.name}</div>
                                    <div style="font-size: 0.75rem; color: #ccc;">${effect.type}</div>
                                    <div style="margin-top: 4px; font-size: 0.7rem;">Duration: ${effect.duration}</div>
                                `;
                                document.body.appendChild(tooltip);
                                this.activeTooltip = tooltip;
                                setTimeout(() => tooltip.remove(), 2500);
                            };
                            statusRow.appendChild(icon);
                        }
                    });
                }

            });
        };

        updateSide(this.leftStatsPanel, this.heroes, 'left');
        updateSide(this.rightStatsPanel, this.enemies, 'right');
    }

    private formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }


    private gameLoop(timestamp: number) {
        // Always request next frame at the end, so we guard logic not function
        this.battleLoopId = requestAnimationFrame((t) => this.gameLoop(t));

        if (!this.isBattleStarted || this.isPaused || !this.arenaScreen) return;
        const delta = timestamp - this.lastTick;
        this.lastTick = timestamp;

        this.frameCount++;

        const livingHeroes = this.heroes.filter(h => !h.isDead);
        const livingEnemies = this.enemies.filter(e => !e.isDead);

        if (livingHeroes.length > 0 && livingEnemies.length > 0 && !this.isAnimatingAction) {
            const dt = delta * this.battleSpeed * 0.05;

            livingHeroes.forEach(h => this.tickEntity(h, dt));
            livingEnemies.forEach(e => this.tickEntity(e, dt));

            // Check for turns
            // Merge all likely candidates
            const allUnits = [...livingHeroes, ...livingEnemies];
            const readyUnit = allUnits.find(u => u.ap >= MAX_AP);

            if (readyUnit) {
                const isHero = this.heroes.includes(readyUnit);
                if (isHero) {
                    // Hero attacks enemies in order: slot 1→2→3→4→5→6 (index 0→1→2→3→4→5)
                    if (livingEnemies.length > 0) {
                        // Find the first alive enemy by index order (slot 1 first)
                        const target = this.enemies.find(e => !e.isDead) || livingEnemies[0];
                        this.takeTurn(readyUnit, target);
                    }
                } else {
                    // Enemy attacks heroes in order: slot 1→2→3→4→5→6 (index 0→1→2→3→4→5)
                    if (livingHeroes.length > 0) {
                        // Find the first alive hero by index order (slot 1 first)
                        const target = this.heroes.find(h => !h.isDead) || livingHeroes[0];
                        this.takeTurn(readyUnit, target);
                    }
                }
            }
        }

        // Update Stats Overlay every frame (throttled/efficiently)
        this.updateStatsOverlay();
    }

    private tickEntity(entity: BattleEntity, baseTick: number) {
        const isStunned = entity.effects.some(e => e.type === 'stun');
        if (isStunned) return;

        // Razor Bleed Processing (DoT)
        // We'll process DoT once per second approx
        // Check if 1 second has passed since last DoT tick?
        // Simpler: Just do small ticks or stick to turn-based duration?
        // The duration is in turns. We can tick damage at end of turn (in updateEffects) or continuously?
        // Current architecture uses turns for duration. Real-time is okay too.
        // Actually, let's keep it simple: DoT damage happens in tickEntity periodically
        if (Math.random() < 0.05) { // Occasional tick
            const dots = entity.effects.filter(e => e.type === 'dot' || e.type === 'burning');
            if (dots.length > 0) {
                let dmg = 0;
                dots.forEach(d => {
                    // Bleed: 1% Max HP. Burning: 2% Max HP
                    const tickDmg = d.type === 'burning' ? Math.floor(entity.maxHp * 0.02) : Math.floor(entity.maxHp * 0.01);
                    dmg += tickDmg;
                });
                if (dmg > 0) {
                    entity.hp = Math.max(0, entity.hp - dmg);
                    entity.hpBarFill.style.width = `${(entity.hp / entity.maxHp) * 100}%`;
                    this.showFloatingText(entity.element, `🔥 -${dmg}`, false);
                    if (entity.hp <= 0 && !entity.isDead) this.handleDeath(entity); // Suicide by bleed/burn
                }
            }
        }

        // Mage Passive - Static Hooves
        if (entity.heroId === 'oryx_mage' && entity.passiveCharges < 100) {
            // Lvl 121+: 80 steps to charge. Scale "Steps" so 100 steps ~ 3-4 turns.
            // Reduced rate significantly to prevent instant charging.
            const chargeRate = entity.level >= 121 ? 0.2 : 0.15;
            entity.passiveCharges += (baseTick * chargeRate);
        }

        // ASPD scales with Stats Speed for visuals/AP
        // Stats.speed from user is 1.8 - 2.8. Base game expects ~100-200 range? 
        // User stats: "aspd": 1.8. "mspd": 400.
        // I will map entity.stats.speed used for AP gain to (aspd * 100)
        const aspd = entity.stats.speed || 1.0;
        const gain = baseTick * (aspd * 50); // multiplier to fill 10000

        entity.ap = Math.min(MAX_AP, entity.ap + gain);
        const pct = (entity.ap / MAX_AP) * 100;
        entity.apBarFill.style.width = `${pct}% `;
        entity.apBarFill.style.background = entity.ap >= MAX_AP ? '#ffffff' : '#fbbf24';
    }

    private takeTurn(actor: BattleEntity, target: BattleEntity) {
        // Dummy target Logic: Skip turn
        if (actor.id === 'dummy_target' || actor.name === 'Target Dummy') {
            // Reset AP so it doesn't get stuck in loop
            actor.ap = 0;
            actor.apBarFill.style.width = '0%';
            // Maybe play idle anim to reset state?
            return;
        }

        const isStunned = actor.effects.some(e => e.type === 'stun');
        if (isStunned) {
            this.showFloatingText(actor.element, "STUNNED!", true);
            this.playAnim(actor, 'dizzy', true);
            actor.ap = 0; actor.apBarFill.style.width = '0%';
            this.updateEffects(actor); this.isAnimatingAction = true;
            setTimeout(() => {
                this.isAnimatingAction = false;
                if (!actor.isDead) this.playAnim(actor, 'idle');
            }, 1200 / this.battleSpeed);
            return;
        }

        this.isAnimatingAction = true; actor.ap = 0; actor.apBarFill.style.width = '0%';

        // Passive: Static Hooves Charging
        if (actor.heroId === 'oryx_mage') {
            actor.passiveCharges = (actor.passiveCharges || 0) + 10;
        }

        // Check Silence BEFORE decrementing duration
        const isSilenced = actor.effects.some(e => e.type === 'silence');

        this.updateEffects(actor);

        if (actor.cooldowns.skill1 > 0) actor.cooldowns.skill1--;
        if (actor.cooldowns.skill2 > 0) actor.cooldowns.skill2--;
        if (actor.cooldowns.ult > 0) actor.cooldowns.ult--;

        // If it's the main hero (first one) update HUD, or if we support switching HUDs later
        if (this.heroes.includes(actor) && actor === this.heroes[0]) this.updateHUD();

        const heroData = HERO_DATA[actor.heroId];
        const skills = heroData?.skills || [];

        let animType = 'skill1';
        let damageScale = 1.0;
        let skillName = 'Basic Attack';
        let effectsToApply: StatusEffect[] = [];
        let isMultiHit = false;

        // --- SKILL SELECTION & LOGIC ---
        if (!isSilenced && actor.cooldowns.ult === 0 && Math.random() > 0.6) {
            // ULTIMATE
            animType = 'skill2';
            actor.cooldowns.ult = 5;
            skillName = skills[3]?.name || 'Ultimate';

            if (actor.heroId === 'oryx_mage') {
                // Nature's Wrath
                // Lvl 40: 400% AOE, 1.5s Cast
                // Lvl 141: 600% AOE, 1.0s Cast
                // Lvl 250: 800% AOE, Instant
                damageScale = actor.level >= 250 ? 8.0 : (actor.level >= 141 ? 6.0 : 4.0);
                isMultiHit = false; // It's one big hit, but AOE
            } else if (actor.heroId === 'razor_assassin') {
                // Guillotine Breaker
                damageScale = actor.level >= 141 ? 7.5 : 5.0;
            } else if (actor.heroId === 'sable_ranger') {
                // Spirit Barrage
                isMultiHit = true;
                // Lvl 40: 400% (10 arrows)
                // Lvl 141: 600% (15 arrows)
                // Lvl 250: 800% (20 arrows)
                damageScale = actor.level >= 250 ? 8.0 : (actor.level >= 141 ? 6.0 : 4.0);
            } else if (actor.heroId === 'tauron_mage') {
                // Stampede of Souls
                // Lvl 40: 400% AOE + Stun 1.5s
                // Lvl 141: 600% AOE
                // Lvl 250: Burning Ground 5s
                damageScale = actor.level >= 250 ? 8.0 : (actor.level >= 141 ? 6.0 : 4.0);
                isMultiHit = false;

                // Stun effect
                effectsToApply.push({ id: `stun_${Date.now()}`, type: 'stun', duration: 1, value: 0, name: 'Stampede Stun', icon: '⚡' });

                // Lvl 250: Burning Ground
                if (actor.level >= 250) {
                    effectsToApply.push({ id: `burn_${Date.now()}`, type: 'burning', duration: 5, value: 0.1, name: 'Burning Ground', icon: '🔥' });
                }

                this.showFloatingText(actor.element, "STAMPEDE!", true);
            } else {
                damageScale = 4.0;
            }
        }
        else if (!isSilenced && actor.cooldowns.skill1 === 0 && Math.random() > 0.4) {
            // SKILL 1
            animType = 'skill1';
            actor.cooldowns.skill1 = 3;
            skillName = skills[0]?.name || 'Skill 1';

            if (actor.heroId === 'oryx_mage') {
                // Horn Bolt
                // Lvl 1: 150%, 9s CD (Logic uses turns, ~3 turns)
                // Lvl 81: 180%, Silence
                // Lvl 161: 220%
                // Lvl 221: Pierce (2 targets)
                damageScale = actor.level >= 161 ? 2.2 : (actor.level >= 81 ? 1.8 : 1.5);
                // Dynamic CD: 3 turns for low speed/lvl, 4 turns for high speed
                // Re-tuned: Low level needs 2 turns to match 9s (since turn is ~5s)
                const cdTurns = actor.level >= 161 ? 4 : (actor.level >= 81 ? 3 : 2);
                actor.cooldowns.skill1 = cdTurns;
                if (actor.level >= 81) {
                    effectsToApply.push({ id: `silence_${Date.now()}`, type: 'silence', duration: 1, value: 0, name: 'Silence', icon: '🙊' });
                }
            } else if (actor.heroId === 'razor_assassin') {
                // Tusk Gore
                damageScale = actor.level >= 81 ? 2.0 : 1.6;
                const bleedDuration = actor.level >= 161 ? 5 : 3;
                effectsToApply.push({ id: `bleed_${Date.now()}`, type: 'dot', duration: bleedDuration, value: 0.4, name: 'Bleed', icon: '🩸' });
            } else if (actor.heroId === 'sable_ranger') {
                // Wind Piercer
                // Lvl 1: 140%, 8s CD
                // Lvl 81: 170%
                // Lvl 161: 200%, 7s CD
                // Lvl 221: +30% Crit Rate
                damageScale = actor.level >= 161 ? 2.0 : (actor.level >= 81 ? 1.7 : 1.4);

                // Dynamic CD: 8s/7s
                // 8s (Slow/Base) -> ~2.5 turns. 7s -> ~2 turns.
                // High Speed (2.5s) -> 8s is 3+ turns.
                let cd = actor.level >= 161 ? 3 : 3;
                // Using 3 as base (approx 8s). Higher speeds will cycle faster naturally.
                actor.cooldowns.skill1 = cd;

                if (actor.level >= 221) {
                    // +30% Crit handled in applyDamage via forceCrit logic or temp buff
                    // We can simulate it by ensuring the hit is crit if roll passes 30% check
                }
            } else if (actor.heroId === 'tauron_mage') {
                // Spirit Bolt
                // Lvl 1: 140% + Knockback
                // Lvl 81: 180%
                // Lvl 161: Splash
                // Lvl 221: Restore 5% MP (simulated as heal)
                damageScale = actor.level >= 161 ? 2.0 : (actor.level >= 81 ? 1.8 : 1.4);
                actor.cooldowns.skill1 = 3;

                // Mystic Hide Passive: On Cast gain Shield at Lvl 201
                if (actor.level >= 201) {
                    const shieldAmt = Math.floor(actor.maxHp * 0.1);
                    this.applyStatus(actor, { id: `shield_${Date.now()}`, type: 'shield', duration: 3, value: shieldAmt, name: 'Mystic Shield', icon: '🛡️' });
                }

                // Lvl 221: Restore 5% MP (simulated as 5% HP heal)
                if (actor.level >= 221) {
                    const healAmt = Math.floor(actor.maxHp * 0.05);
                    actor.hp = Math.min(actor.maxHp, actor.hp + healAmt);
                    actor.hpBarFill.style.width = `${(actor.hp / actor.maxHp) * 100}%`;
                    this.showFloatingText(actor.element, `+${healAmt} 💧`, false);
                    actor.battleStats.healing += healAmt;
                }

                // Knockback visual effect on target (applied after damage in targets loop)
                // Set flag to apply knockback
                isMultiHit = actor.level >= 161; // Splash = hit multiple

                this.showFloatingText(actor.element, "Spirit Bolt!", true);
            } else {
                damageScale = 1.4;
            }
        }
        else if (!isSilenced && actor.cooldowns.skill2 === 0 && Math.random() > 0.4) {
            // SKILL 2
            animType = 'skill1';
            skillName = skills[1]?.name || 'Skill 2';

            if (actor.heroId === 'oryx_mage') {
                // Astral Leap
                // Lvl 10: Teleport + 20% Speed, 15s CD
                // Lvl 101: 30% Speed, 12s CD
                // Lvl 181: 10s CD
                // Lvl 241: Stun Trap
                damageScale = 0;
                // Dynamic CD Mapping: 15s/12s/10s -> Turns
                // Slow Turn (5s) -> 3 turns. Fast Turn (2.5s) -> 4-6 turns.
                let cd = 3;
                if (actor.level >= 181) cd = 4; // 10s at high speed
                else if (actor.level >= 101) cd = 4; // 12s
                else cd = 3; // 15s

                actor.cooldowns.skill2 = cd;

                const speedVal = actor.level >= 101 ? 1.3 : 1.2;
                this.applyStatus(actor, { id: `buff_spd_${Date.now()}`, type: 'buff_speed', duration: 2, value: speedVal, name: 'Astral Speed', icon: '⚡' });

                if (actor.level >= 241) {
                    // Stun Trap: Apply Stun to target
                    effectsToApply.push({ id: `stun_${Date.now()}`, type: 'stun', duration: 1, value: 0, name: 'Stun Trap', icon: '⚡' });
                }

                // Visual feedback for Teleport
                this.showFloatingText(actor.element, "Teleport!", true);
            } else if (actor.heroId === 'razor_assassin') {
                // Wild Charge
                actor.cooldowns.skill2 = 4;
                damageScale = 1.2;
                if (actor.level >= 101) {
                    const shieldAmount = Math.floor(actor.maxHp * 0.15);
                    this.applyStatus(actor, { id: `shield_${Date.now()}`, type: 'shield', duration: 3, value: shieldAmount, name: 'Shield', icon: '🛡️' });
                }
                if (actor.level >= 181) actor.cooldowns.skill2 = 3;
                if (actor.level >= 241) effectsToApply.push({ id: `stun_${Date.now()}`, type: 'stun', duration: 1, value: 0, name: 'Knock Up', icon: '⬆️' });
            } else if (actor.heroId === 'sable_ranger') {
                // Back-Kick Vault
                // Lvl 10: 100%, Jump Back, 12s CD
                // Lvl 101: Double Knockback
                // Lvl 181: 9s CD
                // Lvl 241: Stun (2s)

                damageScale = 1.0;
                // CD: 12s -> ~4 turns. 9s -> ~3 turns.
                actor.cooldowns.skill2 = actor.level >= 181 ? 3 : 4;

                if (actor.level >= 241) {
                    // Stun 2s -> ~1 turn
                    effectsToApply.push({ id: `stun_${Date.now()}`, type: 'stun', duration: 1, value: 0, name: 'Stun Kick', icon: '👢' });
                }

                this.showFloatingText(actor.element, "Back-Kick!", true);
            } else if (actor.heroId === 'tauron_mage') {
                // Ancestral Ward
                // Lvl 10: AOE Dmg + Slow 3s, 12s CD
                // Lvl 101: +20% Def Buff 5s
                // Lvl 181: 8s CD
                // Lvl 241: Immobilize 2s instead of Slow

                damageScale = 1.0;
                actor.cooldowns.skill2 = actor.level >= 181 ? 3 : 4;

                // Slow or Immobilize
                if (actor.level >= 241) {
                    effectsToApply.push({ id: `immob_${Date.now()}`, type: 'immobilize', duration: 1, value: 0, name: 'Immobilize', icon: '🔒' });
                } else {
                    effectsToApply.push({ id: `slow_${Date.now()}`, type: 'slow', duration: 2, value: 0.5, name: 'Slowed', icon: '🐢' });
                }

                // Lvl 101: Def Buff
                if (actor.level >= 101) {
                    this.applyStatus(actor, { id: `def_buff_${Date.now()}`, type: 'buff_def', duration: 3, value: 1.2, name: 'Ancestral Def', icon: '🛡️' });
                }

                // Mystic Hide Passive: On Cast gain Shield at Lvl 201
                if (actor.level >= 201) {
                    const shieldAmt = Math.floor(actor.maxHp * 0.1);
                    this.applyStatus(actor, { id: `shield_${Date.now()}`, type: 'shield', duration: 3, value: shieldAmt, name: 'Mystic Shield', icon: '✨' });
                }

                this.showFloatingText(actor.element, "Ancestral Ward!", true);
            } else {
                // Default Skill 2
                actor.cooldowns.skill2 = 4;
                damageScale = 1.0;
            }
        }
        else {
            animType = 'skill1'; damageScale = 1.0;
            skillName = 'Basic Attack';
        }

        if (this.heroes.includes(actor) && actor === this.heroes[0]) this.updateHUD();

        // Animation & Movement Logic
        const performAttackAnim = () => {
            this.playAnim(actor, animType, false, () => {
                if (!actor.isMelee && !actor.isDead) this.playAnim(actor, 'idle');
            });
        };

        if (actor.isMelee) {
            // Dash logic ...
            // (Keeping existing dash logic for non-Oryx melee)
            const actorRect = actor.element.getBoundingClientRect();
            const targetRect = target.element.getBoundingClientRect();
            const deltaX = targetRect.left - actorRect.left;
            const deltaY = targetRect.top - actorRect.top;
            const approachDist = 60;
            const moveX = (Math.max(0, Math.abs(deltaX) - approachDist)) * Math.sign(deltaX);
            const moveY = deltaY;

            actor.element.style.transition = `transform ${250 / this.battleSpeed}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
            actor.element.style.transform = `translate(-50%, -50%) scale(0.9) translate(${moveX}px, ${moveY}px)`;

            setTimeout(() => { performAttackAnim(); }, 250 / this.battleSpeed);
            setTimeout(() => {
                actor.element.style.transition = `transform ${350 / this.battleSpeed}ms ease-out`;
                actor.element.style.transform = `translate(-50%, -50%) scale(0.9)`;
                setTimeout(() => { if (!actor.isDead) this.playAnim(actor, 'idle'); }, 350 / this.battleSpeed);
            }, (250 + 700) / this.battleSpeed);
        } else {
            performAttackAnim();
        }

        // Damage Timing & Execution
        let castTime = 600;
        let isAOE = false;

        // Oryx Nature's Wrath Cast Time
        if (actor.heroId === 'oryx_mage' && skillName === 'Nature\'s Wrath') {
            isAOE = true;
            if (actor.level >= 250) castTime = 250; // Instant
            else if (actor.level >= 141) castTime = 1000;
            else castTime = 1500;
        }

        setTimeout(() => {
            if (actor.isDead) return; // Attacker died mid-cast

            // Resolve Targets
            let targets: BattleEntity[] = [target];
            if (isAOE) {
                // AOE hits all living enemies
                targets = (this.heroes.includes(actor) ? this.enemies : this.heroes).filter(t => !t.isDead);
            } else if (actor.heroId === 'oryx_mage' && skillName === 'Horn Bolt' && actor.level >= 221) {
                // Pierce: Hit Target + 1 Random
                const enemies = (this.heroes.includes(actor) ? this.enemies : this.heroes).filter(t => !t.isDead && t !== target);
                if (enemies.length > 0) {
                    const second = enemies[Math.floor(Math.random() * enemies.length)];
                    targets.push(second);
                }
            }

            // Apply to all valid targets
            targets.forEach(t => {
                if (t.isDead) return;

                // Ranger Skill 1 Crit Bonus Check
                let forceCrit = (actor.heroId === 'sable_ranger' && actor.level >= 221 && skillName.includes('Wind-Piercer'));

                this.applyDamage(t, damageScale, actor, isMultiHit, forceCrit);
                effectsToApply.forEach(e => this.applyStatus(t, { ...e, id: e.id + Math.random() })); // Unique ID for each target

                // Tauron Spirit Bolt knockback
                if (actor.heroId === 'tauron_mage' && skillName === 'Spirit Bolt') {
                    this.applyKnockback(t, this.heroes.includes(actor));
                }

                if (t.hp <= 0) {
                    this.handleDeath(t);
                }
            });

            // Reset animation flag
            if (targets.some(t => t.hp <= 0)) {
                setTimeout(() => { this.isAnimatingAction = false; }, 1500 / this.battleSpeed);
            } else {
                setTimeout(() => { this.isAnimatingAction = false; }, 1200 / this.battleSpeed);
            }

        }, castTime / this.battleSpeed);
    }

    private applyStatus(target: BattleEntity, effect: StatusEffect) {
        target.effects.push(effect);
        this.updateStatusUI(target);
        this.showFloatingText(target.element, effect.icon, false);

        // Play dizzy animation when stun is applied
        if (effect.type === 'stun' && !target.isDead) {
            this.playAnim(target, 'dizzy', true);
        }

        // Update shield bar when shield is applied
        if (effect.type === 'shield') {
            this.updateShieldBar(target);
        }
    }

    private updateShieldBar(entity: BattleEntity) {
        const shields = entity.effects.filter(e => e.type === 'shield');
        const totalShield = shields.reduce((sum, s) => sum + s.value, 0);

        if (totalShield > 0) {
            // Show shield bar and update fill
            entity.shieldBarTrack.style.display = 'block';
            // Shield bar shows shield as % of max HP (capped at 100%)
            const shieldPct = Math.min(100, (totalShield / entity.maxHp) * 100);
            entity.shieldBarFill.style.width = `${shieldPct}%`;
        } else {
            // Hide shield bar
            entity.shieldBarTrack.style.display = 'none';
            entity.shieldBarFill.style.width = '0%';
        }
    }

    private applyKnockback(target: BattleEntity, isPlayer: boolean) {
        // Knockback visual: Push target away briefly then return
        const direction = isPlayer ? 1 : -1; // Push away from attacker
        const knockbackDist = 30;

        target.element.style.transition = 'transform 0.15s ease-out';
        target.element.style.transform = `translateX(${knockbackDist * direction}px)`;

        setTimeout(() => {
            target.element.style.transition = 'transform 0.2s ease-in';
            target.element.style.transform = 'translateX(0)';
        }, 150);

        this.showFloatingText(target.element, "💫 Knockback!", false);
    }

    private updateEffects(entity: BattleEntity) {
        entity.effects.forEach(e => e.duration--);
        const expired = entity.effects.filter(e => e.duration <= 0);
        entity.effects = entity.effects.filter(e => e.duration > 0);
        if (expired.length > 0) {
            this.updateStatusUI(entity);

            // If stun expired and entity is still alive, return to idle animation
            const stunExpired = expired.some(e => e.type === 'stun');
            const stillStunned = entity.effects.some(e => e.type === 'stun');
            if (stunExpired && !stillStunned && !entity.isDead) {
                this.playAnim(entity, 'idle', true);
            }
        }
    }

    private updateStatusUI(entity: BattleEntity) {
        entity.statusContainer.innerHTML = '';

        // Create inner wrapper for icons that can animate/scroll
        const innerWrapper = document.createElement('div');
        innerWrapper.style.cssText = `display: flex; gap: 2px; flex-shrink: 0;`;

        entity.effects.forEach(e => {
            const icon = document.createElement('div');
            icon.innerText = e.icon;
            icon.style.cssText = `font-size: 14px; background: rgba(0, 0, 0, 0.6); padding: 2px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.3); flex-shrink: 0;`;
            innerWrapper.appendChild(icon);
        });

        entity.statusContainer.appendChild(innerWrapper);

        // Check if content overflows and add marquee animation
        // Each icon is approx 22px wide (14px font + 4px padding + 2px border + 2px gap)
        const iconWidth = 22;
        const containerWidth = 100;
        const totalIconsWidth = entity.effects.length * iconWidth;

        if (totalIconsWidth > containerWidth) {
            // Add CSS animation for marquee effect
            const scrollDistance = totalIconsWidth - containerWidth + 10; // Extra padding
            innerWrapper.style.animation = `buffMarquee 1s linear infinite alternate`;

            // Inject keyframes if not already present
            if (!document.getElementById('buff-marquee-style')) {
                const style = document.createElement('style');
                style.id = 'buff-marquee-style';
                style.textContent = `
                @keyframes buffMarquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-100% + 100px)); }
                }
                `;
                document.head.appendChild(style);
            }
        }
    }

    private applyDamage(target: BattleEntity, scale: number, attacker: BattleEntity, isMultiHit: boolean = false, forceCrit: boolean = false) {
        let finalAtk = attacker.stats.atk;
        const atkBuff = attacker.effects.find(e => e.type === 'buff_atk');
        if (atkBuff) finalAtk *= atkBuff.value;

        // Mage Passive - Static Hooves
        if (attacker.heroId === 'oryx_mage') {
            const maxCharges = attacker.level >= 121 ? 80 : 100;
            if ((attacker.passiveCharges || 0) >= maxCharges) {
                attacker.passiveCharges = 0;
                this.showFloatingText(attacker.element, "STATIC DISCHARGE!", true);

                // Bounce Logic
                // Bounce 2 Targets (Main + 1) at Lvl 20
                // Bounce 3 Targets (Main + 2) at Lvl 201
                const numExtras = attacker.level >= 201 ? 2 : 1;
                const bounceDmgScale = (attacker.level >= 201 ? 1.0 : 0.8) * scale;

                const enemies = (this.heroes.includes(attacker) ? this.enemies : this.heroes).filter(t => !t.isDead && t !== target);

                // Hit extra targets
                for (let i = 0; i < numExtras; i++) {
                    if (enemies.length === 0) break;
                    const idx = Math.floor(Math.random() * enemies.length);
                    const bounceTarget = enemies[idx];
                    enemies.splice(idx, 1); // Remove so we don't hit same choice twice

                    // Recursive call - safe because charges are 0 now
                    this.applyDamage(bounceTarget, bounceDmgScale, attacker, false, forceCrit);
                    this.showFloatingText(bounceTarget.element, "Zap!", false);
                }
            }
        }

        // Ranger Passive - Hunter's Mark
        if (attacker.heroId === 'sable_ranger') {
            const marks = target.effects.filter(e => e.type === 'mark').length;
            if (marks > 0) {
                // Lvl 20: 3%. Lvl 121: 5%.
                const perStack = attacker.level >= 121 ? 0.05 : 0.03;

                // Lvl 201: Max 10 stacks. Else 5.
                const maxStacks = attacker.level >= 201 ? 10 : 5;
                const effectiveStacks = Math.min(marks, maxStacks);

                const boost = 1 + (effectiveStacks * perStack);
                finalAtk *= boost;

                this.showFloatingText(attacker.element, `Mark Dmg +${Math.round((boost - 1) * 100)}%`, false);
            }

            // Apply new stack
            let maxMarks = attacker.level >= 201 ? 10 : 5;
            if (marks < maxMarks) {
                // Duration matches "permanent until dead" or long enough?
                // Standard turns for Mark usually 3-5. Let's make it 5 to allow stacking.
                this.applyStatus(target, { id: `mark_${Date.now()}`, type: 'mark', name: 'Mark', duration: 5, value: 0, icon: '🎯' });
            }
        }

        // Razor Passive - Blood Scent
        if (attacker.heroId === 'razor_assassin' && attacker.level >= 20) {
            const threshold = attacker.level >= 121 ? 0.6 : 0.5;
            if ((target.hp / target.maxHp) < threshold) {
                finalAtk *= 1.2; // +20% Dmg
                this.showFloatingText(attacker.element, "BLOOD SCENT!", true);
            }
        }

        // Razor Skill 1: Double Damage if Bleeding
        if (attacker.heroId === 'razor_assassin' && attacker.level >= 221) {
            const isBleeding = target.effects.some(e => e.type === 'dot' && e.name === 'Bleed');
            if (isBleeding) {
                scale *= 2.0;
                this.showFloatingText(attacker.element, "GORE!", true);
            }
        }

        // Razor Ult: True Damage (Heuristic check)
        const isTrueDamage = (attacker.heroId === 'razor_assassin' && scale >= 5.0 && attacker.cooldowns.ult >= 4);

        let finalDef = target.stats.def;
        const defBuff = target.effects.find(e => e.type === 'buff_def');
        if (defBuff) finalDef *= defBuff.value;

        // Tauron Passive - Mystic Hide: Convert ATK to DEF
        if (target.heroId === 'tauron_mage' && target.level >= 20) {
            // Lvl 20: 15%. Lvl 121: 25%.
            const conversionRate = target.level >= 121 ? 0.25 : 0.15;
            const bonusDef = Math.floor(target.stats.atk * conversionRate);
            finalDef += bonusDef;
        }

        let mitigationMult = 10000 / (10000 + finalDef);
        if (isTrueDamage) mitigationMult = 1.0; // Ignore armor

        const rawDmg = finalAtk * scale;
        const damage = Math.floor(rawDmg * mitigationMult);

        const critChance = (parseInt(attacker.stats.crit) / 100);
        const isCrit = forceCrit || (Math.random() < critChance);
        let finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;

        // --- Shield Mitigation ---
        const shields = target.effects.filter(e => e.type === 'shield');
        if (shields.length > 0) {
            let absorb = 0;
            shields.forEach(s => {
                if (finalDamage > 0 && s.value > 0) {
                    const taken = Math.min(finalDamage, s.value);
                    s.value -= taken;
                    finalDamage -= taken;
                    absorb += taken;
                }
            });
            // Cleanup empty shields
            target.effects = target.effects.filter(e => e.type !== 'shield' || e.value > 0);
            this.updateStatusUI(target);
            this.updateShieldBar(target); // Update shield bar visual
            if (absorb > 0) this.showFloatingText(target.element, `🛡️ Absorbed(${absorb})`, false);
        }

        target.hp = Math.max(0, target.hp - finalDamage);
        target.hpBarFill.style.width = `${(target.hp / target.maxHp) * 100}% `;

        if (target.hp > 0) this.playAnim(target, 'hit1', false, () => this.playAnim(target, 'idle'));

        if (isMultiHit) {
            this.showFloatingText(target.element, `- ${finalDamage} (x20)`, isCrit);
        } else {
            this.showFloatingText(target.element, `- ${finalDamage}${isCrit ? '!' : ''} `, isCrit);
        }

        // Track battle stats
        attacker.battleStats.damageDealt += finalDamage;
        target.battleStats.damageTaken += finalDamage;
    }

    private handleDeath(target: BattleEntity) {
        this.playAnim(target, 'dead', false);
        target.isDead = true;

        const anyHeroAlive = this.heroes.some(h => !h.isDead);
        const anyEnemyAlive = this.enemies.some(e => !e.isDead);

        if (!anyHeroAlive) {
            this.showBattleResult(false);
        } else if (!anyEnemyAlive) {
            this.showBattleResult(true);
        }

        // Razor On-Kill Logic (Attacker is who?)
        // Heuristic: If target died, find who might have killed them?
        // In this async flow it's hard to track exact killer without passing context.
        // We'll skip complex kill-credit logic for now or just check living Razors.
        const potentialRazors = (this.heroes.includes(target) ? this.enemies : this.heroes).filter(u => u.heroId === 'razor_assassin' && !u.isDead);
        potentialRazors.forEach(killer => {
            // Simplification: All Razors heal when someone dies? Or just assume one of them got it?
            // Let's just make it "Blood Scent" triggers for all Razors on death
            if (killer.level >= 201) {
                const healAmt = Math.floor(killer.maxHp * 0.2);
                killer.hp = Math.min(killer.maxHp, killer.hp + healAmt);
                killer.hpBarFill.style.width = `${(killer.hp / killer.maxHp) * 100}% `;
                this.showFloatingText(killer.element, `+ ${healAmt} `, false);
                killer.battleStats.healing += healAmt;
            }
            if (killer.level >= 250) {
                killer.cooldowns.ult = 0;
            }
        });
    }

    private playAnim(entity: BattleEntity, animName: string, loop: boolean = true, onComplete?: () => void) {
        if (entity.isDead && animName !== 'dead') return;

        if (entity.animReqId) { cancelAnimationFrame(entity.animReqId); entity.animReqId = null; }

        let animFile = '';
        let totalFrames = 0;
        let framesPerRow = 0;
        let spriteSize = 400; // Default for heroes
        let mappedAnimName = animName; // Use this for comparison

        if (entity.enemySpriteConfig) {
            // ENEMY ANIMATION MAPPING
            mappedAnimName = ENEMY_ANIM_MAP[animName] || 'idle';
            // @ts-ignore - dynamic access
            const config = entity.enemySpriteConfig.animations[mappedAnimName];
            if (config) {
                animFile = entity.enemySpriteConfig.basePath + config.file;
                totalFrames = config.frames;
                framesPerRow = config.framesPerRow;
                spriteSize = entity.enemySpriteConfig.frameSize;
            } else {
                // Fallback: dizzy -> hit -> idle
                let fallbackAnim = entity.enemySpriteConfig.animations.hit;
                if (!fallbackAnim) fallbackAnim = entity.enemySpriteConfig.animations.idle;
                animFile = entity.enemySpriteConfig.basePath + fallbackAnim.file;
                totalFrames = fallbackAnim.frames;
                framesPerRow = fallbackAnim.framesPerRow;
                spriteSize = entity.enemySpriteConfig.frameSize;
                mappedAnimName = fallbackAnim === entity.enemySpriteConfig.animations.idle ? 'idle' : 'hit';
            }
        } else {
            // HERO ANIMATION MAPPING
            // ... (Existing logic)
            animFile = entity.baseConfig.spritesheetPath.replace('idle', animName); // Default

            // Priority: 1. Specific overwrite in baseConfig, 2. Global constant, 3. Total frames
            if (entity.baseConfig.animations && entity.baseConfig.animations[animName]) {
                totalFrames = entity.baseConfig.animations[animName].frames;
            } else {
                totalFrames = ANIM_FRAMES[animName] || entity.baseConfig.totalFrames;
            }

            framesPerRow = entity.baseConfig.framesPerRow;
            spriteSize = entity.baseConfig.frameWidth;
            mappedAnimName = animName;
        }

        const newPath = animFile;

        // Preload the new sprite to prevent blinking
        const preloadAndPlay = () => {
            entity.currentAnim = mappedAnimName;
            entity.spriteEl.style.backgroundImage = `url('${newPath}')`;
            entity.spriteEl.style.backgroundPosition = '0 0';
            entity.currentAnimTotalFrames = totalFrames;
            entity.loopAnim = loop;
            entity.onAnimComplete = onComplete;
            entity.animFrame = 0;

            // Update sizing if frame size differs (Enemies might)
            if (entity.enemySpriteConfig) {
                entity.spriteEl.style.width = `${spriteSize}px`;
                entity.spriteEl.style.height = `${spriteSize}px`;
                entity.spriteEl.style.backgroundSize = `${framesPerRow * spriteSize}px auto`;
            } else {
                // Hero default 512
                entity.spriteEl.style.width = `${spriteSize}px`;
                entity.spriteEl.style.height = `${spriteSize}px`;
                entity.spriteEl.style.backgroundSize = `${framesPerRow * spriteSize}px auto`;
            }

            this.runAnimationLoop(entity, animName, loop);
        };

        // Check if already using this animation (check against mapped name for enemies)
        if (entity.currentAnim === mappedAnimName) {
            preloadAndPlay();
            return;
        }

        // Preload the new sprite image
        const img = new Image();
        img.onload = preloadAndPlay;
        img.onerror = preloadAndPlay; // Still play even if load fails
        img.src = encodeURI(newPath);

        // Fallback: if image takes too long, just play anyway
        setTimeout(() => {
            if (entity.currentAnim !== mappedAnimName) {
                preloadAndPlay();
            }
        }, 50);
    }

    private runAnimationLoop(entity: BattleEntity, type: string, loop: boolean) {
        // Determine correct sprite size based on entity config
        let spriteSize = 400; // Default fallback
        if (entity.enemySpriteConfig) {
            spriteSize = entity.enemySpriteConfig.frameSize;
        } else if (entity.baseConfig) {
            spriteSize = entity.baseConfig.frameWidth;
        }

        const isIdle = type === 'idle';

        // For idle: Use sine-wave breathing loop (smooth 0→1→0)
        // For other animations: Use linear frame stepping
        if (isIdle && loop) {
            // Sine-Wave Breathing Loop - throttled to only update on frame change
            const totalFrames = entity.currentAnimTotalFrames;
            const cycleDuration = 2000; // 2 seconds for a complete in+out breath
            const startTime = performance.now();
            let lastFrameIndex = -1;

            const breathingLoop = () => {
                if (entity.currentAnim !== 'idle') return; // Animation changed

                const elapsed = performance.now() - startTime;
                const progress = (elapsed % cycleDuration) / cycleDuration; // 0 -> 1 normalized

                // Linear Ping-Pong (Triangle Wave) for constant speed
                let easedProgress = 0;
                if (progress <= 0.5) {
                    easedProgress = progress * 2; // 0 -> 1
                } else {
                    easedProgress = 2 - (progress * 2); // 1 -> 0
                }

                // Map to frame index
                const frameIndex = Math.floor(easedProgress * (totalFrames - 1));

                // Only update DOM if frame changed
                if (frameIndex !== lastFrameIndex) {
                    lastFrameIndex = frameIndex;
                    const col = frameIndex % entity.baseConfig.framesPerRow;
                    const row = Math.floor(frameIndex / entity.baseConfig.framesPerRow);
                    entity.spriteEl.style.backgroundPosition = `-${col * spriteSize}px -${row * spriteSize}px`;
                }

                entity.animReqId = requestAnimationFrame(breathingLoop);
            };
            entity.animReqId = requestAnimationFrame(breathingLoop);
        } else {
            // Standard linear animation
            entity.animTimestamp = 0;
            const frameInterval = 1000 / (FPS * this.battleSpeed);

            const loopFn = (timestamp: number) => {
                if (!entity.animTimestamp) entity.animTimestamp = timestamp;

                if (timestamp - entity.animTimestamp >= frameInterval) {
                    entity.animTimestamp = timestamp;
                    entity.animFrame++;

                    if (entity.animFrame >= entity.currentAnimTotalFrames) {
                        if (entity.loopAnim) {
                            entity.animFrame = 0;
                        } else {
                            entity.animFrame = entity.currentAnimTotalFrames - 1;
                            if (entity.onAnimComplete) entity.onAnimComplete();
                            return;
                        }
                    }

                    const col = entity.animFrame % entity.baseConfig.framesPerRow;
                    const row = Math.floor(entity.animFrame / entity.baseConfig.framesPerRow);
                    entity.spriteEl.style.backgroundPosition = `-${col * spriteSize}px -${row * spriteSize}px`;
                }

                entity.animReqId = requestAnimationFrame(loopFn);
            };
            entity.animReqId = requestAnimationFrame(loopFn);
        }
    }
    private showFloatingText(targetEl: HTMLElement, text: string, isCrit: boolean) {
        const el = document.createElement('div');
        el.className = 'floating-damage';
        el.innerText = text;

        // Red damage color with dark stroke outline like reference
        el.style.cssText = `
                position: absolute;
                font - family: 'SF Pro Display', sans - serif;
                font - weight: 900;
                font - size: ${isCrit ? '2.5rem' : '1.8rem'};
                color: ${isCrit ? '#fbbf24' : '#ef4444'};
                -webkit - text - stroke: 3px #000;
                paint - order: stroke fill;
                text - shadow: 2px 2px 0 #000, -2px - 2px 0 #000, 2px - 2px 0 #000, -2px 2px 0 #000, 0 3px 0 #000;
                animation: floatUpFade 0.8s forwards cubic - bezier(0.2, 0.8, 0.2, 1);
                z - index: 1000;
                will - change: transform, opacity;
                pointer - events: none;
                `;

        if (isCrit) {
            el.style.textShadow = '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 15px rgba(251, 191, 36, 0.8)';
        }

        const randomX = (Math.random() - 0.5) * 50;
        el.style.left = `calc(50 % + ${randomX}px)`;
        el.style.top = '80px';
        targetEl.appendChild(el);
        setTimeout(() => el.remove(), 1000 / this.battleSpeed);
    }


    private createHUD(c: HTMLElement) {
        if (this.heroes.length === 0) return;
        const h = document.createElement('div');
        // HUD Container - Flex row for controls
        h.style.cssText = `
                position: absolute; bottom: 40px; right: 40px;
                display: flex; gap: 15px; align - items: center;
                z - index: 10000;
                background: rgba(0, 0, 0, 0.5); padding: 15px;
                border - radius: 25px; border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop - filter: blur(5px);
                `;

        // Start Button (Now inside HUD, Left aligned relative to Auto)
        this.createStartButton(h);

        // Auto Button
        this.createAutoButton(h);

        // Speed Button
        this.createSpeedButton(h);

        // Repeat Button
        this.createRepeatButton(h);

        // Exit Button
        this.createExitButton(h);

        c.appendChild(h);
        this.updateHUD();
    }

    private createRepeatButton(c: HTMLElement) {
        this.repeatBtn = document.createElement('div');
        this.repeatBtn.className = 'hud-btn';
        this.repeatBtn.style.cssText = `
                width: 50px; height: 50px; border-radius: 50%;
                background: rgba(0, 0, 0, 0.6); border: 2px solid #fff; color: #fff;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                font-weight: bold; font-family: 'SF Pro Display', sans-serif; font-size: 0.7rem;
                cursor: pointer; transition: all 0.2s; pointer-events: auto;
                `;

        const icon = document.createElement('div');
        icon.innerText = '🔁';
        icon.style.fontSize = '1.2rem';
        icon.style.lineHeight = '1';
        this.repeatBtn.appendChild(icon);

        const text = document.createElement('div');
        text.innerText = 'REPEAT';
        text.style.marginTop = '2px';
        this.repeatBtn.appendChild(text);

        this.repeatBtn.onclick = () => this.toggleRepeat();
        c.appendChild(this.repeatBtn);
    }

    private createExitButton(c: HTMLElement) {
        const btn = document.createElement('div');
        btn.className = 'hud-btn';
        btn.style.cssText = `
                width: 50px; height: 50px; border-radius: 50%;
                background: rgba(0, 0, 0, 0.6); border: 2px solid #fff; color: #fff;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                font-weight: bold; font-family: 'SF Pro Display', sans-serif; font-size: 0.7rem;
                cursor: pointer; transition: all 0.2s; pointer-events: auto;
                `;

        const icon = document.createElement('div');
        icon.innerText = '✕';
        icon.style.fontSize = '1.2rem';
        icon.style.lineHeight = '1';
        btn.appendChild(icon);

        const text = document.createElement('div');
        text.innerText = 'EXIT';
        text.style.marginTop = '2px';
        btn.appendChild(text);

        btn.onclick = () => this.showAbandonConfirmation();
        c.appendChild(btn);
    }

    private createStartButton(c: HTMLElement) {
        this.startBtn = document.createElement('button');
        // Simple Text Start Button to ensure no SVG issues
        this.startBtn.innerText = 'PLAY';
        this.startBtn.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            display: flex; justify-content: center; align-items: center;
            color: #fff; border: 2px solid #fff;
            background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            cursor: pointer; transition: all 0.2s;
            font-weight: 900; font-family: 'SF Pro Display', sans-serif; font-size: 0.8rem; pointer-events: auto;
        `;

        // Hover effect
        this.startBtn.onmouseenter = () => { this.startBtn.style.transform = 'scale(1.1)'; };
        this.startBtn.onmouseleave = () => { this.startBtn.style.transform = 'scale(1)'; };

        this.startBtn.onclick = () => {
            this.startBattle();
        };

        c.appendChild(this.startBtn);
    }

    private startBattle() {
        if (this.isBattleStarted) return;
        this.isBattleStarted = true;

        // click sound if available

        // Hide button
        if (this.startBtn) {
            this.startBtn.style.display = 'none';
        }
    }

    private toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        if (this.repeatBtn) {
            if (this.isRepeat) {
                this.repeatBtn.style.background = 'rgba(255, 215, 0, 0.8)';
                this.repeatBtn.style.color = '#000';
                this.repeatBtn.style.borderColor = '#ffd700';
            } else {
                this.repeatBtn.style.background = 'rgba(0,0,0,0.6)';
                this.repeatBtn.style.color = '#fff';
                this.repeatBtn.style.borderColor = '#fff';
            }
        }
    }

    private createAutoButton(c: HTMLElement) {
        this.autoBtn = document.createElement('div');
        this.autoBtn.className = 'hud-btn';
        // Relative positioning for flex layout
        this.autoBtn.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: rgba(0,0,0,0.6); border: 2px solid #fff; color: #fff;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            font-weight: bold; font-family: 'SF Pro Display', sans-serif; font-size: 0.7rem;
            cursor: pointer; transition: all 0.2s; pointer-events: auto;
        `;

        const icon = document.createElement('div');
        icon.innerText = '↺';
        icon.style.fontSize = '1.2rem';
        icon.style.lineHeight = '1';
        this.autoBtn.appendChild(icon);

        const text = document.createElement('div');
        text.innerText = 'AUTO';
        text.style.marginTop = '2px';
        this.autoBtn.appendChild(text);

        this.autoBtn.onclick = () => this.toggleAuto();
        c.appendChild(this.autoBtn);

        // Init visual state
        if (this.isAuto) {
            this.autoBtn.style.background = 'rgba(255, 215, 0, 0.8)';
            this.autoBtn.style.color = '#000';
            this.autoBtn.style.borderColor = '#ffd700';

            // Auto-Start Battle if enabled initially
            // Use setTimeout to allow UI to render first
            setTimeout(() => {
                if (!this.isBattleStarted) this.startBattle();
            }, 500);
        }
    }

    private toggleAuto() {
        this.isAuto = !this.isAuto;
        if (this.autoBtn) {
            if (this.isAuto) {
                this.autoBtn.style.background = 'rgba(255, 215, 0, 0.8)'; // Gold
                this.autoBtn.style.color = '#000';
                this.autoBtn.style.borderColor = '#ffd700';
            } else {
                this.autoBtn.style.background = 'rgba(0,0,0,0.6)';
                this.autoBtn.style.color = '#fff';
                this.autoBtn.style.borderColor = '#fff';
            }
        }

        // Auto-Trigger: Start battle if not started
        if (this.isAuto) {
            if (!this.isBattleStarted) this.startBattle();
            // Ensure Play button is hidden effectively immediately
            if (this.startBtn) this.startBtn.style.display = 'none';
        }
    }

    private createSpeedButton(c: HTMLElement) {
        this.speedBtn = document.createElement('div');
        this.speedBtn.className = 'hud-btn';
        // Relative positioning for flex layout
        this.speedBtn.style.cssText = `
            width: 50px; height: 50px; border-radius: 50%;
            background: rgba(0,0,0,0.6); border: 2px solid #fff; color: #fff;
            display: flex; justify-content: center; align-items: center;
            font-weight: bold; font-family: 'SF Pro Display', sans-serif; font-size: 1.0rem;
            cursor: pointer; transition: all 0.2s; pointer-events: auto;
        `;
        this.speedBtn.innerText = `${this.battleSpeed}x`;
        this.speedBtn.onclick = () => this.toggleSpeed();
        c.appendChild(this.speedBtn);
    }


    private toggleSpeed() { this.battleSpeed = this.battleSpeed === 2 ? 3 : 2; if (this.speedBtn) this.speedBtn.innerText = `${this.battleSpeed}x`; }
    private updateHUD() { if (this.heroes.length === 0) return; const hero = this.heroes[0]; const u = (i: number, v: number) => { if (this.skillBtns[i]) { const o = this.skillBtns[i].querySelector('.cd-overlay') as HTMLElement; const w = this.skillBtns[i]; if (v > 0) { o.style.opacity = '1'; o.innerText = v.toString(); w.style.filter = 'grayscale(1)'; } else { o.style.opacity = '0'; w.style.filter = 'none'; } } }; u(0, hero.cooldowns.skill1); u(1, hero.cooldowns.skill2); u(2, hero.cooldowns.skill3); u(3, hero.cooldowns.ult); }

    private createBattleEntity(id: string, assetName: string, level: string, _color: string, spriteConfig: HeroSpriteConfig, stars: number = 1, providedStats?: { hp: number; atk: number; def: number; speed: number; crit: string }, providedSkills?: any[]): BattleEntity {
        let name = assetName;
        let data: any = { type: 'Strength', class: 'Warrior', skillIcons: [] };
        let heroId = 'oryx_mage';

        if (id === 'hero') {
            heroId = ASSET_TO_HERO_ID[assetName] || 'oryx_mage';
            data = HERO_DATA[heroId];
            name = data.name;
        }

        const isMelee = MELEE_CLASSES.includes(data.class);

        const container = document.createElement('div'); container.style.cssText = `display: flex; flex-direction: column; align-items: center; position: relative; z-index: 10; pointer-events: none;`;
        const overheadUI = document.createElement('div');
        overheadUI.style.cssText = `display: flex; align-items: center; gap: 8px; margin-bottom: -150px; z-index: 20; pointer-events: none; padding-bottom: 20px;`;
        if (id === 'enemy') {
            overheadUI.style.marginRight = '130px'; // Shift left relative to center
        }

        const levelText = document.createElement('div'); levelText.innerText = level;
        levelText.style.cssText = `color: #fff; font-size: 1.2rem; font-weight: 900; line-height: 1; text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; font-family: 'SF Pro Display';`;
        overheadUI.appendChild(levelText);

        // Determine attribute icon based on hero type
        let attrIconPath = '/assets/attr/attribute/str.svg'; // Default Strength
        let attrBgColor = '#dc2626'; // Red
        if (data.type === 'Agility') {
            attrIconPath = '/assets/attr/attribute/agi.svg';
            attrBgColor = '#16a34a'; // Green
        } else if (data.type === 'Intelligence') {
            attrIconPath = '/assets/attr/attribute/int.svg';
            attrBgColor = '#2563eb'; // Blue
        }

        const elementIcon = document.createElement('div');
        elementIcon.style.cssText = `width: 28px; height: 28px; background: ${attrBgColor}; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.5);`;
        const iconImg = document.createElement('img');
        iconImg.src = attrIconPath;
        iconImg.style.cssText = `width: 16px; height: 16px; filter: brightness(0) invert(1);`;
        elementIcon.appendChild(iconImg);
        overheadUI.appendChild(elementIcon);

        const barsContainer = document.createElement('div'); barsContainer.style.cssText = `display: flex; flex-direction: column; gap: 0; position:relative;`;
        const statusContainer = document.createElement('div');
        statusContainer.style.cssText = `position: absolute; bottom: 100%; left: 0; width: 100px; max-width: 100px; display: flex; gap: 2px; margin-bottom: 2px; overflow: hidden;`;
        barsContainer.appendChild(statusContainer);

        // Shield Bar - Above HP bar (initially hidden)
        const shieldBarTrack = document.createElement('div');
        shieldBarTrack.style.cssText = `width: 100px; height: 6px; background: linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%); border: 1px solid #3b82f6; border-radius: 3px; position: relative; overflow: hidden; margin-bottom: 2px; display: none;`;
        const shieldBarFill = document.createElement('div');
        shieldBarFill.style.cssText = `width: 0%; height: 100%; background: linear-gradient(180deg, #93c5fd 0%, #3b82f6 50%, #1d4ed8 100%); transition: width 0.2s ease-out;`;
        shieldBarTrack.appendChild(shieldBarFill);
        barsContainer.appendChild(shieldBarTrack);

        // HP Bar - Main health bar with rounded top corners
        const hpBarTrack = document.createElement('div'); hpBarTrack.style.cssText = `width: 100px; height: 14px; background: linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%); border: 2px solid #333; border-bottom: none; border-radius: 7px 7px 0 0; position: relative; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);`;
        const hpBarFill = document.createElement('div'); hpBarFill.style.cssText = `width: 100%; height: 100%; background: ${id === 'enemy' ? 'linear-gradient(180deg, #f87171 0%, #dc2626 50%, #b91c1c 100%)' : 'linear-gradient(180deg, #86efac 0%, #22c55e 50%, #15803d 100%)'}; transition: width 0.2s ease-out;`;
        hpBarTrack.appendChild(hpBarFill); barsContainer.appendChild(hpBarTrack);

        // AP Bar - Cooldown/action bar with rounded bottom corners, attached to HP bar
        const apBarTrack = document.createElement('div'); apBarTrack.style.cssText = `width: 100px; height: 8px; background: linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%); border: 2px solid #333; border-top: 1px solid #222; border-radius: 0 0 7px 7px; position: relative; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);`;
        const apBarFill = document.createElement('div'); apBarFill.style.cssText = `width: 0%; height: 100%; background: linear-gradient(180deg, #fcd34d 0%, #fbbf24 50%, #d97706 100%); transition: width 0.1s linear;`;
        apBarTrack.appendChild(apBarFill); barsContainer.appendChild(apBarTrack);

        overheadUI.appendChild(barsContainer); container.appendChild(overheadUI);

        const spriteSize = 400;
        const sprite = document.createElement('div'); sprite.style.cssText = `width: ${spriteSize}px; height: ${spriteSize}px; background-size: ${spriteConfig.framesPerRow * spriteSize}px auto; background-repeat: no-repeat; background-position: 0 0; will-change: background-position;`;
        container.appendChild(sprite);
        const shadow = document.createElement('div'); shadow.style.cssText = `width: 200px; height: 20px; background: rgba(0,0,0,0.4); border-radius: 50%; margin-top: -120px; z-index: -1;`;
        container.appendChild(shadow);

        let stats = { hp: 1000, atk: 100, def: 50, speed: 1.0, crit: '5%' }; // Default
        if (id === 'hero') {
            // Prefer provided stats (from AdventureModal calculation) over local lookup
            if (providedStats) {
                stats = providedStats;
            } else {
                stats = getStatsForLevel(heroId, parseInt(level));
            }
        }

        return {
            id, name, maxHp: stats.hp, hp: stats.hp, level: parseInt(level),
            element: container, spriteEl: sprite, hpBarFill, apBarFill, statusContainer,
            shieldBarFill, shieldBarTrack, // Shield bar elements
            baseConfig: spriteConfig,
            isDead: false, cooldowns: { skill1: 0, skill2: 0, skill3: 0, ult: 0 },
            currentAnim: 'idle', animFrame: 0, animTimestamp: 0, animReqId: null,
            currentAnimTotalFrames: ANIM_FRAMES.idle, loopAnim: true,
            skillIcons: data.skillIcons || [], stats: stats, ap: 0, effects: [], passiveCharges: 0, heroId, isMelee,
            battleStats: { damageDealt: 0, healing: 0, damageTaken: 0 },
            stars: stars,
            skills: providedSkills || data.skills
        };
    }





    private setIsometricPosition(el: HTMLElement, index: number, isPlayer: boolean) {
        // Vertical Row Layout - Heroes and Enemies face each other horizontally
        // 3 rows with same Y position for each pair
        // Row 0: Top, Row 1: Middle, Row 2: Bottom
        // Indices 0,1,2 = Front column (closer to center)
        // Indices 3,4,5 = Back column (further from center)

        let x = 0;
        let y = 0;

        // Row Y positions (same for both player and enemy) - Slot 1 at bottom, Slot 3 at top
        const ROW_Y = [68, 48, 28]; // Bottom, Mid, Top rows (slot 1=bottom, slot 2=mid, slot 3=top)

        // Player Side (Left) - Heroes face RIGHT toward enemies
        const PLAYER_COORDS = [
            { x: 38, y: ROW_Y[0] }, // 0: Front Bottom (Slot 1)
            { x: 38, y: ROW_Y[1] }, // 1: Front Mid (Slot 2)
            { x: 38, y: ROW_Y[2] }, // 2: Front Top (Slot 3)
            { x: 24, y: ROW_Y[0] }, // 3: Back Bottom (Slot 4)
            { x: 24, y: ROW_Y[1] }, // 4: Back Mid (Slot 5)
            { x: 24, y: ROW_Y[2] }  // 5: Back Top (Slot 6)
        ];

        // Enemy Side (Right) - Enemies face LEFT toward heroes
        const ENEMY_COORDS = [
            { x: 62, y: ROW_Y[0] }, // 0: Front Bottom (Slot 1)
            { x: 62, y: ROW_Y[1] }, // 1: Front Mid (Slot 2)
            { x: 62, y: ROW_Y[2] }, // 2: Front Top (Slot 3)
            { x: 76, y: ROW_Y[0] }, // 3: Back Bottom (Slot 4)
            { x: 76, y: ROW_Y[1] }, // 4: Back Mid (Slot 5)
            { x: 76, y: ROW_Y[2] }  // 5: Back Top (Slot 6)
        ];

        const safeIndex = index % 6;

        if (isPlayer) {
            const pos = PLAYER_COORDS[safeIndex];
            x = pos.x;
            y = pos.y;
        } else {
            const pos = ENEMY_COORDS[safeIndex];
            x = pos.x;
            y = pos.y;
        }

        const zIndex = 100 + Math.floor(y * 10);

        Object.assign(el.style, {
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: `translate(-50%, -50%) scale(0.9)`,
            zIndex: zIndex
        });
    }

    private stopBattleLoop() {
        if (this.battleLoopId) {
            cancelAnimationFrame(this.battleLoopId);
            this.battleLoopId = null;
        }
        this.heroes.forEach(h => { if (h.animReqId) cancelAnimationFrame(h.animReqId); });
        this.enemies.forEach(e => { if (e.animReqId) cancelAnimationFrame(e.animReqId); });
    }

    public close() {
        this.stopBattleLoop();
        this.container.style.transition = 'opacity 0.3s ease'; this.container.style.opacity = '0';
        setTimeout(() => { this.container.remove(); this.onClose(); }, 300);
    }

    private showAbandonConfirmation() {
        // Pause battle
        const wasPaused = this.isPaused;
        this.isPaused = true;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 20000;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.2s;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(180deg, #2b1d0e 0%, #1a1005 100%);
            border: 2px solid #8b6542; border-radius: 12px; padding: 30px;
            width: 400px; text-align: center; color: #fff;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            font-family: 'SF Pro Display';
            transform: scale(0.9); animation: popIn 0.2s forwards;
        `;

        content.innerHTML = `
            <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 15px; color: #fbbf24;">Abandon Battle?</div>
            <div style="font-size: 1rem; color: #ccc; margin-bottom: 30px;">You will lose any progress and rewards for this attempt.</div>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="cancel-abandon" style="padding: 10px 20px; background: transparent; border: 1px solid #888; color: #ccc; border-radius: 20px; cursor: pointer;">Cancel</button>
                <button id="confirm-abandon" style="padding: 10px 20px; background: #ef4444; border: none; color: white; border-radius: 20px; cursor: pointer; font-weight: bold;">Abandon</button>
            </div>
        `;

        modal.appendChild(content);
        this.container.appendChild(modal);

        modal.querySelector('#cancel-abandon')?.addEventListener('click', () => {
            modal.remove();
            this.isPaused = wasPaused; // Restore state
        });

        modal.querySelector('#confirm-abandon')?.addEventListener('click', () => {
            modal.remove();
            this.close();
        });
    }

    private restart() {
        this.stopBattleLoop();
        this.activeTooltip?.remove();
        this.activeTooltip = null;
        if (this.resultOverlay) { this.resultOverlay.remove(); this.resultOverlay = null; }
        if (this.arenaScreen) { this.arenaScreen.remove(); this.arenaScreen = null; }

        this.isBattleStarted = false;
        this.isPaused = false;
        this.isAnimatingAction = false;
        this.heroes = [];
        this.enemies = [];
        this.frameCount = 0;

        // Reset HUD elements references so they get recreated
        this.skillBtns = [];

        this.showLoadingScreen();
    }
    public getElement(): HTMLElement { return this.container; }

    private showBattleResult(win: boolean) {
        if (this.isAnimatingAction) {
            setTimeout(() => this.showBattleResult(win), 500);
            return;
        }

        // Stop Loop
        if (this.battleLoopId) cancelAnimationFrame(this.battleLoopId);
        this.isPaused = true;

        // Delay slightly for dramatic effect
        setTimeout(() => {
            this.createBattleResultOverlay(win);
        }, 1000);
    }

    private calculateTeamCP(entities: BattleEntity[]): number {
        return entities.reduce((total, entity) => {
            // Reconstruct stats object for CP calc
            const stats = {
                hp: entity.maxHp,
                atk: entity.stats.atk,
                armor: entity.stats.def, // Map def to armor
                moveSpeed: 1, // Base move speed assumption if not available
                aspd: entity.stats.speed, // Map speed to aspd
            };

            const isPlayer = entity.id === 'hero';

            // CP Formula weights matching HeroUpgradeModal / UIManager.calculateSingleHeroCP
            const hpPower = stats.hp * 0.1;
            const atkPower = stats.atk * 5;
            const armorPower = stats.armor * 10;
            const aspdPower = stats.aspd * 1000;
            const speedPower = stats.moveSpeed * 2;

            // Level Bonus
            const levelPower = entity.level * (isPlayer ? 500 : 20); // Heroes get 500 per level weight, enemies 20

            let skillPower = 0;
            if (isPlayer && entity.skills) {
                // Full skill rank iteration matching UIManager.calculateSingleHeroCP
                entity.skills.forEach((skill: any) => {
                    if (skill.ranks && Array.isArray(skill.ranks)) {
                        skill.ranks.forEach((rank: any, index: number) => {
                            if (rank.unlockLevel <= entity.level) {
                                skillPower += (index + 1) * 5000;
                                if (rank.damagePercent) skillPower += rank.damagePercent * 50;
                            }
                        });
                    }
                });
            }

            return total + Math.round(hpPower + atkPower + armorPower + aspdPower + speedPower + levelPower + skillPower);
        }, 0);
    }

    private createBattleResultOverlay(win: boolean) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute; inset: 0; z-index: 2000;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;

        const title = document.createElement('div');
        title.innerText = win ? "VICTORY" : "DEFEAT";
        title.style.cssText = `
            font-size: 5rem; font-weight: 900; 
            color: ${win ? '#fbbf24' : '#ef4444'}; 
            font-family: 'SF Pro Display'; 
            text-shadow: 0 0 20px ${win ? 'rgba(251, 191, 36, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
            margin-bottom: 20px; animation: fadeInUp 0.5s;
        `;

        // Star Rating Display (Only on Win)
        let starContainer: HTMLElement | null = null;
        if (win) {
            starContainer = document.createElement('div');
            starContainer.style.cssText = `display: flex; gap: 10px; margin-bottom: 30px; animation: fadeInUp 0.5s 0.2s backwards;`;

            const survivors = this.heroes.filter(h => !h.isDead).length;
            const dead = this.heroes.length - survivors;
            let stars = 1;
            if (dead === 0) stars = 3;
            else if (dead === 1) stars = 2;

            for (let i = 0; i < 3; i++) {
                const star = document.createElement('div');
                const isEarned = i < stars;
                star.innerHTML = '★';
                star.style.cssText = `
                    font-size: 3rem; 
                    color: ${isEarned ? '#ffd700' : '#444'}; 
                    text-shadow: ${isEarned ? '0 0 10px rgba(255, 215, 0, 0.8)' : 'none'};
                    transform: scale(${isEarned ? 1 : 0.8});
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                `;
                // Animate stars sequentially
                if (isEarned) {
                    star.style.animation = `popIn 0.4s ${0.3 + i * 0.1}s backwards`;
                }
                starContainer.appendChild(star);
            }
        }

        const rewardsContainer = document.createElement('div');
        rewardsContainer.style.cssText = `display: flex; gap: 20px; align-items: center; justify-content: center; margin-bottom: 40px; min-height: 80px; opacity: 0;`;

        let calculatedRewards: LootReward[] = []; // Store to pass back

        if (win) {
            // Calculate dynamic loot
            calculatedRewards = calculateLoot(this.mapId, this.stageLevel, this.isFirstClear);

            rewardsContainer.style.animation = "fadeInUp 0.5s forwards 0.5s";

            let rewardsHtml = '';
            calculatedRewards.forEach(reward => {
                rewardsHtml += `
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <img src="${reward.icon}" style="width:64px; height:64px; margin-bottom:5px; object-fit:contain; ${reward.isDrop ? 'border:2px solid gold; border-radius:8px;' : ''}">
                        <span style="color:#fff; font-weight:bold; font-family:'SF Pro Display'; text-shadow:0 1px 2px #000;">${reward.amount > 1 ? '+' + reward.amount : ''} ${reward.name}</span>
                    </div>
                `;
            });
            rewardsContainer.innerHTML = rewardsHtml;

        } else {
            rewardsContainer.innerHTML = `<div style="color: #aaa; margin-bottom: 30px; font-size: 1.2rem; font-family:'SF Pro Display';">Strengthen your heroes and try again!</div>`;
            rewardsContainer.style.animation = "fadeInUp 0.5s forwards 0.5s";
        }

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = `
            display: flex; gap: 20px; align-items: center;
            opacity: 0; animation: fadeInUp 0.5s forwards 0.8s;
        `;

        const btn = document.createElement('button');
        btn.innerText = win ? "Continue" : "Exit";
        btn.style.cssText = `
            padding: 15px 50px; font-size: 1.5rem; font-weight: bold; 
            background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%); 
            border: 2px solid #60a5fa; color: white; border-radius: 30px; 
            cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.5);
            transition: transform 0.1s;
        `;
        if (!win) {
            btn.style.background = 'linear-gradient(180deg, #4b5563 0%, #1f2937 100%)';
            btn.style.borderColor = '#9ca3af';
        }

        btnContainer.appendChild(btn);
        overlay.appendChild(title);
        if (starContainer) overlay.appendChild(starContainer);
        overlay.appendChild(rewardsContainer);
        overlay.appendChild(btnContainer);

        const handleComplete = () => {
            if (this.onBattleEnd) {
                const result = {
                    win,
                    isAuto: this.isAuto,
                    rewards: calculatedRewards, // Pass dynamic rewards back
                    finalSpeed: this.battleSpeed,
                    survivingHeroes: this.heroes.filter(h => !h.isDead).length
                };
                this.onBattleEnd(result);
            } else {
                this.close();
            }
        };

        btn.onclick = () => handleComplete();

        // Auto Continue Logic
        if (win && (this.isAuto || this.isRepeat)) {
            let countdown = 3;
            const isRepeatMode = this.isRepeat;
            const actionText = isRepeatMode ? "Repeating" : "Continuing";

            // Create Cancel Button (Red X or "Stop")
            const stopBtn = document.createElement('button');
            stopBtn.innerText = `Stop ${isRepeatMode ? 'Repeat' : 'Auto'}`;
            stopBtn.style.cssText = `
                padding: 15px 30px; font-size: 1.2rem; font-weight: bold;
                background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
                border: 2px solid #f87171; color: white; border-radius: 30px;
                cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.4);
                transition: transform 0.1s;
            `;

            // Insert Stop button before Continue button
            btnContainer.insertBefore(stopBtn, btn);

            btn.innerText = `${isRepeatMode ? 'Repeat' : 'Continue'} (${countdown})`;

            const interval = setInterval(() => {
                countdown--;
                btn.innerText = `${isRepeatMode ? 'Repeat' : 'Continue'} (${countdown})`;
                if (countdown <= 0) {
                    clearInterval(interval);
                    if (isRepeatMode) {
                        if (this.onRoundComplete) {
                            const result = {
                                win,
                                isAuto: this.isAuto,
                                rewards: calculatedRewards,
                                finalSpeed: this.battleSpeed,
                                survivingHeroes: this.heroes.filter(h => !h.isDead).length
                            };
                            this.onRoundComplete(result);
                        }
                        this.restart();
                    } else {
                        handleComplete();
                    }
                }
            }, 1000);

            stopBtn.onclick = () => {
                clearInterval(interval);
                if (isRepeatMode) this.isRepeat = false;
                else this.isAuto = false;

                // Update UI toggles if they still exist (likely not visible but state matters)
                if (this.repeatBtn) { // Update visual just in case
                    this.toggleRepeat(); // Toggles off since we set false above? No, toggle inverts.
                    // Force update logic:
                    this.isRepeat = false;
                    this.repeatBtn.style.background = 'rgba(0,0,0,0.6)';
                    this.repeatBtn.style.color = '#fff';
                    this.repeatBtn.style.borderColor = '#fff';
                }

                stopBtn.remove(); // Remove stop button
                btn.innerText = "Continue"; // Reset main button

                // Re-bind handler to normal complete (since repeat is cancelled)
                btn.onclick = () => handleComplete();
            };

            // Allow manual continue to override
            btn.onclick = () => {
                clearInterval(interval);
                if (isRepeatMode) {
                    if (this.onRoundComplete) {
                        const result = {
                            win,
                            isAuto: this.isAuto,
                            rewards: calculatedRewards, // Use the already calculated rewards in scope
                            finalSpeed: this.battleSpeed,
                            survivingHeroes: this.heroes.filter(h => !h.isDead).length
                        };
                        this.onRoundComplete(result);
                    }
                    this.restart();
                } else {
                    handleComplete();
                }
            };
        }

        // Add keyframes if not exists (re-adding just in case)
        const style = document.createElement('style');
        style.innerText = `
            @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        overlay.appendChild(style);

        this.resultOverlay = overlay;
        this.container.appendChild(overlay);
    }
}
