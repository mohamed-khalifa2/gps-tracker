import Location from "../models/location.model.js";
import Device from "../models/device.model.js";
import statusCodes from "http-status-codes";

// ── Movement thresholds
const MOVING_SPEED_KMH = 2; // below this → considered stationary

// POST /api/location  — called by the physical device (no JWT)
export const postLocation = async (req, res, next) => {
  try {
    const { deviceId, lat, lon, speed: reportedSpeed } = req.body;

    // 1. Verify device is registered and active
    const device = await Device.findOne({ deviceId, isActive: true });
    if (!device) {
      return res.status(statusCodes.NOT_FOUND).json({
        success: false,
        message: "Unknown or inactive deviceId",
      });
    }

    // 2. Fetch previous ping to derive movement metrics
    const prev = await Location.findOne({ deviceId }).sort({ createdAt: -1 });

    let calculatedSpeed = reportedSpeed ?? 0;
    let isMoving = false;

    isMoving = reportedSpeed >= MOVING_SPEED_KMH;

    // 3. Save location with enriched fields
    const location = await Location.create({
      deviceId,
      lat,
      lon,
      speed: calculatedSpeed,
      isMoving,
    });

    // 4. Update device metadata
    device.isMoving = isMoving;
    device.lastSpeed = calculatedSpeed;
    await device.save();

    // 5. Broadcast to owner's socket room only
    const io = req.app.get("io");
    io.to(`user:${device.owner}`).emit("location-update", {
      ...location.toObject(),
      deviceName: device.name,
      isMoving,
    });

    res.status(statusCodes.CREATED).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};

// GET /api/location/:deviceId/history
export const getHistory = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    const device = await Device.findOne({ deviceId, owner: req.user._id });
    if (!device) {
      return res
        .status(statusCodes.FORBIDDEN)
        .json({ success: false, message: "Device not found or not yours" });
    }

    const data = await Location.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res
      .status(statusCodes.OK)
      .json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/location/:deviceId/latest
export const getLatest = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId, owner: req.user._id });
    if (!device) {
      return res
        .status(statusCodes.FORBIDDEN)
        .json({ success: false, message: "Device not found or not yours" });
    }

    const location = await Location.findOne({ deviceId }).sort({
      createdAt: -1,
    });
    if (!location) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ success: false, message: "No data yet for this device" });
    }

    res.status(statusCodes.OK).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};
