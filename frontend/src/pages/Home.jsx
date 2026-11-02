import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";
import MovieCard from "../components/MovieCard";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [cities, setCities] = useState([]);
  const [filters, setFilters] = useState({ search: "", genre: "", language: "", city: "" });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load filter options
  useEffect(() => {
    api.get("/movies/genres").then(({ data }) => setGenres(data)).catch(() => {});
    api.get("/movies/languages").then(({ data }) => setLanguages(data)).catch(() => {});
    api.get("/movies/cities").then(({ data }) => setCities(data)).catch(() => {});
  }, []);

  // Load movies (search + filters + pagination — SkillWallet instructions)
  useEffect(() => {
    setLoading(true);
    const params = { page };
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    api.get("/movies", { params })
      .then(({ data }) => {
        setMovies((prev) => (page === 1 ? data.movies : [...prev, ...data.movies]));
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch((e) => toast.error(e.response?.data?.message || "Failed to load movies"))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const update = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1); // reset pagination on any filter change
  };

  const active = (key, value) =>
    filters[key] === value ? "btn-danger" : "btn-outline-danger";

  return (
    <div>
      <div className="p-4 rounded-4 text-white mb-4"
        style={{ background: "linear-gradient(120deg,#1f1c2c,#e50914cc)" }}>
        <h1 className="fw-bold mb-1">🎬 Book your favourite movie, made simple.</h1>
        <p className="mb-0 opacity-75">
          Browse movies, pick a showtime and reserve seats with real-time availability.
        </p>
      </div>

      {/* Search bar */}
      <div className="row g-3 mb-3">
        <div className="col-md-6 offset-md-3">
          <input
            className="form-control form-control-lg"
            placeholder="Search movies…"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>
      </div>

      {/* City + language filter (movie search & filtering system) */}
      <div className="row g-3 mb-3">
        <div className="col-md-3 offset-md-3">
          <select
            className="form-select"
            value={filters.city}
            onChange={(e) => update("city", e.target.value)}
          >
            <option value="">📍 All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filters.language}
            onChange={(e) => update("language", e.target.value)}
          >
            <option value="">🌐 All languages</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Genre chips */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button className={`btn btn-sm ${active("genre", "")}`} onClick={() => update("genre", "")}>All genres</button>
        {genres.map((g) => (
          <button key={g} className={`btn btn-sm ${active("genre", g)}`} onClick={() => update("genre", g)}>{g}</button>
        ))}
      </div>

      {loading && page === 1 ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : movies.length === 0 ? (
        <p className="text-center text-secondary">No movies found for these filters.</p>
      ) : (
        <>
          <p className="text-secondary small mb-2">{total} movie(s) found</p>
          <div className="row g-4">
            {movies.map((m) => (
              <div key={m._id} className="col-6 col-md-4 col-lg-3">
                <MovieCard movie={m} />
              </div>
            ))}
          </div>
          {page < pages && (
            <div className="text-center mt-4">
              <button
                className="btn btn-outline-danger"
                disabled={loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {loading ? <span className="spinner-border spinner-border-sm" /> : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
