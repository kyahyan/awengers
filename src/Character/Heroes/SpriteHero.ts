import * as THREE from 'three';
import { HeroSpriteConfig } from '../../data/HeroAssetsMap';

export enum HeroAttribute {
    Strength = 'Strength',
    Agility = 'Agility',
    Intelligence = 'Intelligence'
}

export class SpriteHero {
    public mesh: THREE.Group | null = null;
    public loaded: boolean = false;
    public attribute: HeroAttribute = HeroAttribute.Strength;
    public destroyed: boolean = false;

    // Sprite animation
    private spriteMesh: THREE.Mesh | null = null;
    private spriteTexture: THREE.Texture | null = null;
    private frameWidth: number = 0;
    private frameHeight: number = 0;
    private framesPerRow: number = 0;
    private totalFrames: number = 0;
    private currentFrame: number = 0;
    private fps: number = 12;
    private animationTimer: number = 0;
    private animationDirection: number = 1; // 1 = forward, -1 = backward (for ping-pong)

    // Cooldown System
    private currentCooldown: number = 0;
    private maxCooldown: number = 3.0;
    private isAttacking: boolean = false;

    // Stats
    private maxHealth: number = 100;
    private currentHealth: number = 100;

    // UI
    private barGroup: THREE.Group | null = null;
    private cooldownBarFill: THREE.Mesh | null = null;
    private healthBarFill: THREE.Mesh | null = null;

