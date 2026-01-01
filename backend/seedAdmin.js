import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";
import dotenv from "dotenv";

dotenv.config();

// Force usage of 'bloodbank' to match .env, regardless of what env var says if it's missing
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bloodbank";

async function seedAdmin() {
    try {
        console.log("Connecting to:", mongoUri);
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for seeding");

        const username = "admin";
        const password = "password123";
        const role = "admin";

        const existingInfo = await User.findOne({ username });
        if (existingInfo) {
            console.log("Admin user already exists. Updating password...");
            const password_hash = await bcrypt.hash(password, 10);
            existingInfo.password_hash = password_hash;
            await existingInfo.save();
            console.log("Admin password updated to 'password123'");
        } else {
            console.log("Creating new admin user...");
            const password_hash = await bcrypt.hash(password, 10);
            await User.create({ username, password_hash, role });
            console.log("Admin user created successfully");
        }

        console.log("Credentials:");
        console.log("Username: admin");
        console.log("Password: password123");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seedAdmin();
