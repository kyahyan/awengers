
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

export const HERO_ASSETS: HeroAssetConfig[] = [
    {
        name: "Phoenix Ranger",
        modelPath: "/assets/Characters/Heroes/Phoenix Ranger/phoenix ranger/phoenix ranger with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Phoenix Ranger/phoenix ranger/FH_YX_D.png",
        normalMapPath: "/assets/Characters/Heroes/Phoenix Ranger/phoenix ranger/FH_YX_normHeroNorRGB24.png",
        scale: 0.007,
        use2DSprite: true, // Enable 2D sprite mode
        sprite2D: {
            spritesheetPath: "/assets/heroes/phoenix_ranger/iso-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 24,
            totalFrames: 24,
            fps: 24
        }
    },
    {
        name: "Phoenix Ranger Left",
        modelPath: "/assets/Characters/Heroes/Phoenix Ranger/phoenix ranger/phoenix ranger with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Phoenix Ranger/phoenix ranger/FH_YX_D.png",
        scale: 0.007,
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/phoenix_ranger/iso-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 24,
            totalFrames: 24,
            fps: 24
        }
    },
    {
        name: "Tiger Grinch",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/Mythic/tiger assassin the grinch/iso-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 24,
            totalFrames: 24,
            fps: 24
        }
    },
    {
        name: "Tiger Grinch Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/Mythic/tiger assassin the grinch/iso-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 24,
            totalFrames: 24,
            fps: 24
        }
    },
    {
        name: "Rabbit Ranger",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/Mythic/rabbit_ranger_heavy_artillery_pioneer_with_anim_spritesheets/iso-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,   // 24576 / 512 = 48
            totalFrames: 48,   // Single row with 48 frames
            fps: 24
        }
    },
    {
        name: "Rabbit Ranger Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/Mythic/rabbit_ranger_heavy_artillery_pioneer_with_anim_spritesheets/iso-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,   // 24576 / 512 = 48
            totalFrames: 48,   // Single row with 48 frames
            fps: 24
        }
    },
    {
        name: "Antelope Mage",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/antelope_mage_with_animation_spritesheets/iso-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Antelope Mage Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/antelope_mage_with_animation_spritesheets/iso-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Antelope Ranger",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/antelope_ranger_with_animation_spritesheets/iso-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Antelope Ranger Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/antelope_ranger_with_animation_spritesheets/iso-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Boar Assassin",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/boar_assassin_with_animation_spritesheets/iso-right/Armature_Armature_idle_Base_Layer_001_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Boar Assassin Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/boar_assassin_with_animation_spritesheets/iso-left/Armature_Armature_idle_Base_Layer_001_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Bull Ranger",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/bull_ranger_with_animation_spritesheets/iso-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Bull Ranger Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/bull_ranger_with_animation_spritesheets/iso-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Bull Assassin",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/bull_assassin_with_anim_spritesheets/iso-right/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Bull Assassin Left",
        use2DSprite: true,
        sprite2D: {
            spritesheetPath: "/assets/heroes/bull_assassin_with_anim_spritesheets/iso-left/Armature_Armature_idle_Base_Layer_spritesheet.png",
            frameWidth: 512,
            frameHeight: 512,
            framesPerRow: 48,
            totalFrames: 48,
            fps: 24
        }
    },
    {
        name: "Tiger Warrior",
        modelPath: "/assets/Characters/Heroes/Tiger Warrior/tiger warrior/tiger warrior with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Tiger Warrior/tiger warrior/1024laohuZS.png",
        normalMapPath: "/assets/Characters/Heroes/Tiger Warrior/tiger warrior/laohuZS_NMHeroNorRGB24.png"
    },
    {
        name: "Tiger Ranger",
        modelPath: "/assets/Characters/Heroes/Tiger Ranger/tiger ranger/tiger ranger with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Tiger Ranger/tiger ranger/1024.png",
        normalMapPath: "/assets/Characters/Heroes/Tiger Ranger/tiger ranger/laohuYX_NHeroNorRGB24.png"
    },
    {
        name: "Wolf Assassin",
        modelPath: "/assets/Characters/Heroes/Wolf Assassin/wolf assassin/wolf assassin with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Wolf Assassin/wolf assassin/langrenCK.png",
        normalMapPath: "/assets/Characters/Heroes/Wolf Assassin/wolf assassin/langrenCK_NHeroNorRGB24.png"
    },
    {
        name: "Antelope Mage",
        modelPath: "/assets/Characters/Heroes/Antelope Mage/antelope mage/antelope mage with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Antelope Mage/antelope mage/lingyangfashi_col.png",
        normalMapPath: "/assets/Characters/Heroes/Antelope Mage/antelope mage/lingyangfashi_normHeroNorRGB24.png"
    },
    {
        name: "Boar Assassin",
        modelPath: "/assets/Characters/Heroes/Boar Assassin/boar assassin/boar assassin with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Boar Assassin/boar assassin/yezhucike_col.png",
        normalMapPath: "/assets/Characters/Heroes/Boar Assassin/boar assassin/yezhucike_normHeroNorRGB24.png"
    },
    {
        name: "Bull Assassin",
        modelPath: "/assets/Characters/Heroes/Bull Assassin/bull assassin/bull assassin with anim.fbx",
        texturePath: "/assets/Characters/Heroes/Bull Assassin/bull assassin/niucike_col.png",
        normalMapPath: "/assets/Characters/Heroes/Bull Assassin/bull assassin/niucike_normHeroNorRGB24.png"
    },
    {
        name: "Bull Mage",
        modelPath: "/assets/Characters/Heroes/Bull Mage/bull mage/bull mage with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Bull Mage/bull mage/niuFS.png",
        normalMapPath: "/assets/Characters/Heroes/Bull Mage/bull mage/niuFS_NHeroNorRGB24.png"
    },
    {
        name: "Bull Ranger",
        modelPath: "/assets/Characters/Heroes/Bull Ranger/bull ranger/bull ranger with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Bull Ranger/bull ranger/niuYX.png",
        normalMapPath: "/assets/Characters/Heroes/Bull Ranger/bull ranger/niuYX_NHeroNorRGB24.png"
    },
    {
        name: "Antelope Ranger",
        modelPath: "/assets/Characters/Heroes/Antelope Ranger/antelope ranger/antelope ranger with animation.fbx",
        texturePath: "/assets/Characters/Heroes/Antelope Ranger/antelope ranger/512pf.png",
        normalMapPath: "/assets/Characters/Heroes/Antelope Ranger/antelope ranger/LY-NM-U3HeroNorRGB24.png"
    },


];

export function getRandomHeroes(count: number): HeroAssetConfig[] {
    const shuffled = [...HERO_ASSETS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
