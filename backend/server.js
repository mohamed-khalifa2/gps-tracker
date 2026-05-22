import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandling.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import deviceRoutes from "./routes/device.routes.js";
import locationRoutes from "./routes/location.route.js";

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";

// ── Allowed origins
const corsOptions = {
  origin: clientUrl,
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.set("trust proxy", 1);
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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/location", locationRoutes);

app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);
app.use(errorHandler); //error handling middleware in the end

// Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
