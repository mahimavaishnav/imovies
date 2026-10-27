import { Router } from "express";
import Movie from "../models/Movie.js";
import Showtime, { ROWS, SEATS_PER_ROW, TOTAL_SEATS } from "../models/Showtime.js";

const router = Router();

// @route  GET /api/movies?search=&genre=
router.get("/", async (req, res) => {
  try {
    const { search, genre } = req.query;
    const filter = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (genre) filter.genre = genre;
    const movies = await Movie.find(filter).sort({ releaseYear: -1 });
    res.json(movies);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// @route  GET /api/movies/genres — distinct genre list
router.get("/genres", async (_req, res) => {
  const genres = await Movie.distinct("genre");
  res.json(genres.sort());
});

// @route  GET /api/movies/:id — movie + its showtimes
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    const showtimes = await Showtime.find({ movie: movie._id }).sort({
      date: 1,
      time: 1,
    });
    res.json({ movie, showtimes, seatLayout: { rows: ROWS, seatsPerRow: SEATS_PER_ROW, totalSeats: TOTAL_SEATS } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
