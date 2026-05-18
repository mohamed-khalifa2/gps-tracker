const router = require("express").Router();
const { register, login, getMe } = require("../controllers/auth.controller.js");
const { protect } = require("../middlewares/protect.middleware.js");
const {
  validateRegister,
  validateLogin,
} = require("../middlewares/validate.middleware.js");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getMe);

module.exports = router;
