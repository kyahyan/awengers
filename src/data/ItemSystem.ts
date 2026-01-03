/**
 * Equipment & Crafting System
 * Pyramid Progression: Tier 2 requires 5★ Tier 1, Tier 3 requires 5★ Tier 2, etc.
 */

// ==================== INTERFACES ====================

export type ItemSlot = 'Weapon' | 'Armor' | 'Helmet' | 'Boots' | 'Accessory';
export type ItemRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export type ItemTier = 1 | 2 | 3 | 4;

export interface ItemStats {
    hp?: number;
    atk?: number;
    armor?: number;
    str?: number;
    agi?: number;
    int?: number;
    moveSpeed?: number;
    lifesteal?: number;
    critRate?: number;
    hitRate?: number;
    dodge?: number;
    damageReflect?: number;
}

export interface PassiveEffect {
    id: string;
    name: string;
    description: string;
}

export interface CraftingRecipe {
    ingredient1: string;  // Item ID
    ingredient2: string;  // Item ID
    goldCost: number;
}

export interface ItemDefinition {
    id: string;
    name: string;
    tier: ItemTier;
    rarity: ItemRarity;
    slot: ItemSlot;
    icon: string;
    description: string;
    baseStats: ItemStats;
    passiveEffect?: PassiveEffect;
    recipe?: CraftingRecipe;
    dropLocations?: string[];
}

export interface ItemInstance {
    itemId: string;
    stars: number;  // 0-5
}

// ==================== SHARD SYSTEM ====================

export const SHARD_REQUIREMENTS: Record<ItemTier, number> = {
    1: 20,
    2: 100,
    3: 350,
    4: 500
};

// Map Shard ID -> Item ID (Base Item for that shard)
// Currently only Tier 1 shards are explicitly defined in loot system, but logic might expand.
// We'll define mappings for known shards.
export const SHARD_TO_ITEM_MAPPING: Record<string, string> = {
    'ring_of_life_shard': 'ring_life',
    'iron_leaf_shard': 'iron_leaf',
    'swift_paw_shard': 'swift_paw',
    'wisdom_plume_shard': 'wisdom_plume',
    'turtle_shell_shard': 'turtle_shell',
    'vampire_tooth_shard': 'vampire_tooth',
    'bear_claw_shard': 'bear_claw',
    'basic_boots_shard': 'basic_boots'
};

// ==================== TIER 1: BASIC MATERIALS (Common) ====================

export const TIER1_ITEMS: Record<string, ItemDefinition> = {
    iron_leaf: {
        id: 'iron_leaf',
        name: 'Iron Leaf',
        tier: 1,
        rarity: 'Common',
        slot: 'Armor',
        icon: '/assets/item/Tier 1/Iron Leaf.png',
        description: 'A metallic leaf found in the Ironwood Forest. Its unnatural stiffness provides basic protection.',
        baseStats: { armor: 25 },
        dropLocations: ['Map 1 (Lotus Shrine)', 'Map 5 (Temple)']
    },
    turtle_shell: {
        id: 'turtle_shell',
        name: 'Turtle Shell Fragment',
        tier: 1,
        rarity: 'Common',
        slot: 'Armor',
        icon: '/assets/item/Tier 1/Turtle Shell Fragment.png',
        description: 'A sturdy shard from an ancient tortoise. Deflects blows with ease.',
        baseStats: { armor: 35 },
        dropLocations: ['Map 3 (Grove)', 'Map 5 (Temple)']
    },
    ring_life: {
        id: 'ring_life',
        name: 'Ring of Life',
        tier: 1,
        rarity: 'Common',
        slot: 'Accessory',
        icon: '/assets/item/Tier 1/Ring of Life.png',
        description: 'A wooden ring pulsing with nature\'s heartbeat. Increases vitality.',
        baseStats: { hp: 250 },
        dropLocations: ['Map 1 (Lotus Shrine)', 'Map 4 (Sakura)']
    },
    bear_claw: {
        id: 'bear_claw',
        name: 'Bear Claw',
        tier: 1,
        rarity: 'Common',
        slot: 'Weapon',
        icon: '/assets/item/Tier 1/Bear Claw.png',
        description: 'Sharp claw of an Ursine Warrior. Channels raw power into your strikes.',
        baseStats: { str: 35 },
        dropLocations: ['Map 2 (Stronghold)', 'Map 7 (Cavern)']
    },
    swift_paw: {
        id: 'swift_paw',
        name: 'Swift Paw',
        tier: 1,
        rarity: 'Common',
        slot: 'Boots',
        icon: '/assets/item/Tier 1/Swift Paw.png',
        description: 'Severed paw of a wind stalker. It twitches with restless energy.',
        baseStats: { agi: 35 },
        dropLocations: ['Map 3 (Grove)', 'Map 6 (Swamp)']
    },
    wisdom_plume: {
        id: 'wisdom_plume',
        name: 'Wisdom Plume',
        tier: 1,
        rarity: 'Common',
        slot: 'Helmet',
        icon: '/assets/item/Tier 1/Wisdom Plume.png',
        description: 'A shimmering feather from the legendary Owl of Ages. Whispers secrets of the arcane.',
        baseStats: { int: 35 },
        dropLocations: ['Map 4 (Sakura)', 'Map 8 (Ruins)']
    },
    vampire_tooth: {
        id: 'vampire_tooth',
        name: 'Vampire Tooth',
        tier: 1,
        rarity: 'Common',
        slot: 'Weapon',
        icon: '/assets/item/Tier 1/Vampire Tooth.png',
        description: 'A sharp fang that thirsts for blood. Heals the wielder upon striking foes.',
        baseStats: { lifesteal: 3 },
        dropLocations: ['Map 6 (Swamp)', 'Map 7 (Cavern)']
    },
    basic_boots: {
        id: 'basic_boots',
        name: 'Basic Boots',
        tier: 1,
        rarity: 'Common',
        slot: 'Boots',
        icon: '/assets/item/Tier 1/Basic Boots.png',
        description: 'Simple leather boots. Essential for any adventurer looking to pick up the pace.',
        baseStats: { moveSpeed: 25 },
        dropLocations: ['Map 2 (Stronghold)', 'Map 8 (Ruins)']
    }
};

