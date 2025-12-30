/**
 * Hero Progression System
 * Handles leveling, resource consumption, rank-ups, and skill unlocks
 */

// ==================== INTERFACES ====================

export interface StatMilestone {
    level: number;
    hp: number;
    atk: number;
    armor: number;
    aspd: number;
    moveSpeed: number;
}

export interface SkillRank {
    unlockLevel: number;
    damagePercent?: number;
    cooldown?: number;
    description: string;
    effect?: string;
}

export interface SkillDefinition {
    id: string;
    name: string;
    type: 'active' | 'passive' | 'ultimate';
    description: string;
    icon: string;
    ranks: SkillRank[];
}

export interface RankUpMilestone {
    levelCap: number;
    goldCost: number;
    heroPotionCost: number;
    reward: string;
    newCap: number;
    starRequirement?: number; // Required star level to unlock this promotion (undefined = no requirement)
}

export interface HeroProgressionConfig {
    id: string;
    name: string;
    displayName: string;
    role: string;
    mainStat: 'STR' | 'AGI' | 'INT';
    maxLevel: number;
    statMilestones: StatMilestone[];
    skills: SkillDefinition[];
    rankUpMilestones: RankUpMilestone[];
    baseLevelCosts: {
        gold: number;
        soulPotion: number;
    };
    costScaleFactor: number;
}

export interface HeroInstance {
    heroId: string;
    level: number;
    currentRankIndex: number;
    experience: number;
    skillLevels: Record<string, number>;
}

export interface LevelCost {
    gold: number;
    soulPotion: number;
}

export interface RankUpCost {
    gold: number;
    heroPotion: number;
}

export interface PlayerInventory {
    gold: number;
    heroPotion: number;
    soulPotion: number;
}

// ==================== ORYX HERO DEFINITION ====================

