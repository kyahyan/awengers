import { HeroList } from './HeroList';
import { LoginUI } from './LoginUI';
import { ProfileUI } from './ProfileUI';
import { HeaderUI } from './HeaderUI';
import { SettingsUI } from './SettingsUI';
import { LoadingUI } from './LoadingUI';
import { ShopUI, ShopItem } from './ShopUI';
import { SummonUI } from './SummonUI';
import { BackpackUI } from './BackpackUI';
import { HeroDetailUI } from './HeroDetailUI';
import { GalleryHeroModal } from './GalleryHeroModal';
import { UserProfile, addPlayerXp } from '../data/UserProfile';
import { HERO_ASSETS } from '../data/HeroAssetsMap';

export class UIManager {
    private debugEl!: HTMLElement;
    private heroList!: HeroList;
    private listsContainer: HTMLElement | null = null;
    private uiContainer: HTMLElement | null;
    private currentUser: UserProfile | null = null;
    private profileUI: ProfileUI | null = null;
    private settingsUI: SettingsUI | null = null;
    private shopUI: ShopUI | null = null;
    private summonUI: SummonUI | null = null;
    private backpackUI: BackpackUI | null = null;
    private currentScreenEl: HTMLElement | null = null;
    public loadingUI: LoadingUI | null = null;
    public onStartLoading: (() => void) | null = null;
    public onGameStart: (() => void) | null = null; // Callback for Game/3D init
    private headerUI: HeaderUI | null = null;
    private onHeroesSelected: ((names: string[]) => void) | null = null;
    public onPreviewHero?: (heroName: string) => void;
    public onPreviewClose?: () => void;
    private heroDetailUI: HeroDetailUI | null = null;

    // Hero navigation tracking
    private visibleHeroNames: string[] = [];
    private currentHeroIndex: number = 0;

    constructor() {
        this.uiContainer = document.getElementById('game-ui');
        if (this.uiContainer) {
            this.uiContainer.innerHTML = '';

            const savedSession = localStorage.getItem('awengers_session');
            if (savedSession) {
                try {
                    const user = JSON.parse(savedSession);
                    if (user && user.commanderName) {
                        // Patch for missing cheese in old sessions
                        if (user.cheese === undefined) user.cheese = 999999999;
                        if (user._id && !user.uid) user.uid = user._id; // Map Mongo ID
                        this.currentUser = user;
                        // Session found: Skip loading screen for faster development
                        // this.showLoading(); // TEMPORARILY DISABLED
                        this.initializeGameUI(); // Go straight to game
                        // Refresh data from server in background
                        this.fetchUser();
                        return;
                    }
                } catch (e) {
                    console.error("Failed to restore session", e);
                }
            }

            // No Session: Show Login First
            const login = new LoginUI((user) => {
                this.currentUser = user;
                // Transition to Loading
                if (login.getElement().parentNode) {
                    try {
                        login.getElement().parentNode?.removeChild(login.getElement());
                    } catch (e) { console.warn(e); }
                }
                if (this.onStartLoading) this.onStartLoading();
            });
            this.uiContainer.appendChild(login.getElement());
        }
    }

    public showLoading() {
        if (!this.loadingUI && this.uiContainer) {
            this.loadingUI = new LoadingUI();
            this.uiContainer.appendChild(this.loadingUI.getElement());
        }
    }

    public registerHeroUpdateCallback(callback: (names: string[]) => void) {
        this.onHeroesSelected = callback;
    }

    public setSelectedHeroes(names: string[]) {
        if (this.heroList) {
            this.heroList.setSelected(names);
        }
    }

    private topHud: HTMLElement | null = null;
    private homeButtonsContainer: HTMLElement | null = null;
    private homeProfileCard: HTMLElement | null = null; // New Profile Card
    private backBtn: HTMLElement | null = null;
    // private homeDimmer: HTMLElement | null = null; // Removed


