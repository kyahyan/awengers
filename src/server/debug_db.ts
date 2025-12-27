import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        console.log('Attempting to connect with URI:', process.env.MONGODB_URI ? 'REDACTED' : 'MISSING');
        const conn = await mongoose.connect(process.env.MONGODB_URI || '', { dbName: 'awengers' });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);

        // List collections
        const collections = await conn.connection.db?.listCollections().toArray();
        console.log('Collections:', collections?.map(c => c.name));

        await mongoose.disconnect();
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
    }
};

connectDB();
