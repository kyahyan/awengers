
import { UserProfile } from "../data/UserProfile";

/**
 * A reusable modal wrapper that provides:
 * - Semi-transparent overlay (click to close)
 * - Centered popup container
 * - Close button with icon
 * - Fade in/out animation
 */
export class ModalWrapper {
    private overlay: HTMLElement;
    private modal: HTMLElement;
    private closeBtn: HTMLImageElement;
    private onClose: () => void;

    constructor(title: string, onClose: () => void, width: string = '80%', height: string = '80%') {
        this.onClose = onClose;

        // Overlay (semi-transparent background)
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 400;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: auto;
        `;

        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Modal container
        this.modal = document.createElement('div');
        this.modal.className = 'modal-container';
        this.modal.style.cssText = `
            position: relative;
            width: ${width};
            max-width: 1400px;
            height: ${height};
            max-height: 900px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
            border-radius: 20px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;

        // Header with title and close button
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const titleEl = document.createElement('div');
        titleEl.innerText = title;
        titleEl.style.cssText = `
            font-size: 2rem;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            font-family: 'SF Pro Rounded', sans-serif;
            letter-spacing: 1px;
        `;
        header.appendChild(titleEl);

        // Close button
        this.closeBtn = document.createElement('img');
        this.closeBtn.src = '/assets/icons/close.png';
        this.closeBtn.style.cssText = `
            width: 40px;
            height: 40px;
            cursor: pointer;
            transition: transform 0.2s, filter 0.2s;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        `;
        this.closeBtn.onmouseover = () => {
            this.closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
        };
        this.closeBtn.onmouseout = () => {
            this.closeBtn.style.transform = 'scale(1) rotate(0deg)';
        };
        this.closeBtn.onclick = () => this.close();
        header.appendChild(this.closeBtn);

        this.modal.appendChild(header);

        // Content area (to be filled by child classes)
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        `;
        this.modal.appendChild(content);

        this.overlay.appendChild(this.modal);

        // Trigger animation after append
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '1';
            this.modal.style.transform = 'scale(1)';
        });
    }

    public getContentArea(): HTMLElement {
        return this.modal.querySelector('.modal-content') as HTMLElement;
    }

    public getElement(): HTMLElement {
        return this.overlay;
    }

    public close() {
        this.overlay.style.opacity = '0';
        this.modal.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this.onClose();
        }, 300);
    }
}
