import mongoose from "mongoose";

// Seat layout: 6 rows (A-F) x 10 seats = 60 seats per show
export const ROWS = ["A", "B", "C", "D", "E", "F"];
export const SEATS_PER_ROW = 10;
export const TOTAL_SEATS = ROWS.length * SEATS_PER_ROW;

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    theater: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // e.g. "10:30 AM"
    price: { type: Number, required: true, default: 10 },
    bookedSeats: { type: [String], default: [] }, // e.g. ["A1", "A2"]
  },
  { timestamps: true }
);

showtimeSchema.index({ movie: 1, date: 1, time: 1 }, { unique: true });

showtimeSchema.methods.availableSeats = function () {
  return TOTAL_SEATS - this.bookedSeats.length;
};

export default mongoose.model("Showtime", showtimeSchema);