export const ORYX_HERO: HeroProgressionConfig = {
    id: 'oryx_antelope_mage',
    name: 'Oryx',
    displayName: 'Antelope Mage',
    role: 'Burst Mage / High Mobility / Glass Cannon',
    mainStat: 'INT',
    maxLevel: 250,

    // Base costs for level-up calculation
    baseLevelCosts: {
        gold: 50,
        soulPotion: 10
    },
    costScaleFactor: 1.08,

    // Stat milestones for interpolation
    statMilestones: [
        { level: 1, hp: 450, atk: 35, armor: 2, aspd: 0.8, moveSpeed: 315 },
        { level: 50, hp: 4500, atk: 350, armor: 35, aspd: 0.9, moveSpeed: 325 },
        { level: 100, hp: 12000, atk: 850, armor: 80, aspd: 1.0, moveSpeed: 340 },
        { level: 150, hp: 35000, atk: 2800, armor: 250, aspd: 1.2, moveSpeed: 360 },
        { level: 200, hp: 75000, atk: 6500, armor: 600, aspd: 1.5, moveSpeed: 380 },
        { level: 250, hp: 145000, atk: 12500, armor: 1200, aspd: 1.8, moveSpeed: 400 },
    ],

    // Skill definitions with level-gated ranks
    skills: [
        {
            id: 'horn_bolt',
            name: 'Horn Bolt',
            type: 'active',
            description: 'Fires a concentrated bolt of arcane energy from horns.',
            icon: '⚡',
            ranks: [
                { unlockLevel: 1, damagePercent: 150, cooldown: 9, description: 'Deals 150% Magic Damage.', effect: 'Single Target' },
                { unlockLevel: 81, damagePercent: 180, cooldown: 9, description: 'Deals 180% Magic Damage.', effect: 'Adds Silence (1.5s)' },
                { unlockLevel: 161, damagePercent: 220, cooldown: 9, description: 'Deals 220% Magic Damage.', effect: 'Enhanced Silence' },
                { unlockLevel: 221, damagePercent: 250, cooldown: 8, description: 'Deals 250% Magic Damage.', effect: 'Pierce Effect (70% to enemy behind)' },
            ]
        },
        {
            id: 'astral_leap',
            name: 'Astral Leap',
            type: 'active',
            description: 'Teleports to safety, leaving enemies confused.',
            icon: '🌀',
            ranks: [
                { unlockLevel: 10, damagePercent: 0, cooldown: 15, description: '20% Speed Buff after leap.', effect: 'Mobility' },
                { unlockLevel: 101, damagePercent: 0, cooldown: 12, description: '30% Speed Buff.', effect: 'Enhanced Speed' },
                { unlockLevel: 181, damagePercent: 0, cooldown: 10, description: '30% Speed Buff.', effect: 'Reduced Cooldown' },
                { unlockLevel: 241, damagePercent: 0, cooldown: 10, description: '30% Speed Buff.', effect: 'Static Trap (Stun 1.5s)' },
            ]
        },
        {
            id: 'static_hooves',
            name: 'Static Hooves',
            type: 'passive',
            description: 'Moving generates static charges. At full charge, attacks chain.',
            icon: '⚡',
            ranks: [
                { unlockLevel: 20, description: 'Bounces to 2 enemies (80% Dmg).', effect: '100 Charges' },
                { unlockLevel: 121, description: 'Reduced charge requirement.', effect: '80 Charges' },
                { unlockLevel: 201, description: 'Bounces to 3 enemies (100% Dmg).', effect: '80 Charges' },
            ]
        },
        {
            id: 'natures_wrath',
            name: "Nature's Wrath",
            type: 'ultimate',
            description: 'Channels the fury of nature, devastating all enemies.',
            icon: '🌩️',
            ranks: [
                { unlockLevel: 40, damagePercent: 400, cooldown: 30, description: '400% Area Damage.', effect: '1.5s Channel' },
                { unlockLevel: 141, damagePercent: 600, cooldown: 28, description: '600% Area Damage.', effect: '1.0s Channel' },
                { unlockLevel: 250, damagePercent: 800, cooldown: 25, description: '800% Area Damage.', effect: 'Instant Cast!' },
            ]
        }
    ],

    // Rank-up milestones (every 20 levels)
    // Star requirements: Lv20=1★, Lv40=2★, Lv60=2★, Lv80=3★, Lv100=3★, Lv120=4★, Lv140=4★, Lv160=5★
    rankUpMilestones: [
        { levelCap: 20, goldCost: 10000, heroPotionCost: 100, reward: 'Unlocks Passive: Static Hooves', newCap: 40 },
        { levelCap: 40, goldCost: 50000, heroPotionCost: 500, reward: "Unlocks Ultimate: Nature's Wrath", newCap: 60, starRequirement: 2 },
        { levelCap: 60, goldCost: 150000, heroPotionCost: 1000, reward: 'Stat Boost: +10% Base HP', newCap: 80 },
        { levelCap: 80, goldCost: 500000, heroPotionCost: 2500, reward: 'Stat Boost: +15% Base ATK', newCap: 100, starRequirement: 3 },
        { levelCap: 100, goldCost: 1500000, heroPotionCost: 5000, reward: 'Skill 2 Enhanced: Reduced Cooldown', newCap: 120 },
        { levelCap: 120, goldCost: 5000000, heroPotionCost: 10000, reward: 'Passive Rank Up: Charge Reduction', newCap: 140, starRequirement: 4 },
        { levelCap: 140, goldCost: 15000000, heroPotionCost: 20000, reward: 'Ultimate Rank Up: 600% Damage', newCap: 160 },
        { levelCap: 160, goldCost: 50000000, heroPotionCost: 30000, reward: 'Skill 1 Rank Up: Enhanced Damage', newCap: 180, starRequirement: 5 },
        { levelCap: 180, goldCost: 100000000, heroPotionCost: 40000, reward: 'Skill 2 Rank Up: Faster Leap', newCap: 200 },
        { levelCap: 200, goldCost: 500000000, heroPotionCost: 50000, reward: 'Passive Rank Up: Triple Bounce', newCap: 220 },
        { levelCap: 220, goldCost: 1000000000, heroPotionCost: 75000, reward: 'Skill 1 Rank Up: Pierce Effect', newCap: 240 },
        { levelCap: 240, goldCost: 5000000000, heroPotionCost: 100000, reward: 'Final Stat Boost: All Stats +20%', newCap: 250 },
    ]
};

// ==================== SABLE HERO DEFINITION ====================

