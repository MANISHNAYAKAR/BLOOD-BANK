import express from "express";
import Inventory from "../models/Inventory.js";
import { compatibilityMap } from "../utils/compatibility.js";

const router = express.Router();

router.post("/crossmatching", async (req, res) => {
  try {
    const { recipientType, units } = req.body;
    const compatibleTypes = compatibilityMap[recipientType];
    if (!compatibleTypes) return res.status(400).json({ error: "Invalid blood type" });

    const inventory = await Inventory.find({ blood_type: { $in: compatibleTypes } }).sort({ numofpints: -1 });
    if (!inventory || inventory.length === 0) return res.status(404).json({ error: "No compatible blood available" });

    let remaining = units;
    const deductions = [];

    for (const row of inventory) {
      if (remaining <= 0) break;
      const deduct = Math.min(row.numofpints, remaining);
      remaining -= deduct;
      if (row.numofpints - deduct <= 0) await Inventory.deleteOne({ _id: row._id });
      else { row.numofpints -= deduct; await row.save(); }
      deductions.push({ blood_type: row.blood_type, deducted: deduct });
    }

    if (remaining > 0) return res.status(400).json({ error: "Insufficient units across all compatible types" });

    return res.json({ message: "Cross-match successful", fulfilledWith: deductions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
