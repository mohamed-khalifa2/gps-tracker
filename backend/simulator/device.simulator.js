import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const BASE_URL = "http://localhost:3000";
const DEVICE_ID = "kia-1";
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 3000;

const state = { lat: 30.7865, lon: 31.0004, speed: 0 };
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const sendLocation = async (overrides = {}) => {
  const payload = {
    deviceId: DEVICE_ID,
    lat: state.lat,
    lon: state.lon,
    speed: state.speed,
    ...overrides,
  };
  await axios.post(`${BASE_URL}/api/location`, payload);
  return payload;
};

const tick = async () => {
  state.lat = clamp(state.lat + (Math.random() - 0.5) * 0.0005, -90, 90);
  state.lon = clamp(state.lon + (Math.random() - 0.5) * 0.0005, -180, 180);
  state.speed = Math.round(Math.random() * 80);

  try {
    const p = await sendLocation();
    console.log(
      `[${new Date().toISOString()}] ${DEVICE_ID} lat=${p.lat.toFixed(6)} lon=${p.lon.toFixed(6)} speed=${p.speed}km/h`,
    );
  } catch (err) {
    console.error("Send failed:", err.response?.data?.message || err.message);
  }
};

const shutdown = async (signal) => {
  console.log(`\n[${signal}] Simulator stopping — sending final parked ping…`);
  clearInterval(intervalId);

  try {
    await sendLocation({ speed: 0 });
    console.log("Final parked ping sent. Goodbye.");
  } catch (err) {
    console.error(
      "Failed to send final ping:",
      err.response?.data?.message || err.message,
    );
  }

  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log(`Simulator started for "${DEVICE_ID}" → ${BASE_URL}`);
const intervalId = setInterval(tick, INTERVAL_MS);
