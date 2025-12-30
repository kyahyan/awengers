
export interface HeroStats {
    str: number;
    agi: number;
    int: number;
}

export interface HeroSkill {
    name: string;
    cd?: number;
    effect: string;
    type?: string;
    condition?: string;
}

export interface HeroSkills {
    active1: HeroSkill;
    active2: HeroSkill;
    passive1: HeroSkill;
    passive2: HeroSkill;
}

export interface HeroDef {
    name: string;
    codeName: string;
    class: string;
    rarity: string;
    baseStats: HeroStats;
    growth: HeroStats;
    skillCd: number;
    ultCd: number;
    skills?: HeroSkills;
}

// HEROES CLEARED - Add heroes one by one here
// Backup saved to: HeroDefinitions.backup.ts
export const HERO_DEFINITIONS: Record<string, HeroDef[]> = {
    "Strength": [],
    "Agility": [
        {
            name: "Antelope Ranger", codeName: "Antelope Ranger", class: "Ranger", rarity: "Standard",
            baseStats: { str: 10, agi: 18, int: 8 }, growth: { str: 1.2, agi: 3.5, int: 1.0 },
            skillCd: 10, ultCd: 30,
            skills: {
                active1: { name: "Wind-Piercer", effect: "Damage", type: "Active" },
                active2: { name: "Back-Kick Vault", effect: "Stun", type: "Active" },
                passive1: { name: "Hunter's Mark", effect: "Buff", type: "Passive" },
                passive2: { name: "Agility Boost", effect: "Stats", type: "Passive" }
            }
        },
        {
            name: "Razor", codeName: "Razor", class: "Assassin", rarity: "Standard",
            baseStats: { str: 12, agi: 20, int: 6 }, growth: { str: 1.5, agi: 3.8, int: 0.8 },
            skillCd: 8, ultCd: 35,
            skills: {
                active1: { name: "Tusk Gore", effect: "Bleed", type: "Active" },
                active2: { name: "Wild Charge", effect: "Stun", type: "Active" },
                passive1: { name: "Blood Scent", effect: "Buff", type: "Passive" },
                passive2: { name: "Assassin Instinct", effect: "Crit", type: "Passive" }
            }
        }
    ],
    "Intelligence": [
        {
            name: "Antelope Mage", codeName: "Antelope Mage", class: "Mage", rarity: "Standard",
            baseStats: { str: 8, agi: 10, int: 20 }, growth: { str: 1.0, agi: 1.5, int: 3.8 },
            skillCd: 12, ultCd: 40,
            skills: {
                active1: { name: "Horn Bolt", effect: "Damage", type: "Active" },
                active2: { name: "Astral Leap", effect: "Teleport", type: "Active" },
                passive1: { name: "Static Hooves", effect: "Charge", type: "Passive" },
                passive2: { name: "Arcane Aura", effect: "Regen", type: "Passive" }
            }
        }
    ]
};

export const STAR_RANK_CONFIG: Record<number, { maxLevel: number, multiplier: number }> = {
    1: { maxLevel: 10, multiplier: 1.0 },
    2: { maxLevel: 30, multiplier: 1.5 },
    3: { maxLevel: 60, multiplier: 2.5 },
    4: { maxLevel: 100, multiplier: 4.0 },
    5: { maxLevel: 120, multiplier: 6.0 },
    6: { maxLevel: 140, multiplier: 8.5 },
    7: { maxLevel: 160, multiplier: 12.0 },
    8: { maxLevel: 180, multiplier: 16.0 },
    9: { maxLevel: 200, multiplier: 22.0 },
    10: { maxLevel: 200, multiplier: 35.0 }
};

export function calculateHeroStats(def: HeroDef, level: number, stars: number): HeroStats {
    const config = STAR_RANK_CONFIG[stars] || STAR_RANK_CONFIG[1];
    const multiplier = config.multiplier;

    return {
        str: Math.round((def.baseStats.str + (def.growth.str * (level - 1))) * multiplier),
        agi: Math.round((def.baseStats.agi + (def.growth.agi * (level - 1))) * multiplier),
        int: Math.round((def.baseStats.int + (def.growth.int * (level - 1))) * multiplier)
    };
}
