import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Inventory from './src/models/Inventory.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blood-bank";

async function seedInventory() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing inventory to avoid duplicates
        await Inventory.deleteMany({});
        console.log("Cleared existing inventory");

        const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        const now = new Date();
        const expiry = new Date(now);
        expiry.setDate(now.getDate() + 30); // 30 days expiry

        const inventoryData = bloodTypes.map(type => ({
            blood_type: type,
            numofpints: Math.floor(Math.random() * 50) + 10, // Random 10-60 units
            expiry_date: expiry
        }));

        await Inventory.insertMany(inventoryData);
        console.log(`✅ Seeded ${inventoryData.length} inventory items.`);

        const count = await Inventory.countDocuments();
        console.log(`Total inventory count: ${count}`);

        await mongoose.disconnect();
        console.log("Disconnected");
    } catch (err) {
        console.error("❌ Seeding Error:", err);
        process.exit(1);
    }
}

seedInventory();
