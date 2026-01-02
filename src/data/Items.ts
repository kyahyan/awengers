/**
 * Items Database - Backwards Compatibility Layer
 * Full item system is now in ItemSystem.ts
 */

import { ALL_ITEMS, MATERIALS } from './ItemSystem';
import type { ItemDefinition, MaterialDefinition } from './ItemSystem';

// Re-export for backwards compatibility
export { ALL_ITEMS, MATERIALS };
export type { ItemDefinition, MaterialDefinition };
export * from './ItemSystem';

// Legacy ItemDef interface for backwards compatibility
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

// Convert new format to legacy format
function toLegacyFormat(item: ItemDefinition): ItemDef {
    return {
        id: item.id,
        name: item.name,
        icon: item.icon,
        description: item.description,
        type: 'equipment',
        stats: item.baseStats
    };
}

// Legacy ITEMS object for backwards compatibility
export const ITEMS: Record<string, ItemDef> = {
    // Consumables (unchanged)
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
    // Materials
    "polishing_powder": {
        id: "polishing_powder",
        name: "Polishing Powder",
        icon: "/assets/craft/Polishing Powder.png",
        description: "Fine powder used to enhance equipment.",
        type: "material"
    },
    // Equipment - Convert from new system
    ...Object.fromEntries(
        Object.entries(ALL_ITEMS).map(([key, item]) => [key, toLegacyFormat(item)])
    )
};
