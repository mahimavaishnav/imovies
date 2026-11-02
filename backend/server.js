import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import showtimeRoutes from "./routes/showtimes.js";
import bookingRoutes from "./routes/bookings.js";

const app = express();

/* ---------- DB connection (serverless-safe) ---------- */
async function connectDB() {
  // Reuse cached connection across warm serverless invocations
  if (mongoose.connection.readyState === 1) return;
  if (!global.__mongoConnecting) {
    global.__mongoConnecting = mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log(`✅ MongoDB connected: ${mongoose.connection.host}`))
      .catch((e) => console.error(`❌ MongoDB connection error: ${e.message}`));
  }
  await global.__mongoConnecting;
}

app.set("trust proxy", 1); // safe behind Render/Vercel proxies
app.use(async (_req, res, next) => {
  try {
    await connectDB(); // ensure DB is connected before any route handles a request
    next();
  } catch (e) {
    res.status(503).json({ message: "Database connection failed: " + e.message });
  }
});
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","), // e.g. "http://localhost:5173,https://imovies.vercel.app"
    credentials: true,
  })
);
app.use(express.json());

// SkillWallet instruction: express rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests — please slow down." },
  })
);

// ---------- routes ----------
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "IMovies API", time: new Date().toISOString() })
);
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/bookings", bookingRoutes); // also serves /api/bookings/:bookingId/pay

// ---------- 404 + error handler (centralized error handling/logging) ----------
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${err.stack}`);
  res.status(500).json({ message: err.message });
});

// ---------- start server (local/Render only — Vercel imports the app instead) ----------
export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🎬 IMovies API running on http://localhost:${PORT}`)
  );
}
