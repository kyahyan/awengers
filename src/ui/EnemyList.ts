
export interface EnemyData {
    name: string; // Boss Name
    codeName: string;
    role: string; // Class/Role or Element
    vibe: string;
    ability: string;
    imagePath?: string;
    category: 'Gatekeeper' | 'Dragon Lord';
}

export class EnemyList {
    private container: HTMLElement;
    private enemies: EnemyData[];

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'hero-list-container enemy-list-container'; // Reuse basic list styles but maybe override?

        this.enemies = [
            // GATEKEEPERS (Minion Bosses)
            {
                name: 'Beast Guard 2',
                codeName: 'Beta Sentry',
                role: 'Tank',
                vibe: 'A robotic/armored bulldog.',
                ability: '"Iron Skin" - Reduces all incoming damage by 50% for 5 seconds.',
                category: 'Gatekeeper'
            },
            {
                name: 'Beast Guard 3',
                codeName: 'Gamma Warden',
                role: 'Bruiser',
                vibe: 'A heavy-weapon mutant guard.',
                ability: '"Ground Slam" - Stuns your hero for 1 second.',
                category: 'Gatekeeper'
            },
            {
                name: 'Beast Guard 5',
                codeName: 'Epsilon Brute',
                role: 'Berserker',
                vibe: 'Massive, enraged beast.',
                ability: '"Rage Mode" - At 30% HP, he turns red and attacks 2x faster.',
                category: 'Gatekeeper'
            },
            {
                name: 'Fox Warrior',
                codeName: 'Kitsune Ronin',
                role: 'Assassin',
                vibe: 'Samurai fox with dual swords.',
                ability: '"Shadow Step" - Teleports behind your hero to dodge an attack.',
                category: 'Gatekeeper'
            },
            {
                name: 'Raging Bull',
                codeName: 'Minotaur Prime',
                role: 'Boss Tank',
                vibe: 'Cyborg Minotaur.',
                ability: '"Charge" - knocks your hero back 5 units.',
                category: 'Gatekeeper'
            },

            // DRAGON LORDS (End Game Bosses)
            {
                name: 'Fire Dragon',
                codeName: 'Ignis the Consumer',
                role: 'Fire',
                vibe: 'Covered in magma.',
                ability: '"Inferno" - Deals continuous burn damage (DOT) to your hero every second.',
                category: 'Dragon Lord'
            },
            {
                name: 'Ice Dragon',
                codeName: 'Glacies the Frozen',
                role: 'Ice',
                vibe: 'Made of jagged crystal shards.',
                ability: '"Deep Freeze" - Slows your hero\'s attack speed by 50%.',
                category: 'Dragon Lord'
            },
            {
                name: 'Sand Dragon',
                codeName: 'Dune Scourge',
                role: 'Earth',
                vibe: 'Skeletal dragon surrounded by dust.',
                ability: '"Sandstorm" - Lowers your hero\'s accuracy (you see "MISS" text pop up).',
                category: 'Dragon Lord'
            },
            {
                name: 'Wind Dragon',
                codeName: 'Zephyr the Torn',
                role: 'Air',
                vibe: 'Ghostly, transparent dragon.',
                ability: '"Tornado" - Launches your hero into the air (interrupts attacks).',
                category: 'Dragon Lord'
            }
        ];
    }

    public getElement(): HTMLElement {
        this.render();
        return this.container;
    }

    private render() {
        this.container.innerHTML = '';

        // Header for separation (Optional, but good since we mix them)
        // Actually let's just render cards.

        this.enemies.forEach(enemy => {
            const card = document.createElement('div');
            card.className = 'hero-card enemy-card'; // Add enemy-card class

            // Visual distinction for Dragon Lords
            if (enemy.category === 'Dragon Lord') {
                card.style.borderColor = '#9933ff'; // Purple for Dragons
                card.style.boxShadow = '0 0 10px #9933ff';
            } else {
                card.style.borderColor = '#cc3300'; // Redish for Gatekeepers
            }

            // Header (Role icon?)
            const header = document.createElement('div');
            header.className = 'card-header';

            const roleIcon = document.createElement('div');
            roleIcon.className = 'class-icon';
            roleIcon.style.backgroundColor = '#555';
            roleIcon.innerText = enemy.role[0];
            roleIcon.title = `${enemy.role}\n${enemy.category}`;

            header.appendChild(roleIcon);
            card.appendChild(header);

            // Image (Placeholder)
            const img = document.createElement('img');
            img.className = 'hero-image';
            img.src = enemy.imagePath || `https://via.placeholder.com/100x140/330000/ffffff?text=${enemy.codeName.split(' ')[0]}`;
            img.alt = enemy.name;
            img.title = `${enemy.name}\n${enemy.vibe}\nAbility: ${enemy.ability}`;
            card.appendChild(img);

            // Footer
            const footer = document.createElement('div');
            footer.className = 'card-footer';

            const nameLabel = document.createElement('div');
            nameLabel.style.fontSize = '10px';
            nameLabel.style.textAlign = 'center';
            nameLabel.style.width = '100%';
            nameLabel.style.overflow = 'hidden';
            nameLabel.style.textOverflow = 'ellipsis';
            nameLabel.style.whiteSpace = 'nowrap';
            nameLabel.innerText = enemy.codeName;
            footer.appendChild(nameLabel);

            // Ability hint maybe?
            const abilityLabel = document.createElement('div');
            abilityLabel.style.fontSize = '8px';
            abilityLabel.style.color = '#aaa';
            abilityLabel.style.textAlign = 'center';
            abilityLabel.innerText = enemy.ability.split(' - ')[0].replace(/"/g, ''); // Just the ability name
            footer.appendChild(abilityLabel);

            card.appendChild(footer);

            this.container.appendChild(card);
        });
    }
}
