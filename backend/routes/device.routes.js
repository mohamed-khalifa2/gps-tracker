import express from "express";
const router = express.Router();
import {
  getMyDevices,
  createDevice,
  getDevice,
  updateDevice,
  deleteDevice,
} from "../controllers/device.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

router.use(protect); // all device routes require login
router.route("/").get(getMyDevices).post(createDevice);
router.route("/:id").get(getDevice).put(updateDevice).delete(deleteDevice);

export default router;
