import { useEffect, useState } from "react";
import api from "../api";
import MovieCard from "../components/MovieCard";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/movies/genres").then(({ data }) => setGenres(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (genre) params.genre = genre;
    api.get("/movies", { params })
      .then(({ data }) => setMovies(data))
      .finally(() => setLoading(false));
  }, [search, genre]);

  return (
    <div>
      <div className="p-4 rounded-4 text-white mb-4"
        style={{ background: "linear-gradient(120deg,#1f1c2c,#e50914cc)" }}>
        <h1 className="fw-bold mb-1">🎬 Book your favourite movie, made simple.</h1>
        <p className="mb-0 opacity-75">
          Browse movies, pick a showtime and reserve seats with real-time availability.
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6 offset-md-3">
          <input
            className="form-control form-control-lg"
            placeholder="Search movies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          className={`btn btn-sm ${genre === "" ? "btn-danger" : "btn-outline-danger"}`}
          onClick={() => setGenre("")}
        >
          All
        </button>
        {genres.map((g) => (
          <button
            key={g}
            className={`btn btn-sm ${genre === g ? "btn-danger" : "btn-outline-danger"}`}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : movies.length === 0 ? (
        <p className="text-center text-secondary">No movies found. Run `npm run seed` on the backend.</p>
      ) : (
        <div className="row g-4">
          {movies.map((m) => (
            <div key={m._id} className="col-6 col-md-4 col-lg-3">
              <MovieCard movie={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
