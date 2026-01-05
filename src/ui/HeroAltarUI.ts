import { UserProfile } from '../data/UserProfile';
import { HERO_ASSETS, HeroAssetConfig } from '../data/HeroAssetsMap';

type AltarTab = 'reset' | 'decompose' | 'starback';

export class HeroAltarUI {
    private container: HTMLElement;
    private user: UserProfile;
    private contentArea!: HTMLElement;
    private currentTab: AltarTab = 'decompose';
    private selectedHeroIds: string[] = [];
    private onUpdate: (updatedUser: any) => void;

    private readonly MAX_DECOMPOSE_SELECT = 14;

    constructor(user: UserProfile, onUpdate: (updatedUser: any) => void) {
        this.user = user;
        this.onUpdate = onUpdate;

        this.container = document.createElement('div');
        this.container.style.cssText = `
            width: 100%;
            height: 100%;
            max-width: 1500px;
            max-height: 800px;
            margin: auto;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        `;

        this.initialize();
    }

    private initialize() {
        this.container.innerHTML = '';

        // Tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.style.cssText = `
            display: flex;
            gap: 0;
        `;

        const createTab = (id: AltarTab, label: string, icon: string) => {
            const tab = document.createElement('button');
            const isActive = this.currentTab === id;
            tab.innerHTML = `${icon} ${label}`;
            tab.style.cssText = `
                flex: 1;
                padding: 12px 15px;
                border: none;
                cursor: pointer;
                font-weight: bold;
                font-size: 0.9rem;
                font-family: 'SF Pro Rounded', sans-serif;
                transition: all 0.2s;
                background: ${isActive ? 'linear-gradient(180deg, #a07850 0%, #6b4830 100%)' : 'transparent'};
                color: ${isActive ? '#fff' : '#a07850'};
                border-radius: ${isActive ? '12px 12px 0 0' : '0'};
            `;
            tab.onmouseenter = () => {
                if (!isActive) {
                    tab.style.background = 'rgba(255, 255, 255, 0.05)';
                    tab.style.color = '#f5deb3';
                }
            };
            tab.onmouseleave = () => {
                if (!isActive) {
                    tab.style.background = 'transparent';
                    tab.style.color = '#a07850';
                }
            };
            tab.onclick = () => {
                this.currentTab = id;
                this.selectedHeroIds = [];
                this.initialize();
            };
            return tab;
        };

        tabsContainer.appendChild(createTab('decompose', 'DECOMPOSE', '💀'));
        tabsContainer.appendChild(createTab('reset', 'RESET LEVEL', '🔄'));
        tabsContainer.appendChild(createTab('starback', 'STAR-BACK', '⭐'));
        this.container.appendChild(tabsContainer);

        // Content Area
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            background: linear-gradient(135deg, #3d2815 0%, #5c3d25 100%);
            border: 3px solid #8b6542;
            border-top: none;
            border-radius: 0 0 15px 15px;
        `;
        this.container.appendChild(this.contentArea);

        this.render();
    }