// ==================== TIER 2: EVOLVED GEAR (Rare) ====================

export const TIER2_ITEMS: Record<string, ItemDefinition> = {
    jaguar_blade: {
        id: 'jaguar_blade',
        name: 'Jaguar Blade',
        tier: 2,
        rarity: 'Rare',
        slot: 'Weapon',
        icon: '/assets/item/Tier 2/Jaguar Blade.png',
        description: 'A savage blade forged from the essence of primal beasts. Strikes with lethal precision.',
        baseStats: { atk: 150, critRate: 10 },
        recipe: { ingredient1: 'bear_claw', ingredient2: 'swift_paw', goldCost: 10000 }
    },
    hybrid_striders: {
        id: 'hybrid_striders',
        name: 'Hybrid Striders',
        tier: 2,
        rarity: 'Rare',
        slot: 'Boots',
        icon: '/assets/item/Tier 2/Hybrid Striders.png',
        description: 'Boots enhanced with animal essence. Move like the wind.',
        baseStats: { moveSpeed: 60, agi: 50 },
        recipe: { ingredient1: 'basic_boots', ingredient2: 'swift_paw', goldCost: 10000 }
    },
    spiked_carapace: {
        id: 'spiked_carapace',
        name: 'Spiked Carapace',
        tier: 2,
        rarity: 'Rare',
        slot: 'Armor',
        icon: '/assets/item/Tier 2/Spiked Carapace.png',
        description: 'Armor covered in razor-sharp spikes. Attackers feel the sting of their own aggression.',
        baseStats: { armor: 120, damageReflect: 10 },
        recipe: { ingredient1: 'turtle_shell', ingredient2: 'bear_claw', goldCost: 10000 }
    },
    hawk_eye_lens: {
        id: 'hawk_eye_lens',
        name: 'Hawk-Eye Lens',
        tier: 2,
        rarity: 'Rare',
        slot: 'Helmet',
        icon: '/assets/item/Tier 2/Hawk-Eye Lens.png',
        description: 'A lens that grants vision beyond mortal sight. No attack misses.',
        baseStats: { int: 100, hitRate: 15 },
        recipe: { ingredient1: 'wisdom_plume', ingredient2: 'ring_life', goldCost: 10000 }
    },
    rabid_muzzle: {
        id: 'rabid_muzzle',
        name: 'Rabid Muzzle',
        tier: 2,
        rarity: 'Rare',
        slot: 'Helmet',
        icon: '/assets/item/Tier 2/Rabid Muzzle.png',
        description: 'A mask imbued with vampiric hunger. Protects while it feeds.',
        baseStats: { armor: 80, lifesteal: 10 },
        recipe: { ingredient1: 'vampire_tooth', ingredient2: 'iron_leaf', goldCost: 10000 }
    },
    shadow_cloak: {
        id: 'shadow_cloak',
        name: 'Shadow Cloak',
        tier: 2,
        rarity: 'Rare',
        slot: 'Armor',
        icon: '/assets/item/Tier 2/Shadow Cloak.png',
        description: 'A cloak woven from pure shadow. Sometimes attacks simply... miss.',
        baseStats: { armor: 80, dodge: 10 },
        recipe: { ingredient1: 'iron_leaf', ingredient2: 'swift_paw', goldCost: 10000 }
    }
};

