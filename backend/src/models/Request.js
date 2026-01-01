import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  request_id: { type: String, required: true, unique: true },
  nurse_id: { type: String, required: true },
  blood_type: { type: String, required: true },
  units_requested: { type: Number, required: true },
  status: { type: String, enum: ["PENDING", "APPROVED"], default: "PENDING" },
  request_date: { type: Date, default: Date.now },
});

export default mongoose.model("Request", requestSchema);
