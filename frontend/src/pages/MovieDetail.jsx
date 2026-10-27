import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import SeatMap from "../components/SeatMap";
import { useAuth } from "../context/AuthContext";

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [seatLayout, setSeatLayout] = useState({ rows: 6, seatsPerRow: 10 });

  const [showtimeId, setShowtimeId] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState(null);
  const [booking, setBooking] = useState(null);

  // Load movie + showtimes
  useEffect(() => {
    api.get(`/movies/${id}`)
      .then(({ data }) => {
        setMovie(data.movie);
        setShowtimes(data.showtimes);
        const s = data.showtimes[0];
        if (s) { setShowtimeId(s._id); setBookedSeats(s.bookedSeats); }
        if (data.seatLayout) {
          setSeatLayout({ rows: data.seatLayout.rows.length, seatsPerRow: data.seatLayout.seatsPerRow });
        }
      })
      .catch(() => setMessage({ type: "danger", text: "Failed to load movie" }));
  }, [id]);

  const pickShowtime = (s) => {
    setShowtimeId(s._id);
    setBookedSeats(s.bookedSeats);
    setSelected([]);
    setMessage(null);
  };

  const toggleSeat = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const book = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/movies/${id}` } });
      return;
    }
    try {
      const { data } = await api.post("/bookings", { showtimeId, seats: selected });
      setBooking(data);
      setMessage({ type: "success", text: "Your tickets are booked!" });
      setBookedSeats((b) => [...b, ...selected]);
      setSelected([]);
      setShowtimes((st) =>
        st.map((s) =>
          s._id === showtimeId ? { ...s, bookedSeats: [...s.bookedSeats, ...selected] } : s
        )
      );
    } catch (e) {
      setMessage({ type: "danger", text: e.response?.data?.message || "Booking failed" });
      if (e.response?.data?.bookedSeats) setBookedSeats(e.response.data.bookedSeats);
    }
  };

  if (!movie) return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;

  const dates = [...new Set(showtimes.map((s) => s.date))];
  const currentShowtime = showtimes.find((s) => s._id === showtimeId);
  const activeBooking = booking && booking.showtime && booking.showtime._id === showtimeId ? booking : null;

  return (
    <div className="row g-4">
      {/* Left: movie info */}
      <div className="col-lg-4">
        <img src={movie.poster} alt={movie.title} className="img-fluid rounded-4 shadow" />
        <h2 className="mt-3">{movie.title}</h2>
        <p className="text-secondary mb-1">
          {movie.rating} · {movie.language} · {movie.duration} min · {movie.releaseYear}
        </p>
        <div className="d-flex gap-1 flex-wrap mb-3">
          {movie.genre.map((g) => <span key={g} className="badge bg-danger">{g}</span>)}
        </div>
        <p>{movie.description}</p>
      </div>

      {/* Right: booking panel */}
      <div className="col-lg-8">
        {message && (
          <div className={`alert alert-${message.type} d-flex justify-content-between`}>
            <span>{message.text}</span>
            {activeBooking && (
              <Link to="/my-bookings" className="alert-link">View in My Bookings →</Link>
            )}
          </div>
        )}

        <div className="card mb-2">
          <div className="card-body">
            <h5 className="mb-3">1. Choose a showtime</h5>

            {dates.map((d) => (
              <div key={d} className="mb-3">
                <p className="fw-semibold mb-2">{new Date(d).toDateString()}</p>
                <div className="d-flex flex-wrap gap-2">
                  {showtimes.filter((s) => s.date === d).map((s) => (
                    <button
                      key={s._id}
                      onClick={() => pickShowtime(s)}
                      className={`btn btn-sm ${s._id === showtimeId ? "btn-danger" : "btn-outline-secondary"} text-start`}
                    >
                      <div>{s.time}</div>
                      <div className="small opacity-75">{s.theater} · ₹{s.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h5 className="mb-1">2. Pick your seats</h5>
            <p className="text-secondary small">
              {currentShowtime && (
                <>Total seats: 60 · Available: {60 - bookedSeats.length}</>
              )}
            </p>
            {showtimes.length === 0 ? (
              <p className="text-center text-secondary py-3">No shows scheduled yet.</p>
            ) : (
              <>
                <SeatMap
                  bookedSeats={bookedSeats}
                  selected={selected}
                  onSelect={toggleSeat}
                  rowsCount={seatLayout.rows}
                  seatsPerRow={seatLayout.seatsPerRow}
                />
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span className="text-secondary">
                    {selected.length} ticket(s) · Total{" "}
                    <strong>₹{currentShowtime ? (currentShowtime.price * selected.length).toFixed(2) : 0}</strong>
                  </span>
                  <button
                    className="btn btn-danger"
                    disabled={selected.length === 0}
                    onClick={book}
                  >
                    {user ? "Book Now" : "Login to Book"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
