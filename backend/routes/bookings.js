import { Router } from "express";
import Booking from "../models/Booking.js";
import Showtime from "../models/Showtime.js";
import Movie from "../models/Movie.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// @route  GET /api/bookings/my — current user's bookings (protected)
// NOTE: must be declared BEFORE /:id so "my" isn't treated as an id
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({ path: "showtime", populate: { path: "movie" } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// @route  POST /api/bookings — create booking (protected)
router.post("/", protect, async (req, res) => {
  try {
    const { showtimeId, seats } = req.body;
    if (!showtimeId || !Array.isArray(seats) || seats.length === 0)
      return res.status(400).json({ message: "showtimeId and seats are required" });

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });

    // Real-time availability check
    const alreadyBooked = seats.filter((s) => showtime.bookedSeats.includes(s));
    if (alreadyBooked.length)
      return res.status(409).json({
        message: `Seat(s) ${alreadyBooked.join(", ")} were just taken. Please pick different seats.`,
        bookedSeats: showtime.bookedSeats,
      });

    const totalAmount = +(showtime.price * seats.length).toFixed(2);
    const bookingRef = "IMV-" + Date.now().toString(36).toUpperCase();

    const booking = await Booking.create({
      user: req.user.id,
      showtime: showtime._id,
      seats,
      totalAmount,
      bookingRef,
    });

    // Mark seats booked
    showtime.bookedSeats.push(...seats);
    await showtime.save();

    const populated = await booking.populate({
      path: "showtime",
      populate: { path: "movie", select: "title poster" },
    });
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// @route  PUT /api/bookings/:id/cancel — cancel booking, free the seats (protected)
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not your booking" });
    if (booking.status === "cancelled")
      return res.status(400).json({ message: "Booking already cancelled" });

    booking.status = "cancelled";
    await booking.save();

    const showtime = await Showtime.findById(booking.showtime);
    if (showtime) {
      showtime.bookedSeats = showtime.bookedSeats.filter(
        (s) => !booking.seats.includes(s)
      );
      await showtime.save();
    }
    res.json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// @route  GET /api/showtimes/:id — seat map for one show
// (this router is mounted at both /api/bookings and /api/showtimes in server.js;
//  declared last so it never shadows the named routes above)
router.get("/:id", async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate(
      "movie",
      "title poster"
    );
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });
    res.json(showtime);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
