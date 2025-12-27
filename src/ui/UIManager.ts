import { HeroList } from './HeroList';
import { EnemyList } from './EnemyList';
import { LoginUI } from './LoginUI';
import { ProfileUI } from './ProfileUI';
import { HeaderUI } from './HeaderUI';
import { SettingsUI } from './SettingsUI';
import { LoadingUI } from './LoadingUI';
import { ShopUI, ShopItem } from './ShopUI';
import { SummonUI } from './SummonUI';
import { BackpackUI } from './BackpackUI';
import { BlankScreen } from './BlankScreen';
import { HeroDetailUI } from './HeroDetailUI';
import { UserProfile, addPlayerXp } from '../data/UserProfile';

export class UIManager {
    private debugEl!: HTMLElement;
    private heroList!: HeroList;
    private enemyList!: EnemyList;
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


    private switchScreen(screen: string) {
        console.log(`[UIManager] Switching to screen: ${screen}`);

        // Close any active hero preview before switching screens
        if (this.heroDetailUI) {
            this.closePreview();
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

        // For all other screens, Hide Home Elements
        this.toggleHomeElements(false);
        if (gameLayer) gameLayer.style.display = 'none'; // Hide 3D Scene

        if (screen === 'SHOP') {
            // RELOAD USER
            const saved = localStorage.getItem('awengers_session');
            if (saved) this.currentUser = JSON.parse(saved);

            if (!this.currentUser) return;
            this.shopUI = new ShopUI(this.currentUser, () => {
                // Close callback - return home? Or do nothing if navigation drives it?
                // Since close button was removed, this might not be called by internal logic anymore.
                // But let's keep it clean.
            }, (item) => this.handleShopBuy(item));
            this.currentScreenEl = this.shopUI.getElement();
        }
        else if (screen === 'SUMMON') {
            // RELOAD USER (Important for Cost check)
            const saved = localStorage.getItem('awengers_session');
            if (saved) this.currentUser = JSON.parse(saved);

            this.summonUI = new SummonUI(() => {
                // OnClose - generally unused now
            });
            this.currentScreenEl = this.summonUI.getElement();
        }
        else if (screen === 'BACKPACK') {
            // RELOAD USER (Important for Inventory count)
            const saved = localStorage.getItem('awengers_session');
            if (saved) this.currentUser = JSON.parse(saved);

            if (!this.currentUser) return;
            this.backpackUI = new BackpackUI(this.currentUser);
            this.currentScreenEl = this.backpackUI.getElement();
        }
        else if (['HEROES', 'ROSTER'].includes(screen)) {
            // RELOAD USER
            const saved = localStorage.getItem('awengers_session');
            if (saved) this.currentUser = JSON.parse(saved);

            if (!this.currentUser) return;

            // Force Recreate HeroList to ensure fresh event listeners
            this.heroList = null as any;

            // Initialize HeroList if needed (it should be in constructor, but safety check)
            if (!this.heroList) {
                this.heroList = new HeroList(
                    (selected) => { console.log('Heroes selected:', selected); },
                    (heroName) => {
                        console.log(`[UIManager] Previewing Hero: ${heroName}`);

                        // Get visible hero names for navigation
                        this.visibleHeroNames = this.heroList.getVisibleHeroNames();
                        this.currentHeroIndex = this.visibleHeroNames.indexOf(heroName);

                        this.showHeroPreview(heroName);
                    }
                );
            }

            // Sync Owned Heroes
            const owned = Object.keys(this.currentUser.stats?.heroUsage || {});
            console.log(`[UIManager] Sycning Hero List. Owned: ${owned.length}`);
            this.heroList.setOwned(owned);

            // Set Mode based on screen name if needed, or default to VIEW
            this.heroList.setMode('VIEW');

            this.currentScreenEl = this.heroList.getElement();
            this.currentScreenEl.style.display = 'block'; // Ensure visible
        }

        // 3. Append to Container
        if (this.currentScreenEl && this.uiContainer) {
            // Only append if not already there (HeroList reuses its container)
            if (!this.uiContainer.contains(this.currentScreenEl)) {
                this.uiContainer.appendChild(this.currentScreenEl);
            }
        }
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
