const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();

/* CORS CONFIG */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://debug-racee.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

/* HEALTH CHECK ROUTE (important for Railway) */
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
