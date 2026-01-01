import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/index.js";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Mount API router under /api so frontend can call /api/...
app.use("/api", apiRouter);

// Root health endpoint to avoid "Cannot GET /"
app.get("/", (req, res) => {
  res.status(200).send("Blood Bank API running. Use /api/ endpoints.");
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB (MONGODB_URI)");
    } else {
      throw new Error("No MONGODB_URI provided");
    }
  } catch (err) {
    console.warn("Could not connect to provided MongoDB. Attempting in-memory fallback.", err?.message || err);
    if (process.env.NODE_ENV !== "production") {
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mss = await MongoMemoryServer.create();
        const uri = mss.getUri();
        await mongoose.connect(uri);
        console.log("Connected to in-memory MongoDB");
      } catch (memErr) {
        console.error("In-memory MongoDB start failed:", memErr);
        process.exit(1);
      }
    } else {
      console.error("Production requires a real MongoDB URI");
      process.exit(1);
    }
  }

  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

start();
