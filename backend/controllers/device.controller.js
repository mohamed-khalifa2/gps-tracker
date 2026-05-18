const Device = require("../models/device.model.js");
const Location = require("../models/location.model.js");

// Helper: fetch device and assert ownership in one step
const findOwnDevice = async (deviceId, userId, res) => {
  const device = await Device.findById(deviceId);
  if (!device) {
    res.status(404).json({ success: false, message: "Device not found" });
    return null;
  }
  if (device.owner.toString() !== userId.toString()) {
    res.status(403).json({ success: false, message: "Not your device" });
    return null;
  }
  return device;
};

// POST /api/devices
const createDevice = async (req, res, next) => {
  try {
    const { name, deviceId, description, color } = req.body;

    // deviceId must be globally unique across all users
    const conflict = await Device.findOne({ deviceId });
    if (conflict) {
      return res
        .status(409)
        .json({ success: false, message: "deviceId already in use" });
    }

    const device = await Device.create({
      name,
      deviceId,
      description,
      color,
      owner: req.user._id,
    });

    res.status(201).json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

// GET /api/devices  — only the caller's devices
const getMyDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: devices.length, data: devices });
  } catch (err) {
    next(err);
  }
};

// GET /api/devices/:id
const getDevice = async (req, res, next) => {
  try {
    const device = await findOwnDevice(req.params.id, req.user._id, res);
    if (!device) return;
    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

// PUT /api/devices/:id
const updateDevice = async (req, res, next) => {
  try {
    const device = await findOwnDevice(req.params.id, req.user._id, res);
    if (!device) return;

    const { name, description, color, isActive } = req.body;
    if (name !== undefined) device.name = name;
    if (description !== undefined) device.description = description;
    if (color !== undefined) device.color = color;
    if (isActive !== undefined) device.isActive = isActive;

    await device.save();
    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/devices/:id  — also wipes location history
const deleteDevice = async (req, res, next) => {
  try {
    const device = await findOwnDevice(req.params.id, req.user._id, res);
    if (!device) return;

    await Location.deleteMany({ deviceId: device.deviceId });
    await device.deleteOne();

    res.json({ success: true, message: "Device and its history deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDevice,
  getMyDevices,
  getDevice,
  updateDevice,
  deleteDevice,
};
