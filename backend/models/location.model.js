const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lon: { type: Number, required: true, min: -180, max: 180 },
    speed: { type: Number, default: 0, min: 0 }, // km/h
    altitude: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    distanceMoved: { type: Number, default: 0 }, // metres since previous ping
    isMoving: { type: Boolean, default: false },
  },
  { timestamps: true },
);

locationSchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model("Location", locationSchema);
