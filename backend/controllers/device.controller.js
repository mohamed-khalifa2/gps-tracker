import Device from "../models/device.model.js";
import Location from "../models/location.model.js";
import { StatusCodes } from "http-status-codes";

// Helper: fetch device and assert ownership in one step
export const findOwnDevice = async (deviceId, userId, res) => {
  const device = await Device.findById(deviceId);
  if (!device) {
    res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, message: "Device not found" });
    return null;
  }
  if (device.owner.toString() !== userId.toString()) {
    res
      .status(StatusCodes.FORBIDDEN)
      .json({ success: false, message: "Not your device" });
    return null;
  }
  return device;
};

// POST /api/devices
export const createDevice = async (req, res, next) => {
  try {
    const { name, deviceId, description, color } = req.body;

    // deviceId must be globally unique across all users
    const conflict = await Device.findOne({ deviceId });
    if (conflict) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ success: false, message: "deviceId already in use" });
    }

    const device = await Device.create({
      name,
      deviceId,
      description,
      color,
      owner: req.user._id,
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

// GET /api/devices  — only the caller's devices
export const getMyDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });
    res
      .status(StatusCodes.OK)
      .json({ success: true, count: devices.length, data: devices });
  } catch (err) {
    next(err);
  }
};

// GET /api/devices/:id
export const getDevice = async (req, res, next) => {
  try {
    const device = await findOwnDevice(req.params.id, req.user._id, res);
    if (!device) return;
    res.status(StatusCodes.OK).json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

// PUT /api/devices/:id
export const updateDevice = async (req, res, next) => {
  try {
    const device = await findOwnDevice(req.params.id, req.user._id, res);
    if (!device) return;

    const { name, description, color, isActive } = req.body;
    if (name !== undefined) device.name = name;
    if (description !== undefined) device.description = description;
    if (color !== undefined) device.color = color;
    if (isActive !== undefined) device.isActive = isActive;

    await device.save();
    res.status(StatusCodes.OK).json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/devices/:id  — also wipes location history
export const deleteDevice = async (req, res, next) => {
  try {
    const device = await findOwnDevice(req.params.id, req.user._id, res);
    if (!device) return;
    await Location.deleteMany({ deviceId: device.deviceId });
    await device.deleteOne();

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Device and its history deleted" });
  } catch (err) {
    next(err);
  }
};
