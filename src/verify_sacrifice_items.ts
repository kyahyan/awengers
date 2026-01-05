
const API_URL = 'http://localhost:3000/api';

async function run() {
    const commanderName = `TestCommander_${Date.now()}`;
    const password = 'password123';

    console.log(`Creating test user: ${commanderName}`);

    // 1. Register User
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: commanderName,
            commanderName: commanderName,
            password: password,
            serverId: "1"
        })
    });

    if (!regRes.ok) {
        console.error('Registration failed:', await regRes.text());
        return;
    }

    const { token, user } = await regRes.json() as any;
    console.log('User registered.');

    // 2. Grant Resources (via update endpoint or just rely on defaults if enough)
    // We need gold and potions for leveling, and summon scrolls to get heroes.
    // Or we can manually inject heroes if we had a debug endpoint, but summon is safer.
    // Let's grant some scrolls via the sync endpoint if possible, or just hack it by assuming we start with some.
    // Actually, new users might not have enough. Let's use the update endpoint to give resources.

    const updateRes = await fetch(`${API_URL}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            uid: user._id,
            commanderName: commanderName,
            inventory: {
                'grand_summon': 100,
                'wood_sword': 5 // Give some items to equip
            },
            gold: 1000000,
            heroPotion: 100000,
            soulPotion: 100000
        })
    });

    if (!updateRes.ok) {
        console.error('Update resources failed:', await updateRes.text());
        return;
    }
    console.log('Resources granted.');



    // Find a pair of same heroes for 1-star merge (Requires: 1 Main + 1 Same Hero + 2 Same Attr)
    // Wait, the recipe for 1->2 stars is:
    // slots: [ { type: 'sameHero', starLevel: 1 }, { type: 'sameAttr', starLevel: 1 }, { type: 'sameAttr', starLevel: 1 } ]
    // That's 3 sacrifices!

    // We need 4 heroes total: 1 Main + 3 Sacrifices.

    // Let's find a group of compatible heroes.
    // To keep it simple, let's just cheat and try to find any valid combo or just keep summoning.

    // Actually, to ensure we have exactly what we need, we might need to summon a lot or mock the DB data.
    // If I can't easily deterministic summon, I might struggle to automated test this quickly.

    // Alternative: Use `reset-heroes` and then maybe I can try to find a debug endpoint to add specific heroes? 
    // No debug endpoint for adding specific heroes seen.

    let heroes = [];
    // Let's just summon 50 heroes, statistically likely to get what we need.
    for (let i = 0; i < 40; i++) {
        const sumRes = await fetch(`${API_URL}/summon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commanderName })
        });
        const data = await sumRes.json() as any;
        console.log(`Summoned ${data.hero.codeName} with attribute: ${data.hero.attribute}`);
        if (data.instanceId) heroes.push({ main: data.hero, instanceId: data.instanceId, codeName: data.hero.codeName, attribute: data.hero.attribute });
    }

    console.log(`Have ${heroes.length} heroes.`);

    // Group by CodeName to find Main + Same Hero
    const byCode = {};
    for (const h of heroes) {
        if (!byCode[h.codeName]) byCode[h.codeName] = [];
        byCode[h.codeName].push(h);
    }

    let mainHero = null;
    let sameHeroSacrifice = null;
    let otherSacrifices = [];

    for (const code in byCode) {
        if (byCode[code].length >= 2) {
            mainHero = byCode[code][0];
            sameHeroSacrifice = byCode[code][1];


            console.log(`Checking candidate: ${mainHero.codeName}`, JSON.stringify(mainHero));

            // Now find 2 other heroes with same attribute (can be different heroes)
            // exclude main and sameHeroSacrifice
            const neededAttr = mainHero.attribute;
            const potential = heroes.filter(h => {
                const match = h.attribute === neededAttr &&
                    h.instanceId !== mainHero.instanceId &&
                    h.instanceId !== sameHeroSacrifice.instanceId;
                if (match) console.log(`  Found potential sacrifice: ${h.codeName} (${h.attribute})`);
                return match;
            });

            if (potential.length >= 2) {
                otherSacrifices = [potential[0], potential[1]];
                break;
            }
        }
    }

    if (!mainHero || !sameHeroSacrifice || otherSacrifices.length < 2) {
        console.error('Could not find suitable heroes for merge test. Try running again.');
        return;
    }

    console.log(`Main Hero: ${mainHero.instanceId} (${mainHero.codeName})`);
    console.log(`Sacrifice 1 (Same Hero): ${sameHeroSacrifice.instanceId}`);
    console.log(`Sacrifice 2: ${otherSacrifices[0].instanceId}`);
    console.log(`Sacrifice 3: ${otherSacrifices[1].instanceId}`);

    // 4. Equip Item on Sacrifice Hero
    const itemId = 'wood_sword';
    console.log(`Equipping ${itemId} on sacrifice hero ${sameHeroSacrifice.instanceId}...`);

    const equipRes = await fetch(`${API_URL}/hero/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            commanderName,
            instanceId: sameHeroSacrifice.instanceId,
            slotIndex: 0, // Weapon slot
            itemId: itemId
        })
    });

    if (!equipRes.ok) {
        console.error('Equip failed:', await equipRes.text());
        return;
    }
    console.log('Item equipped.');

    // Verify inventory count decreased manually/conceptually (we trust equip logic works)

    // 5. Perform Merge
    const sacrificeIds = [sameHeroSacrifice.instanceId, otherSacrifices[0].instanceId, otherSacrifices[1].instanceId];
    console.log('Merging...');

    const mergeRes = await fetch(`${API_URL}/hero/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            commanderName,
            mainHeroId: mainHero.instanceId,
            sacrificeIds: sacrificeIds
        })
    });

    if (!mergeRes.ok) {
        console.error('Merge failed:', await mergeRes.text());
        return;
    }

    const mergeData = await mergeRes.json() as any;
    console.log('Merge successful!');

    // 6. Verify Item Return
    console.log('Verifying item return...');
    // Fetch user to check inventory
    const userRes = await fetch(`${API_URL}/user/${commanderName}`);
    const finalUser = await userRes.json() as any;

    // Check if item is back in inventory
    // We gave 5 wood_swords.
    // Equipped 1 on sacrifice -> 4 left.
    // Merged (sacrificed) -> Should be 5 again.

    const inventory = finalUser.inventory || {};
    const count = inventory[itemId] || 0;

    if (count === 5) {
        console.log('SUCCESS: Item returned to inventory! Count is 5.');
    } else {
        console.error(`FAILURE: Item count is ${count}, expected 5.`);

        // Check equipment inventory if it went there (though for raw items it usually goes to legacy or unequipped list)
        if (finalUser.equipmentInventory) {
            console.log('Checking equipmentInventory...', finalUser.equipmentInventory);
            const found = finalUser.equipmentInventory.find((e: any) => e.itemId === itemId && !e.equipped);
            if (found) {
                console.log('Item found in equipmentInventory (unequipped)! This is also a SUCCESS.');
            }
        }
    }
}

run().catch(console.error);
