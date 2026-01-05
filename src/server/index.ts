
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import { User } from './models/User.js';
import { Server } from './models/Server.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB().then(async () => {
    // Seed Servers
    try {
        const count = await Server.countDocuments();
        if (count === 0) {
            console.log('Seeding Servers...');
            await Server.insertMany([
                { id: "1", name: "Server 1 (Alpha)", limit: 100 },
                { id: "2", name: "Server 2 (Beta)", limit: 100 },
                { id: "3", name: "Server 3 (Gamma)", limit: 100 }
            ]);
            console.log('Servers seeded.');
        }
    } catch (e) {
        console.error("Server Seeding Error:", e);
    }

    // Seed Super Admin
    try {
        const adminExists = await User.findOne({ role: 'superadmin' });
        if (!adminExists) {
            console.log('Seeding Super Admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123Qwe1!', salt);

            await User.create({
                username: 'awengers',
                commanderName: 'Admin',
                password: hashedPassword,
                role: 'superadmin',
                level: 1,
                currentXp: 0,
                maxXp: 100,
                rankTitle: 'Scout',
                rankIcon: 'Paw Print',
                vipPoints: 100000,
                gems: 999999,
                gold: 999999999,
                serverId: '1'
            });
            console.log('Super Admin Created: Commander "Admin", Password "admin123"');
        } else {
            console.log('Super Admin already exists. Updating to Server 1...');
            // Force move to Server 1 if not already
            if (adminExists.serverId !== '1') {
                adminExists.serverId = '1';
                await adminExists.save();
                console.log('Super Admin moved to Server 1.');
            }
        }
    } catch (e) {
        console.error("Seeding Error:", e);
    }
});

// Routes
app.get('/', (_req, res) => {
    res.send('Awengers API is running');
});

const SERVER_LIMIT = 100;
const SERVERS = [
    { id: "1", name: "Server 1 (Alpha)" },
    { id: "2", name: "Server 2 (Beta)" },
    { id: "3", name: "Server 3 (Gamma)" }
];