    private initializeGameUI() {
        if (!this.uiContainer) return;

        // Notify Game to start (3D Scene)
        if (this.onGameStart) this.onGameStart();

        // Dark Overlay Removed

        this.topHud = document.createElement('div');
        this.topHud.style.position = 'absolute';
        this.topHud.style.top = '0';
        this.topHud.style.left = '0';
        this.topHud.style.width = '100%';
        this.topHud.style.padding = '10px';
        this.topHud.style.display = 'none'; // Hidden as requested
        this.topHud.style.justifyContent = 'space-between';
        // Ensure HUD is on top but lets clicks pass through empty areas
        this.topHud.style.pointerEvents = 'none';
        this.uiContainer.appendChild(this.topHud);

        // Initialize Settings UI first
        this.settingsUI = new SettingsUI((updatedUser) => {
            this.currentUser = updatedUser;
            // Update Header
            if (this.headerUI) this.headerUI.update(this.currentUser);

            // Re-create Home Profile Card to update avatar/rank
            if (this.homeProfileCard && this.homeProfileCard.parentNode) {
                this.homeProfileCard.parentNode.removeChild(this.homeProfileCard);
            }
            this.createHomeProfileCard();

            // Also update HUD button if visible?
            const profileBtnName = document.querySelector('.hud-name');
            if (profileBtnName && this.currentUser) profileBtnName.innerHTML = this.currentUser.commanderName;

            const profileBtnAv = document.querySelector('.hud-avatar');
            // HUD avatar logic was simple text emoji 🦁, maybe we want to sync it too? 
            // For now leaving it as 🦁 unless we want to change it.

            // Persist to DB
            this.syncUser();
        });
        this.uiContainer.appendChild(this.settingsUI.getElement());

        // Add Header with callback
        this.headerUI = new HeaderUI(() => {
            if (this.settingsUI) {
                if (this.currentUser) this.settingsUI.setUser(this.currentUser);
                this.settingsUI.show();
            }
        }, (screen) => this.switchScreen(screen));
        if (this.currentUser) {
            this.headerUI.update(this.currentUser);
            if (this.settingsUI) this.settingsUI.setUser(this.currentUser);
        }
        this.uiContainer.appendChild(this.headerUI.getElement());

        // Profile / Avatar Button (Top Left)
        const profileBtn = document.createElement('div');
        profileBtn.className = 'profile-btn-hud';
        profileBtn.innerHTML = `
            <div class="hud-avatar">🦁</div>
            <div class="hud-info">
                <div class="hud-name">${this.currentUser?.commanderName || 'Commander'}</div>
                <div class="hud-level">Lv ${this.currentUser?.level || 1}</div>
            </div>
            <style>
                .profile-btn-hud {
                    pointer-events: auto;
                    background: rgba(0,0,0,0.6);
                    padding: 5px 15px 5px 5px;
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    border: 2px solid #556;
                    transition: transform 0.1s;
                }
                .profile-btn-hud:hover { transform: scale(1.05); border-color: #ffd700; }
                .hud-avatar {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: #334;
                    display: flex; justify-content: center; align-items: center;
                    font-size: 1.2rem;
                    border: 2px solid #ffd700;
                }
                .hud-info { display: flex; flex-direction: column; line-height: 1.2; }
                .hud-name { color: white; font-weight: bold; font-size: 0.9rem; }
                .hud-level { color: #ffd700; font-size: 0.8rem; }
            </style>
        `;
        profileBtn.addEventListener('click', () => this.openProfile());
        this.topHud.appendChild(profileBtn);

        // Debug Label
        this.debugEl = document.createElement('div');
        this.debugEl.innerText = `Debug: Game Active`;
        this.debugEl.style.color = '#555';
        this.debugEl.style.fontSize = '10px';
        this.debugEl.style.pointerEvents = 'none';
        this.topHud.appendChild(this.debugEl);

        // Initialize Hero List (Hidden by default)
        this.heroList = new HeroList((selectedNames) => {
            if (this.onHeroesSelected) {
                this.onHeroesSelected(selectedNames);
            }
        });

        this.listsContainer = document.createElement('div');
        this.listsContainer.style.display = 'none';
        this.listsContainer.style.width = '100%';
        this.listsContainer.style.height = '100%';
        this.listsContainer.style.paddingTop = '80px';
        // this.listsContainer.style.justifyContent = 'center'; // Removed to allow full width usage

        const heroEl = this.heroList.getElement();
        heroEl.style.width = '100%'; // Maximize width
        heroEl.style.height = '100%';
        this.listsContainer.appendChild(heroEl);

        this.uiContainer.appendChild(this.listsContainer);

        // Back Button (Hidden by default)
        this.backBtn = document.createElement('button');
        this.backBtn.id = 'ui-back-btn';
        this.backBtn.innerText = 'Back to Home';
        this.backBtn.style.position = 'absolute';
        this.backBtn.style.bottom = '20px';
        this.backBtn.style.left = '50%';
        this.backBtn.style.transform = 'translateX(-50%)';
        this.backBtn.style.padding = '10px 30px';
        this.backBtn.style.fontSize = '1.2rem';
        this.backBtn.style.borderRadius = '30px';
        this.backBtn.style.border = '2px solid #fff';
        this.backBtn.style.background = '#d32f2f';
        this.backBtn.style.color = 'white';
        this.backBtn.style.cursor = 'pointer';
        this.backBtn.style.display = 'none';
        this.backBtn.style.pointerEvents = 'auto'; // Important since parent might be none
        this.backBtn.style.zIndex = '1000';
        this.backBtn.addEventListener('click', () => this.showHome());
        this.uiContainer.appendChild(this.backBtn);

        this.createHomeButtons();
        // this.createHomeProfileCard(); // Sidebar disabled
    }

    private createHomeProfileCard() {
        if (!this.uiContainer || !this.currentUser) return;

        this.homeProfileCard = document.createElement('div');
        this.homeProfileCard.className = 'home-profile-card';

        // Rank Image Mapping (Simple index based)
        // Scout=0 -> 1.png
        const rankDefs = ['Scout', 'Warden', 'Hunter', 'Alpha', 'Apex', 'Primal', 'Celestial', 'Eternal'];
        let rankIndex = rankDefs.indexOf(this.currentUser.rankTitle);
        if (rankIndex === -1) rankIndex = 0;
        const rankImg = `/assets/ranks/${rankIndex + 1}.png`;

        const avatarImg = `/assets/avatar/${this.currentUser.avatarId || '1'}.png`;
        // Frame naming seems to be 1.png .. 6.png. Use frameId or default.
        const frameImg = `/assets/frames/${this.currentUser.frameId || '1'}.png`;

        this.homeProfileCard.innerHTML = `
            <div class="card-header-row">
                <div class="avatar-group">
                    <img src="${avatarImg}" class="avatar-img" />
                    <img src="${frameImg}" class="frame-img" />
                </div>
                <div class="user-info">
                    <div class="rank-title">${this.currentUser.rankTitle}</div>
                    <div class="user-name">${this.currentUser.commanderName}</div>
                </div>
                <div class="rank-badge-group">
                    <img src="${rankImg}" class="rank-img" />
                    <div class="level-indicator">Lv${this.currentUser.level}</div>
                </div>
            </div>
            
            <div class="card-body-empty">
                <div class="xp-progress-container">
                    <div class="xp-info">
                        <span class="xp-label">EXP</span>
                        <span class="xp-values">${this.currentUser.currentXp} / ${this.currentUser.maxXp}</span>
                    </div>
                    <div class="xp-track">
                        <div class="xp-fill" style="width: ${(this.currentUser.currentXp / this.currentUser.maxXp) * 100}%"></div>
                    </div>
                </div>
            </div>

            <div class="card-footer-row">
                <img src="/assets/icons/settings.png" class="settings-icon" />
            </div>

            <style>
                .home-profile-card {
                    position: absolute;
                    top: 85px; /* Pushed down below header */
                    left: 20px;
                    width: 420px;
                    bottom: 20px; /* Stick to bottom with margin */
                    height: auto; /* Let it stretch */
                    background-color: #111111;
                    border-radius: 20px;
                    padding: 24px; /* Increased padding */
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    z-index: 5;
                    pointer-events: auto;
                    font-family: 'SF Pro Display', sans-serif;
                }
                .card-header-row {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .avatar-group {
                    position: relative;
                    width: 100px; /* Larger avatar */
                    height: 100px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .avatar-img {
                    width: 80%;
                    height: 80%;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid #ffd700; /* Gold border */
                }
                .frame-img {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    display: none; 
                }
                .user-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .rank-title {
                    font-size: 1.0rem; /* Larger */
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .user-name {
                    font-size: 1.8rem; /* Larger */
                    font-weight: bold;
                    color: white;
                }
                .rank-badge-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }
                .rank-img {
                    width: 90px; /* Larger */
                    height: 90px;
                    object-fit: contain;
                }
                .level-indicator {
                    font-size: 1.2rem; /* Larger */
                    color: #fff;
                    font-weight: bold;
                    transition: transform 0.1s;
                }
                .card-body-empty {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end; /* Push to bottom of this section */
                    padding-bottom: 10px;
                }
                .xp-progress-container {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .xp-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    color: #aaa;
                    font-weight: 500;
                    padding: 0 5px;
                }
                .xp-label { color: #ffd700; letter-spacing: 1px; }
                .xp-track {
                    width: 100%;
                    height: 8px; /* Slim bar */
                    background: #222;
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid #333;
                }
                .xp-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ffd700, #ffaa00);
                    border-radius: 4px;
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                    transition: width 0.3s ease;
                }
                .card-footer-row {
                    display: flex;
                    justify-content: flex-end;
                    padding-top: 10px;
                }
                .settings-icon {
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s, transform 0.2s;
                }
                .settings-icon:hover {
                    opacity: 1;
                    transform: rotate(30deg);
                }
            </style>
        `;

        this.uiContainer.appendChild(this.homeProfileCard);
    }

