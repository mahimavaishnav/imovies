import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },
    seats: { type: [String], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    bookingRef: { type: String, unique: true },
    // Payment integration workflow (mock gateway)
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    payment: {
      method: { type: String },
      cardHolder: { type: String },
      transactionId: { type: String },
      amount: { type: Number },
      paidAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