// GET Servers with Population
app.get('/api/servers', async (_req, res) => {
    try {
        const stats = await Promise.all(SERVERS.map(async (s) => {
            const count = await User.countDocuments({ serverId: s.id });
            return {
                ...s,
                count,
                limit: SERVER_LIMIT,
                isFull: count >= SERVER_LIMIT
            };
        }));
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// AUTH: Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, commanderName, password, serverId } = req.body;

        // Validation
        if (!username || !commanderName || !password || !serverId) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        // Validate Server
        const validServer = SERVERS.find(s => s.id === serverId);
        if (!validServer) return res.status(400).json({ message: 'Invalid Server ID' });

        // Check Server Capacity
        const serverCount = await User.countDocuments({ serverId });
        if (serverCount >= SERVER_LIMIT) {
            return res.status(400).json({ message: 'Server is full (Max 100 players)' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username taken' });

        const existingCmdr = await User.findOne({ commanderName });
        if (existingCmdr) return res.status(400).json({ message: 'Commander Name taken' });

        // Hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            commanderName,
            password: hashedPassword,
            serverId
        });

        // Token
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// AUTH: Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: sanitizeUser(user) }); // Return full user profile for game load
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// GET User Profile (Protected logic can be added later)
app.get('/api/user/:name', async (req, res) => {
    try {
        // Use .lean() to ensure Mongoose Maps are converted to plain objects for JSON response
        const user = await User.findOne({ commanderName: req.params.name }).select('-password').lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// CREATE or UPDATE User Profile (Sync)
app.post('/api/user', async (req, res) => {
    try {
        const { commanderName, ...data } = req.body;
        const id = req.body._id || req.body.uid;

        // Basic security: In a real app we'd verify the token matches the commanderName

        // Update user data (excluding critical auth fields from generic update)
        delete data.password;
        delete data.role;
        delete data._id; // Don't try to update immutable id
        delete data.username; // Username is immutable

        // Debug log for inventory
        if (data.inventory) {
            console.log(`[Sync] Updating inventory for ${commanderName}:`, data.inventory);
        }
        if (data.stats) {
            console.log(`[Sync] Updating stats for ${commanderName} (Heroes Collected: ${Object.keys(data.stats.heroUsage || {}).length})`);
        }

        let user;
        if (id) {
            user = await User.findByIdAndUpdate(
                id,
                { $set: { ...data, commanderName } }, // Allow name change if ID is present
                { new: true }
            ).select('-password').lean();
        } else {
            // Fallback for legacy calls
            user = await User.findOneAndUpdate(
                { commanderName },
                { $set: data },
                { new: true }
            ).select('-password').lean();
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// Reset Heroes Endpoint (Dev tool)
app.post('/api/reset-heroes', async (req, res) => {
    try {
        const { commanderName } = req.body;
        if (!commanderName) {
            return res.status(400).json({ message: 'commanderName required' });
        }

        const user = await User.findOneAndUpdate(
            { commanderName },
            { $set: { 'stats.heroUsage': {} } },
            { new: true }
        ).select('-password').lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[Reset] Heroes reset for ${commanderName}`);
        res.json({ message: 'Heroes reset successfully', user });
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// Utility: Get All Heroes for Summon
// Utility: Get All Heroes for Summon
import { HERO_DEFINITIONS, HeroDef } from '../data/HeroDefinitions.js'; // Note .js extension for ESM
import { createOryxHero, createSableHero, createRazorHero, createTauronHero, createBarrukHero, HeroProgressionManager } from '../data/HeroProgression.js';

// Extended type that includes attribute info
interface HeroWithAttribute extends HeroDef {
    attribute: 'STR' | 'AGI' | 'INT';
}

const ALL_HEROES: HeroWithAttribute[] = [];
// Map category keys to attribute codes
const CATEGORY_TO_ATTR: Record<string, 'STR' | 'AGI' | 'INT'> = {
    'Strength': 'STR',
    'Agility': 'AGI',
    'Intelligence': 'INT'
};
Object.entries(HERO_DEFINITIONS).forEach(([category, list]: [string, any[]]) => {
    const attr = CATEGORY_TO_ATTR[category] || 'STR';
    list.forEach(hero => {
        ALL_HEROES.push({ ...hero, attribute: attr });
    });
});

// Helper to get manager for a hero
function getHeroManager(heroCodeName: string, heroData: any): HeroProgressionManager {
    const nameLower = heroCodeName.toLowerCase();
    const level = heroData?.level || 1;

    // We need to fully reconstruct the instance state if it exists
    const instance = heroData ? {
        heroId: heroData.heroId,
        level: heroData.level,
        currentRankIndex: heroData.currentRankIndex || 0,
        experience: heroData.experience || 0,
        skillLevels: heroData.skillLevels || {},
        equipment: heroData.equipment || new Array(9).fill(null)
    } : undefined;

    if (nameLower.includes('ranger') || nameLower.includes('sable')) {
        return createSableHero(level, instance);
    } else if (nameLower.includes('barruk') || nameLower.includes('hunter')) {
        return createBarrukHero(level, instance);
    } else if (nameLower.includes('razor') || nameLower.includes('assassin')) {
        return createRazorHero(level, instance);
    } else if (nameLower.includes('tauron') || nameLower.includes('spiritwalker')) {
        return createTauronHero(level, instance);
    } else {
        return createOryxHero(level, instance);
    }
}

// Helper to sanitize user object for response (handle Map serialization)
const sanitizeUser = (user: any) => {
    const userObj = user.toObject({ getters: true });

    // Explicitly convert Maps to Objects if they are still Maps or empty objects
    if (user.heroes && user.heroes instanceof Map) {
        userObj.heroes = Object.fromEntries(user.heroes);
    } else if (!userObj.heroes || Object.keys(userObj.heroes).length === 0) {
        if (user.heroes && user.heroes instanceof Map) {
            userObj.heroes = Object.fromEntries(user.heroes);
        }
    }

    // Fix for stats.heroUsage (Nested Map)
    if (user.stats && user.stats.heroUsage && user.stats.heroUsage instanceof Map) {
        if (!userObj.stats) userObj.stats = {};
        userObj.stats.heroUsage = Object.fromEntries(user.stats.heroUsage);
    } else if (userObj.stats && (!userObj.stats.heroUsage || Object.keys(userObj.stats.heroUsage).length === 0)) {
        // Fallback if toObject fail validation or something
        if (user.stats && user.stats.heroUsage instanceof Map) {
            userObj.stats.heroUsage = Object.fromEntries(user.stats.heroUsage);
        }
    }

    // Fix for inventory (Map)
    if (user.inventory && user.inventory instanceof Map) {
        userObj.inventory = Object.fromEntries(user.inventory);
    } else if (!userObj.inventory || Object.keys(userObj.inventory).length === 0) {
        if (user.inventory && user.inventory instanceof Map) {
            userObj.inventory = Object.fromEntries(user.inventory);
        }
    }

    return userObj;
};

// SUMMON Endpoint
app.post('/api/summon', async (req, res) => {
    try {
        const { commanderName } = req.body;
        if (!commanderName) return res.status(400).json({ message: 'commanderName required' });

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check Resources
        const inventory = user.inventory || new Map();
        const currentScrolls = inventory.get('grand_summon') || 0;

        if (currentScrolls < 1) {
            return res.status(400).json({ message: 'Not enough Grand Summon Scrolls' });
        }

        // Deduct Resource
        inventory.set('grand_summon', currentScrolls - 1);
        user.inventory = inventory;

        // Pick Hero
        if (ALL_HEROES.length === 0) return res.status(500).json({ message: 'Hero pool empty' });

        const rand = Math.floor(Math.random() * ALL_HEROES.length);
        const hero = ALL_HEROES[rand];

        // Update Stats (Heroes Collected)
        const userAny = user as any;
        if (!userAny.stats) userAny.stats = {};
        if (!userAny.stats.heroUsage) userAny.stats.heroUsage = new Map();

        const usageMap = userAny.stats.heroUsage;
        const currentCount = usageMap.get(hero.codeName) || 0;
        usageMap.set(hero.codeName, currentCount + 1);

        // Initialize Hero Persistence (Always create new instance)
        if (!userAny.heroes) userAny.heroes = new Map();

        // Generate Unique Instance ID (e.g. razor_17361234_abc)
        const instanceId = `${hero.codeName.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const manager = getHeroManager(hero.codeName, null);
        const newInstance = manager.getHeroInstance();
        (newInstance as any).heroCodeName = hero.codeName;
        (newInstance as any).stars = 1; // All new heroes start at 1 star
        (newInstance as any).attribute = hero.attribute; // STR, AGI, or INT from hero category

        userAny.heroes.set(instanceId, newInstance);
        console.log(`[Summon] ${commanderName} summoned new instance: ${instanceId} (${hero.class})`);

        // Ensure heroes Map is marked modified
        user.markModified('heroes');

        user.markModified('stats.heroUsage');
        user.markModified('inventory');
        await user.save();

        console.log(`[Summon] ${commanderName} summoned ${hero.name}`);
        res.json({
            hero,
            remainingScrolls: currentScrolls - 1,
            user: sanitizeUser(user), // Return updated user state
            instanceId: instanceId
        });

    } catch (error) {
        console.error("Summon Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// LEVEL UP Endpoint
app.post('/api/hero/levelup', async (req, res) => {
    try {
        const { commanderName, instanceId } = req.body;
        if (!commanderName || !instanceId) return res.status(400).json({ message: 'Missing fields' });

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;

        if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
            return res.status(404).json({ message: 'Hero instance not found' });
        }

        const heroData = userAny.heroes.get(instanceId);
        console.log(`[LevelUp] heroData from DB:`, JSON.stringify({ stars: heroData?.stars, heroCodeName: heroData?.heroCodeName, level: heroData?.level }));
        // Fallback: if heroCodeName is missing in instance (legacy), we might need to derive it or fail.
        // For now assume new instances have it or legacy keys are codeNames.
        const heroCodeName = heroData.heroCodeName || instanceId; // Legacy support: key was codeName

        const manager = getHeroManager(heroCodeName, heroData);

        // Prepare Inventory Interface (Read from top-level)
        const playerInventory = {
            gold: user.gold || 0,
            heroPotion: user.heroPotion || 0,
            soulPotion: user.soulPotion || 0
        };

        console.log(`[LevelUp] Player ${commanderName} inventory:`, playerInventory);
        const cost = manager.getNextLevelCost(heroData.level || 1);
        console.log(`[LevelUp] Cost to level up from ${heroData.level || 1}:`, cost);

        // Check if can level up (for specific reason)
        const check = manager.canLevelUp(playerInventory);
        if (!check.canLevel) {
            console.log(`[LevelUp] Cannot level up: ${check.reason}`);
            return res.status(400).json({ message: 'Level Up Failed', reason: check.reason });
        }

        // Attempt Level Up
        const result = manager.performLevelUp(playerInventory);

        if (!result.success) {
            return res.status(400).json({ message: 'Level Up Failed', reason: 'Unknown error' });
        }

        // Commit Changes

        // FIX: Update top-level schema fields
        user.gold = result.newInventory.gold;
        user.soulPotion = result.newInventory.soulPotion;
        // user.inventory is not used for these resources anymore

        // Preserve metadata that isn't part of the manager's instance
        console.log(`[LevelUp] Before save - heroData.stars: ${heroData.stars}`);
        const updatedInstance = {
            ...manager.getHeroInstance(),
            heroCodeName: heroData.heroCodeName,
            stars: heroData.stars || 1,
            attribute: heroData.attribute
        };
        console.log(`[LevelUp] Saving updatedInstance with stars: ${updatedInstance.stars}`);
        userAny.heroes.set(instanceId, updatedInstance);
        user.markModified('heroes'); // Vital for Map updates

        await user.save();

        console.log(`[LevelUp] ${commanderName} leveled ${instanceId} to ${manager.getCurrentLevel()}`);

        res.json({
            success: true,
            newLevel: manager.getCurrentLevel(),
            newStats: result.newStats,
            user: sanitizeUser(user)
        });


    } catch (error) {
        console.error("LevelUp Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// BULK LEVEL UP Endpoint (Level up multiple times at once)
app.post('/api/hero/levelup-bulk', async (req, res) => {
    try {
        const { commanderName, instanceId, levels } = req.body;
        if (!commanderName || !instanceId || !levels) return res.status(400).json({ message: 'Missing fields' });

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;

        if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
            return res.status(404).json({ message: 'Hero instance not found' });
        }

        const heroData = userAny.heroes.get(instanceId);
        const heroCodeName = heroData.heroCodeName || instanceId;

        let manager = getHeroManager(heroCodeName, heroData);
        const currentLevel = manager.getCurrentLevel();
        const currentLevelCap = manager.getCurrentLevelCap();
        const maxLevels = Math.min(levels, currentLevelCap - currentLevel);

        if (maxLevels <= 0) {
            return res.status(400).json({ message: 'Already at level cap' });
        }

        // Calculate total cost for all levels
        let totalGold = 0;
        let totalSoulPotion = 0;
        for (let i = 0; i < maxLevels; i++) {
            const cost = manager.getNextLevelCost(currentLevel + i);
            totalGold += cost.gold;
            totalSoulPotion += cost.soulPotion;
        }

        // Check resources
        if ((user.gold || 0) < totalGold || (user.soulPotion || 0) < totalSoulPotion) {
            return res.status(400).json({
                message: 'Insufficient resources',
                reason: `Need ${totalGold} Gold and ${totalSoulPotion} Soul Potions`
            });
        }

        // Perform all level ups
        for (let i = 0; i < maxLevels; i++) {
            const playerInventory = {
                gold: user.gold || 0,
                heroPotion: user.heroPotion || 0,
                soulPotion: user.soulPotion || 0
            };

            const result = manager.performLevelUp(playerInventory);
            if (!result.success) {
                break;
            }

            user.gold = result.newInventory.gold;
            user.soulPotion = result.newInventory.soulPotion;
        }

        // Preserve metadata that isn't part of the manager's instance
        const updatedInstance = {
            ...manager.getHeroInstance(),
            heroCodeName: heroData.heroCodeName,
            stars: heroData.stars || 1,
            attribute: heroData.attribute
        };
        userAny.heroes.set(instanceId, updatedInstance);
        user.markModified('heroes');

        await user.save();

        console.log(`[BulkLevelUp] ${commanderName} leveled ${instanceId} from ${currentLevel} to ${manager.getCurrentLevel()}`);

        res.json({
            success: true,
            newLevel: manager.getCurrentLevel(),
            levelsGained: manager.getCurrentLevel() - currentLevel,
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("BulkLevelUp Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// RANK UP Endpoint
app.post('/api/hero/rankup', async (req, res) => {
    try {
        const { commanderName, instanceId } = req.body;
        if (!commanderName || !instanceId) return res.status(400).json({ message: 'Missing fields' });

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
            return res.status(400).json({ message: 'Hero instance not found' });
        }

        const heroData = userAny.heroes.get(instanceId);
        // Legacy fallback
        const heroCodeName = heroData.heroCodeName || instanceId;

        const manager = getHeroManager(heroCodeName, heroData);

        // AUTO-FIX LEGACY ACCOUNTS:
        // formatting note: 'gold' existed but 'heroPotion' is new. 
        // If undefined, grant a starter pack so they aren't stuck.
        if (user.heroPotion === undefined || user.heroPotion === null) {
            console.log(`[RankUp] Legacy account detected with no Hero Potions. Granting starter pack.`);
            user.heroPotion = 1000;
            // Also check soul potions
            if (user.soulPotion === undefined || user.soulPotion === null) user.soulPotion = 5000;
            // Also ensure gold is sufficient for testing if it's low (optional, but safe)
            if ((user.gold || 0) < 1000) user.gold = 10000;

            await user.save();
        }

        // Prepare Inventory Interface (Read from top-level)
        const playerInventory = {
            gold: user.gold || 0,
            heroPotion: user.heroPotion || 0,
            soulPotion: user.soulPotion || 0
        };

        // Get hero's star level for star-gating check
        const heroStars = heroData.stars || 1;

        // Check if can rank up (includes star requirement check)
        const check = manager.canRankUp(playerInventory, heroStars);
        if (!check.canRankUp) {
            console.log(`[RankUp] Cannot rank up: ${check.reason}`);
            return res.status(400).json({ message: 'Rank Up Failed', reason: check.reason });
        }

        // Attempt Rank Up
        const result = manager.performRankUp(playerInventory, heroStars);

        if (!result.success) {
            const failure = result as any;
            console.error(`[RankUp] Failed: ${failure.reason || 'Unknown'} (Gold: ${playerInventory.gold}, HP: ${playerInventory.heroPotion})`);
            return res.status(400).json({ message: 'Rank Up Failed', reason: failure.reason });
        }

        // Commit Changes (Update top-level fields)
        user.gold = result.newInventory.gold;
        user.heroPotion = result.newInventory.heroPotion; // Update Hero Potion
        // soul potion unchanged for rank up

        // Preserve metadata that isn't part of the manager's instance
        console.log(`[RankUp] Before save - heroData.stars: ${heroData.stars}, heroStars: ${heroStars}`);
        const updatedInstance = {
            ...manager.getHeroInstance(),
            heroCodeName: heroData.heroCodeName,
            stars: heroData.stars || 1,
            attribute: heroData.attribute
        };
        console.log(`[RankUp] Saving updatedInstance with stars: ${updatedInstance.stars}`);
        userAny.heroes.set(instanceId, updatedInstance);
        user.markModified('heroes');

        await user.save();

        console.log(`[RankUp] ${commanderName} promoted ${instanceId} to Rank Index ${manager.getHeroInstance().currentRankIndex}`);

        res.json({
            success: true,
            newLevelCap: result.newLevelCap,
            reward: result.reward,
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("RankUp Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// RESET HEROES Endpoint (Dev/Testing)
app.post('/api/hero/reset', async (req, res) => {
    try {
        const { commanderName } = req.body;
        if (!commanderName) return res.status(400).json({ message: 'Missing commanderName' });

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        userAny.heroes = new Map();
        user.markModified('heroes');
        await user.save();

        console.log(`[Reset] Cleared all heroes for ${commanderName}`);
        res.json({ success: true, message: 'All heroes cleared', user: sanitizeUser(user) });
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// DEPLOY TEAM Endpoint
app.post('/api/team/deploy', async (req, res) => {
    try {
        const { commanderName, teamInstanceIds } = req.body;
        if (!commanderName || !teamInstanceIds || !Array.isArray(teamInstanceIds)) {
            return res.status(400).json({ message: 'Missing fields or invalid team format' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update deployed team
        // We might want to validate that the user owns these hero instances, 
        // but for now we trust the client to send valid IDs from its own list.
        (user as any).deployedTeam = teamInstanceIds;

        // Mark as modified since it might be a mixed type or new field
        user.markModified('deployedTeam');

        await user.save();

        console.log(`[Deploy] ${commanderName} deployed team: ${teamInstanceIds.join(', ')}`);

        res.json({
            success: true,
            deployedTeam: teamInstanceIds,
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Deploy Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// MIGRATE HEROES Endpoint - Fix attribute values for existing heroes
app.post('/api/hero/migrate-attributes', async (req, res) => {
    try {
        const { commanderName } = req.body;
        if (!commanderName) return res.status(400).json({ message: 'Missing commanderName' });

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        if (!userAny.heroes || userAny.heroes.size === 0) {
            return res.json({ success: true, message: 'No heroes to migrate', migratedCount: 0 });
        }

        // Build a lookup from hero codeName to attribute
        const heroToAttribute: Record<string, 'STR' | 'AGI' | 'INT'> = {};
        Object.entries(HERO_DEFINITIONS).forEach(([category, list]: [string, any[]]) => {
            const attr = CATEGORY_TO_ATTR[category] || 'STR';
            list.forEach(hero => {
                heroToAttribute[hero.codeName.toLowerCase()] = attr;
            });
        });

        let migratedCount = 0;
        userAny.heroes.forEach((heroData: any, instanceId: string) => {
            // Get heroCodeName from data or extract from instanceId
            let heroCodeName = heroData.heroCodeName;
            if (!heroCodeName) {
                // Extract from instanceId (format: "codename_timestamp_random")
                const parts = instanceId.split('_');
                heroCodeName = parts[0];
            }

            const lookupKey = heroCodeName.toLowerCase().replace(/\s+/g, ' ').trim();
            const correctAttr = heroToAttribute[lookupKey];

            if (correctAttr && heroData.attribute !== correctAttr) {
                console.log(`[Migrate] Fixing ${instanceId}: ${heroData.attribute} -> ${correctAttr}`);
                heroData.attribute = correctAttr;
                migratedCount++;
            }
        });

        user.markModified('heroes');
        await user.save();

        console.log(`[Migrate] Fixed ${migratedCount} heroes for ${commanderName}`);
        res.json({
            success: true,
            message: `Migrated ${migratedCount} heroes`,
            migratedCount,
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Migration Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// MERGE HEROES (Star Upgrade) Endpoint
app.post('/api/hero/merge', async (req, res) => {
    try {
        const { commanderName, mainHeroId, sacrificeIds } = req.body;
        if (!commanderName || !mainHeroId || !sacrificeIds || !Array.isArray(sacrificeIds)) {
            return res.status(400).json({ message: 'Missing fields: commanderName, mainHeroId, sacrificeIds[]' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        if (!userAny.heroes || !userAny.heroes.has(mainHeroId)) {
            return res.status(404).json({ message: 'Main hero not found' });
        }

        const mainHero = userAny.heroes.get(mainHeroId);
        const currentStars = mainHero.stars || 1;

        // Define merge recipes with slot-specific requirements
        // Each slot can have different requirements
        type SlotReq = { type: 'sameHero' | 'sameAttr' | 'specificAttr'; attrType?: 'INT' | 'STR' | 'AGI'; starLevel: number };
        const recipes: Record<number, { slots: SlotReq[] }> = {
            1: {
                slots: [
                    { type: 'sameHero', starLevel: 1 },
                    { type: 'sameAttr', starLevel: 1 },
                    { type: 'sameAttr', starLevel: 1 }
                ]
            },  // 1★ → 2★: 1 Same Hero + 2 Same Attribute Heroes
            2: {
                slots: [
                    { type: 'sameAttr', starLevel: 2 },
                    { type: 'sameAttr', starLevel: 2 },
                    { type: 'sameAttr', starLevel: 2 }
                ]
            }, // 2★ → 3★
            3: {
                slots: [
                    { type: 'sameHero', starLevel: 3 }
                ]
            },  // 3★ → 4★
            4: {
                slots: [
                    { type: 'sameAttr', starLevel: 4 }
                ]
            },  // 4★ → 5★
        };

        if (currentStars >= 5) {
            return res.status(400).json({ message: 'Hero is already max stars (5★)' });
        }

        const recipe = recipes[currentStars];
        if (!recipe) {
            return res.status(400).json({ message: 'Invalid star level for merge' });
        }

        // Validate sacrifice count
        if (sacrificeIds.length !== recipe.slots.length) {
            return res.status(400).json({
                message: `Recipe requires ${recipe.slots.length} sacrifice(s), got ${sacrificeIds.length}`
            });
        }

        // Helper to extract heroCodeName from instanceId (format: "codename_timestamp_random")
        const extractCodeNameFromId = (id: string): string => {
            if (!id) return '';
            const parts = id.split('_');
            let codeNameParts: string[] = [];
            for (const part of parts) {
                // If it's a long number (timestamp), stop
                if (/^\d{10,}$/.test(part)) break;
                codeNameParts.push(part);
            }
            // Title case the code name parts
            return codeNameParts.map(p =>
                p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
            ).join(' ');
        };

        // Validate sacrifices
        const mainHeroCodeName = mainHero.heroCodeName || extractCodeNameFromId(mainHeroId);
        const mainHeroAttribute = mainHero.attribute || 'STR'; // Default to STR if missing

        console.log(`[Merge] Main hero: ${mainHeroId}, codeName: ${mainHeroCodeName}, attribute: ${mainHeroAttribute}`);

        // Validate sacrifices per slot
        for (let i = 0; i < sacrificeIds.length; i++) {
            const sacId = sacrificeIds[i];
            const slotReq = recipe.slots[i];

            if (sacId === mainHeroId) {
                return res.status(400).json({ message: 'Cannot sacrifice the main hero' });
            }
            if (!userAny.heroes.has(sacId)) {
                return res.status(404).json({ message: `Sacrifice hero not found: ${sacId}` });
            }

            const sacHero = userAny.heroes.get(sacId);
            const sacStars = sacHero.stars || 1;
            const sacHeroCodeName = sacHero.heroCodeName || extractCodeNameFromId(sacId);
            const sacAttribute = sacHero.attribute || 'STR';

            console.log(`[Merge] Slot ${i}: Sacrifice ${sacId}, codeName: ${sacHeroCodeName}, stars: ${sacStars}, attr: ${sacAttribute}`);

            // Check star level
            if (sacStars !== slotReq.starLevel) {
                return res.status(400).json({
                    message: `Slot ${i + 1}: Sacrifice must be ${slotReq.starLevel}★, got ${sacStars}★`
                });
            }

            // Check requirement based on slot type
            if (slotReq.type === 'sameHero') {
                if (sacHeroCodeName.toLowerCase() !== mainHeroCodeName.toLowerCase()) {
                    return res.status(400).json({
                        message: `Slot ${i + 1}: Sacrifice must be the same hero (${mainHeroCodeName})`
                    });
                }
            } else if (slotReq.type === 'sameAttr') {
                if (sacAttribute !== mainHeroAttribute) {
                    return res.status(400).json({
                        message: `Slot ${i + 1}: Sacrifice must have same attribute (${mainHeroAttribute})`
                    });
                }
            } else if (slotReq.type === 'specificAttr') {
                if (sacAttribute !== slotReq.attrType) {
                    return res.status(400).json({
                        message: `Slot ${i + 1}: Sacrifice must be ${slotReq.attrType} hero, got ${sacAttribute}`
                    });
                }
            }
        }

        // All validations passed - perform merge
        // 1. Remove sacrifices and return items
        for (const sacId of sacrificeIds) {
            const sacHero = userAny.heroes.get(sacId);

            // Return items to inventory
            if (sacHero.equipment && Array.isArray(sacHero.equipment)) {
                const equipmentInventory = userAny.equipmentInventory || [];
                const inventory = user.inventory || new Map();
                let legacyInventoryUpdated = false;
                let equipmentInventoryUpdated = false;

                for (const itemId of sacHero.equipment) {
                    if (!itemId) continue;

                    // Check new equipmentInventory first
                    const existingItemIndex = equipmentInventory.findIndex((eq: any) => eq.itemId === itemId && eq.heroId === sacId);

                    if (existingItemIndex !== -1) {
                        // Mark as unequipped
                        equipmentInventory[existingItemIndex].equipped = false;
                        equipmentInventory[existingItemIndex].heroId = undefined;
                        equipmentInventoryUpdated = true;
                        console.log(`[Merge] Returned ${itemId} to inventory from sacrificed hero ${sacId}`);
                    } else {
                        // Legacy fallback
                        inventory.set(itemId, (inventory.get(itemId) || 0) + 1);
                        legacyInventoryUpdated = true;
                        console.log(`[Merge] Returned ${itemId} to legacy inventory from sacrificed hero ${sacId}`);
                    }
                }

                if (legacyInventoryUpdated) {
                    user.inventory = inventory;
                    user.markModified('inventory');
                }
                if (equipmentInventoryUpdated) {
                    userAny.equipmentInventory = equipmentInventory;
                    user.markModified('equipmentInventory');
                }
            }

            userAny.heroes.delete(sacId);
        }

        // 2. Upgrade main hero stars
        mainHero.stars = currentStars + 1;
        userAny.heroes.set(mainHeroId, mainHero);

        user.markModified('heroes');
        await user.save();

        console.log(`[Merge] ${commanderName} upgraded ${mainHeroId} to ${mainHero.stars}★ (consumed ${sacrificeIds.length} heroes)`);

        res.json({
            success: true,
            newStars: mainHero.stars,
            consumedCount: sacrificeIds.length,
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Merge Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// EQUIP ITEM Endpoint
app.post('/api/hero/equip', async (req, res) => {
    try {
        const { commanderName, instanceId, slotIndex, itemId } = req.body;
        // Check slotIndex is number
        if (!commanderName || !instanceId || slotIndex === undefined) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
            return res.status(404).json({ message: 'Hero instance not found' });
        }

        const hero = userAny.heroes.get(instanceId);
        if (!hero.equipment) hero.equipment = new Array(9).fill(null);

        // Validation for ItemId (if equipping)
        if (itemId) {
            // First check equipmentInventory (new format)
            const equipmentInventory = userAny.equipmentInventory || [];
            const itemIndex = equipmentInventory.findIndex((eq: any) => eq.itemId === itemId && !eq.equipped);

            if (itemIndex === -1) {
                // Fall back to legacy inventory
                const inventory = user.inventory || new Map();
                const count = inventory.get(itemId) || 0;
                if (count < 1) {
                    return res.status(400).json({ message: 'Item not in inventory' });
                }

                // Legacy inventory logic
                // Unequip current if exists
                const currentItem = hero.equipment[slotIndex];
                if (currentItem) {
                    inventory.set(currentItem, (inventory.get(currentItem) || 0) + 1);
                }

                // Deduct new item
                inventory.set(itemId, count - 1);
                hero.equipment[slotIndex] = itemId;
                user.inventory = inventory;
            } else {
                // New equipmentInventory logic
                // Unequip current if exists
                const currentItem = hero.equipment[slotIndex];
                if (currentItem) {
                    // Return item to inventory (mark as unequipped)
                    const existingItem = equipmentInventory.find((eq: any) => eq.itemId === currentItem && eq.heroId === instanceId);
                    if (existingItem) {
                        existingItem.equipped = false;
                        existingItem.heroId = undefined;
                    }
                }

                // Mark the new item as equipped
                equipmentInventory[itemIndex].equipped = true;
                equipmentInventory[itemIndex].heroId = instanceId;

                // Equip new item
                hero.equipment[slotIndex] = itemId;
                userAny.equipmentInventory = equipmentInventory;
                user.markModified('equipmentInventory');
            }
        } else {
            // Unequip logic
            const currentItem = hero.equipment[slotIndex];
            if (currentItem) {
                // Check equipmentInventory first
                const equipmentInventory = userAny.equipmentInventory || [];
                const existingItem = equipmentInventory.find((eq: any) => eq.itemId === currentItem && eq.heroId === instanceId);

                if (existingItem) {
                    existingItem.equipped = false;
                    existingItem.heroId = undefined;
                    user.markModified('equipmentInventory');
                } else {
                    // Fall back to legacy inventory
                    const inventory = user.inventory || new Map();
                    inventory.set(currentItem, (inventory.get(currentItem) || 0) + 1);
                    user.inventory = inventory;
                    user.markModified('inventory');
                }

                hero.equipment[slotIndex] = null;
            }
        }

        userAny.heroes.set(instanceId, hero);
        user.markModified('heroes');
        await user.save();

        console.log(`[Equip] ${commanderName} updated slot ${slotIndex} on ${instanceId} with ${itemId || 'Empty'}`);
        res.json({ success: true, user: sanitizeUser(user) });

    } catch (error) {
        console.error("Equip Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// SAVE DEPLOYED TEAM Endpoint
app.post('/api/team/deploy', async (req, res) => {
    try {
        const { commanderName, teamInstanceIds } = req.body;
        if (!commanderName || !Array.isArray(teamInstanceIds)) {
            return res.status(400).json({ message: 'commanderName and teamInstanceIds[] required' });
        }

        // Validate max 6 heroes
        if (teamInstanceIds.length > 6) {
            return res.status(400).json({ message: 'Maximum 6 heroes in a team' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;

        // Validate all instanceIds exist in user's heroes
        for (const instanceId of teamInstanceIds) {
            if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
                return res.status(400).json({ message: `Hero instance not found: ${instanceId}` });
            }
        }

        // Save the deployed team
        userAny.deployedTeam = teamInstanceIds;
        user.markModified('deployedTeam');
        await user.save();

        console.log(`[Deploy] ${commanderName} saved team: ${teamInstanceIds.join(', ')}`);
        res.json({
            success: true,
            deployedTeam: teamInstanceIds,
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Deploy Team Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// ==================== HERO ALTAR ENDPOINTS ====================

// DECOMPOSE HERO - Permanently sacrifice hero for resources
app.post('/api/altar/decompose', async (req, res) => {
    try {
        const { commanderName, instanceId } = req.body;
        if (!commanderName || !instanceId) {
            return res.status(400).json({ message: 'Missing commanderName or instanceId' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
            return res.status(404).json({ message: 'Hero not found' });
        }

        // Check if hero is in deployed team
        if (userAny.deployedTeam && userAny.deployedTeam.includes(instanceId)) {
            return res.status(400).json({ message: 'Cannot decompose a deployed hero. Remove from team first.' });
        }

        const hero = userAny.heroes.get(instanceId);
        const heroStars = hero.stars || 1;
        const heroAttribute = hero.attribute || 'STR';
        const heroLevel = hero.level || 1;

        // Calculate rewards
        const soulPotionReward = 50 + (heroLevel * 5); // Base 50 + 5 per level
        const heroPotionReward = 25 + (heroLevel * 2); // Base 25 + 2 per level
        const orbReward = 10 * heroStars; // 10 orbs per star

        // Return equipped items to inventory
        if (hero.equipment && Array.isArray(hero.equipment)) {
            const equipmentInventory = userAny.equipmentInventory || [];

            for (const itemId of hero.equipment) {
                if (!itemId) continue;

                const existingItemIndex = equipmentInventory.findIndex((eq: any) => eq.itemId === itemId && eq.heroId === instanceId);
                if (existingItemIndex !== -1) {
                    equipmentInventory[existingItemIndex].equipped = false;
                    equipmentInventory[existingItemIndex].heroId = undefined;
                    console.log(`[Altar] Returned ${itemId} to inventory from decomposed hero ${instanceId}`);
                }
            }
            userAny.equipmentInventory = equipmentInventory;
            user.markModified('equipmentInventory');
        }

        // Award resources
        user.soulPotion = (user.soulPotion || 0) + soulPotionReward;
        user.heroPotion = (user.heroPotion || 0) + heroPotionReward;

        // Award orbs based on attribute
        if (heroAttribute === 'AGI') {
            userAny.agiOrb = (userAny.agiOrb || 0) + orbReward;
        } else if (heroAttribute === 'STR') {
            userAny.strOrb = (userAny.strOrb || 0) + orbReward;
        } else if (heroAttribute === 'INT') {
            userAny.intOrb = (userAny.intOrb || 0) + orbReward;
        }

        // Delete hero
        userAny.heroes.delete(instanceId);
        user.markModified('heroes');

        await user.save();

        console.log(`[Altar] ${commanderName} decomposed ${instanceId} (${heroStars}★ ${heroAttribute}) - Got ${soulPotionReward} SP, ${heroPotionReward} HP, ${orbReward} ${heroAttribute} Orbs`);

        res.json({
            success: true,
            rewards: {
                soulPotion: soulPotionReward,
                heroPotion: heroPotionReward,
                orbs: orbReward,
                orbType: heroAttribute
            },
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Decompose Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// DECOMPOSE HEROES BULK - Permanently sacrifice multiple heroes for resources
app.post('/api/altar/decompose-bulk', async (req, res) => {
    try {
        const { commanderName, instanceIds } = req.body;
        if (!commanderName || !instanceIds || !Array.isArray(instanceIds)) {
            return res.status(400).json({ message: 'Missing commanderName or instanceIds[]' });
        }

        if (instanceIds.length === 0) {
            return res.status(400).json({ message: 'No heroes selected' });
        }

        if (instanceIds.length > 14) {
            return res.status(400).json({ message: 'Maximum 14 heroes can be decomposed at once' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        const deployedTeam = userAny.deployedTeam || [];

        // Track total rewards
        let totalSoulPotion = 0;
        let totalHeroPotion = 0;
        const orbTotals: Record<string, number> = { AGI: 0, STR: 0, INT: 0 };
        let decomposedCount = 0;

        for (const instanceId of instanceIds) {
            if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
                continue; // Skip missing heroes
            }

            // Check if hero is deployed
            if (deployedTeam.includes(instanceId)) {
                continue; // Skip deployed heroes
            }

            const hero = userAny.heroes.get(instanceId);
            const heroStars = hero.stars || 1;
            const heroAttribute = hero.attribute || 'STR';
            const heroLevel = hero.level || 1;

            // Calculate rewards
            const soulPotionReward = 50 + (heroLevel * 5);
            const heroPotionReward = 25 + (heroLevel * 2);
            const orbReward = 10 * heroStars;

            totalSoulPotion += soulPotionReward;
            totalHeroPotion += heroPotionReward;
            orbTotals[heroAttribute] += orbReward;

            // Return equipped items to inventory
            if (hero.equipment && Array.isArray(hero.equipment)) {
                const equipmentInventory = userAny.equipmentInventory || [];
                for (const itemId of hero.equipment) {
                    if (!itemId) continue;
                    const existingItemIndex = equipmentInventory.findIndex((eq: any) => eq.itemId === itemId && eq.heroId === instanceId);
                    if (existingItemIndex !== -1) {
                        equipmentInventory[existingItemIndex].equipped = false;
                        equipmentInventory[existingItemIndex].heroId = undefined;
                    }
                }
                userAny.equipmentInventory = equipmentInventory;
            }

            // Delete hero
            userAny.heroes.delete(instanceId);
            decomposedCount++;
        }

        if (decomposedCount === 0) {
            return res.status(400).json({ message: 'No valid heroes to decompose' });
        }

        // Award resources
        user.soulPotion = (user.soulPotion || 0) + totalSoulPotion;
        user.heroPotion = (user.heroPotion || 0) + totalHeroPotion;
        userAny.agiOrb = (userAny.agiOrb || 0) + orbTotals.AGI;
        userAny.strOrb = (userAny.strOrb || 0) + orbTotals.STR;
        userAny.intOrb = (userAny.intOrb || 0) + orbTotals.INT;

        user.markModified('heroes');
        user.markModified('equipmentInventory');
        await user.save();

        console.log(`[Altar] ${commanderName} bulk decomposed ${decomposedCount} heroes - Got ${totalSoulPotion} SP, ${totalHeroPotion} HP, AGI:${orbTotals.AGI} STR:${orbTotals.STR} INT:${orbTotals.INT}`);

        res.json({
            success: true,
            count: decomposedCount,
            totalRewards: {
                soulPotion: totalSoulPotion,
                heroPotion: totalHeroPotion,
                agiOrb: orbTotals.AGI,
                strOrb: orbTotals.STR,
                intOrb: orbTotals.INT
            },
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Bulk Decompose Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// RESET HERO - Reset hero level to 1, returns materials spent on leveling
app.post('/api/altar/reset', async (req, res) => {
    try {
        const { commanderName, instanceId } = req.body;
        if (!commanderName || !instanceId) {
            return res.status(400).json({ message: 'Missing commanderName or instanceId' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
            return res.status(404).json({ message: 'Hero not found' });
        }

        const hero = userAny.heroes.get(instanceId);
        const currentLevel = hero.level || 1;

        if (currentLevel <= 1) {
            return res.status(400).json({ message: 'Hero is already level 1' });
        }

        // Calculate materials to return (approximately 80% of what was spent)
        // Formula: Each level costs ~100 * level gold and ~50 * level soul potion
        let totalGoldSpent = 0;
        let totalSoulPotionSpent = 0;
        for (let lvl = 1; lvl < currentLevel; lvl++) {
            totalGoldSpent += 100 * lvl;
            totalSoulPotionSpent += 50;
        }

        const goldReturn = Math.floor(totalGoldSpent * 0.8);
        const soulPotionReturn = Math.floor(totalSoulPotionSpent * 0.8);

        // Reset hero level
        hero.level = 1;
        hero.experience = 0;
        hero.currentRankIndex = 0;

        userAny.heroes.set(instanceId, hero);
        user.markModified('heroes');

        // Return resources
        user.gold = (user.gold || 0) + goldReturn;
        user.soulPotion = (user.soulPotion || 0) + soulPotionReturn;

        await user.save();

        console.log(`[Altar] ${commanderName} reset ${instanceId} from level ${currentLevel} to 1 - Returned ${goldReturn} Gold, ${soulPotionReturn} SP`);

        res.json({
            success: true,
            previousLevel: currentLevel,
            returned: {
                gold: goldReturn,
                soulPotion: soulPotionReturn
            },
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// STAR-BACK - Reset hero stars to 1, returns merge materials (NOT sacrificed heroes)
app.post('/api/altar/star-back', async (req, res) => {
    try {
        const { commanderName, instanceId } = req.body;
        if (!commanderName || !instanceId) {
            return res.status(400).json({ message: 'Missing commanderName or instanceId' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;
        if (!userAny.heroes || !userAny.heroes.has(instanceId)) {
            return res.status(404).json({ message: 'Hero not found' });
        }

        const hero = userAny.heroes.get(instanceId);
        const currentStars = hero.stars || 1;

        if (currentStars <= 1) {
            return res.status(400).json({ message: 'Hero is already 1★' });
        }

        // Calculate materials to return based on stars lost
        // Estimated cost per star upgrade: 1000 gold each
        const goldReturn = (currentStars - 1) * 1000;
        const heroPotionReturn = (currentStars - 1) * 50; // 50 hero potion per star

        // Reset hero stars
        hero.stars = 1;
        userAny.heroes.set(instanceId, hero);
        user.markModified('heroes');

        // Return resources
        user.gold = (user.gold || 0) + goldReturn;
        user.heroPotion = (user.heroPotion || 0) + heroPotionReturn;

        await user.save();

        console.log(`[Altar] ${commanderName} star-backed ${instanceId} from ${currentStars}★ to 1★ - Returned ${goldReturn} Gold, ${heroPotionReturn} HP`);

        res.json({
            success: true,
            previousStars: currentStars,
            returned: {
                gold: goldReturn,
                heroPotion: heroPotionReturn
            },
            note: 'Sacrificed heroes are NOT returned, only materials.',
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Star-Back Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// ORB SUMMON - Summon a hero using 100 orbs of specific type
app.post('/api/altar/orb-summon', async (req, res) => {
    try {
        const { commanderName, orbType } = req.body;
        if (!commanderName || !orbType) {
            return res.status(400).json({ message: 'Missing commanderName or orbType' });
        }

        if (!['AGI', 'STR', 'INT'].includes(orbType)) {
            return res.status(400).json({ message: 'Invalid orbType. Must be AGI, STR, or INT' });
        }

        const user = await User.findOne({ commanderName });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userAny = user as any;

        // Check orb count
        const orbField = orbType.toLowerCase() + 'Orb' as 'agiOrb' | 'strOrb' | 'intOrb';
        const currentOrbs = userAny[orbField] || 0;

        if (currentOrbs < 100) {
            return res.status(400).json({ message: `Not enough ${orbType} Orbs. Need 100, have ${currentOrbs}` });
        }

        // Deduct orbs
        userAny[orbField] = currentOrbs - 100;

        // Pick a random hero of that attribute
        const heroesOfType = ALL_HEROES.filter(h => h.attribute === orbType);
        if (heroesOfType.length === 0) {
            return res.status(500).json({ message: `No heroes found for ${orbType} attribute` });
        }

        const hero = heroesOfType[Math.floor(Math.random() * heroesOfType.length)];

        // Create new hero instance
        if (!userAny.heroes) userAny.heroes = new Map();
        const instanceId = `${hero.codeName.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const manager = getHeroManager(hero.codeName, null);
        const newInstance = manager.getHeroInstance();
        (newInstance as any).heroCodeName = hero.codeName;
        (newInstance as any).stars = 1;
        (newInstance as any).attribute = orbType;

        userAny.heroes.set(instanceId, newInstance);

        // Update heroUsage stats
        if (!userAny.stats) userAny.stats = {};
        if (!userAny.stats.heroUsage) userAny.stats.heroUsage = new Map();
        const usageMap = userAny.stats.heroUsage;
        usageMap.set(hero.codeName, (usageMap.get(hero.codeName) || 0) + 1);

        user.markModified('heroes');
        user.markModified('stats.heroUsage');
        await user.save();

        console.log(`[Altar] ${commanderName} summoned ${hero.codeName} (${orbType}) using 100 orbs`);

        res.json({
            success: true,
            hero,
            instanceId,
            remainingOrbs: currentOrbs - 100,
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("Orb Summon Error:", error);
        res.status(500).json({ message: (error as Error).message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
