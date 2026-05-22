import mongoose from "mongoose";
const locationSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lon: { type: Number, required: true, min: -180, max: 180 },
    speed: { type: Number, default: 0, min: 0 }, // km/h
    isMoving: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Location", locationSchema);
