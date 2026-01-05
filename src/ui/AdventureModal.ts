import { JADE_LOTUS_SHRINE_STAGES, StageDefinition, getStageEnemyIcons, getStageMainEnemy, Difficulty, getStageStars, saveStageStars, resetAdventureProgress, ADVENTURE_PROGRESS } from '../data/AdventureData';
import { createOryxHero, createSableHero, createRazorHero, HeroProgressionManager } from '../data/HeroProgression';
import { ENEMY_DEFINITIONS, getEnemyStatsForLevel } from '../data/EnemyDefinitions';
import { BattleArenaUI } from './BattleArenaUI';
import { LootReward, getPossibleRewards } from '../data/LootSystem';

export class AdventureModal {
    private container: HTMLElement;
    private onClose: () => void;

    private getDeployedTeam: () => { name: string, level: number, instanceId: string, stars: number, currentRankIndex?: number, experience?: number, skillLevels?: any, equipment?: any[] }[];

    private onBattleResult?: (stageId: number, win: boolean, isAuto: boolean, rewards?: LootReward[], finalSpeed?: number, difficulty?: Difficulty) => void;

    constructor(
        onClose: () => void,
        getDeployedTeam: () => { name: string, level: number, instanceId: string, stars: number, currentRankIndex?: number, experience?: number, skillLevels?: any, equipment?: any[] }[],
        private maxStage: number = 1,
        onBattleResult?: (stageId: number, win: boolean, isAuto: boolean, rewards?: LootReward[], finalSpeed?: number, difficulty?: Difficulty) => void,
        private initialAuto: boolean = false,
        private initialSpeed: number = 2,
        private onReset?: () => void
    ) {
        this.onClose = onClose;
        this.getDeployedTeam = getDeployedTeam;
        this.maxStage = maxStage;
        this.onBattleResult = onBattleResult;
        this.onReset = onReset;
        this.container = document.createElement('div');
        this.container.className = 'adventure-modal-overlay';

        // Handle click outside to close
        this.container.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent map clicks
            if (e.target === this.container) {
                this.close();
            }
        });

        this.render();
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    private close() {
        const modal = this.container.querySelector('.adventure-modal');
        if (modal) {
            modal.classList.add('closing');
            this.container.classList.add('fading-out');
        }

        // Wait for animation
        setTimeout(() => {
            if (this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            this.onClose();
        }, 300);
    }

    private currentDifficulty: Difficulty = Difficulty.NORMAL;

    // ...

    private startBattle(stage: StageDefinition, difficulty: Difficulty = Difficulty.NORMAL) {
        const enemy = getStageMainEnemy(stage);
        if (!enemy) {
            console.error('[Adventure] No enemy found for stage:', stage.id);
            return;
        }

        const deployedTeam = this.getDeployedTeam();
        if (deployedTeam.length === 0) {
            alert('No heroes deployed! Please deploy a team in the Deployment tab.');
            return;
        }

        // Calculate full stats for deployed team
        const detailedTeam = deployedTeam.map(hero => {
            const level = Number(hero.level) || 1;
            let manager: HeroProgressionManager;
            const heroNameLower = (hero.name || hero.instanceId).toLowerCase();

            // Construct temp instance
            const tempInstance = {
                heroId: hero.instanceId,
                level: level,
                currentRankIndex: hero.currentRankIndex || 0,
                experience: hero.experience || 0,
                skillLevels: hero.skillLevels || {},
                equipment: hero.equipment || new Array(9).fill(null)
            };

            if (heroNameLower.includes('ranger') || heroNameLower.includes('sable')) {
                manager = createSableHero(level, tempInstance);
            } else if (heroNameLower.includes('razor') || heroNameLower.includes('assassin')) {
                manager = createRazorHero(level, tempInstance);
            } else {
                manager = createOryxHero(level, tempInstance);
            }

            const totalStats = manager.getTotalStats();
            const config = manager.getConfig();

            return {
                ...hero,
                stats: {
                    hp: totalStats.hp,
                    atk: totalStats.atk,
                    def: totalStats.armor,
                    speed: totalStats.aspd,
                    crit: '10%' // Default or calculated if available
                },
                skills: config.skills,
                moveSpeed: totalStats.moveSpeed
            };
        });

        console.log(`[Adventure] Starting battle with ${enemy.name} (Level ${stage.recommendedLevel})`);
        console.log(`[Adventure] Detailed Team:`, detailedTeam);

        // Close the adventure modal
        this.close();

        // Create battle UI with team data
        setTimeout(() => {
            try {
                const enemyIds = stage.enemyIds; // Use full list of enemy IDs

                const isFirstClear = stage.id === this.getMaxUnlockedStage();
                const mapId = 1; // Currently only Jade Lotus Shrine (Map 1) implemented

                // Difficulty Scaling for BattleArenaUI
                let level = stage.recommendedLevel;
                if (difficulty === Difficulty.HARD) { level = Math.floor(level * 1.5 + 5); }
                if (difficulty === Difficulty.INSANE) { level = Math.floor(level * 2 + 15); }

                const battleUI = new BattleArenaUI(
                    detailedTeam,
                    () => console.log('[Adventure] Battle ended'),
                    (result) => this.handleBattleResult(stage, result, true, battleUI),
                    enemyIds,
                    level,
                    this.initialAuto,
                    mapId,
                    isFirstClear,
                    this.initialSpeed,
                    (result) => this.handleBattleResult(stage, result, false, null)
                );
            } catch (e) {
                console.error('Failed to start battle:', e);
            }
        }, 300);
    }

    private getMaxUnlockedStage(): number {
        let max = 0;
        for (const id in ADVENTURE_PROGRESS) {
            const stars = ADVENTURE_PROGRESS[id][Difficulty.NORMAL] || 0;
            if (stars > 0) {
                const stageId = parseInt(id);
                if (stageId > max) max = stageId;
            }
        }
        return max + 1;
    }

    private handleBattleResult(stage: StageDefinition, result: { win: boolean, isAuto: boolean, rewards: LootReward[], finalSpeed: number, survivingHeroes: number }, shouldClose: boolean, battleUI: BattleArenaUI | null) {
        if (shouldClose && battleUI) battleUI.close();

        let stars = 0;
        if (result.win) {
            const totalHeroes = this.getDeployedTeam().length;
            const survivors = result.survivingHeroes;
            const dead = totalHeroes - survivors;

            if (dead === 0) stars = 3;
            else if (dead === 1) stars = 2;
            else stars = 1;

            saveStageStars(stage.id, this.currentDifficulty, stars);
        }

        if (this.onBattleResult) {
            this.onBattleResult(stage.id, result.win, result.isAuto, result.rewards, result.finalSpeed, this.currentDifficulty);
        }
    }
    private isDifficultyUnlocked(diff: Difficulty): boolean {
        if (diff === Difficulty.NORMAL) return true;

        // Hard requires clearing Stage 30 Normal
        if (diff === Difficulty.HARD) {
            return getStageStars(30, Difficulty.NORMAL) > 0;
        }

        // Insane requires clearing Stage 30 Hard
        if (diff === Difficulty.INSANE) {
            return getStageStars(30, Difficulty.HARD) > 0;
        }

        return false;
    }

    private calculateStageCP(stage: StageDefinition, diffLevel: number): number {
        let totalCP = 0;
        stage.enemyIds.forEach(id => {
            const def = ENEMY_DEFINITIONS.find(e => e.id === id);
            if (def) {
                // Get accurate stats for this level
                const stats = getEnemyStatsForLevel(def, diffLevel);

                // Calculate CP using same weights as Hero CP
                const hpPower = stats.hp * 0.1;
                const atkPower = stats.atk * 5;
                const defPower = stats.def * 10;

                // Estimate AS/Speed contribution (Enemies usually ~1.0 AS)
                const aspdPower = (stats.speed || 1.0) * 1000;

                // Level bonus
                const levelPower = diffLevel * 20;

                totalCP += (hpPower + atkPower + defPower + aspdPower + levelPower);
            }
        });
        return Math.round(totalCP);
    }

    private formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    private render() {
        this.container.innerHTML = `
            <div class="adventure-modal">
                <div class="modal-header">
                    <div class="modal-title">Jade Lotus Shrine</div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <button class="close-btn">✖</button>
                    </div>
                </div>
                
                <div class="modal-controls">
                    <div class="difficulty-tabs">
                        <button class="diff-tab ${this.currentDifficulty === Difficulty.NORMAL ? 'active' : ''}" data-diff="${Difficulty.NORMAL}">Normal</button>
                        
                        <button class="diff-tab ${this.currentDifficulty === Difficulty.HARD ? 'active' : ''} ${!this.isDifficultyUnlocked(Difficulty.HARD) ? 'disabled' : ''}" 
                            data-diff="${Difficulty.HARD}">
                            Hard ${!this.isDifficultyUnlocked(Difficulty.HARD) ? '🔒' : ''}
                        </button>
                        
                        <button class="diff-tab ${this.currentDifficulty === Difficulty.INSANE ? 'active' : ''} ${!this.isDifficultyUnlocked(Difficulty.INSANE) ? 'disabled' : ''}" 
                            data-diff="${Difficulty.INSANE}">
                            Insane ${!this.isDifficultyUnlocked(Difficulty.INSANE) ? '🔒' : ''}
                        </button>
                    </div>
                </div>

                <div class="stage-list-container">
                    <div class="stage-list">
                        <!-- Stages injected here -->
                    </div>
                </div>
            </div>
            <style>
                .adventure-modal-overlay {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.7);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 2000;
                    backdrop-filter: blur(5px);
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    pointer-events: auto; /* Fix interactions */
                    transition: background 0.3s;
                    opacity: 0;
                    animation: overlayFadeIn 0.3s forwards;
                }
                .adventure-modal-overlay.fading-out {
                    pointer-events: none;
                    animation: overlayFadeOut 0.3s forwards;
                }

                .adventure-modal {
                    width: 600px;
                    height: 80vh;
                    background: linear-gradient(180deg, #2b1d0e 0%, #1a1005 100%);
                    border: 2px solid #c9a45c;
                    border-radius: 12px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 50px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                    transform: scale(0.9);
                    opacity: 0;
                    animation: modalPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .adventure-modal.closing {
                    animation: modalPopOut 0.3s forwards;
                }

                @keyframes overlayFadeIn {
                    to { opacity: 1; }
                }
                @keyframes overlayFadeOut {
                    to { opacity: 0; }
                }
                @keyframes modalPopIn {
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes modalPopOut {
                    to { transform: scale(0.9); opacity: 0; }
                }

                .modal-header {
                    padding: 15px 20px;
                    background: #3e2b14;
                    border-bottom: 2px solid #5c401a;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-title {
                    color: #ffd700;
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: #888;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .close-btn:hover { color: white; }

                .modal-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 10px 20px;
                    background: rgba(0,0,0,0.2);
                    border-bottom: 1px solid #444;
                }
                .difficulty-tabs { display: flex; gap: 5px; }
                .diff-tab { 
                    background: #2b1d0e; border: 1px solid #5c401a; color: #888; 
                    padding: 5px 15px; border-radius: 4px 4px 0 0; cursor: pointer;
                    border-bottom: none; position: relative; top: 1px;
                }
                .diff-tab.active { 
                    background: #3e2b14; color: #ffd700; border-color: #ffd700; font-weight: bold;
                    border-bottom: 2px solid #3e2b14; z-index: 2;
                }
                .diff-tab.disabled {
                    opacity: 0.5; cursor: not-allowed; filter: grayscale(1);
                }
                .diff-tab.disabled:hover {
                    background: #2b1d0e; color: #888;
                }
                .diff-tab:hover:not(.active):not(.disabled) { background: #3e2b14; color: #ccc; }
                .star-rating { color: #555; font-size: 0.9rem; margin-left: 10px; }
                .star-rating.earned { color: #ffd700; text-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }

                .stage-list-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                }
                .stage-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .stage-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 10px 15px;
                    border-radius: 8px;
                    transition: background 0.2s;
                }
                .stage-row:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #ffd700;
                }
                
                .stage-info {
                    display: flex;
                    flex-direction: column;
                }
                .stage-name {
                    color: #ffd700;
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                .stage-details {
                    color: #aaa;
                    font-size: 0.85rem;
                }

                .stage-enemies {
                    display: flex;
                    gap: 5px;
                }
                .enemy-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    border: 1px solid #555;
                    background: #222;
                    object-fit: cover;
                }

                .battle-btn {
                    padding: 8px 20px;
                    background: linear-gradient(180deg, #ff9800 0%, #e65100 100%);
                    border: 1px solid #ffb74d;
                    color: white;
                    font-weight: bold;
                    border-radius: 20px;
                    cursor: pointer;
                    text-transform: uppercase;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    transition: transform 0.1s;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .battle-btn:hover {
                    transform: scale(1.05);
                    filter: brightness(1.1);
                }
                .battle-btn:active {
                    transform: scale(0.95);
                }
                
                .stage-center-content {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                    margin: 0 15px;
                }

                .cp-badge {
                    display: inline-block;
                    background: rgba(220, 38, 38, 0.2);
                    color: #f87171;
                    border: 1px solid rgba(220, 38, 38, 0.4);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    margin-left: 8px;
                    font-weight: bold;
                }

                .loot-container {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap; 
                    max-width: 250px;
                }
                
                .loot-icon-frame {
                    width: 32px; height: 32px;
                    background: #1a1a1a;
                    border: 1px solid #444;
                    border-radius: 6px;
                    display: flex; justify-content: center; align-items: center;
                }
                
                .loot-icon {
                    width: 24px; height: 24px;
                    object-fit: contain;
                }
                .loot-icon-frame {
                    position: relative;
                }
                .loot-chance {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    background: rgba(0,0,0,0.8);
                    color: #fff;
                    font-size: 0.55rem;
                    padding: 1px 2px;
                    border-radius: 4px;
                    border: 1px solid #555;
                    font-weight: bold;
                    pointer-events: none;
                }
                /* Custom Scrollbar */
                .stage-list-container::-webkit-scrollbar {
                    width: 8px;
                }
                .stage-list-container::-webkit-scrollbar-track {
                    background: #1a1005;
                }
                .stage-list-container::-webkit-scrollbar-thumb {
                    background: #5c401a;
                    border-radius: 4px;
                }
            </style>
        `;

        // Bind Tab Events
        this.container.querySelectorAll('.diff-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const diff = target.dataset.diff as Difficulty;

                // Unlock check
                if (!this.isDifficultyUnlocked(diff)) {
                    alert(`Complete Stage 30 on ${diff === Difficulty.HARD ? 'Normal' : 'Hard'} to unlock!`);
                    return;
                }
                this.setDifficulty(diff);

                this.container.querySelectorAll('.diff-tab').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
            });
        });

        // Initial Render
        this.renderStageList();



        // Close Event
        this.container.querySelector('.close-btn')?.addEventListener('click', () => {
            this.close();
        });
    }

    private setDifficulty(diff: Difficulty) {
        this.currentDifficulty = diff;
        this.renderStageList();
    }

    private renderStageList() {
        const listContainer = this.container.querySelector('.stage-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        JADE_LOTUS_SHRINE_STAGES.forEach(stage => {
            const row = document.createElement('div');
            row.className = 'stage-row';

            // Stars
            const stars = getStageStars(stage.id, this.currentDifficulty);
            const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);

            // Lock Logic
            let isLocked = false;
            // Normal: stage.id > maxStage
            // Hard: Normal cleared (3 stars)
            // Insane: Hard cleared (3 stars)

            // Wait, "Clear First Normal with perfect star Before unlocking Hard".
            // So to play Hard Stage 1, you need Normal Stage 1 3-stars.
            // AND (presumably) Hard Stage 1 unlocked by progress? 
            // Usually Difficulty unlock is global or per-stage. The prompt implies per-stage or global?
            // "Clear First Normal with perfect star Before unlocking Hard". 
            // Let's assume Per-Stage: Hard 1-1 requires Normal 1-1 3-Stars.

            if (this.currentDifficulty === Difficulty.NORMAL) {
                isLocked = stage.id > this.maxStage;
            } else if (this.currentDifficulty === Difficulty.HARD) {
                const normalStars = getStageStars(stage.id, Difficulty.NORMAL);
                isLocked = normalStars < 3;
            } else if (this.currentDifficulty === Difficulty.INSANE) {
                const hardStars = getStageStars(stage.id, Difficulty.HARD);
                isLocked = hardStars < 3;
            }

            // Difficulty Scaling
            let level = stage.recommendedLevel;
            // let cpMult = 1; // Removed simple multiplier
            if (this.currentDifficulty === Difficulty.HARD) { level = Math.floor(level * 1.5 + 5); }
            if (this.currentDifficulty === Difficulty.INSANE) { level = Math.floor(level * 2 + 15); }

            const stageCP = this.calculateStageCP(stage, level);

            // Get enemy icons
            const enemyIcons = getStageEnemyIcons(stage);
            const enemiesHtml = enemyIcons.map(src => `<img src="${src}" class="enemy-icon" onerror="this.style.display='none'"/>`).join('');

            // Loot Icons
            const potentialDrops = getPossibleRewards(1, stage.id, this.currentDifficulty.toLowerCase() as 'normal' | 'hard' | 'insane');
            const lootHtml = potentialDrops.map(reward => `
                <div class="loot-icon-frame" title="${reward.name} (${reward.chance}%)">
                    <img src="${reward.icon}" class="loot-icon" onerror="this.style.display='none'"/>
                    <span class="loot-chance">${reward.chance}%</span>
                </div>
            `).join('');

            // Add previous stage check for Hard/Insane
            if (!isLocked && this.currentDifficulty !== Difficulty.NORMAL && stage.id > 1) {
                // Also require previous stage on SAME difficulty to be cleared (at least 1 star)
                const prevStars = getStageStars(stage.id - 1, this.currentDifficulty);
                if (prevStars < 1) isLocked = true;
            }

            row.innerHTML = `
                    <div class="stage-info">
                        <div class="stage-name" style="${isLocked ? 'color:#888;' : ''}">
                            ${stage.name}
                            <span class="star-rating ${stars > 0 ? 'earned' : ''}">${starStr}</span>
                        </div>
                        <div class="stage-details">
                            Rec. Level: ${level} 
                            <span class="cp-badge">⚔️ ${this.formatNumber(stageCP)}</span>
                        </div>
                    </div>
                    
                    <div class="stage-center-content">
                        <div class="loot-container" style="${isLocked ? 'opacity:0.3;' : ''}">
                             ${lootHtml}
                        </div>
                        <div class="stage-enemies" style="${isLocked ? 'opacity:0.3;' : ''}">
                            ${enemiesHtml}
                        </div>
                    </div>

                    ${isLocked ?
                    `<button class="battle-btn locked" disabled style="background:#333; border-color:#555; color:#888; cursor:not-allowed; box-shadow:none;">🔒 Locked</button>` :
                    `<button class="battle-btn" data-id="${stage.id}">⚡ Battle</button>`
                }
                `;

            const btn = row.querySelector('.battle-btn');
            if (btn && !isLocked) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startBattle(stage, this.currentDifficulty);
                });
            }

            listContainer.appendChild(row);
        });
    }
}
