import { Router } from "express";
import Movie from "../models/Movie.js";
import Showtime, { ROWS, SEATS_PER_ROW, TOTAL_SEATS } from "../models/Showtime.js";
import Theatre from "../models/Theatre.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// @route  GET /api/movies — paginated + search + genre/language/city/location filters
router.get("/", async (req, res) => {
  try {
    const { search, genre, language, city, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (genre) filter.genre = genre;
    if (language) filter.language = language;

    // city/location filter: restrict to movies running in that city
    if (city) {
      const theatres = await Theatre.find({ city }).distinct("_id");
      const movieIds = await Showtime.find({ theatre: { $in: theatres } }).distinct("movie");
      filter._id = { $in: movieIds };
    }

    const query = Movie.find(filter).sort({ releaseYear: -1 });
    const total = await Movie.countDocuments(filter);
    const movies = await query
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json({ movies, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// @route  GET /api/movies/genres — distinct genre list
router.get("/genres", async (_req, res) => {
  const genres = await Movie.distinct("genre");
  res.json(genres.sort());
});

// @route  GET /api/movies/languages — distinct language list
router.get("/languages", async (_req, res) => {
  const languages = await Movie.distinct("language");
  res.json(languages.sort());
});

// @route  GET /api/movies/cities — cities where shows exist
router.get("/cities", async (_req, res) => {
  const cities = await Theatre.distinct("city");
  res.json(cities.sort());
});

// @route  GET /api/movies/:id — movie + shows (optionally ?date=YYYY-MM-DD)
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    const showFilter = { movie: movie._id };
    if (req.query.date) showFilter.date = req.query.date;
    const showtimes = await Showtime.find(showFilter)
      .populate("theatre", "name city")
      .sort({ date: 1, time: 1 });
    res.json({
      movie,
      showtimes,
      seatLayout: { rows: ROWS, seatsPerRow: SEATS_PER_ROW, totalSeats: TOTAL_SEATS },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ─── Admin-only full CRUD (SkillWallet: Admin role with protected routes) ─── */

// @route  POST /api/movies (admin)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// @route  PUT /api/movies/:id (admin)
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// @route  DELETE /api/movies/:id (admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await Showtime.deleteMany({ movie: req.params.id });
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json({ message: "Movie and its shows deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
