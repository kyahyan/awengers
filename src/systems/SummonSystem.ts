
import { HERO_DEFINITIONS, HeroDef } from "../data/HeroDefinitions";

export type Rarity = 'Standard' | 'Rare' | 'Legendary' | 'Mythic';

// Helper to flatten definitions
const ALL_HEROES: HeroDef[] = [];
Object.values(HERO_DEFINITIONS).forEach((list: HeroDef[]) => {
    ALL_HEROES.push(...list);
});

export class SummonSystem {

    // Rates for now: 
    // Standard: 60%
    // Rare: 25% (Not explicitly in data, most are Standard or Mythic, let's treat Standard as Common/Rare mix)
    // Legend: 10% (Assuming some standard are actually higher tier if we had that field, but currently only Standard/Mythic mostly visible. Let's just use existing rarities)

    // Data check:
    // Rarity in definitions: "Standard", "Mythic" are the main ones seen.
    // Let's check if there are others.

    // Logic:
    // 1. Roll 0-100
    // 2. Filter heroes by rarity
    // 3. Pick random

    public static summon(): HeroDef {
        const roll = Math.random() * 100;
        let selectedRarity = 'Standard';

        // Simple Rates
        if (roll > 98) selectedRarity = 'Mythic'; // 2% for Mythic
        else selectedRarity = 'Standard'; // 98% Standard

        // Since we only really have Standard and Mythic labeled in the large JSON dump mostly,
        // let's stick to that.

        const pool = ALL_HEROES.filter(h => h.rarity === selectedRarity);
        if (pool.length === 0) {
            // Fallback
            return ALL_HEROES[Math.floor(Math.random() * ALL_HEROES.length)];
        }

        const hero = pool[Math.floor(Math.random() * pool.length)];
        return hero;
    }
}
