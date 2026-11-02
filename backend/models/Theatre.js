import mongoose from "mongoose";

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true }, // location filter
    imagePath: { type: String, default: "" },
  },
  { timestamps: true }
);

theatreSchema.index({ name: 1, city: 1 }, { unique: true });

export default mongoose.model("Theatre", theatreSchema);
