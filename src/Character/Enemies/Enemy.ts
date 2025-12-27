import * as THREE from 'three';
// @ts-ignore
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class Enemy {
    public mesh: THREE.Group | null = null;
    private mixer: THREE.AnimationMixer | null = null;
    public loaded: boolean = false;

    // Metadata
    public name: string; // The "Boss Name" or generic name
    public codeName: string; // The "Code Name"
    public role: string; // Tank, Bruiser, etc.
    public vibe: string;
    public ability: string;
    public imagePath?: string;

    constructor(
        scene: THREE.Scene,
        name: string,
        codeName: string,
        role: string,
        vibe: string,
        ability: string,
        modelPath?: string,
        texturePath?: string,
        onLoad?: () => void,
        onError?: (msg: string) => void
    ) {
        this.name = name;
        this.codeName = codeName;
        this.role = role;
        this.vibe = vibe;
        this.ability = ability;

        if (!modelPath) return; // Allow data-only instantiation

        const fbxLoader = new FBXLoader();
        const textureLoader = new THREE.TextureLoader();

        // Optional texture loading
        let colorMap = null;
        if (texturePath) {
            colorMap = textureLoader.load(texturePath);
        }

        fbxLoader.load(
            modelPath,
            (object: THREE.Group) => {
                this.mesh = object;
                this.mesh.scale.set(0.012, 0.012, 0.012); // Default scale, adjust as needed
                this.mesh.rotation.y = -Math.PI / 2; // Face opposite to heroes
                this.mesh.position.set(1.5, 0, 0); // Position on the right

                if (colorMap) {
                    const material = new THREE.MeshStandardMaterial({
                        map: colorMap,
                        roughness: 0.8,
                        metalness: 0.2
                    });
                    this.mesh.traverse((child: any) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.material = material;
                        }
                    });
                }

                scene.add(this.mesh);

                // Animations
                this.mixer = new THREE.AnimationMixer(this.mesh);
                // @ts-ignore
                const animations = object.animations;
                if (animations && animations.length > 0) {
                    this.mixer.clipAction(animations[0]).play();
                }

                this.loaded = true;
                if (onLoad) onLoad();
            },
            undefined,
            (err: any) => {
                console.error(`Error loading enemy ${name}`, err);
                if (onError) onError(err ? err.message : 'Unknown Error');
            }
        );
    }

    public update(delta: number) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}
