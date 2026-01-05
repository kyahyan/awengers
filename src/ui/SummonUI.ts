import { UserProfile } from '../data/UserProfile';
import { HeroDef } from '../data/HeroDefinitions';
import { ModalWrapper } from './ModalWrapper';
import { HERO_ASSETS } from '../data/HeroAssetsMap';

export class SummonUI {
    private modal: ModalWrapper;
    private user: UserProfile | null = null;
    private isAnimating: boolean = false;
    private cardImg!: HTMLImageElement;
    private resultOverlay!: HTMLElement;
    private onUpdate?: (user: UserProfile) => void;
    private summonBtnX1!: HTMLElement;
    private summonBtnX10!: HTMLElement;
    private currentTab: 'scroll' | 'orb' = 'scroll';
    private scrollContent!: HTMLElement;
    private orbContent!: HTMLElement;

    constructor(onClose: () => void, onUpdate?: (user: UserProfile) => void) {
        this.onUpdate = onUpdate;
        const session = localStorage.getItem('awengers_session');
        if (session) {
            this.user = JSON.parse(session);
        }

        this.modal = new ModalWrapper('SUMMON', onClose, '70%', '85%');
        this.initialize();
    }

    private initialize() {
        const content = this.modal.getContentArea();
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.alignItems = 'center';
        content.style.position = 'relative';
        content.style.overflow = 'hidden';
        content.style.padding = '0';

        // Tab Bar
        const tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display: flex;
            gap: 10px;
            padding: 15px 20px;
            width: 100%;
            border-bottom: 2px solid rgba(255,255,255,0.1);
            box-sizing: border-box;
        `;

        const createTab = (id: 'scroll' | 'orb', label: string, icon: string) => {
            const tab = document.createElement('button');
            tab.innerHTML = `${icon} ${label}`;
            tab.style.cssText = `
                padding: 12px 30px;
                border: none;
                cursor: pointer;
                font-weight: bold;
                font-size: 1rem;
                font-family: 'SF Pro Rounded', sans-serif;
                transition: all 0.2s;
                border-radius: 8px;
                background: ${this.currentTab === id ? 'linear-gradient(45deg, #ffd700, #ffa500)' : 'rgba(255,255,255,0.05)'};
                color: ${this.currentTab === id ? '#000' : '#aaa'};
            `;
            tab.onclick = () => {
                this.currentTab = id;
                this.renderCurrentTab();
                // Update tab styles
                tabBar.querySelectorAll('button').forEach((btn, idx) => {
                    const tabId = idx === 0 ? 'scroll' : 'orb';
                    (btn as HTMLButtonElement).style.background = tabId === this.currentTab ? 'linear-gradient(45deg, #ffd700, #ffa500)' : 'rgba(255,255,255,0.05)';
                    (btn as HTMLButtonElement).style.color = tabId === this.currentTab ? '#000' : '#aaa';
                });
            };
            return tab;
        };

        tabBar.appendChild(createTab('scroll', 'SCROLL SUMMON', '📜'));
        tabBar.appendChild(createTab('orb', 'ORB SUMMON', '🔮'));
        content.appendChild(tabBar);

        // Content Container (holds both scroll and orb content)
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            flex: 1;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
        `;

        // Scroll Summon Content
        this.scrollContent = document.createElement('div');
        this.scrollContent.style.cssText = `
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        `;
        this.initializeScrollContent();
        contentContainer.appendChild(this.scrollContent);

        // Orb Summon Content
        this.orbContent = document.createElement('div');
        this.orbContent.style.cssText = `
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        `;
        this.initializeOrbContent();
        contentContainer.appendChild(this.orbContent);

        content.appendChild(contentContainer);

        // Result Overlay (Hidden initially)
        this.createResultOverlay(content);
    }

