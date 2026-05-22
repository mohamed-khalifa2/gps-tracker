import express from "express";
const router = express.Router();
import {
  postLocation,
  getHistory,
  getLatest,
} from "../controllers/location.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

// Device posts its GPS — no auth (device uses its deviceId string)
router.post("/", postLocation);

// User reads their device's data — must be logged in + owner
router.get("/:deviceId/history", protect, getHistory);
router.get("/:deviceId/latest", protect, getLatest);

export default router;
