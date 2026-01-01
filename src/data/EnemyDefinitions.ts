// Enemy Definitions for Adventure Mode

export interface EnemyAnimationConfig {
    file: string;
    frames: number;
    framesPerRow: number;
}

export interface EnemySprite {
    basePath: string;
    frameSize: number;
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

// Treant Enemy Definition
const TREANT: EnemyDefinition = {
    id: 'treant',
    name: 'Treant',
    displayName: 'Ancient Treant',
    type: 'normal',
    icon: '/assets/enemy/demo-enemy/Treant_with_anim_spritesheets/front-view/Armature_Armature_Treant_Pose_Base_Layer_spritesheet.png',
    baseStats: {
        hp: 800,
        atk: 45,
        def: 30,
        speed: 0.6,
        crit: '5%'
    },
    sprite: {
        basePath: '/assets/enemy/demo-enemy/Treant_with_anim_spritesheets/iso-right/',
        frameSize: 512, // Estimated frame size
        animations: {
            idle: {
                file: 'Armature_Armature_Treant_Stand_Base_Layer_spritesheet.png',
                frames: 40, // Estimated
                framesPerRow: 8
            },
            attack: {
                file: 'Armature_Armature_Treant_AbilityBranchHit_Base_Layer_spritesheet.png',
                frames: 30,
                framesPerRow: 8
            },
            hit: {
                file: 'Armature_Armature_Treant_DeployEnd_Base_Layer_spritesheet.png',
                frames: 15,
                framesPerRow: 8
            },
            dead: {
                file: 'Armature_Armature_Treant_Celebration_Base_Layer_spritesheet.png',
                frames: 50,
                framesPerRow: 8
            },
            walk: {
                file: 'Armature_Armature_Treant_Walk_Base_Layer_spritesheet.png',
                frames: 20,
                framesPerRow: 8
            }
        }
    }
};

// Elite Treant variant
const TREANT_ELITE: EnemyDefinition = {
    ...TREANT,
    id: 'treant_elite',
    displayName: 'Elder Treant',
    type: 'elite',
    baseStats: {
        hp: 1200,
        atk: 65,
        def: 45,
        speed: 0.7,
        crit: '10%'
    }
};

// Boss Treant variant
const TREANT_BOSS: EnemyDefinition = {
    ...TREANT,
    id: 'treant_boss',
    displayName: 'Ancient Guardian',
    type: 'boss',
    baseStats: {
        hp: 2500,
        atk: 90,
        def: 60,
        speed: 0.5,
        crit: '15%'
    }
};

// Export all enemies
export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
    TREANT,
    TREANT_ELITE,
    TREANT_BOSS
];

// Helper to get enemy by ID
export function getEnemyById(id: string): EnemyDefinition | undefined {
    return ENEMY_DEFINITIONS.find(e => e.id === id);
}
