import * as THREE from 'three';
import { Hero, HeroAttribute } from './Hero';

export class Mage extends Hero {
    constructor(
        scene: THREE.Scene,
        modelPath?: string,
        texturePath?: string,
        normalMapPath?: string,
        onLoad?: () => void,
        onError?: (msg: string) => void
    ) {
        super(scene, modelPath, texturePath, normalMapPath, onLoad, onError);
        this.attribute = HeroAttribute.Intelligence;
    }
}