export const SABLE_HERO: HeroProgressionConfig = {
    id: 'sable_antelope_ranger',
    name: 'Sable',
    displayName: 'Antelope Ranger',
    role: 'Physical Marksman / Single Target DPS',
    mainStat: 'AGI',
    maxLevel: 250,

    // Base costs for level-up calculation
    baseLevelCosts: {
        gold: 50,
        soulPotion: 10
    },
    costScaleFactor: 1.08,

    // Stat milestones for interpolation
    statMilestones: [
        { level: 1, hp: 480, atk: 42, armor: 4, aspd: 0.9, moveSpeed: 330 },
        { level: 50, hp: 5500, atk: 400, armor: 50, aspd: 1.1, moveSpeed: 345 },
        { level: 100, hp: 13500, atk: 950, armor: 120, aspd: 1.4, moveSpeed: 360 },
        { level: 150, hp: 55000, atk: 4500, armor: 600, aspd: 1.9, moveSpeed: 380 },
        { level: 200, hp: 105000, atk: 8500, armor: 1400, aspd: 2.3, moveSpeed: 400 },
        { level: 250, hp: 165000, atk: 13800, armor: 2400, aspd: 2.8, moveSpeed: 420 },
    ],

    // Skill definitions with level-gated ranks
    skills: [
        {
            id: 'wind_piercer',
            name: 'Wind-Piercer',
            type: 'active',
            description: 'Fires a high-damage projectile that pierces through the wind.',
            icon: '🏹',
            ranks: [
                { unlockLevel: 1, damagePercent: 140, cooldown: 8, description: 'Deals 140% Physical Damage.', effect: 'Single Target' },
                { unlockLevel: 81, damagePercent: 170, cooldown: 8, description: 'Deals 170% Physical Damage.', effect: 'Enhanced Damage' },
                { unlockLevel: 161, damagePercent: 200, cooldown: 8, description: 'Deals 200% Physical Damage.', effect: 'Piercing Shot' },
                { unlockLevel: 221, damagePercent: 200, cooldown: 7, description: 'Deals 200% Physical Damage.', effect: '+30% Crit Rate' },
            ]
        },
        {
            id: 'back_kick_vault',
            name: 'Back-Kick Vault',
            type: 'active',
            description: 'Delivers a powerful kick that knocks back enemies, then vaults backward to safety.',
            icon: '🦵',
            ranks: [
                { unlockLevel: 10, damagePercent: 80, cooldown: 12, description: 'Knockback + Escape.', effect: 'Mobility' },
                { unlockLevel: 101, damagePercent: 100, cooldown: 12, description: 'Double knockback distance.', effect: 'Enhanced Knockback' },
                { unlockLevel: 181, damagePercent: 120, cooldown: 9, description: 'Reduced cooldown.', effect: 'Faster Recovery' },
                { unlockLevel: 241, damagePercent: 150, cooldown: 9, description: '2s Stun to kicked target.', effect: 'Stunning Kick' },
            ]
        },
        {
            id: 'hunters_mark',
            name: "Hunter's Mark",
            type: 'passive',
            description: 'Consecutive hits on the same target increase damage dealt.',
            icon: '🎯',
            ranks: [
                { unlockLevel: 20, description: '+3% Damage per stack (Max 5 stacks).', effect: '+15% Max Damage' },
                { unlockLevel: 121, description: '+5% Damage per stack (Max 5 stacks).', effect: '+25% Max Damage' },
                { unlockLevel: 201, description: '+5% Damage per stack (Max 10 stacks).', effect: '+50% Max Damage' },
            ]
        },
        {
            id: 'spirit_barrage',
            name: 'Spirit Barrage',
            type: 'ultimate',
            description: 'Channels a rapid barrage of spirit arrows at a single target.',
            icon: '✨',
            ranks: [
                { unlockLevel: 40, damagePercent: 400, cooldown: 25, description: '10 Arrows (40% dmg each).', effect: '2.5s Channel' },
                { unlockLevel: 141, damagePercent: 600, cooldown: 22, description: '15 Arrows (40% dmg each).', effect: '2s Channel' },
                { unlockLevel: 250, damagePercent: 800, cooldown: 20, description: '20 Arrows. If target dies, arrows seek next target.', effect: 'Seeking Arrows' },
            ]
        }
    ],

    // Rank-up milestones (every 20 levels)
    // Star requirements: Lv20=1★, Lv40=2★, Lv60=2★, Lv80=3★, Lv100=3★, Lv120=4★, Lv140=4★, Lv160=5★
    rankUpMilestones: [
        { levelCap: 20, goldCost: 10000, heroPotionCost: 100, reward: "Unlocks Passive: Hunter's Mark", newCap: 40 },
        { levelCap: 40, goldCost: 50000, heroPotionCost: 500, reward: 'Unlocks Ultimate: Spirit Barrage', newCap: 60, starRequirement: 2 },
        { levelCap: 60, goldCost: 150000, heroPotionCost: 1000, reward: 'Stat Boost: +10% Base HP', newCap: 80 },
        { levelCap: 80, goldCost: 500000, heroPotionCost: 2500, reward: 'Stat Boost: +15% Base ATK', newCap: 100, starRequirement: 3 },
        { levelCap: 100, goldCost: 1500000, heroPotionCost: 5000, reward: 'Skill 2 Enhanced: Double Knockback', newCap: 120 },
        { levelCap: 120, goldCost: 5000000, heroPotionCost: 10000, reward: 'Passive Rank Up: +5% per Stack', newCap: 140, starRequirement: 4 },
        { levelCap: 140, goldCost: 15000000, heroPotionCost: 20000, reward: 'Ultimate Rank Up: 15 Arrows', newCap: 160 },
        { levelCap: 160, goldCost: 50000000, heroPotionCost: 30000, reward: 'Skill 1 Rank Up: 200% Damage', newCap: 180, starRequirement: 5 },
        { levelCap: 180, goldCost: 100000000, heroPotionCost: 40000, reward: 'Skill 2 Rank Up: Reduced Cooldown', newCap: 200 },
        { levelCap: 200, goldCost: 500000000, heroPotionCost: 50000, reward: 'Passive Rank Up: Max 10 Stacks', newCap: 220 },
        { levelCap: 220, goldCost: 1000000000, heroPotionCost: 75000, reward: 'Skill 1 Rank Up: +30% Crit', newCap: 240 },
        { levelCap: 240, goldCost: 5000000000, heroPotionCost: 100000, reward: 'Final Stat Boost: All Stats +20%', newCap: 250 },
    ]
};

