
import mongoose from 'mongoose';
import { User } from './src/server/models/User';

const MONGO_URI = 'mongodb://127.0.0.1:27017/awengers';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const user = await User.findOne({ commanderName: 'Kyahyan' });
        if (user) {
            console.log('User Found:', user.commanderName);
            console.log('Gold:', user.gold);
            console.log('Soul Potion:', user.soulPotion);
            console.log('Hero Potion:', user.heroPotion);
            console.log('Inventory:', user.inventory);
        } else {
            console.log('User not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
check();
