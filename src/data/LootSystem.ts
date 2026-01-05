export interface LootReward {
    type: 'coin' | 'xp' | 'soul_potion' | 'hero_potion' | 'gem' | 'item_shard' | 'hero_shard' | 'powder' | 'item';
    amount: number;
    itemId?: string; // For shards or specific items
    icon: string;
    name: string;
    isDrop?: boolean; // If true, show with "Drop" animation
    chance?: number; // Percent chance
}

export interface ShardDefinition {
    id: string;
    name: string;
    icon: string;
}

// Map ID to Shard Config
export const MAP_SHARD_DROPS: Record<number, ShardDefinition> = {
    1: { id: 'ring_of_life_shard', name: 'Ring of Life Shard', icon: '/assets/item/shard-item/Tier 1/Ring of Life - shard.png' },
    2: { id: 'iron_leaf_shard', name: 'Iron Leaf Shard', icon: '/assets/item/shard-item/Tier 1/Iron Leaf - shard.png' },
    3: { id: 'swift_paw_shard', name: 'Swift Paw Shard', icon: '/assets/item/shard-item/Tier 1/Swift Paw - shard.png' },
    4: { id: 'wisdom_plume_shard', name: 'Wisdom Plume Shard', icon: '/assets/item/shard-item/Tier 1/Wisdom Plume - shard.png' },
    5: { id: 'turtle_shell_shard', name: 'Turtle Shell Shard', icon: '/assets/item/shard-item/Tier 1/Turtle Shell Fragment - shard.png' },
    6: { id: 'vampire_tooth_shard', name: 'Vampire Tooth Shard', icon: '/assets/item/shard-item/Tier 1/Vampire Tooth - shard.png' },
    7: { id: 'bear_claw_shard', name: 'Bear Claw Shard', icon: '/assets/item/shard-item/Tier 1/Bear Claw - shard.png' },
    8: { id: 'basic_boots_shard', name: 'Basic Boots Shard', icon: '/assets/item/shard-item/Tier 1/Basic Boots - shard.png' },
    9: { id: 'polishing_powder', name: 'Polishing Powder', icon: '/assets/craft/Polishing Powder.png' }, // Fallback icon
};

export function calculateLoot(mapId: number, stageId: number, isFirstClear: boolean, difficulty: 'normal' | 'hard' | 'insane' = 'normal'): LootReward[] {
    const rewards: LootReward[] = [];
    const shardConfig = MAP_SHARD_DROPS[mapId] || MAP_SHARD_DROPS[1];

    let coinMult = 1; let xpMult = 1; let soulMult = 1; let shardMin = 1; let shardMax = 2;

    if (difficulty === 'hard') { coinMult = 3; xpMult = 2.5; soulMult = 5; shardMin = 3; shardMax = 5; }
    else if (difficulty === 'insane') { coinMult = 10; xpMult = 10; soulMult = 20; shardMin = 10; shardMax = 10; }

    const cycleStage = ((stageId - 1) % 30) + 1;
    const baseCoins = 1000; const baseSoul = 100; const baseXp = 200;

    // --- GUARANTEED ---
    rewards.push({ type: 'coin', amount: Math.floor(baseCoins * coinMult * (1 + cycleStage * 0.1)), name: 'Coins', icon: '/assets/potions/coin-icon.png', chance: 100 });
    rewards.push({ type: 'xp', amount: Math.floor(baseXp * xpMult * (1 + cycleStage * 0.1)), name: 'User EXP', icon: '/assets/shop/exp-icons/medium.png', chance: 100 });
    rewards.push({ type: 'soul_potion', amount: Math.floor(baseSoul * soulMult * (1 + cycleStage * 0.1)), name: 'Soul Potions', icon: '/assets/potions/soul-potion-icon.png', chance: 100 });

    // --- GLOBAL ---
    if (Math.random() < 0.30) rewards.push({ type: 'hero_potion', amount: Math.floor(50 * coinMult), name: 'Hero Potion', icon: '/assets/potions/hero-potion-icon.png', chance: 30 });
    if (Math.random() < 0.25) {
        const qty = Math.floor(Math.random() * (shardMax - shardMin + 1)) + shardMin;
        rewards.push({ type: 'item_shard', amount: qty, itemId: shardConfig.id, name: shardConfig.name, icon: shardConfig.icon, chance: 25 });
    }
    if (Math.random() < 0.15) rewards.push({ type: 'powder', amount: Math.floor(5 * coinMult), name: 'Polishing Powder', icon: '/assets/craft/Polishing Powder.png', chance: 15 });
    if (Math.random() < 0.10) rewards.push({ type: 'gem', amount: Math.floor(5 * coinMult), name: 'Gems', icon: '/assets/potions/gem-icon.png', chance: 10 });
    if (Math.random() < 0.05) rewards.push({ type: 'hero_shard', amount: 1, itemId: 'random_hero', name: 'Hero Shards', icon: '/assets/items/hero_shard.png', chance: 5 });

    // --- CYCLE BONUSES ---
    if (cycleStage % 5 === 0 && cycleStage % 10 !== 0) {
        rewards.push({ type: 'item_shard', amount: 5 * shardMin, itemId: shardConfig.id, name: shardConfig.name, icon: shardConfig.icon, chance: 100 });
        rewards.push({ type: 'gem', amount: 10 * coinMult, name: 'Bonus Gems', icon: '/assets/potions/gem-icon.png', chance: 100 });
    }
    if (cycleStage % 10 === 0 && cycleStage !== 30) {
        rewards.push({ type: 'hero_potion', amount: 200 * coinMult, name: 'Mega Hero Potion', icon: '/assets/potions/hero-potion-icon.png', chance: 100 });
        if (Math.random() < 0.3) rewards.push({ type: 'item', amount: 1, itemId: 'random_t1', name: 'Rare Equipment', icon: '/assets/items/chest_t1.png', isDrop: true, chance: 30 });
    }
    if (cycleStage === 30) {
        rewards.push({ type: 'hero_shard', amount: 3, itemId: 'random_hero', name: 'Boss Hero Shards', icon: '/assets/items/hero_shard.png', chance: 100 });
        rewards.push({ type: 'powder', amount: 20, name: 'Boss Powder', icon: '/assets/craft/Polishing Powder.png', chance: 100 });
        rewards.push({ type: 'gem', amount: 50 * coinMult, name: 'Boss Gems', icon: '/assets/potions/gem-icon.png', chance: 100 });
    }
    if (isFirstClear) {
        rewards.push({ type: 'gem', amount: 100, name: 'First Clear Gems', icon: '/assets/potions/gem-icon.png', chance: 100 });
        if (cycleStage === 30) rewards.push({ type: 'item', amount: 1, itemId: 'rare_scroll', name: 'Rare Scroll', icon: '/assets/home/scroll/rare-summon.png', chance: 100 });
    }

    return rewards;
}

