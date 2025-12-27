
import { SummonSystem } from '../systems/SummonSystem';
import { UserProfile } from '../data/UserProfile';
import { HeroDef } from '../data/HeroDefinitions';

export class SummonUI {
    private element: HTMLElement;
    private onClose: () => void;
    private user: UserProfile | null = null; // Need user for inventory
    private isAnimating: boolean = false;

    constructor(onClose: () => void) {
        this.onClose = onClose;
        // Try to find user from global session if not passed (quick hack since signature change is annoying)
        const session = localStorage.getItem('awengers_session');
        if (session) {
            this.user = JSON.parse(session);
        }

        this.element = document.createElement('div');
        this.initialize();
    }

    private initialize() {
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'; // Semi-transparent or None
        // Game Scene is hidden by UIManager, so this overlay just dims the black value if needed

        this.element.style.zIndex = '500';
        this.element.style.display = 'flex';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';

        // The Summon "Card" Image
        const cardImg = document.createElement('img');
        cardImg.src = '/assets/summon/bg-summon.png';
        cardImg.style.maxHeight = '90%';
        cardImg.style.maxWidth = '90%';
        cardImg.style.objectFit = 'contain';
        cardImg.style.cursor = 'pointer';
        cardImg.style.transition = 'transform 0.1s, filter 0.2s';

        // Hover effect
        cardImg.onmouseover = () => {
            if (!this.isAnimating) {
                cardImg.style.transform = 'scale(1.05)';
                cardImg.style.filter = 'drop-shadow(0 0 15px gold)';
            }
        };
        cardImg.onmouseout = () => {
            if (!this.isAnimating) {
                cardImg.style.transform = 'scale(1)';
                cardImg.style.filter = 'none';
            }
        };

        // Click to Summon (Image)
        cardImg.onclick = () => {
            console.log("[SummonUI] Card clicked");
            this.performSummon(cardImg);
        };

        this.element.appendChild(cardImg);

        // Explicit Summon Button (Below card)
        const summonBtn = document.createElement('div');
        summonBtn.innerText = "SUMMON (1 Book)";
        summonBtn.style.position = 'absolute';
        summonBtn.style.bottom = '10%';
        summonBtn.style.padding = '15px 40px';
        summonBtn.style.background = 'linear-gradient(45deg, #ffd700, #ffa500)';
        summonBtn.style.border = '2px solid #fff';
        summonBtn.style.borderRadius = '30px';
        summonBtn.style.color = '#000';
        summonBtn.style.fontWeight = 'bold';
        summonBtn.style.fontSize = '1.5rem';
        summonBtn.style.cursor = 'pointer';
        summonBtn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
        summonBtn.style.zIndex = '510'; // Above card
        summonBtn.style.pointerEvents = 'auto';

        summonBtn.onmouseover = () => summonBtn.style.transform = 'scale(1.1)';
        summonBtn.onmouseout = () => summonBtn.style.transform = 'scale(1)';

        summonBtn.onclick = () => {
            console.log("[SummonUI] Button clicked");
            this.performSummon(cardImg); // Animate the card even if button clicked
        };

        this.element.appendChild(summonBtn);

        // Add Result Overlay Container (Hidden initially)
        this.createResultOverlay();
    }

    private resultOverlay!: HTMLElement;

    private createResultOverlay() {
        this.resultOverlay = document.createElement('div');
        this.resultOverlay.style.position = 'absolute';
        this.resultOverlay.style.top = '0';
        this.resultOverlay.style.left = '0';
        this.resultOverlay.style.width = '100%';
        this.resultOverlay.style.height = '100%';
        this.resultOverlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
        this.resultOverlay.style.display = 'none';
        this.resultOverlay.style.flexDirection = 'column';
        this.resultOverlay.style.justifyContent = 'center';
        this.resultOverlay.style.alignItems = 'center';
        this.resultOverlay.style.zIndex = '200';
        this.resultOverlay.onclick = () => {
            // Click to close result
            this.resultOverlay.style.display = 'none';
            this.isAnimating = false;
        };
        this.element.appendChild(this.resultOverlay);
    }

