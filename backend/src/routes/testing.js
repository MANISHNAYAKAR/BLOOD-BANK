import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/testing", (req, res) => {
  const token = req.cookies?.session || req.headers["cookie"]?.split("=")[1];
  if (!token) return res.status(401).json({ error: "No session cookie found" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return res.json({ decoded });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
