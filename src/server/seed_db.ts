import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import { User } from './models/User.js';

const seedDB = async () => {
    try {
        await connectDB();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123Qwe1!', salt);

        // Update or Create
        await User.findOneAndUpdate(
            { role: 'superadmin' },
            {
                username: 'awengers',
                commanderName: 'Admin',
                password: hashedPassword,
                role: 'superadmin',
                // Keep other stats if they exist, or set defaults if new?
                // For seeding, let's just ensure credentials are right. 
                // But we want to preserve partial data if it exists? 
                // The user asked to "seed the new admin". 
                // Let's usert/update.
                $setOnInsert: {
                    level: 100,
                    rankTitle: 'Eternal',
                    rankIcon: 'Infinity Wing',
                    vipPoints: 100000,
                    gems: 999999,
                    gold: 999999999
                }
            },
            { upsert: true, new: true }
        );
        console.log('Super Admin Seeded/Updated: Username "awengers", Password "123Qwe1!"');

        await mongoose.disconnect();
        console.log('Database seeded and disconnected.');
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedDB();