// ==================== HERO PROGRESSION MANAGER ====================

export class HeroProgressionManager {
    private config: HeroProgressionConfig;
    private heroInstance: HeroInstance;

    constructor(config: HeroProgressionConfig, instance?: HeroInstance) {
        this.config = config;
        this.heroInstance = instance || {
            heroId: config.id,
            level: 1,
            currentRankIndex: 0,
            experience: 0,
            skillLevels: {}
        };
    }

    // ==================== STAT CALCULATION ====================

    /**
     * Interpolates stats between milestones using exponential scaling
     */
    getStatsAtLevel(level: number): StatMilestone {
        const milestones = this.config.statMilestones;

        // Find surrounding milestones
        let lower = milestones[0];
        let upper = milestones[milestones.length - 1];

        for (let i = 0; i < milestones.length - 1; i++) {
            if (level >= milestones[i].level && level <= milestones[i + 1].level) {
                lower = milestones[i];
                upper = milestones[i + 1];
                break;
            }
        }

        // Progressive interpolation factor (slightly exponential curve)
        const range = upper.level - lower.level;
        const progress = (level - lower.level) / range;
        const factor = Math.pow(progress, 1.1); // Slight exponential curve

        return {
            level,
            hp: Math.floor(lower.hp + (upper.hp - lower.hp) * factor),
            atk: Math.floor(lower.atk + (upper.atk - lower.atk) * factor),
            armor: Math.floor(lower.armor + (upper.armor - lower.armor) * factor),
            aspd: Math.round((lower.aspd + (upper.aspd - lower.aspd) * progress) * 100) / 100,
            moveSpeed: Math.floor(lower.moveSpeed + (upper.moveSpeed - lower.moveSpeed) * progress),
        };
    }

    // ==================== LEVEL COST CALCULATION ====================

    /**
     * Returns the cost to level up from currentLevel to currentLevel + 1
     * Formula: Base * (1.08 ^ currentLevel)
     */
    getNextLevelCost(currentLevel: number): LevelCost {
        const scale = this.config.costScaleFactor;
        const base = this.config.baseLevelCosts;

        const goldCost = Math.floor(base.gold * Math.pow(scale, currentLevel));
        const soulPotionCost = Math.floor(base.soulPotion * Math.pow(scale, currentLevel));

        return {
            gold: goldCost,
            soulPotion: soulPotionCost
        };
    }

