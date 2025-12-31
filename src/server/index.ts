
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import { User } from './models/User.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB().then(async () => {
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
                gold: 999999999
            });
            console.log('Super Admin Created: Commander "Admin", Password "admin123"');
        } else {
            console.log('Super Admin already exists. Skipping reset.');
        }
    } catch (e) {
        console.error("Seeding Error:", e);
    }
});

// Routes
app.get('/', (_req, res) => {
    res.send('Awengers API is running');
});

// AUTH: Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, commanderName, password } = req.body;

        // Validation
        if (!username || !commanderName || !password) return res.status(400).json({ message: 'Missing fields' });

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
            password: hashedPassword
        });

        // Token
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { username: user.username, commanderName: user.commanderName, role: user.role } });
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

        res.json({ token, user }); // Return full user profile for game load
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
import { createOryxHero, createSableHero, createRazorHero, HeroProgressionManager } from '../data/HeroProgression.js';

const ALL_HEROES: HeroDef[] = [];
Object.values(HERO_DEFINITIONS).forEach((list: any[]) => {
    ALL_HEROES.push(...list);
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
        skillLevels: heroData.skillLevels || {}
    } : undefined;

    if (nameLower.includes('ranger') || nameLower.includes('sable')) {
        return createSableHero(level, instance);
    } else if (nameLower.includes('razor') || nameLower.includes('assassin')) {
        return createRazorHero(level, instance);
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
        // Ensure codeName is stored on the instance for easy lookup later if needed
        (newInstance as any).heroCodeName = hero.codeName;
        (newInstance as any).stars = 1; // All new heroes start at 1 star
        (newInstance as any).attribute = hero.class; // STR, AGI, or INT based on hero class

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

        // Define merge recipes
        const recipes: Record<number, {
            requireSameHero: boolean;
            requireSameAttribute: boolean;
            sacrificeCount: number;
            sacrificeStarLevel: number;
        }> = {
            1: { requireSameHero: true, requireSameAttribute: false, sacrificeCount: 2, sacrificeStarLevel: 1 },  // 1★ → 2★
            2: { requireSameHero: false, requireSameAttribute: true, sacrificeCount: 3, sacrificeStarLevel: 2 }, // 2★ → 3★
            3: { requireSameHero: true, requireSameAttribute: false, sacrificeCount: 1, sacrificeStarLevel: 3 },  // 3★ → 4★
            4: { requireSameHero: false, requireSameAttribute: true, sacrificeCount: 1, sacrificeStarLevel: 4 },  // 4★ → 5★
        };

        if (currentStars >= 5) {
            return res.status(400).json({ message: 'Hero is already max stars (5★)' });
        }

        const recipe = recipes[currentStars];
        if (!recipe) {
            return res.status(400).json({ message: 'Invalid star level for merge' });
        }

        // Validate sacrifice count
        if (sacrificeIds.length !== recipe.sacrificeCount) {
            return res.status(400).json({
                message: `Recipe requires ${recipe.sacrificeCount} sacrifice(s), got ${sacrificeIds.length}`
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

        for (const sacId of sacrificeIds) {
            if (sacId === mainHeroId) {
                return res.status(400).json({ message: 'Cannot sacrifice the main hero' });
            }
            if (!userAny.heroes.has(sacId)) {
                return res.status(404).json({ message: `Sacrifice hero not found: ${sacId}` });
            }

            const sacHero = userAny.heroes.get(sacId);
            const sacStars = sacHero.stars || 1;
            const sacHeroCodeName = sacHero.heroCodeName || extractCodeNameFromId(sacId);

            console.log(`[Merge] Sacrifice: ${sacId}, codeName: ${sacHeroCodeName}, stars: ${sacStars}`);

            // Check star level
            if (sacStars !== recipe.sacrificeStarLevel) {
                return res.status(400).json({
                    message: `Sacrifice must be ${recipe.sacrificeStarLevel}★, got ${sacStars}★`
                });
            }

            // Check same hero requirement (case-insensitive)
            if (recipe.requireSameHero) {
                if (sacHeroCodeName.toLowerCase() !== mainHeroCodeName.toLowerCase()) {
                    return res.status(400).json({
                        message: `Sacrifice must be the same hero (${mainHeroCodeName})`
                    });
                }
            }

            // Check same attribute requirement
            if (recipe.requireSameAttribute) {
                const sacAttribute = sacHero.attribute || 'STR';
                if (sacAttribute !== mainHeroAttribute) {
                    return res.status(400).json({
                        message: `Sacrifice must have same attribute (${mainHeroAttribute})`
                    });
                }
            }
        }

        // All validations passed - perform merge
        // 1. Remove sacrifices
        for (const sacId of sacrificeIds) {
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
