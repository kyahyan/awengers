
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
            // Update existing admin to match requested Level 1
            adminExists.level = 1;
            adminExists.currentXp = 0;
            adminExists.maxXp = 100;
            adminExists.rankTitle = 'Scout';
            adminExists.rankIcon = 'Paw Print';
            // Optional: Reset stats if needed, but keeping wealth is usually preferred for testing
            await adminExists.save();
            console.log('Super Admin Reset to Level 1.');
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
