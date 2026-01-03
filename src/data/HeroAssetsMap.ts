
export interface HeroSpriteConfig {
    spritesheetPath: string;       // Path to the spritesheet PNG
    frameWidth: number;            // Width of each frame
    frameHeight: number;           // Height of each frame
    framesPerRow: number;          // Frames per row in spritesheet
    totalFrames: number;           // Total number of frames
    fps?: number;                  // Frames per second (default 12)
}

export interface HeroAssetConfig {
    name: string;
    modelPath?: string;            // Optional - for 3D models
    texturePath?: string;          // Optional - for 3D models
    normalMapPath?: string;        // Optional - for 3D models
    scale?: number;                // Optional custom scale
    rotationCorrection?: number;   // Optional rotation correction in radians
    sprite2D?: HeroSpriteConfig;   // Optional 2D sprite configuration
    use2DSprite?: boolean;         // Whether to use 2D sprite instead of 3D model
}

// Spritesheet is 2560x5120 = 5 columns × 10 rows = 50 frames (512px each)
export const HERO_ASSETS: HeroAssetConfig[] = [
    {
        name: "Antelope Mage",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/Character/heroes/antelope_mage_with_animation_spritesheets/side-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 5,       // 2560 / 512 = 5 columns
            totalFrames: 48,       // Actual animation frames
            fps: 24
        }
    },
    {
        name: "Antelope Mage Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/Character/heroes/antelope_mage_with_animation_spritesheets/side-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 5,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Antelope Ranger",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/Character/heroes/antelope_ranger_with_animation_spritesheets/side-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 5,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Antelope Ranger Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/Character/heroes/antelope_ranger_with_animation_spritesheets/side-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 5,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Razor",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/Character/heroes/boar_assassin_with_animation_spritesheets/side-left/Armature_Armature_idle_Base_Layer_001_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 5,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Razor Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/Character/heroes/boar_assassin_with_animation_spritesheets/side-right/Armature_Armature_idle_Base_Layer_001_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 5,
            totalFrames: 48,
            fps: 24
        }
    }
];

export function getRandomHeroes(count: number): HeroAssetConfig[] {
    const shuffled = [...HERO_ASSETS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
