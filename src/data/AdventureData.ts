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

export enum Difficulty {
    NORMAL = 'Normal',
    HARD = 'Hard',
    INSANE = 'Insane'
}

export interface AdventureProgress {
    [stageId: number]: {
        [Difficulty.NORMAL]?: number; // Stars (1-3)
        [Difficulty.HARD]?: number;
        [Difficulty.INSANE]?: number;
    }
}

// Persist progress in localStorage
const STORAGE_KEY = 'awe_adventure_progress';
function loadProgress(): AdventureProgress {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
}

export const ADVENTURE_PROGRESS: AdventureProgress = loadProgress();

export function saveStageStars(stageId: number, difficulty: Difficulty, stars: number) {
    if (!ADVENTURE_PROGRESS[stageId]) ADVENTURE_PROGRESS[stageId] = {};
    const current = ADVENTURE_PROGRESS[stageId][difficulty] || 0;
    if (stars > current) {
        ADVENTURE_PROGRESS[stageId][difficulty] = stars;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ADVENTURE_PROGRESS));
    }
}

export function resetAdventureProgress() {
    for (const key in ADVENTURE_PROGRESS) delete ADVENTURE_PROGRESS[key];
    localStorage.removeItem(STORAGE_KEY);
    // Also reset max unlock if we were tracking it differently, but it seems derived or we just need to refresh.
}

export function getStageStars(stageId: number, difficulty: Difficulty): number {
    return ADVENTURE_PROGRESS[stageId]?.[difficulty] || 0;
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
    '/assets/potions/coin-icon.png',
    '/assets/potions/hero-potion-icon.png'
];

// Generate stages with Treant enemies
for (let i = 1; i <= 30; i++) {
    const enemyCount = 6; // Fixed 6 enemies per stage
    const enemies: string[] = [];

    for (let j = 0; j < enemyCount; j++) {
        // Every 10th stage has a boss, every 5th has an elite
        if (i % 10 === 0 && j === 0) {
            enemies.push('boar_boss');
        } else if (i % 5 === 0 && j === 0) {
            enemies.push('boar_elite');
        } else {
            enemies.push('boar');
        }
    }

    JADE_LOTUS_SHRINE_STAGES.push({
        id: i,
        name: `${i}. ${STAGE_NAMES[i - 1] || 'Unknown Area'}`,
        description: "A challenging battle awaits.",
        energyCost: 0,
        recommendedLevel: i, // Match Stage ID
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

export function calculateStars(totalHeroes: number, survivingHeroes: number): number {
    const dead = totalHeroes - survivingHeroes;
    if (dead === 0) return 3;
    if (dead === 1) return 2;
    return 1;
}

