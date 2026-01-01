import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("No MONGODB_URI provided");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const username = "manish";
    const password = "manish"; // Change this

    const exists = await User.findOne({ username });
    if (exists) {
      console.log("Admin already exists");
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    await User.create({ username, password_hash, role: "admin" });

    console.log("Admin created successfully. Username: manish, Password: manish");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();