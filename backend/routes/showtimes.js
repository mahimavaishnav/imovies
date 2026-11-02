import { Router } from "express";
import Showtime, { TOTAL_SEATS } from "../models/Showtime.js";
import Theatre from "../models/Theatre.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// @route  GET /api/showtimes?movieId=&date=&city= — public listing with filters
router.get("/", async (req, res) => {
  try {
    const { movieId, date, city } = req.query;
    const filter = {};
    if (movieId) filter.movie = movieId;
    if (date) filter.date = date;
    const query = Showtime.find(filter).populate("theatre", "name city").populate("movie", "title poster");
    let showtimes = await query.sort({ date: 1, time: 1 });
    if (city) {
      showtimes = showtimes.filter((s) => s.theatre?.city === city);
    }
    res.json(showtimes);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// @route  POST /api/showtimes (admin) — schedule a show
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { movie, theatreId, date, time, price } = req.body;
    if (!movie || !theatreId || !date || !time)
      return res.status(400).json({ message: "movie, theatreId, date, time are required" });

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) return res.status(404).json({ message: "Theatre not found" });

    const showtime = await Showtime.create({ movie, theatre: theatreId, date, time, price: price || 10 });
    await showtime.populate("theatre", "name city");
    res.status(201).json(showtime);
  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({ message: "This movie already has a show at that date/time in that theatre" });
    res.status(400).json({ message: e.message });
  }
});

// @route  PUT /api/showtimes/:id (admin) — update show
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("theatre", "name city");
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });
    res.json(showtime);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// @route  DELETE /api/showtimes/:id (admin) — delete show (only if no bookings)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });
    if (showtime.bookedSeats.length > 0)
      return res.status(400).json({ message: "Cannot delete a show with existing bookings" });
    await showtime.deleteOne();
    res.json({ message: "Show deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