    private createHomeButtons() {
        if (!this.uiContainer) return;

        this.homeButtonsContainer = document.createElement('div');
        this.homeButtonsContainer.style.position = 'absolute';
        this.homeButtonsContainer.style.top = '100px';
        this.homeButtonsContainer.style.width = '100%';
        this.homeButtonsContainer.style.display = 'none'; // Hidden as requested
        this.homeButtonsContainer.style.justifyContent = 'space-between';
        this.homeButtonsContainer.style.padding = '0 50px';
        this.homeButtonsContainer.style.pointerEvents = 'none'; // container transparent

        // Deployment Button (Left)
        const deployBtn = document.createElement('div');
        deployBtn.className = 'home-action-btn';
        deployBtn.innerHTML = `⚔️ Deployment`;
        deployBtn.onclick = () => this.openDeployment();

        // Show All Heroes Button (Right)
        const heroesBtn = document.createElement('div');
        heroesBtn.className = 'home-action-btn';
        heroesBtn.innerHTML = `🦁 Show all classes`;
        heroesBtn.onclick = () => this.openAllHeroes();

        this.homeButtonsContainer.appendChild(deployBtn);
        this.homeButtonsContainer.appendChild(heroesBtn);

        // Styles
        const style = document.createElement('style');
        style.innerText = `
            .home-action-btn {
                pointer-events: auto;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                border: 2px solid #4facfe;
                color: white;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 1.5rem;
                font-weight: bold;
                text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: transform 0.1s, box-shadow 0.1s;
                display: flex; align-items: center; gap: 10px;
            }
            .home-action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                border-color: #ffd700;
            }
            .home-action-btn:active {
                transform: translateY(1px);
            }
        `;
        this.homeButtonsContainer.appendChild(style);

        this.uiContainer.appendChild(this.homeButtonsContainer);
    }

    private openDeployment() {
        if (this.homeButtonsContainer) this.homeButtonsContainer.style.display = 'none';
        if (this.listsContainer) this.listsContainer.style.display = 'flex';
        if (this.backBtn) this.backBtn.style.display = 'block';

        // Keep sidebar visible
        // if (this.homeProfileCard) this.homeProfileCard.style.display = 'none';

        this.heroList.setMode('SELECT');
    }

    private openAllHeroes() {
        if (this.homeButtonsContainer) this.homeButtonsContainer.style.display = 'none';
        if (this.listsContainer) this.listsContainer.style.display = 'flex';
        if (this.backBtn) this.backBtn.style.display = 'block';

        // Keep sidebar visible
        // if (this.homeProfileCard) this.homeProfileCard.style.display = 'none';

        this.heroList.setMode('VIEW');
    }

    private showHome() {
        if (this.homeButtonsContainer) this.homeButtonsContainer.style.display = 'none'; // Keep hidden
        if (this.listsContainer) this.listsContainer.style.display = 'none';
        if (this.backBtn) this.backBtn.style.display = 'none';

        if (this.homeProfileCard) this.homeProfileCard.style.display = 'flex';
    }


    // Helper method to close all overlay modals (Summon, Shop, Backpack)
    // Optimized: uses non-blocking DOM removal
    private closeAllOverlayModals() {
        // Remove modals synchronously to prevent visual overlap, but do it efficiently
        const toRemove: HTMLElement[] = [];
        if (this.summonUI) {
            toRemove.push(this.summonUI.getElement());
            this.summonUI = null;
        }
        if (this.shopUI) {
            toRemove.push(this.shopUI.getElement());
            this.shopUI = null;
        }
        if (this.backpackUI) {
            toRemove.push(this.backpackUI.getElement());
            this.backpackUI = null;
        }
        // Batch remove in single frame
        if (toRemove.length > 0) {
            toRemove.forEach(el => el.remove());
        }
    }

