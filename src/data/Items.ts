
export interface ItemDef {
    id: string;
    name: string;
    icon: string;
    description: string;
    type: 'material' | 'consumable' | 'equipment';
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
    }
};
