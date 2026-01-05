
export interface RankDefinition {
    minLevel: number;
    maxLevel: number; // Use Infinity for the last rank
    title: string;
    icon: string;
    featuresUnlocked: string[];
    squadSlots: number;
    squadLayoutDescription: string; // e.g., "Front", "Front+Mid"
}

export const RANK_DEFINITIONS: RankDefinition[] = [
    {
        minLevel: 1,
        maxLevel: 9,
        title: "Scout",
        icon: "Paw Print",
        featuresUnlocked: ["Campaign", "Summoning"],
        squadSlots: 3,
        squadLayoutDescription: "Front"
    },
    {
        minLevel: 10,
        maxLevel: 19,
        title: "Warden",
        icon: "Shield",
        featuresUnlocked: ["x2 Speed", "Daily Dungeons"],
        squadSlots: 5,
        squadLayoutDescription: "Front+Mid"
    },
    {
        minLevel: 20,
        maxLevel: 29,
        title: "Hunter",
        icon: "Crossbow",
        featuresUnlocked: ["Arena (PVP)"],
        squadSlots: 5,
        squadLayoutDescription: "Front+Mid"
    },
    {
        minLevel: 30,
        maxLevel: 39,
        title: "Alpha",
        icon: "Wolf Head",
        featuresUnlocked: ["Tower of Trials"],
        squadSlots: 7,
        squadLayoutDescription: "Back"
    },
    {
        minLevel: 40,
        maxLevel: 59,
        title: "Apex",
        icon: "T-Rex Skull",
        featuresUnlocked: ["Guilds (Packs)"],
        squadSlots: 7,
        squadLayoutDescription: "Back"
    },
    {
        minLevel: 60,
        maxLevel: 79,
        title: "Primal",
        icon: "Rune Stone",
        featuresUnlocked: ["Artifacts / Pets"],
        squadSlots: 9,
        squadLayoutDescription: "Full Grid"
    },
    {
        minLevel: 80,
        maxLevel: 99,
        title: "Celestial",
        icon: "Star Spirit",
        featuresUnlocked: ["Hell Difficulty"],
        squadSlots: 9,
        squadLayoutDescription: "Full Grid"
    },
    {
        minLevel: 100,
        maxLevel: Infinity,
        title: "Eternal",
        icon: "Infinity Wing",
        featuresUnlocked: ["Global Glory Leaderboard"],
        squadSlots: 9,
        squadLayoutDescription: "Full Grid"
    }
];

// --- ACHIEVEMENT SYSTEM ---
export type AchievementCategory = "Evolution" | "Conquest" | "Economy";

export interface AchievementDef {
    id: string;
    category: AchievementCategory;
    title: string;
    description: string;
    targetValue: number; // For progress tracking (e.g., 100 summons)
    rewardGems: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
    // A. Evolution (Growth)
    { id: "pack_leader", category: "Evolution", title: "Pack Leader", description: "Reach Rank Alpha (Lv 30)", targetValue: 30, rewardGems: 100 },
    { id: "collector_1", category: "Evolution", title: "Collector I", description: "Unlock 10 Unique Heroes", targetValue: 10, rewardGems: 50 },
    { id: "collector_2", category: "Evolution", title: "Collector II", description: "Unlock 30 Unique Heroes", targetValue: 30, rewardGems: 150 },
    { id: "collector_3", category: "Evolution", title: "Collector III", description: "Unlock 50 Unique Heroes", targetValue: 50, rewardGems: 300 },
    { id: "collector_4", category: "Evolution", title: "Collector IV", description: "Unlock 84 Unique Heroes", targetValue: 84, rewardGems: 1000 },
    { id: "awakening", category: "Evolution", title: "Awakening", description: "Create your first 6-Star (Purple) Hero", targetValue: 1, rewardGems: 200 },
    { id: "godhood", category: "Evolution", title: "Godhood", description: "Create your first 10-Star (Red Crown) Hero", targetValue: 1, rewardGems: 1000 },

