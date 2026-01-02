
export interface LootReward {
    type: 'coin' | 'xp' | 'soul_potion' | 'hero_potion' | 'gem' | 'item_shard' | 'hero_shard' | 'powder' | 'item';
    amount: number;
    itemId?: string; // For shards or specific items
    icon: string;
    name: string;
    isDrop?: boolean; // If true, show with "Drop" animation
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
    const shardConfig = MAP_SHARD_DROPS[mapId] || MAP_SHARD_DROPS[1]; // Default to Map 1 if unknown

    // Multipliers
    let coinMult = 1;
    let xpMult = 1;
    let soulMult = 1;
    let shardMin = 1;
    let shardMax = 2;

    if (difficulty === 'hard') {
        coinMult = 3; xpMult = 2.5; soulMult = 5; shardMin = 3; shardMax = 5;
    } else if (difficulty === 'insane') {
        coinMult = 10; xpMult = 10; soulMult = 20; shardMin = 10; shardMax = 10;
    }

    // Determine Drop Type based on Stage (1-30 cycle)
    // We normalize stage > 30 to 1-30 cycle? Or assume max stage logic handles it. 
    // The prompt says "The 30-Stage Loot Cycle (Apply to All Maps)". 
    // So Stage 31 = Stage 1 logic? Or is it a fixed 30 stages per map? 
    // Usually map has limited stages. Let's assume modulo 30 logic if stages go higher, or strictly 1-30.
    // The "Jade Lotus Shrine" has 30 stages generated in code. So we stick to 1-30.

    // Normalized Stage (1-30)
    // If we have stages > 30, we'll wrap around logic or clamp? Let's assume modulo for safety.
    const cycleStage = ((stageId - 1) % 30) + 1;

    // Default Amounts
    const baseCoins = 1000;
    const baseSoul = 100;
    const baseHeroPotion = 50;
    const baseXp = 200;