    /**
     * Returns the total cost to level from startLevel to endLevel
     */
    getTotalLevelCost(startLevel: number, endLevel: number): LevelCost {
        let totalGold = 0;
        let totalSoulPotion = 0;

        for (let lvl = startLevel; lvl < endLevel; lvl++) {
            const cost = this.getNextLevelCost(lvl);
            totalGold += cost.gold;
            totalSoulPotion += cost.soulPotion;
        }

        return { gold: totalGold, soulPotion: totalSoulPotion };
    }

    // ==================== RANK UP LOGIC ====================

    /**
     * Returns the current level cap based on rank progress
     */
    getCurrentLevelCap(): number {
        const rankIndex = this.heroInstance.currentRankIndex;

        if (rankIndex === 0) {
            return this.config.rankUpMilestones[0].levelCap;
        }

        if (rankIndex >= this.config.rankUpMilestones.length) {
            return this.config.maxLevel;
        }

        return this.config.rankUpMilestones[rankIndex - 1].newCap;
    }

    /**
     * Returns the rank-up cost for the current milestone
     */
    getRankUpCost(): RankUpCost | null {
        const currentMilestone = this.config.rankUpMilestones[this.heroInstance.currentRankIndex];

        if (!currentMilestone) return null;

        return {
            gold: currentMilestone.goldCost,
            heroPotion: currentMilestone.heroPotionCost
        };
    }

    /**
     * Checks if hero is at a level cap and needs rank-up
     */
    isAtLevelCap(): boolean {
        return this.heroInstance.level >= this.getCurrentLevelCap();
    }

    // ==================== CAN PERFORM ACTIONS ====================

    /**
     * Checks if player can afford to level up
     */
    canLevelUp(inventory: PlayerInventory): { canLevel: boolean; reason?: string } {
        // Check if at cap
        if (this.isAtLevelCap()) {
            return { canLevel: false, reason: 'Level cap reached! Rank Up required.' };
        }

        // Check if at max level
        if (this.heroInstance.level >= this.config.maxLevel) {
            return { canLevel: false, reason: 'Max level reached!' };
        }

        // Check resources
        const cost = this.getNextLevelCost(this.heroInstance.level);

        if (inventory.gold < cost.gold) {
            return { canLevel: false, reason: `Not enough Gold (need ${cost.gold.toLocaleString()})` };
        }

        if (inventory.soulPotion < cost.soulPotion) {
            return { canLevel: false, reason: `Not enough Soul Potions (need ${cost.soulPotion.toLocaleString()})` };
        }

        return { canLevel: true };
    }

    /**
     * Checks if player can afford to rank up
     * @param inventory Player's resources
     * @param heroStars Current star level of the hero (1-5)
     */
    canRankUp(inventory: PlayerInventory, heroStars: number = 1): { canRankUp: boolean; reason?: string } {
        // Check if at cap
        if (!this.isAtLevelCap()) {
            return { canRankUp: false, reason: 'Must reach level cap first!' };
        }

        const currentMilestone = this.config.rankUpMilestones[this.heroInstance.currentRankIndex];
        if (!currentMilestone) {
            return { canRankUp: false, reason: 'No more rank-ups available!' };
        }

        // Check star requirement (Star-Gating)
        if (currentMilestone.starRequirement && heroStars < currentMilestone.starRequirement) {
            return {
                canRankUp: false,
                reason: `Evolution Required! Merge to ${currentMilestone.starRequirement}★ to break Level ${currentMilestone.levelCap}.`
            };
        }

        const cost = this.getRankUpCost();

        if (!cost) {
            return { canRankUp: false, reason: 'No more rank-ups available!' };
        }

        if (inventory.gold < cost.gold) {
            return { canRankUp: false, reason: `Not enough Gold (need ${cost.gold.toLocaleString()})` };
        }

        if (inventory.heroPotion < cost.heroPotion) {
            return { canRankUp: false, reason: `Not enough Hero Potions (need ${cost.heroPotion.toLocaleString()})` };
        }

        return { canRankUp: true };
    }

