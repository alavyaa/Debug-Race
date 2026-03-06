const http = require("http");
require("dotenv").config();
const app = require("./src/app");
const { initSocket } = require("./src/config/socket");
const connectDB = require("./src/config/db");

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  server.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
})();