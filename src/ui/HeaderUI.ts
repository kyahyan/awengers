
export class HeaderUI {
    private element: HTMLElement;
    private settingsBtn!: HTMLImageElement;

    private coinText!: HTMLElement;
    private gemText!: HTMLElement;
    private cheeseText!: HTMLElement;



    private onNavClick: (screen: string) => void;
    private onSettingsClick: () => void;

    constructor(onSettingsClick: () => void, onNavClick: (screen: string) => void) {
        this.onSettingsClick = onSettingsClick;
        this.onNavClick = onNavClick;
        this.element = document.createElement('div');
        this.initialize();
    }

    public update(user: any) {
        if (this.coinText) this.coinText.innerText = user.gold.toLocaleString();
        if (this.gemText) this.gemText.innerText = user.gems.toLocaleString();
        if (this.cheeseText) this.cheeseText.innerText = user.cheese ? user.cheese.toLocaleString() : '0';
    }

    private initialize() {
        // Main container styles
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '120px'; // Approximate height based on typical nav bars
        // Background image removed - transparent header
        // this.element.style.backgroundImage = `url("/assets/header/nav.png?v=${Date.now()}")`;
        // this.element.style.backgroundSize = '100% 100%';
        // this.element.style.backgroundRepeat = 'no-repeat';
        this.element.style.zIndex = '1000'; // High z-index to stay on top
        this.element.style.pointerEvents = 'none'; // Let clicks pass through empty areas if needed, but buttons will catch them
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.padding = '0 20px';
        this.element.style.boxSizing = 'border-box';

        // Settings Button
        this.settingsBtn = document.createElement('img');
        this.settingsBtn.src = '/assets/icons/settings.png';
        this.settingsBtn.style.width = '60px'; // Adjust size
        this.settingsBtn.style.height = 'auto';
        this.settingsBtn.style.cursor = 'pointer';
        this.settingsBtn.style.pointerEvents = 'auto'; // Re-enable pointer events for the button
        this.settingsBtn.style.position = 'absolute';
        this.settingsBtn.style.top = '5px';
        this.settingsBtn.style.right = '20px';

        // Add hover effect for settings button
        this.settingsBtn.onmouseover = () => {
            this.settingsBtn.style.transform = 'scale(1.1) rotate(30deg)';
            this.settingsBtn.style.transition = 'transform 0.2s';
        };
        this.settingsBtn.onmouseout = () => {
            this.settingsBtn.style.transform = 'scale(1) rotate(0deg)';
        };

        this.settingsBtn.onclick = () => {
            if (this.onSettingsClick) this.onSettingsClick();
        };

        this.element.appendChild(this.settingsBtn);

        // Navigation Buttons Container
        const navContainer = document.createElement('div');
        navContainer.style.position = 'absolute';
        navContainer.style.top = '5px';
        navContainer.style.left = '30px';
        navContainer.style.display = 'flex';
        navContainer.style.gap = '30px';
        navContainer.style.alignItems = 'center';
        navContainer.style.height = '60px'; // Match icon height roughly
        navContainer.style.pointerEvents = 'auto';

        const buttons = ['HOME', 'HEROES', 'ROSTER', 'SUMMON', 'BACKPACK', 'SHOP'];
        buttons.forEach(text => {
            const btn = document.createElement('div');
            btn.innerText = text;
            btn.style.color = '#fff';
            btn.style.fontFamily = "'SF Pro Rounded', sans-serif";
            btn.style.fontWeight = '900';
            btn.style.fontSize = '1.2rem';
            btn.style.cursor = 'pointer';
            btn.style.textShadow = '0px 2px 4px rgba(0,0,0,0.6)';

            // Hover effect
            btn.onmouseover = () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.color = '#ffd700'; // Gold on hover
                btn.style.transition = 'all 0.2s';
            };
            btn.onmouseout = () => {
                btn.style.transform = 'scale(1)';
                btn.style.color = '#fff';
            };

            btn.onclick = () => {
                console.log(`[HeaderUI] Clicked ${text}`);
                this.onNavClick(text);
            };

            navContainer.appendChild(btn);
        });

        this.element.appendChild(navContainer);