    // ==================== PERFORM ACTIONS ====================

    /**
     * Performs level up, deducting resources
     * Returns updated inventory and new stats
     */
    performLevelUp(inventory: PlayerInventory): {
        success: boolean;
        newInventory: PlayerInventory;
        newLevel: number;
        newStats: StatMilestone;
        hitCap: boolean;
        unlockedSkills: SkillDefinition[];
    } {
        const check = this.canLevelUp(inventory);

        if (!check.canLevel) {
            return {
                success: false,
                newInventory: inventory,
                newLevel: this.heroInstance.level,
                newStats: this.getStatsAtLevel(this.heroInstance.level),
                hitCap: false,
                unlockedSkills: []
            };
        }

        const cost = this.getNextLevelCost(this.heroInstance.level);

        // Deduct resources
        const newInventory: PlayerInventory = {
            gold: inventory.gold - cost.gold,
            heroPotion: inventory.heroPotion,
            soulPotion: inventory.soulPotion - cost.soulPotion
        };

        // Increase level
        this.heroInstance.level += 1;
        const newLevel = this.heroInstance.level;
        const newStats = this.getStatsAtLevel(newLevel);

        // Check for skill unlocks
        const unlockedSkills = this.getNewlyUnlockedSkills(newLevel);

        // Check if hit cap
        const hitCap = this.isAtLevelCap();

        return {
            success: true,
            newInventory,
            newLevel,
            newStats,
            hitCap,
            unlockedSkills
        };
    }

    /**
     * Performs rank up, unlocking new level cap
     */
    performRankUp(inventory: PlayerInventory): {
        success: boolean;
        newInventory: PlayerInventory;
        newLevelCap: number;
        reward: string;
    } {
        const check = this.canRankUp(inventory);

        if (!check.canRankUp) {
            return {
                success: false,
                newInventory: inventory,
                newLevelCap: this.getCurrentLevelCap(),
                reward: ''
            };
        }

        const milestone = this.config.rankUpMilestones[this.heroInstance.currentRankIndex];
        const cost = this.getRankUpCost()!;

        // Deduct resources
        const newInventory: PlayerInventory = {
            gold: inventory.gold - cost.gold,
            heroPotion: inventory.heroPotion - cost.heroPotion,
            soulPotion: inventory.soulPotion
        };

        // Advance rank
        this.heroInstance.currentRankIndex += 1;

        return {
            success: true,
            newInventory,
            newLevelCap: milestone.newCap,
            reward: milestone.reward
        };
    }

    // ==================== SKILL MANAGEMENT ====================

    /**
     * Gets all skills available at the current level
     */
    getAvailableSkills(): SkillDefinition[] {
        const level = this.heroInstance.level;

        return this.config.skills.filter(skill => {
            return skill.ranks[0].unlockLevel <= level;
        });
    }

    /**
     * Gets the current rank of a skill based on hero level
     */
    getSkillRank(skillId: string): SkillRank | null {
        const skill = this.config.skills.find(s => s.id === skillId);
        if (!skill) return null;

        const level = this.heroInstance.level;

        // Find highest unlocked rank
        let currentRank: SkillRank | null = null;
        for (const rank of skill.ranks) {
            if (rank.unlockLevel <= level) {
                currentRank = rank;
            }
        }

        return currentRank;
    }

    /**
     * Gets skills newly unlocked at a specific level
     */
    getNewlyUnlockedSkills(level: number): SkillDefinition[] {
        return this.config.skills.filter(skill => {
            return skill.ranks.some(rank => rank.unlockLevel === level);
        });
    }

    // ==================== GETTERS ====================

    getHeroInstance(): HeroInstance {
        return { ...this.heroInstance };
    }

    getConfig(): HeroProgressionConfig {
        return this.config;
    }

    getCurrentLevel(): number {
        return this.heroInstance.level;
    }

    getCurrentStats(): StatMilestone {
        return this.getStatsAtLevel(this.heroInstance.level);
    }
}

// ==================== FACTORY FUNCTION ====================

