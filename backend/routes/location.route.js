const router = require("express").Router();
const {
  postLocation,
  getHistory,
  getLatest,
} = require("../controllers/location.controller");
const { protect } = require("../middlewares/protect.middleware");
const {
  validateLocation,
  validateDeviceIdParam,
} = require("../middlewares/validate.middleware");

// Device posts its GPS — no auth (device uses its deviceId string)
router.post("/", validateLocation, postLocation);

// User reads their device's data — must be logged in + owner
router.get("/:deviceId/history", protect, validateDeviceIdParam, getHistory);
router.get("/:deviceId/latest", protect, validateDeviceIdParam, getLatest);

module.exports = router;
