const router = require("express").Router();
const {
  createDevice,
  getMyDevices,
  getDevice,
  updateDevice,
  deleteDevice,
} = require("../controllers/device.controller");
const { protect } = require("../middlewares/protect.middleware");
const { validateDevice } = require("../middlewares/validate.middleware");

router.use(protect); // all device routes require login
router.route("/").get(getMyDevices).post(validateDevice, createDevice);
router.route("/:id").get(getDevice).put(updateDevice).delete(deleteDevice);

module.exports = router;