export function createOryxHero(startingLevel: number = 1, instance?: HeroInstance): HeroProgressionManager {
    if (instance) {
        return new HeroProgressionManager(ORYX_HERO, instance);
    }

    const newInstance: HeroInstance = {
        heroId: ORYX_HERO.id,
        level: startingLevel,
        currentRankIndex: 0,
        experience: 0,
        skillLevels: {}
    };

    // Calculate starting rank based on level
    for (let i = 0; i < ORYX_HERO.rankUpMilestones.length; i++) {
        if (startingLevel > ORYX_HERO.rankUpMilestones[i].levelCap) {
            newInstance.currentRankIndex = i + 1;
        }
    }

    return new HeroProgressionManager(ORYX_HERO, newInstance);
}


// ==================== RAZOR HERO DEFINITION ====================

export const RAZOR_HERO: HeroProgressionConfig = {
    id: 'razor_assassin',
    name: 'Razor',
    displayName: 'The Tuskblade',
    role: 'Burst Diver / Assassin',
    mainStat: 'AGI',
    maxLevel: 250,

    // Base costs for level-up calculation
    baseLevelCosts: {
        gold: 50,
        soulPotion: 10
    },
    costScaleFactor: 1.08,

    // Stat milestones for interpolation
    statMilestones: [
        { level: 1, hp: 550, atk: 48, armor: 5, aspd: 0.8, moveSpeed: 320 },
        { level: 50, hp: 6000, atk: 450, armor: 45, aspd: 0.9, moveSpeed: 330 },
        { level: 100, hp: 15000, atk: 1100, armor: 100, aspd: 1.1, moveSpeed: 345 },
        { level: 150, hp: 55000, atk: 5500, armor: 500, aspd: 1.4, moveSpeed: 370 },
        { level: 200, hp: 100000, atk: 10000, armor: 1000, aspd: 1.7, moveSpeed: 390 },
        { level: 250, hp: 155000, atk: 16500, armor: 1800, aspd: 2.0, moveSpeed: 410 },
    ],

    // Skill definitions with level-gated ranks
    skills: [
        {
            id: 'tusk_gore',
            name: 'Tusk Gore',
            type: 'active',
            description: 'A vicious gore attack that causes bleeding.',
            icon: '🩸',
            ranks: [
                { unlockLevel: 1, damagePercent: 160, cooldown: 6, description: '160% Dmg + Bleed (3s).', effect: 'Bleed' },
                { unlockLevel: 81, damagePercent: 200, cooldown: 6, description: '200% Dmg.', effect: 'Increased Dmg' },
                { unlockLevel: 161, damagePercent: 200, cooldown: 6, description: 'Bleed Duration 5s.', effect: 'Longer Bleed' },
                { unlockLevel: 221, damagePercent: 200, cooldown: 6, description: 'Double Dmg if Bleeding.', effect: 'Crit Condition' },
            ]
        },
        {
            id: 'wild_charge',
            name: 'Wild Charge',
            type: 'active',
            description: 'Charges towards the furthest enemy, damaging enemies in path.',
            icon: '🐗',
            ranks: [
                { unlockLevel: 10, damagePercent: 120, cooldown: 14, description: 'Charge Furthest Enemy (120% Dmg Path).', effect: 'Mobility' },
                { unlockLevel: 101, damagePercent: 120, cooldown: 14, description: 'Gain Shield (15% Max HP).', effect: 'Shield' },
                { unlockLevel: 181, damagePercent: 120, cooldown: 10, description: 'Reduced Cooldown (10s).', effect: 'Faster Charge' },
                { unlockLevel: 241, damagePercent: 120, cooldown: 10, description: 'Knock Up Target 1.5s.', effect: 'CC' },
            ]
        },
        {
            id: 'blood_scent',
            name: 'Blood Scent',
            type: 'passive',
            description: 'Senses weakened enemies, dealing more damage.',
            icon: '👃',
            ranks: [
                { unlockLevel: 20, description: '+20% Dmg vs Targets < 50% HP.', effect: 'Executioner' },
                { unlockLevel: 121, description: 'Trigger Threshold < 60% HP.', effect: 'Earlier Trigger' },
                { unlockLevel: 201, description: 'On Kill: Heal 20% Max HP.', effect: 'Sustain' },
            ]
        },
        {
            id: 'guillotine_breaker',
            name: 'Guillotine Breaker',
            type: 'ultimate',
            description: 'A devastating finishing move.',
            icon: '🪓',
            ranks: [
                { unlockLevel: 40, damagePercent: 500, cooldown: 40, description: '500% True Dmg.', effect: 'True Damage' },
                { unlockLevel: 141, damagePercent: 750, cooldown: 35, description: '750% True Dmg.', effect: 'Massive Dmg' },
                { unlockLevel: 250, damagePercent: 750, cooldown: 35, description: 'If Kill: Reset Cooldown.', effect: 'Reset' },
            ]
        }
    ],

    // Rank-up milestones (every 20 levels)
    // Star requirements: Lv20=1★, Lv40=2★, Lv60=2★, Lv80=3★, Lv100=3★, Lv120=4★, Lv140=4★, Lv160=5★
    rankUpMilestones: [
        { levelCap: 20, goldCost: 10000, heroPotionCost: 100, reward: "Unlocks Passive: Blood Scent", newCap: 40 },
        { levelCap: 40, goldCost: 50000, heroPotionCost: 500, reward: 'Unlocks Ultimate: Guillotine Breaker', newCap: 60, starRequirement: 2 },
        { levelCap: 60, goldCost: 150000, heroPotionCost: 1000, reward: 'Stat Boost: +10% Base HP', newCap: 80 },
        { levelCap: 80, goldCost: 500000, heroPotionCost: 2500, reward: 'Stat Boost: +15% Base ATK', newCap: 100, starRequirement: 3 },
        { levelCap: 100, goldCost: 1500000, heroPotionCost: 5000, reward: 'Skill 2 Enhanced: Gain Shield', newCap: 120 },
        { levelCap: 120, goldCost: 5000000, heroPotionCost: 10000, reward: 'Passive Rank Up: Threshold < 60%', newCap: 140, starRequirement: 4 },
        { levelCap: 140, goldCost: 15000000, heroPotionCost: 20000, reward: 'Ultimate Rank Up: 750% Damage', newCap: 160 },
        { levelCap: 160, goldCost: 50000000, heroPotionCost: 30000, reward: 'Skill 1 Rank Up: Bleed 5s', newCap: 180, starRequirement: 5 },
        { levelCap: 180, goldCost: 100000000, heroPotionCost: 40000, reward: 'Skill 2 Rank Up: Reduced Cooldown', newCap: 200 },
        { levelCap: 200, goldCost: 500000000, heroPotionCost: 50000, reward: 'Passive Rank Up: Heal on Kill', newCap: 220 },
        { levelCap: 220, goldCost: 1000000000, heroPotionCost: 75000, reward: 'Skill 1 Rank Up: Double Dmg if Bleeding', newCap: 240 },
        { levelCap: 240, goldCost: 5000000000, heroPotionCost: 100000, reward: 'Skill 2 Rank Up: Knock Up', newCap: 250 },
    ]
};

