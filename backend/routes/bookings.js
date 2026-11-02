import { Router } from "express";
import Booking from "../models/Booking.js";
import Showtime from "../models/Showtime.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// NOTE: must be declared BEFORE /:id so "my" isn't treated as an id

// @route  GET /api/bookings/my — current user's bookings (protected)
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({ path: "showtime", populate: [
        { path: "movie", select: "title poster" },
        { path: "theatre", select: "name city" },
      ] })
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
    if (seats.length > 10)
      return res.status(400).json({ message: "Maximum 10 seats per booking" });

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });

    // Real-time availability check (SkillWallet requirement)
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
      paymentStatus: "pending",
    });

    // Lock seats immediately (prevents double-booking)
    showtime.bookedSeats.push(...seats);
    await showtime.save();

    await booking.populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title poster" },
        { path: "theatre", select: "name city" },
      ],
    });
    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ─── Mock payment processing (SkillWallet: payment integration workflow) ───
   In production this endpoint would integrate Razorpay/Stripe.
   Free demo: simulated gateway with a deterministic "4242 4242" success flow. */

// @route  POST /api/payments/:bookingId/pay (protected)
router.post("/:bookingId/pay", protect, async (req, res) => {
  try {
    const { cardHolder = "" } = req.body || {};
    const booking = await Booking.findById(req.params.bookingId).populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title poster" },
        { path: "theatre", select: "name city" },
      ],
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not your booking" });
    if (booking.status === "cancelled")
      return res.status(400).json({ message: "Cannot pay for a cancelled booking" });
    if (booking.paymentStatus === "paid")
      return res.status(400).json({ message: "Booking already paid" });

    // Simulated gateway: 2s from POST → approved
    const txnId = "TXN" + Math.random().toString(36).slice(2, 10).toUpperCase();
    booking.paymentStatus = "paid";
    booking.payment = {
      method: "card (demo gateway)",
      cardHolder,
      transactionId: txnId,
      amount: booking.totalAmount,
      paidAt: new Date(),
    };
    await booking.save();
    res.json({ message: "Payment successful 🎉", transactionId: txnId, booking });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// @route  GET /api/bookings/:id (protected) — booking detail
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "showtime",
      populate: [
        { path: "movie", select: "title poster" },
        { path: "theatre", select: "name city" },
      ],
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Not your booking" });
    res.json(booking);
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
    // Refund if paid (demo gateway auto-refund)
    if (booking.paymentStatus === "paid") booking.paymentStatus = "refunded";
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

export default router;
