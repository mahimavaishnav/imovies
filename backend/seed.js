/**
 * Seeds the IMovies database with sample movies + showtimes.
 * Run: npm run seed   (requires MONGO_URI in .env)
 */
import "dotenv/config";
import mongoose from "mongoose";
import Movie from "./models/Movie.js";
import Showtime from "./models/Showtime.js";

const MOVIES = [
  {
    title: "Dune: Part Two",
    description:
      "Paul Atreides unites with the Fremen to wage war against the Harkonnens and avert the terrible future he has foreseen.",
    genre: ["Sci-Fi", "Adventure"],
    language: "English",
    duration: 166,
    rating: "PG-13",
    poster: "https://image.tmdb.org/t/p/w500/1pdflvkbX9fNJUB2G9kVgmx5Ntl.jpg",
    releaseYear: 2024,
  },
  {
    title: "Oppenheimer",
    description:
      "The story of J. Robert Oppenheimer and the creation of the atomic bomb during World War II.",
    genre: ["Drama", "History"],
    language: "English",
    duration: 180,
    rating: "R",
    poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    releaseYear: 2023,
  },
  {
    title: "Inception",
    description:
      "A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.",
    genre: ["Sci-Fi", "Thriller"],
    language: "English",
    duration: 148,
    rating: "PG-13",
    poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    releaseYear: 2010,
  },
  {
    title: "Interstellar",
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    genre: ["Sci-Fi", "Drama"],
    language: "English",
    duration: 169,
    rating: "PG-13",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    releaseYear: 2014,
  },
  {
    title: "The Dark Knight",
    description:
      "Batman faces the Joker, a criminal mastermind who plunges Gotham City into chaos.",
    genre: ["Action", "Crime"],
    language: "English",
    duration: 152,
    rating: "PG-13",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMCDuxEVa2yXk4Z43d29y.jpg",
    releaseYear: 2008,
  },
  {
    title: "RRR",
    description:
      "A legendary Indian action epic about two real-life revolutionaries and their fight against the British Raj.",
    genre: ["Action", "Drama"],
    language: "Telugu",
    duration: 187,
    rating: "PG-13",
    poster: "https://image.tmdb.org/t/p/w500/eOHpHaso2B3Q60bI1dACq90Ga6d.jpg",
    releaseYear: 2022,
  },
];

// Generate the next 3 days from today
const DATES = [0, 1, 2].map((d) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
});
const TIMES = ["10:30 AM", "02:00 PM", "06:30 PM", "09:45 PM"];
const THEATERS = ["PVR Cinemas", "IMAX Grand", "Regal Multiplex"];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("Set MONGO_URI in backend/.env first.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Clearing old data...");
  await Movie.deleteMany({});
  await Showtime.deleteMany({});

  const shows = [];
  for (const m of MOVIES) {
    const movie = await Movie.create(m);
    // 2 theaters x 2 times = 4 shows per movie
    for (const date of DATES.slice(0, 2)) {
      for (const [t, time] of TIMES.slice(0, 2).entries()) {
        shows.push(await Showtime.create({
          movie: movie._id,
          theater: THEATERS[t === 0 ? 0 : 1],
          date,
          time,
          price: 8 + t * 2,
        }));
      }
    }
  }
  console.log(`✅ Seeded ${MOVIES.length} movies and ${shows.length} showtimes.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
