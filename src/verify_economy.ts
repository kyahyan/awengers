
import { createOryxHero, HeroProgressionManager, PlayerInventory } from './data/HeroProgression';

console.log('--- STARTING ECONOMY VERIFICATION ---');

const heroManager = createOryxHero();
console.log(`Hero Initialized: ${heroManager.getConfig().name}, Level ${heroManager.getCurrentLevel()}`);

// TEST 1: Level Up Cost (Level 1 -> 2)
// Expectation: 50 Gold, 10 Soul Potions (NOT Hero Potions)
const nextCost = heroManager.getNextLevelCost(1);
console.log(`\n[TEST 1] Level 1 -> 2 Cost: Gold=${nextCost.gold}, SoulPotion=${nextCost.soulPotion}, HeroPotion=${nextCost.heroPotion}`);

if (nextCost.soulPotion === 10 && (nextCost.heroPotion === undefined || nextCost.heroPotion === 0)) {
    console.log('✅ CORRECT: Consumes Soul Potion for leveling.');
} else {
    console.error('❌ FAILED: Incorrect resource usage for leveling.');
}

// TEST 2: Perform Level Up
const inventory: PlayerInventory = {
    gold: 10000,
    soulPotion: 1000,
    heroPotion: 1000
};

console.log(`\n[TEST 2] Performing Level Up...`);
console.log(`Initial Inventory: Gold=${inventory.gold}, Soul=${inventory.soulPotion}, Hero=${inventory.heroPotion}`);

const result = heroManager.performLevelUp(inventory);

if (result.success && result.newLevel === 2) {
    console.log(`✅ Level Up Successful! New Level: ${result.newLevel}`);
    console.log(`New Inventory: Gold=${result.newInventory.gold}, Soul=${result.newInventory.soulPotion}, Hero=${result.newInventory.heroPotion}`);

    if (result.newInventory.soulPotion === 990 && result.newInventory.heroPotion === 1000) {
        console.log('✅ CORRECT: Deducted Soul Potion, ignored Hero Potion.');
    } else {
        console.error('❌ FAILED: Deducted wrong resource.');
    }
} else {
    console.error('❌ FAILED: Level Up failed.', result);
}

// TEST 3: Reach Level Cap
console.log(`\n[TEST 3] Reaching Level Cap (20)...`);
// Cheat levels
while (heroManager.getCurrentLevel() < 20) {
    heroManager.performLevelUp({ gold: 1000000, soulPotion: 1000000, heroPotion: 1000000 });
}
console.log(`Current Level: ${heroManager.getCurrentLevel()}`);
console.log(`Is At Cap: ${heroManager.isAtLevelCap()}`);

if (heroManager.isAtLevelCap()) {
    console.log('✅ CORRECT: Hero is at level cap.');
} else {
    console.error('❌ FAILED: Hero should be at level cap.');
}

// TEST 4: Rank Up Cost
// Expectation: 10000 Gold, 100 Hero Potions (NOT Soul Potions)
const rankCost = heroManager.getRankUpCost();
console.log(`\n[TEST 4] Rank Up Cost: Gold=${rankCost?.gold}, HeroPotion=${rankCost?.heroPotion}, SoulPotion=${rankCost?.soulPotion}`);

if (rankCost?.heroPotion === 100 && (rankCost?.soulPotion === undefined || rankCost?.soulPotion === 0)) {
    console.log('✅ CORRECT: Consumes Hero Potion for promotion.');
} else {
    console.error('❌ FAILED: Incorrect resource usage for promotion.');
}

// TEST 5: Perform Rank Up
console.log(`\n[TEST 5] Performing Rank Up...`);
const rankInventory: PlayerInventory = {
    gold: 50000,
    soulPotion: 50000,
    heroPotion: 500
};
const rankResult = heroManager.performRankUp(rankInventory);

if (rankResult.success) {
    console.log(`✅ Rank Up Successful! New Cap: ${rankResult.newLevelCap}`);
    console.log(`New Inventory: Gold=${rankResult.newInventory.gold}, Soul=${rankResult.newInventory.soulPotion}, Hero=${rankResult.newInventory.heroPotion}`);

    if (rankResult.newInventory.heroPotion === 400 && rankResult.newInventory.soulPotion === 50000) {
        console.log('✅ CORRECT: Deducted Hero Potion, ignored Soul Potion.');
    } else {
        console.error('❌ FAILED: Deducted wrong resource.');
    }
} else {
    console.error('❌ FAILED: Rank Up failed.', rankResult);
}

console.log('\n--- VERIFICATION COMPLETE ---');
