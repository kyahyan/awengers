import * as THREE from 'three';
import { UIManager } from '../ui/UIManager';
import { Hero } from '../Character/Heroes/Hero';
import { SpriteHero } from '../Character/Heroes/SpriteHero';
import { HERO_ASSETS } from '../data/HeroAssetsMap';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { STATIC_ASSETS } from '../data/StaticAssets';

export class GameManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private uiManager: UIManager;

    private heroes: (Hero | SpriteHero)[] = [];
    private clock: THREE.Clock;

    constructor() {
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x000000); // Solid Black Background

        // Isometric-like Perspective
        // FOV 30 for low field of view (orthographic feel)
        this.camera = new THREE.PerspectiveCamera(30, 2160 / 1080, 0.1, 1000);
        this.camera.position.set(12, 12, 12); // Moved closer to zoom in (was 20,20,20)
        this.camera.lookAt(0, 0, 0); // Shift focus Left, so objects appear Right

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Transparent
        this.renderer.setSize(2160, 1080);
        this.renderer.shadowMap.enabled = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setClearColor(0x000000, 0); // Transparent background

        const gameLayer = document.getElementById('game-layer');
        if (gameLayer) gameLayer.appendChild(this.renderer.domElement);

        // this.createBackground(); // Removed DOM background

        this.clock = new THREE.Clock();

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Low base ambient
        this.scene.add(ambientLight);

        // Hemisphere Light for better color saturation and fill
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 2);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2.5); // Very bright sun
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        this.uiManager = new UIManager();
        this.uiManager.setDebugText('Game Initialized - Waiting for Login');
        this.uiManager.registerHeroUpdateCallback((names) => this.updateHeroes(names));
        this.uiManager.onStartLoading = () => {
            this.uiManager.showLoading();
            this.preloadAssets();
        };
        // Wait for Login to Init Scene
        this.uiManager.onGameStart = () => {
            this.uiManager.setDebugText('Login Success - Starting Battle');
            this.initHomeScreen();
        };
        // Preview Callbacks
        this.uiManager.onPreviewHero = (name) => this.previewHero(name);
        this.uiManager.onPreviewClose = () => this.restoreHomeScene();

        // Start Preloading if session was restored (loading UI exists)
        if (this.uiManager.loadingUI) {
            this.preloadAssets();
        }

        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.onWindowResize(); // Force initial scale

        this.animate();
    }

    private onWindowResize() {
        // Scaling Logic
        const root = document.getElementById('game-root');
        if (!root) return;

        const targetW = 2160;
        const targetH = 1080;
        const aspect = targetW / targetH;

        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const winAspect = winW / winH;

        let scale;
        if (winAspect > aspect) {
            // Window is wider than target, fit to height
            scale = winH / targetH;
        } else {
            // Window is narrower than target, fit to width
            scale = winW / targetW;
        }

        root.style.transform = `scale(${scale})`;
    }

    /*
    private createBackground() {
        // Removed for 3D Scene Background
    }
    */

    private initHomeScreen() {
        // Clear screen on init
        this.heroes.forEach(h => {
            h.destroy(this.scene);
        });
        this.heroes = [];
        this.uiManager.setSelectedHeroes([]);

        // Cleared hardcoded test heroes to fix background ghosting
    }

    private spawnHero(name: string, position: THREE.Vector3, lookAt: THREE.Vector3): Hero | SpriteHero | undefined {
        const assetData = HERO_ASSETS.find(a => a.name === name);
        if (!assetData) return undefined;

        // Check if we should use 2D sprite
        if (assetData.use2DSprite && assetData.sprite2D) {
            const spriteHero = new SpriteHero(
                this.scene,
                assetData.sprite2D,
                () => {
                    // On Load
                    if (spriteHero.mesh) {
                        spriteHero.mesh.position.set(position.x, position.y, position.z);
                        spriteHero.mesh.lookAt(lookAt);
                        (spriteHero as any).targetPosition = position;
                    }
                },
                (err) => console.error(err)
            );
            this.heroes.push(spriteHero);
            return spriteHero;
        }

        // Use 3D model
        if (!assetData.modelPath || !assetData.texturePath) {
            console.error(`Missing 3D model paths for ${name}`);
            return undefined;
        }

        const hero = new Hero(
            this.scene,
            assetData.modelPath,
            assetData.texturePath,
            assetData.normalMapPath,
            () => {
                // On Load
                if (hero.mesh) {
                    hero.mesh.position.set(position.x, position.y, position.z);
                    hero.mesh.lookAt(lookAt);
                    (hero as any).targetPosition = position; // Maintain pos
                }
            },
            (err) => console.error(err),
            assetData.scale,
            assetData.rotationCorrection // Pass Rotation Correction
        );
        this.heroes.push(hero);
        return hero;
    }

    public updateHeroes(heroNames: string[]) {
        // Only update if we are NOT in home screen/idle mode? 
        // For now, this is used by Roster/Deploy, so if called, we clear the battle.
        if (heroNames.length === 0) return; // Don't clear if empty passed (unless intentional)

        // Clear existing
        this.heroes.forEach(h => {
            h.destroy(this.scene);
        });
        this.heroes = [];

        heroNames.forEach((name, index) => {
            // Grid Logic for Roster View
            const row = index < 3 ? 0 : 1;
            const col = index % 3;

            const x = (col - 1) * 3;
            const z = row === 0 ? 2 : -2;

            const position = new THREE.Vector3(x, 0, z);
            const lookAt = new THREE.Vector3(x, 0, z + 10);

            // Use spawnHero which handles both 2D and 3D
            const hero = this.spawnHero(name, position, lookAt);
            if (hero) {
                (hero as any).targetPosition = position;
            }
        });
    }

    public previewHero(heroName: string) {
        // 1. Clear Current Scene
        // 1. Clear Current Scene
        this.heroes.forEach(h => {
            h.destroy(this.scene);
        });
        this.heroes = [];

        // 2. Adjust Camera for Portrait/Preview
        // Hero will be at x = -2 (Left). Camera at x=0 Center looking straight.
        this.camera.position.set(0, 1.5, 6);
        this.camera.lookAt(0, 1.5, 0);

        // 3. Spawn Hero at Left Side (-2)
        // Rotate hero slightly to face slightly right towards the center bias? Or just straight.
        // RotationCorrection is applied in spawnHero internally if needed, but we can rotate the wrapper.
        const hero = this.spawnHero(heroName, new THREE.Vector3(-2, 0, 0), new THREE.Vector3(-2, 0, 10));

        // Since spawnHero appends to this.heroes, we can access it.
        // Let's rotate it slightly to face the user nicely.
        // Default RotationCorrection usually faces them Z+.
        // Let's make it face a bit right since it's on left.
        if (hero) {
            // Wait for load or set immediate rotation on wrapper?
            // Wrapper is accessible via hero.mesh
            // But hero.mesh is null until loaded async.
            // We can pass a callback or just trust the default for now.
            // Ideally we'd rotate it a bit: hero.rotate(0.2); 
        }
    }

    public restoreHomeScene() {
        // Reset Camera
        this.camera.position.set(12, 12, 12);
        this.camera.lookAt(0, 0, 0);

        // Restore Teams
        this.initHomeScreen();
    }

    private async preloadAssets() {
        const loadingUI = this.uiManager.loadingUI;
        // If no loading UI (e.g. guest login -> directly to game? or should have been created by onStartLoading)
        if (!loadingUI) {
            this.uiManager.showLoginOrGame();
            return;
        }

        const totalAssets = HERO_ASSETS.length + STATIC_ASSETS.length;
        let loadedCount = 0;

        const loader = new FBXLoader();
        const textureLoader = new THREE.TextureLoader();
        const imageLoader = new THREE.ImageLoader();

        // 1. Preload Hero Models & Textures
        for (const asset of HERO_ASSETS) {
            try {
                loadingUI.updateProgress((loadedCount / totalAssets) * 100, `Loading ${asset.name}...`);

                // Check if using 2D sprite
                if (asset.use2DSprite && asset.sprite2D) {
                    // Preload spritesheet
                    await new Promise<void>((resolve) => {
                        textureLoader.load(asset.sprite2D!.spritesheetPath, () => resolve(), undefined, () => resolve());
                    });
                } else if (asset.modelPath && asset.texturePath) {
                    // Load 3D Model
                    await new Promise<void>((resolve, reject) => {
                        loader.load(asset.modelPath!, () => {
                            resolve();
                        }, undefined, (err) => reject(err));
                    });

                    // Load Textures
                    await new Promise<void>((resolve) => {
                        textureLoader.load(asset.texturePath!, () => resolve());
                    });

                    if (asset.normalMapPath) {
                        await new Promise<void>((resolve) => {
                            textureLoader.load(asset.normalMapPath!, () => resolve());
                        });
                    }
                }

                loadedCount++;
            } catch (err) {
                console.warn(`Failed to preload ${asset.name}`, err);
                // Continue anyway
                loadedCount++;
            }
        }

        // 2. Preload Static Images
        for (const path of STATIC_ASSETS) {
            try {
                loadingUI.updateProgress((loadedCount / totalAssets) * 100, `Loading Assets...`);
                await new Promise<void>((resolve) => {
                    imageLoader.load(path, () => resolve(), undefined, () => {
                        // On error, resolve anyway to not block
                        console.warn(`Failed to load image: ${path}`);
                        resolve();
                    });
                });
                loadedCount++;
            } catch (e) {
                loadedCount++;
            }
        }

        loadingUI.updateProgress(100, 'Starting Game...');

        // Brief delay to show 100%
        setTimeout(() => {
            loadingUI.hide();
            this.uiManager.showLoginOrGame();
        }, 500);
    }

    private animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        this.heroes.forEach(hero => {
            hero.update(delta, this.camera);
            if (hero.loaded && hero.mesh) {
                if ((hero as any).targetPosition) {
                    const pos = (hero as any).targetPosition;
                    hero.mesh.position.set(pos.x, pos.y, pos.z);
                }
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}
