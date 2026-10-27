import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function MyBookings() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    if (user) api.get("/bookings/my").then(({ data }) => setBookings(data));
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const cancel = async (id) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setBookings((b) => b.map((bk) => (bk._id === id ? { ...bk, status: "cancelled" } : bk)));
    } catch (e) {
      alert(e.response?.data?.message || "Cancel failed");
    }
  };

  return (
    <div>
      <h2 className="mb-4">🎟️ My Bookings</h2>
      {bookings === null ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center text-secondary py-5">
          <p>No bookings yet.</p>
          <Link to="/" className="btn btn-danger">Browse Movies</Link>
        </div>
      ) : (
        <div className="row g-4">
          {bookings.map((b) => {
            const st = b.showtime?.movie ? b.showtime : null;
            return (
              <div key={b._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm" style={{ border: 0 }}>
                  <div className="row g-0">
                    <div className="col-4">
                      <img
                        src={st?.movie?.poster}
                        alt=""
                        className="img-fluid rounded-start h-100"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="col-8">
                      <div className="card-body">
                        <h6 className="mb-1">{st?.movie?.title}</h6>
                        <p className="text-secondary small mb-1">
                          {new Date(st?.date).toDateString()} · {st?.time}
                        </p>
                        <p className="small mb-1">🏛 {st?.theater}</p>
                        <p className="small mb-1">
                          Seats: {b.seats.join(", ")} · <strong>₹{b.totalAmount}</strong>
                        </p>
                        <p className="small mb-2">Ref: {b.bookingRef}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className={`fw-semibold small status-${b.status}`}>● {b.status}</span>
                          {b.status === "confirmed" && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => cancel(b._id)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