        // Resource Container
        const resourceContainer = document.createElement('div');
        resourceContainer.style.display = 'flex';
        resourceContainer.style.alignItems = 'center';
        resourceContainer.style.gap = '20px';
        resourceContainer.style.position = 'absolute';
        resourceContainer.style.top = '5px';
        resourceContainer.style.right = '100px';
        resourceContainer.style.pointerEvents = 'auto';

        // Coin Container
        const coinContainer = document.createElement('div');
        coinContainer.style.position = 'relative';
        coinContainer.style.display = 'flex';
        coinContainer.style.alignItems = 'center';
        coinContainer.style.justifyContent = 'center';

        const coinBar = document.createElement('img');
        coinBar.src = '/assets/bar/coin-bar.png';
        coinBar.style.height = '50px';
        coinBar.style.width = 'auto';
        coinContainer.appendChild(coinBar);

        this.coinText = document.createElement('div');
        this.coinText.innerText = '0';
        this.coinText.style.position = 'absolute';
        this.coinText.style.left = '50px'; // Clear the icon
        this.coinText.style.right = '15px'; // Padding from right
        this.coinText.style.top = '11px'; // Padding from right
        this.coinText.style.textAlign = 'right';
        this.coinText.style.color = '#fff';
        this.coinText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.coinText.style.fontSize = '1rem'; // Slight reduction to fit large numbers
        this.coinText.style.fontWeight = 'bold';
        this.coinText.style.textShadow = '0px 2px 2px rgba(0,0,0,0.5)';
        this.coinText.style.pointerEvents = 'none';
        coinContainer.appendChild(this.coinText);

        resourceContainer.appendChild(coinContainer);

        // Gem Container
        const gemContainer = document.createElement('div');
        gemContainer.style.position = 'relative';
        gemContainer.style.display = 'flex';
        gemContainer.style.alignItems = 'center';
        gemContainer.style.justifyContent = 'center';

        const gemBar = document.createElement('img');
        gemBar.src = '/assets/bar/gem-bar.png';
        gemBar.style.height = '50px';
        gemBar.style.width = 'auto';
        gemContainer.appendChild(gemBar);

        this.gemText = document.createElement('div');
        this.gemText.innerText = '0';
        this.gemText.style.position = 'absolute';
        this.gemText.style.left = '50px'; // Clear the icon
        this.gemText.style.right = '20px'; // Padding from right
        this.gemText.style.textAlign = 'right';
        this.gemText.style.color = '#fff';
        this.gemText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.gemText.style.fontSize = '1.1rem'; // Slight reduction
        this.gemText.style.fontWeight = 'bold';
        this.gemText.style.textShadow = '0px 2px 2px rgba(0,0,0,0.5)';
        this.gemText.style.pointerEvents = 'none';
        gemContainer.appendChild(this.gemText);



        resourceContainer.appendChild(gemContainer);

        // Cheese Container
        const cheeseContainer = document.createElement('div');
        cheeseContainer.style.position = 'relative';
        cheeseContainer.style.display = 'flex';
        cheeseContainer.style.alignItems = 'center';
        cheeseContainer.style.justifyContent = 'center';

        const cheeseBar = document.createElement('img');
        cheeseBar.src = '/assets/bar/cheese-bar.png';
        cheeseBar.style.height = '50px';
        cheeseBar.style.width = 'auto';
        cheeseContainer.appendChild(cheeseBar);

        this.cheeseText = document.createElement('div');
        this.cheeseText.innerText = '0';
        this.cheeseText.style.position = 'absolute';
        this.cheeseText.style.left = '50px';
        this.cheeseText.style.right = '20px';
        this.cheeseText.style.textAlign = 'right';
        this.cheeseText.style.color = '#fff';
        this.cheeseText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.cheeseText.style.fontSize = '1.1rem';
        this.cheeseText.style.fontWeight = 'bold';
        this.cheeseText.style.textShadow = '0px 2px 2px rgba(0,0,0,0.5)';
        this.cheeseText.style.pointerEvents = 'none';
        cheeseContainer.appendChild(this.cheeseText);

        resourceContainer.appendChild(cheeseContainer);

        this.element.appendChild(resourceContainer);

    }

    public getElement(): HTMLElement {
        return this.element;
    }
}
