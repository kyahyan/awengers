
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

        // The Summon "Card" Image
        this.cardImg = document.createElement('img');
        this.cardImg.src = '/assets/summon/bg-summon.png';
        this.cardImg.style.maxHeight = '70%';
        this.cardImg.style.maxWidth = '80%';
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

        // Summon Button
        const summonBtn = document.createElement('div');
        summonBtn.innerText = "SUMMON (1 Book)";
        summonBtn.style.marginTop = '30px';
        summonBtn.style.padding = '15px 50px';
        summonBtn.style.background = 'linear-gradient(45deg, #ffd700, #ffa500)';
        summonBtn.style.border = '3px solid #fff';
        summonBtn.style.borderRadius = '35px';
        summonBtn.style.color = '#000';
        summonBtn.style.fontWeight = 'bold';
        summonBtn.style.fontSize = '1.4rem';
        summonBtn.style.cursor = 'pointer';
        summonBtn.style.boxShadow = '0 5px 20px rgba(255, 215, 0, 0.4)';
        summonBtn.style.transition = 'transform 0.2s, box-shadow 0.2s';
        summonBtn.style.fontFamily = "'SF Pro Rounded', sans-serif";

        summonBtn.onmouseover = () => {
            summonBtn.style.transform = 'scale(1.1)';
            summonBtn.style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.6)';
        };
        summonBtn.onmouseout = () => {
            summonBtn.style.transform = 'scale(1)';
            summonBtn.style.boxShadow = '0 5px 20px rgba(255, 215, 0, 0.4)';
        };

        summonBtn.onclick = () => {
            this.performSummon();
        };

        content.appendChild(summonBtn);

        // Result Overlay (Hidden initially)
        this.createResultOverlay(content);
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
        const count = inventory['summon_book'] || 0;
        if (count < 1) {
            alert("Not enough Summon Books! Check your Backpack.");
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
            const { hero, user } = data; // instanceId available but not needed for display currently

            // Sync local user
            this.user = user;
            localStorage.setItem('awengers_session', JSON.stringify(this.user));
            if (this.user && this.onUpdate) {
                this.onUpdate(this.user);
            }

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

    private revealHero(hero: HeroDef) {
        // const hero = SummonSystem.summon(); // Logic moved to server
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

        // Removed grantHero(hero) - handled by server
        if (this.user) {
            // Just sanity check local object structure if needed
        }
    }

    public getElement(): HTMLElement {
        return this.modal.getElement();
    }

    public close() {
        this.modal.close();
    }
}
