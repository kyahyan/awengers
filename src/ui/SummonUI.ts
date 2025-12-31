
// import { SummonSystem } from '../systems/SummonSystem'; // Removed
import { UserProfile } from '../data/UserProfile';
import { HeroDef } from '../data/HeroDefinitions';
import { ModalWrapper } from './ModalWrapper';

export class SummonUI {
    private modal: ModalWrapper;
    private user: UserProfile | null = null;
    private isAnimating: boolean = false;
    private cardImg!: HTMLImageElement;
    private resultOverlay!: HTMLElement;
    private onUpdate?: (user: UserProfile) => void;
    private summonBtnX1!: HTMLElement;
    private summonBtnX10!: HTMLElement;

    constructor(onClose: () => void, onUpdate?: (user: UserProfile) => void) {
        this.onUpdate = onUpdate;
        const session = localStorage.getItem('awengers_session');
        if (session) {
            this.user = JSON.parse(session);
        }

        this.modal = new ModalWrapper('SUMMON', onClose, '70%', '70%');
        this.initialize();
    }

    private initialize() {
        const content = this.modal.getContentArea();
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.justifyContent = 'center';
        content.style.alignItems = 'center';
        content.style.position = 'relative';
        content.style.overflow = 'hidden';

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

        content.appendChild(this.cardImg);

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
        content.appendChild(scrollCountDisplay);

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

        content.appendChild(btnContainer);

        // Result Overlay (Hidden initially)
        this.createResultOverlay(content);
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
        this.resultOverlay.style.borderRadius = '15px';
        this.resultOverlay.onclick = () => {
            this.resultOverlay.style.display = 'none';
            this.isAnimating = false;
            this.updateScrollCountDisplay();
        };
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

    private revealHero(hero: HeroDef) {
        const glowColor = hero.rarity === 'Mythic' ? '#ff4444' : '#4facfe';

        this.resultOverlay.innerHTML = '';

        const style = document.createElement('style');
        style.innerText = `
            @keyframes popIn {
                0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 30px ${glowColor}; }
                50% { box-shadow: 0 0 60px ${glowColor}, 0 0 80px ${glowColor}; }
            }
        `;
        this.resultOverlay.appendChild(style);

        const cardContainer = document.createElement('div');
        cardContainer.style.position = 'relative';
        cardContainer.style.width = '280px';
        cardContainer.style.height = '380px';
        cardContainer.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), glow 2s ease-in-out infinite';
        cardContainer.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
        cardContainer.style.borderRadius = '20px';
        cardContainer.style.border = `4px solid ${glowColor}`;
        cardContainer.style.display = 'flex';
        cardContainer.style.flexDirection = 'column';
        cardContainer.style.alignItems = 'center';
        cardContainer.style.justifyContent = 'center';
        cardContainer.style.padding = '20px';

        const rarityLabel = document.createElement('div');
        rarityLabel.innerText = hero.rarity;
        rarityLabel.style.color = glowColor;
        rarityLabel.style.fontSize = '1.2rem';
        rarityLabel.style.fontWeight = 'bold';
        rarityLabel.style.textTransform = 'uppercase';
        rarityLabel.style.letterSpacing = '2px';
        rarityLabel.style.marginBottom = '15px';
        cardContainer.appendChild(rarityLabel);

        const heroIcon = document.createElement('div');
        heroIcon.innerText = '⭐';
        heroIcon.style.fontSize = '80px';
        heroIcon.style.marginBottom = '15px';
        cardContainer.appendChild(heroIcon);

        const nameLabel = document.createElement('div');
        nameLabel.innerText = hero.name;
        nameLabel.style.color = 'white';
        nameLabel.style.fontSize = '1.6rem';
        nameLabel.style.fontWeight = 'bold';
        nameLabel.style.textAlign = 'center';
        nameLabel.style.textShadow = '0 2px 4px black';
        nameLabel.style.fontFamily = "'SF Pro Rounded', sans-serif";
        cardContainer.appendChild(nameLabel);

        const classLabel = document.createElement('div');
        classLabel.innerText = `${hero.class} Hero`;
        classLabel.style.color = '#aaa';
        classLabel.style.fontSize = '1rem';
        classLabel.style.marginTop = '8px';
        cardContainer.appendChild(classLabel);

        this.resultOverlay.appendChild(cardContainer);

        const helpText = document.createElement('div');
        helpText.innerText = "Tap to Continue";
        helpText.style.color = '#666';
        helpText.style.marginTop = '25px';
        helpText.style.fontSize = '1rem';
        this.resultOverlay.appendChild(helpText);

        this.resultOverlay.style.display = 'flex';
    }

    private revealMultipleHeroes(heroes: HeroDef[]) {
        this.resultOverlay.innerHTML = '';

        const style = document.createElement('style');
        style.innerText = `
            @keyframes popIn {
                0% { transform: scale(0); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        this.resultOverlay.appendChild(style);

        const title = document.createElement('div');
        title.innerText = '🎉 x10 SUMMON RESULTS 🎉';
        title.style.color = '#ffd700';
        title.style.fontSize = '1.8rem';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '30px';
        title.style.fontFamily = "'SF Pro Rounded', sans-serif";
        title.style.textShadow = '0 2px 10px rgba(255,215,0,0.5)';
        this.resultOverlay.appendChild(title);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
        grid.style.gap = '15px';
        grid.style.maxWidth = '90%';

        heroes.forEach((hero, index) => {
            const glowColor = hero.rarity === 'Mythic' ? '#ff4444' : '#4facfe';

            const card = document.createElement('div');
            card.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
            card.style.borderRadius = '12px';
            card.style.border = `3px solid ${glowColor}`;
            card.style.padding = '15px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.animation = `popIn 0.5s ease ${index * 0.1}s backwards`;

            const rarityLabel = document.createElement('div');
            rarityLabel.innerText = hero.rarity;
            rarityLabel.style.color = glowColor;
            rarityLabel.style.fontSize = '0.8rem';
            rarityLabel.style.fontWeight = 'bold';
            rarityLabel.style.marginBottom = '8px';
            card.appendChild(rarityLabel);

            const heroIcon = document.createElement('div');
            heroIcon.innerText = '⭐';
            heroIcon.style.fontSize = '40px';
            heroIcon.style.marginBottom = '8px';
            card.appendChild(heroIcon);

            const nameLabel = document.createElement('div');
            nameLabel.innerText = hero.name;
            nameLabel.style.color = 'white';
            nameLabel.style.fontSize = '0.9rem';
            nameLabel.style.fontWeight = 'bold';
            nameLabel.style.textAlign = 'center';
            nameLabel.style.fontFamily = "'SF Pro Rounded', sans-serif";
            card.appendChild(nameLabel);

            grid.appendChild(card);
        });

        this.resultOverlay.appendChild(grid);

        const helpText = document.createElement('div');
        helpText.innerText = "Tap to Continue";
        helpText.style.color = '#666';
        helpText.style.marginTop = '30px';
        helpText.style.fontSize = '1rem';
        this.resultOverlay.appendChild(helpText);

        this.resultOverlay.style.display = 'flex';
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public close() {
        this.modal.close();
    }
}
