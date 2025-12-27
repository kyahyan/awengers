
import { UserProfile } from '../data/UserProfile';

export class ProfileUI {
    private container: HTMLElement;
    private profileData: UserProfile;
    private onClose: () => void;

    constructor(profileData: UserProfile, onClose: () => void) {
        this.profileData = profileData;
        this.onClose = onClose;
        this.container = document.createElement('div');
        this.container.className = 'profile-modal-overlay';
        this.render();
    }

    private render() {
        // Calculate progress percentages
        const xpPercent = Math.min(100, (this.profileData.currentXp / this.profileData.maxXp) * 100);
        // Mock VIP progress for visual
        const vipPercent = Math.min(100, (this.profileData.vipPoints / 2000) * 100); // Assuming next level at 2000 for demo

        this.container.innerHTML = `
            <div class="profile-modal">
                <button class="close-btn">×</button>
                
                <div class="profile-header">
                    <div class="commander-info">
                        <div class="commander-name">${this.profileData.commanderName}</div>
                        <div class="guild-name"><span class="icon">🐺</span> ${this.profileData.guildName || 'No Guild'}</div>
                    </div>
                    <div class="profile-id">ID: 8829103</div>
                </div>

                <div class="profile-body">
                    <!-- Left Column: Avatar & Rank -->
                    <div class="profile-left">
                        <div class="avatar-frame">
                            <div class="avatar-placeholder">
                                <!-- Placeholder for 3D model render or image -->
                                <div style="font-size: 4rem;">🦁</div>
                            </div>
                            <div class="current-rank">
                                <span class="rank-icon">👑</span>
                                <span class="rank-title">${this.profileData.rankTitle}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Stats & Tabs -->
                    <div class="profile-right">
                        
                        <!-- Top Stats Grid -->
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-label">Combat Power</div>
                                <div class="stat-value cp-text">⚔️ ${this.profileData.combatPower.toLocaleString()}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-label">Level</div>
                                <div class="stat-value">${this.profileData.level}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-label">VIP</div>
                                <div class="stat-value vip-text">VIP ${this.calculateVipLevel(this.profileData.vipPoints)}</div>
                            </div>
                        </div>

                        <!-- Progress Bars -->
                        <div class="progress-section">
                            <div class="bar-container">
                                <div class="bar-label">XP Progress</div>
                                <div class="progress-track">
                                    <div class="progress-fill xp-fill" style="width: ${xpPercent}%"></div>
                                    <span class="progress-text">${this.profileData.currentXp} / ${this.profileData.maxXp}</span>
                                </div>
                            </div>
                            <div class="bar-container">
                                <div class="bar-label">VIP Points</div>
                                <div class="progress-track">
                                    <div class="progress-fill vip-fill" style="width: ${vipPercent}%"></div>
                                    <span class="progress-text">${this.profileData.vipPoints} / 2000</span>
                                </div>
                            </div>
                        </div>

                        <!-- Tabs -->
                        <div class="profile-tabs">
                            <button class="tab-btn active">Overview</button>
                            <button class="tab-btn">Statistics</button>
                            <button class="tab-btn">Achievements</button>
                        </div>

                        <!-- Tab Content (Placeholder) -->
                        <div class="tab-content">
                            <div class="info-row">
                                <span>Highest Rank</span>
                                <span>${this.profileData.stats.highestRankAchieved}</span>
                            </div>
                            <div class="info-row">
                                <span>Favorite Hero</span>
                                <span>${this.profileData.favoriteHeroCodeName}</span>
                            </div>
                            <div class="info-row">
                                <span>Arena Wins</span>
                                <span>${this.profileData.stats.arenaWins}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <style>
                .profile-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(5px);
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    pointer-events: auto;
                }
                .profile-modal {
                    width: 800px;
                    height: 500px;
                    background: linear-gradient(145deg, #1a1a2e, #16213e);
                    border: 1px solid #334;
                    border-radius: 20px;
                    padding: 2rem;
                    position: relative;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .close-btn {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: #aaa;
                    font-size: 2rem;
                    cursor: pointer;
                    line-height: 1;
                    padding: 0;
                    box-shadow: none;
                }
                .close-btn:hover { color: white; transform: none; box-shadow: none; }

                .profile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    border-bottom: 1px solid #334;
                    padding-bottom: 1rem;
                }
                .commander-name { font-size: 2rem; font-weight: bold; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
                .guild-name { color: #889; font-size: 1rem; display: flex; align-items: center; gap: 5px; margin-top: 5px; }
                .profile-id { color: #556; font-family: 'SF Pro Display', sans-serif; }

                .profile-body { display: flex; gap: 2rem; height: 100%; margin-top: 1rem; }
                
                .profile-left { 
                    width: 30%; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center;
                    background: rgba(0,0,0,0.2);
                    border-radius: 15px;
                }
                .avatar-frame {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
                .avatar-placeholder {
                    width: 120px;
                    height: 120px;
                    background: radial-gradient(circle, #445 0%, #223 100%);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border: 4px solid #ffd700;
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
                }
                .current-rank {
                    background: #111;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid #445;
                }
                .rank-title { color: #ffd700; font-weight: bold; letter-spacing: 1px; }

                .profile-right { width: 70%; display: flex; flex-direction: column; gap: 1.5rem; }

                .stats-grid { display: flex; gap: 1rem; }
                .stat-box {
                    flex: 1;
                    background: rgba(255,255,255,0.05);
                    padding: 0.8rem;
                    border-radius: 10px;
                    text-align: center;
                }
                .stat-label { color: #889; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
                .stat-value { font-size: 1.2rem; font-weight: bold; margin-top: 5px; }
                .cp-text { color: #ff5555; }
                .vip-text { color: #ffd700; }

                .progress-section { display: flex; flex-direction: column; gap: 0.8rem; }
                .bar-container { display: flex; flex-direction: column; gap: 5px; }
                .bar-label { font-size: 0.8rem; color: #889; margin-left: 5px; }
                .progress-track {
                    height: 12px;
                    background: #111;
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                }
                .progress-fill { height: 100%; border-radius: 6px; position: absolute; top:0; left: 0; }
                .xp-fill { background: linear-gradient(90deg, #44f, #88f); box-shadow: 0 0 10px #44f; }
                .vip-fill { background: linear-gradient(90deg, #d4af37, #f7d76f); }
                .progress-text {
                    position: absolute;
                    width: 100%;
                    text-align: center;
                    font-size: 9px;
                    line-height: 12px;
                    color: rgba(255,255,255,0.8);
                    text-shadow: 1px 1px 0 #000;
                }

                .profile-tabs { display: flex; gap: 1rem; border-bottom: 1px solid #334; }
                .tab-btn {
                    background: none;
                    border: none;
                    color: #889;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    font-size: 1rem;
                    border-radius: 10px 10px 0 0;
                    margin-bottom: -1px;
                    box-shadow: none;
                }
                .tab-btn.active {
                    color: white;
                    border-bottom: 2px solid #3498db;
                    background: rgba(255,255,255,0.05);
                }
                .tab-btn:hover { background: rgba(255,255,255,0.05); transform: none; box-shadow: none; }

                .tab-content {
                    background: rgba(0,0,0,0.2);
                    border-radius: 10px;
                    padding: 1rem;
                    flex: 1;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .info-row:last-child { border-bottom: none; }
                .info-row span:first-child { color: #889; }
                .info-row span:last-child { color: white; font-weight: bold; }
            </style>
        `;

        this.container.querySelector('.close-btn')?.addEventListener('click', () => this.destroy());
    }

    private calculateVipLevel(points: number): number {
        // Simple mock util, real one is in UserProfile.ts
        if (points < 100) return 0;
        if (points < 300) return 1;
        if (points < 600) return 2;
        if (points < 1000) return 3;
        // ...
        return Math.floor(points / 1000); // Rough estimate for now
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public destroy() {
        this.container.remove();
        this.onClose();
    }
}
