import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  date: String,
  time: String,
  heading: String,
  body: String,
});

export default mongoose.model("Notification", notificationSchema);
