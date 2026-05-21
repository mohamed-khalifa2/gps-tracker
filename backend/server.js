require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandling.middleware");

const app = express();

// ── Allowed origins
const rawOrigins = process.env.CLIENT_URL || "http://localhost:4200";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ── HTTP + Socket.io ────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 30000,
});

app.set("io", io);

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      socket.join(`user:${id}`);
      console.log(`${socket.id} → room user:${id}`);
    } catch {
      console.error(`${socket.id} bad token, not joining any room`);
    }
  }
  socket.on("disconnect", () => console.log(`disconnected: ${socket.id}`));
});

// Database
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/devices", require("./routes/device.routes"));
app.use("/api/location", require("./routes/location.route"));

app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);
app.use(errorHandler); //error handling middleware in the end

// Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
