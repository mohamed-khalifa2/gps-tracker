const router = require("express").Router();
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/user.controller.js");
const { protect } = require("../middlewares/protect.middleware.js");

router.use(protect);

router.get("/me", getProfile);
router.put("/me", updateProfile);
router.put("/me/password", changePassword);

module.exports = router;
