import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import bookingRoutes from "./routes/bookings.js";

const app = express();

// ---------- middleware ----------
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","), // e.g. "http://localhost:5173,https://imovies.netlify.app"
    credentials: true,
  })
);
app.use(express.json());

// ---------- routes ----------
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "IMovies API", time: new Date().toISOString() })
);
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", bookingRoutes); // showtime detail route lives in bookings file
app.use("/api/bookings", bookingRoutes);

// ---------- 404 + error handler ----------
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
await connectDB();
app.listen(PORT, () =>
  console.log(`🎬 IMovies API running on http://localhost:${PORT}`)
);
