import express from "express";
import authRoutes from "./auth.js";
import nurseRoutes from "./nurse.js";
import adminRoutes from "./admin.js";
import crossRoutes from "./crossmatching.js";
import testingRoutes from "./testing.js";

const router = express.Router();

router.use(authRoutes);
router.use(nurseRoutes);
router.use(adminRoutes);
router.use(crossRoutes);
router.use(testingRoutes);

export default router;