    private switchScreen(screen: string) {
        console.log(`[UIManager] Switching to screen: ${screen}`);

        // Close any open overlay modals (Summon, Shop, Backpack) when switching screens
        this.closeAllOverlayModals();

        // Close any active hero preview before switching screens
        if (this.heroDetailUI) {
            this.closePreview();
        }

        // SPECIAL CASE: SUMMON as overlay (don't clear current screen)
        if (screen === 'SUMMON') {
            // Track if we were on Heroes screen (capture before async)
            const wasOnHeroes = this.currentScreenEl !== null;

            // Create modal immediately for fast visual feedback
            this.summonUI = new SummonUI(() => {
                if (this.summonUI) {
                    this.summonUI.getElement().remove();
                    this.summonUI = null;
                }
                if (!wasOnHeroes) {
                    this.toggleHomeElements(true);
                }
            }, (updatedUser) => {
                this.currentUser = updatedUser;
                if (this.headerUI) this.headerUI.update(this.currentUser);

                // Force sync User to HeroList (if active)
                if (this.heroList) {
                    this.heroList.setUser(this.currentUser);
                    // Force re-load/render by re-setting mode or owned
                    const newOwned = Object.keys(this.currentUser.stats?.heroUsage || {});
                    this.heroList.setOwned(newOwned);
                }
            });

            // Append in next animation frame for smooth paint
            requestAnimationFrame(() => {
                this.uiContainer?.appendChild(this.summonUI!.getElement());
                // Defer user data refresh to avoid blocking
                setTimeout(() => {
                    const saved = localStorage.getItem('awengers_session');
                    if (saved) this.currentUser = JSON.parse(saved);
                }, 0);
            });
            return;
        }

        // SPECIAL CASE: SHOP as overlay (don't clear current screen)
        if (screen === 'SHOP') {
            // Use cached user for immediate UI creation
            if (!this.currentUser) return;

            const wasOnHeroes = this.currentScreenEl !== null;

            this.shopUI = new ShopUI(this.currentUser, () => {
                if (this.shopUI) {
                    this.shopUI.getElement().remove();
                    this.shopUI = null;
                }
                if (!wasOnHeroes) {
                    this.toggleHomeElements(true);
                }
            }, (item) => this.handleShopBuy(item));

            // Append in next animation frame for smooth paint
            requestAnimationFrame(() => {
                this.uiContainer?.appendChild(this.shopUI!.getElement());
                // Defer user data refresh to avoid blocking
                setTimeout(() => {
                    const saved = localStorage.getItem('awengers_session');
                    if (saved) {
                        this.currentUser = JSON.parse(saved);
                        if (this.shopUI) this.shopUI.update(this.currentUser!);
                    }
                }, 0);
            });
            return;
        }

        // SPECIAL CASE: BACKPACK as overlay (don't clear current screen)
        if (screen === 'BACKPACK') {
            // Use cached user for immediate UI creation
            if (!this.currentUser) return;

            const wasOnHeroes = this.currentScreenEl !== null;

            this.backpackUI = new BackpackUI(this.currentUser, () => {
                if (this.backpackUI) {
                    this.backpackUI.getElement().remove();
                    this.backpackUI = null;
                }
                if (!wasOnHeroes) {
                    this.toggleHomeElements(true);
                }
            });

            // Append in next animation frame for smooth paint
            requestAnimationFrame(() => {
                this.uiContainer?.appendChild(this.backpackUI!.getElement());
                // Defer user data refresh to avoid blocking
                setTimeout(() => {
                    const saved = localStorage.getItem('awengers_session');
                    if (saved) this.currentUser = JSON.parse(saved);
                }, 0);
            });
            return;
        }

        // 1. Clear current screen if any
        if (this.currentScreenEl) {
            this.currentScreenEl.remove();
            this.currentScreenEl = null;
        }

        // Cleanup specific UIs if they were the screen
        if (this.shopUI) {
            this.shopUI = null; // Shop is recreated
        }
        if (this.summonUI) {
            this.summonUI = null; // Summon is recreated
        }
        if (this.backpackUI) {
            this.backpackUI = null; // Backpack is recreated
        }


        const gameLayer = document.getElementById('game-layer');

        // 2. Handle specific screens
        if (screen === 'HOME') {
            // Show Home Elements
            this.toggleHomeElements(true);
            if (gameLayer) gameLayer.style.display = 'block'; // Show 3D Scene
            return;
        }

        // For modal screens, keep game layer visible (semi-transparent overlay)
        // Only toggle home elements, but keep game visible
        this.toggleHomeElements(false);
        // Keep game layer visible for modal effect
        if (gameLayer) gameLayer.style.display = 'block';

        if (['HEROES', 'ROSTER'].includes(screen)) {
            // RELOAD USER
            const saved = localStorage.getItem('awengers_session');
            if (saved) this.currentUser = JSON.parse(saved);

            if (!this.currentUser) return;

            // Heroes is a full-screen page (not a modal)
            const gameLayer = document.getElementById('game-layer');
            if (gameLayer) gameLayer.style.display = 'none';

            // Create full-screen container
            const heroScreen = document.createElement('div');
            heroScreen.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #dec88f;
                z-index: 300;
                display: flex;
                flex-direction: column;
                pointer-events: auto;
            `;

            // Content Area (will be swapped based on tab)
            const contentArea = document.createElement('div');
            contentArea.id = 'hero-screen-content';
            contentArea.style.cssText = `
                flex: 1;
                overflow: hidden;
                padding-bottom: 80px;
                position: relative;
                pointer-events: auto;
            `;

            // Tab state
            let activeTab = 'Heroes';
            const tabElements: HTMLElement[] = [];
            const owned = Object.keys(this.currentUser.stats?.heroUsage || {});

            // Function to render content based on active tab
            const renderTabContent = (tabName: string) => {
                contentArea.innerHTML = '';

                if (tabName === 'Heroes') {
                    // Heroes Tab: Show only owned heroes (no filter bar)
                    if (!this.heroList) {
                        this.heroList = new HeroList(
                            (selected) => { },
                            (heroName) => {
                                // Default legacy behavior if modal fails (shouldn't happen with user passed)
                                this.visibleHeroNames = this.heroList.getVisibleHeroNames();
                                this.currentHeroIndex = this.visibleHeroNames.indexOf(heroName);
                                this.showHeroPreview(heroName);
                            },
                            false,
                            this.currentUser,
                            (updatedUser) => {
                                this.currentUser = updatedUser;
                                if (this.headerUI) this.headerUI.update(this.currentUser);
                                localStorage.setItem('awengers_session', JSON.stringify(this.currentUser));

                                // FORCE REFRESH: Pass new user to HeroList so it reloads levels
                                if (this.heroList) {
                                    this.heroList.setUser(this.currentUser);

                                    // Also sync owned list
                                    const newOwned = Object.keys(this.currentUser.stats?.heroUsage || {});
                                    this.heroList.setOwned(newOwned);
                                }
                            }
                        );
                    }
                    this.heroList.setOwned(owned);
                    this.heroList.setMode('VIEW');
                    // Explicitly sync user to ensure it's never missing
                    if (this.currentUser) {
                        this.heroList.setUser(this.currentUser);
                    }

                    if (owned.length === 0) {
                        // Empty state
                        const emptyContent = document.createElement('div');
                        emptyContent.style.cssText = `
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100%;
                            color: #8b6542;
                            font-family: 'SF Pro Rounded', sans-serif;
                        `;

                        const icon = document.createElement('div');
                        icon.innerText = '🦸';
                        icon.style.fontSize = '80px';
                        icon.style.marginBottom = '20px';
                        emptyContent.appendChild(icon);

                        const title = document.createElement('div');
                        title.innerText = 'NO HEROES YET';
                        title.style.cssText = `
                            font-size: 2rem;
                            font-weight: bold;
                            color: #5c3d25;
                            margin-bottom: 10px;
                        `;
                        emptyContent.appendChild(title);

                        const msg = document.createElement('div');
                        msg.innerText = 'Go Summon some heroes!';
                        msg.style.fontSize = '1.1rem';
                        emptyContent.appendChild(msg);

                        contentArea.appendChild(emptyContent);
                    } else {
                        // Show owned heroes
                        const heroListEl = this.heroList.getElement();
                        heroListEl.style.display = 'block';
                        heroListEl.style.height = '100%';
                        contentArea.appendChild(heroListEl);
                    }

                } else if (tabName === 'Shards') {
                    // Shards Tab: Dynamic Display
                    const shardsContent = document.createElement('div');
                    shardsContent.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        height: 100%;
                        padding-top: 20px;
                        overflow-y: auto;
                    `;

                    const title = document.createElement('div');
                    title.innerText = 'MY SHARDS';
                    title.style.cssText = `
                        font-size: 2rem;
                        font-weight: bold;
                        color: #5c3d25;
                        margin-bottom: 20px;
                        font-family: 'SF Pro Rounded', sans-serif;
                    `;
                    shardsContent.appendChild(title);

                    // Filter Shards from inventory (keys starting with 'shard_')
                    const inventory = this.currentUser.inventory || {};
                    const shardKeys = Object.keys(inventory).filter(k => k.startsWith('shard_') && inventory[k] > 0);

                    if (shardKeys.length === 0) {
                        const emptyMsg = document.createElement('div');
                        emptyMsg.innerText = 'No shards collected yet.';
                        emptyMsg.style.cssText = `color: #8b6542; font-size: 1.2rem; margin-top: 50px; font-family: 'SF Pro Rounded', sans-serif;`;
                        shardsContent.appendChild(emptyMsg);
                    } else {
                        const grid = document.createElement('div');
                        grid.style.cssText = `
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                            gap: 20px;
                            width: 90%;
                            max-width: 1000px;
                            padding-bottom: 40px;
                        `;

                        shardKeys.forEach(key => {
                            const count = inventory[key];
                            const heroCode = key.replace('shard_', '');
                            // Attempt to find hero name for display
                            const heroAsset = HERO_ASSETS.find(h => h.name === heroCode);
                            const displayName = heroAsset ? heroAsset.name : heroCode;

                            const card = document.createElement('div');
                            card.style.cssText = `
                                background: linear-gradient(135deg, #2b1d12 0%, #4a3222 100%);
                                border: 2px solid #8b6542;
                                border-radius: 15px;
                                padding: 15px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                cursor: pointer;
                                transition: transform 0.2s;
                            `;
                            card.onmouseenter = () => card.style.transform = 'scale(1.03)';
                            card.onmouseleave = () => card.style.transform = 'scale(1)';

                            // Icon
                            const icon = document.createElement('div');
                            icon.innerText = '🧩';
                            icon.style.fontSize = '40px';
                            icon.style.marginBottom = '10px';
                            card.appendChild(icon);

                            // Name
                            const nameEl = document.createElement('div');
                            nameEl.innerText = displayName;
                            nameEl.style.cssText = `
                                color: #f5deb3;
                                font-weight: bold;
                                font-size: 1.1rem;
                                text-align: center;
                                margin-bottom: 5px;
                                font-family: 'SF Pro Rounded', sans-serif;
                            `;
                            card.appendChild(nameEl);

                            // Count
                            const countEl = document.createElement('div');
                            countEl.innerText = `x${count}`;
                            countEl.style.cssText = `
                                color: #ffd700;
                                font-size: 1.4rem;
                                font-weight: bold;
                                font-family: 'SF Pro Rounded', sans-serif;
                            `;
                            card.appendChild(countEl);

                            grid.appendChild(card);
                        });
                        shardsContent.appendChild(grid);
                    }

                    contentArea.appendChild(shardsContent);

                } else if (tabName === 'Gallery') {
                    // Gallery Tab: Show all heroes from HERO_ASSETS
                    const galleryContent = document.createElement('div');
                    galleryContent.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        padding: 40px 40px 20px 40px;
                        margin-top: 150px;
                        overflow-y: auto;
                    `;

                    // Title
                    const titleRow = document.createElement('div');
                    titleRow.style.cssText = `
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        margin-bottom: 30px;
                    `;
                    const icon = document.createElement('div');
                    icon.innerText = '📖';
                    icon.style.fontSize = '40px';
                    titleRow.appendChild(icon);

                    const title = document.createElement('div');
                    title.innerText = 'HERO GALLERY';
                    title.style.cssText = `
                        font-size: 1.8rem;
                        font-weight: bold;
                        color: #5c3d25;
                        font-family: 'SF Pro Rounded', sans-serif;
                    `;
                    titleRow.appendChild(title);

                    // Count badge
                    const uniqueHeroes = HERO_ASSETS.filter(h => !h.name.includes(' Left'));
                    const countBadge = document.createElement('div');
                    countBadge.innerText = `${uniqueHeroes.length} Heroes`;
                    countBadge.style.cssText = `
                        background: #8b6542;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        font-weight: bold;
                    `;
                    titleRow.appendChild(countBadge);
                    galleryContent.appendChild(titleRow);

                    // Hero Grid
                    const heroGrid = document.createElement('div');
                    heroGrid.style.cssText = `
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                        gap: 20px;
                        padding: 10px;
                    `;

                    // Filter out "Left" variants to show only unique heroes
                    uniqueHeroes.forEach(hero => {
                        const card = document.createElement('div');
                        card.style.cssText = `
                            background: linear-gradient(135deg, #3d2815 0%, #5c3d25 100%);
                            border-radius: 15px;
                            padding: 15px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            cursor: pointer;
                            transition: transform 0.2s, box-shadow 0.2s;
                            border: 2px solid #8b6542;
                        `;

                        card.onmouseover = () => {
                            card.style.transform = 'translateY(-5px) scale(1.02)';
                            card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
                            card.style.borderColor = '#ffd700';
                        };
                        card.onmouseout = () => {
                            card.style.transform = '';
                            card.style.boxShadow = '';
                            card.style.borderColor = '#8b6542';
                        };

                        // Hero Image Container with sprite preview
                        const imgContainer = document.createElement('div');
                        imgContainer.style.cssText = `
                            width: 150px;
                            height: 150px;
                            background: rgba(0,0,0,0.3);
                            border-radius: 10px;
                            overflow: hidden;
                            margin-bottom: 10px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        `;

                        // Use sprite first frame as preview (zoomed in on face)
                        if (hero.sprite2D) {
                            const displaySize = 150; // Match container
                            const framesPerRow = hero.sprite2D.framesPerRow;
                            const totalRows = Math.ceil(hero.sprite2D.totalFrames / framesPerRow);
                            const scaledSheetWidth = framesPerRow * displaySize;
                            const scaledSheetHeight = totalRows * displaySize;

                            const spritePreview = document.createElement('div');
                            spritePreview.style.cssText = `
                                width: ${displaySize}px;
                                height: ${displaySize}px;
                                background-image: url('${hero.sprite2D.spritesheetPath}');
                                background-size: ${scaledSheetWidth}px ${scaledSheetHeight}px;
                                background-position: 0 0;
                                background-repeat: no-repeat;
                                transform: scale(6) translateX(3%) translateY(-25%);
                                transform-origin: center top;
                                filter: saturate(0.7) contrast(1.3) brightness(1.5);
                            `;
                            imgContainer.appendChild(spritePreview);

                            // Animate sprite on hover (handles grid layout)
                            let frameIndex = 0;
                            let animInterval: number | null = null;
                            card.onmouseover = () => {
                                card.style.transform = 'translateY(-5px) scale(1.02)';
                                card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
                                card.style.borderColor = '#ffd700';
                                animInterval = window.setInterval(() => {
                                    frameIndex = (frameIndex + 1) % hero.sprite2D!.totalFrames;
                                    const col = frameIndex % framesPerRow;
                                    const row = Math.floor(frameIndex / framesPerRow);
                                    spritePreview.style.backgroundPosition = `-${col * displaySize}px -${row * displaySize}px`;
                                }, 1000 / (hero.sprite2D!.fps || 12));
                            };
                            card.onmouseout = () => {
                                card.style.transform = '';
                                card.style.boxShadow = '';
                                card.style.borderColor = '#8b6542';
                                if (animInterval) {
                                    clearInterval(animInterval);
                                    animInterval = null;
                                }
                                frameIndex = 0;
                                spritePreview.style.backgroundPosition = '0 0';
                            };
                        } else {
                            // Fallback placeholder
                            const placeholder = document.createElement('div');
                            placeholder.innerText = '🦸';
                            placeholder.style.fontSize = '60px';
                            imgContainer.appendChild(placeholder);
                        }

                        card.appendChild(imgContainer);

                        // Hero Name
                        const nameLabel = document.createElement('div');
                        nameLabel.innerText = hero.name;
                        nameLabel.style.cssText = `
                            color: #f5deb3;
                            font-size: 1rem;
                            font-weight: bold;
                            text-align: center;
                            font-family: 'SF Pro Rounded', sans-serif;
                        `;
                        card.appendChild(nameLabel);

                        // Click to show hero detail modal (show at max level)
                        card.onclick = () => {
                            const modal = new GalleryHeroModal(hero, () => {
                                // Modal closed
                            }, 250); // Show at max level
                            this.uiContainer?.appendChild(modal.getBackdrop());
                            this.uiContainer?.appendChild(modal.getElement());
                        };

                        heroGrid.appendChild(card);
                    });

                    galleryContent.appendChild(heroGrid);
                    contentArea.appendChild(galleryContent);
                }
            };

            // Function to update tab styles
            const updateTabStyles = () => {
                tabElements.forEach((tab, index) => {
                    const tabName = ['Heroes', 'Shards', 'Gallery'][index];
                    if (tabName === activeTab) {
                        tab.style.background = 'linear-gradient(180deg, #a07850 0%, #6b4830 100%)';
                        tab.style.color = '#fff';
                        tab.style.paddingBottom = '15px';
                    } else {
                        tab.style.background = 'linear-gradient(180deg, #8b6542 0%, #5c3d25 100%)';
                        tab.style.color = '#f5deb3';
                        tab.style.paddingBottom = '12px';
                    }
                });
            };

            // Tab Bar Container
            const tabBar = document.createElement('div');
            tabBar.style.cssText = `
                display: flex;
                justify-content: center;
                align-items: flex-end;
                gap: 5px;
                padding: 10px 20px 0;
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10;
                pointer-events: auto;
            `;

            const tabs = ['Heroes', 'Shards', 'Gallery'];
            tabs.forEach(tabName => {
                const tab = document.createElement('div');
                tab.innerText = tabName;
                tab.style.cssText = `
                    padding: 18px 50px;
                    background: linear-gradient(180deg, #8b6542 0%, #5c3d25 100%);
                    border: 3px solid #3d2815;
                    border-bottom: none;
                    border-radius: 12px 12px 0 0;
                    color: #f5deb3;
                    font-family: 'SF Pro Rounded', sans-serif;
                    font-size: 1.2rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.6);
                    box-shadow: inset 0 2px 0 rgba(255,255,255,0.2);
                    pointer-events: auto;
                `;

                tab.onmouseover = () => {
                    if (tabName !== activeTab) {
                        tab.style.background = 'linear-gradient(180deg, #9a6e48 0%, #5c3d25 100%)';
                    }
                };
                tab.onmouseout = () => {
                    if (tabName !== activeTab) {
                        tab.style.background = 'linear-gradient(180deg, #8b6542 0%, #5c3d25 100%)';
                    }
                };

                tab.onclick = () => {
                    if (tabName !== activeTab) {
                        activeTab = tabName;
                        updateTabStyles();
                        renderTabContent(tabName);
                    }
                };

                tabElements.push(tab);
                tabBar.appendChild(tab);
            });

            heroScreen.appendChild(contentArea);
            heroScreen.appendChild(tabBar);

            // Initial render
            updateTabStyles();
            renderTabContent(activeTab);

            this.currentScreenEl = heroScreen;
        }

        // 3. Append to Container
        if (this.currentScreenEl && this.uiContainer) {
            // Only append if not already there (HeroList reuses its container)
            if (!this.uiContainer.contains(this.currentScreenEl)) {
                this.uiContainer.appendChild(this.currentScreenEl);
            }
        }
    }

    private createHeroListModal(): HTMLElement {
        // Force Recreate HeroList to ensure fresh event listeners
        this.heroList = null as any;

        // Initialize HeroList
        this.heroList = new HeroList(
            (selected) => { console.log('Heroes selected:', selected); },
            (heroName) => {
                // Modal logic handles previews/upgrades now
                // But if we want to support preview here as fallback:
                console.log(`[UIManager] Previewing Hero: ${heroName}`);
                // this.showHeroPreview(heroName); 
            },
            false, // no filter in modal?
            this.currentUser,
            (updatedUser) => {
                this.currentUser = updatedUser;
                // Correctly update header if available
                if (this.headerUI) this.headerUI.update(this.currentUser);
                localStorage.setItem('awengers_session', JSON.stringify(this.currentUser));
            }
        );

        // Sync Owned Heroes
        const owned = Object.keys(this.currentUser!.stats?.heroUsage || {});
        console.log(`[UIManager] Syncing Hero List. Owned: ${owned.length}`);
        this.heroList.setOwned(owned);
        this.heroList.setMode('VIEW');

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 400;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Modal container
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: relative;
            width: 70%;
            max-width: 1200px;
            height: 70%;
            max-height: 750px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
            border-radius: 20px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            pointer-events: auto;
            z-index: 10;
        `;

        const title = document.createElement('div');
        title.innerText = 'HEROES';
        title.style.cssText = `
            font-size: 2rem;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            font-family: 'SF Pro Rounded', sans-serif;
            letter-spacing: 1px;
        `;
        header.appendChild(title);

        // Close button
        const closeBtn = document.createElement('img');
        closeBtn.src = '/assets/icons/close.png';
        closeBtn.style.cssText = `
            width: 40px;
            height: 40px;
            cursor: pointer;
            transition: transform 0.2s, filter 0.2s;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            pointer-events: auto;
            z-index: 100;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.transform = 'scale(1) rotate(0deg)';
        };
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            console.log('[UIManager] Close button clicked');
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                this.switchScreen('HOME');
            }, 300);
        };
        header.appendChild(closeBtn);
        modal.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            overflow: hidden;
            position: relative;
        `;

        const heroListEl = this.heroList.getElement();
        heroListEl.style.display = 'block';
        heroListEl.style.height = '100%';
        content.appendChild(heroListEl);
        modal.appendChild(content);

        overlay.appendChild(modal);

        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    this.switchScreen('HOME');
                }, 300);
            }
        });

        // Trigger animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });

        return overlay;
    }

    // Helper method to show hero preview with navigation
    private showHeroPreview(heroName: string) {
        if (this.currentScreenEl) this.currentScreenEl.style.display = 'none'; // Hide List

        // Remove existing preview if any
        if (this.heroDetailUI) {
            if (this.heroDetailUI.getElement().parentNode) {
                this.heroDetailUI.getElement().parentNode?.removeChild(this.heroDetailUI.getElement());
            }
        }

        // Create navigation callbacks
        const onPrev = this.currentHeroIndex > 0 ? () => {
            this.currentHeroIndex--;
            const prevHero = this.visibleHeroNames[this.currentHeroIndex];
            this.showHeroPreview(prevHero);
            if (this.onPreviewHero) this.onPreviewHero(prevHero);
        } : undefined;

        const onNext = this.currentHeroIndex < this.visibleHeroNames.length - 1 ? () => {
            this.currentHeroIndex++;
            const nextHero = this.visibleHeroNames[this.currentHeroIndex];
            this.showHeroPreview(nextHero);
            if (this.onPreviewHero) this.onPreviewHero(nextHero);
        } : undefined;

        // Create HeroDetailUI with navigation callbacks
        this.heroDetailUI = new HeroDetailUI(heroName, () => {
            this.closePreview();
        }, onPrev, onNext);
        document.body.appendChild(this.heroDetailUI.getElement());

        // Trigger 3D Preview
        if (this.onPreviewHero) this.onPreviewHero(heroName);

        // Ensure Game Layer is visible
        const layer = document.getElementById('game-layer');
        if (layer) layer.style.display = 'block';
    }

    // ...

    private closePreview() {
        // Remove UI
        if (this.heroDetailUI) {
            const el = this.heroDetailUI.getElement();
            if (el.parentNode) el.parentNode.removeChild(el);
            this.heroDetailUI = null;
        }

        // Restore Scene
        if (this.onPreviewClose) this.onPreviewClose();

        const layer = document.getElementById('game-layer');
        if (layer) layer.style.display = 'none'; // Hide scene

        // Show List
        if (this.currentScreenEl) this.currentScreenEl.style.display = 'block';
    }

    private openProfile() {
        if (this.profileUI || !this.currentUser) return;

        this.profileUI = new ProfileUI(this.currentUser, () => {
            this.profileUI = null;
        });
        this.uiContainer?.appendChild(this.profileUI.getElement());
    }

    private openShop() {
        if (this.shopUI || !this.currentUser) return;
        this.shopUI = new ShopUI(this.currentUser, () => {
            this.shopUI = null;
        }, (item) => this.handleShopBuy(item));
        this.uiContainer?.appendChild(this.shopUI.getElement());
    }

    private openSummon() {
        if (this.summonUI) return;

        // Hide Home Elements
        this.toggleHomeElements(false);

        this.summonUI = new SummonUI(() => {
            // On Close
            if (this.summonUI) {
                this.summonUI.getElement().remove();
                this.summonUI = null;
                // Show Home Elements
                this.toggleHomeElements(true);
            }
        });
        this.uiContainer?.appendChild(this.summonUI.getElement());
    }

    private toggleHomeElements(visible: boolean) {
        // We do NOT hide the Header anymore, as it must stay on top.
        // if (this.headerUI) this.headerUI.getElement().style.display = visible ? 'flex' : 'none';

        // Profile Card - ALWAYS VISIBLE on all pages
        // if (this.homeProfileCard) this.homeProfileCard.style.display = visible ? 'flex' : 'none';

        // Ensure Home Buttons are hidden if we are hiding home
        if (!visible && this.homeButtonsContainer) {
            this.homeButtonsContainer.style.display = 'none';
        }
    }


    private handleShopBuy(item: ShopItem) {
        if (!this.currentUser) return;
        if (this.currentUser.gems >= item.cost) {
            this.currentUser.gems -= item.cost;
            addPlayerXp(this.currentUser, item.xpAmount);

            // Visual Updates
            if (this.headerUI) this.headerUI.update(this.currentUser);
            if (this.shopUI) this.shopUI.update(this.currentUser);

            // Re-render home profile card to show new XP/Level immediately if visible
            if (this.homeProfileCard && this.homeProfileCard.style.display !== 'none') {
                // Quick hack: re-create it or just update text? Re-create is safer for level up changes (rank icon etc)
                if (this.homeProfileCard.parentNode) this.homeProfileCard.parentNode.removeChild(this.homeProfileCard);
                this.createHomeProfileCard();
            }

            this.syncUser();
        } else {
            console.log("Not enough gems");
            // Optionally show error feedback
        }
    }

    public setDebugText(text: string) {
        if (this.debugEl) {
            this.debugEl.innerText = text;
        }
    }

    public appendDebugText(text: string) {
        if (this.debugEl) {
            this.debugEl.innerText += '\n' + text;
        }
    }

    public updateGold(amount: number) {
        if (this.currentUser) {
            this.currentUser.gold = amount;
            if (this.headerUI) this.headerUI.update(this.currentUser);
        }
    }
    public updateRound(_round: number) { }
    public updateEnemyHealth(_current: number, _max: number) { }
    public showFloatingText(_amount: number, _x: number, _y: number) { }
    public async syncUser() {
        if (!this.currentUser) return;
        try {
            // Optimistically update localStorage immediately
            localStorage.setItem('awengers_session', JSON.stringify(this.currentUser));

            const res = await fetch('http://localhost:3000/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.currentUser)
            });
            if (!res.ok) {
                console.error("Sync failed", await res.text());
            }
            // console.log("User Synced to DB");
        } catch (e) {
            console.error("Failed to sync user", e);
        }
    }

    public async fetchUser() {
        if (!this.currentUser) return;
        try {
            const res = await fetch(`http://localhost:3000/api/user/${this.currentUser.commanderName}`);
            if (res.ok) {
                const startUser = await res.json();
                if (startUser) {
                    // Update session
                    // Ensure we map _id to uid if needed
                    if (startUser._id && !startUser.uid) startUser.uid = startUser._id;
                    this.currentUser = startUser;

                    // Ensure Inventory & Grant Items (100 Summon Books)
                    if (!this.currentUser) return; // Should not happen
                    if (!this.currentUser.inventory) this.currentUser.inventory = {};
                    // Temporary: Auto-grant 100 Summon Books if missing or less than 100
                    if (!this.currentUser.inventory['summon_book'] || this.currentUser.inventory['summon_book'] < 100) {
                        console.log("Granting 100 Summon Books to user...");
                        this.currentUser.inventory['summon_book'] = 100;
                        this.syncUser(); // Save back to DB
                    }

                    localStorage.setItem('awengers_session', JSON.stringify(startUser));

                    // Update UIs
                    if (this.headerUI) this.headerUI.update(this.currentUser);
                    if (this.settingsUI) this.settingsUI.setUser(this.currentUser);
                    if (this.homeProfileCard && this.homeProfileCard.parentNode) {
                        this.homeProfileCard.parentNode.removeChild(this.homeProfileCard);
                        this.createHomeProfileCard();
                    }
                    console.log("User data refreshed from server");
                }
            }
        } catch (e) {
            console.error("Failed to fetch user", e);
        }
    }

    public showLoginOrGame() {
        if (this.currentUser) {
            this.initializeGameUI();
        } else {
            // Show Login First
            const login = new LoginUI((user) => {
                this.currentUser = user;
                this.initializeGameUI();
            });
            // Ensure login is below loading screen if it's still fading out
            if (this.uiContainer) this.uiContainer.appendChild(login.getElement());
        }
    }
}
