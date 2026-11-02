/**
 * Seeds the IMovies database with theatres, an admin account, movies + shows.
 * Run: npm run seed   (requires MONGO_URI in .env)
 *
 * Demo accounts after seeding:
 *   Admin: admin@imovies.dev / admin123
 *   User : test@imovies.dev / test123
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Movie from "./models/Movie.js";
import Showtime from "./models/Showtime.js";
import Theatre from "./models/Theatre.js";
import User from "./models/User.js";

const THEATRES = [
  { name: "PVR Cinemas", city: "Hyderabad" },
  { name: "IMAX Grand", city: "Hyderabad" },
  { name: "Regal Multiplex", city: "Chennai" },
  { name: "Cinepolis City Center", city: "Bangalore" },
];

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
  {
    title: "Fidaa",
    description:
      "A love-hate romance between a Telugu boy and a US-raised girl against the scenic backdrop of rural Telangana.",
    genre: ["Romance", "Drama"],
    language: "Telugu",
    duration: 141,
    rating: "PG",
    poster: "https://image.tmdb.org/t/p/w500/lQvklRQ3jXJlhXI7gL5ZFn3OXnu.jpg",
    releaseYear: 2017,
  },
  {
    title: "Kaithi",
    description:
      "An ex-convict must transport unconscious police officers to a hospital while fending off a gang attack.",
    genre: ["Action", "Thriller"],
    language: "Tamil",
    duration: 145,
    rating: "R",
    poster: "https://image.tmdb.org/t/p/w500/6PjVw2YSiaF9g0L9c3M0dI9vX2O.jpg",
    releaseYear: 2019,
  },
];

const DATES = [0, 1, 2].map((d) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
});
const TIMES = ["10:30 AM", "02:00 PM", "06:30 PM", "09:45 PM"];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("Set MONGO_URI in backend/.env first.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Clearing old data...");
  await Promise.all([
    Movie.deleteMany({}),
    Showtime.deleteMany({}),
    Theatre.deleteMany({}),
    User.deleteMany({}),
  ]);

  // Admin + demo user (role-based security)
  await User.create([
    { name: "IMovies Admin", email: "admin@imovies.dev", password: await bcrypt.hash("admin123", 10), role: "admin" },
    { name: "Test User", email: "test@imovies.dev", password: await bcrypt.hash("test123", 10), role: "user" },
  ]);
  console.log("👤 Admin + demo user created (admin@imovies.dev / admin123, test@imovies.dev / test123)");

  const theatres = await Theatre.insertMany(THEATRES);
  console.log(`🏛 ${theatres.length} theatres created across ${THEATRES.map((t) => t.city).length} cities`);

  let showCount = 0;
  for (const m of MOVIES) {
    const movie = await Movie.create(m);
    const days = DATES.slice(0, 2);
    for (const date of days) {
      const cityTheatres = pickTheatres(theatres, movie.title);
      for (const [i, th] of cityTheatres.entries()) {
        const time = TIMES[(i + showCount) % TIMES.length];
        const nextTime = TIMES[(i + showCount + 1) % TIMES.length];
        for (const t of [time, nextTime]) {
          await Showtime.create({ movie: movie._id, theatre: th._id, date, time: t, price: 8 + i * 2 });
          showCount++;
        }
      }
    }
  }
  console.log(`✅ Seeded ${MOVIES.length} movies and ${showCount} shows.`);
  await mongoose.disconnect();
  process.exit(0);
};

// deterministic pseudo-random theatre selection
const pickTheatres = (theatres, title) => {
  const seed = title.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...theatres].sort((a, b) => (a.name + seed) % 7 - (b.name + seed) % 7);
  return shuffled.slice(0, 2);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
