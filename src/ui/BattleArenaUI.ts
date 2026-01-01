import { HERO_ASSETS, HeroSpriteConfig } from '../data/HeroAssetsMap';
import { EnemyDefinition, getEnemyById, getEnemyStatsForLevel } from '../data/EnemyDefinitions';

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
}

export class BattleArenaUI {
    private container: HTMLElement;
    private loadingScreen: HTMLElement | null = null;
    private arenaScreen: HTMLElement | null = null;
    private onClose: () => void;
    private heroAssetName: string;
    private enemyId: string;
    private stageLevel: number;

    private hero: BattleEntity | null = null;
    private enemy: BattleEntity | null = null;

    // Core Logic
    private battleSpeed: number = 2;
    private isPaused: boolean = false;
    private isAnimatingAction: boolean = false;
    private battleLoopId: number | null = null;
    private lastTick: number = 0;

    // HUD
    private skillBtns: HTMLElement[] = [];
    private speedBtn: HTMLElement | null = null;
    private activeTooltip: HTMLElement | null = null;
    private battleLog: HTMLElement | null = null;

    private static NAME_ALIASES: Record<string, string> = {
        'Oryx': 'Antelope Mage',
        'Sable': 'Antelope Ranger',
        // Fallbacks for safety
        'Mage': 'Antelope Mage',
        'Ranger': 'Antelope Ranger'
    };

