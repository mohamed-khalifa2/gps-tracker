const { body, param, validationResult } = require("express-validator");

const handle = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  handle,
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handle,
];

const validateDevice = [
  body("name").trim().notEmpty().withMessage("Device name is required"),
  body("deviceId").trim().notEmpty().withMessage("deviceId is required"),
  handle,
];

const validateLocation = [
  body("deviceId").trim().notEmpty().withMessage("deviceId is required"),
  body("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("lon").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  body("speed")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Speed must be >= 0"),
  handle,
];

const validateDeviceIdParam = [
  param("deviceId").trim().notEmpty().withMessage("deviceId param required"),
  handle,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateDevice,
  validateLocation,
  validateDeviceIdParam,
};
