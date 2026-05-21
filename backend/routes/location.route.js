const router = require("express").Router();
const {
  postLocation,
  getHistory,
  getLatest,
} = require("../controllers/location.controller");
const { protect } = require("../middlewares/protect.middleware");

// Device posts its GPS — no auth (device uses its deviceId string)
router.post("/", postLocation);

// User reads their device's data — must be logged in + owner
router.get("/:deviceId/history", protect, getHistory);
router.get("/:deviceId/latest", protect, getLatest);

module.exports = router;
