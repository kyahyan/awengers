// Enemy Definitions for Adventure Mode

export interface EnemyAnimationConfig {
    file: string;
    frames: number;
    framesPerRow: number;
}

export interface EnemySprite {
    basePath: string;
    frameSize: number;
    icon?: string; // Optional icon override for battle UI
    animations: {

        idle: EnemyAnimationConfig;
        attack: EnemyAnimationConfig;
        hit: EnemyAnimationConfig;
        dead: EnemyAnimationConfig;
        walk?: EnemyAnimationConfig;
    };
}

export interface EnemyDefinition {
    id: string;
    name: string;
    displayName: string;
    type: 'normal' | 'elite' | 'boss';
    icon: string;
    baseStats: {
        hp: number;
        atk: number;
        def: number;
        speed: number;
        crit: string;
    };
    sprite: EnemySprite;
}

// Scaling function for enemy stats
export function getEnemyStatsForLevel(enemy: EnemyDefinition, level: number): EnemyDefinition['baseStats'] {
    const base = enemy.baseStats;
    const mult = enemy.type === 'boss' ? 2.5 : enemy.type === 'elite' ? 1.5 : 1.0;

    // Scale stats based on level
    const levelMult = 1 + (level * 0.1); // +10% per level

    return {
        hp: Math.floor(base.hp * levelMult * mult),
        atk: Math.floor(base.atk * levelMult * mult),
        def: Math.floor(base.def * levelMult * mult),
        speed: base.speed,
        crit: base.crit
    };
}

// Boar Assassin Enemy Definition
const BOAR_ASSASSIN: EnemyDefinition = {
    id: 'boar',
    name: 'Boar Assassin',
    displayName: 'Boar Assassin',
    type: 'normal',
    icon: '/assets/Character/enemy/boar_assassin_with_animation_spritesheets/portrait/boar%20assassin.jpg',
    baseStats: {
        hp: 800,
        atk: 55,
        def: 25,
        speed: 0.8,
        crit: '10%'
    },
    sprite: {
        basePath: '/assets/Character/enemy/boar_assassin_with_animation_spritesheets/side-right/',
        frameSize: 512,
        animations: {
            idle: {
                file: 'Armature_Armature_idle_Base_Layer_001_spritesheet.png',
                frames: 48,
                framesPerRow: 5
            },
            attack: {
                file: 'Armature_Armature_skill1_Base_Layer_001_spritesheet.png',
                frames: 40, // Estimation based on hero config logic or similar
                framesPerRow: 5
            },
            hit: {
                file: 'Armature_Armature_hit1_Base_Layer_001_spritesheet.png',
                frames: 12, // Adjusted to remove blinking blanks
                framesPerRow: 5
            },
            dead: {
                file: 'Armature_Armature_dead_Base_Layer_001_spritesheet.png',
                frames: 59, // Estimation
                framesPerRow: 5
            }
        }
    }
};

// Elite Boar variant
const BOAR_ELITE: EnemyDefinition = {
    ...BOAR_ASSASSIN,
    id: 'boar_elite',
    displayName: 'Shadow Boar',
    type: 'elite',
    baseStats: {
        hp: 1500,
        atk: 75,
        def: 40,
        speed: 1.0,
        crit: '15%'
    }
};

// Boss Boar variant
const BOAR_BOSS: EnemyDefinition = {
    ...BOAR_ASSASSIN,
    id: 'boar_boss',
    displayName: 'Boar Overlord',
    type: 'boss',
    baseStats: {
        hp: 3000,
        atk: 100,
        def: 60,
        speed: 0.8,
        crit: '20%'
    }
};

// Export all enemies
export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
    BOAR_ASSASSIN,
    BOAR_ELITE,
    BOAR_BOSS
];

// Helper to get enemy by ID
export function getEnemyById(id: string): EnemyDefinition | undefined {
    return ENEMY_DEFINITIONS.find(e => e.id === id);
}
