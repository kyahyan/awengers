
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MAX_RETRIES = 3;

export const connectDB = async (retryCount = 0) => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || '', { dbName: 'awengers' });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying connection... (${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(() => connectDB(retryCount + 1), 5000);
        } else {
            process.exit(1);
        }
    }
};
