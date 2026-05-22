import express from "express";
const router = express.Router();
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

router.use(protect);

router.get("/me", getProfile);
router.put("/me", updateProfile);
router.put("/me/password", changePassword);

export default router;
