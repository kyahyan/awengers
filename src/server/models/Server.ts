
import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // "1", "2"...
    name: { type: String, required: true },
    limit: { type: Number, default: 100 },
    status: { type: String, enum: ['Active', 'Maintenance'], default: 'Active' }
}, { timestamps: true });

export const Server = mongoose.model('Server', serverSchema);
