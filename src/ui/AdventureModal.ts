import { JADE_LOTUS_SHRINE_STAGES, StageDefinition } from '../data/AdventureData';

export class AdventureModal {
    private container: HTMLElement;
    private onClose: () => void;

    constructor(onClose: () => void) {
        this.onClose = onClose;
        this.container = document.createElement('div');
        this.container.className = 'adventure-modal-overlay';

        // Handle click outside to close
        this.container.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent map clicks
            if (e.target === this.container) {
                this.close();
            }
        });

        this.render();
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    private close() {
        const modal = this.container.querySelector('.adventure-modal');
        if (modal) {
            modal.classList.add('closing');
            this.container.classList.add('fading-out');
        }

        // Wait for animation
        setTimeout(() => {
            if (this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            this.onClose();
        }, 300);
    }

    private render() {
        this.container.innerHTML = `
            <div class="adventure-modal">
                <div class="modal-header">
                    <div class="modal-title">Jade Lotus Shrine</div>
                    <button class="close-btn">✖</button>
                </div>
                
                <div class="modal-controls">
                    <button class="drop-info-btn">Drop Info</button>
                    <div class="difficulty-level">Difficulty: <span class="difficulty-val">Normal</span></div>
                </div>

                <div class="stage-list-container">
                    <div class="stage-list">
                        <!-- Stages injected here -->
                    </div>
                </div>
            </div>
            <style>
                .adventure-modal-overlay {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.7);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 2000;
                    backdrop-filter: blur(5px);
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    pointer-events: auto; /* Fix interactions */
                    transition: background 0.3s;
                    opacity: 0;
                    animation: overlayFadeIn 0.3s forwards;
                }
                .adventure-modal-overlay.fading-out {
                    pointer-events: none;
                    animation: overlayFadeOut 0.3s forwards;
                }

                .adventure-modal {
                    width: 600px;
                    height: 80vh;
                    background: linear-gradient(180deg, #2b1d0e 0%, #1a1005 100%);
                    border: 2px solid #c9a45c;
                    border-radius: 12px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 50px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                    transform: scale(0.9);
                    opacity: 0;
                    animation: modalPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .adventure-modal.closing {
                    animation: modalPopOut 0.3s forwards;
                }

                @keyframes overlayFadeIn {
                    to { opacity: 1; }
                }
                @keyframes overlayFadeOut {
                    to { opacity: 0; }
                }
                @keyframes modalPopIn {
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes modalPopOut {
                    to { transform: scale(0.9); opacity: 0; }
                }

                .modal-header {
                    padding: 15px 20px;
                    background: #3e2b14;
                    border-bottom: 2px solid #5c401a;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-title {
                    color: #ffd700;
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: #888;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .close-btn:hover { color: white; }

                .modal-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 20px;
                    background: rgba(0,0,0,0.2);
                    border-bottom: 1px solid #444;
                }
                .drop-info-btn {
                    background: #444;
                    border: 1px solid #666;
                    color: #ddd;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    cursor: pointer;
                }
                .difficulty-level {
                    color: #aaa;
                    font-weight: bold;
                }
                .difficulty-val {
                    color: #4caf50; /* Green for Normal */
                }

                .stage-list-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                }
                .stage-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .stage-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 10px 15px;
                    border-radius: 8px;
                    transition: background 0.2s;
                }
                .stage-row:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #ffd700;
                }
                
                .stage-info {
                    display: flex;
                    flex-direction: column;
                }
                .stage-name {
                    color: #ffd700;
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                .stage-details {
                    color: #aaa;
                    font-size: 0.85rem;
                }

                .stage-enemies {
                    display: flex;
                    gap: 5px;
                }
                .enemy-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    border: 1px solid #555;
                    background: #222;
                }

                .battle-btn {
                    padding: 8px 20px;
                    background: linear-gradient(180deg, #ff9800 0%, #e65100 100%);
                    border: 1px solid #ffb74d;
                    color: white;
                    font-weight: bold;
                    border-radius: 20px;
                    cursor: pointer;
                    text-transform: uppercase;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    transition: transform 0.1s;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .battle-btn:hover {
                    transform: scale(1.05);
                    filter: brightness(1.1);
                }
                .battle-btn:active {
                    transform: scale(0.95);
                }
                /* Custom Scrollbar */
                .stage-list-container::-webkit-scrollbar {
                    width: 8px;
                }
                .stage-list-container::-webkit-scrollbar-track {
                    background: #1a1005;
                }
                .stage-list-container::-webkit-scrollbar-thumb {
                    background: #5c401a;
                    border-radius: 4px;
                }
            </style>
        `;

        // Render List
        const listContainer = this.container.querySelector('.stage-list');
        if (listContainer) {
            JADE_LOTUS_SHRINE_STAGES.forEach(stage => {
                const row = document.createElement('div');
                row.className = 'stage-row';

                // Enemy HTML
                const enemiesHtml = stage.enemies.map(src => `<img src="${src}" class="enemy-icon" onerror="this.style.display='none'"/>`).join('');

                row.innerHTML = `
                    <div class="stage-info">
                        <div class="stage-name">${stage.name}</div>
                        <div class="stage-details">Rec. Level: ${stage.recommendedLevel}</div>
                    </div>
                    <div class="stage-enemies">
                        ${enemiesHtml}
                    </div>
                    <button class="battle-btn" data-id="${stage.id}">
                        ⚡ Battle
                    </button>
                `;

                // Battle Click
                const btn = row.querySelector('.battle-btn');
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log(`[Adventure] Starting Battle for Stage ${stage.id}`);
                        // Placeholder action
                        alert(`Starting Battle: ${stage.name}`);
                    });
                }

                listContainer.appendChild(row);
            });
        }

        // Close Event
        this.container.querySelector('.close-btn')?.addEventListener('click', () => {
            this.close();
        });
    }
}
