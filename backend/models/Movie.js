import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    genre: { type: [String], required: true },
    language: { type: String, default: "English" },
    duration: { type: Number, required: true }, // minutes
    rating: { type: String, enum: ["G", "PG", "PG-13", "R"], default: "PG-13" },
    poster: { type: String, required: true }, // image URL
    releaseYear: { type: Number, required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: all showtimes of this movie
movieSchema.virtual("showtimes", {
  ref: "Showtime",
  localField: "_id",
  foreignField: "movie",
});

export default mongoose.model("Movie", movieSchema);
