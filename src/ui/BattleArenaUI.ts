import { HERO_ASSETS, HeroSpriteConfig } from '../data/HeroAssetsMap';
import { EnemyDefinition, getEnemyById, getEnemyStatsForLevel } from '../data/EnemyDefinitions';
import { calculateLoot, LootReward } from '../data/LootSystem';

const FPS = 30;
const MAX_AP = 10000;

const ANIM_FRAMES: Record<string, number> = {
    idle: 48, skill1: 24, skill2: 30, hit1: 15, dead: 40, dizzy: 40
};

// Enemy animation mapping
const ENEMY_ANIM_MAP: Record<string, string> = {
    idle: 'idle', skill1: 'attack', skill2: 'attack', hit1: 'hit', dead: 'dead', dizzy: 'hit'
};

// Map file assets to new Hero IDs
const ASSET_TO_HERO_ID: Record<string, string> = {
    'Antelope Mage': 'oryx_mage',
    'Antelope Ranger': 'sable_ranger',
    'Razor': 'razor_assassin',
    'Razor Left': 'razor_assassin'
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
            { name: "Horn Bolt", type: "Active", desc: "Lvl 81: Silence (1.5s). Lvl 221: Pierce." },
            { name: "Static Hooves", type: "Passive", desc: "Charge on Move. Lvl 20: Bounce 2. Lvl 201: Bounce 3." },
            { name: "Astral Leap", type: "Active", desc: "Teleport. Lvl 241: Stun Trap (1.5s)." },
            { name: "Nature's Wrath", type: "Ultimate", desc: "AOE Nuke. Lvl 250: Instant Cast." }
        ],
        skillIcons: ['Horn Bolt.png', 'Static Hooves.png', 'Astral Leap.png', "Nature's Wrath.png"]
    },
    'sable_ranger': {
        name: "Sable", title: "The Velocity", role: "Sustained DPS", class: 'Ranger', type: 'Agility', icon: '/assets/attr/boots.png',
        statLevels: {
            1: { hp: 480, atk: 42, def: 4, speed: 0.9, crit: '10%' },
            100: { hp: 13500, atk: 950, def: 120, speed: 1.4, crit: '20%' },
            250: { hp: 165000, atk: 11200, def: 2400, speed: 2.8, crit: '35%' }
        },
        skills: [
            { name: "Wind-Piercer", type: "Active", desc: "Lvl 221: +30% Crit." },
            { name: "Back-Kick Vault", type: "Active", desc: "Kick + Jump. Lvl 241: Stun (2s)." },
            { name: "Hunter's Mark", type: "Passive", desc: "Stack Dmg. Lvl 201: Max 10 Stacks." },
            { name: "Spirit Barrage", type: "Ultimate", desc: "Rapid Fire. Lvl 250: 20 Arrows." }
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
    type: 'stun' | 'buff_atk' | 'buff_def' | 'buff_speed' | 'dot' | 'mark' | 'silence' | 'shield';
    name: string;
    duration: number; // turns
    value: number; // multiplier or flat value
    icon: string;
}

const MELEE_CLASSES = ['Assassin', 'Warrior', 'Paladin', 'Tank'];

interface BattleEntity {
    id: string; name: string; maxHp: number; hp: number; level: number;
    element: HTMLElement; spriteEl: HTMLElement;
    hpBarFill: HTMLElement; apBarFill: HTMLElement; statusContainer: HTMLElement;
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
    battleStats: { damageDealt: number; healing: number; damageTaken: number; };
}

export class BattleArenaUI {
    private container: HTMLElement;
    private loadingScreen: HTMLElement | null = null;
    private arenaScreen: HTMLElement | null = null;
    // private onClose: () => void; // Defined in constructor

    private teamInfo: { name: string, level: number, instanceId: string, stars: number }[];
    private enemyId: string;
    private stageLevel: number;

    private heroes: BattleEntity[] = [];
    private enemies: BattleEntity[] = [];

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
    private dataModal: HTMLElement | null = null;
    private dataModalActiveTab: 'damage' | 'treatment' | 'damageTaken' = 'damage';

    private static NAME_ALIASES: Record<string, string> = {
        'Oryx': 'Antelope Mage',
        'Sable': 'Antelope Ranger',
        'Razor': 'Razor',
        // Fallbacks for safety
        'Mage': 'Antelope Mage',
        'Ranger': 'Antelope Ranger'
    };

    constructor(
        teamInfo: { name: string, level: number, instanceId: string, stars: number }[],
        private onClose: () => void,
        private onComplete?: (result: { win: boolean, isAuto: boolean, rewards?: LootReward[], finalSpeed?: number }) => void,
        enemyId: string = 'treant',
        stageLevel: number = 10,
        initialAutoState: boolean = false,
        private mapId: number = 1,
        private isFirstClear: boolean = false,
        initialSpeed: number = 2 // New arg
    ) {
        this.teamInfo = teamInfo.map(h => ({
            ...h,
            name: BattleArenaUI.NAME_ALIASES[h.name] || h.name
        }));
        console.log('[BattleArenaUI] Constructor teamInfo:', this.teamInfo);
        this.enemyId = enemyId;
        this.stageLevel = stageLevel;
        this.onClose = onClose;
        this.onComplete = onComplete;
        this.isAuto = initialAutoState; // Set initial state
        this.battleSpeed = initialSpeed; // Set initial speed
        this.container = document.createElement('div');
        this.container.style.cssText = `position: fixed; inset: 0; width: 100%; height: 100%; z-index: 100000; background: #000;`;
        this.showLoadingScreen();
    }

    private showLoadingScreen() {
        this.loadingScreen = document.createElement('div');
        this.loadingScreen.style.cssText = `position: absolute; inset: 0; background: #0a0a1a; display: flex; justify-content: center; align-items: center; z-index: 10;`;
        this.loadingScreen.innerHTML = `<div style="color:#fbbf24; font-size: 2rem; font-family: 'SF Pro Display';">LOADING BATTLE...</div>`;
        this.container.appendChild(this.loadingScreen);

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
            const addAnimPaths = (basePath: string) => { if (basePath) Object.keys(ANIM_FRAMES).forEach(anim => assetsToLoad.push(basePath.replace('idle', anim))); };

            // Preload all heroes
            // Preload all heroes
            this.teamInfo.forEach(heroInfo => {
                const name = heroInfo.name;
                const configLeft = HERO_ASSETS.find(h => h.name === `${name} Left`);
                if (configLeft?.sprite2D) {
                    const spritePath = configLeft.sprite2D.spritesheetPath;
                    addAnimPaths(spritePath);
                    const heroId = ASSET_TO_HERO_ID[name] || name;
                    const heroData = HERO_DATA[heroId];
                    if (heroData && heroData.skillIcons) {
                        heroData.skillIcons.forEach((icon: string) => {
                            const parts = spritePath.split('/');
                            if (parts.length > 4) assetsToLoad.push(`${parts.slice(0, 4).join('/')}/skills/${icon}`);
                        });
                    }
                }
            });

            // Preload Enemy (heuristic as before)
            // Just load standard enemy if possible or fallback
            // For now, simpler enemy preloading logic from original code or just skip explicitly for "enemyName"


            if (assetsToLoad.length === 0) return;
            const loadPromises = assetsToLoad.map(src => new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = src;
            }));
            await Promise.race([Promise.all(loadPromises), new Promise(r => setTimeout(r, 2000))]);
        } catch (e) { }
    }

    private showArena() {
        if (this.arenaScreen) return;
        if (this.loadingScreen) { this.loadingScreen.remove(); this.loadingScreen = null; }

        this.arenaScreen = document.createElement('div');
        this.arenaScreen.style.cssText = `position: absolute; inset: 0; background: url('/assets/Background/arena2.png') center/cover;`;
        this.arenaScreen.appendChild(Object.assign(document.createElement('div'), { style: `position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4);` }));

        const battleContainer = document.createElement('div');
        battleContainer.style.cssText = `position: relative; width: 100%; height: 100%; z-index: 1;`;
        battleContainer.onclick = (e) => {
            if (this.activeTooltip && !(e.target as HTMLElement).closest('.hud-btn')) {
                this.activeTooltip.remove(); this.activeTooltip = null;
            }
        };

        // Create Heroes
        this.heroes = [];
        this.teamInfo.forEach((heroInfo, index) => {
            const name = heroInfo.name;
            console.log(`[BattleArenaUI] Attempting to spawn hero: "${name}"`);

            // HEROES (Left Side) -> Use side-left sprites (facing right toward enemies)
            const heroConfig = HERO_ASSETS.find(h => h.name === name);

            if (!heroConfig) console.warn(`[BattleArenaUI] Config not found for "${name}"`);
            if (heroConfig?.sprite2D) {
                // Use actual level from heroInfo
                const levelStr = String(heroInfo.level);
                const hero = this.createBattleEntity('hero', name, levelStr, '#22c55e', heroConfig.sprite2D);

                // Positioning will be handled after loop or inside via setIsometricPosition
                // We will defer positioning until all are created or do it here.
                // Refactor to use setIsometricPosition logic below.

                battleContainer.appendChild(hero.element);
                this.playAnim(hero, 'idle');
                this.heroes.push(hero);
            }
        });

        // SEE MULTI-REPLACE CHUNK 2 for Enemy Logic insertion here


        // Create Enemies (Mock 6-hero team)
        this.enemies = [];
        // Use asset names for the enemy team (matching HeroAssetsMap entries)
        const mockEnemyNames = ['Antelope Mage', 'Antelope Ranger', 'Razor', 'Antelope Mage', 'Antelope Ranger', 'Razor'];

        mockEnemyNames.forEach((name, index) => {
            // ENEMIES (Right Side) -> Use "...Left" asset which now has side-right sprites (facing left toward heroes)
            const heroConfig = HERO_ASSETS.find(h => h.name === `${name} Left`);

            if (heroConfig?.sprite2D) {
                // Enemies at same level as stage for now, or scaled
                const levelStr = String(this.stageLevel);
                const enemy = this.createBattleEntity('enemy', name, levelStr, '#ef4444', heroConfig.sprite2D);

                // Isometric Position: Right Side
                const isPlayer = false;
                this.setIsometricPosition(enemy.element, index, isPlayer);

                battleContainer.appendChild(enemy.element);
                // Enemy animation mapping: idle is 'idle'
                this.playAnim(enemy, 'idle');

                // NO SCALE FLIP for enemies (Using native Left asset)

                this.enemies.push(enemy);
            }
        });

        // Isometric Position: Player Side update
        this.heroes.forEach((h, i) => {
            this.setIsometricPosition(h.element, i, true);
        });

        if (this.heroes.length > 0) {
            this.createHUD(battleContainer);
            this.createDataButton(battleContainer);

            this.lastTick = performance.now();
            this.battleLoopId = requestAnimationFrame((t) => this.gameLoop(t));
        }

        this.arenaScreen.appendChild(battleContainer);

        const exitBtn = document.createElement('button');
        exitBtn.innerText = '✕';
        exitBtn.style.cssText = `position: absolute; top: 30px; right: 30px; width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.5); color: #fff; font-size: 1.5rem; cursor: pointer; z-index: 100; transition: all 0.2s;`;
        exitBtn.onclick = () => this.close();
        this.arenaScreen.appendChild(exitBtn);

        this.arenaScreen.appendChild(document.createElement('style')).textContent = `
            @keyframes floatUpFade { 0% { transform: translate3d(0,0,0); opacity: 0; } 20% { transform: translate3d(0,-20px,0); opacity: 1; } 100% { transform: translate3d(0,-60px,0); opacity: 0; } }
            @keyframes fadeInUp { from { opacity: 0; transform: translate3d(0,10px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
            @keyframes modalFadeIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
            .floating-damage { position: absolute; font-family: 'SF Pro Display'; font-weight: 900; color: #fff; text-shadow: 0 0 5px #000; animation: floatUpFade 1s forwards cubic-bezier(0.2, 0.8, 0.2, 1); z-index: 1000; font-size: 2rem; will-change: transform, opacity; }
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
        this.container.appendChild(this.arenaScreen);
    }

    private gameLoop(timestamp: number) {
        // Always request next frame at the end, so we guard logic not function
        this.battleLoopId = requestAnimationFrame((t) => this.gameLoop(t));

        if (!this.isBattleStarted || this.isPaused || !this.arenaScreen) return;
        const delta = timestamp - this.lastTick;
        this.lastTick = timestamp;

        this.frameCount++;
        // Update Data Modal if open every 30 frames (approx 1 sec at 30fps) to keep stats fresh
        if (this.dataModal && this.frameCount % 30 === 0) {
            const content = this.dataModal.querySelector('#data-modal-content') as HTMLElement;
            if (content) this.renderDataModalContent(content);
        }

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
    }

    private tickEntity(entity: BattleEntity, baseTick: number) {
        const isStunned = entity.effects.some(e => e.type === 'stun');
        if (isStunned) return;

        // Razor Bleed Processing (DoT)
        // We'll process DoT once per second approx
        // Razor Bleed Processing (DoT)
        // We'll process DoT once per second approx
        // Check if 1 second has passed since last DoT tick?
        // Simpler: Just do small ticks or stick to turn-based duration?
        // The duration is in turns. We can tick damage at end of turn (in updateEffects) or continuously?
        // Current architecture uses turns for duration. Real-time is okay too.
        // Let's rely on updateEffects for turn-based expiration, but visuals here?
        // Actually, let's keep it simple: DoT damage happens in tickEntity periodically
        if (Math.random() < 0.05) { // Occasional tick
            const dots = entity.effects.filter(e => e.type === 'dot');
            if (dots.length > 0) {
                let dmg = 0;
                dots.forEach(_ => dmg += Math.floor(entity.maxHp * 0.01)); // 1% Max HP tick
                if (dmg > 0) {
                    entity.hp = Math.max(0, entity.hp - dmg);
                    entity.hpBarFill.style.width = `${(entity.hp / entity.maxHp) * 100}%`;
                    this.showFloatingText(entity.element, `-${dmg}`, false);
                    if (entity.hp <= 0 && !entity.isDead) this.handleDeath(entity); // Suicide by bleed
                }
            }
        }

        // Mage Passive - Static Hooves
        if (entity.heroId === 'oryx_mage' && entity.passiveCharges < 100) {
            // Lvl 121+: 80 steps to charge (so fill faster)
            const chargeRate = entity.level >= 121 ? 2.5 : 2.0;
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
        entity.apBarFill.style.width = `${pct}%`;
        entity.apBarFill.style.background = entity.ap >= MAX_AP ? '#ffffff' : '#fbbf24';
    }

    private takeTurn(actor: BattleEntity, target: BattleEntity) {
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
        this.updateEffects(actor);
        const isSilenced = actor.effects.some(e => e.type === 'silence');

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
            animType = 'skill2'; actor.cooldowns.ult = 5;
            skillName = skills[3]?.name || 'Ultimate';
            if (actor.heroId === 'oryx_mage') {
                // Nature's Wrath: 400% -> 600% -> 800%
                damageScale = actor.level >= 250 ? 8.0 : (actor.level >= 141 ? 6.0 : 4.0);
            } else if (actor.heroId === 'razor_assassin') {
                // Guillotine Breaker: 500% -> 750% True Damage
                damageScale = actor.level >= 141 ? 7.5 : 5.0;
                // Cooldown Reset on Kill handled in handleDeath
            } else {
                // Spirit Barrage: 10 arrows -> 15 -> 20. Dmg 40% each. Total: 400% -> 600% -> 800%
                isMultiHit = true;
                damageScale = actor.level >= 250 ? 8.0 : (actor.level >= 141 ? 6.0 : 4.0);
            }
        }
        else if (!isSilenced && actor.cooldowns.skill1 === 0 && Math.random() > 0.4) {
            // SKILL 1
            animType = 'skill1'; actor.cooldowns.skill1 = 3;
            skillName = skills[0]?.name || 'Skill 1';

            if (actor.heroId === 'oryx_mage') {
                // Horn Bolt: 150% -> 180% -> 220%
                damageScale = actor.level >= 161 ? 2.2 : (actor.level >= 81 ? 1.8 : 1.5);
                if (actor.level >= 81) effectsToApply.push({ id: `silence_${Date.now()}`, type: 'silence', duration: 1, value: 0, name: 'Silence', icon: '🙊' });
            } else if (actor.heroId === 'razor_assassin') {
                // Tusk Gore: 160% -> 200%. Bleed.
                damageScale = actor.level >= 81 ? 2.0 : 1.6;
                const bleedDuration = actor.level >= 161 ? 5 : 3;
                effectsToApply.push({ id: `bleed_${Date.now()}`, type: 'dot', duration: bleedDuration, value: 0.4, name: 'Bleed', icon: '🩸' });
            } else {
                // Wind Piercer: 140% -> 170% -> 200%. Lvl 221 Crit Rate (+30%)
                damageScale = actor.level >= 161 ? 2.0 : (actor.level >= 81 ? 1.7 : 1.4);
                if (actor.level >= 221) {
                    // Temporary crit boost handled in applyDamage
                }
            }
        }
        else if (!isSilenced && actor.cooldowns.skill2 === 0 && Math.random() > 0.4) {
            // SKILL 2
            animType = 'skill2'; actor.cooldowns.skill2 = 4;
            skillName = skills[1]?.name || 'Skill 2';

            if (actor.heroId === 'oryx_mage') {
                // Astral Leap
                damageScale = 0;
                this.applyStatus(actor, { id: `buff_spd_${Date.now()}`, type: 'buff_speed', duration: 2, value: 1.3, name: 'Astral Speed', icon: '⚡' });
                if (actor.level >= 241) effectsToApply.push({ id: `stun_${Date.now()}`, type: 'stun', duration: 1, value: 0, name: 'Stun Trap', icon: '⚡' });
            } else if (actor.heroId === 'razor_assassin') {
                // Wild Charge: 120%. Charge.
                damageScale = 1.2;
                if (actor.level >= 101) {
                    const shieldAmount = Math.floor(actor.maxHp * 0.15);
                    this.applyStatus(actor, { id: `shield_${Date.now()}`, type: 'shield', duration: 3, value: shieldAmount, name: 'Shield', icon: '🛡️' });
                }
                if (actor.level >= 181) actor.cooldowns.skill2 = 3; // Reduced CD (normally 4)
                if (actor.level >= 241) effectsToApply.push({ id: `stun_${Date.now()}`, type: 'stun', duration: 1, value: 0, name: 'Knock Up', icon: '⬆️' });
            } else {
                // Back-Kick Vault
                damageScale = 1.0; // 100%
                if (actor.level >= 241) effectsToApply.push({ id: `stun_${Date.now()}`, type: 'stun', duration: 1, value: 0, name: 'Stun Kick', icon: '👢' });
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
                // If melee, don't auto-idle here, wait for return
                if (!actor.isMelee && !actor.isDead) this.playAnim(actor, 'idle');
            });
        };

        if (actor.isMelee) {
            // Dash toward the target - calculate direction based on actual positions (both X and Y)
            const actorRect = actor.element.getBoundingClientRect();
            const targetRect = target.element.getBoundingClientRect();

            // Calculate direction and distance to move toward target
            const deltaX = targetRect.left - actorRect.left;
            const deltaY = targetRect.top - actorRect.top;

            // Move 60% of the way toward target, capped at reasonable limits
            // Move almost fully toward target (stop 60px short to avoid full overlap)
            const approachDist = 60;
            const moveX = (Math.max(0, Math.abs(deltaX) - approachDist)) * Math.sign(deltaX);
            const moveY = deltaY; // Move to exact Y plane

            actor.element.style.transition = `transform ${250 / this.battleSpeed}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
            actor.element.style.transform = `translate(-50%, -50%) scale(0.9) translate(${moveX}px, ${moveY}px)`;

            setTimeout(() => {
                performAttackAnim();
            }, 250 / this.battleSpeed);

            // Return to base position
            setTimeout(() => {
                actor.element.style.transition = `transform ${350 / this.battleSpeed}ms ease-out`;
                actor.element.style.transform = `translate(-50%, -50%) scale(0.9)`;
                setTimeout(() => { if (!actor.isDead) this.playAnim(actor, 'idle'); }, 350 / this.battleSpeed);
            }, (250 + 700) / this.battleSpeed); // Dash + Anim duration
        } else {
            performAttackAnim();
        }

        // Damage Timing
        // Range: 600ms
        // Melee: 250ms (Dash) + 350ms (Windup) = 600ms. Perfect match.
        setTimeout(() => {
            if (target.isDead) return;
            // Ranger Skill 1 Crit Bonus Check
            let forceCrit = (actor.heroId === 'sable_ranger' && actor.level >= 221 && skillName.includes('Wind-Piercer'));

            this.applyDamage(target, damageScale, actor, isMultiHit, forceCrit);
            effectsToApply.forEach(e => this.applyStatus(target, e));

            if (target.hp <= 0) {
                this.handleDeath(target);
                // Reset animation flag after death animation to continue battle
                setTimeout(() => { this.isAnimatingAction = false; }, 1500 / this.battleSpeed);
            } else {
                setTimeout(() => { this.isAnimatingAction = false; }, 1200 / this.battleSpeed);
            }
        }, 600 / this.battleSpeed);
    }

    private applyStatus(target: BattleEntity, effect: StatusEffect) {
        target.effects.push(effect);
        this.updateStatusUI(target);
        this.showFloatingText(target.element, effect.icon, false);
    }

    private updateEffects(entity: BattleEntity) {
        entity.effects.forEach(e => e.duration--);
        const expired = entity.effects.filter(e => e.duration <= 0);
        entity.effects = entity.effects.filter(e => e.duration > 0);
        if (expired.length > 0) {
            this.updateStatusUI(entity);
        }
    }

    private updateStatusUI(entity: BattleEntity) {
        entity.statusContainer.innerHTML = '';
        entity.effects.forEach(e => {
            const icon = document.createElement('div');
            icon.innerText = e.icon;
            icon.style.cssText = `font-size: 14px; background: rgba(0,0,0,0.6); padding: 2px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3);`;
            entity.statusContainer.appendChild(icon);
        });
    }

    private applyDamage(target: BattleEntity, scale: number, attacker: BattleEntity, isMultiHit: boolean = false, forceCrit: boolean = false) {
        let finalAtk = attacker.stats.atk;
        const atkBuff = attacker.effects.find(e => e.type === 'buff_atk');
        if (atkBuff) finalAtk *= atkBuff.value;

        // Mage Passive - Static Hooves
        if (attacker.heroId === 'oryx_mage' && attacker.passiveCharges >= 100) {
            scale *= attacker.level >= 201 ? 2.0 : 1.8; // Bounce 3 vs 2
            attacker.passiveCharges = 0;
            this.showFloatingText(attacker.element, "STATIC DISCHARGE!", true);
        }

        // Ranger Passive - Hunter's Mark
        if (attacker.heroId === 'sable_ranger') {
            const marks = target.effects.filter(e => e.type === 'mark').length;
            if (marks > 0) {
                const perStack = attacker.level >= 121 ? 0.05 : 0.03;
                const boost = 1 + (marks * perStack);
                finalAtk *= Math.min(boost, 1.5);
            }
            let maxMarks = attacker.level >= 201 ? 10 : 5;
            if (marks < maxMarks) {
                this.applyStatus(target, { id: `mark_${Date.now()}`, type: 'mark', name: 'Mark', duration: 3, value: 0, icon: '🎯' });
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
            if (absorb > 0) this.showFloatingText(target.element, `Absorbed (${absorb})`, false);
        }

        target.hp = Math.max(0, target.hp - finalDamage);
        target.hpBarFill.style.width = `${(target.hp / target.maxHp) * 100}%`;

        if (target.hp > 0) this.playAnim(target, 'hit1', false, () => this.playAnim(target, 'idle'));

        if (isMultiHit) {
            this.showFloatingText(target.element, `-${finalDamage} (x20)`, isCrit);
        } else {
            this.showFloatingText(target.element, `-${finalDamage}${isCrit ? '!' : ''}`, isCrit);
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
                killer.hpBarFill.style.width = `${(killer.hp / killer.maxHp) * 100}%`;
                this.showFloatingText(killer.element, `+${healAmt}`, false);
                killer.battleStats.healing += healAmt;
            }
            if (killer.level >= 250) {
                killer.cooldowns.ult = 0;
            }
        });
    }

    private playAnim(entity: BattleEntity, type: string, loop: boolean = true, onComplete?: () => void) {
        if (entity.isDead && type !== 'dead') return;

        // Check if this is an enemy entity with enemyDef
        const enemyDef = (entity.element as any).enemyDef;
        if (enemyDef) {
            this.playEnemyAnim(entity, type, loop, onComplete);
            return;
        }

        if (entity.animReqId) { cancelAnimationFrame(entity.animReqId); entity.animReqId = null; }
        entity.currentAnim = type;
        const newPath = entity.baseConfig.spritesheetPath.replace('idle', type);
        entity.spriteEl.style.backgroundImage = `url('${newPath}')`;
        entity.currentAnimTotalFrames = ANIM_FRAMES[type] || 24;
        entity.loopAnim = loop;
        entity.onAnimComplete = onComplete;
        entity.animFrame = 0; entity.animTimestamp = 0;
        const loopFn = (timestamp: number) => {
            if (!entity.animTimestamp) entity.animTimestamp = timestamp;
            if (timestamp - entity.animTimestamp > 1000 / (FPS * this.battleSpeed)) {
                entity.animFrame++; entity.animTimestamp = timestamp;
                if (entity.animFrame >= entity.currentAnimTotalFrames) {
                    if (entity.loopAnim) entity.animFrame = 0;
                    else { entity.animFrame = entity.currentAnimTotalFrames - 1; if (entity.onAnimComplete) entity.onAnimComplete(); return; }
                }
                const spriteSize = 400;
                const col = entity.animFrame % entity.baseConfig.framesPerRow;
                const row = Math.floor(entity.animFrame / entity.baseConfig.framesPerRow);
                entity.spriteEl.style.backgroundPosition = `-${col * spriteSize}px -${row * spriteSize}px`;
            }
            entity.animReqId = requestAnimationFrame(loopFn);
        };
        entity.animReqId = requestAnimationFrame(loopFn);
    }
    private showFloatingText(targetEl: HTMLElement, text: string, isCrit: boolean) {
        const el = document.createElement('div'); el.className = 'floating-damage'; el.innerText = text;
        if (isCrit) { el.style.color = '#fbbf24'; el.style.fontSize = '3rem'; el.style.textShadow = '0 0 10px rgba(251, 191, 36, 0.8)'; }
        const randomX = (Math.random() - 0.5) * 50; el.style.left = `calc(50% + ${randomX}px)`; el.style.top = '0px';
        targetEl.appendChild(el); setTimeout(() => el.remove(), 1000 / this.battleSpeed);
    }
    // ... [Rest of Helpers] ...
    private createDataButton(c: HTMLElement) {
        const btn = document.createElement('button');
        btn.className = 'data-btn';
        btn.innerHTML = '📊';
        btn.title = 'Battle Data';
        btn.onclick = () => this.showDataModal();
        c.appendChild(btn);
    }

    private showDataModal() {
        // Remove existing modal if any
        if (this.dataModal) {
            this.dataModal.remove();
            this.dataModal = null;
            return;
        }

        this.dataModal = document.createElement('div');
        this.dataModal.className = 'data-modal';

        const header = document.createElement('div');
        header.className = 'data-modal-header';
        header.innerHTML = `<h2>Data</h2>`;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'data-modal-close';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = () => { this.dataModal?.remove(); this.dataModal = null; };
        header.appendChild(closeBtn);

        const content = document.createElement('div');
        content.className = 'data-modal-content';
        content.id = 'data-modal-content';

        const tabs = document.createElement('div');
        tabs.className = 'data-modal-tabs';

        const tabNames: Array<{ key: 'damage' | 'treatment' | 'damageTaken', label: string }> = [
            { key: 'damage', label: 'Damage' },
            { key: 'treatment', label: 'Treatment' },
            { key: 'damageTaken', label: 'Damage Taken' }
        ];

        tabNames.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.className = `data-modal-tab ${tab.key === this.dataModalActiveTab ? 'active' : ''}`;
            tabBtn.innerText = tab.label;
            tabBtn.onclick = () => {
                this.dataModalActiveTab = tab.key;
                tabs.querySelectorAll('.data-modal-tab').forEach(t => t.classList.remove('active'));
                tabBtn.classList.add('active');
                this.renderDataModalContent(content);
            };
            tabs.appendChild(tabBtn);
        });

        this.dataModal.appendChild(header);
        this.dataModal.appendChild(content);
        this.dataModal.appendChild(tabs);

        this.renderDataModalContent(content);
        this.container.appendChild(this.dataModal);
    }

    private renderDataModalContent(contentEl: HTMLElement) {
        contentEl.innerHTML = '';

        // Combine heroes and enemies for display
        const allUnits = [...this.heroes, ...this.enemies];

        // Sort by the active tab's stat
        const sortedUnits = allUnits.sort((a, b) => {
            switch (this.dataModalActiveTab) {
                case 'damage': return b.battleStats.damageDealt - a.battleStats.damageDealt;
                case 'treatment': return b.battleStats.healing - a.battleStats.healing;
                case 'damageTaken': return b.battleStats.damageTaken - a.battleStats.damageTaken;
            }
        });

        sortedUnits.forEach(unit => {
            const isHero = this.heroes.includes(unit);
            const row = document.createElement('div');
            row.className = 'data-row';

            let value = 0;
            let valueClass = '';
            switch (this.dataModalActiveTab) {
                case 'damage': value = unit.battleStats.damageDealt; valueClass = 'damage'; break;
                case 'treatment': value = unit.battleStats.healing; valueClass = 'healing'; break;
                case 'damageTaken': value = unit.battleStats.damageTaken; valueClass = 'damage'; break;
            }

            const status = unit.isDead ? 'Out of the fight' : `${unit.hp}/${unit.maxHp}`;
            const borderColor = isHero ? '#4ade80' : '#f87171';

            row.innerHTML = `
                <div class="data-row-avatar" style="border-color: ${borderColor};">
                    <div style="width:100%;height:100%;background:#2a2a2a;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
                        ${isHero ? '⚔️' : '👹'}
                    </div>
                </div>
                <div class="data-row-info">
                    <div class="data-row-name">${unit.name}</div>
                    <div class="data-row-status">${status}</div>
                </div>
                <div class="data-row-value ${valueClass}">${value.toLocaleString()}</div>
            `;

            contentEl.appendChild(row);
        });
    }

    private createHUD(c: HTMLElement) {
        if (this.heroes.length === 0) return;
        const h = document.createElement('div');
        // HUD Container - Flex row for controls
        h.style.cssText = `
            position: absolute; bottom: 40px; right: 40px; 
            display: flex; gap: 15px; align-items: center; 
            z-index: 50; 
            background: rgba(0,0,0,0.5); padding: 15px; 
            border-radius: 25px; border: 1px solid rgba(255,255,255,0.1); 
            backdrop-filter: blur(5px);
        `;

        // Start Button (Now inside HUD, Left aligned relative to Auto)
        this.createStartButton(h);

        // Auto Button
        this.createAutoButton(h);

        // Speed Button
        this.createSpeedButton(h);

        c.appendChild(h);
        this.updateHUD();
    }

    private createStartButton(c: HTMLElement) {
        this.startBtn = document.createElement('button');
        // Play Icon (Triangle) - Scaled down slightly
        this.startBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 30px; height: 30px; margin-left: 3px;"><path d="M8 5v14l11-7z"/></svg>`;
        this.startBtn.style.cssText = `
            width: 60px; height: 60px; border-radius: 50%;
            display: flex; justify-content: center; align-items: center;
            color: #fff; border: 2px solid #fff;
            background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            cursor: pointer; transition: all 0.2s;
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

    private createAutoButton(c: HTMLElement) {
        this.autoBtn = document.createElement('div');
        this.autoBtn.className = 'hud-btn';
        // Relative positioning for flex layout
        this.autoBtn.style.cssText = `
            width: 60px; height: 60px; border-radius: 50%; 
            background: rgba(0,0,0,0.6); border: 2px solid #fff; color: #fff; 
            display: flex; flex-direction: column; justify-content: center; align-items: center; 
            font-weight: bold; font-family: 'SF Pro Display'; font-size: 0.8rem; 
            cursor: pointer; transition: all 0.2s;
        `;

        const icon = document.createElement('div');
        icon.innerText = '↺';
        icon.style.fontSize = '1.2rem';
        this.autoBtn.appendChild(icon);

        const text = document.createElement('div');
        text.innerText = 'AUTO';
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
        if (this.isAuto && !this.isBattleStarted) {
            this.startBattle();
        }
    }

    private createSpeedButton(c: HTMLElement) {
        this.speedBtn = document.createElement('div');
        this.speedBtn.className = 'hud-btn';
        // Relative positioning for flex layout
        this.speedBtn.style.cssText = `
            width: 60px; height: 60px; border-radius: 50%; 
            background: rgba(0,0,0,0.6); border: 2px solid #fff; color: #fff; 
            display: flex; justify-content: center; align-items: center; 
            font-weight: bold; font-family: 'SF Pro Display'; font-size: 1.2rem; 
            cursor: pointer; transition: all 0.2s;
        `;
        this.speedBtn.innerText = `${this.battleSpeed}x`;
        this.speedBtn.onclick = () => this.toggleSpeed();
        c.appendChild(this.speedBtn);
    }

    private createSkillIcon(src: string, isUlt: boolean): HTMLElement { const s = isUlt ? 85 : 70; const b = isUlt ? '#fbbf24' : '#fff'; const w = document.createElement('div'); w.className = 'hud-btn'; w.style.cssText = `width:${s}px;height:${s}px;position:relative;border-radius:12px;border:2px solid ${b};background:#000;overflow:hidden;flex-shrink:0;`; const i = document.createElement('img'); i.src = src; i.style.cssText = `width:100%;height:100%;object-fit:cover;`; i.onerror = () => { i.style.display = 'none'; }; w.appendChild(i); const o = document.createElement('div'); o.className = 'cd-overlay'; o.style.cssText = `position:absolute;inset:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;color:#fff;font-size:1.8rem;font-weight:bold;opacity:0;pointer-events:none;transition:opacity 0.2s;`; w.appendChild(o); return w; }
    private showTooltip(i: number, b: HTMLElement) { if (this.activeTooltip) this.activeTooltip.remove(); const hId = this.heroes[0]?.heroId; const d = HERO_DATA[hId!]?.skills[i]; if (!d) return; const t = document.createElement('div'); t.className = 'skill-tooltip'; t.innerHTML = `<h3>${d.name}</h3><div class="type">${d.type}</div><p>${d.desc}</p>`; b.parentElement?.appendChild(t); this.activeTooltip = t; }
    private toggleSpeed() { this.battleSpeed = this.battleSpeed === 2 ? 3 : 2; if (this.speedBtn) this.speedBtn.innerText = `${this.battleSpeed}x`; }
    private updateHUD() { if (this.heroes.length === 0) return; const hero = this.heroes[0]; const u = (i: number, v: number) => { if (this.skillBtns[i]) { const o = this.skillBtns[i].querySelector('.cd-overlay') as HTMLElement; const w = this.skillBtns[i]; if (v > 0) { o.style.opacity = '1'; o.innerText = v.toString(); w.style.filter = 'grayscale(1)'; } else { o.style.opacity = '0'; w.style.filter = 'none'; } } }; u(0, hero.cooldowns.skill1); u(1, hero.cooldowns.skill2); u(2, hero.cooldowns.skill3); u(3, hero.cooldowns.ult); }

    private createBattleEntity(id: string, assetName: string, level: string, color: string, spriteConfig: HeroSpriteConfig): BattleEntity {
        const heroId = ASSET_TO_HERO_ID[assetName] || 'oryx_mage';
        const data = HERO_DATA[heroId];
        const name = data.name;
        const isMelee = MELEE_CLASSES.includes(data.class);

        const container = document.createElement('div'); container.style.cssText = `display: flex; flex-direction: column; align-items: center; position: relative; z-index: 10;`;
        const overheadUI = document.createElement('div'); overheadUI.style.cssText = `display: flex; align-items: center; gap: 8px; margin-bottom: -110px; z-index: 20; pointer-events: none; padding-bottom: 20px;`;

        const levelText = document.createElement('div'); levelText.innerText = level;
        levelText.style.cssText = `color: #fff; font-size: 1.2rem; font-weight: 900; line-height: 1; text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; font-family: 'SF Pro Display';`;
        overheadUI.appendChild(levelText);

        const elementIcon = document.createElement('img'); elementIcon.src = data.icon;
        elementIcon.style.cssText = `width: 24px; height: 24px; background: #000; border-radius: 50%; display: block; border: 1px solid #fff; object-fit: contain; padding: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);`;
        overheadUI.appendChild(elementIcon);

        const barsContainer = document.createElement('div'); barsContainer.style.cssText = `display: flex; flex-direction: column; gap: 2px; position:relative;`;
        const statusContainer = document.createElement('div');
        statusContainer.style.cssText = `position: absolute; bottom: 100%; left: 0; width: 100%; display: flex; gap: 2px; margin-bottom: 2px;`;
        barsContainer.appendChild(statusContainer);

        const hpBarTrack = document.createElement('div'); hpBarTrack.style.cssText = `width: 100px; height: 10px; background: #000; border: 1px solid rgba(255,255,255,0.3); border-radius: 2px; position: relative; overflow: hidden;`;
        const hpBarFill = document.createElement('div'); hpBarFill.style.cssText = `width: 100%; height: 100%; background: ${id === 'enemy' ? '#ef4444' : '#4ade80'}; transition: width 0.2s ease-out;`;
        hpBarTrack.appendChild(hpBarFill); barsContainer.appendChild(hpBarTrack);

        const apBarTrack = document.createElement('div'); apBarTrack.style.cssText = `width: 100px; height: 6px; background: #000; border: 1px solid rgba(255,255,255,0.3); border-radius: 2px; position: relative; overflow: hidden;`;
        const apBarFill = document.createElement('div'); apBarFill.style.cssText = `width: 0%; height: 100%; background: #fbbf24; transition: width 0.1s linear;`;
        apBarTrack.appendChild(apBarFill); barsContainer.appendChild(apBarTrack);

        overheadUI.appendChild(barsContainer); container.appendChild(overheadUI);

        const spriteSize = 400;
        const sprite = document.createElement('div'); sprite.style.cssText = `width: ${spriteSize}px; height: ${spriteSize}px; background-size: ${spriteConfig.framesPerRow * spriteSize}px auto; background-repeat: no-repeat; background-position: 0 0; image-rendering: pixelated; filter: drop-shadow(0 0 30px ${color}40);`;
        container.appendChild(sprite);
        const shadow = document.createElement('div'); shadow.style.cssText = `width: 200px; height: 20px; background: rgba(0,0,0,0.4); border-radius: 50%; margin-top: -40px; z-index: -1; filter: blur(5px);`;
        container.appendChild(shadow);

        const stats = getStatsForLevel(heroId, parseInt(level));

        return {
            id, name, maxHp: stats.hp, hp: stats.hp, level: parseInt(level),
            element: container, spriteEl: sprite, hpBarFill, apBarFill, statusContainer, baseConfig: spriteConfig,
            isDead: false, cooldowns: { skill1: 0, skill2: 0, skill3: 0, ult: 0 },
            currentAnim: 'idle', animFrame: 0, animTimestamp: 0, animReqId: null,
            currentAnimTotalFrames: ANIM_FRAMES.idle, loopAnim: true,
            skillIcons: data.skillIcons, stats: stats, ap: 0, effects: [], passiveCharges: 0, heroId, isMelee,
            battleStats: { damageDealt: 0, healing: 0, damageTaken: 0 }
        };
    }

    private createEnemyEntity(enemyDef: EnemyDefinition, level: number): BattleEntity {
        const stats = getEnemyStatsForLevel(enemyDef, level);
        const name = enemyDef.displayName;
        const color = enemyDef.type === 'boss' ? '#ff0000' : enemyDef.type === 'elite' ? '#fbbf24' : '#ef4444';
        const isMelee = true; // Treant is melee

        const container = document.createElement('div');
        container.style.cssText = `display: flex; flex-direction: column; align-items: center; position: relative; z-index: 10;`;

        const overheadUI = document.createElement('div');
        overheadUI.style.cssText = `display: flex; align-items: center; gap: 8px; margin-bottom: -110px; z-index: 20; pointer-events: none; padding-bottom: 20px;`;

        const levelText = document.createElement('div');
        levelText.innerText = String(level);
        levelText.style.cssText = `color: #fff; font-size: 1.2rem; font-weight: 900; line-height: 1; text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; font-family: 'SF Pro Display';`;
        overheadUI.appendChild(levelText);

        // Enemy type badge
        if (enemyDef.type !== 'normal') {
            const badge = document.createElement('div');
            badge.innerText = enemyDef.type === 'boss' ? '💀' : '⚔️';
            badge.style.cssText = `font-size: 1.5rem;`;
            overheadUI.appendChild(badge);
        }

        const barsContainer = document.createElement('div');
        barsContainer.style.cssText = `display: flex; flex-direction: column; gap: 2px; position:relative;`;

        const statusContainer = document.createElement('div');
        statusContainer.style.cssText = `position: absolute; bottom: 100%; left: 0; width: 100%; display: flex; gap: 2px; margin-bottom: 2px;`;
        barsContainer.appendChild(statusContainer);

        const hpBarTrack = document.createElement('div');
        hpBarTrack.style.cssText = `width: 120px; height: 12px; background: #000; border: 1px solid rgba(255,255,255,0.3); border-radius: 2px; position: relative; overflow: hidden;`;
        const hpBarFill = document.createElement('div');
        hpBarFill.style.cssText = `width: 100%; height: 100%; background: ${color}; transition: width 0.2s ease-out;`;
        hpBarTrack.appendChild(hpBarFill);
        barsContainer.appendChild(hpBarTrack);

        const apBarTrack = document.createElement('div');
        apBarTrack.style.cssText = `width: 120px; height: 6px; background: #000; border: 1px solid rgba(255,255,255,0.3); border-radius: 2px; position: relative; overflow: hidden;`;
        const apBarFill = document.createElement('div');
        apBarFill.style.cssText = `width: 0%; height: 100%; background: #fbbf24; transition: width 0.1s linear;`;
        apBarTrack.appendChild(apBarFill);
        barsContainer.appendChild(apBarTrack);

        overheadUI.appendChild(barsContainer);
        container.appendChild(overheadUI);

        // Create enemy sprite
        const spriteSize = enemyDef.sprite.frameSize || 512;
        const framesPerRow = enemyDef.sprite.animations.idle.framesPerRow || 8;
        const idleAnim = enemyDef.sprite.animations.idle;
        const spritePath = `${enemyDef.sprite.basePath}${idleAnim.file}`;

        const sprite = document.createElement('div');
        sprite.style.cssText = `
            width: ${spriteSize}px; 
            height: ${spriteSize}px; 
            background-image: url('${spritePath}');
            background-size: ${framesPerRow * spriteSize}px auto; 
            background-repeat: no-repeat; 
            background-position: 0 0; 
            image-rendering: auto; 
            filter: drop-shadow(0 0 30px ${color}40);
            transform: scaleX(-1);
        `;
        container.appendChild(sprite);

        const shadow = document.createElement('div');
        shadow.style.cssText = `width: 200px; height: 20px; background: rgba(0,0,0,0.4); border-radius: 50%; margin-top: -40px; z-index: -1; filter: blur(5px);`;
        container.appendChild(shadow);

        // Create a fake HeroSpriteConfig for compatibility
        const baseConfig: HeroSpriteConfig = {
            spritesheetPath: spritePath,
            frameWidth: spriteSize,
            frameHeight: spriteSize,
            framesPerRow: framesPerRow,
            totalFrames: idleAnim.frames
        };

        // Store enemy definition for animation lookups
        (container as any).enemyDef = enemyDef;

        return {
            id: 'enemy',
            name,
            maxHp: stats.hp,
            hp: stats.hp,
            level,
            element: container,
            spriteEl: sprite,
            hpBarFill,
            apBarFill,
            statusContainer,
            baseConfig,
            isDead: false,
            cooldowns: { skill1: 0, skill2: 0, skill3: 0, ult: 0 },
            currentAnim: 'idle',
            animFrame: 0,
            animTimestamp: 0,
            animReqId: null,
            currentAnimTotalFrames: idleAnim.frames,
            loopAnim: true,
            skillIcons: [],
            stats,
            ap: 0,
            effects: [],
            passiveCharges: 0,
            heroId: enemyDef.id,
            isMelee,
            battleStats: { damageDealt: 0, healing: 0, damageTaken: 0 }
        };
    }

    private playEnemyAnim(entity: BattleEntity, type: string, loop: boolean = true, onComplete?: () => void) {
        if (entity.isDead && type !== 'dead') return;
        if (entity.animReqId) { cancelAnimationFrame(entity.animReqId); entity.animReqId = null; }

        // Get enemy definition from stored data
        const enemyDef = (entity.element as any).enemyDef as EnemyDefinition | undefined;
        if (!enemyDef) {
            // Fallback to regular playAnim for hero entities
            this.playAnim(entity, type, loop, onComplete);
            return;
        }

        // Map hero animation types to enemy animation types
        const enemyAnimType = ENEMY_ANIM_MAP[type] || 'idle';
        const animConfig = enemyDef.sprite.animations[enemyAnimType as keyof typeof enemyDef.sprite.animations];

        if (!animConfig) {
            console.warn(`[Battle] No animation found for ${enemyAnimType}, falling back to idle`);
            return;
        }

        entity.currentAnim = type;
        const newPath = `${enemyDef.sprite.basePath}${animConfig.file}`;
        entity.spriteEl.style.backgroundImage = `url('${newPath}')`;
        entity.currentAnimTotalFrames = animConfig.frames;
        entity.loopAnim = loop;
        entity.onAnimComplete = onComplete;
        entity.animFrame = 0;
        entity.animTimestamp = 0;

        const spriteSize = enemyDef.sprite.frameSize || 512;
        const framesPerRow = animConfig.framesPerRow;
        entity.spriteEl.style.backgroundSize = `${framesPerRow * spriteSize}px auto`;

        const loopFn = (timestamp: number) => {
            if (!entity.animTimestamp) entity.animTimestamp = timestamp;
            if (timestamp - entity.animTimestamp > 1000 / (FPS * this.battleSpeed)) {
                entity.animFrame++;
                entity.animTimestamp = timestamp;
                if (entity.animFrame >= entity.currentAnimTotalFrames) {
                    if (entity.loopAnim) entity.animFrame = 0;
                    else {
                        entity.animFrame = entity.currentAnimTotalFrames - 1;
                        if (entity.onAnimComplete) entity.onAnimComplete();
                        return;
                    }
                }
                const col = entity.animFrame % framesPerRow;
                const row = Math.floor(entity.animFrame / framesPerRow);
                entity.spriteEl.style.backgroundPosition = `-${col * spriteSize}px -${row * spriteSize}px`;
            }
            entity.animReqId = requestAnimationFrame(loopFn);
        };
        entity.animReqId = requestAnimationFrame(loopFn);
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

    public close() {
        if (this.battleLoopId) cancelAnimationFrame(this.battleLoopId);
        this.heroes.forEach(h => { if (h.animReqId) cancelAnimationFrame(h.animReqId); });
        this.enemies.forEach(e => { if (e.animReqId) cancelAnimationFrame(e.animReqId); });
        this.container.style.transition = 'opacity 0.3s ease'; this.container.style.opacity = '0';
        setTimeout(() => { this.container.remove(); this.onClose(); }, 300);
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
            margin-bottom: 30px; letter-spacing: 2px;
            transform: scale(0.5); opacity: 0;
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        `;

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
        overlay.appendChild(rewardsContainer);
        overlay.appendChild(btnContainer);

        const handleComplete = () => {
            if (this.onComplete) {
                this.onComplete({
                    win,
                    isAuto: this.isAuto,
                    rewards: calculatedRewards, // Pass dynamic rewards back
                    finalSpeed: this.battleSpeed
                });
            } else {
                this.close();
            }
        };

        btn.onclick = () => handleComplete();

        // Auto Continue Logic
        if (win && this.isAuto) {
            let countdown = 3;
            // Create Cancel Button (Red X or "Stop")
            const stopBtn = document.createElement('button');
            stopBtn.innerText = "Stop Auto";
            stopBtn.style.cssText = `
                padding: 15px 30px; font-size: 1.2rem; font-weight: bold;
                background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
                border: 2px solid #f87171; color: white; border-radius: 30px;
                cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.4);
                transition: transform 0.1s;
            `;

            // Insert Stop button before Continue button
            btnContainer.insertBefore(stopBtn, btn);

            btn.innerText = `Continue (${countdown})`;

            const interval = setInterval(() => {
                countdown--;
                btn.innerText = `Continue (${countdown})`;
                if (countdown <= 0) {
                    clearInterval(interval);
                    handleComplete();
                }
            }, 1000);

            stopBtn.onclick = () => {
                clearInterval(interval);
                this.isAuto = false; // Turn off auto
                this.toggleAuto(); // Update UI button state if needed (though visual is behind overlay)
                stopBtn.remove(); // Remove stop button
                btn.innerText = "Continue"; // Reset main button
            };

            // Allow manual continue to override
            btn.onclick = () => {
                clearInterval(interval);
                handleComplete();
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

        this.container.appendChild(overlay);
    }
}
