export class LoadingUI {
    private element: HTMLElement;
    private progressBar!: HTMLElement;
    private progressFill!: HTMLElement;
    private progressText!: HTMLElement;
    private loadingText!: HTMLElement;

    constructor() {
        this.element = document.createElement('div');
        this.initialize();
    }

    private initialize() {
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.zIndex = '5000'; // Highest priority
        this.element.style.backgroundColor = '#000';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';
        this.element.style.transition = 'opacity 0.5s ease-out';

        // Background Image (Optional, reused from settings or main bg)
        this.element.style.backgroundImage = 'url("/assets/Background/bg.png")';
        this.element.style.backgroundSize = 'cover';
        this.element.style.backgroundPosition = 'center';

        // Dark Overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        this.element.appendChild(overlay);

        // Container for content
        const container = document.createElement('div');
        container.style.position = 'relative'; // Above overlay
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.width = '60%';
        container.style.maxWidth = '600px';
        this.element.appendChild(container);

        // Logo / Title
        const title = document.createElement('h1');
        title.innerText = 'AWENGERS';
        title.style.fontFamily = "'SF Pro Display', sans-serif";
        title.style.fontSize = '4rem';
        title.style.color = '#ffd700';
        title.style.marginBottom = '50px';
        title.style.textShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
        title.style.letterSpacing = '5px';
        container.appendChild(title);

        // Loading Text
        this.loadingText = document.createElement('div');
        this.loadingText.innerText = 'Initializing...';
        this.loadingText.style.fontFamily = "'SF Pro Display', sans-serif";
        this.loadingText.style.fontSize = '1.2rem';
        this.loadingText.style.color = '#fff';
        this.loadingText.style.marginBottom = '10px';
        this.loadingText.style.alignSelf = 'flex-start';
        this.loadingText.style.width = '100%';
        this.loadingText.style.textAlign = 'center';
        container.appendChild(this.loadingText);

        // Progress Bar Container
        this.progressBar = document.createElement('div');
        this.progressBar.style.width = '100%';
        this.progressBar.style.height = '10px';
        this.progressBar.style.backgroundColor = '#333';
        this.progressBar.style.borderRadius = '5px';
        this.progressBar.style.overflow = 'hidden';
        this.progressBar.style.border = '1px solid #555';
        this.progressBar.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        container.appendChild(this.progressBar);

        // Progress Fill
        this.progressFill = document.createElement('div');
        this.progressFill.style.width = '0%';
        this.progressFill.style.height = '100%';
        this.progressFill.style.backgroundColor = '#ffd700';
        this.progressFill.style.boxShadow = '0 0 10px #ffd700';
        this.progressFill.style.transition = 'width 0.2s linear';
        this.progressBar.appendChild(this.progressFill);

        // Percentage Text
        this.progressText = document.createElement('div');
        this.progressText.innerText = '0%';
        this.progressText.style.marginTop = '10px';
        this.progressText.style.color = '#888';
        this.progressText.style.fontFamily = 'monospace';
        container.appendChild(this.progressText);
    }

    public updateProgress(percent: number, message?: string) {
        // Clamp between 0 and 100
        const p = Math.max(0, Math.min(100, percent));

        this.progressFill.style.width = `${p}%`;
        this.progressText.innerText = `${Math.floor(p)}%`;

        if (message) {
            this.loadingText.innerText = message;
        }
    }

    public hide() {
        this.element.style.opacity = '0';
        setTimeout(() => {
            this.element.style.display = 'none';
        }, 500);
    }

    public getElement(): HTMLElement {
        return this.element;
    }
}