    private renderCurrentTab() {
        if (this.currentTab === 'scroll') {
            this.scrollContent.style.display = 'flex';
            this.orbContent.style.display = 'none';
        } else {
            this.scrollContent.style.display = 'none';
            this.orbContent.style.display = 'flex';
            this.refreshOrbContent();
        }
    }

    private initializeScrollContent() {
        // The Summon "Scroll" Image
        this.cardImg = document.createElement('img');
        this.cardImg.src = '/assets/home/scroll/grand-summon.png';
        this.cardImg.style.maxHeight = '50%';
        this.cardImg.style.maxWidth = '60%';
        this.cardImg.style.objectFit = 'contain';
        this.cardImg.style.cursor = 'pointer';
        this.cardImg.style.transition = 'transform 0.2s, filter 0.2s';
        this.cardImg.style.filter = 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))';

        this.cardImg.onmouseover = () => {
            if (!this.isAnimating) {
                this.cardImg.style.transform = 'scale(1.05)';
                this.cardImg.style.filter = 'drop-shadow(0 0 25px gold)';
            }
        };
        this.cardImg.onmouseout = () => {
            if (!this.isAnimating) {
                this.cardImg.style.transform = 'scale(1)';
                this.cardImg.style.filter = 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))';
            }
        };

        this.cardImg.onclick = () => {
            this.performSummon();
        };

        this.scrollContent.appendChild(this.cardImg);

        // Scroll Count Display
        const scrollCountDisplay = document.createElement('div');
        scrollCountDisplay.id = 'scroll-count-display';
        scrollCountDisplay.style.marginTop = '15px';
        scrollCountDisplay.style.color = '#ffd700';
        scrollCountDisplay.style.fontSize = '1.2rem';
        scrollCountDisplay.style.fontWeight = 'bold';
        scrollCountDisplay.style.fontFamily = "'SF Pro Rounded', sans-serif";
        scrollCountDisplay.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
        this.updateScrollCountDisplay(scrollCountDisplay);
        this.scrollContent.appendChild(scrollCountDisplay);

        // Button Container
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '20px';
        btnContainer.style.marginTop = '25px';

        // Summon x1 Button
        this.summonBtnX1 = document.createElement('div');
        this.summonBtnX1.innerText = "Summon x1";
        const scrollCount = this.user?.inventory?.['grand_summon'] || 0;
        this.applyButtonStyle(this.summonBtnX1, scrollCount < 1);

        this.summonBtnX1.onclick = () => {
            if ((this.user?.inventory?.['grand_summon'] || 0) < 1) {
                alert("Not enough Grand Summon Scrolls!");
                return;
            }
            this.performSummon();
        };

        btnContainer.appendChild(this.summonBtnX1);

        // Summon x10 Button
        this.summonBtnX10 = document.createElement('div');
        this.summonBtnX10.innerText = "Summon x10";
        this.applyButtonStyle(this.summonBtnX10, scrollCount < 10);

        this.summonBtnX10.onclick = () => {
            if ((this.user?.inventory?.['grand_summon'] || 0) < 10) {
                alert("Not enough Grand Summon Scrolls! Need at least 10.");
                return;
            }
            this.performMultiSummon();
        };

        btnContainer.appendChild(this.summonBtnX10);
        this.scrollContent.appendChild(btnContainer);
    }

    private initializeOrbContent() {
        // Will be populated by refreshOrbContent
    }

    private refreshOrbContent() {
        this.orbContent.innerHTML = '';

        const session = localStorage.getItem('awengers_session');
        if (session) {
            this.user = JSON.parse(session);
        }

        const userAny = this.user as any;
        const orbs = [
            { id: 'AGI', name: 'Agility Orb', count: userAny?.agiOrb || 0, color: '#22d3ee', icon: '/assets/home/scroll/hero-orb/agi.png' },
            { id: 'STR', name: 'Strength Orb', count: userAny?.strOrb || 0, color: '#ef4444', icon: '/assets/home/scroll/hero-orb/str.png' },
            { id: 'INT', name: 'Intelligence Orb', count: userAny?.intOrb || 0, color: '#8b5cf6', icon: '/assets/home/scroll/hero-orb/int.png' }
        ];

        // Title
        const title = document.createElement('div');
        title.innerHTML = '🔮 Orb Summon';
        title.style.cssText = `
            font-size: 1.5rem;
            font-weight: bold;
            color: #ffd700;
            font-family: 'SF Pro Rounded', sans-serif;
            margin-bottom: 10px;
        `;
        this.orbContent.appendChild(title);

        const desc = document.createElement('div');
        desc.innerHTML = 'Spend 100 orbs to summon a hero of that attribute type.';
        desc.style.cssText = `
            color: #9ca3af;
            font-size: 0.9rem;
            margin-bottom: 30px;
        `;
        this.orbContent.appendChild(desc);

        // Orb Cards Grid
        const orbGrid = document.createElement('div');
        orbGrid.style.cssText = `
            display: flex;
            gap: 30px;
            justify-content: center;
        `;

        orbs.forEach(orb => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));
                border: 3px solid ${orb.color}40;
                border-radius: 20px;
                padding: 30px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                transition: all 0.3s;
                width: 180px;
            `;
            card.onmouseenter = () => {
                card.style.borderColor = orb.color;
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = `0 10px 30px ${orb.color}40`;
            };
            card.onmouseleave = () => {
                card.style.borderColor = `${orb.color}40`;
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
            };

            // Icon
            const icon = document.createElement('img');
            icon.src = orb.icon;
            icon.style.cssText = `
                width: 80px;
                height: 80px;
                object-fit: contain;
                filter: drop-shadow(0 0 20px ${orb.color}60);
            `;
            card.appendChild(icon);

            // Name
            const name = document.createElement('div');
            name.innerText = orb.name;
            name.style.cssText = `
                font-size: 1rem;
                font-weight: bold;
                color: ${orb.color};
                font-family: 'SF Pro Rounded', sans-serif;
            `;
            card.appendChild(name);

            // Count
            const count = document.createElement('div');
            count.innerHTML = `<span style="font-size: 2rem; font-weight: bold; color: #fff;">${orb.count}</span><span style="color: #9ca3af;"> / 100</span>`;
            card.appendChild(count);

            // Progress bar
            const progressBg = document.createElement('div');
            progressBg.style.cssText = `
                width: 100%;
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                overflow: hidden;
            `;
            const progressFill = document.createElement('div');
            const progress = Math.min(100, (orb.count / 100) * 100);
            progressFill.style.cssText = `
                width: ${progress}%;
                height: 100%;
                background: ${orb.color};
                border-radius: 3px;
            `;
            progressBg.appendChild(progressFill);
            card.appendChild(progressBg);

            // Summon Button
            const summonBtn = document.createElement('button');
            const canSummon = orb.count >= 100;
            summonBtn.innerText = canSummon ? '✨ SUMMON' : 'Need 100 Orbs';
            summonBtn.style.cssText = `
                margin-top: 10px;
                padding: 12px 25px;
                background: ${canSummon ? `linear-gradient(135deg, ${orb.color}, ${orb.color}aa)` : 'rgba(100,100,100,0.3)'};
                border: none;
                border-radius: 25px;
                color: ${canSummon ? 'white' : '#666'};
                font-weight: bold;
                font-size: 0.9rem;
                cursor: ${canSummon ? 'pointer' : 'not-allowed'};
                transition: transform 0.2s;
            `;
            if (canSummon) {
                summonBtn.onmouseenter = () => { summonBtn.style.transform = 'scale(1.05)'; };
                summonBtn.onmouseleave = () => { summonBtn.style.transform = 'scale(1)'; };
                summonBtn.onclick = () => this.performOrbSummon(orb.id);
            }
            card.appendChild(summonBtn);

            orbGrid.appendChild(card);
        });

        this.orbContent.appendChild(orbGrid);
    }

    private async performOrbSummon(orbType: string) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        try {
            const res = await fetch('http://localhost:3000/api/altar/orb-summon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commanderName: this.user?.commanderName,
                    orbType: orbType
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                this.user = data.user;
                localStorage.setItem('awengers_session', JSON.stringify(this.user));
                if (this.user && this.onUpdate) {
                    this.onUpdate(this.user);
                }

                // Show the summoned hero
                this.revealHero(data.hero);
                this.refreshOrbContent();
            } else {
                alert(data.message || 'Summon failed');
                this.isAnimating = false;
            }
        } catch (error) {
            console.error('Orb summon error:', error);
            alert('Network error');
            this.isAnimating = false;
        }
    }

    private applyButtonStyle(btn: HTMLElement, isDisabled: boolean) {
        btn.style.padding = '15px 40px';
        btn.style.border = '3px solid #fff';
        btn.style.borderRadius = '35px';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '1.2rem';
        btn.style.transition = 'transform 0.2s, box-shadow 0.2s, filter 0.2s';
        btn.style.fontFamily = "'SF Pro Rounded', sans-serif";

        if (isDisabled) {
            btn.style.background = 'linear-gradient(45deg, #666, #444)';
            btn.style.color = '#888';
            btn.style.cursor = 'not-allowed';
            btn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            btn.style.filter = 'grayscale(0.5)';
            btn.onmouseover = null;
            btn.onmouseout = null;
        } else {
            btn.style.background = 'linear-gradient(45deg, #ffd700, #ffa500)';
            btn.style.color = '#000';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = '0 5px 20px rgba(255, 215, 0, 0.4)';
            btn.style.filter = 'none';
            btn.onmouseover = () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.6)';
            };
            btn.onmouseout = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 5px 20px rgba(255, 215, 0, 0.4)';
            };
        }
    }

    private updateButtonStates() {
        // Guard: buttons may not exist yet during initialization
        if (!this.summonBtnX1 || !this.summonBtnX10) return;

        const scrollCount = this.user?.inventory?.['grand_summon'] || 0;
        this.applyButtonStyle(this.summonBtnX1, scrollCount < 1);
        this.applyButtonStyle(this.summonBtnX10, scrollCount < 10);
    }

    private updateScrollCountDisplay(el?: HTMLElement) {
        const display = el || this.modal.getContentArea().querySelector('#scroll-count-display') as HTMLElement;
        if (display && this.user) {
            const count = this.user.inventory?.['grand_summon'] || 0;
            display.innerText = `Grand Summon Scrolls: ${count}`;
        }
        // Also update button states when scroll count changes
        this.updateButtonStates();
    }

    private createResultOverlay(parent: HTMLElement) {
        this.resultOverlay = document.createElement('div');
        this.resultOverlay.style.position = 'absolute';
        this.resultOverlay.style.top = '0';
        this.resultOverlay.style.left = '0';
        this.resultOverlay.style.width = '100%';
        this.resultOverlay.style.height = '100%';
        this.resultOverlay.style.backgroundColor = 'rgba(0,0,0,0.95)';
        this.resultOverlay.style.display = 'none';
        this.resultOverlay.style.flexDirection = 'column';
        this.resultOverlay.style.justifyContent = 'center';
        this.resultOverlay.style.alignItems = 'center';
        this.resultOverlay.style.zIndex = '10';
        // this.resultOverlay.style.borderRadius = '15px'; // Removed to cover full modal

        // Removed inner onclick that closes it -> Now closing will be handled by a "Continue" button or end of flow
        // But we can keep it as a fallback if needed, though for flip animation we want control.
        // For now, let's allow clicking outside the cards to do nothing or maybe just consume clicks.
        parent.appendChild(this.resultOverlay);
    }

    private async performSummon() {
        if (this.isAnimating) return;

        const session = localStorage.getItem('awengers_session');
        if (session) {
            this.user = JSON.parse(session);
        }

        if (!this.user) return;

        // Optimistic check (Server handles real check)
        const inventory = this.user.inventory || {};
        const count = inventory['grand_summon'] || 0;
        if (count < 1) {
            alert("Not enough Grand Summon Scrolls! Buy more from the Shop.");
            return;
        }

        this.isAnimating = true;

        try {
            const res = await fetch('http://localhost:3000/api/summon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commanderName: this.user.commanderName })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.message || "Summon Failed");
                this.isAnimating = false;
                return;
            }

            const data = await res.json();
            const { hero, user } = data;

            // Sync local user
            this.user = user;
            localStorage.setItem('awengers_session', JSON.stringify(this.user));
            if (this.user && this.onUpdate) {
                this.onUpdate(this.user);
            }

            // Update scroll count display immediately
            this.updateScrollCountDisplay();

            // Animate Shake
            let startTime = Date.now();
            const shakeInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                if (elapsed > 800) {
                    clearInterval(shakeInterval);
                    this.cardImg.style.transform = 'scale(1)';
                    this.cardImg.style.filter = 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))';
                    this.revealHero(hero);
                } else {
                    const offsetX = (Math.random() - 0.5) * 20;
                    const offsetY = (Math.random() - 0.5) * 20;
                    this.cardImg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1.1)`;
                    this.cardImg.style.filter = `brightness(${1 + elapsed / 500})`;
                }
            }, 50);

        } catch (e) {
            console.error("Summon API Error:", e);
            alert("Connection Error");
            this.isAnimating = false;
        }
    }

    private async performMultiSummon() {
        if (this.isAnimating) return;

        const session = localStorage.getItem('awengers_session');
        if (session) {
            this.user = JSON.parse(session);
        }

        if (!this.user) return;

        const inventory = this.user.inventory || {};
        const count = inventory['grand_summon'] || 0;
        if (count < 10) {
            alert(`Not enough Grand Summon Scrolls! Need 10, have ${count}.`);
            return;
        }

        this.isAnimating = true;
        const summonedHeroes: HeroDef[] = [];

        try {
            // Perform 10 summons
            for (let i = 0; i < 10; i++) {
                const res = await fetch('http://localhost:3000/api/summon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commanderName: this.user.commanderName })
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(err.message || "Summon Failed");
                    this.isAnimating = false;
                    return;
                }

                const data = await res.json();
                summonedHeroes.push(data.hero);
                this.user = data.user;
            }

            // Sync local user
            localStorage.setItem('awengers_session', JSON.stringify(this.user));
            if (this.user && this.onUpdate) {
                this.onUpdate(this.user);
            }

            // Update scroll count display immediately
            this.updateScrollCountDisplay();

            // Show all heroes
            this.revealMultipleHeroes(summonedHeroes);

        } catch (e) {
            console.error("Multi-Summon API Error:", e);
            alert("Connection Error");
            this.isAnimating = false;
        }
    }

    private getHeroPortraitUrl(heroName: string): string {
        const asset = HERO_ASSETS.find(a => a.name === heroName);
        if (asset && asset.sprite2D) {
            const spritePath = asset.sprite2D.spritesheetPath;
            // e.g. /assets/Character/heroes/antelope_mage_with_animation_spritesheets/side-left/idle.png
            const heroFolderMatch = spritePath.match(/\/assets\/Character\/heroes\/([^\/]+)/);
            if (heroFolderMatch) {
                const heroFolder = heroFolderMatch[1];
                const portraitName = heroFolder.replace('_with_animation_spritesheets', '').replace(/_/g, ' ');
                return `/assets/Character/heroes/${heroFolder}/portrait/${portraitName}.jpg`;
            }
        }
        return ''; // Fallback
    }

    private createFlipCard(hero: HeroDef, size: 'small' | 'large' = 'small'): HTMLElement {
        const width = size === 'large' ? '300px' : '180px';
        const height = size === 'large' ? '440px' : '260px';

        const scene = document.createElement('div');
        scene.style.width = width;
        scene.style.height = height;
        scene.style.perspective = '1000px';
        scene.style.cursor = 'pointer';

        const card = document.createElement('div');
        card.className = 'summon-flip-card';
        card.style.width = '100%';
        card.style.height = '100%';
        card.style.position = 'relative';
        card.style.transformStyle = 'preserve-3d';
        card.style.transition = 'transform 0.6s';

        // Card Front (The Hero Result) - initially hidden by rotation
        const cardFront = document.createElement('div');
        cardFront.style.position = 'absolute';
        cardFront.style.width = '100%';
        cardFront.style.height = '100%';
        cardFront.style.backfaceVisibility = 'hidden';
        cardFront.style.transform = 'rotateY(180deg)'; // Back of the card relative to initial state
        cardFront.style.borderRadius = '18px'; // Slightly rounded corners for the whole card
        cardFront.style.overflow = 'hidden'; // Clip portrait to border

        // Build card front visual
        const cardFrontImg = document.createElement('img');
        cardFrontImg.src = '/assets/summon/summon-book/card-front.png';
        cardFrontImg.style.width = '100%';
        cardFrontImg.style.height = '100%';
        cardFrontImg.style.objectFit = 'contain';
        cardFrontImg.style.position = 'absolute';
        cardFrontImg.style.top = '0';
        cardFrontImg.style.left = '0';
        cardFrontImg.style.zIndex = '2'; // Frame

        // Portrait
        const portraitUrl = this.getHeroPortraitUrl(hero.codeName || hero.name);
        const portrait = document.createElement('div');
        portrait.style.position = 'absolute';
        portrait.style.top = '50%';
        portrait.style.left = '50%';
        portrait.style.transform = 'translate(-50%, -50%)';
        portrait.style.width = '60%';
        portrait.style.height = '60%';
        portrait.style.backgroundImage = `url('${portraitUrl}')`;
        portrait.style.backgroundSize = 'cover';
        portrait.style.backgroundPosition = 'center';
        portrait.style.zIndex = '1'; // Behind frame

        // Glowing border based on rarity
        const glowColor = hero.rarity === 'Mythic' ? '#ff4444' : (hero.rarity === 'Legendary' ? '#ffd700' : '#4facfe');
        if (hero.rarity !== 'Standard') {
            cardFront.style.boxShadow = `0 0 20px ${glowColor}`;
        }

        // Info (Stars/Name) - Overlay on top of frame
        const info = document.createElement('div');
        info.style.position = 'absolute';
        info.style.bottom = '8%';
        info.style.width = '100%';
        info.style.textAlign = 'center';
        info.style.zIndex = '3';

        const stars = document.createElement('div');
        stars.innerHTML = '⭐'.repeat(1);
        if (hero.rarity === 'Mythic') stars.innerHTML = '⭐⭐⭐⭐⭐';
        else if (hero.rarity === 'Legendary') stars.innerHTML = '⭐⭐⭐⭐';
        else stars.innerHTML = '⭐';

        const name = document.createElement('div');
        name.innerText = hero.name;
        name.style.color = '#fff';
        name.style.fontWeight = 'bold';
        name.style.fontSize = size === 'large' ? '1.5rem' : '0.9rem';
        name.style.textShadow = '0 2px 4px #000';
        name.style.marginTop = '4px';
        name.style.fontFamily = "'SF Pro Rounded', sans-serif";

        info.appendChild(stars);
        info.appendChild(name);

        cardFront.appendChild(portrait);
        cardFront.appendChild(cardFrontImg);
        cardFront.appendChild(info);

        // Card Back
        const cardBack = document.createElement('div');
        cardBack.style.position = 'absolute';
        cardBack.style.width = '100%';
        cardBack.style.height = '100%';
        cardBack.style.backfaceVisibility = 'hidden';
        cardBack.style.transform = 'rotateY(0deg)';
        cardBack.style.borderRadius = '18px';
        cardBack.style.overflow = 'hidden';

        const cardBackImg = document.createElement('img');
        cardBackImg.src = '/assets/summon/summon-book/card-back.png';
        cardBackImg.style.width = '100%';
        cardBackImg.style.height = '100%';
        cardBackImg.style.objectFit = 'contain';

        cardBack.appendChild(cardBackImg);

        card.appendChild(cardFront); // Added first but rotated
        card.appendChild(cardBack);  // Added second, visible
        scene.appendChild(card);

        // Click to flip
        scene.onclick = () => {
            if (!card.classList.contains('flipped')) {
                card.classList.add('flipped');
                card.style.transform = 'rotateY(180deg)';

                // If mythic, add extra effect?
                if (hero.rarity === 'Mythic') {
                    // trigger flash?
                }
            }
        };

        return scene;
    }

    private revealHero(hero: HeroDef) {
        this.resultOverlay.innerHTML = '';
        this.resultOverlay.style.display = 'flex';
        this.resultOverlay.style.background = 'rgba(0,0,0,0.95)';

        const scene = this.createFlipCard(hero, 'large');

        // Center Container
        const center = document.createElement('div');
        center.style.display = 'flex';
        center.style.flexDirection = 'column';
        center.style.alignItems = 'center';
        center.style.gap = '30px';

        center.appendChild(scene);

        // Continue Button (Only appears after flip? or always?)
        // Let's make it appear after a short delay or always there but maybe 'Tap card to reveal' hint
        const hint = document.createElement('div');
        hint.innerText = "Tap card to reveal!";
        hint.style.color = '#ccc';
        hint.style.fontSize = '1.2rem';
        hint.style.animation = 'pulse 1s infinite alternate';

        // Add minimal styles
        const style = document.createElement('style');
        style.innerText = `
            @keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }
        `;
        this.resultOverlay.appendChild(style);

        center.appendChild(hint);

        // Close/Continue Button
        const closeBtn = document.createElement('button');
        closeBtn.innerText = "Close";
        closeBtn.style.padding = '10px 30px';
        closeBtn.style.background = '#333';
        closeBtn.style.color = '#fff';
        closeBtn.style.border = '2px solid #555';
        closeBtn.style.borderRadius = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.marginTop = '20px';
        closeBtn.style.display = 'none'; // Hidden until flipped

        closeBtn.onclick = () => {
            this.resultOverlay.style.display = 'none';
            this.isAnimating = false;
        };
        center.appendChild(closeBtn);

        // Hook into click to show button
        const originalClick = (scene as any).onclick;
        scene.onclick = (e) => {
            if (originalClick) originalClick(e);
            hint.style.display = 'none';
            closeBtn.style.display = 'block';
        };

        this.resultOverlay.appendChild(center);
    }

    private revealMultipleHeroes(heroes: HeroDef[]) {
        this.resultOverlay.innerHTML = '';
        this.resultOverlay.style.display = 'flex';
        this.resultOverlay.style.flexDirection = 'column';
        this.resultOverlay.style.background = 'rgba(0,0,0,0.95)';

        // Title
        const title = document.createElement('div');
        title.innerText = '🎉 SUMMON RESULTS 🎉';
        title.style.color = '#ffd700';
        title.style.fontSize = '2rem';
        title.style.fontWeight = 'bold';
        title.style.marginTop = '100px'; // Added margin top
        title.style.marginBottom = '20px';
        title.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.resultOverlay.appendChild(title);

        // Grid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
        grid.style.gap = '20px';
        grid.style.perspective = '1000px';

        const cardScenes: HTMLElement[] = [];

        heroes.forEach(hero => {
            const scene = this.createFlipCard(hero, 'small');
            grid.appendChild(scene);
            cardScenes.push(scene);
        });

        this.resultOverlay.appendChild(grid);

        // Animate spread from center
        requestAnimationFrame(() => {
            const gridRect = grid.getBoundingClientRect();
            const cx = gridRect.left + gridRect.width / 2;
            const cy = gridRect.top + gridRect.height / 2;

            const diffs = cardScenes.map(scene => {
                const r = scene.getBoundingClientRect();
                return {
                    x: cx - (r.left + r.width / 2),
                    y: cy - (r.top + r.height / 2)
                };
            });

            // Apply initial state (center and small)
            cardScenes.forEach((scene, i) => {
                scene.style.transition = 'none';
                scene.style.transform = `translate(${diffs[i].x}px, ${diffs[i].y}px) scale(0)`;
            });

            // Trigger reflow to apply initial state
            void this.resultOverlay.offsetWidth;

            // Animate to final state
            cardScenes.forEach(scene => {
                // Add staggered delay based on distance to center or index?
                // User asked "synchronize", implying all at once or maybe organized.
                // "spread cards from the center to there location synchronize" -> Synchronized spread usually means all start together.
                scene.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
                scene.style.transform = '';
            });
        });

        // Controls Area
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '20px';
        controls.style.marginTop = '30px';
        controls.style.marginBottom = '30px'; // Added margin bottom

        // Skip Button
        const skipBtn = document.createElement('button');
        skipBtn.innerText = "SKIP (Flip All)";
        skipBtn.style.padding = '12px 30px';
        skipBtn.style.background = 'linear-gradient(45deg, #ff9966, #ff5e62)';
        skipBtn.style.border = 'none';
        skipBtn.style.borderRadius = '25px';
        skipBtn.style.color = 'white';
        skipBtn.style.fontWeight = 'bold';
        skipBtn.style.fontSize = '1rem';
        skipBtn.style.cursor = 'pointer';
        skipBtn.style.boxShadow = '0 4px 15px rgba(255, 94, 98, 0.4)';

        skipBtn.onclick = () => {
            cardScenes.forEach(scene => {
                const card = scene.querySelector('.summon-flip-card') as HTMLElement;
                if (card && !card.classList.contains('flipped')) {
                    card.classList.add('flipped');
                    card.style.transform = 'rotateY(180deg)';
                }
            });
            skipBtn.style.display = 'none';
            closeBtn.style.display = 'block';
        };

        // Close Button (Hidden initially)
        const closeBtn = document.createElement('button');
        closeBtn.innerText = "Continue";
        closeBtn.style.padding = '12px 30px';
        closeBtn.style.background = 'linear-gradient(45deg, #56ab2f, #a8e063)';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '25px';
        closeBtn.style.color = 'white';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.fontSize = '1rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.boxShadow = '0 4px 15px rgba(86, 171, 47, 0.4)';

        closeBtn.onclick = () => {
            this.resultOverlay.style.display = 'none';
            this.isAnimating = false;
            this.updateScrollCountDisplay();
        };

        // Add tracking to manual flips
        let flippedCount = 0;
        cardScenes.forEach(scene => {
            const originalClick = (scene as any).onclick;
            scene.onclick = (e) => {
                const card = scene.querySelector('.summon-flip-card') as HTMLElement;
                if (!card.classList.contains('flipped')) {
                    // Will flip in original handler
                    flippedCount++;
                }
                if (originalClick) originalClick(e);

                if (flippedCount === heroes.length) {
                    skipBtn.style.display = 'none';
                    closeBtn.style.display = 'block';
                }
            };
        });

        // Let's start with Skip visible, Close hidden.
        closeBtn.style.display = 'none';

        controls.appendChild(skipBtn);
        controls.appendChild(closeBtn);
        this.resultOverlay.appendChild(controls);
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public close() {
        this.modal.close();
    }
}
