
export interface ItemDef {
    id: string;
    name: string;
    icon: string;
    description: string;
    type: 'material' | 'consumable' | 'equipment';
    stats?: {
        hp?: number;
        atk?: number;
        armor?: number;
        aspd?: number;
        moveSpeed?: number;
        lifesteal?: number;
        str?: number;
        agi?: number;
        int?: number;
    };
}

export const ITEMS: Record<string, ItemDef> = {
    "grand_summon": {
        id: "grand_summon",
        name: "Grand Summon Scroll",
        icon: "/assets/home/scroll/grand-summon.png",
        description: "A mystical scroll used to summon heroes.",
        type: "consumable"
    },
    "common_summon": {
        id: "common_summon",
        name: "Common Summon Scroll",
        icon: "/assets/home/scroll/common-summon.png",
        description: "A basic scroll for common summons.",
        type: "consumable"
    },
    "mythic_summon": {
        id: "mythic_summon",
        name: "Mythic Summon Scroll",
        icon: "/assets/home/scroll/mythic-summon.png",
        description: "A legendary scroll for mythic summons.",
        type: "consumable"
    },
    "shards": {
        id: "shards",
        name: "Hero Shards",
        icon: "/assets/home/scroll/shards.png",
        description: "Fragments used to unlock specific heroes.",
        type: "material"
    },
    // Tier 1 Items
    "iron_leaf": {
        id: "iron_leaf",
        name: "Iron Leaf",
        icon: "/assets/item/Tier 1/Iron Leaf.png",
        description: "A metallic leaf found in the Ironwood Forest. Its unnatural stiffness provides basic protection.\n\nStats:\n+25 Defense",
        type: "equipment",
        stats: { armor: 25 }
    },
    "bear_claw": {
        id: "bear_claw",
        name: "Bear Claw",
        icon: "/assets/item/Tier 1/Bear Claw.png",
        description: "Sharp claw of an Ursine Warrior. Channels raw power into your strikes.\n\nStats:\n+35 Strength",
        type: "equipment",
        stats: { str: 35 }
    },
    "swift_paw": {
        id: "swift_paw",
        name: "Swift Paw",
        icon: "/assets/item/Tier 1/Swift Paw.png",
        description: "Severed paw of a wind stalker. It twitches with restless energy.\n\nStats:\n+35 Agility",
        type: "equipment",
        stats: { agi: 35 }
    },
    "wisdom_plume": {
        id: "wisdom_plume",
        name: "Wisdom Plume",
        icon: "/assets/item/Tier 1/Wisdom Plume.png",
        description: "A shimmering feather from the legendary Owl of Ages. Whispers secrets of the arcane.\n\nStats:\n+35 Intelligence",
        type: "equipment",
        stats: { int: 35 }
    },
    "turtle_shell": {
        id: "turtle_shell",
        name: "Turtle Shell Fragment",
        icon: "/assets/item/Tier 1/Turtle Shell Fragment.png",
        description: "A sturdy shard from an ancient tortoise. Deflects blows with ease.\n\nStats:\n+45 Defense",
        type: "equipment",
        stats: { armor: 45 }
    },
    "ring_life": {
        id: "ring_life",
        name: "Ring of Life",
        icon: "/assets/item/Tier 1/Ring of Life.png",
        description: "A wooden ring pulsing with nature's heartbeat. Increases vitality.\n\nStats:\n+450 Max HP",
        type: "equipment",
        stats: { hp: 450 }
    },
    "vampire_tooth": {
        id: "vampire_tooth",
        name: "Vampire Tooth",
        icon: "/assets/item/Tier 1/Vampire Tooth.png",
        description: "A sharp fang that thirsts for blood. Heals the wielder upon striking foes.\n\nStats:\n+8% Lifesteal",
        type: "equipment",
        stats: { lifesteal: 8 }
    },
    "basic_boots": {
        id: "basic_boots",
        name: "Basic Boots",
        icon: "/assets/item/Tier 1/Basic Boots.png",
        description: "Simple leather boots. Essential for any adventurer looking to pick up the pace.\n\nStats:\n+25 Move Speed",
        type: "equipment",
        stats: { moveSpeed: 25 }
    }
};