    // B. Conquest (Battle)
    { id: "gatekeeper_down", category: "Conquest", title: "Gatekeeper Down", description: "Defeat Beta Sentry (Stage 10)", targetValue: 1, rewardGems: 100 },
    { id: "dragon_slayer", category: "Conquest", title: "Dragon Slayer", description: "Defeat Ignis the Consumer", targetValue: 1, rewardGems: 500 },
    { id: "tactician", category: "Conquest", title: "Tactician", description: "Win an Arena match without Slot 1 dying", targetValue: 1, rewardGems: 50 },

    // C. Economy (Grind)
    { id: "tycoon", category: "Economy", title: "Tycoon", description: "Farm 1,000,000 Gold", targetValue: 1000000, rewardGems: 200 },
    { id: "summoner", category: "Economy", title: "Summoner", description: "Perform 100 summons", targetValue: 100, rewardGems: 150 },
    { id: "inventory_manager", category: "Economy", title: "Inventory Manager", description: "Merge equipment 500 times", targetValue: 500, rewardGems: 100 }
];

// --- VIP SYSTEM ---
export interface VipBenefit {
    level: number;
    requiredPoints: number;
    benefits: string[];
}

export const VIP_LEVELS: VipBenefit[] = [
    { level: 0, requiredPoints: 0, benefits: ["Standard Gameplay"] },
    { level: 1, requiredPoints: 100, benefits: ["Auto-Battle Speed x2"] },
    { level: 2, requiredPoints: 300, benefits: ["+1 Daily Dungeon Ticket"] }, // Interpolated
    { level: 3, requiredPoints: 600, benefits: ["+2 Daily Arena Tickets"] },
    { level: 4, requiredPoints: 1000, benefits: ["+10% Gold from Campaign"] }, // Interpolated
    { level: 5, requiredPoints: 2000, benefits: ["Auto-Merge Button"] },
    { level: 6, requiredPoints: 4000, benefits: ["+20% Idle Chest Cap"] }, // Interpolated
    { level: 7, requiredPoints: 7000, benefits: ["+1 Free Daily Shop Refresh"] }, // Interpolated
    { level: 8, requiredPoints: 12000, benefits: ["Skip Battle (Cleared Stages)"] },
    { level: 9, requiredPoints: 20000, benefits: ["+5% 5-Star Summon Rate"] }, // Interpolated
    { level: 10, requiredPoints: 35000, benefits: ["Daily Free Mythic Shard"] }
];

export interface PlayerStatistics {
    highestRankAchieved: string; // e.g., "Celestial IV" - storing title for now
    totalBossesDefeated: number;
    highestTowerFloor: number;
    mythicsFoundCount: number;
    totalMythicsAvailable: number; // e.g., 22
    arenaWins: number;
    arenaBattles: number;
    heroUsage: Record<string, number>; // CodeName -> Count
}

// --- EQUIPMENT INSTANCE ---
export interface EquipmentInstance {
    itemId: string;      // References ItemSystem item ID
    stars: number;       // 0-5 enhancement level
    equipped?: boolean;  // Is it equipped on a hero?
    heroId?: string;     // Which hero has it equipped
}

// --- USER PROFILE ---
export interface UserProfile {
    username?: string; // Login ID
    commanderName: string;
    level: number;
    currentXp: number;
    maxXp: number; // XP needed for next level

    uid?: string; // Unique ID (mapped from MongoDB _id)
    serverId?: string; // Server ID the user belongs to
    lastNameChangeTime?: number; // Timestamp of last name change

    // Rank Info
    rankTitle: string;
    rankIcon: string;

    avatarId: string;
    frameId: string;

    combatPower: number;
    guildName?: string;
    favoriteHeroCodeName: string;

    // Economy
    gold: number;
    gems: number;
    heroPotion: number;
    soulPotion: number;

    // Hero Orbs for attribute-specific summons (from decomposing heroes)
    agiOrb?: number;
    strOrb?: number;
    intOrb?: number;

