
export class HeaderUI {
    private element: HTMLElement;
    private settingsBtn!: HTMLImageElement;

    private coinText!: HTMLElement;
    private gemText!: HTMLElement;
    private heroPotionText!: HTMLElement;
    private soulPotionText!: HTMLElement;

    private avatarImg!: HTMLImageElement;
    private rankImg!: HTMLImageElement;
    private rankTitleText!: HTMLElement;
    private usernameText!: HTMLElement;
    private expBar!: HTMLElement;
    private expFill!: HTMLElement;
    private expText!: HTMLElement;
    private levelText!: HTMLElement;

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
        if (this.heroPotionText) this.heroPotionText.innerText = user.heroPotion ? user.heroPotion.toLocaleString() : '0';
        if (this.soulPotionText) this.soulPotionText.innerText = user.soulPotion ? user.soulPotion.toLocaleString() : '0';
        if (this.avatarImg) this.avatarImg.src = `/assets/avatar/${user.avatarId || '1'}.png`;
        if (this.rankImg) {
            const rankDefs = ['Scout', 'Warden', 'Hunter', 'Alpha', 'Apex', 'Primal', 'Celestial', 'Eternal'];
            let rankIndex = rankDefs.indexOf(user.rankTitle || 'Scout');
            if (rankIndex === -1) rankIndex = 0;
            this.rankImg.src = `/assets/ranks/${rankIndex + 1}.png`;
        }
        if (this.rankTitleText) this.rankTitleText.innerText = user.rankTitle || 'Recruit';
        if (this.usernameText) this.usernameText.innerText = user.commanderName || 'Commander';
        // Update EXP bar
        if (this.expFill && user.currentXp !== undefined && user.maxXp) {
            const percent = Math.min((user.currentXp / user.maxXp) * 100, 100);
            this.expFill.style.width = `${percent}%`;
        }
        if (this.expText && user.currentXp !== undefined && user.maxXp) {
            this.expText.innerText = `${user.currentXp} / ${user.maxXp}`;
        }
        if (this.levelText && user.level !== undefined) {
            this.levelText.innerText = `Lv.${user.level}`;
        }
    }

    private initialize() {
        // Main container styles
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
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
        this.settingsBtn.style.width = '90px'; // Adjust size
        this.settingsBtn.style.height = 'auto';
        this.settingsBtn.style.cursor = 'pointer';
        this.settingsBtn.style.pointerEvents = 'auto'; // Re-enable pointer events for the button
        this.settingsBtn.style.position = 'absolute';
        this.settingsBtn.style.top = '7px';
        this.settingsBtn.style.right = '10px';

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

        // User Profile Container (Top Left)
        const profileContainer = document.createElement('div');
        profileContainer.style.position = 'absolute';
        profileContainer.style.top = '30px';
        profileContainer.style.left = '70px';
        profileContainer.style.display = 'flex';
        profileContainer.style.alignItems = 'center';
        profileContainer.style.gap = '15px';
        profileContainer.style.pointerEvents = 'auto';

        // Avatar with frame
        const avatarWrapper = document.createElement('div');
        avatarWrapper.style.position = 'relative';
        avatarWrapper.style.width = '130px';
        avatarWrapper.style.height = '130px';

        this.avatarImg = document.createElement('img');
        this.avatarImg.src = '/assets/avatar/1.png';
        this.avatarImg.style.width = '100%';
        this.avatarImg.style.height = '100%';
        this.avatarImg.style.borderRadius = '50%';
        this.avatarImg.style.objectFit = 'cover';
        this.avatarImg.style.border = '5px solid #ffd700';
        this.avatarImg.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
        avatarWrapper.appendChild(this.avatarImg);

        // Rank image - overlapping on avatar
        this.rankImg = document.createElement('img');
        this.rankImg.src = '/assets/ranks/1.png';
        this.rankImg.style.position = 'absolute';
        this.rankImg.style.bottom = '-10px';
        this.rankImg.style.left = '-15px';
        this.rankImg.style.width = '55px';
        this.rankImg.style.height = 'auto';
        this.rankImg.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))';
        avatarWrapper.appendChild(this.rankImg);

        profileContainer.appendChild(avatarWrapper);

        // Rank and Name container
        const infoContainer = document.createElement('div');
        infoContainer.style.display = 'flex';
        infoContainer.style.flexDirection = 'column';
        infoContainer.style.alignItems = 'flex-start';
        infoContainer.style.gap = '5px';

        // Rank Title and Level Row
        const rankLevelRow = document.createElement('div');
        rankLevelRow.style.display = 'flex';
        rankLevelRow.style.alignItems = 'center';
        rankLevelRow.style.gap = '10px';
        rankLevelRow.style.marginBottom = '-10px';

        // Level (first)
        this.levelText = document.createElement('div');
        this.levelText.innerText = 'Lv.1';
        this.levelText.style.color = '#fff';
        this.levelText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.levelText.style.fontSize = '0.9rem';
        this.levelText.style.fontWeight = '700';
        this.levelText.style.background = 'rgba(0,0,0,0.4)';
        this.levelText.style.padding = '2px 8px';
        this.levelText.style.borderRadius = '5px';
        this.levelText.style.textShadow = '0px 1px 2px rgba(0,0,0,0.6)';
        rankLevelRow.appendChild(this.levelText);

        // Rank Title (second)
        this.rankTitleText = document.createElement('div');
        this.rankTitleText.innerText = 'Recruit';
        this.rankTitleText.style.color = '#ffd700';
        this.rankTitleText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.rankTitleText.style.fontSize = '1rem';
        this.rankTitleText.style.fontWeight = '600';
        this.rankTitleText.style.textShadow = '0px 2px 4px rgba(0,0,0,0.6)';
        rankLevelRow.appendChild(this.rankTitleText);

        infoContainer.appendChild(rankLevelRow);

        // Username
        this.usernameText = document.createElement('div');
        this.usernameText.innerText = 'Commander';
        this.usernameText.style.color = '#fff';
        this.usernameText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.usernameText.style.fontSize = '2rem';
        this.usernameText.style.fontWeight = '700';
        this.usernameText.style.textShadow = '0px 2px 4px rgba(0,0,0,0.6)';
        infoContainer.appendChild(this.usernameText);

        // EXP Progress Bar Container
        const expContainer = document.createElement('div');
        expContainer.style.display = 'flex';
        expContainer.style.alignItems = 'center';
        expContainer.style.gap = '8px';
        expContainer.style.marginTop = '5px';

        this.expBar = document.createElement('div');
        this.expBar.style.width = '120px';
        this.expBar.style.height = '8px';
        this.expBar.style.background = 'rgba(0,0,0,0.5)';
        this.expBar.style.borderRadius = '4px';
        this.expBar.style.overflow = 'hidden';
        this.expBar.style.border = '1px solid rgba(255,255,255,0.2)';

        this.expFill = document.createElement('div');
        this.expFill.style.width = '0%';
        this.expFill.style.height = '100%';
        this.expFill.style.background = 'linear-gradient(90deg, #ffd700, #ffaa00)';
        this.expFill.style.borderRadius = '4px';
        this.expFill.style.transition = 'width 0.3s ease';
        this.expFill.style.boxShadow = '0 0 8px rgba(255, 215, 0, 0.5)';
        this.expBar.appendChild(this.expFill);
        expContainer.appendChild(this.expBar);

        // EXP Text
        this.expText = document.createElement('div');
        this.expText.innerText = '0 / 100';
        this.expText.style.color = '#ffffffff';
        this.expText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.expText.style.fontSize = '1rem';
        this.expText.style.fontWeight = '500';
        this.expText.style.marginTop = '-6px';
        this.expText.style.textShadow = '0px 1px 2px rgba(0,0,0,0.9)';
        expContainer.appendChild(this.expText);

        infoContainer.appendChild(expContainer);

        profileContainer.appendChild(infoContainer);
        this.element.appendChild(profileContainer);

        // Navigation Buttons Container
        const navContainer = document.createElement('div');
        navContainer.style.position = 'absolute';
        navContainer.style.top = '550px';
        navContainer.style.right = '30px';
        navContainer.style.transform = 'translateY(-50%)';
        navContainer.style.display = 'flex';
        navContainer.style.flexDirection = 'column';
        navContainer.style.gap = '2px';
        navContainer.style.alignItems = 'center';
        navContainer.style.pointerEvents = 'auto';

        const buttons = [
            { key: 'HOME', label: 'Home', icon: '/assets/home/home.png', size: 110 },
            { key: 'HEROES', label: 'Heroes', icon: '/assets/home/heroes.png', size: 115 },
            { key: 'SHARDS', label: 'Shards', icon: '/assets/item/shard-item/Tier 1/Ring of Life - shard.png', size: 110 },
            { key: 'SUMMON', label: 'Summon', icon: '/assets/home/summon.png', size: 90 },
            { key: 'FORGE', label: 'Forge', icon: '/assets/home/forge.png', size: 105 },
            { key: 'BACKPACK', label: 'Backpack', icon: '/assets/home/backpack.png', size: 110 },
            { key: 'SHOP', label: 'Shop', icon: '/assets/home/store.png', size: 115 },
        ];
        buttons.forEach(({ key, label, icon, size }) => {
            const btn = document.createElement('div');
            btn.style.display = 'flex';
            btn.style.flexDirection = 'column';
            btn.style.alignItems = 'center';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'all 0.2s';

            // Icon
            const iconImg = document.createElement('img');
            iconImg.src = icon;
            iconImg.style.width = `${size}px`;
            iconImg.style.height = `${size}px`;
            iconImg.style.objectFit = 'contain';
            btn.appendChild(iconImg);

            // Label
            const labelEl = document.createElement('span');
            labelEl.innerText = label;
            labelEl.style.color = '#fff';
            labelEl.style.fontFamily = "'SF Pro Rounded', sans-serif";
            labelEl.style.fontWeight = '700';
            labelEl.style.fontSize = '1.4rem';
            labelEl.style.textShadow = '0px 2px 4px rgba(0,0,0,0.6)';
            labelEl.style.marginTop = '-15px';
            btn.appendChild(labelEl);

            // Hover effect
            btn.onmouseover = () => {
                btn.style.transform = 'scale(1.1)';
                labelEl.style.color = '#ffd700'; // Gold on hover
            };
            btn.onmouseout = () => {
                btn.style.transform = 'scale(1)';
                labelEl.style.color = '#fff';
            };

            btn.onclick = () => {
                console.log(`[HeaderUI] Clicked ${key}`);
                this.onNavClick(key);
            };

            navContainer.appendChild(btn);
        });

        this.element.appendChild(navContainer);

        // Arena Button - Left Bottom
        const arenaBtn = document.createElement('div');
        arenaBtn.style.position = 'absolute';
        arenaBtn.style.bottom = '30px';
        arenaBtn.style.left = '30px';
        arenaBtn.style.display = 'flex';
        arenaBtn.style.flexDirection = 'column';
        arenaBtn.style.alignItems = 'center';
        arenaBtn.style.cursor = 'pointer';
        arenaBtn.style.transition = 'all 0.2s';
        arenaBtn.style.pointerEvents = 'auto';

        const arenaIcon = document.createElement('img');
        arenaIcon.src = '/assets/home/arena.png';
        arenaIcon.style.width = '200px';
        arenaIcon.style.height = '200px';
        arenaIcon.style.objectFit = 'contain';
        arenaBtn.appendChild(arenaIcon);

        const arenaLabel = document.createElement('span');
        arenaLabel.innerText = 'Arena';
        arenaLabel.style.color = '#fff';
        arenaLabel.style.fontFamily = "'SF Pro Rounded', sans-serif";
        arenaLabel.style.fontWeight = '700';
        arenaLabel.style.fontSize = '1.4rem';
        arenaLabel.style.textShadow = '0px 2px 4px rgba(0,0,0,0.6)';
        arenaLabel.style.marginTop = '-20px';
        arenaBtn.appendChild(arenaLabel);

        arenaBtn.onmouseover = () => {
            arenaBtn.style.transform = 'scale(1.1)';
            arenaLabel.style.color = '#ffd700';
        };
        arenaBtn.onmouseout = () => {
            arenaBtn.style.transform = 'scale(1)';
            arenaLabel.style.color = '#fff';
        };

        arenaBtn.onclick = () => {
            console.log('[HeaderUI] Clicked ARENA');
            this.onNavClick('ARENA');
        };

        this.element.appendChild(arenaBtn);

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
        coinBar.style.height = '90px';
        coinBar.style.width = 'auto';
        coinContainer.appendChild(coinBar);

        this.coinText = document.createElement('div');
        this.coinText.innerText = '0';
        this.coinText.style.position = 'absolute';
        this.coinText.style.left = '65px';
        this.coinText.style.right = '15px';
        this.coinText.style.top = '65%';
        this.coinText.style.transform = 'translateY(-50%)';
        this.coinText.style.textAlign = 'right';
        this.coinText.style.color = '#fff';
        this.coinText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.coinText.style.fontSize = '1.7rem';
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
        gemBar.style.height = '90px';
        gemBar.style.width = 'auto';
        gemContainer.appendChild(gemBar);

        this.gemText = document.createElement('div');
        this.gemText.innerText = '0';
        this.gemText.style.position = 'absolute';
        this.gemText.style.left = '65px';
        this.gemText.style.right = '15px';
        this.gemText.style.top = '65%';
        this.gemText.style.transform = 'translateY(-50%)';
        this.gemText.style.textAlign = 'right';
        this.gemText.style.color = '#fff';
        this.gemText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.gemText.style.fontSize = '1.7rem';
        this.gemText.style.fontWeight = 'bold';
        this.gemText.style.textShadow = '0px 2px 2px rgba(0,0,0,0.5)';
        this.gemText.style.pointerEvents = 'none';
        gemContainer.appendChild(this.gemText);



        resourceContainer.appendChild(gemContainer);

        // Hero Potion Container
        const heroPotionContainer = document.createElement('div');
        heroPotionContainer.style.position = 'relative';
        heroPotionContainer.style.display = 'flex';
        heroPotionContainer.style.alignItems = 'center';
        heroPotionContainer.style.justifyContent = 'center';

        const heroPotionBar = document.createElement('img');
        heroPotionBar.src = '/assets/bar/hero-potion-bar.png';
        heroPotionBar.style.height = '90px';
        heroPotionBar.style.width = 'auto';
        heroPotionContainer.appendChild(heroPotionBar);

        this.heroPotionText = document.createElement('div');
        this.heroPotionText.innerText = '0';
        this.heroPotionText.style.position = 'absolute';
        this.heroPotionText.style.left = '65px';
        this.heroPotionText.style.right = '15px';
        this.heroPotionText.style.top = '65%';
        this.heroPotionText.style.transform = 'translateY(-50%)';
        this.heroPotionText.style.textAlign = 'right';
        this.heroPotionText.style.color = '#fff';
        this.heroPotionText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.heroPotionText.style.fontSize = '1.7rem';
        this.heroPotionText.style.fontWeight = 'bold';
        this.heroPotionText.style.textShadow = '0px 2px 2px rgba(0,0,0,0.5)';
        this.heroPotionText.style.pointerEvents = 'none';
        heroPotionContainer.appendChild(this.heroPotionText);

        resourceContainer.appendChild(heroPotionContainer);

        // Soul Potion Container
        const soulPotionContainer = document.createElement('div');
        soulPotionContainer.style.position = 'relative';
        soulPotionContainer.style.display = 'flex';
        soulPotionContainer.style.alignItems = 'center';
        soulPotionContainer.style.justifyContent = 'center';

        const soulPotionBar = document.createElement('img');
        soulPotionBar.src = '/assets/bar/soul-potion-bar.png';
        soulPotionBar.style.height = '90px';
        soulPotionBar.style.width = 'auto';
        soulPotionContainer.appendChild(soulPotionBar);

        this.soulPotionText = document.createElement('div');
        this.soulPotionText.innerText = '0';
        this.soulPotionText.style.position = 'absolute';
        this.soulPotionText.style.left = '65px';
        this.soulPotionText.style.right = '15px';
        this.soulPotionText.style.top = '65%';
        this.soulPotionText.style.transform = 'translateY(-50%)';
        this.soulPotionText.style.textAlign = 'right';
        this.soulPotionText.style.color = '#fff';
        this.soulPotionText.style.fontFamily = "'SF Pro Rounded', sans-serif";
        this.soulPotionText.style.fontSize = '1.7rem';
        this.soulPotionText.style.fontWeight = 'bold';
        this.soulPotionText.style.textShadow = '0px 2px 2px rgba(0,0,0,0.5)';
        this.soulPotionText.style.pointerEvents = 'none';
        soulPotionContainer.appendChild(this.soulPotionText);

        resourceContainer.appendChild(soulPotionContainer);

        this.element.appendChild(resourceContainer);

    }

    public getElement(): HTMLElement {
        return this.element;
    }
}
