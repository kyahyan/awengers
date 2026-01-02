import { HeroList } from './HeroList';
import { LoginUI } from './LoginUI';
import { ProfileUI } from './ProfileUI';
import { HeaderUI } from './HeaderUI';
import { SettingsUI } from './SettingsUI';
import { LoadingUI } from './LoadingUI';
import { ShopUI, ShopItem } from './ShopUI';
import { SummonUI } from './SummonUI';
import { BackpackUI } from './BackpackUI';
import { ForgeUI } from './ForgeUI';
import { HeroDetailUI } from './HeroDetailUI';
import { GalleryHeroModal } from './GalleryHeroModal';
import { UserProfile, addPlayerXp } from '../data/UserProfile';
import { HERO_ASSETS } from '../data/HeroAssetsMap';
import { AdventureModal } from './AdventureModal';
import { BattleArenaUI } from './BattleArenaUI';
import { JADE_LOTUS_SHRINE_STAGES } from '../data/AdventureData';
import { LootReward, MAP_SHARD_DROPS, ShardDefinition } from '../data/LootSystem';

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
    private forgeUI: ForgeUI | null = null;
    private currentScreenEl: HTMLElement | null = null;
    public loadingUI: LoadingUI | null = null;
    public onStartLoading: (() => void) | null = null;
    public onGameStart: (() => void) | null = null; // Callback for Game/3D init
    private headerUI: HeaderUI | null = null;
    private onHeroesSelected: ((names: string[]) => void) | null = null;
    public onPreviewHero?: (heroName: string) => void;
    public onPreviewClose?: () => void;
    private heroDetailUI: HeroDetailUI | null = null;
    private adventureModal: AdventureModal | null = null;

    // Hero navigation tracking
    private visibleHeroNames: string[] = [];
    private currentHeroIndex: number = 0;

    private lastBattleAuto: boolean = false;
    private lastBattleSpeed: number = 2;

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

    public getDeployedTeam(): { name: string, level: number, instanceId: string, stars: number }[] {
        if (!this.currentUser || !this.currentUser.deployedTeam) return [];

        const deployedIds = this.currentUser.deployedTeam;
        const heroesMap = this.currentUser.heroes || {};
        const heroEntries = heroesMap instanceof Map ? Array.from(heroesMap.entries()) : Object.entries(heroesMap);

        const team: { name: string, level: number, instanceId: string, stars: number }[] = [];

        deployedIds.forEach((id: string) => {
            const entry = heroEntries.find(([k, v]) => k === id);
            if (entry) {
                const data = entry[1] as any;
                // Capitalize first letter strictly
                const rawName = data.heroCodeName || (id.includes('_') ? id.split('_')[0] : id);
                const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                team.push({
                    name: name,
                    level: data.level || 1,
                    instanceId: id,
                    stars: data.stars || 1
                });
            } else {
                // Fallback for missing data
                const raw = id.includes('_') ? id.split('_')[0] : id;
                const name = raw.charAt(0).toUpperCase() + raw.slice(1);
                team.push({ name, level: 1, instanceId: id, stars: 1 });
            }
        });
        return team;
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
            // this.createHomeProfileCard(); // Sidebar disabled

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
        this.heroList = new HeroList(
            (selectedNames) => {
                if (this.onHeroesSelected) {
                    this.onHeroesSelected(selectedNames);
                }
            },
            (heroName) => {
                // Navigate to hero preview
                this.visibleHeroNames = this.heroList!.getVisibleHeroNames();
                this.currentHeroIndex = this.visibleHeroNames.indexOf(heroName);
                this.showHeroPreview(heroName);
            },
            true,
            this.currentUser,
            (updatedUser) => {
                console.log('[UIManager] onUserUpdate callback (init), gold:', updatedUser.gold, 'headerUI exists:', !!this.headerUI);
                this.currentUser = updatedUser;
                if (this.headerUI) this.headerUI.update(this.currentUser);
                localStorage.setItem('awengers_session', JSON.stringify(this.currentUser));
            }
        );

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

    public showAdventureModal(mapId: number) {
        if (this.adventureModal) {
            this.adventureModal.getElement().remove();
        }

        const maxStage = this.currentUser?.adventureProgress?.jadeLotusShrine?.maxStage || 1;

        this.adventureModal = new AdventureModal(() => {
            this.adventureModal = null;
        },
            // Fix: remove redundant getDeployedTeam argument if AdventureModal doesn't need it or was partially refactored? 
            // Wait, looking at AdventureModal constructor: onClose, getDeployedTeam, maxStage, onBattleResult, initAuto, initSpeed
            // So arg 2 IS getDeployedTeam.
            () => this.getDeployedTeam(),
            maxStage,
            (stageId, win, isAuto, rewards, finalSpeed) => this.handleAdventureBattleResult(mapId, stageId, win, isAuto, rewards || [], finalSpeed),
            this.lastBattleAuto,
            this.lastBattleSpeed
        );

        this.uiContainer?.appendChild(this.adventureModal.getElement());
        console.log(`[UIManager] Opened Adventure Modal for Map ${mapId}`);
    }

    public handleAdventureBattleResult(mapId: number, stageId: number, win: boolean, isAuto: boolean, rewards: LootReward[], finalSpeed: number = 2) {

        // Persist settings
        this.lastBattleAuto = isAuto;
        this.lastBattleSpeed = finalSpeed;
        if (!this.currentUser) return;

        if (win) {
            console.log(`[UIManager] Victory on Stage ${stageId}! Granting rewards...`);

            // 1. Process Dynamic Rewards
            if (rewards && rewards.length > 0) {
                rewards.forEach(r => {
                    switch (r.type) {
                        case 'coin':
                            this.currentUser!.gold += r.amount;
                            break;
                        case 'xp':
                            addPlayerXp(this.currentUser!, r.amount);
                            break;
                        case 'gem':
                            this.currentUser!.gems += r.amount;
                            break;
                        case 'soul_potion':
                            this.currentUser!.soulPotion = (this.currentUser!.soulPotion || 0) + r.amount;
                            break;
                        case 'hero_potion':
                            this.currentUser!.heroPotion = (this.currentUser!.heroPotion || 0) + r.amount;
                            break;
                        case 'powder':
                            this.currentUser!.polishingPowder = (this.currentUser!.polishingPowder || 0) + r.amount;
                            break;
                        case 'item_shard':
                        case 'hero_shard':
                        case 'item':
                            if (r.itemId) {
                                // Add to inventory (simple count)
                                if (!this.currentUser!.inventory) this.currentUser!.inventory = {};
                                // Handle Map vs Object potential check
                                const inv = this.currentUser!.inventory as any;
                                const current = inv[r.itemId] || 0;
                                inv[r.itemId] = current + r.amount;
                                console.log(`[UIManager] Added ${r.amount} x ${r.itemId}`);
                            }
                            break;
                    }
                });
            } else {
                // Fallback for safety (though LootSystem should handle it)
                this.currentUser.gold += 1000;
                addPlayerXp(this.currentUser, 500);
            }

            // 2. Update Progress
            if (!this.currentUser.adventureProgress) this.currentUser.adventureProgress = {};
            if (!this.currentUser.adventureProgress.jadeLotusShrine) this.currentUser.adventureProgress.jadeLotusShrine = { maxStage: 1 };

            // If completed current max stage, unlock next
            const currentMax = this.currentUser.adventureProgress.jadeLotusShrine.maxStage;
            if (stageId === currentMax) {
                this.currentUser.adventureProgress.jadeLotusShrine.maxStage = currentMax + 1;
                console.log(`[UIManager] Unlocked Stage ${currentMax + 1}`);
            }

            // 3. Save
            this.syncUser();

            // 4. Update Header
            if (this.headerUI) this.headerUI.update(this.currentUser);
        } else {
            console.log(`[UIManager] Defeat on Stage ${stageId}.`);
        }

        // Logic for Auto-Next
        if (win && isAuto) {
            const nextStageId = stageId + 1;
            // Find stage definition
            const stages = JADE_LOTUS_SHRINE_STAGES; // Assuming mapId 1 is this
            const nextStage = stages.find(s => s.id === nextStageId);

            if (nextStage) {
                console.log(`[UIManager] Auto-starting Stage ${nextStageId}`);
                // Start next battle directly
                const isNextFirstClear = nextStageId === (this.currentUser!.adventureProgress?.jadeLotusShrine?.maxStage || 1);

                const battleUI = new BattleArenaUI(
                    this.getDeployedTeam(),
                    () => {
                        // On Close (manual exit or error) -> Return to map
                        this.showAdventureModal(mapId);
                    },
                    (result) => {
                        battleUI.close();
                        this.handleAdventureBattleResult(
                            mapId,
                            nextStageId,
                            result.win,
                            result.isAuto,
                            result.rewards || [],
                            result.finalSpeed || 2
                        );
                    },
                    nextStage.enemyIds[0] || 'treant',
                    nextStage.recommendedLevel,
                    this.lastBattleAuto, // persist auto state
                    mapId,
                    isNextFirstClear,
                    this.lastBattleSpeed // persist speed
                );
                document.body.appendChild(battleUI.getElement());
                return; // SKIP showing adventure modal below
            } else {
                console.log('[UIManager] No more stages or auto stopped.');
            }
        }

        // Re-open Adventure Modal to show updated state (Default behavior)
        setTimeout(() => {
            this.showAdventureModal(mapId);
        }, 100);
    }


    // Helper method to close all overlay modals (Summon, Shop, Backpack, Forge)
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
        if (this.forgeUI) {
            toRemove.push(this.forgeUI.getElement());
            this.forgeUI = null;
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

        // SPECIAL CASE: FORGE as overlay (crafting and enhancement)
        if (screen === 'FORGE') {
            if (!this.currentUser) return;

            const wasOnHeroes = this.currentScreenEl !== null;

            this.forgeUI = new ForgeUI(this.currentUser, () => {
                if (this.forgeUI) {
                    this.forgeUI.getElement().remove();
                    this.forgeUI = null;
                }
                if (!wasOnHeroes) {
                    this.toggleHomeElements(true);
                }
            }, (updatedUser) => {
                // Handle user updates from Forge (gold spent, items changed)
                this.currentUser = updatedUser;
                if (this.headerUI) this.headerUI.update(this.currentUser);
                // Persist to database
                this.syncUser();
            });

            requestAnimationFrame(() => {
                this.uiContainer?.appendChild(this.forgeUI!.getElement());
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
                                console.log('[UIManager] onUserUpdate callback, gold:', updatedUser.gold, 'headerUI exists:', !!this.headerUI);
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
                    // Shards Tab: Dynamic Display with Sub-Tabs
                    const shardsContent = document.createElement('div');
                    shardsContent.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        height: 100%;
                        padding-top: 120px;
                        overflow-y: hidden;
                    `;

                    // Main Title
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

                    // --- Sub-Tabs Logic ---
                    let currentShardTab: 'Hero' | 'Item' = 'Hero';

                    // Sub-Tab Container
                    const subTabContainer = document.createElement('div');
                    subTabContainer.style.cssText = `
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                        background: #3d2815;
                        padding: 5px;
                        border-radius: 25px;
                        border: 1px solid #8b6542;
                    `;

                    const createSubTab = (name: 'Hero' | 'Item', label: string) => {
                        const tab = document.createElement('div');
                        tab.innerText = label;
                        tab.style.cssText = `
                            padding: 8px 24px;
                            border-radius: 20px;
                            cursor: pointer;
                            font-family: 'SF Pro Rounded', sans-serif;
                            font-weight: bold;
                            font-size: 1rem;
                            transition: all 0.2s;
                        `;
                        tab.onclick = () => {
                            if (currentShardTab !== name) {
                                currentShardTab = name;
                                updateSubTabs();
                                renderShardGrid();
                            }
                        };
                        return tab;
                    };

                    const heroTabBtn = createSubTab('Hero', 'Hero Shards');
                    const itemTabBtn = createSubTab('Item', 'Item Shards');

                    subTabContainer.appendChild(heroTabBtn);
                    subTabContainer.appendChild(itemTabBtn);
                    shardsContent.appendChild(subTabContainer);

                    const updateSubTabs = () => {
                        const activeStyle = `background: #d97706; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);`;
                        const inactiveStyle = `background: transparent; color: #a07850;`;

                        heroTabBtn.style.cssText = heroTabBtn.style.cssText + (currentShardTab === 'Hero' ? activeStyle : inactiveStyle);
                        itemTabBtn.style.cssText = itemTabBtn.style.cssText + (currentShardTab === 'Item' ? activeStyle : inactiveStyle);
                    };

                    // Grid Container
                    const gridContainer = document.createElement('div');
                    gridContainer.style.cssText = `
                        width: 100%;
                        flex: 1;
                        overflow-y: auto;
                        display: flex;
                        justify-content: center;
                    `;
                    shardsContent.appendChild(gridContainer);

                    const renderShardGrid = () => {
                        gridContainer.innerHTML = '';
                        const grid = document.createElement('div');
                        grid.style.cssText = `
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                            grid-auto-rows: min-content;
                            gap: 20px;
                            width: 90%;
                            max-width: 1000px;
                            padding-bottom: 40px;
                        `;

                        const inventory = this.currentUser.inventory || {};
                        const allKeys = Object.keys(inventory).filter(k => inventory[k] > 0);
                        let displayKeys: string[] = [];

                        if (currentShardTab === 'Hero') {
                            displayKeys = allKeys.filter(k => k.startsWith('shard_') && !k.endsWith('_shard'));
                        } else {
                            // Item Shards: Ends with '_shard' OR matches a known Map Shard ID
                            const knownShardIds = Object.values(MAP_SHARD_DROPS).map(d => d.id);
                            displayKeys = allKeys.filter(k =>
                                k.endsWith('_shard') || knownShardIds.includes(k)
                            );
                        }

                        if (displayKeys.length === 0) {
                            const emptyMsg = document.createElement('div');
                            emptyMsg.innerText = currentShardTab === 'Hero' ? 'No Hero Shards collected.' : 'No Item Shards collected.';
                            emptyMsg.style.cssText = `color: #8b6542; font-size: 1.2rem; margin-top: 50px; font-family: 'SF Pro Rounded', sans-serif; text-align: center; width: 100%;`;
                            gridContainer.appendChild(emptyMsg);
                            return;
                        }

                        displayKeys.forEach(key => {
                            const count = inventory[key];
                            let displayName = key;
                            let iconPath = '';
                            let typeLabel = '';

                            if (currentShardTab === 'Hero') {
                                const heroCode = key.replace('shard_', '');
                                const heroAsset = HERO_ASSETS.find(h => h.name === heroCode);
                                displayName = heroAsset ? heroAsset.name : heroCode;
                                typeLabel = 'Hero Shard';
                                iconPath = '/assets/items/hero_shard.png'; // Fallback as headshot doesn't exist yet
                            } else {
                                // Find definition in MAP_SHARD_DROPS
                                const def = Object.values(MAP_SHARD_DROPS).find(d => d.id === key);
                                if (def) {
                                    displayName = def.name;
                                    iconPath = def.icon;
                                } else {
                                    // Fallback for unknown shards
                                    displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                    iconPath = '/assets/item/shard-item/Tier 1/Ring of Life - shard.png'; // Generic fallback
                                }
                                typeLabel = 'Item Shard';
                            }

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
                                position: relative;
                            `;
                            card.onmouseenter = () => card.style.transform = 'scale(1.03)';
                            card.onmouseleave = () => card.style.transform = 'scale(1)';

                            // Icon
                            const iconEl = document.createElement('img');
                            iconEl.src = iconPath;
                            iconEl.style.cssText = `
                                width: 64px; height: 64px;
                                object-fit: contain;
                                margin-bottom: 10px;
                                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                            `;
                            card.appendChild(iconEl);

                            // Name
                            const nameEl = document.createElement('div');
                            nameEl.innerText = displayName;
                            nameEl.style.cssText = `
                                color: #f5deb3;
                                font-weight: bold;
                                font-size: 1rem;
                                text-align: center;
                                margin-bottom: 5px;
                                font-family: 'SF Pro Rounded', sans-serif;
                                line-height: 1.2;
                                height: 2.4em; /* Fixed height for 2 lines */
                                display: flex; align-items: center; justify-content: center;
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
                                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                            `;
                            card.appendChild(countEl);

                            grid.appendChild(card);
                        });
                        gridContainer.appendChild(grid);
                    };

                    updateSubTabs();
                    renderShardGrid();
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
                } else if (tabName === 'Deployment') {
                    // Deployment Tab: Team deployment management
                    const deployContent = document.createElement('div');
                    deployContent.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        height: 100%;
                        padding: 20px 40px 20px 40px;
                        margin-top: 100px;
                        overflow-y: auto;
                    `;

                    // Track selected heroes for deployment
                    const selectedForDeploy: Map<number, { instanceId: string, heroName: string }> = new Map();
                    const slotElements: HTMLElement[] = [];

                    // Load saved team from database
                    const savedTeam = (this.currentUser as any)?.deployedTeam || [];
                    const userHeroes = (this.currentUser as any)?.heroes || {};
                    const heroEntries = userHeroes instanceof Map
                        ? Array.from(userHeroes.entries())
                        : Object.entries(userHeroes);

                    savedTeam.forEach((instanceId: string, index: number) => {
                        if (index >= 6) return; // Max 6 slots

                        // Find the hero data for this instanceId
                        const heroEntry = heroEntries.find(([id]: [string, any]) => id === instanceId);
                        if (heroEntry) {
                            const heroData = heroEntry[1] as any;
                            let heroName = heroData.heroCodeName;
                            if (!heroName) {
                                heroName = instanceId.includes('_') ? instanceId.split('_')[0] : instanceId;
                            }
                            heroName = heroName.charAt(0).toUpperCase() + heroName.slice(1);

                            selectedForDeploy.set(index, { instanceId, heroName });
                        }
                    });

                    // Title Row
                    const titleRow = document.createElement('div');
                    titleRow.style.cssText = `
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        margin-bottom: 20px;
                    `;
                    const icon = document.createElement('div');
                    icon.innerText = '⚔️';
                    icon.style.fontSize = '32px';
                    titleRow.appendChild(icon);

                    const title = document.createElement('div');
                    title.innerText = 'TEAM DEPLOYMENT';
                    title.style.cssText = `
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #5c3d25;
                        font-family: 'SF Pro Rounded', sans-serif;
                    `;
                    titleRow.appendChild(title);
                    deployContent.appendChild(titleRow);

                    // Team Slots Container
                    const teamContainer = document.createElement('div');
                    teamContainer.style.cssText = `
                        display: grid;
                        grid-template-columns: repeat(6, 1fr);
                        gap: 15px;
                        width: 95%;
                        max-width: 900px;
                        margin-bottom: 15px;
                    `;

                    // Function to update a slot's display
                    const updateSlot = (slotIndex: number) => {
                        const slot = slotElements[slotIndex];
                        if (!slot) return;

                        const heroData = selectedForDeploy.get(slotIndex);
                        if (heroData) {
                            // Find the hero asset for this hero
                            const asset = HERO_ASSETS.find(a => a.name === heroData.heroName);
                            slot.innerHTML = '';
                            slot.style.border = '3px solid #ffd700';

                            if (asset && asset.sprite2D) {
                                const displaySize = 120;
                                const framesPerRow = asset.sprite2D.framesPerRow;
                                const totalRows = Math.ceil(asset.sprite2D.totalFrames / framesPerRow);
                                const scaledSheetWidth = framesPerRow * displaySize;
                                const scaledSheetHeight = totalRows * displaySize;

                                const spritePreview = document.createElement('div');
                                spritePreview.style.cssText = `
                                    width: ${displaySize}px;
                                    height: ${displaySize}px;
                                    background-image: url('${asset.sprite2D.spritesheetPath}');
                                    background-size: ${scaledSheetWidth}px ${scaledSheetHeight}px;
                                    background-position: 0 0;
                                    background-repeat: no-repeat;
                                    transform: scale(2.5) translateY(15%);
                                    transform-origin: center center;
                                `;
                                slot.appendChild(spritePreview);
                            }

                            // Remove button
                            const removeBtn = document.createElement('div');
                            removeBtn.innerText = '✕';
                            removeBtn.style.cssText = `
                                position: absolute;
                                top: 5px;
                                right: 5px;
                                width: 24px;
                                height: 24px;
                                background: #dc2626;
                                border-radius: 50%;
                                color: white;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 14px;
                                cursor: pointer;
                                z-index: 10;
                            `;
                            removeBtn.onclick = (e) => {
                                e.stopPropagation();
                                selectedForDeploy.delete(slotIndex);
                                updateSlot(slotIndex);
                                updateDeployButton();
                                renderHeroGrid();
                            };
                            slot.appendChild(removeBtn);
                            slot.style.position = 'relative';
                        } else {
                            slot.innerHTML = '';
                            slot.style.border = '3px dashed #8b6542';

                            const slotIcon = document.createElement('div');
                            slotIcon.innerText = '+';
                            slotIcon.style.cssText = `
                                font-size: 2.5rem;
                                color: #8b6542;
                                margin-bottom: 5px;
                            `;
                            slot.appendChild(slotIcon);

                            const slotLabel = document.createElement('div');
                            slotLabel.innerText = `Slot ${slotIndex + 1}`;
                            slotLabel.style.cssText = `
                                color: #a07850;
                                font-size: 0.85rem;
                                font-family: 'SF Pro Rounded', sans-serif;
                                font-weight: 600;
                            `;
                            slot.appendChild(slotLabel);
                        }
                    };

                    // Function to update deploy button state
                    const updateDeployButton = () => {
                        const count = selectedForDeploy.size;
                        if (count > 0) {
                            deployBtn.style.opacity = '1';
                            deployBtn.style.cursor = 'pointer';
                            deployBtn.innerText = `🚀 DEPLOY TEAM (${count}/6)`;
                        } else {
                            deployBtn.style.opacity = '0.5';
                            deployBtn.style.cursor = 'not-allowed';
                            deployBtn.innerText = '🚀 DEPLOY TEAM';
                        }
                    };

                    // Create 6 team slots
                    for (let i = 0; i < 6; i++) {
                        const slot = document.createElement('div');
                        slot.style.cssText = `
                            background: linear-gradient(135deg, #2b1d12 0%, #4a3222 100%);
                            border: 3px dashed #8b6542;
                            border-radius: 12px;
                            height: 140px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            overflow: hidden;
                            position: relative;
                        `;
                        slot.onmouseenter = () => {
                            if (!selectedForDeploy.has(i)) {
                                slot.style.borderColor = '#ffd700';
                                slot.style.background = 'linear-gradient(135deg, #3d2815 0%, #5c3828 100%)';
                            }
                        };
                        slot.onmouseleave = () => {
                            if (!selectedForDeploy.has(i)) {
                                slot.style.borderColor = '#8b6542';
                                slot.style.background = 'linear-gradient(135deg, #2b1d12 0%, #4a3222 100%)';
                            }
                        };

                        slotElements.push(slot);
                        updateSlot(i);
                        teamContainer.appendChild(slot);
                    }
                    deployContent.appendChild(teamContainer);

                    // Deploy Button
                    const deployBtn = document.createElement('button');
                    deployBtn.innerText = '🚀 DEPLOY TEAM';
                    deployBtn.style.cssText = `
                        padding: 12px 40px;
                        font-size: 1.1rem;
                        font-weight: bold;
                        font-family: 'SF Pro Rounded', sans-serif;
                        background: linear-gradient(180deg, #4a7c3f 0%, #2d5a26 100%);
                        border: 3px solid #6b9e5a;
                        border-radius: 30px;
                        color: white;
                        cursor: not-allowed;
                        opacity: 0.5;
                        transition: all 0.2s ease;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        margin-bottom: 15px;
                    `;
                    deployBtn.onclick = async () => {
                        if (selectedForDeploy.size > 0) {
                            const team = Array.from(selectedForDeploy.values());
                            const teamInstanceIds = team.map(h => h.instanceId);

                            // Update button to show saving state
                            deployBtn.innerText = '💾 SAVING...';
                            deployBtn.style.opacity = '0.7';

                            try {
                                const response = await fetch('http://localhost:3000/api/team/deploy', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        commanderName: this.currentUser?.commanderName,
                                        teamInstanceIds
                                    })
                                });

                                const data = await response.json();
                                if (data.success) {
                                    console.log('[Deployment] Team saved to database:', teamInstanceIds);
                                    // Update local user profile with new deployedTeam
                                    if (this.currentUser) {
                                        (this.currentUser as any).deployedTeam = teamInstanceIds;
                                    }
                                    deployBtn.innerText = '✅ TEAM SAVED!';
                                    deployBtn.style.background = 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)';
                                    setTimeout(() => {
                                        updateDeployButton();
                                        deployBtn.style.background = 'linear-gradient(180deg, #4a7c3f 0%, #2d5a26 100%)';
                                    }, 1500);
                                } else {
                                    throw new Error(data.message || 'Save failed');
                                }
                            } catch (error) {
                                console.error('[Deployment] Save error:', error);
                                deployBtn.innerText = '❌ SAVE FAILED';
                                deployBtn.style.background = 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)';
                                setTimeout(() => {
                                    updateDeployButton();
                                    deployBtn.style.background = 'linear-gradient(180deg, #4a7c3f 0%, #2d5a26 100%)';
                                }, 1500);
                            }
                        }
                    };
                    deployContent.appendChild(deployBtn);

                    // Initialize button state with loaded team
                    updateDeployButton();

                    // Attribute filter state
                    let currentAttrFilter: 'All' | 'STR' | 'AGI' | 'INT' = 'All';
                    let currentSortMode: 'Level' | 'Power' = 'Level';

                    // Hero selection area with filter
                    const selectSection = document.createElement('div');
                    selectSection.style.cssText = `
                        width: 65%;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    `;

                    // Filter row
                    const filterRow = document.createElement('div');
                    filterRow.style.cssText = `
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        width: 100%;
                    `;

                    const selectLabel = document.createElement('div');
                    selectLabel.innerText = 'SELECT HEROES';
                    selectLabel.style.cssText = `
                        color: #5c3d25;
                        font-size: 1rem;
                        font-weight: bold;
                        font-family: 'SF Pro Rounded', sans-serif;
                    `;
                    filterRow.appendChild(selectLabel);

                    // Controls container (right side)
                    const controlsContainer = document.createElement('div');
                    controlsContainer.style.cssText = `display: flex; gap: 15px; margin-left: auto; align-items: center;`;

                    // Sort Buttons
                    const sortBtns = document.createElement('div');
                    sortBtns.style.cssText = `display: flex; gap: 4px;`;

                    const sortOptions = [
                        { name: 'Level', icon: '⬆' },
                        { name: 'Power', icon: '⚔️' }
                    ];

                    const sortElements: HTMLElement[] = [];
                    const updateSortStyles = () => {
                        sortElements.forEach((btn, idx) => {
                            const isSelected = currentSortMode === sortOptions[idx].name;
                            btn.style.background = isSelected ? '#d97706' : '#5c3d25';
                            btn.style.filter = isSelected ? 'brightness(1.1)' : 'brightness(1)';
                            btn.style.border = isSelected ? '1px solid #fbbf24' : '1px solid #3d2815';
                            btn.style.color = isSelected ? '#fff' : '#aaa';
                            btn.style.boxShadow = isSelected ? '0 0 5px rgba(251, 191, 36, 0.3)' : 'none';
                        });
                    };

                    sortOptions.forEach(opt => {
                        const btn = document.createElement('button');
                        btn.innerHTML = `${opt.icon} <span style="font-size: 0.8em">${opt.name}</span>`;
                        btn.style.cssText = `
                            display: flex; align-items: center; gap: 4px; padding: 6px 10px;
                            border-radius: 6px; cursor: pointer; font-family: 'SF Pro Rounded', sans-serif;
                            font-size: 0.8rem; transition: all 0.2s;
                        `;
                        btn.onclick = () => {
                            currentSortMode = opt.name as any;
                            updateSortStyles();
                            renderHeroGrid();
                        };
                        sortElements.push(btn);
                        sortBtns.appendChild(btn);
                    });
                    updateSortStyles();
                    controlsContainer.appendChild(sortBtns);

                    // Filter buttons
                    const filterBtns = document.createElement('div');
                    filterBtns.style.cssText = `display: flex; gap: 6px;`;

                    const attrFilters = [
                        { name: 'All', icon: '🔄', color: '#8b6542' },
                        { name: 'STR', icon: '💪', color: '#dc2626' },
                        { name: 'AGI', icon: '🏃', color: '#16a34a' },
                        { name: 'INT', icon: '🧠', color: '#2563eb' }
                    ];

                    const filterElements: HTMLElement[] = [];
                    const updateFilterStyles = () => {
                        filterElements.forEach((btn, idx) => {
                            const filter = attrFilters[idx];
                            const isActive = currentAttrFilter === filter.name;
                            btn.style.background = isActive
                                ? `linear-gradient(180deg, ${filter.color}cc 0%, ${filter.color}99 100%)`
                                : 'linear-gradient(180deg, #8b6542 0%, #5c3d25 100%)';
                            btn.style.borderColor = isActive ? filter.color : '#3d2815';
                            btn.style.boxShadow = isActive ? `0 0 8px ${filter.color}66` : 'none';
                        });
                    };

                    attrFilters.forEach(attr => {
                        const btn = document.createElement('button');
                        btn.innerHTML = `${attr.icon} ${attr.name}`;
                        btn.style.cssText = `
                            display: flex; align-items: center; gap: 4px;
                            background: linear-gradient(180deg, #8b6542 0%, #5c3d25 100%);
                            color: #fff;
                            border: 2px solid #3d2815;
                            padding: 6px 12px;
                            border-radius: 15px;
                            cursor: pointer;
                            font-family: 'SF Pro Rounded', sans-serif;
                            font-size: 0.75rem;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        `;
                        btn.onclick = () => {
                            currentAttrFilter = attr.name as any;
                            updateFilterStyles();
                            renderHeroGrid();
                        };
                        filterElements.push(btn);
                        filterBtns.appendChild(btn);
                    });
                    updateFilterStyles();
                    controlsContainer.appendChild(filterBtns);
                    filterRow.appendChild(controlsContainer);
                    selectSection.appendChild(filterRow);

                    // Hero Grid Container (scrollable horizontally)
                    const heroGridContainer = document.createElement('div');
                    heroGridContainer.style.cssText = `
                        width: 100%;
                        background: linear-gradient(135deg, #3d2815 0%, #5c3d25 100%);
                        border: 3px solid #8b6542;
                        border-radius: 15px;
                        padding: 15px;
                        overflow-x: auto;
                        overflow-y: hidden;
                        position: relative;
                    `;

                    // Right fade overlay
                    const fadeOverlay = document.createElement('div');
                    fadeOverlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 80px;
                        height: 100%;
                        background: linear-gradient(to right, transparent, #4a3222);
                        pointer-events: none;
                        z-index: 5;
                        border-radius: 0 12px 12px 0;
                    `;
                    heroGridContainer.appendChild(fadeOverlay);

                    const heroGrid = document.createElement('div');
                    heroGrid.style.cssText = `
                        display: grid;
                        grid-template-rows: repeat(3, 1fr);
                        grid-auto-flow: column;
                        gap: 10px;
                        min-width: min-content;
                        padding-right: 60px;
                    `;

                    // Function to render hero grid
                    const renderHeroGrid = () => {
                        heroGrid.innerHTML = '';

                        // Get user's heroes
                        const userHeroes = this.currentUser?.heroes || {};
                        const entries = userHeroes instanceof Map
                            ? Array.from(userHeroes.entries())
                            : Object.entries(userHeroes);

                        console.log(`[TeamDeployment] Sorting ${entries.length} heroes by ${currentSortMode}`);

                        console.log(`[TeamDeployment] Sorting ${entries.length} heroes by ${currentSortMode}`);

                        // Helper to calculate sort power more accurately
                        const getSortPower = (h: any, id: string) => {
                            // Try to get hero asset and config
                            let heroName = h.heroCodeName;
                            if (!heroName) {
                                heroName = id.includes('_') ? id.split('_')[0] : id;
                            }

                            // Find config
                            // We need to access the progressions. Since we can't easily import specific configs without a map,
                            // we'll attempt to find it in HERO_ASSETS which links to configs or simple lookup

                            // Fallback heuristic if we can't calculate full stats
                            // But wait, we can try to get the hero definition from a global map if available.
                            // The HeroUpgradeModal uses 'this.heroManager.getStatsAtLevel(level)'.

                            // IMPROVED HEURISTIC matching the magnitude of real power (16k for lv1?? seems high but user said so)
                            // User said Lv 1 is 16,753 power.
                            // If Lv 1 is 16k, then base stats must be huge? Or equipment?
                            // Ah, User might have ENDGAME equipment on a Lv 1 hero.

                            const level = Number(h.level) || 1;
                            const stars = Number(h.stars) || 1;

                            // If we have equipment, add dummy power for them
                            let equipmentPower = 0;
                            if (h.equipment && Array.isArray(h.equipment)) {
                                const equippedCount = h.equipment.filter((e: any) => e).length;
                                equipmentPower = equippedCount * 2000; // rough estimate
                            }

                            // If base power is 16k at level 1, simple heuristic fails.
                            // We heavily weight stars and equipment.

                            // Let's try to simulate the formula:
                            // Power = HP*0.1 + ATK*5 + ... 
                            // A level 1 hero might have 5000 HP, 500 ATK...
                            // 500 + 2500 = 3000. 
                            // If Eq adds 10k... then 13k.

                            // Since we can't easily run full calc without instantiating everything,
                            // let's use a Hybrid Heuristic that scales similarly.
                            // Or, if the hero object HAS 'power' property (check logs).

                            if (h.combatPower) return Number(h.combatPower);

                            // Revert to heuristic but aggressive on Stars since that's likely the multiplier
                            // If user says Lv 1 is 16k, maybe stats are not scaled 1-100.

                            // NEW FORMULA Attempt:
                            // Base ~ 1000
                            // Level * 200
                            // Stars * 5000
                            // Equipment?

                            return (level * 200) + (stars * 5000) + equipmentPower;
                        };

                        entries.sort((a, b) => {
                            const [idA, heroA] = a;
                            const [idB, heroB] = b;

                            if (currentSortMode === 'Power') {
                                const powerA = getSortPower(heroA, idA);
                                const powerB = getSortPower(heroB, idB);

                                if (powerA !== powerB) {
                                    // LOGGING TO DEBUG
                                    // console.log(`[Sort] ${heroA.heroCodeName}: ${powerA} vs ${heroB.heroCodeName}: ${powerB}`);
                                    return powerB - powerA;
                                }
                            }

                            // Default / Primary Tie-breaker: Level descending
                            const levelDiff = (Number(heroB.level) || 1) - (Number(heroA.level) || 1);
                            if (levelDiff !== 0) return levelDiff;

                            // Secondary Tie-breaker: Stars descending
                            const starDiff = (Number(heroB.stars) || 1) - (Number(heroA.stars) || 1);
                            if (starDiff !== 0) return starDiff;

                            // Tertiary Tie-breaker: ID (stable sort)
                            return idB.localeCompare(idA);
                        });

                        if (entries.length === 0) {
                            const emptyMsg = document.createElement('div');
                            emptyMsg.innerText = 'No heroes available. Summon some heroes first!';
                            emptyMsg.style.cssText = `
                                color: #a07850;
                                font-size: 1rem;
                                padding: 20px;
                                font-family: 'SF Pro Rounded', sans-serif;
                            `;
                            heroGrid.appendChild(emptyMsg);
                            return;
                        }

                        // Check if hero is already selected
                        const isHeroSelected = (instanceId: string) => {
                            for (const [_, data] of selectedForDeploy) {
                                if (data.instanceId === instanceId) return true;
                            }
                            return false;
                        };

                        entries.forEach(([instanceId, heroData]: [string, any]) => {
                            // Get hero attribute for filtering
                            const heroAttr = heroData.attribute || 'STR';

                            // Apply attribute filter
                            if (currentAttrFilter !== 'All' && heroAttr !== currentAttrFilter) {
                                return;
                            }

                            // Get hero name
                            let heroName = heroData.heroCodeName;
                            if (!heroName) {
                                heroName = instanceId.includes('_') ? instanceId.split('_')[0] : instanceId;
                            }
                            // Capitalize first letter
                            heroName = heroName.charAt(0).toUpperCase() + heroName.slice(1);

                            const asset = HERO_ASSETS.find(a => a.name.toLowerCase() === heroName.toLowerCase());
                            if (!asset) return;

                            const isSelected = isHeroSelected(instanceId);
                            const stars = heroData.stars || 1;
                            const level = heroData.level || 1;

                            const card = document.createElement('div');
                            card.style.cssText = `
                                width: 100px;
                                height: 130px;
                                background: ${isSelected ? 'linear-gradient(135deg, #1a4d1a 0%, #2d5a26 100%)' : 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)'};
                                border: 3px solid ${isSelected ? '#4ade80' : '#8b6542'};
                                border-radius: 10px;
                                position: relative;
                                cursor: pointer;
                                transition: all 0.15s ease;
                                flex-shrink: 0;
                                overflow: hidden;
                            `;

                            card.onmouseenter = () => {
                                card.style.transform = 'scale(1.05)';
                                card.style.borderColor = isSelected ? '#4ade80' : '#ffd700';
                            };
                            card.onmouseleave = () => {
                                card.style.transform = 'scale(1)';
                                card.style.borderColor = isSelected ? '#4ade80' : '#8b6542';
                            };

                            card.onclick = () => {
                                if (isSelected) {
                                    // Remove from deployment
                                    for (const [slotIndex, data] of selectedForDeploy) {
                                        if (data.instanceId === instanceId) {
                                            selectedForDeploy.delete(slotIndex);
                                            updateSlot(slotIndex);
                                            break;
                                        }
                                    }
                                } else {
                                    // Add to first empty slot
                                    if (selectedForDeploy.size >= 6) {
                                        return; // Team is full
                                    }
                                    for (let i = 0; i < 6; i++) {
                                        if (!selectedForDeploy.has(i)) {
                                            selectedForDeploy.set(i, { instanceId, heroName: asset.name });
                                            updateSlot(i);
                                            break;
                                        }
                                    }
                                }
                                updateDeployButton();
                                renderHeroGrid();
                            };

                            // Sprite preview
                            if (asset.sprite2D) {
                                const displaySize = 100;
                                const framesPerRow = asset.sprite2D.framesPerRow;
                                const totalRows = Math.ceil(asset.sprite2D.totalFrames / framesPerRow);
                                const scaledSheetWidth = framesPerRow * displaySize;
                                const scaledSheetHeight = totalRows * displaySize;

                                const spritePreview = document.createElement('div');
                                spritePreview.style.cssText = `
                                    width: ${displaySize}px;
                                    height: ${displaySize}px;
                                    background-image: url('${asset.sprite2D.spritesheetPath}');
                                    background-size: ${scaledSheetWidth}px ${scaledSheetHeight}px;
                                    background-position: 0 0;
                                    background-repeat: no-repeat;
                                    transform: scale(2.8) translateY(18%);
                                    transform-origin: center center;
                                `;
                                card.appendChild(spritePreview);
                            }

                            // Stars at bottom
                            const starsContainer = document.createElement('div');
                            starsContainer.style.cssText = `
                                position: absolute;
                                bottom: 2px;
                                width: 100%;
                                text-align: center;
                                font-size: 1rem;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                            `;
                            let starsHtml = '';
                            for (let s = 0; s < stars; s++) {
                                starsHtml += '⭐';
                            }
                            starsContainer.innerHTML = starsHtml;
                            card.appendChild(starsContainer);

                            // Level badge
                            const levelBadge = document.createElement('div');
                            levelBadge.innerText = String(level);
                            levelBadge.style.cssText = `
                                position: absolute;
                                top: 3px;
                                right: 5px;
                                color: white;
                                font-size: 0.85rem;
                                font-weight: bold;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                                font-family: 'SF Pro Rounded', sans-serif;
                            `;
                            card.appendChild(levelBadge);

                            // Selection checkmark
                            if (isSelected) {
                                const checkmark = document.createElement('div');
                                checkmark.innerText = '✓';
                                checkmark.style.cssText = `
                                    position: absolute;
                                    top: 3px;
                                    left: 5px;
                                    width: 22px;
                                    height: 22px;
                                    background: #4ade80;
                                    border-radius: 50%;
                                    color: white;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 14px;
                                    font-weight: bold;
                                `;
                                card.appendChild(checkmark);
                            }

                            heroGrid.appendChild(card);
                        });
                    };

                    renderHeroGrid();
                    heroGridContainer.appendChild(heroGrid);
                    selectSection.appendChild(heroGridContainer);
                    deployContent.appendChild(selectSection);

                    contentArea.appendChild(deployContent);
                }
            };

            // Function to update tab styles
            const updateTabStyles = () => {
                tabElements.forEach((tab, index) => {
                    const tabName = ['Heroes', 'Shards', 'Gallery', 'Deployment'][index];
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

            const tabs = ['Heroes', 'Shards', 'Gallery', 'Deployment'];
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

        // Check Affordability
        const canAfford = item.currencyType === 'coin'
            ? this.currentUser.gold >= item.cost
            : this.currentUser.gems >= item.cost;

        if (canAfford) {
            // Deduct Cost
            if (item.currencyType === 'coin') {
                this.currentUser.gold -= item.cost;
            } else {
                this.currentUser.gems -= item.cost;
            }

            // Handle different item types
            if (item.itemType === 'summon' && item.quantity) {
                // Add summon scrolls to inventory
                if (!this.currentUser.inventory) this.currentUser.inventory = {};
                const itemKey = item.id.startsWith('grand_summon') ? 'grand_summon' : item.id;
                const currentCount = this.currentUser.inventory[itemKey] || 0;
                this.currentUser.inventory[itemKey] = currentCount + item.quantity;
                console.log(`Purchased ${item.quantity} ${itemKey}. New total: ${this.currentUser.inventory[itemKey]}`);
            } else if (item.itemType === 'coin' && item.coinAmount) {
                // Add Coins to gold
                this.currentUser.gold = (this.currentUser.gold || 0) + item.coinAmount;
                console.log(`Purchased ${item.coinAmount.toLocaleString()} coins. New total: ${this.currentUser.gold.toLocaleString()}`);
            } else if (item.itemType === 'tier1_item') {
                // Add Item to legacy Inventory (for backpack display)
                if (!this.currentUser.inventory) this.currentUser.inventory = {};
                const currentCount = this.currentUser.inventory[item.id] || 0;
                this.currentUser.inventory[item.id] = currentCount + 1;

                // Also add to new equipmentInventory (for Forge)
                if (!this.currentUser.equipmentInventory) this.currentUser.equipmentInventory = [];
                this.currentUser.equipmentInventory.push({ itemId: item.id, stars: 0 });

                console.log(`Purchased ${item.name}. Backpack qty: ${this.currentUser.inventory[item.id]}, Equipment inv: ${this.currentUser.equipmentInventory.length}`);
            } else if (item.itemType === 'material' && item.materialAmount) {
                // Add material (Polishing Powder)
                this.currentUser.polishingPowder = (this.currentUser.polishingPowder || 0) + item.materialAmount;
                console.log(`Purchased ${item.materialAmount} Polishing Powder. New total: ${this.currentUser.polishingPowder}`);
            } else if (item.xpAmount) {
                // Add XP
                addPlayerXp(this.currentUser, item.xpAmount);
            }

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
            console.log(`Not enough ${item.currencyType === 'coin' ? 'Gold' : 'Gems'}`);
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

                    // Ensure Inventory exists
                    if (!this.currentUser) return; // Should not happen
                    if (!this.currentUser.inventory) this.currentUser.inventory = {};
                    if (!this.currentUser.equipmentInventory) this.currentUser.equipmentInventory = [];

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