    // Progression
    achievementsProgress: Record<string, number>; // ID -> Value (e.g., gold collected)
    achievementsClaimed: string[]; // IDs of claimed rewards

    // VIP
    vipPoints: number; // VIP 0

    // Statistics (The Flex)
    // Statistics (The Flex)
    stats: PlayerStatistics;

    // Inventory: ItemID -> Count
    inventory: Record<string, number>;

    // Equipment Inventory: Array of equipment instances with star levels
    equipmentInventory?: EquipmentInstance[];

    // Polishing Powder for enhancement
    polishingPowder?: number;

    // Deployment
    deployedTeam?: string[];
    heroes?: any; // Map or Object of hero instances

    // Adventure Progress
    adventureProgress?: {
        jadeLotusShrine?: { maxStage: number };
    };
}

export function getRankForLevel(level: number): RankDefinition {
    return RANK_DEFINITIONS.find(r => level >= r.minLevel && level <= r.maxLevel) || RANK_DEFINITIONS[0];
}

export function getVipLevel(points: number): VipBenefit {
    // Find highest level where points >= required
    // Iterate backwards
    for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
        if (points >= VIP_LEVELS[i].requiredPoints) {
            return VIP_LEVELS[i];
        }
    }
    return VIP_LEVELS[0];
}

// Initial Mock Profile
export const MOCK_USER_PROFILE: UserProfile = {
    commanderName: "BeastMaster_99",
    level: 1,
    currentXp: 0,
    maxXp: 100,
    rankTitle: "Scout",
    rankIcon: "Paw Print",
    avatarId: "1",
    frameId: "1",
    combatPower: 1250,
    guildName: "The Wild Pack",
    favoriteHeroCodeName: "Monkey King",

    gold: 999999999,
    gems: 999999999,
    heroPotion: 999999999,
    soulPotion: 999999999,

    achievementsProgress: {
        "tycoon": 500, // Starting gold counts?
        "collector_1": 1 // Starter hero unlocked
    },
    achievementsClaimed: [],

    vipPoints: 0, // VIP 0

    stats: {
        highestRankAchieved: "Scout",
        totalBossesDefeated: 0,
        highestTowerFloor: 0,
        mythicsFoundCount: 1, // Maybe they have Monkey King?
        totalMythicsAvailable: 22,
        arenaWins: 0,
        arenaBattles: 0,
        heroUsage: {
            "Monkey King": 5
        }
    },
    inventory: {},
    equipmentInventory: [
        { itemId: 'iron_leaf', stars: 3 },
        { itemId: 'bear_claw', stars: 5 },
        { itemId: 'swift_paw', stars: 4 },
        { itemId: 'basic_boots', stars: 2 },
        { itemId: 'vampire_tooth', stars: 1 },
        { itemId: 'wisdom_plume', stars: 5 },
        { itemId: 'ring_life', stars: 0 },
        { itemId: 'turtle_shell', stars: 3 },
    ],
    polishingPowder: 50,
    adventureProgress: {
        jadeLotusShrine: { maxStage: 1 }
    },
    uid: "MOCK-ADMIN-001"
};

export function addPlayerXp(profile: UserProfile, amount: number): void {
    profile.currentXp += amount;
    while (profile.currentXp >= profile.maxXp) {
        profile.currentXp -= profile.maxXp;
        profile.level++;
        // New Formula: 100 * (CurrentLevel ^ 1.5)
        profile.maxXp = Math.floor(100 * Math.pow(profile.level, 1.5));

        // Update Rank Details on Level Up
        const newRank = getRankForLevel(profile.level);
        profile.rankTitle = newRank.title;
        profile.rankIcon = newRank.icon;

        // Update Stats
        profile.stats.highestRankAchieved = newRank.title; // simplified update

        // VIP Points from Level Up (Taste of VIP)
        profile.vipPoints += 10;

        console.log(`Level Up! ${profile.commanderName} is now Level ${profile.level} (${newRank.title})`);
    }
}
