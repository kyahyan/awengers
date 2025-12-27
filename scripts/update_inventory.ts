
import mongoose from 'mongoose';
import { connectDB } from '../src/server/db';
import { User } from '../src/server/models/User';

// Force the schema to have inventory (dynamic or explicit)
// In this script we import the *updated* User model from disk, so it HAS the inventory field.

async function run() {
    await connectDB();

    // Find Kyahyan (commanderName) or awengers (username)
    // The screenshot showed username: "awengers", commanderName: "Kyahyan"
    const user = await User.findOne({ username: 'awengers' });

    if (user) {
        console.log(`Found user: ${user.commanderName}`);

        // Check if inventory exists
        if (!user.inventory) {
            user.inventory = new Map();
        }

        // Grant 100 Summon Books
        user.inventory.set('summon_book', 100);

        // Mark modified just in case
        user.markModified('inventory');

        await user.save();
        console.log("Successfully updated inventory for Kyahyan.");
        console.log("Inventory is now:", user.inventory);
    } else {
        console.log("User 'awengers' not found.");
    }

    await mongoose.disconnect();
    process.exit(0);
}

run();
