const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const authenticateUser = async (req, res, next) => {
  try {

    // TOKEN FROM COOKIE
    let token = req.cookies.token;

    // ALSO CHECK AUTH HEADER
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized !" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid token", error });
  }
};

module.exports = authenticateUser;
