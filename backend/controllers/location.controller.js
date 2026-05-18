const Location = require("../models/location.model");
const Device = require("../models/device.model");

// ── Haversine distance in metres between two lat/lon points ────
function haversineMetres(lat1, lon1, lat2, lon2) {
  const R = 6_371_000; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Movement thresholds ────────────────────────────────────────
const MOVING_SPEED_KMH = 2; // below this → considered stationary
const MOVING_DIST_M = 5; // minimum metres moved between pings

// POST /api/location  — called by the physical device (no JWT)
const postLocation = async (req, res, next) => {
  try {
    const {
      deviceId,
      lat,
      lon,
      speed: reportedSpeed,
      altitude,
      accuracy,
    } = req.body;

    // 1. Verify device is registered and active
    const device = await Device.findOne({ deviceId, isActive: true });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Unknown or inactive deviceId",
      });
    }

    // 2. Fetch previous ping to derive movement metrics
    const prev = await Location.findOne({ deviceId }).sort({ createdAt: -1 });

    let calculatedSpeed = reportedSpeed ?? 0;
    let distanceMoved = 0; // metres since last ping
    let isMoving = false;

    if (prev) {
      distanceMoved = haversineMetres(prev.lat, prev.lon, lat, lon);

      // If device didn't report speed, derive it from distance ÷ time
      if (reportedSpeed == null) {
        const elapsedSeconds =
          (Date.now() - new Date(prev.createdAt).getTime()) / 1000;
        if (elapsedSeconds > 0) {
          calculatedSpeed = Math.round((distanceMoved / elapsedSeconds) * 3.6); // m/s → km/h
        }
      }

      isMoving =
        calculatedSpeed >= MOVING_SPEED_KMH && distanceMoved >= MOVING_DIST_M;
    }

    // 3. Save location with enriched fields
    const location = await Location.create({
      deviceId,
      lat,
      lon,
      speed: calculatedSpeed,
      altitude,
      accuracy,
      distanceMoved: Math.round(distanceMoved),
      isMoving,
    });

    // 4. Update device metadata
    device.lastSeen = new Date();
    device.isMoving = isMoving;
    device.lastSpeed = calculatedSpeed;
    await device.save();

    // 5. Broadcast to owner's socket room only
    const io = req.app.get("io");
    io.to(`user:${device.owner}`).emit("location-update", {
      ...location.toObject(),
      deviceName: device.name,
      isMoving,
      distanceMoved: Math.round(distanceMoved),
    });

    res.status(201).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};

// GET /api/location/:deviceId/history
const getHistory = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    const device = await Device.findOne({ deviceId, owner: req.user._id });
    if (!device) {
      return res
        .status(403)
        .json({ success: false, message: "Device not found or not yours" });
    }

    const data = await Location.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/location/:deviceId/latest
const getLatest = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId, owner: req.user._id });
    if (!device) {
      return res
        .status(403)
        .json({ success: false, message: "Device not found or not yours" });
    }

    const location = await Location.findOne({ deviceId }).sort({
      createdAt: -1,
    });
    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "No data yet for this device" });
    }

    res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};

module.exports = { postLocation, getHistory, getLatest };