// ==================== TIER 3: MYTHIC ARTIFACTS (Epic) ====================

export const TIER3_ITEMS: Record<string, ItemDefinition> = {
    heart_of_mountain: {
        id: 'heart_of_mountain',
        name: 'Heart of the Mountain',
        tier: 3,
        rarity: 'Epic',
        slot: 'Accessory',
        icon: '/assets/item/Tier 3/Heart of the Mountain.png',
        description: 'The crystallized core of an ancient peak. Grants immense fortitude.',
        baseStats: { hp: 1500, armor: 200 },
        passiveEffect: {
            id: 'titan_skin',
            name: 'Titan Skin',
            description: 'Gain Shield equal to 20% Max HP at battle start.'
        },
        recipe: { ingredient1: 'spiked_carapace', ingredient2: 'ring_life', goldCost: 100000 }
    },
    fang_of_ruin: {
        id: 'fang_of_ruin',
        name: 'Fang of Ruin',
        tier: 3,
        rarity: 'Epic',
        slot: 'Weapon',
        icon: '/assets/item/Tier 3/Fang of Ruin.png',
        description: 'A blade that hungers for the weak. Executes with ruthless efficiency.',
        baseStats: { atk: 300, critRate: 15 },
        passiveEffect: {
            id: 'executioner',
            name: 'Executioner',
            description: 'Deal +20% damage to enemies below 50% HP.'
        },
        recipe: { ingredient1: 'jaguar_blade', ingredient2: 'vampire_tooth', goldCost: 100000 }
    },
    storm_hammer: {
        id: 'storm_hammer',
        name: 'Storm Hammer',
        tier: 3,
        rarity: 'Epic',
        slot: 'Weapon',
        icon: '/assets/item/Tier 3/Storm Hammer.png',
        description: 'A hammer crackling with electric fury. Lightning chains between foes.',
        baseStats: { atk: 250, int: 100 },
        passiveEffect: {
            id: 'chain_lightning',
            name: 'Chain Lightning',
            description: 'Basic attacks chain to hit 3 enemies.'
        },
        recipe: { ingredient1: 'jaguar_blade', ingredient2: 'wisdom_plume', goldCost: 100000 }
    },
    ghost_moth_wings: {
        id: 'ghost_moth_wings',
        name: 'Ghost Moth Wings',
        tier: 3,
        rarity: 'Epic',
        slot: 'Armor',
        icon: '/assets/item/Tier 3/Ghost Moth Wings.png',
        description: 'Ethereal wings that phase between dimensions. Sometimes you simply aren\'t there.',
        baseStats: { armor: 150, dodge: 20 },
        passiveEffect: {
            id: 'mirage',
            name: 'Mirage',
            description: '20% chance to completely ignore incoming damage.'
        },
        recipe: { ingredient1: 'shadow_cloak', ingredient2: 'hybrid_striders', goldCost: 100000 }
    },
    infinity_core: {
        id: 'infinity_core',
        name: 'Infinity Core',
        tier: 3,
        rarity: 'Epic',
        slot: 'Accessory',
        icon: '/assets/item/Tier 3/Infinity Core.png',
        description: 'A fragment of eternity itself. Time bends around the wearer.',
        baseStats: { int: 150, hp: 500 },
        passiveEffect: {
            id: 'overclock',
            name: 'Overclock',
            description: 'Reduce all skill cooldowns by 25%.'
        },
        recipe: { ingredient1: 'hawk_eye_lens', ingredient2: 'ring_life', goldCost: 100000 }
    },
    eye_of_frost_wyrm: {
        id: 'eye_of_frost_wyrm',
        name: 'Eye of the Frost Wyrm',
        tier: 3,
        rarity: 'Epic',
        slot: 'Helmet',
        icon: '/assets/item/Tier 3/Eye of the Frost Wyrm.png',
        description: 'The frozen eye of an ancient dragon. Chills all who face you.',
        baseStats: { int: 200, armor: 100 },
        passiveEffect: {
            id: 'permafrost',
            name: 'Permafrost',
            description: 'Attacks slow enemy Attack Speed by 20%.'
        },
        recipe: { ingredient1: 'hawk_eye_lens', ingredient2: 'wisdom_plume', goldCost: 100000 }
    },
    scale_of_dragon_king: {
        id: 'scale_of_dragon_king',
        name: 'Scale of the Dragon King',
        tier: 3,
        rarity: 'Epic',
        slot: 'Armor',
        icon: '/assets/item/Tier 3/Scale of the Dragon King.png',
        description: 'A scale from the legendary Dragon King. Grants resistance to all magic.',
        baseStats: { armor: 180, hp: 800 },
        passiveEffect: {
            id: 'dragon_blood',
            name: 'Dragon Blood',
            description: '+30% Magic Resistance.'
        },
        recipe: { ingredient1: 'spiked_carapace', ingredient2: 'wisdom_plume', goldCost: 100000 }
    },
    radiance_stone: {
        id: 'radiance_stone',
        name: 'Radiance Stone',
        tier: 3,
        rarity: 'Epic',
        slot: 'Accessory',
        icon: '/assets/item/Tier 3/Radiance Stone.png',
        description: 'A stone that burns with inner fire. Sears all who draw near.',
        baseStats: { atk: 180, hp: 600 },
        passiveEffect: {
            id: 'sun_burn',
            name: 'Sun Burn',
            description: 'Deal burn damage to nearby enemies each second.'
        },
        recipe: { ingredient1: 'rabid_muzzle', ingredient2: 'bear_claw', goldCost: 100000 }
    }
};

