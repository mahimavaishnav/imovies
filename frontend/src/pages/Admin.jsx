import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const emptyMovie = {
  title: "", description: "", genre: "Action", language: "English",
  duration: 120, rating: "PG-13", poster: "", releaseYear: 2026,
};

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("movies");
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [form, setForm] = useState(emptyMovie);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState({ movieId: "", theatreId: "", date: "", time: "06:30 PM", price: 10 });
  const emptyTheatre = { name: "", city: "" };
  const [theatreForm, setTheatreForm] = useState(emptyTheatre);

  const isAdmin = user?.role === "admin";

  const load = async () => {
    try {
      const [m, t, s] = await Promise.all([
        api.get("/movies", { params: { limit: 100 } }),
        api.get("/theatres"),
        api.get("/showtimes"),
      ]);
      setMovies(m.data.movies);
      setTheatres(t.data);
      setShows(s.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load admin data");
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin)
    return (
      <div className="text-center py-5">
        <h3>🔒 Admins only</h3>
        <p className="text-secondary">This dashboard requires an admin account.</p>
        <Link to="/" className="btn btn-outline-danger">Back to Movies</Link>
      </div>
    );

  /* ─── movie form submit: create or update (full CRUD) ─── */
  const saveMovie = async (e) => {
    e.preventDefault();
    // Explicit payload — never ships stale fields (_id, timestamps) with a PUT
    const payload = {
      title: form.title,
      description: form.description,
      genre: [form.genre],
      language: form.language,
      duration: +form.duration,
      rating: form.rating,
      poster: form.poster,
      releaseYear: +form.releaseYear,
    };
    try {
      if (editId) {
        await api.put(`/movies/${editId}`, payload);
        toast.success("Movie updated");
      } else {
        await api.post("/movies", payload);
        toast.success("Movie added");
      }
      setForm(emptyMovie);
      setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const editMovie = (m) => {
    setTab("movies");
    setEditId(m._id);
    setForm({ ...emptyMovie, ...m, genre: m.genre[0] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteMovie = async (m) => {
    if (!confirm(`Delete "${m.title}" and all its shows?`)) return;
    try {
      await api.delete(`/movies/${m._id}`);
      toast.success("Movie deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const addShow = async (e) => {
    e.preventDefault();
    try {
      await api.post("/showtimes", {
        movie: showForm.movieId,
        theatreId: showForm.theatreId,
        date: showForm.date,
        time: showForm.time,
        price: +showForm.price,
      });
      toast.success("Show scheduled");
      setShowForm((f) => ({ ...f, date: "" }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not schedule show");
    }
  };

  const deleteShow = async (id) => {
    if (!confirm("Delete this show?")) return;
    try {
      await api.delete(`/showtimes/${id}`);
      toast.success("Show deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  /* ─── theatre management (full CRUD) ─── */
  const saveTheatre = async (e) => {
    e.preventDefault();
    try {
      await api.post("/theatres", { name: theatreForm.name, city: theatreForm.city });
      toast.success("Theatre added");
      setTheatreForm(emptyTheatre);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add theatre");
    }
  };

  const deleteTheatre = async (t) => {
    if (!confirm(`Delete theatre "${t.name}" (${t.city})?`)) return;
    try {
      await api.delete(`/theatres/${t._id}`);
      toast.success("Theatre deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">⚡ Admin Dashboard</h2>
        <span className="badge bg-danger">manage movies · theatres · shows</span>
      </div>

      <ul className="nav nav-pills mb-4">
        {[["movies", "Movies"], ["shows", "Shows"], ["theatres", "Theatres"]].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button className={`nav-link ${tab === key ? "active bg-danger" : "text-dark"}`} onClick={() => setTab(key)}>
              {label}
            </button>
          </li>
        ))}
      </ul>

      {tab === "movies" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card" style={{ border: 0 }}>
              <div className="card-body">
                <h5>{editId ? "✏️ Edit movie" : "➕ Add movie"}</h5>
                <form onSubmit={saveMovie}>
                  <input className="form-control mb-2" placeholder="Title" required
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <textarea className="form-control mb-2" placeholder="Description" rows={2} required
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <div className="row">
                    <div className="col-6 mb-2">
                      <input className="form-control" placeholder="Genre (e.g. Action)" required
                        value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
                    </div>
                    <div className="col-6 mb-2">
                      <input className="form-control" placeholder="Language" required
                        value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
                    </div>
                    <div className="col-4 mb-2">
                      <input type="number" className="form-control" placeholder="Duration (min)" required
                        value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                    </div>
                    <div className="col-4 mb-2">
                      <input type="number" className="form-control" placeholder="Year" required
                        value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} />
                    </div>
                    <div className="col-4 mb-2">
                      <select className="form-select" value={form.rating}
                        onChange={(e) => setForm({ ...form, rating: e.target.value })}>
                        {["G", "PG", "PG-13", "R"].map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <input className="form-control mb-3" placeholder="Poster URL" required
                    value={form.poster} onChange={(e) => setForm({ ...form, poster: e.target.value })} />
                  <div className="d-flex gap-2">
                    <button className="btn btn-danger">{editId ? "Update" : "Add movie"}</button>
                    {editId && (
                      <button type="button" className="btn btn-outline-secondary"
                        onClick={() => { setEditId(null); setForm(emptyMovie); }}>Cancel</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="table-responsive">
              <table className="table align-middle bg-white shadow-sm" style={{ borderRadius: 10 }}>
                <thead><tr><th>Movie</th><th>Genre</th><th>Lang</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {movies.map((m) => (
                    <tr key={m._id}>
                      <td style={{ maxWidth: 220 }}>
                        <div className="d-flex align-items-center gap-2">
                          <img src={m.poster} alt="" style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 4 }} />
                          <div>
                            <div className="fw-semibold">{m.title}</div>
                            <small className="text-secondary">{m.duration} min · {m.releaseYear}</small>
                          </div>
                        </div>
                      </td>
                      <td><small>{m.genre.join(", ")}</small></td>
                      <td><small>{m.language}</small></td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => editMovie(m)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMovie(m)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "shows" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card" style={{ border: 0 }}>
              <div className="card-body">
                <h5>➕ Schedule a show</h5>
                <form onSubmit={addShow}>
                  <select className="form-select mb-2" required value={showForm.movieId}
                    onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}>
                    <option value="">Select movie…</option>
                    {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
                  </select>
                  <select className="form-select mb-2" required value={showForm.theatreId}
                    onChange={(e) => setShowForm({ ...showForm, theatreId: e.target.value })}>
                    <option value="">Select theatre…</option>
                    {theatres.map((t) => <option key={t._id} value={t._id}>{t.name} — {t.city}</option>)}
                  </select>
                  <input type="date" className="form-control mb-2" required value={showForm.date}
                    onChange={(e) => setShowForm({ ...showForm, date: e.target.value })} />
                  <div className="row">
                    <div className="col-7 mb-3">
                      <select className="form-select" value={showForm.time}
                        onChange={(e) => setShowForm({ ...showForm, time: e.target.value })}>
                        {["10:30 AM", "02:00 PM", "06:30 PM", "09:45 PM"].map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-5 mb-3">
                      <input type="number" min={1} className="form-control" value={showForm.price}
                        onChange={(e) => setShowForm({ ...showForm, price: e.target.value })} />
                    </div>
                  </div>
                  <button className="btn btn-danger">Schedule show</button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="table-responsive" style={{ maxHeight: 480, overflowY: "auto" }}>
              <table className="table align-middle bg-white shadow-sm">
                <thead><tr><th>Date</th><th>Time</th><th>Theatre</th><th>Booked</th><th className="text-end">Del</th></tr></thead>
                <tbody>
                  {shows.map((s) => (
                    <tr key={s._id}>
                      <td><small>{s.date}</small></td>
                      <td><small>{s.time}</small></td>
                      <td><small>{s.theatre?.name} · {s.theatre?.city}</small></td>
                      <td><small>{s.bookedSeats?.length || 0}/60</small></td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteShow(s._id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "theatres" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card" style={{ border: 0 }}>
              <div className="card-body">
                <h5>➕ Add theatre</h5>
                <form onSubmit={saveTheatre}>
                  <input className="form-control mb-2" placeholder="Theatre name (e.g. PVR Cinemas)" required
                    value={theatreForm.name} onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })} />
                  <input className="form-control mb-3" placeholder="City (e.g. Hyderabad)" required
                    value={theatreForm.city} onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })} />
                  <button className="btn btn-danger">Add theatre</button>
                </form>
                <p className="text-secondary small mt-3 mb-0">
                  Theatres are used in the "Schedule a show" dropdown. A theatre can only be deleted when no shows reference it.
                </p>
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="table-responsive">
              <table className="table align-middle bg-white shadow-sm" style={{ borderRadius: 10 }}>
                <thead><tr><th>Theatre</th><th>City</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {theatres.map((t) => (
                    <tr key={t._id}>
                      <td className="fw-semibold">🏛 {t.name}</td>
                      <td><small className="text-secondary">📍 {t.city}</small></td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteTheatre(t)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
