import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import SeatMap from "../components/SeatMap";
import { useAuth } from "../context/AuthContext";

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [bookingDate, setBookingDate] = useState("");

  const [showtimeId, setShowtimeId] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selected, setSelected] = useState([]);

  // Load movie + shows (with optional date filter)
  useEffect(() => {
    api.get(`/movies/${id}`, bookingDate ? { params: { date: bookingDate } } : {})
      .then(({ data }) => {
        setMovie(data.movie);
        setShowtimes(data.showtimes);
        setBookingDate((d) => d || data.showtimes[0]?.date || "");
        const s = data.showtimes[0];
        if (s) { setShowtimeId(s._id); setBookedSeats(s.bookedSeats); }
        else { setShowtimeId(null); setBookedSeats([]); setSelected([]); }
      })
      .catch(() => toast.error("Failed to load movie"));
  }, [id, bookingDate]);

  const pickShowtime = (s) => {
    setShowtimeId(s._id);
    setBookedSeats(s.bookedSeats);
    setSelected([]);
  };

  const toggleSeat = (seatId) =>
    setSelected((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );

  const book = async () => {
    if (!user) {
      toast.info("Please login to continue with your booking");
      navigate("/login", { state: { from: `/movies/${id}` } });
      return;
    }
    try {
      const { data } = await api.post("/bookings", { showtimeId, seats: selected });
      toast.success("Seats reserved! Redirecting to payment…");
      // Refresh availability
      setBookedSeats((b) => [...b, ...selected]);
      setShowtimes((st) =>
        st.map((s) =>
          s._id === showtimeId ? { ...s, bookedSeats: [...s.bookedSeats, ...selected] } : s
        )
      );
      setSelected([]);
      navigate(`/bookings/${data._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Booking failed");
      if (e.response?.data?.bookedSeats) setBookedSeats(e.response.data.bookedSeats);
    }
  };

  if (!movie) return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;

  const dates = [...new Set(showtimes.map((s) => s.date))];
  const currentShowtime = showtimes.find((s) => s._id === showtimeId);

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
        <div className="card mb-2">
          <div className="card-body">
            <h5 className="mb-3">1. Choose a date &amp; showtime</h5>
            <select
              className="form-select mb-3"
              style={{ maxWidth: 220 }}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            >
              {dates.map((d) => (
                <option key={d} value={d}>{new Date(d).toDateString()}</option>
              ))}
            </select>

            {showtimes.length === 0 ? (
              <p className="text-secondary">No shows on this date.</p>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {showtimes.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => pickShowtime(s)}
                    className={`btn btn-sm ${s._id === showtimeId ? "btn-danger" : "btn-outline-secondary"} text-start`}
                  >
                    <div>{s.time}</div>
                    <div className="small opacity-75">
                      {s.theatre?.name} · {s.theatre?.city}
                    </div>
                    <div className="small fw-semibold">₹{s.price}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h5 className="mb-1">2. Pick your seats</h5>
            {currentShowtime && (
              <p className="text-secondary small">
                Total seats: 60 · Available: {60 - bookedSeats.length} <span className="fw-semibold">· live availability</span>
              </p>
            )}
            {showtimes.length === 0 ? (
              <p className="text-center text-secondary py-3">No shows scheduled for this date.</p>
            ) : (
              <>
                <SeatMap
                  bookedSeats={bookedSeats}
                  selected={selected}
                  onSelect={toggleSeat}
                  rowsCount={6}
                  seatsPerRow={10}
                />
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span className="text-secondary">
                    {selected.length} ticket(s) · Total{" "}
                    <strong>₹{currentShowtime ? (currentShowtime.price * selected.length).toFixed(2) : 0}</strong>
                  </span>
                  <button className="btn btn-danger" disabled={selected.length === 0} onClick={book}>
                    {user ? "Proceed to Payment" : "Login to Book"}
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
