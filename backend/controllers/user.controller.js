import User from "../models/user.model.js";
import statusCodes from "http-status-codes";

// GET /api/users/me
export const getProfile = (req, res) => {
  const { _id, name, email, role, createdAt } = req.user;
  res
    .status(statusCodes.OK)
    .json({ success: true, data: { id: _id, name, email, role, createdAt } });
};

// PUT /api/users/me
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    res.status(statusCodes.OK).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/me/password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ success: false, message: "Both passwords required" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res
        .status(statusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();
    res
      .status(statusCodes.OK)
      .json({ success: true, message: "Password updated" });
  } catch (err) {
    next(err);
  }
};
