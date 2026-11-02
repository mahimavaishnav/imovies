import { Router } from "express";
import Theatre from "../models/Theatre.js";
import Showtime from "../models/Showtime.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Public: list all theatres (Admin page + future city browsing)
router.get("/", async (_req, res, next) => {
  try {
    res.json(await Theatre.find().sort({ city: 1, name: 1 }));
  } catch (e) {
    next(e);
  }
});

// Admin: create theatre
router.post("/", protect, authorize("admin"), async (req, res, next) => {
  try {
    const { name, city, imagePath } = req.body || {};
    if (!name || !city) {
      return res.status(400).json({ message: "Theatre name and city are required" });
    }
    const exists = await Theatre.findOne({ name: name.trim(), city: city.trim() });
    if (exists) return res.status(409).json({ message: "This theatre already exists in that city" });
    const t = await Theatre.create({ name, city, imagePath });
    res.status(201).json(t);
  } catch (e) {
    next(e);
  }
});

// Admin: update theatre
router.put("/:id", protect, authorize("admin"), async (req, res, next) => {
  try {
    const { name, city, imagePath } = req.body || {};
    const t = await Theatre.findByIdAndUpdate(
      req.params.id,
      { $set: { ...(name && { name }), ...(city && { city }), ...(imagePath !== undefined && { imagePath }) } },
      { new: true, runValidators: true }
    );
    if (!t) return res.status(404).json({ message: "Theatre not found" });
    res.json(t);
  } catch (e) {
    next(e);
  }
});

// Admin: delete theatre (blocked while shows are scheduled there)
router.delete("/:id", protect, authorize("admin"), async (req, res, next) => {
  try {
    const showCount = await Showtime.countDocuments({ theatre: req.params.id });
    if (showCount > 0) {
      return res.status(409).json({ message: `Cannot delete — ${showCount} show(s) are scheduled at this theatre` });
    }
    const t = await Theatre.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: "Theatre not found" });
    res.json({ message: "Theatre deleted" });
  } catch (e) {
    next(e);
  }
});

export default router;
