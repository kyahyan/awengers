
export interface ItemDef {
    id: string;
    name: string;
    icon: string;
    description: string;
    type: 'material' | 'consumable' | 'equipment';
}

export const ITEMS: Record<string, ItemDef> = {
    "summon_book": {
        id: "summon_book",
        name: "Summon Book",
        icon: "/assets/summon/summon-book/summon-book-1.png",
        description: "A mystical book used to summon heroes.",
        type: "consumable"
    }
};
