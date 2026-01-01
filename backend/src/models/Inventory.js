import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  blood_type: { type: String, required: true },
  numofpints: { type: Number, required: true, default: 0 },
  expiry_date: { type: Date, required: false },
});

export default mongoose.model("Inventory", inventorySchema);
