import mongoose from "mongoose";

const nurseSchema = new mongoose.Schema({
  nurse_id: { type: String, required: true, unique: true },
  nurse_name: String,
  dept: String,
});

export default mongoose.model("Nurse", nurseSchema);
