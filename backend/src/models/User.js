import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ["nurse", "admin"], default: "nurse" },
});

export default mongoose.model("User", userSchema);
