const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

// Verify JWT and attach req.user
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

// Role guard (use after protect)
// const authorize =
//   (...roles) =>
//   (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }
//     next();
//   };

module.exports = { protect };
