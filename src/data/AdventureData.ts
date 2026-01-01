import { ENEMY_DEFINITIONS, EnemyDefinition } from './EnemyDefinitions';

export interface StageDefinition {
    id: number;
    name: string;
    description?: string;
    energyCost: number; // 0 for now as requested
    recommendedLevel: number;
    enemyIds: string[]; // List of enemy definition IDs
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

// Mock drops
const MOCK_DROPS = [
    '/assets/items/gold.png',
    '/assets/items/exp_potion.png'
];

// Generate stages with Treant enemies
for (let i = 1; i <= 30; i++) {
    const enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies per stage
    const enemies: string[] = [];

    for (let j = 0; j < enemyCount; j++) {
        // Every 10th stage has a boss, every 5th has an elite
        if (i % 10 === 0 && j === 0) {
            enemies.push('treant_boss');
        } else if (i % 5 === 0 && j === 0) {
            enemies.push('treant_elite');
        } else {
            enemies.push('treant');
        }
    }

    JADE_LOTUS_SHRINE_STAGES.push({
        id: i,
        name: `${i}. ${STAGE_NAMES[i - 1] || 'Unknown Area'}`,
        description: "A challenging battle awaits.",
        energyCost: 0,
        recommendedLevel: i * 2, // Scaling level
        enemyIds: enemies,
        drops: MOCK_DROPS
    });
}

// Helper to get enemy icons for a stage
export function getStageEnemyIcons(stage: StageDefinition): string[] {
    return stage.enemyIds.map(id => {
        const enemy = ENEMY_DEFINITIONS.find(e => e.id === id);
        return enemy?.icon || '/assets/avatar/1.png';
    });
}

// Helper to get first enemy for battle
export function getStageMainEnemy(stage: StageDefinition): EnemyDefinition | undefined {
    const id = stage.enemyIds[0];
    return ENEMY_DEFINITIONS.find(e => e.id === id);
}