    constructor(heroAssetName: string, onClose: () => void, enemyId: string = 'treant', stageLevel: number = 10) {
        this.heroAssetName = BattleArenaUI.NAME_ALIASES[heroAssetName] || heroAssetName;
        this.enemyId = enemyId;
        this.stageLevel = stageLevel;
        this.onClose = onClose;
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
            const configLeft = HERO_ASSETS.find(h => h.name === `${this.heroAssetName} Left`);
            const enemyName = this.heroAssetName === 'Antelope Mage' ? 'Antelope Ranger' : 'Antelope Mage';
            const configRight = HERO_ASSETS.find(h => h.name === enemyName);

            const assetsToLoad: string[] = [];
            const addAnimPaths = (basePath: string) => { if (basePath) Object.keys(ANIM_FRAMES).forEach(anim => assetsToLoad.push(basePath.replace('idle', anim))); };

            if (configLeft?.sprite2D) addAnimPaths(configLeft.sprite2D.spritesheetPath);
            if (configRight?.sprite2D) addAnimPaths(configRight.sprite2D.spritesheetPath);

            const heroId = ASSET_TO_HERO_ID[this.heroAssetName];
            const heroData = HERO_DATA[heroId];
            if (configLeft?.sprite2D?.spritesheetPath && heroData) {
                const parts = configLeft.sprite2D.spritesheetPath.split('/');
                if (parts.length > 4) heroData.skillIcons.forEach((icon: string) => assetsToLoad.push(`${parts.slice(0, 4).join('/')}/skills/${icon}`));
            }

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
        this.arenaScreen.style.cssText = `position: absolute; inset: 0; background: url('/assets/Background/arena.jpg') center/cover;`;
        this.arenaScreen.appendChild(Object.assign(document.createElement('div'), { style: `position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4);` }));

        const battleContainer = document.createElement('div');
        battleContainer.style.cssText = `position: relative; width: 100%; height: 100%; z-index: 1;`;
        battleContainer.onclick = (e) => {
            if (this.activeTooltip && !(e.target as HTMLElement).closest('.hud-btn')) {
                this.activeTooltip.remove(); this.activeTooltip = null;
            }
        };

        const heroConfigLeft = HERO_ASSETS.find(h => h.name === `${this.heroAssetName} Left`);

        // Get enemy from definitions
        const enemyDef = getEnemyById(this.enemyId);

        if (heroConfigLeft?.sprite2D) {
            this.hero = this.createBattleEntity('hero', this.heroAssetName, '250', '#22c55e', heroConfigLeft.sprite2D);
            Object.assign(this.hero.element.style, { position: 'absolute', bottom: '25%', left: '25%' });
            battleContainer.appendChild(this.hero.element);
            this.playAnim(this.hero, 'idle');

            // Create enemy entity from enemy definition
            if (enemyDef) {
                this.enemy = this.createEnemyEntity(enemyDef, this.stageLevel);
            } else {
                // Fallback to hero as enemy
                const enemyName = this.heroAssetName === 'Antelope Mage' ? 'Antelope Ranger' : 'Antelope Mage';
                const configRight = HERO_ASSETS.find(h => h.name === enemyName);
                if (configRight?.sprite2D) {
                    this.enemy = this.createBattleEntity('enemy', enemyName, String(this.stageLevel), '#ef4444', configRight.sprite2D);
                }
            }

            if (this.enemy) {
                Object.assign(this.enemy.element.style, { position: 'absolute', top: '35%', right: '25%' });
                battleContainer.appendChild(this.enemy.element);
                this.playEnemyAnim(this.enemy, 'idle');
            }

            this.createHUD(battleContainer);
            this.createBattleLog(battleContainer);
            this.createStatsPanel(battleContainer);

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
            @keyframes floatUpFade { 0% { transform: translateY(0); opacity: 0; } 20% { transform: translateY(-20px); opacity: 1; } 100% { transform: translateY(-60px); opacity: 0; } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .floating-damage { position: absolute; font-family: 'SF Pro Display'; font-weight: 900; color: #fff; text-shadow: 0 0 5px #000; animation: floatUpFade 1s forwards; z-index: 1000; font-size: 2rem; }
            .hud-btn { transition: transform 0.1s; cursor: pointer; }
            .hud-btn:active { transform: scale(0.95); }
            .battle-log { position: absolute; top: 100px; left: 30px; width: 350px; height: 200px; background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%); border-left: 4px solid #fbbf24; border-radius: 4px; padding: 15px; overflow-y: auto; font-family: 'SF Pro Display'; font-size: 0.9rem; color: #d1d5db; display: flex; flex-direction: column; gap: 5px; scrollbar-width: none; z-index: 50; pointer-events: none; mask-image: linear-gradient(to bottom, transparent, black 10%, black 100%); }
            .log-entry { animation: fadeInUp 0.3s ease-out; }
            .stats-panel { position: absolute; bottom: 40px; left: 40px; width: 280px; background: rgba(16,16,24,0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; z-index: 50; backdrop-filter: blur(5px); font-family: 'SF Pro Display'; color: #fff; }
            .stats-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; }
            .stats-label { color: #9ca3af; font-size: 0.9rem; }
            .stats-val { font-weight: bold; color: #fbbf24; }
            .stats-header { font-size: 1.2rem; font-weight: bold; margin-bottom: 15px; }
            .skill-tooltip { position: absolute; bottom: 130px; right: 0; width: 320px; background: rgba(16, 16, 24, 0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; color: #fff; font-family: 'SF Pro Display'; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); backdrop-filter: blur(10px); animation: fadeIn 0.1s; }
        `;
        this.container.appendChild(this.arenaScreen);
    }

    private gameLoop(timestamp: number) {
        if (!this.hero || !this.enemy || this.isPaused || !this.arenaScreen) return;
        const delta = timestamp - this.lastTick;
        this.lastTick = timestamp;

        if (!this.hero.isDead && !this.enemy.isDead && !this.isAnimatingAction) {
            const dt = delta * this.battleSpeed * 0.05;
            this.tickEntity(this.hero, dt);
            this.tickEntity(this.enemy, dt);

            if (this.hero.ap >= MAX_AP) {
                this.takeTurn(this.hero, this.enemy);
            } else if (this.enemy.ap >= MAX_AP) {
                this.takeTurn(this.enemy, this.hero);
            }
        }
        this.battleLoopId = requestAnimationFrame((t) => this.gameLoop(t));
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
            this.log(`${actor.name} is <span style="color:#fbbf24;font-weight:bold">STUNNED</span> and skips turn!`);
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
        if (actor.id === 'hero') this.updateHUD();

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

        const logColor = actor.id === 'hero' ? '#60a5fa' : '#f87171';
        this.log(`${actor.name} casts <span style="font-weight:bold">${skillName}</span>!`, logColor);
        if (actor.id === 'hero') this.updateHUD();

        // Animation & Movement Logic
        const performAttackAnim = () => {
            this.playAnim(actor, animType, false, () => {
                // If melee, don't auto-idle here, wait for return
                if (!actor.isMelee && !actor.isDead) this.playAnim(actor, 'idle');
            });
        };

        if (actor.isMelee) {
            // Dash to target
            // Hero is at left: 25%, Enemy at right: 25%. Gap is 50% of screen.
            // Approx pixel distance? Let's guess ~400-500px based on screen size.
            // Or use relative units? Transform is usually pixels. Let's try 300px.
            const direction = actor.id === 'hero' ? 1 : -1;
            const distance = 350; // Slide distance
            actor.element.style.transition = `transform ${250 / this.battleSpeed}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
            actor.element.style.transform = `translateX(${distance * direction}px)`;

            setTimeout(() => {
                performAttackAnim();
            }, 250 / this.battleSpeed);

            // Return to base
            setTimeout(() => {
                actor.element.style.transition = `transform ${350 / this.battleSpeed}ms ease-out`;
                actor.element.style.transform = `translateX(0px)`;
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
                this.isAnimatingAction = true;
            } else {
                setTimeout(() => { this.isAnimatingAction = false; }, 1200 / this.battleSpeed);
            }
        }, 600 / this.battleSpeed);
    }

    private applyStatus(target: BattleEntity, effect: StatusEffect) {
        target.effects.push(effect);
        this.updateStatusUI(target);
        const color = effect.type === 'stun' ? '#fbbf24' : '#34d399';
        this.log(`${target.name} gained <span style="color:${color};font-weight:bold">${effect.name}</span>!`);
        this.showFloatingText(target.element, effect.icon, false);
    }

    private updateEffects(entity: BattleEntity) {
        entity.effects.forEach(e => e.duration--);
        const expired = entity.effects.filter(e => e.duration <= 0);
        entity.effects = entity.effects.filter(e => e.duration > 0);
        if (expired.length > 0) {
            this.updateStatusUI(entity);
            expired.forEach(e => this.log(`${entity.name}'s ${e.name} wore off.`));
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

        const dmgColor = target.id === 'hero' ? '#f87171' : '#fbbf24';
        this.log(`> ${target.name} took <span class="log-damage" style="color:${dmgColor}">-${finalDamage}</span> damage.`, '#9ca3af');
        if (target.id === 'hero') document.getElementById('stats-hp')!.innerHTML = `${target.hp}/${target.maxHp}`;
    }

    private handleDeath(target: BattleEntity) {
        this.playAnim(target, 'dead', false);
        target.isDead = true;
        this.showFloatingText(this.container, target.id === 'enemy' ? 'VICTORY!' : 'DEFEAT...', true);
        this.log(target.id === 'enemy' ? "<b style='color:#fbbf24'>VICTORY!</b>" : "<b style='color:#f87171'>DEFEAT...</b>");

        // Razor On-Kill Logic (Attacker is who?)
        // We need the killer reference. handleDeath doesn't have it.
        // But in 1v1, the killer is the other entity.
        const killer = target.id === 'hero' ? this.enemy : this.hero;
        if (killer && killer.heroId === 'razor_assassin') {
            // Passive Heal (Lvl 201+)
            if (killer.level >= 201) {
                const healAmt = Math.floor(killer.maxHp * 0.2);
                killer.hp = Math.min(killer.maxHp, killer.hp + healAmt);
                killer.hpBarFill.style.width = `${(killer.hp / killer.maxHp) * 100}%`;
                this.showFloatingText(killer.element, `+${healAmt}`, false);
                this.log(`${killer.name} consumes blood! (+${healAmt} HP)`);
            }
            // Ult Reset (Lvl 250)
            if (killer.level >= 250) {
                killer.cooldowns.ult = 0;
                this.showFloatingText(killer.element, "ULT RESET!", true);
                this.updateHUD(); // If hero
            }
        }
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
    private createBattleLog(c: HTMLElement) { this.battleLog = document.createElement('div'); this.battleLog.className = 'battle-log'; c.appendChild(this.battleLog); this.log("Battle Started - Oryx vs Sable!", "#fbbf24"); }
    private log(m: string, col = '#d1d5db') { if (!this.battleLog) return; const e = document.createElement('div'); e.className = 'log-entry'; e.style.color = col; e.innerHTML = m; this.battleLog.appendChild(e); this.battleLog.scrollTop = this.battleLog.scrollHeight; }
    private createStatsPanel(c: HTMLElement) {
        if (!this.hero) return;
        const heroData = HERO_DATA[this.hero.heroId];
        const s = this.hero.stats;
        const p = document.createElement('div'); p.className = 'stats-panel';
        p.innerHTML = `<div class="stats-header">
            <div style="font-size:1.4rem;color:#fbbf24">${heroData.name}</div>
            <div style="font-size:0.9rem;color:#d1d5db;font-weight:normal">${heroData.title}</div>
            <div style="font-size:0.8rem;color:#9ca3af;margin-top:2px;font-style:italic">${heroData.role}</div>
        </div>
        <div class="stats-row"><span class="stats-label">Level</span><span class="stats-val">${this.hero.level}</span></div>
        <div class="stats-row"><span class="stats-label">Health</span><span class="stats-val" id="stats-hp">${this.hero.hp}/${this.hero.maxHp}</span></div>
        <div class="stats-row"><span class="stats-label">Attack</span><span class="stats-val">${s.atk}</span></div>
        <div class="stats-row"><span class="stats-label">Defense</span><span class="stats-val">${s.def}</span></div>
        <div class="stats-row"><span class="stats-label">Speed</span><span class="stats-val">${s.speed}</span></div>
        <div class="stats-row"><span class="stats-label">Crit Rate</span><span class="stats-val">${s.crit}</span></div>`;
        c.appendChild(p);
    }
    private createHUD(c: HTMLElement) { if (!this.hero) return; const h = document.createElement('div'); h.style.cssText = `position:absolute;bottom:40px;right:40px;display:flex;gap:15px;align-items:center;z-index:50;background:rgba(0,0,0,0.5);padding:20px;border-radius:25px;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(5px);`; const gp = (i: string) => { const p = this.hero!.baseConfig.spritesheetPath.split('/'); return `${p.slice(0, 4).join('/')}/skills/${i}`; }; const hId = this.hero.heroId; const icons = HERO_DATA[hId].skillIcons; icons.forEach((icon: string, i: number) => { const p = gp(icon); const b = this.createSkillIcon(p, i === 3); b.onclick = (e) => { e.stopPropagation(); this.showTooltip(i, b); }; h.appendChild(b); this.skillBtns.push(b); }); const s = document.createElement('div'); s.style.cssText = `width:1px;height:60px;background:rgba(255,255,255,0.2);margin:0 10px;`; h.appendChild(s); this.speedBtn = document.createElement('div'); this.speedBtn.className = 'hud-btn'; this.speedBtn.style.cssText = `width:70px;height:70px;border-radius:50%;background:rgba(0,0,0,0.6);border:2px solid #fff;color:#fff;display:flex;justify-content:center;align-items:center;font-weight:bold;font-family:'SF Pro Display';font-size:1.5rem;`; this.speedBtn.innerText = `${this.battleSpeed}x`; this.speedBtn.onclick = () => this.toggleSpeed(); h.appendChild(this.speedBtn); c.appendChild(h); this.updateHUD(); }
    private createSkillIcon(src: string, isUlt: boolean): HTMLElement { const s = isUlt ? 85 : 70; const b = isUlt ? '#fbbf24' : '#fff'; const w = document.createElement('div'); w.className = 'hud-btn'; w.style.cssText = `width:${s}px;height:${s}px;position:relative;border-radius:12px;border:2px solid ${b};background:#000;overflow:hidden;flex-shrink:0;`; const i = document.createElement('img'); i.src = src; i.style.cssText = `width:100%;height:100%;object-fit:cover;`; i.onerror = () => { i.style.display = 'none'; }; w.appendChild(i); const o = document.createElement('div'); o.className = 'cd-overlay'; o.style.cssText = `position:absolute;inset:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;color:#fff;font-size:1.8rem;font-weight:bold;opacity:0;pointer-events:none;transition:opacity 0.2s;`; w.appendChild(o); return w; }
    private showTooltip(i: number, b: HTMLElement) { if (this.activeTooltip) this.activeTooltip.remove(); const hId = this.hero?.heroId; const d = HERO_DATA[hId!]?.skills[i]; if (!d) return; const t = document.createElement('div'); t.className = 'skill-tooltip'; t.innerHTML = `<h3>${d.name}</h3><div class="type">${d.type}</div><p>${d.desc}</p>`; b.parentElement?.appendChild(t); this.activeTooltip = t; }
    private toggleSpeed() { this.battleSpeed = this.battleSpeed === 2 ? 3 : 2; if (this.speedBtn) this.speedBtn.innerText = `${this.battleSpeed}x`; }
    private updateHUD() { if (!this.hero) return; const u = (i: number, v: number) => { if (this.skillBtns[i]) { const o = this.skillBtns[i].querySelector('.cd-overlay') as HTMLElement; const w = this.skillBtns[i]; if (v > 0) { o.style.opacity = '1'; o.innerText = v.toString(); w.style.filter = 'grayscale(1)'; } else { o.style.opacity = '0'; w.style.filter = 'none'; } } }; u(0, this.hero.cooldowns.skill1); u(1, this.hero.cooldowns.skill2); u(2, this.hero.cooldowns.skill3); u(3, this.hero.cooldowns.ult); }

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
            skillIcons: data.skillIcons, stats: stats, ap: 0, effects: [], passiveCharges: 0, heroId, isMelee
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
            isMelee
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

    public close() {
        if (this.battleLoopId) cancelAnimationFrame(this.battleLoopId);
        if (this.hero?.animReqId) cancelAnimationFrame(this.hero.animReqId);
        if (this.enemy?.animReqId) cancelAnimationFrame(this.enemy.animReqId);
        this.container.style.transition = 'opacity 0.3s ease'; this.container.style.opacity = '0';
        setTimeout(() => { this.container.remove(); this.onClose(); }, 300);
    }
    public getElement(): HTMLElement { return this.container; }
}
