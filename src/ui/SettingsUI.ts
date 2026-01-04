import { UserProfile } from '../data/UserProfile';

export class SettingsUI {
    private element: HTMLElement;
    private isVisible: boolean = false;
    private currentUser: UserProfile | null = null;
    private charContent!: HTMLElement;
    private onUserUpdate: ((user: UserProfile) => void) | null = null;

    constructor(onUserUpdate?: (user: UserProfile) => void) {
        this.onUserUpdate = onUserUpdate || null;
        this.element = document.createElement('div');
        this.initialize();
    }

    private initialize() {
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.zIndex = '3000'; // Above everything
        this.element.style.display = 'none';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';
        this.element.style.backgroundColor = 'rgba(0,0,0,0)'; // Transparent
        this.element.style.pointerEvents = 'auto'; // Catch all clicks

        // Close when clicking outside
        this.element.onclick = (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        };

        // Modal Content
        const modal = document.createElement('div');
        modal.style.width = '600px';
        modal.style.height = '800px';
        modal.style.backgroundImage = 'url("/assets/settings-background.png")';
        modal.style.backgroundSize = '100% 100%';
        modal.style.backgroundRepeat = 'no-repeat';
        modal.style.position = 'relative';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.padding = '40px';
        modal.style.pointerEvents = 'auto';
        modal.style.boxSizing = 'border-box';

        // Title (Optional, if not part of image)
        const title = document.createElement('div');
        title.innerText = 'Account';
        title.style.fontFamily = "'SF Pro Display', sans-serif";
        title.style.fontSize = '2.5rem';
        title.style.fontWeight = 'bold';
        title.style.color = '#fff';
        title.style.textShadow = '0 2px 4px rgba(0,0,0,0.8)';
        title.style.marginTop = '75px'; // Moved down more
        modal.appendChild(title);

        // Tab Container
        const tabContainer = document.createElement('div');
        tabContainer.style.display = 'flex';
        tabContainer.style.gap = '20px';
        tabContainer.style.marginTop = '30px';
        tabContainer.style.width = '100%';
        tabContainer.style.padding = '0 40px'; // Align with modal padding

        const createTabBtn = (text: string, isActive: boolean) => {
            const btn = document.createElement('div');
            btn.innerText = text;
            btn.style.flex = '1';
            btn.style.textAlign = 'center';
            btn.style.padding = '10px 0';
            btn.style.cursor = 'pointer';
            btn.style.fontFamily = "'SF Pro Display', sans-serif";
            btn.style.fontSize = '1.2rem';
            btn.style.fontWeight = 'bold';
            btn.style.color = isActive ? '#fff' : '#aaa';
            btn.style.borderBottom = isActive ? '3px solid #ffd700' : '3px solid transparent';
            btn.style.transition = 'all 0.2s';

            btn.onmouseover = () => {
                if (btn.style.color !== 'rgb(255, 255, 255)') { // If not active (white)
                    btn.style.color = '#fff';
                }
            };
            btn.onmouseout = () => {
                if (btn.style.borderBottomColor === 'transparent') { // Not active
                    btn.style.color = '#aaa';
                }
            };

            return btn;
        };

        const charBtn = createTabBtn('CHARACTER', true);
        const setBtn = createTabBtn('SETTINGS', false);

        tabContainer.appendChild(charBtn);
        tabContainer.appendChild(setBtn);
        modal.appendChild(tabContainer);

        // Content Area
        const contentArea = document.createElement('div');
        contentArea.style.flex = '1';
        contentArea.style.width = '100%';
        contentArea.style.marginTop = '20px';
        contentArea.style.position = 'relative'; // For absolute positioning of children if needed
        contentArea.style.overflow = 'hidden';

        // Character Content
        this.charContent = document.createElement('div');
        this.charContent.style.width = '100%';
        this.charContent.style.height = '100%';
        this.charContent.style.display = 'flex'; // Default active
        this.charContent.style.flexDirection = 'column';
        this.charContent.style.alignItems = 'center';
        this.renderCharacterTab();

        // Settings Content
        const setContent = document.createElement('div');
        setContent.style.width = '100%';
        setContent.style.height = '100%';
        setContent.style.display = 'none';
        setContent.style.flexDirection = 'column';
        setContent.style.alignItems = 'center';
        setContent.innerHTML = ``; // Clear placeholder

        // Graphics Quality Section
        const graphicsGroup = document.createElement('div');
        graphicsGroup.style.display = 'flex';
        graphicsGroup.style.flexDirection = 'column';
        graphicsGroup.style.alignItems = 'center';
        graphicsGroup.style.gap = '15px';
        graphicsGroup.style.marginTop = '30px';
        graphicsGroup.style.width = '100%';
        graphicsGroup.style.padding = '0 40px';
        graphicsGroup.style.boxSizing = 'border-box';

        const graphicsLabel = document.createElement('div');
        graphicsLabel.innerText = 'Graphics Quality';
        graphicsLabel.style.color = '#fff';
        graphicsLabel.style.fontSize = '1.3rem';
        graphicsLabel.style.fontWeight = 'bold';
        graphicsLabel.style.fontFamily = "'SF Pro Display', sans-serif";
        graphicsLabel.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
        graphicsGroup.appendChild(graphicsLabel);

        const qualityOptions = ['High', 'Mid', 'Low'];
        const currentQuality = localStorage.getItem('awengers_graphics_quality') || 'High';

        const qualityContainer = document.createElement('div');
        qualityContainer.style.display = 'flex';
        qualityContainer.style.gap = '15px';

        qualityOptions.forEach((quality) => {
            const btn = document.createElement('div');
            btn.innerText = quality;
            btn.style.padding = '12px 30px';
            btn.style.borderRadius = '8px';
            btn.style.cursor = 'pointer';
            btn.style.fontFamily = "'SF Pro Display', sans-serif";
            btn.style.fontSize = '1.1rem';
            btn.style.fontWeight = 'bold';
            btn.style.transition = 'all 0.2s';
            btn.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';

            const isActive = currentQuality === quality;
            if (isActive) {
                btn.style.background = 'linear-gradient(180deg, #ffd700, #cc9900)';
                btn.style.color = '#1a1a2e';
                btn.style.border = '2px solid #ffec8b';
                btn.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
            } else {
                btn.style.background = 'rgba(50, 50, 70, 0.8)';
                btn.style.color = '#aaa';
                btn.style.border = '2px solid rgba(100, 100, 120, 0.5)';
            }

            btn.onmouseenter = () => {
                if (localStorage.getItem('awengers_graphics_quality') !== quality) {
                    btn.style.background = 'rgba(70, 70, 100, 0.9)';
                    btn.style.color = '#fff';
                    btn.style.transform = 'scale(1.05)';
                }
            };

            btn.onmouseleave = () => {
                const currentActive = localStorage.getItem('awengers_graphics_quality') || 'High';
                if (currentActive !== quality) {
                    btn.style.background = 'rgba(50, 50, 70, 0.8)';
                    btn.style.color = '#aaa';
                    btn.style.transform = 'scale(1.0)';
                }
            };

            btn.onclick = () => {
                localStorage.setItem('awengers_graphics_quality', quality);

                // Update all buttons
                qualityContainer.querySelectorAll('div').forEach((b, idx) => {
                    const q = qualityOptions[idx];
                    if (q === quality) {
                        (b as HTMLElement).style.background = 'linear-gradient(180deg, #ffd700, #cc9900)';
                        (b as HTMLElement).style.color = '#1a1a2e';
                        (b as HTMLElement).style.border = '2px solid #ffec8b';
                        (b as HTMLElement).style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
                    } else {
                        (b as HTMLElement).style.background = 'rgba(50, 50, 70, 0.8)';
                        (b as HTMLElement).style.color = '#aaa';
                        (b as HTMLElement).style.border = '2px solid rgba(100, 100, 120, 0.5)';
                        (b as HTMLElement).style.boxShadow = 'none';
                    }
                });

                // Dispatch event for other parts of the app to listen
                window.dispatchEvent(new CustomEvent('graphicsQualityChanged', { detail: { quality } }));
            };

            qualityContainer.appendChild(btn);
        });

        graphicsGroup.appendChild(qualityContainer);

        // Quality description
        const qualityDesc = document.createElement('div');
        qualityDesc.style.color = '#888';
        qualityDesc.style.fontSize = '0.85rem';
        qualityDesc.style.textAlign = 'center';
        qualityDesc.style.marginTop = '5px';
        qualityDesc.innerText = 'Adjust graphics quality for better performance';
        graphicsGroup.appendChild(qualityDesc);

        setContent.appendChild(graphicsGroup);

        // Logout Button
        const logoutBtn = document.createElement('div');
        logoutBtn.innerText = 'LOGOUT';
        logoutBtn.style.backgroundImage = 'url("/assets/buttons/red-button.png")';
        logoutBtn.style.backgroundSize = '100% 100%';
        logoutBtn.style.width = '200px';
        logoutBtn.style.height = '60px'; // Adjust based on aspect ratio
        logoutBtn.style.display = 'flex';
        logoutBtn.style.justifyContent = 'center';
        logoutBtn.style.alignItems = 'center';
        logoutBtn.style.color = '#fff';
        logoutBtn.style.fontSize = '1.5rem';
        logoutBtn.style.fontWeight = 'bold';
        logoutBtn.style.fontFamily = "'SF Pro Display', sans-serif";
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.style.marginTop = 'auto'; // Push to bottom
        logoutBtn.style.marginBottom = '70px';
        logoutBtn.style.textShadow = '0 2px 2px rgba(0,0,0,0.5)';
        logoutBtn.style.transition = 'transform 0.1s';

        logoutBtn.onmouseenter = () => logoutBtn.style.transform = 'scale(1.05)';
        logoutBtn.onmouseleave = () => logoutBtn.style.transform = 'scale(1.0)';
        logoutBtn.onclick = () => {
            localStorage.removeItem('awengers_session');
            window.location.reload();
        };

        setContent.appendChild(logoutBtn);

        setContent.appendChild(logoutBtn);

        contentArea.appendChild(this.charContent);
        contentArea.appendChild(setContent);
        modal.appendChild(contentArea);

        // Tab Logic
        const switchTab = (tab: 'char' | 'set') => {
            if (tab === 'char') {
                this.charContent.style.display = 'flex';
                setContent.style.display = 'none';

                charBtn.style.color = '#fff';
                charBtn.style.borderBottom = '3px solid #ffd700';

                setBtn.style.color = '#aaa';
                setBtn.style.borderBottom = '3px solid transparent';
            } else {
                this.charContent.style.display = 'none';
                setContent.style.display = 'flex';

                charBtn.style.color = '#aaa';
                charBtn.style.borderBottom = '3px solid transparent';

                setBtn.style.color = '#fff';
                setBtn.style.borderBottom = '3px solid #ffd700';
            }
        };

        charBtn.onclick = () => switchTab('char');
        setBtn.onclick = () => switchTab('set');

        // Close Button
        const closeBtn = document.createElement('img');
        closeBtn.src = '/assets/icons/close.png';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '130px'; // Adjusted for visual overlap
        closeBtn.style.right = '30px'; // Adjusted for visual overlap
        closeBtn.style.width = '46px';
        closeBtn.style.height = '46px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.zIndex = '3001'; // Ensure it's on top
        closeBtn.style.pointerEvents = 'auto';
        closeBtn.style.transition = 'transform 0.1s';

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.transform = 'scale(1.1)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.transform = 'scale(1.0)';
        });

        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.hide();
        };

        modal.appendChild(closeBtn);
        this.element.appendChild(modal);
    }

    public show() {
        this.isVisible = true;
        this.element.style.display = 'flex';
        this.element.style.opacity = '0';

        const modal = this.element.firstElementChild as HTMLElement;
        if (modal) {
            modal.style.transform = 'scale(0.8)';
            modal.style.transition = 'none'; // Reset logic
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => { // Double frame for style application
                this.element.style.transition = 'opacity 0.2s ease-out';
                this.element.style.opacity = '1';

                if (modal) {
                    modal.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    modal.style.transform = 'scale(1)';
                }
            });
        });
    }

    public hide() {
        this.isVisible = false;
        this.element.style.transition = 'opacity 0.2s ease-in';
        this.element.style.opacity = '0';

        const modal = this.element.firstElementChild as HTMLElement;
        if (modal) {
            modal.style.transition = 'transform 0.2s ease-in';
            modal.style.transform = 'scale(0.8)';
        }

        setTimeout(() => {
            this.element.style.display = 'none';
        }, 200);
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public setUser(user: UserProfile) {
        this.currentUser = user;
        this.renderCharacterTab();
    }

    private renderCharacterTab() {
        if (!this.charContent) return;
        this.charContent.innerHTML = '';

        if (!this.currentUser) {
            this.charContent.innerHTML = `<div style="color: #888; margin-top: 50px;">Loading User Data...</div>`;
            return;
        }

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.width = '100%';
        container.style.gap = '20px';
        container.style.paddingTop = '20px';

        // 1. Avatar Selector
        const avatarRow = document.createElement('div');
        avatarRow.style.display = 'flex';
        avatarRow.style.alignItems = 'center';
        avatarRow.style.gap = '20px';

        let currentAvatarIdx = parseInt(this.currentUser.avatarId || '1') - 1;
        const totalAvatars = 12; // As per StaticAssets

        const avatarImg = document.createElement('img');
        avatarImg.src = `/assets/avatar/${currentAvatarIdx + 1}.png`;
        avatarImg.style.width = '100px';
        avatarImg.style.height = '100px';
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.border = '3px solid #ffd700';
        avatarImg.style.objectFit = 'cover';

        const prevBtn = document.createElement('div');
        prevBtn.innerText = '◀';
        prevBtn.style.color = '#fff';
        prevBtn.style.fontSize = '2rem';
        prevBtn.style.cursor = 'pointer';
        prevBtn.onclick = () => {
            currentAvatarIdx = (currentAvatarIdx - 1 + totalAvatars) % totalAvatars;
            avatarImg.src = `/assets/avatar/${currentAvatarIdx + 1}.png`;
            // Auto-save avatar for now? Or wait for explicit save?
            // "Change avatar" implies explicit action. Let's add a save button if changed.
            saveAvatarBtn.style.display = 'block';
        };

        const nextBtn = document.createElement('div');
        nextBtn.innerText = '▶';
        nextBtn.style.color = '#fff';
        nextBtn.style.fontSize = '2rem';
        nextBtn.style.cursor = 'pointer';
        nextBtn.onclick = () => {
            currentAvatarIdx = (currentAvatarIdx + 1) % totalAvatars;
            avatarImg.src = `/assets/avatar/${currentAvatarIdx + 1}.png`;
            saveAvatarBtn.style.display = 'block';
        };

        avatarRow.appendChild(prevBtn);
        avatarRow.appendChild(avatarImg);
        avatarRow.appendChild(nextBtn);
        container.appendChild(avatarRow);

        const saveAvatarBtn = document.createElement('button');
        saveAvatarBtn.innerText = 'Save Avatar';
        saveAvatarBtn.style.display = 'none'; // Hidden until changed
        saveAvatarBtn.style.padding = '5px 15px';
        saveAvatarBtn.style.background = '#4CAF50';
        saveAvatarBtn.style.border = 'none';
        saveAvatarBtn.style.color = 'white';
        saveAvatarBtn.style.borderRadius = '5px';
        saveAvatarBtn.style.cursor = 'pointer';
        saveAvatarBtn.onclick = () => {
            if (this.currentUser) {
                this.currentUser.avatarId = (currentAvatarIdx + 1).toString();
                this.saveUser();
                saveAvatarBtn.style.display = 'none';

                // Notify parent to update HUD/Header
                if (this.onUserUpdate) this.onUserUpdate(this.currentUser);
            }
        };
        container.appendChild(saveAvatarBtn);

        // 2. Name Change
        const nameGroup = document.createElement('div');
        nameGroup.style.display = 'flex';
        nameGroup.style.flexDirection = 'column';
        nameGroup.style.alignItems = 'center';
        nameGroup.style.gap = '10px';
        nameGroup.style.marginTop = '20px';

        const nameLabel = document.createElement('div');
        nameLabel.innerText = 'Commander Name';
        nameLabel.style.color = '#aaa';
        nameLabel.style.fontSize = '0.9rem';
        nameGroup.appendChild(nameLabel);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = this.currentUser.commanderName;
        nameInput.style.padding = '10px';
        nameInput.style.fontSize = '1.2rem';
        nameInput.style.textAlign = 'center';
        nameInput.style.background = '#222';
        nameInput.style.border = '1px solid #444';
        nameInput.style.color = '#fff';
        nameInput.style.borderRadius = '5px';
        nameGroup.appendChild(nameInput);

        const changeNameBtn = document.createElement('button');
        changeNameBtn.innerText = 'Change Name (300 Gems)';
        changeNameBtn.style.padding = '10px 20px';
        changeNameBtn.style.background = '#1e3c72';
        changeNameBtn.style.border = '1px solid #4facfe';
        changeNameBtn.style.color = 'white';
        changeNameBtn.style.borderRadius = '5px';
        changeNameBtn.style.cursor = 'pointer';
        changeNameBtn.style.fontWeight = 'bold';

        changeNameBtn.onclick = () => {
            if (!this.currentUser) return;
            const newName = nameInput.value.trim();
            if (newName === this.currentUser.commanderName) return;
            if (!newName) {
                alert("Name cannot be empty.");
                return;
            }

            // Cooldown Check (24 Hours)
            const NOW = Date.now();
            const COOLDOWN_MS = 24 * 60 * 60 * 1000;
            if (this.currentUser.lastNameChangeTime) {
                const timeDiff = NOW - this.currentUser.lastNameChangeTime;
                if (timeDiff < COOLDOWN_MS) {
                    const remainingMs = COOLDOWN_MS - timeDiff;
                    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
                    alert(`Name change is on cooldown. Try again in ${remainingHours} hours.`);
                    return;
                }
            }

            if (this.currentUser.gems >= 300) {
                this.currentUser.gems -= 300;
                this.currentUser.commanderName = newName;
                this.currentUser.lastNameChangeTime = NOW; // Update timestamp
                this.saveUser();
                alert(`Name changed to ${newName}!`);

                // Notify parent
                if (this.onUserUpdate) this.onUserUpdate(this.currentUser);

                // Re-render to show updated name input/gems?
                this.renderCharacterTab();
            } else {
                alert(`Not enough gems! Need 300, have ${this.currentUser.gems}.`);
            }
        };
        nameGroup.appendChild(changeNameBtn);
        container.appendChild(nameGroup);

        // 3. User ID & Server
        const infoGroup = document.createElement('div');
        infoGroup.style.display = 'flex';
        infoGroup.style.flexDirection = 'column';
        infoGroup.style.alignItems = 'center';
        infoGroup.style.marginTop = 'auto'; // Push down
        infoGroup.style.paddingTop = '30px';
        infoGroup.style.gap = '5px';

        const uidLabel = document.createElement('div');
        uidLabel.innerText = `UID: ${this.currentUser.uid || 'N/A'}`;
        uidLabel.style.color = '#666';
        uidLabel.style.fontSize = '0.8rem';
        infoGroup.appendChild(uidLabel);

        const serverLabel = document.createElement('div');
        serverLabel.innerText = `Server: ${this.currentUser.serverId || '1'}`;
        serverLabel.style.color = '#888';
        serverLabel.style.fontSize = '0.8rem';
        infoGroup.appendChild(serverLabel);

        container.appendChild(infoGroup);

        this.charContent.appendChild(container);
    }

    private saveUser() {
        if (this.currentUser) {
            localStorage.setItem('awengers_session', JSON.stringify(this.currentUser));
        }
    }
}