export function createRazorHero(startingLevel: number = 1, instance?: HeroInstance): HeroProgressionManager {
    if (instance) {
        return new HeroProgressionManager(RAZOR_HERO, instance);
    }

    const newInstance: HeroInstance = {
        heroId: RAZOR_HERO.id,
        level: startingLevel,
        currentRankIndex: 0,
        experience: 0,
        skillLevels: {}
    };

    // Calculate starting rank based on level
    for (let i = 0; i < RAZOR_HERO.rankUpMilestones.length; i++) {
        if (startingLevel > RAZOR_HERO.rankUpMilestones[i].levelCap) {
            newInstance.currentRankIndex = i + 1;
        }
    }

    return new HeroProgressionManager(RAZOR_HERO, newInstance);
}

export function createSableHero(startingLevel: number = 1, instance?: HeroInstance): HeroProgressionManager {
    if (instance) {
        return new HeroProgressionManager(SABLE_HERO, instance);
    }

    const newInstance: HeroInstance = {
        heroId: SABLE_HERO.id,
        level: startingLevel,
        currentRankIndex: 0,
        experience: 0,
        skillLevels: {}
    };

    // Calculate starting rank based on level
    for (let i = 0; i < SABLE_HERO.rankUpMilestones.length; i++) {
        if (startingLevel > SABLE_HERO.rankUpMilestones[i].levelCap) {
            newInstance.currentRankIndex = i + 1;
        }
    }

    return new HeroProgressionManager(SABLE_HERO, newInstance);
}

