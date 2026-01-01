import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import Nurse from "../models/Nurse.js";

const router = express.Router();

router.post("/addnurse", async (req, res) => {
  try {
    const { nurse_name, nurse_id, dept, password } = req.body;
    if (!nurse_name || !nurse_id || !password) return res.status(400).json({ error: "Missing fields" });

    const exists = await Nurse.findOne({ nurse_id });
    if (exists) return res.status(409).json({ error: "Nurse already exists" });

    await Nurse.create({ nurse_id, nurse_name, dept });
    const password_hash = await bcrypt.hash(password, 10);
    await User.create({ username: nurse_id, password_hash, role: "nurse" });

    return res.status(201).json({ message: "Nurse added successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt for:", username);
    const user = await User.findOne({ username });
    console.log("User found:", user ? "YES" : "NO", user?._id);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });

    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    return res.json({ role: user.role, message: "Login successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("session", { path: "/" });
  return res.json({ message: "Logout successful" });
});

export default router;