    constructor(
        scene: THREE.Scene,
        spriteConfig: HeroSpriteConfig,
        onLoad?: () => void,
        onError?: (msg: string) => void
    ) {
        const textureLoader = new THREE.TextureLoader();

        textureLoader.load(
            spriteConfig.spritesheetPath,
            (texture) => {
                if (this.destroyed) return;

                this.spriteTexture = texture;
                texture.colorSpace = THREE.SRGBColorSpace;
                // Use linear filtering for smoother animation
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearFilter;

                // Important: Set wrap mode to clamp to prevent tiling
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;

                // Calculate frame dimensions from texture
                const imgWidth = texture.image.width;
                const imgHeight = texture.image.height;

                this.framesPerRow = spriteConfig.framesPerRow || 8;
                this.totalFrames = spriteConfig.totalFrames || 24;
                this.fps = spriteConfig.fps || 12;

                const totalRows = Math.ceil(this.totalFrames / this.framesPerRow);

                // Calculate frame size from image
                this.frameWidth = imgWidth / this.framesPerRow;
                this.frameHeight = imgHeight / totalRows;

                console.log(`Spritesheet loaded: ${imgWidth}x${imgHeight}, frames: ${this.framesPerRow}x${totalRows}, frameSize: ${this.frameWidth}x${this.frameHeight}`);

                // Set up texture for spritesheet animation - show only ONE frame
                texture.repeat.set(1 / this.framesPerRow, 1 / totalRows);
                // Start at first frame (top-left)
                texture.offset.set(0, 1 - (1 / totalRows));

                // Create wrapper group
                this.mesh = new THREE.Group();

                // Create sprite mesh - use frame aspect ratio
                const spriteScale = 5.0; // Bigger sprite
                const aspectRatio = this.frameWidth / this.frameHeight;
                const spriteGeometry = new THREE.PlaneGeometry(spriteScale * aspectRatio, spriteScale);
                const spriteMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide,
                    alphaTest: 0.1
                });

                this.spriteMesh = new THREE.Mesh(spriteGeometry, spriteMaterial);
                this.spriteMesh.position.y = spriteScale / 2; // Center vertically
                this.mesh.add(this.spriteMesh);

                this.createOverheadUI();
                scene.add(this.mesh);

                this.loaded = true;
                if (onLoad) onLoad();
            },
            undefined,
            (err: any) => {
                console.error('Error loading sprite', err);
                if (onError) onError(err?.message || 'Failed to load sprite');
            }
        );
    }

    public destroy(scene: THREE.Scene) {
        this.destroyed = true;
        if (this.mesh) {
            scene.remove(this.mesh);
        }
    }

    private createOverheadUI() {
        if (!this.mesh) return;

        this.barGroup = new THREE.Group();
        this.barGroup.position.set(0.5, 4.0, 0); // Closer to head, slightly right to center above rider
        this.barGroup.scale.set(0.005, 0.005, 0.005); // Smaller bars

        // === 1. Level Badge (Left) ===
        const badgeSize = 64;
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.width = badgeSize;
        badgeCanvas.height = badgeSize;
        const ctx = badgeCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.roundRect(4, 4, 56, 56, 8);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚔️', 32, 28);
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
        const barsBgGeo = new THREE.PlaneGeometry(100, 26);
        const barsBgMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 });
        const barsBg = new THREE.Mesh(barsBgGeo, barsBgMat);
        barsBg.position.set(15, 0, 0);
        this.barGroup.add(barsBg);

        // -- Health Bar (Top) --
        const hpGeo = new THREE.PlaneGeometry(96, 10);
        const hpMat = new THREE.MeshBasicMaterial({ color: 0x33ff33 });
        this.healthBarFill = new THREE.Mesh(hpGeo, hpMat);
        this.healthBarFill.position.set(15, 6, 1);
        this.healthBarFill.scale.x = 1;
        this.barGroup.add(this.healthBarFill);

        // -- Cooldown Bar (Bottom) --
        const cdGeo = new THREE.PlaneGeometry(96, 10);
        const cdMat = new THREE.MeshBasicMaterial({ color: 0x3388ff });
        this.cooldownBarFill = new THREE.Mesh(cdGeo, cdMat);
        this.cooldownBarFill.position.set(15, -6, 1);
        this.cooldownBarFill.scale.x = 0;
        this.barGroup.add(this.cooldownBarFill);

        this.mesh.add(this.barGroup);
    }

    public update(delta: number, camera?: THREE.Camera) {
        // Animate sprite with ping-pong for smooth natural movement
        if (this.spriteTexture && this.loaded) {
            this.animationTimer += delta;
            const frameInterval = 1 / this.fps;

            if (this.animationTimer >= frameInterval) {
                this.animationTimer -= frameInterval;

                // Ping-pong animation: go forward then backward
                this.currentFrame += this.animationDirection;

                // Reverse direction at boundaries
                if (this.currentFrame >= this.totalFrames - 1) {
                    this.currentFrame = this.totalFrames - 1;
                    this.animationDirection = -1; // Start going backward
                } else if (this.currentFrame <= 0) {
                    this.currentFrame = 0;
                    this.animationDirection = 1; // Start going forward
                }

                const col = this.currentFrame % this.framesPerRow;
                const row = Math.floor(this.currentFrame / this.framesPerRow);
                const totalRows = Math.ceil(this.totalFrames / this.framesPerRow);

                this.spriteTexture.offset.set(
                    col / this.framesPerRow,
                    1 - (row + 1) / totalRows
                );
            }
        }

        // Cooldown logic
        if (this.loaded && !this.isAttacking) {
            this.currentCooldown += delta;
            if (this.currentCooldown >= this.maxCooldown) {
                this.currentCooldown = this.maxCooldown;
                this.triggerAttack();
            }
            this.updateUI();
        }

        // Billboard: always face camera
        if (this.spriteMesh && camera) {
            this.spriteMesh.lookAt(camera.position);
        }
        // Billboard bars: Use quaternion copy like 3D Hero for perfect alignment
        if (this.barGroup && camera && this.mesh) {
            const parentQuatInv = this.mesh.quaternion.clone().invert();
            this.barGroup.quaternion.copy(parentQuatInv.multiply(camera.quaternion));
        }
    }

    private updateUI() {
        if (this.cooldownBarFill) {
            const cdProgress = Math.max(0.001, this.currentCooldown / this.maxCooldown);
            this.cooldownBarFill.scale.x = cdProgress;
            this.cooldownBarFill.position.x = -33 + (48 * cdProgress);
        }

        if (this.healthBarFill) {
            const hpProgress = Math.max(0.001, this.currentHealth / this.maxHealth);
            this.healthBarFill.scale.x = hpProgress;
            this.healthBarFill.position.x = -33 + (48 * hpProgress);
        }
    }

    private triggerAttack() {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.currentCooldown = 0;
        this.updateUI();

        // For sprites, just restart the animation loop as "attack"
        setTimeout(() => {
            this.endAttack();
        }, 1000); // 1 second attack duration
    }

    private endAttack() {
        this.isAttacking = false;
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
