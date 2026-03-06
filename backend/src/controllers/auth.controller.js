const jwt = require("jsonwebtoken");
const userModel = require("../models/User.model");
const bcrypt = require("bcrypt");
// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register user
// @route   POST /api/auth/register
async function registerController(req, res) {
  try {
    const { username, email, password } = req.body;

    const userExists = await userModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Registered successfully!",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// @desc    Login user
// @route   POST /api/auth/login
async function loginController(req, res) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(402).json({ message: "User Not Exists!" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(201).json({ message: "Invalid Credentials!" });
    }
    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Logged in Successfully!", user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
// @desc    Login user
// @route   POST /api/auth/logout
async function logOutController(req,res){
  try {
    res.cookie("token", "", { maxAge: 0, httpOnly: true }); 
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// // @desc    Get user profile
// // @route   GET /api/auth/profile
async function getProfileController(req, res) {
  try {
    const user = await userModel.findById(req.user._id).select("-password");
    res.status(200).json({ message: "Fetched User Profile!", user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { registerController, loginController, getProfileController, logOutController };