    private async performSummon(cardElement: HTMLElement) {
        console.log("[SummonUI] performSummon called. Animating:", this.isAnimating);
        if (this.isAnimating) return;

        // Refresh user from localStorage to be safe
        const session = localStorage.getItem('awengers_session');
        if (session) {
            this.user = JSON.parse(session);
        }

        // 1. Check Cost
        const inventory = this.user?.inventory || {};
        const count = inventory['summon_book'] || 0;

        console.log("[SummonUI] User:", this.user?.commanderName, "Books:", count);

        if (count < 1) {
            alert("Not enough Summon Books! Check your Backpack.");
            return;
        }

        this.isAnimating = true;

        if (!this.user || !this.user.inventory) return;

        // 2. Deduct Item
        this.user.inventory['summon_book']--;
        this.saveUser(); // Persist changes

        // 3. Animate Shake
        let startTime = Date.now();
        const shakeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed > 800) { // Stop shaking
                clearInterval(shakeInterval);
                this.revealHero();
            } else {
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = (Math.random() - 0.5) * 20;
                cardElement.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1.1)`;
                cardElement.style.filter = `brightness(${1 + elapsed / 500})`; // Get brighter
            }
        }, 50);
    }

    private revealHero() {
        // Roll Hero
        const hero = SummonSystem.summon();

        // Determine Colors
        const glowColor = hero.rarity === 'Mythic' ? 'red' : 'blue';

        // Show Result
        this.resultOverlay.innerHTML = ''; // Clear previous

        // Add Animation Styles
        const style = document.createElement('style');
        style.innerText = `
            @keyframes popIn {
                0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            .summon-ray {
                position: absolute; top: 50%; left: 50%;
                width: 200%; height: 2px; background: ${glowColor};
                transform: translate(-50%, -50%) rotate(0deg);
                animation: spinRay 3s linear infinite;
                z-index: -1;
                box-shadow: 0 0 20px ${glowColor};
            }
            @keyframes spinRay { 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        `;
        this.resultOverlay.appendChild(style);

        // Container for card
        const cardContainer = document.createElement('div');
        cardContainer.style.position = 'relative';
        cardContainer.style.width = '300px';
        cardContainer.style.height = '420px';
        cardContainer.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        // Rays
        for (let i = 0; i < 4; i++) {
            const ray = document.createElement('div');
            ray.className = 'summon-ray';
            ray.style.animationDelay = `${i * 0.2}s`;
            cardContainer.appendChild(ray);
        }

        // Hero Image
        const img = document.createElement('img');
        img.src = `https://via.placeholder.com/300x420/000000/ffffff?text=${encodeURIComponent(hero.name)}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.border = `4px solid ${glowColor === 'red' ? '#ff0000' : '#4facfe'}`;
        img.style.borderRadius = '15px';
        cardContainer.appendChild(img);

        // Name Label
        const nameLabel = document.createElement('div');
        nameLabel.innerText = hero.name;
        nameLabel.style.position = 'absolute';
        nameLabel.style.bottom = '20px';
        nameLabel.style.width = '100%';
        nameLabel.style.textAlign = 'center';
        nameLabel.style.color = 'white';
        nameLabel.style.fontSize = '24px';
        nameLabel.style.fontWeight = 'bold';
        nameLabel.style.textShadow = '0 2px 4px black';
        cardContainer.appendChild(nameLabel);

        // Rarity Label
        const rarityLabel = document.createElement('div');
        rarityLabel.innerText = hero.rarity;
        rarityLabel.style.position = 'absolute';
        rarityLabel.style.top = '20px';
        rarityLabel.style.width = '100%';
        rarityLabel.style.textAlign = 'center';
        rarityLabel.style.color = glowColor;
        rarityLabel.style.fontSize = '18px';
        rarityLabel.style.fontWeight = 'bold';
        rarityLabel.style.textShadow = '0 2px 4px black';
        cardContainer.appendChild(rarityLabel);

        this.resultOverlay.appendChild(cardContainer);

        const helpText = document.createElement('div');
        helpText.innerText = "Click to Continue";
        helpText.style.color = '#fff';
        helpText.style.marginTop = '20px';
        helpText.style.opacity = '0.5';
        this.resultOverlay.appendChild(helpText);

        this.resultOverlay.style.display = 'flex';

        // Grant Hero (Logic)
        this.grantHero(hero);
    }

    private grantHero(hero: HeroDef) {
        if (!this.user) return;

        if (!this.user.stats.heroUsage) this.user.stats.heroUsage = {};

        // Logic: If already owned, maybe give shards? For now just log it.
        // We use heroUsage as ownership for now based on previous investigation.
        if (!this.user.stats.heroUsage[hero.codeName]) {
            this.user.stats.heroUsage[hero.codeName] = 1;
            // Also need to increment collection count for achievements
            if (this.user.achievementsProgress && this.user.achievementsProgress['collector_1'] !== undefined) {
                // Recalculate unique count (complex without iteration) - simplification:
                // const count = Object.keys(this.user.stats.heroUsage).length;
                // Update collection achievements... 
            }
        } else {
            this.user.stats.heroUsage[hero.codeName]++;
        }

        this.saveUser();
    }

    private async saveUser() {
        if (!this.user) return;
        localStorage.setItem('awengers_session', JSON.stringify(this.user));

        try {
            await fetch('http://localhost:3000/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.user)
            });

            // Dispatch event to update Header UI (resources)
            // Since we are separated, we can maybe grab global UIManager? 
            // Or just rely on next navigation update.
            // Ideally we emit an event.
        } catch (e) {
            console.error(e);
        }
    }

    public getElement(): HTMLElement {
        return this.element;
    }
}
