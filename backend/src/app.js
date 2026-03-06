const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();

app.use(cors({
  origin: [
    "https://debug-race-s8w9.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/lobby", require("./routes/lobby.route"));
app.use("/api/race", require("./routes/race"));
app.use("/api/ai", require("./routes/ai"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.path}`
  });
});

module.exports = app;
