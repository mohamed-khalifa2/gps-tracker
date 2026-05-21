const router = require("express").Router();
const {
  createDevice,
  getMyDevices,
  getDevice,
  updateDevice,
  deleteDevice,
} = require("../controllers/device.controller");
const { protect } = require("../middlewares/protect.middleware");

router.use(protect); // all device routes require login
router.route("/").get(getMyDevices).post(createDevice);
router.route("/:id").get(getDevice).put(updateDevice).delete(deleteDevice);

module.exports = router;
