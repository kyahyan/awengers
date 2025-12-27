import * as THREE from 'three';
import { Hero, HeroAttribute } from './Hero';

export class Ranger extends Hero {
    constructor(
        scene: THREE.Scene,
        modelPath?: string,
        texturePath?: string,
        normalMapPath?: string,
        onLoad?: () => void,
        onError?: (msg: string) => void
    ) {
        // Ranger might want to use the default values which differ from base if needed, 
        // but base Hero already defaults to Phoenix Ranger.
        super(scene, modelPath, texturePath, normalMapPath, onLoad, onError);
        this.attribute = HeroAttribute.Agility;
    }
}
