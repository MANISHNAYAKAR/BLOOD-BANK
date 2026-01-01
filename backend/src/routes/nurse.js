import express from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import Request from "../models/Request.js";
import Inventory from "../models/Inventory.js";
import Notification from "../models/Notification.js";
import { compatibilityMap } from "../utils/compatibility.js";

const router = express.Router();

function verifySession(req) {
  const token = (req.cookies && req.cookies.session) || req.headers["cookie"]?.split("=")[1];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return payload;
  } catch (err) {
    return null;
  }
}

async function deductInventory(bloodType, units) {
  let remaining = units;
  // fetch by expiry ascending
  const items = await Inventory.find({ blood_type: bloodType }).sort({ expiry_date: 1 });

  for (const inv of items) {
    if (remaining <= 0) break;
    if (inv.numofpints > remaining) {
      inv.numofpints -= remaining;
      await inv.save();
      remaining = 0;
    } else {
      remaining -= inv.numofpints;
      await Inventory.deleteOne({ _id: inv._id });
    }
  }

  return remaining; // 0 if fully deducted
}

async function crossDeduct(bloodType, remaining) {
  const compatibles = compatibilityMap[bloodType];
  if (!compatibles) throw new Error("Invalid blood type");

  const items = await Inventory.find({ blood_type: { $in: compatibles } }).sort({ expiry_date: 1 });

  for (const inv of items) {
    if (remaining <= 0) break;
    if (inv.numofpints > remaining) {
      inv.numofpints -= remaining;
      await inv.save();
      remaining = 0;
    } else {
      remaining -= inv.numofpints;
      await Inventory.deleteOne({ _id: inv._id });
    }
  }

  return remaining;
}

router.post("/Nurse/request", async (req, res) => {
  try {
    const payload = verifySession(req);
    if (!payload) return res.status(401).json({ error: "Unauthorized" });
    if (payload.role !== "nurse") return res.status(403).json({ error: "Forbidden" });

    const { requestType, bloodType, amount } = req.body;
    const units = parseInt(amount, 10);
    const status = requestType === "emergency" ? "APPROVED" : "PENDING";

    await Request.create({ request_id: uuidv4(), nurse_id: payload.id, blood_type: bloodType, units_requested: units, status });

    if (requestType === "emergency") {
      const now = new Date();
      await Notification.create({ date: now.toISOString().split("T")[0], time: now.toTimeString().split(" ")[0], heading: "Emergency Request", body: `Nurse ${payload.id} requested ${units} units of ${bloodType}` });

      let remaining = await deductInventory(bloodType, units);
      if (remaining > 0) {
        remaining = await crossDeduct(bloodType, remaining);
        if (remaining > 0) {
          await Notification.create({ date: now.toISOString().split("T")[0], time: now.toTimeString().split(" ")[0], heading: "Cross-match Error", body: `Insufficient units across compatible types for ${bloodType}` });
          return res.status(400).json({ error: "Insufficient units across compatible types" });
        }
      }
    }

    return res.json({ message: "Request submitted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/Nurse/history", async (req, res) => {
  try {
    const payload = verifySession(req);
    if (!payload) return res.status(401).json({ error: "Unauthorized" });
    if (payload.role !== "nurse") return res.status(403).json({ error: "Forbidden" });

    const data = await Request.find({ nurse_id: payload.id }).sort({ request_date: -1 }).select("request_id blood_type units_requested status request_date -_id");
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/Nurse/approved", async (req, res) => {
  try {
    const payload = verifySession(req);
    if (!payload) return res.status(401).json({ error: "Unauthorized" });
    if (payload.role !== "nurse") return res.status(403).json({ error: "Forbidden" });

    const data = await Request.find({ nurse_id: payload.id, status: "APPROVED" }).select("request_id blood_type units_requested request_date -_id");
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/Nurse/inventory", async (req, res) => {
  try {
    const payload = verifySession(req);
    // if (!payload) return res.status(401).json({ error: "Unauthorized" });

    const data = await Inventory.find({}).sort({ blood_type: 1 });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