    // Logic Switch
    if (cycleStage === 5) { // Elite
        rewards.push({ type: 'coin', amount: baseCoins * 5 * coinMult, name: 'Coins', icon: '/assets/potions/coin-icon.png' });
        rewards.push({ type: 'xp', amount: baseXp * 5 * xpMult, name: 'User EXP', icon: '/assets/shop/exp-icons/medium.png' });


        // Prompt says "3x Item Shards", multiplied by difficulty? 
        // Table says "Normal: 1-2 per drop" but Stage 5 row says "3x Item Shards".
        // Let's assume Stage 5 overrides common drop with fixed 3x, then apply difficulty multiplier? 
        // Or "3x Item Shards" IS the quantity for Normal.
        // Let's use: Normal = 3, Hard = 3*3=9?, Insane = 3*10=30? 
        // Or maybe strictly follow "Item Shards" row in Scaling table:
        // Normal: 1-2, Hard 3-5, Insane 10.
        // Stage 5 says "3x Item Shards". Let's assume it means "3 Shards".
        // Let's stick to the Scaling Table for "Item Shards" row as the base range.
        // If Stage 5 explicitly says "3x", maybe it means 3 rolls?
        // Let's go with: Normal = 3, Hard = 9, Insane = 30 for Elite stages.
        rewards.push({
            type: 'item_shard',
            amount: 3 * (difficulty === 'normal' ? 1 : difficulty === 'hard' ? 3 : 10),
            itemId: shardConfig.id,
            name: shardConfig.name,
            icon: shardConfig.icon
        });

        if (isFirstClear) {
            rewards.push({ type: 'gem', amount: 10, name: 'Gems', icon: '/assets/potions/gem-icon.png' });
        }

    } else if (cycleStage === 10) { // Mini-Boss
        rewards.push({ type: 'hero_potion', amount: baseHeroPotion * coinMult, name: 'Hero Potion', icon: '/assets/potions/hero-potion-icon.png' });
        rewards.push({ type: 'coin', amount: baseCoins * coinMult, name: 'Coins', icon: '/assets/potions/coin-icon.png' });

        // Whole Item Chance (Tier 1 Low %)
        if (Math.random() < 0.1) {
            rewards.push({ type: 'item', amount: 1, itemId: 'random_t1', name: 'Lucky Item', icon: '/assets/items/chest_t1.png', isDrop: true });
        }

        if (isFirstClear) {
            rewards.push({ type: 'gem', amount: 50, name: 'Gems', icon: '/assets/potions/gem-icon.png' });
            rewards.push({ type: 'coin', amount: 5000, name: 'Bonus Coins', icon: '/assets/potions/coin-icon.png' });
        }

    } else if (cycleStage === 15) { // Elite
        rewards.push({ type: 'soul_potion', amount: baseSoul * 5 * soulMult, name: 'Soul Potions', icon: '/assets/potions/soul-potion-icon.png' });

        rewards.push({
            type: 'item_shard',
            amount: 3 * (difficulty === 'normal' ? 1 : difficulty === 'hard' ? 3 : 10),
            itemId: shardConfig.id,
            name: shardConfig.name,
            icon: shardConfig.icon
        });

        if (isFirstClear) {
            rewards.push({ type: 'gem', amount: 10, name: 'Gems', icon: '/assets/potions/gem-icon.png' });
        }

    } else if (cycleStage === 20) { // Mini-Boss
        rewards.push({ type: 'hero_potion', amount: baseHeroPotion * coinMult, name: 'Hero Potion', icon: '/assets/potions/hero-potion-icon.png' });
        rewards.push({ type: 'coin', amount: baseCoins * coinMult, name: 'Coins', icon: '/assets/potions/coin-icon.png' });

        // Whole Item Chance (Med %)
        if (Math.random() < 0.2) {
            rewards.push({ type: 'item', amount: 1, itemId: 'random_t1', name: 'Lucky Item', icon: '/assets/items/chest_t1.png', isDrop: true });
        }

        if (isFirstClear) {
            rewards.push({ type: 'gem', amount: 100, name: 'Gems', icon: '/assets/potions/gem-icon.png' });
            rewards.push({ type: 'coin', amount: 10000, name: 'Bonus Coins', icon: '/assets/potions/coin-icon.png' });
        }

    } else if (cycleStage === 25) { // Elite
        rewards.push({ type: 'xp', amount: baseXp * 10 * xpMult, name: 'High User EXP', icon: '/assets/shop/exp-icons/medium.png' });

        rewards.push({
            type: 'item_shard',
            amount: 5 * (difficulty === 'normal' ? 1 : difficulty === 'hard' ? 3 : 10),
            itemId: shardConfig.id,
            name: shardConfig.name,
            icon: shardConfig.icon
        });

        if (isFirstClear) {
            rewards.push({ type: 'gem', amount: 20, name: 'Gems', icon: '/assets/potions/gem-icon.png' });
        }

    } else if (cycleStage === 30) { // Final Boss
        rewards.push({ type: 'hero_shard', amount: 5, itemId: 'random_hero', name: 'Hero Shards', icon: '/assets/items/hero_shard.png' });
        rewards.push({ type: 'powder', amount: 10, name: 'Polishing Powder', icon: '/assets/craft/Polishing Powder.png' });

        // Whole Item Chance (High %)
        if (Math.random() < 0.5) {
            rewards.push({ type: 'item', amount: 1, itemId: 'random_t1', name: 'Epic Drop', icon: '/assets/items/chest_t1.png', isDrop: true });
        }

        if (isFirstClear) {
            rewards.push({ type: 'gem', amount: 300, name: 'Gems', icon: '/assets/potions/gem-icon.png' });
            rewards.push({ type: 'item', amount: 1, itemId: 'rare_scroll', name: 'Rare Scroll', icon: '/assets/home/scroll/rare-summon.png' });
        }

    } else { // Normal Stages (1-4, 6-9, 11-14, 16-19, 21-24, 26-29)
        rewards.push({ type: 'soul_potion', amount: baseSoul * soulMult, name: 'Soul Potions', icon: '/assets/potions/soul-potion-icon.png' });
        rewards.push({ type: 'coin', amount: baseCoins * coinMult, name: 'Coins', icon: '/assets/potions/coin-icon.png' });

        // Chance for shard (1x)
        // Table: "1x Item Shard (Specific to Map)" as Secondary Drop (Chance)
        // Let's say 40% chance
        const shardRoll = Math.random();
        if (shardRoll < 0.40) {
            const qty = Math.floor(Math.random() * (shardMax - shardMin + 1)) + shardMin;
            rewards.push({
                type: 'item_shard',
                amount: qty,
                itemId: shardConfig.id,
                name: shardConfig.name,
                icon: shardConfig.icon
            });
        }
    }

    return rewards;
}
