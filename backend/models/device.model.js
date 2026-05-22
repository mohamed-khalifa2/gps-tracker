import mongoose from "mongoose";
const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Device name is required"],
      trim: true,
      maxlength: 80,
    },
    // The string ID the physical device uses when posting GPS data
    deviceId: {
      type: String,
      required: [true, "deviceId is required"],
      unique: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: "#4f8ef7", // used for map marker tinting
    },
  },
  { timestamps: true },
);

export default mongoose.model("Device", deviceSchema);
