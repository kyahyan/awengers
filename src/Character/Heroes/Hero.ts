import * as THREE from 'three';
// @ts-ignore
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export enum HeroAttribute {
    Strength = 'Strength',
    Agility = 'Agility',
    Intelligence = 'Intelligence'
}

export class Hero {
    public mesh: THREE.Group | null = null;
    private mixer: THREE.AnimationMixer | null = null;
    public loaded: boolean = false;
    public attribute: HeroAttribute = HeroAttribute.Strength; // Default, overridden by subclasses

    // Animation Actions
    private idleAction: THREE.AnimationAction | null = null;
    private attackAction: THREE.AnimationAction | null = null;
    private currentAction: THREE.AnimationAction | null = null;

    // Cooldown System
    private currentCooldown: number = 0;
    private maxCooldown: number = 3.0; // 3 Seconds for Skill/Attack
    private isAttacking: boolean = false;

    // Stats
    private maxHealth: number = 100;
    private currentHealth: number = 100;

    // UI
    private barGroup: THREE.Group | null = null;
    private cooldownBarFill: THREE.Mesh | null = null; // Renamed from barFill
    private healthBarFill: THREE.Mesh | null = null;

    public destroyed: boolean = false;

    constructor(
        scene: THREE.Scene,
        modelPath: string,
        texturePath: string,
        normalMapPath?: string,
        onLoad?: () => void,
        onError?: (msg: string) => void,
        customScale?: number,
        rotationCorrection: number = 0
    ) {
        // ... (Keep existing loader setup)
        const fbxLoader = new FBXLoader();
        const textureLoader = new THREE.TextureLoader();

        const colorMap = textureLoader.load(texturePath);
        colorMap.colorSpace = THREE.SRGBColorSpace;
        const normalMap = normalMapPath ? textureLoader.load(normalMapPath) : null;

        fbxLoader.load(
            modelPath,
            (object: THREE.Group) => {
                if (this.destroyed) return; // Prevent adding if already destroyed

                // Wrapper Group to handle Layout (Position/LookAt) independent of Model Rotation
                this.mesh = new THREE.Group();
                const scale = customScale || 0.012;
                this.mesh.scale.set(scale, scale, scale);
                // this.mesh.rotation.y = Math.PI / 2; // Removed default rotation on wrapper, GameManager handles LookAt

                // Inner Model Rotation Adjustment
                if (object) {
                    object.rotation.y = rotationCorrection;
                    this.mesh.add(object);
                }

                const material = new THREE.MeshStandardMaterial({
                    map: colorMap,
                    normalMap: normalMap,
                    roughness: 0.6,
                    metalness: 0.2
                });

                object.traverse((child: any) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material = material;
                    }
                });

                this.createOverheadUI(); // Add Bar to Wrapper
                scene.add(this.mesh);

                // Animations on the Model (Object), not Wrapper
                this.mixer = new THREE.AnimationMixer(object);
                // @ts-ignore
                // @ts-ignore
                const animations = object.animations;
                // console.log(`Animations for ${modelPath}:`, animations.map((c: any) => c.name));

                // Flexible Search
                const attackKeywords = ['attack', 'atk', 'skill', 'fight', 'hit', 'combat', 'crit'];
                const attackClip = animations.find((c: THREE.AnimationClip) =>
                    attackKeywords.some(keyword => c.name.toLowerCase().includes(keyword))
                );

                const idleClip = animations.find((c: THREE.AnimationClip) => c.name.toLowerCase().includes('idle'));
                const showClip = animations.find((c: THREE.AnimationClip) => c.name.toLowerCase().includes('show'));

                // Setup Actions
                if (idleClip) this.idleAction = this.mixer.clipAction(idleClip);
                else if (showClip) this.idleAction = this.mixer.clipAction(showClip);

                if (attackClip) {
                    this.attackAction = this.mixer.clipAction(attackClip);
                    this.attackAction.loop = THREE.LoopOnce; // Play once then stop
                    this.attackAction.clampWhenFinished = true; // Stay on last frame? or Crossfade back

                    // Listen for finish
                    this.mixer.addEventListener('finished', (e: any) => {
                        if (e.action === this.attackAction) {
                            this.endAttack();
                        }
                    });
                }

                // Start Idle
                if (this.idleAction) {
                    this.idleAction.play();
                    this.currentAction = this.idleAction;
                } else if (animations.length > 0) {
                    // Fallback
                    this.currentAction = this.mixer.clipAction(animations[0]);
                    this.currentAction.play();
                }

                this.loaded = true;
                if (onLoad) onLoad();
            },
            undefined,
            (err: any) => {
                console.error('Error loading hero FBX', err);
                if (onError) onError(err ? err.message : 'Unknown Error');
            }
        );
    }

    public destroy(scene: THREE.Scene) {
        this.destroyed = true;
        if (this.mesh) {
            scene.remove(this.mesh);
            // Optional: dispose geometry/materials if needed for memory
        }
    }

    private createOverheadUI() {
        if (!this.mesh) return;

        this.barGroup = new THREE.Group();
        this.barGroup.position.set(0, 150, 0);
        this.barGroup.scale.set(0.5, 0.5, 0.5);

        // === 1. Level Badge (Left) ===
        const badgeSize = 64;
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.width = badgeSize;
        badgeCanvas.height = badgeSize;
        const ctx = badgeCanvas.getContext('2d');
        if (ctx) {
            // Bg
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.roundRect(4, 4, 56, 56, 8);
            ctx.fill();
            // Border
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.stroke();
            // Icon
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚔️', 32, 28);
            // Level
            ctx.font = 'bold 20px Arial';
            ctx.fillText('50', 32, 52);
        }
        const badgeTex = new THREE.CanvasTexture(badgeCanvas);
        badgeTex.colorSpace = THREE.SRGBColorSpace;
        const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true });
        const badge = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), badgeMat);
        badge.position.set(-60, 0, 1);
        this.barGroup.add(badge);

        // === 2. Bars Container (Right) ===
        // Background for both
        const barsBgGeo = new THREE.PlaneGeometry(100, 26); // Taller to fit 2 bars
        const barsBgMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 });
        const barsBg = new THREE.Mesh(barsBgGeo, barsBgMat);
        barsBg.position.set(15, 0, 0);
        this.barGroup.add(barsBg);

        // -- Health Bar (Top) --
        const hpGeo = new THREE.PlaneGeometry(96, 10);
        const hpMat = new THREE.MeshBasicMaterial({ color: 0x33ff33 }); // Green
        this.healthBarFill = new THREE.Mesh(hpGeo, hpMat);
        this.healthBarFill.position.set(15, 6, 1); // Up slightly
        // Initial Full Scale
        this.healthBarFill.scale.x = 1;
        this.barGroup.add(this.healthBarFill);

        // -- Cooldown Bar (Bottom) --
        const cdGeo = new THREE.PlaneGeometry(96, 10);
        const cdMat = new THREE.MeshBasicMaterial({ color: 0x3388ff }); // Blue
        this.cooldownBarFill = new THREE.Mesh(cdGeo, cdMat);
        this.cooldownBarFill.position.set(15, -6, 1); // Down slightly
        this.cooldownBarFill.scale.x = 0; // Starts empty
        this.barGroup.add(this.cooldownBarFill);

        this.mesh.add(this.barGroup);
    }

    public update(delta: number, camera?: THREE.Camera) {
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Logic
        if (this.loaded && !this.isAttacking) {
            this.currentCooldown += delta;
            if (this.currentCooldown >= this.maxCooldown) {
                this.currentCooldown = this.maxCooldown;
                this.triggerAttack();
            }
            this.updateUI();
        }

        // Billboard logic: Always face camera (Compensate for parent rotation)
        if (this.barGroup && camera && this.mesh) {
            const parentQuatInv = this.mesh.quaternion.clone().invert();
            this.barGroup.quaternion.copy(parentQuatInv.multiply(camera.quaternion));
        }
    }

    private updateUI() {
        // Update Cooldown (Grow from left)
        if (this.cooldownBarFill) {
            const cdProgress = Math.max(0.001, this.currentCooldown / this.maxCooldown);
            this.cooldownBarFill.scale.x = cdProgress;
            // Center = LeftEdge + (Width * Scale / 2). 
            // Parent Center is 15. Width 96. LeftEdge = 15 - 48 = -33.
            this.cooldownBarFill.position.x = -33 + (48 * cdProgress);
        }

        // Update Health (Shrink from right? Or usually standard left-to-right)
        // Let's assume left-to-right fill like standard
        if (this.healthBarFill) {
            const hpProgress = Math.max(0.001, this.currentHealth / this.maxHealth);
            this.healthBarFill.scale.x = hpProgress;
            this.healthBarFill.position.x = -33 + (48 * hpProgress);
        }
    }

    private triggerAttack() {
        if (this.isAttacking || !this.attackAction) return;

        this.isAttacking = true;
        // Reset Cooldown
        this.currentCooldown = 0;
        this.updateUI();

        if (this.currentAction) {
            this.currentAction.fadeOut(0.2);
        }
        this.attackAction.reset();
        this.attackAction.fadeIn(0.2);
        this.attackAction.play();
        this.currentAction = this.attackAction;
    }

    private endAttack() {
        this.isAttacking = false;
        if (this.idleAction && this.currentAction === this.attackAction) {
            this.attackAction!.fadeOut(0.2);
            this.idleAction.reset();
            this.idleAction.fadeIn(0.2);
            this.idleAction.play();
            this.currentAction = this.idleAction;
        }
    }

    public rotate(angle: number) {
        if (this.mesh) {
            this.mesh.rotation.y += angle;
        }
    }

    public getRotationY(): number {
        return this.mesh ? this.mesh.rotation.y : 0;
    }
}
