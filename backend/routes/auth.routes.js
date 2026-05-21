const router = require("express").Router();
const { register, login, getMe } = require("../controllers/auth.controller.js");
const { protect } = require("../middlewares/protect.middleware.js");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

module.exports = router;