// ==================== TIER 4: GOD TIER (Legendary) ====================

export const TIER4_ITEMS: Record<string, ItemDefinition> = {
    primal_dna: {
        id: 'primal_dna',
        name: 'Primal DNA',
        tier: 4,
        rarity: 'Legendary',
        slot: 'Accessory',
        icon: '/assets/item/Tier 4/Primal DNA.png',
        description: 'The genetic code of creation itself. Unlocks ultimate potential.',
        baseStats: { str: 100, agi: 100, int: 100, hp: 2000 },
        passiveEffect: {
            id: 'evolution',
            name: 'Evolution',
            description: '+50% to ALL Stats (Str, Agi, Int, HP).'
        },
        recipe: { ingredient1: 'fang_of_ruin', ingredient2: 'heart_of_mountain', goldCost: 1000000 }
    },
    crown_of_king: {
        id: 'crown_of_king',
        name: 'Crown of the King',
        tier: 4,
        rarity: 'Legendary',
        slot: 'Helmet',
        icon: '/assets/item/Tier 4/Crown of the King.png',
        description: 'The crown worn by the first king. Commands absolute authority.',
        baseStats: { atk: 300, armor: 300, hp: 1500 },
        passiveEffect: {
            id: 'authority',
            name: 'Authority',
            description: 'All allies gain +20% Attack and Defense aura.'
        },
        recipe: { ingredient1: 'infinity_core', ingredient2: 'radiance_stone', goldCost: 1000000 }
    }
};

// ==================== MATERIALS ====================

export interface MaterialDefinition {
    id: string;
    name: string;
    icon: string;
    description: string;
    dropLocations?: string[];
}

export const MATERIALS: Record<string, MaterialDefinition> = {
    polishing_powder: {
        id: 'polishing_powder',
        name: 'Polishing Powder',
        icon: '/assets/craft/Polishing Powder.png',
        description: 'Fine powder used to enhance equipment. Essential for star upgrades.',
        dropLocations: ['Map 9 (Dragon)', 'Dismantle Items']
    },
    box_of_polishing_powder: {
        id: 'box_of_polishing_powder',
        name: 'Box of Polishing Powder',
        icon: '/assets/craft/Box of Polishing Powder.png',
        description: 'A box containing 10 Polishing Powder. A valuable find.',
        dropLocations: ['Map 9 (Dragon) Boss']
    }
};

// ==================== ALL ITEMS COMBINED ====================

export const ALL_ITEMS: Record<string, ItemDefinition> = {
    ...TIER1_ITEMS,
    ...TIER2_ITEMS,
    ...TIER3_ITEMS,
    ...TIER4_ITEMS
};

// ==================== ENHANCEMENT COSTS ====================

export interface EnhancementCost {
    gold: number;
    polishingPowder?: number;
    duplicateRequired?: boolean;
}

