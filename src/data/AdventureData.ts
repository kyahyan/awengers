export interface StageDefinition {
    id: number;
    name: string;
    description?: string;
    energyCost: number; // 0 for now as requested
    recommendedLevel: number;
    enemies: string[]; // List of enemy icon paths or IDs
    drops: string[]; // List of drop icon paths
}

export const JADE_LOTUS_SHRINE_STAGES: StageDefinition[] = [];

const STAGE_NAMES = [
    "Shrine Entrance", "Stone Steps", "Bamboo Path", "Lotus Pond", "Spirit Gate",
    "Guardian's Post", "Whispering Woods", "Ancient Bridge", "Inner Courtyard", "Hall of Meditation",
    "Secret Garden", "Misty Outlook", "Shadow Corner", "Crystal Spring", "Golden Statue",
    "Forbidden Wing", "Archive Hall", "Training Grounds", "Master's Dojo", "Sacred Altar",
    "Hidden Chamber", "Artifact Vault", "Cloud Terrace", "Sky Walkway", "Dragon Pillar",
    "Phoenix Nest", "Celestial Stairs", "Void Rift", "Eternal Sanctum", "The Final Test"
];

// Mock enemies (using existing hero assets or placeholder icons)
const MOCK_ENEMIES = [
    '/assets/avatar/1.png',
    '/assets/avatar/2.png',
    '/assets/avatar/3.png',
    '/assets/avatar/4.png'
];

// Mock drops
const MOCK_DROPS = [
    '/assets/items/gold.png',
    '/assets/items/exp_potion.png'
];

for (let i = 1; i <= 30; i++) {
    const enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies per stage
    const enemies = [];
    for (let j = 0; j < enemyCount; j++) {
        enemies.push(MOCK_ENEMIES[Math.floor(Math.random() * MOCK_ENEMIES.length)]);
    }

    JADE_LOTUS_SHRINE_STAGES.push({
        id: i,
        name: `${i}. ${STAGE_NAMES[i - 1] || 'Unknown Area'}`,
        description: "A challenging battle awaits.",
        energyCost: 0,
        recommendedLevel: i * 2, // Scaling level
        enemies: enemies,
        drops: MOCK_DROPS
    });
}
