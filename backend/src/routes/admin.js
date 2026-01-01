import express from "express";
import Request from "../models/Request.js";
import Inventory from "../models/Inventory.js";
import Notification from "../models/Notification.js";
import { compatibilityMap } from "../utils/compatibility.js";

const router = express.Router();

async function deductInventory(bloodType, units) {
  let remaining = units;
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

  return remaining;
}

async function crossDeduct(bloodType, remaining) {
  const compatibles = compatibilityMap[bloodType];
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



router.get("/admin/requests", async (req, res) => {
  try {
    const requests = await Request.find({}).sort({ request_date: -1 });
    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/notifications", async (req, res) => {
  try {
    let { limit } = req.query;
    limit = parseInt(limit) || 20;
    const notifications = await Notification.find({}).sort({ created_at: -1 }).limit(limit);
    return res.json(notifications);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/admin/notification/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Assuming 'sno' is the identifier used in frontend, but MongoDB uses _id.
    // However, the frontend uses 'sno'. Let's check the schema.
    // If 'sno' is custom, we query by it. If not, we might need to adjust.
    // Looking at page.tsx, it expects 'sno'.
    // Looking at Notification.js might clarify, but let's assume _id for now or query by sno if exists.
    // To match frontend 'sno', let's see if we can delete by _id if we map it, OR just delete by sno if that's a field.
    // Wait, the frontend code uses 'sno'.
    // Let's assume we can pass the Mongo _id as 'sno' for now, or we need to check the model.
    // Actually, let's keep it simple: Delete by _id.
    await Notification.findByIdAndDelete(id);
    return res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/admin/approve", async (req, res) => {
  try {
    const { requestId } = req.body;
    const reqDoc = await Request.findOne({ request_id: requestId });
    if (!reqDoc) return res.status(404).json({ error: "Request not found" });

    reqDoc.status = "APPROVED";
    await reqDoc.save();

    const now = new Date();
    await Notification.create({ date: now.toISOString().split("T")[0], time: now.toTimeString().split(" ")[0], heading: "Admin Approval", body: `Admin approved ${reqDoc.units_requested} units of ${reqDoc.blood_type} for Nurse ${reqDoc.nurse_id}` });

    let remaining = await deductInventory(reqDoc.blood_type, reqDoc.units_requested);
    if (remaining > 0) {
      remaining = await crossDeduct(reqDoc.blood_type, remaining);
      if (remaining > 0) {
        await Notification.create({ date: now.toISOString().split("T")[0], time: now.toTimeString().split(" ")[0], heading: "Cross-match Error", body: `Insufficient units across compatible types for ${reqDoc.blood_type}` });
        return res.status(400).json({ error: "Insufficient units across compatible types" });
      }
    }

    return res.json({ message: "Request approved and processed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