export const ENHANCEMENT_COSTS: Record<ItemTier, Record<number, EnhancementCost>> = {
    1: {
        1: { gold: 1000 },
        2: { gold: 2500 },
        3: { gold: 5000 },
        4: { gold: 10000 },
        5: { gold: 25000, duplicateRequired: true }
    },
    2: {
        1: { gold: 10000, polishingPowder: 1 },
        2: { gold: 25000, polishingPowder: 2 },
        3: { gold: 50000, polishingPowder: 3 },
        4: { gold: 100000, polishingPowder: 5 },
        5: { gold: 250000, polishingPowder: 10, duplicateRequired: true }
    },
    3: {
        1: { gold: 100000, polishingPowder: 5 },
        2: { gold: 250000, polishingPowder: 10 },
        3: { gold: 500000, polishingPowder: 15 },
        4: { gold: 1000000, polishingPowder: 25 },
        5: { gold: 2500000, polishingPowder: 50, duplicateRequired: true }
    },
    4: {
        1: { gold: 1000000, polishingPowder: 25 },
        2: { gold: 2500000, polishingPowder: 50 },
        3: { gold: 5000000, polishingPowder: 75 },
        4: { gold: 10000000, polishingPowder: 100 },
        5: { gold: 25000000, polishingPowder: 200, duplicateRequired: true }
    }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get item definition by ID
 */
export function getItemById(id: string): ItemDefinition | undefined {
    return ALL_ITEMS[id];
}

/**
 * Calculate stats with star bonus (+20% per star)
 */
export function getStatsWithStars(baseStats: ItemStats, stars: number): ItemStats {
    const multiplier = 1 + (stars * 0.2);
    const result: ItemStats = {};

    for (const [key, value] of Object.entries(baseStats)) {
        if (typeof value === 'number') {
            result[key as keyof ItemStats] = Math.floor(value * multiplier);
        }
    }

    return result;
}

/**
 * Get enhancement cost for upgrading to target star
 */
export function getEnhancementCost(tier: ItemTier, targetStar: number): EnhancementCost | null {
    if (targetStar < 1 || targetStar > 5) return null;
    return ENHANCEMENT_COSTS[tier][targetStar];
}

/**
 * Check if an item can be crafted
 */
export function canCraftItem(
    itemId: string,
    inventory: ItemInstance[],
    gold: number
): { canCraft: boolean; reason?: string } {
    const item = getItemById(itemId);
    if (!item) return { canCraft: false, reason: 'Item not found.' };
    if (!item.recipe) return { canCraft: false, reason: 'This item cannot be crafted.' };

    const { ingredient1, ingredient2, goldCost } = item.recipe;

    // Check if both ingredients exist at 5★
    const ing1 = inventory.find(i => i.itemId === ingredient1 && i.stars >= 5);
    const ing2 = inventory.find(i => i.itemId === ingredient2 && i.stars >= 5);

    if (!ing1) {
        const ingItem = getItemById(ingredient1);
        return { canCraft: false, reason: `Need 5★ ${ingItem?.name || ingredient1}.` };
    }

    if (!ing2) {
        const ingItem = getItemById(ingredient2);
        return { canCraft: false, reason: `Need 5★ ${ingItem?.name || ingredient2}.` };
    }

    if (gold < goldCost) {
        return { canCraft: false, reason: `Need ${goldCost.toLocaleString()} Gold.` };
    }

    return { canCraft: true };
}

/**
 * Get all items by tier
 */
export function getItemsByTier(tier: ItemTier): ItemDefinition[] {
    return Object.values(ALL_ITEMS).filter(item => item.tier === tier);
}

/**
 * Check if player can build an item from shards
 */
export function canBuildFromShards(
    shardId: string,
    inventory: Record<string, number>
): { canBuild: boolean; item?: ItemDefinition; cost?: number; reason?: string } {
    const itemId = SHARD_TO_ITEM_MAPPING[shardId];
    if (!itemId) return { canBuild: false, reason: 'Invalid shard type.' };

    const item = getItemById(itemId);
    if (!item) return { canBuild: false, reason: 'Target item definition not found.' };

    const cost = SHARD_REQUIREMENTS[item.tier];
    const owned = inventory[shardId] || 0;

    if (owned < cost) {
        return { canBuild: false, item, cost, reason: `Need ${cost} shards (Have ${owned}).` };
    }

    return { canBuild: true, item, cost };
}

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity: ItemRarity): string {
    switch (rarity) {
        case 'Common': return '#9ca3af';   // Gray
        case 'Rare': return '#3b82f6';     // Blue
        case 'Epic': return '#a855f7';     // Purple
        case 'Legendary': return '#f59e0b'; // Gold
    }
}

/**
 * Get tier display name
 */
export function getTierName(tier: ItemTier): string {
    switch (tier) {
        case 1: return 'Basic Materials';
        case 2: return 'Evolved Gear';
        case 3: return 'Mythic Artifacts';
        case 4: return 'God Tier';
    }
}
