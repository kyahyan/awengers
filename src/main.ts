import './style.css'
import { GameManager } from './core/GameManager';

const game = new GameManager();
// @ts-ignore
window.game = game;

// Add interactive map islands to map layer
const mapLayer = document.getElementById('map-layer');
if (mapLayer) {
    // Define island pieces with their positions (based on reference layout)
    // Positions are percentages from top-left of the map container
    const islands = [
        { id: 1, name: 'The Jade Lotus Shrine', file: '1.png', x: 44, y: 2, width: 26, z: 1 },
        { id: 2, name: 'The Imperial Stronghold', file: '2.png', x: 18, y: 22, width: 40, z: 1 },
        { id: 3, name: 'The Solitary Grove', file: '3.png', x: 41, y: 54, width: 20, z: 4 },
        { id: 4, name: 'The Sakura Dreamscape', file: '4.png', x: 70, y: 0, width: 24, z: 1 },
        { id: 5, name: 'The Sunset Temple', file: '5.png', x: 54, y: 28, width: 26, z: 3 },
        { id: 6, name: 'The Necro-Swamp', file: '6.png', x: 20, y: 53, width: 30, z: 4 },
        { id: 7, name: 'Skull Rock Cavern', file: '7.png', x: 22, y: -10, width: 22, z: 1 },
        { id: 8, name: 'The Dusty Ruins', file: '8.png', x: 80, y: 47, width: 24, z: 1 },
        { id: 9, name: 'The Dragon’s Maw', file: '9.png', x: -10, y: 35, width: 26, z: 1 },
    ];

    islands.forEach(island => {
        const wrapper = document.createElement('div');
        wrapper.className = 'map-island';
        wrapper.dataset.islandId = String(island.id);
        wrapper.dataset.islandName = island.name;
        wrapper.style.left = `${island.x}%`;
        wrapper.style.top = `${island.y}%`;
        wrapper.style.width = `${island.width}%`;
        wrapper.style.zIndex = String(island.z);

        const img = document.createElement('img');
        // Use custom file name if provided, otherwise default to png
        // @ts-ignore
        const fileName = island.file || `${island.id}.png`;
        img.src = `/assets/map/${fileName}`;
        img.alt = island.name;
        img.draggable = false;

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'island-tooltip';
        tooltip.textContent = island.name;

        wrapper.appendChild(img);
        wrapper.appendChild(tooltip);
        mapLayer.appendChild(wrapper);

        // Click handler
        wrapper.addEventListener('click', () => {
            console.log(`[Map] Clicked: ${island.name} (Island ${island.id})`);

            // Adventure Mode Hook
            if (island.id === 1) {
                // @ts-ignore
                if (window.game && window.game.uiManager) {
                    // @ts-ignore
                    window.game.uiManager.showAdventureModal(island.id);
                }
            }

            // You can dispatch a custom event or call a function here
            const event = new CustomEvent('islandClick', { detail: island });
            document.dispatchEvent(event);
        });
    });

    // Add decorative assets (non-clickable)
    const decorativeAssets = [
        { src: '/assets/map/asset-1.png', x: 41, y: 31, width: 28, z: 2 },   // Left side decoration
        { src: '/assets/map/asset-2.png', x: 52, y: 45, width: 5, z: 5 },  // Right side decoration
    ];

    decorativeAssets.forEach(asset => {
        const assetEl = document.createElement('img');
        assetEl.src = asset.src;
        assetEl.className = 'map-decoration';
        assetEl.style.position = 'absolute';
        assetEl.style.left = `${asset.x}%`;
        assetEl.style.top = `${asset.y}%`;
        assetEl.style.width = `${asset.width}%`;
        assetEl.style.zIndex = String(asset.z);
        assetEl.style.pointerEvents = 'none';
        assetEl.draggable = false;
        mapLayer.appendChild(assetEl);
    });
}