export function getPossibleRewards(mapId: number, stageId: number, difficulty: 'normal' | 'hard' | 'insane' = 'normal'): LootReward[] {
    const rewards: LootReward[] = [];
    const shardConfig = MAP_SHARD_DROPS[mapId] || MAP_SHARD_DROPS[1];

    // GUARANTEED
    rewards.push({ type: 'coin', amount: 0, name: 'Coins', icon: '/assets/potions/coin-icon.png', chance: 100 });
    rewards.push({ type: 'xp', amount: 0, name: 'User EXP', icon: '/assets/shop/exp-icons/medium.png', chance: 100 });
    rewards.push({ type: 'soul_potion', amount: 0, name: 'Soul Potions', icon: '/assets/potions/soul-potion-icon.png', chance: 100 });

    // GLOBAL CHANCE
    rewards.push({ type: 'hero_potion', amount: 0, name: 'Hero Potion', icon: '/assets/potions/hero-potion-icon.png', chance: 30 });
    rewards.push({ type: 'item_shard', amount: 0, itemId: shardConfig.id, name: shardConfig.name, icon: shardConfig.icon, chance: 25 });
    rewards.push({ type: 'powder', amount: 0, name: 'Polishing Powder', icon: '/assets/craft/Polishing Powder.png', chance: 15 });
    rewards.push({ type: 'gem', amount: 0, name: 'Gems', icon: '/assets/potions/gem-icon.png', chance: 10 });
    rewards.push({ type: 'hero_shard', amount: 0, itemId: 'random_hero', name: 'Hero Shards', icon: '/assets/items/hero_shard.png', chance: 5 });

    const cycleStage = ((stageId - 1) % 30) + 1;

    if (cycleStage === 30) {
        rewards.push({ type: 'item', amount: 0, itemId: 'rare_scroll', name: 'Rare Scroll (First Clear)', icon: '/assets/home/scroll/rare-summon.png', chance: 100 });
    }

    // Update chances for specific stage bonuses
    if (cycleStage % 5 === 0 && cycleStage % 10 !== 0) { // Elite
        const shard = rewards.find(r => r.type === 'item_shard');
        if (shard) { shard.chance = 100; shard.name = "Guaranteed Shard"; }
        const gem = rewards.find(r => r.type === 'gem');
        if (gem) { gem.chance = 100; gem.name = "Guaranteed Gems"; }
    }
    if (cycleStage % 10 === 0 && cycleStage !== 30) { // Mini Boss
        const pot = rewards.find(r => r.type === 'hero_potion');
        if (pot) { pot.chance = 100; pot.name = "Guaranteed Hero Potions"; }
        rewards.push({ type: 'item', amount: 0, itemId: 'random_t1', name: 'Rare Equipment', icon: '/assets/items/chest_t1.png', chance: 30 });
    }
    if (cycleStage === 30) {
        const shard = rewards.find(r => r.type === 'hero_shard');
        if (shard) { shard.chance = 100; shard.name = "Guaranteed Hero Shards"; }
        const powder = rewards.find(r => r.type === 'powder');
        if (powder) { powder.chance = 100; powder.name = "Guaranteed Powder"; }
        const gem = rewards.find(r => r.type === 'gem');
        if (gem) { gem.chance = 100; gem.name = "Guaranteed Gems"; }
        rewards.push({ type: 'item', amount: 0, itemId: 'random_t1', name: 'Epic Drop', icon: '/assets/items/chest_t1.png', chance: 50 });
    }

    // De-dupe rewards to prevent multiple icons of same type if we want (optional, but UI might look cluttered)
    // For now, let's keep them as is or simple distinct filter?
    // User wants "Percentage per loot". If we have "Hero Potion 30%" and "Hero Potion 100%", we should probably show the best one or both with labels.
    // The current code attempts to update the existing one found by .find().

    return rewards;
}