    private render() {
        this.contentArea.innerHTML = '';

        // ACTION SECTION AT TOP (only show if heroes are selected)
        if (this.selectedHeroIds.length > 0) {
            this.renderActionSection();
        }

        // Description Box
        const descBox = document.createElement('div');
        descBox.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid #8b6542;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
        `;

        const descriptions: Record<AltarTab, { title: string; desc: string; warning?: string }> = {
            decompose: {
                title: '💀 Decompose Heroes',
                desc: `Select up to ${this.MAX_DECOMPOSE_SELECT} heroes to permanently sacrifice. You will receive Soul Potion, Hero Potion, and Hero Orbs.`,
                warning: '⚠️ This action is PERMANENT. Selected heroes will be deleted forever!'
            },
            reset: {
                title: '🔄 Reset Level',
                desc: 'Reset a hero\'s level to 1 and receive 80% of the materials spent on leveling back.',
                warning: undefined
            },
            starback: {
                title: '⭐ Star-Back',
                desc: 'Reset a hero\'s stars to 1★ and receive materials back.',
                warning: '⚠️ Sacrificed heroes used for star upgrades are NOT returned!'
            }
        };

        const info = descriptions[this.currentTab];

        const selectionInfo = this.currentTab === 'decompose' && this.selectedHeroIds.length > 0
            ? `<div style="color: #ffd700; font-size: 0.9rem; margin-top: 8px;">📦 Selected: ${this.selectedHeroIds.length}/${this.MAX_DECOMPOSE_SELECT}</div>`
            : '';

        descBox.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: bold; color: #ffd700; margin-bottom: 8px; font-family: 'SF Pro Rounded', sans-serif;">${info.title}</div>
            <div style="color: #a07850; font-size: 0.9rem; margin-bottom: 8px;">${info.desc}</div>
            ${info.warning ? `<div style="color: #ef4444; font-size: 0.85rem; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">${info.warning}</div>` : ''}
            ${selectionInfo}
        `;
        this.contentArea.appendChild(descBox);

        // Hero Grid Label
        const gridLabel = document.createElement('div');
        gridLabel.style.cssText = 'color: #a07850; font-size: 0.85rem; margin-bottom: 10px;';
        gridLabel.textContent = this.currentTab === 'decompose' ? 'Click to select heroes (multi-select):' : 'Select a hero:';
        this.contentArea.appendChild(gridLabel);

        // Hero Grid
        const heroGrid = document.createElement('div');
        heroGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 10px;
        `;

        const heroes = this.user.heroes || {};
        const heroEntries = Object.entries(heroes);
        const deployedTeam = (this.user as any).deployedTeam || [];

        if (heroEntries.length === 0) {
            const noHeroes = document.createElement('div');
            noHeroes.style.cssText = 'color: #6b7280; text-align: center; padding: 40px; grid-column: span 7;';
            noHeroes.textContent = 'No heroes available.';
            heroGrid.appendChild(noHeroes);
            this.contentArea.appendChild(heroGrid);
            return;
        }

        heroEntries.forEach(([instanceId, heroData]: [string, any]) => {
            const heroCodeName = heroData.heroCodeName || instanceId.split('_')[0];
            const heroStars = heroData.stars || 1;
            const heroLevel = heroData.level || 1;
            const heroAttr = heroData.attribute || 'STR';
            const isDeployed = deployedTeam.includes(instanceId);

            if (this.currentTab === 'reset' && heroLevel <= 1) return;
            if (this.currentTab === 'starback' && heroStars <= 1) return;

            const heroAsset = Object.values(HERO_ASSETS).find(
                (h: HeroAssetConfig) => h.name.toLowerCase().includes(heroCodeName.toLowerCase().split(' ')[0])
            );

            const isSelected = this.selectedHeroIds.includes(instanceId);

            const card = document.createElement('div');
            card.style.cssText = `
                position: relative;
                background: ${isSelected ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(139, 101, 66, 0.4))' : 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)'};
                border: 3px solid ${isSelected ? '#ffd700' : '#8b6542'};
                border-radius: 10px;
                padding: 8px;
                cursor: ${isDeployed ? 'not-allowed' : 'pointer'};
                transition: all 0.2s;
                opacity: ${isDeployed ? '0.5' : '1'};
            `;

            // Portrait
            const portrait = document.createElement('div');
            portrait.style.cssText = `
                width: 100%;
                aspect-ratio: 1;
                background: #2a2a4a;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 6px;
            `;

            let portraitPath = '';
            if (heroAsset?.sprite2D) {
                const spritePath = heroAsset.sprite2D.spritesheetPath;
                const heroFolderMatch = spritePath.match(/\/assets\/Character\/heroes\/([^\/]+)/);
                if (heroFolderMatch) {
                    const heroFolder = heroFolderMatch[1];
                    const portraitName = heroFolder.replace('_with_animation_spritesheets', '').replace('_with_anim_spritesheets', '').replace(/_/g, ' ');
                    portraitPath = `/assets/Character/heroes/${heroFolder}/portrait/${portraitName}.jpg`;
                }
            }
            if (portraitPath) {
                const img = document.createElement('img');
                img.src = portraitPath;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                portrait.appendChild(img);
            }
            card.appendChild(portrait);

            // Stars
            const starsDiv = document.createElement('div');
            starsDiv.style.cssText = 'text-align: center; margin-bottom: 2px; font-size: 0.8rem;';
            starsDiv.innerHTML = Array(heroStars).fill('<span style="color: #ffd700;">★</span>').join('');
            card.appendChild(starsDiv);

            // Name
            const nameDiv = document.createElement('div');
            nameDiv.style.cssText = 'font-size: 0.7rem; color: #f5deb3; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            nameDiv.textContent = heroCodeName;
            card.appendChild(nameDiv);

            // Level
            const levelDiv = document.createElement('div');
            levelDiv.style.cssText = 'font-size: 0.65rem; color: #a07850; text-align: center;';
            levelDiv.textContent = `Lv.${heroLevel} • ${heroAttr}`;
            card.appendChild(levelDiv);

            // Selection checkmark
            if (isSelected) {
                const checkmark = document.createElement('div');
                checkmark.style.cssText = `
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 20px;
                    height: 20px;
                    background: #22c55e;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: white;
                    font-weight: bold;
                `;
                checkmark.textContent = '✓';
                card.appendChild(checkmark);
            }

            // Deployed badge
            if (isDeployed) {
                const badge = document.createElement('div');
                badge.style.cssText = `
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    background: #ef4444;
                    color: #fff;
                    font-size: 0.5rem;
                    padding: 2px 4px;
                    border-radius: 4px;
                `;
                badge.textContent = 'DEPLOYED';
                card.appendChild(badge);
            }

            if (!isDeployed) {
                card.onmouseenter = () => {
                    if (!isSelected) card.style.borderColor = '#ffd700';
                };
                card.onmouseleave = () => {
                    if (!isSelected) card.style.borderColor = '#8b6542';
                };
                card.onclick = () => {
                    if (this.currentTab === 'decompose') {
                        const idx = this.selectedHeroIds.indexOf(instanceId);
                        if (idx >= 0) {
                            this.selectedHeroIds.splice(idx, 1);
                        } else if (this.selectedHeroIds.length < this.MAX_DECOMPOSE_SELECT) {
                            this.selectedHeroIds.push(instanceId);
                        }
                    } else {
                        if (this.selectedHeroIds.includes(instanceId)) {
                            this.selectedHeroIds = [];
                        } else {
                            this.selectedHeroIds = [instanceId];
                        }
                    }
                    this.render();
                };
            }

            heroGrid.appendChild(card);
        });

        this.contentArea.appendChild(heroGrid);
    }

    private renderActionSection() {
        const heroes = this.user.heroes as any;

        if (this.currentTab === 'decompose' && this.selectedHeroIds.length > 0) {
            let totalSoulPotion = 0;
            let totalHeroPotion = 0;
            const orbTotals: Record<string, number> = { AGI: 0, STR: 0, INT: 0 };

            this.selectedHeroIds.forEach(id => {
                const heroData = heroes[id];
                if (!heroData) return;
                const heroLevel = heroData.level || 1;
                const heroStars = heroData.stars || 1;
                const heroAttr = heroData.attribute || 'STR';

                totalSoulPotion += 50 + (heroLevel * 5);
                totalHeroPotion += 25 + (heroLevel * 2);
                orbTotals[heroAttr] += 10 * heroStars;
            });

            const actionBox = document.createElement('div');
            actionBox.style.cssText = `
                background: linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.3));
                border: 2px solid #dc2626;
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 15px;
            `;

            actionBox.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="font-size: 1.1rem; font-weight: bold; color: #ef4444; font-family: 'SF Pro Rounded', sans-serif;">💀 Decompose ${this.selectedHeroIds.length} Hero${this.selectedHeroIds.length > 1 ? 'es' : ''}</div>
                    <button id="clear-selection-btn" style="background: rgba(0,0,0,0.3); border: 1px solid #8b6542; color: #a07850; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">Clear All</button>
                </div>
                <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <img src="/assets/potions/soul-potion-icon.png" style="width: 28px; height: 28px;">
                        <span style="color: #22c55e; font-weight: bold;">+${totalSoulPotion}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <img src="/assets/potions/hero-potion-icon.png" style="width: 28px; height: 28px;">
                        <span style="color: #a855f7; font-weight: bold;">+${totalHeroPotion}</span>
                    </div>
                    ${orbTotals.AGI > 0 ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="/assets/home/scroll/hero-orb/agi.png" style="width: 28px; height: 28px;"><span style="color: #22d3ee; font-weight: bold;">+${orbTotals.AGI}</span></div>` : ''}
                    ${orbTotals.STR > 0 ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="/assets/home/scroll/hero-orb/str.png" style="width: 28px; height: 28px;"><span style="color: #ef4444; font-weight: bold;">+${orbTotals.STR}</span></div>` : ''}
                    ${orbTotals.INT > 0 ? `<div style="display: flex; align-items: center; gap: 6px;"><img src="/assets/home/scroll/hero-orb/int.png" style="width: 28px; height: 28px;"><span style="color: #8b5cf6; font-weight: bold;">+${orbTotals.INT}</span></div>` : ''}
                </div>
            `;

            const decomposeBtn = document.createElement('button');
            decomposeBtn.textContent = `💀 DECOMPOSE ${this.selectedHeroIds.length} HERO${this.selectedHeroIds.length > 1 ? 'ES' : ''}`;
            decomposeBtn.style.cssText = `
                width: 100%;
                padding: 12px;
                font-size: 1rem;
                font-weight: bold;
                color: #fff;
                background: linear-gradient(135deg, #dc2626, #991b1b);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            decomposeBtn.onmouseenter = () => { decomposeBtn.style.transform = 'scale(1.02)'; };
            decomposeBtn.onmouseleave = () => { decomposeBtn.style.transform = 'scale(1)'; };
            decomposeBtn.onclick = () => this.executeAction();

            actionBox.appendChild(decomposeBtn);
            this.contentArea.appendChild(actionBox);

            setTimeout(() => {
                const clearBtn = document.getElementById('clear-selection-btn');
                if (clearBtn) {
                    clearBtn.onclick = () => {
                        this.selectedHeroIds = [];
                        this.render();
                    };
                }
            }, 0);

        } else if (this.selectedHeroIds.length === 1) {
            const heroData = heroes[this.selectedHeroIds[0]];
            if (!heroData) return;

            const heroCodeName = heroData.heroCodeName || this.selectedHeroIds[0].split('_')[0];
            const heroStars = heroData.stars || 1;
            const heroLevel = heroData.level || 1;
            const heroAttr = heroData.attribute || 'STR';

            const actionBox = document.createElement('div');
            const bgColor = this.currentTab === 'reset' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(245, 158, 11, 0.2)';
            const borderColor = this.currentTab === 'reset' ? '#2563eb' : '#f59e0b';

            actionBox.style.cssText = `
                background: linear-gradient(135deg, ${bgColor}, ${bgColor});
                border: 2px solid ${borderColor};
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 15px;
            `;

            let rewardsHtml = '';
            if (this.currentTab === 'reset') {
                let totalGoldSpent = 0;
                let totalSoulPotionSpent = 0;
                for (let lvl = 1; lvl < heroLevel; lvl++) {
                    totalGoldSpent += 100 * lvl;
                    totalSoulPotionSpent += 50;
                }
                const goldReturn = Math.floor(totalGoldSpent * 0.8);
                const soulPotionReturn = Math.floor(totalSoulPotionSpent * 0.8);

                rewardsHtml = `
                    <div style="display: flex; gap: 15px; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <img src="/assets/potions/coin-icon.png" style="width: 28px; height: 28px;">
                            <span style="color: #ffd700; font-weight: bold;">+${goldReturn.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <img src="/assets/potions/soul-potion-icon.png" style="width: 28px; height: 28px;">
                            <span style="color: #22c55e; font-weight: bold;">+${soulPotionReturn}</span>
                        </div>
                    </div>
                `;
            } else if (this.currentTab === 'starback') {
                const goldReturn = (heroStars - 1) * 1000;
                const heroPotionReturn = (heroStars - 1) * 50;

                rewardsHtml = `
                    <div style="display: flex; gap: 15px; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <img src="/assets/potions/coin-icon.png" style="width: 28px; height: 28px;">
                            <span style="color: #ffd700; font-weight: bold;">+${goldReturn.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <img src="/assets/potions/hero-potion-icon.png" style="width: 28px; height: 28px;">
                            <span style="color: #a855f7; font-weight: bold;">+${heroPotionReturn}</span>
                        </div>
                    </div>
                `;
            }

            const icon = this.currentTab === 'reset' ? '🔄' : '⭐';
            const btnLabel = this.currentTab === 'reset' ? '🔄 RESET LEVEL' : '⭐ STAR-BACK';
            const btnBg = this.currentTab === 'reset' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'linear-gradient(135deg, #f59e0b, #d97706)';

            actionBox.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <span style="font-size: 1.5rem;">${icon}</span>
                    <div>
                        <div style="font-size: 1rem; font-weight: bold; color: #f5deb3;">${heroCodeName}</div>
                        <div style="font-size: 0.85rem; color: #a07850;">${'★'.repeat(heroStars)} • Level ${heroLevel} • ${heroAttr}</div>
                    </div>
                </div>
                ${rewardsHtml}
            `;

            const actionBtn = document.createElement('button');
            actionBtn.textContent = btnLabel;
            actionBtn.style.cssText = `
                width: 100%;
                padding: 12px;
                font-size: 1rem;
                font-weight: bold;
                color: #fff;
                background: ${btnBg};
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            actionBtn.onmouseenter = () => { actionBtn.style.transform = 'scale(1.02)'; };
            actionBtn.onmouseleave = () => { actionBtn.style.transform = 'scale(1)'; };
            actionBtn.onclick = () => this.executeAction();

            actionBox.appendChild(actionBtn);
            this.contentArea.appendChild(actionBox);
        }
    }

    private async executeAction() {
        if (this.selectedHeroIds.length === 0) return;

        const commanderName = this.user.commanderName;

        if (this.currentTab === 'decompose') {
            const count = this.selectedHeroIds.length;
            if (!confirm(`Are you sure you want to PERMANENTLY decompose ${count} hero${count > 1 ? 'es' : ''}? This action cannot be undone!`)) return;

            try {
                const res = await fetch('http://localhost:3000/api/altar/decompose-bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        commanderName,
                        instanceIds: this.selectedHeroIds
                    })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    this.user = data.user;
                    this.onUpdate(data.user);
                    localStorage.setItem('awengers_session', JSON.stringify(data.user));

                    alert(`Decomposed ${data.count} heroes! Received ${data.totalRewards?.soulPotion} Soul Potion, ${data.totalRewards?.heroPotion} Hero Potion, and Hero Orbs.`);

                    this.selectedHeroIds = [];
                    this.initialize();
                } else {
                    alert(data.message || 'Decompose failed');
                }
            } catch (error) {
                console.error('Bulk decompose error:', error);
                alert('Network error');
            }
        } else {
            const endpoint = this.currentTab === 'reset' ? 'reset' : 'star-back';
            const confirmMsg = this.currentTab === 'reset'
                ? 'Are you sure you want to reset this hero\'s level to 1?'
                : 'Are you sure you want to reset this hero\'s stars to 1★? Sacrificed heroes will NOT be returned!';

            if (!confirm(confirmMsg)) return;

            try {
                const res = await fetch(`http://localhost:3000/api/altar/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        commanderName,
                        instanceId: this.selectedHeroIds[0]
                    })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    this.user = data.user;
                    this.onUpdate(data.user);
                    localStorage.setItem('awengers_session', JSON.stringify(data.user));

                    const msg = this.currentTab === 'reset'
                        ? `Hero reset to Level 1! Received ${data.returned?.gold} Gold, ${data.returned?.soulPotion} Soul Potion`
                        : `Hero reset to 1★! Received ${data.returned?.gold} Gold, ${data.returned?.heroPotion} Hero Potion`;
                    alert(msg);

                    this.selectedHeroIds = [];
                    this.initialize();
                } else {
                    alert(data.message || 'Action failed');
                }
            } catch (error) {
                console.error('Altar action error:', error);
                alert('Network error');
            }
        }
    }

    getElement(): HTMLElement {
        return this.container;
    }

    updateUser(user: UserProfile) {
        this.user = user;
        this.render();
    }
}
