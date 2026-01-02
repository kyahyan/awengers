
import mongoose from 'mongoose';
// We can define the schema directly to match the UserProfile interface logic
// Since importing from src/data might cause issues depending on how tsconfig is set (e.g. DOM libs), 
// we will re-define the structure for the schema or try to keep it loosely coupled.

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    commanderName: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    level: { type: Number, default: 1 },
    currentXp: { type: Number, default: 0 },
    maxXp: { type: Number, default: 100 },
    serverId: { type: String, required: true, default: "1" },

    // Derived/Snapshot fields
    rankTitle: { type: String, default: "Scout" },
    rankIcon: { type: String, default: "Paw Print" },

    avatarId: { type: String, default: "1" },
    frameId: { type: String, default: "1" },
    lastNameChangeTime: { type: Number, default: 0 },

    combatPower: { type: Number, default: 0 },
    guildName: { type: String },
    favoriteHeroCodeName: { type: String, default: "Monkey King" },

    gold: { type: Number, default: 50000 },
    gems: { type: Number, default: 1000 },
    heroPotion: { type: Number, default: 1000 },
    soulPotion: { type: Number, default: 1000 },

    // Use Map for Record<string, number>
    achievementsProgress: { type: Map, of: Number, default: {} },
    achievementsClaimed: [{ type: String }],

    vipPoints: { type: Number, default: 0 },

    stats: {
        highestRankAchieved: { type: String, default: "Scout" },
        totalBossesDefeated: { type: Number, default: 0 },
        highestTowerFloor: { type: Number, default: 0 },
        mythicsFoundCount: { type: Number, default: 0 },
        totalMythicsAvailable: { type: Number, default: 22 },
        arenaWins: { type: Number, default: 0 },
        arenaBattles: { type: Number, default: 0 },
        heroUsage: { type: Map, of: Number, default: {} }
    },

    // Persistent Hero Data (Level, Rank, Skills)
    heroes: { type: Map, of: Object, default: {} },

    // Inventory (legacy format: itemId -> count)
    inventory: { type: Map, of: Number, default: {} },

    // Equipment Inventory (new format with star levels)
    equipmentInventory: [{
        itemId: { type: String, required: true },
        stars: { type: Number, default: 0 },
        equipped: { type: Boolean, default: false },
        heroId: { type: String }
    }],

    // Polishing Powder for enhancement
    polishingPowder: { type: Number, default: 0 },

    // Adventure Progress
    adventureProgress: {
        jadeLotusShrine: {
            maxStage: { type: Number, default: 1 }
        }
    },

    // Deployed Team (Array of instanceIds)
    deployedTeam: [{ type: String }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
