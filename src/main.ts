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
        { id: 1, name: 'Waterfall Peak', x: 44, y: 2, width: 26, z: 1 },      // Top-left waterfall mountain
        { id: 2, name: 'Golden Palace', x: 18, y: 22, width: 40, z: 1 },     // Main central island (large)
        { id: 3, name: 'Cherry Temple', x: 41, y: 54, width: 20, z: 4 },      // Top-right cherry blossom
        { id: 4, name: 'Volcanic Pit', x: 70, y: 0, width: 24, z: 1 },       // Left volcano island
        { id: 5, name: 'Lotus Shrine', x: 54, y: 28, width: 26, z: 3 },       // Top-center pagoda
        { id: 6, name: 'Red Pagoda', x: 20, y: 53, width: 30, z: 4 },        // Center-right temple
        { id: 7, name: 'Shadow Temple', x: 22, y: -10, width: 22, z: 1 },     // Bottom-center dark temple
        { id: 8, name: 'Desert Fortress', x: 80, y: 47, width: 24, z: 1 },   // Bottom-right desert
        { id: 9, name: 'Grand Mainland', x: -10, y: 35, width: 26, z: 1 },    // Large mainland piece
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
        img.src = `/assets/map/${island.id}.png`;
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


