const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();

/* CORS FIX */
app.use(cors({
  origin: "https://debug-racee.onrender.com",
  credentials: true
}));

/* IMPORTANT: allow preflight */
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

/* HEALTH CHECK ROUTE */
app.get("/", (req, res) => {
  res.send("Debug Race backend running 🚀");
});

/* ROUTES */
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/lobby", require("./routes/lobby.route"));
app.use("/api/race", require("./routes/race"));
app.use("/api/ai", require("./routes/ai"));

/* 404 HANDLER */
app.use((req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.path}`
  });
});

/* GLOBAL ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err.message });
});

module.exports = app;
