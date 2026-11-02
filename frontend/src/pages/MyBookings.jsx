import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const PAYMENT_BADGE = {
  paid: "bg-success",
  pending: "bg-warning text-dark",
  refunded: "bg-info text-dark",
};

export default function MyBookings() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    if (user) api.get("/bookings/my").then(({ data }) => setBookings(data)).catch(() => toast.error("Failed to load bookings"));
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const cancel = async (id) => {
    if (!confirm("Cancel this booking? Paid amounts are auto-refunded (demo gateway).")) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.info("Booking cancelled — seats released");
      setBookings((b) => b.map((bk) => (bk._id === id ? { ...bk, status: "cancelled", paymentStatus: bk.paymentStatus === "paid" ? "refunded" : bk.paymentStatus } : bk)));
    } catch (e) {
      toast.error(e.response?.data?.message || "Cancel failed");
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const filtered = (bookings || []).filter((b) =>
    tab === "upcoming"
      ? b.showtime?.date >= today && b.status === "confirmed"
      : b.status === "cancelled" || b.showtime?.date < today
  );

  return (
    <div>
      <h2 className="mb-4">🎟️ My Bookings</h2>

      <ul className="nav nav-pills mb-4">
        {[["upcoming", "Upcoming & Active"], ["past", "Past & Cancelled"]].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button className={`nav-link ${tab === key ? "active bg-danger" : "text-dark"}`} onClick={() => setTab(key)}>
              {label}
            </button>
          </li>
        ))}
      </ul>

      {bookings === null ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-secondary py-5">
          <p>No {tab} bookings.</p>
          <Link to="/" className="btn btn-danger">Browse Movies</Link>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map((b) => {
            const st = b.showtime?.movie ? b.showtime : null;
            return (
              <div key={b._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm" style={{ border: 0 }}>
                  <div className="row g-0">
                    <div className="col-4">
                      <img src={st?.movie?.poster} alt="" className="img-fluid rounded-start h-100" style={{ objectFit: "cover" }} />
                    </div>
                    <div className="col-8">
                      <div className="card-body">
                        <h6 className="mb-1">{st?.movie?.title}</h6>
                        <p className="text-secondary small mb-1">
                          {new Date(st?.date).toDateString()} · {st?.time}
                        </p>
                        <p className="small mb-1">🏛 {st?.theatre?.name}, {st?.theatre?.city}</p>
                        <p className="small mb-1">Seats: {b.seats.join(", ")} · <strong>₹{b.totalAmount}</strong></p>
                        <p className="small mb-2">Ref: {b.bookingRef}</p>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
                          <span className={`fw-semibold small status-${b.status}`}>● {b.status}</span>
                          <span className={`badge ${PAYMENT_BADGE[b.paymentStatus] || "bg-secondary"}`}>
                            {b.paymentStatus}
                          </span>
                          {b.status === "confirmed" && (
                            <>
                              <Link to={`/bookings/${b._id}`} className="btn btn-outline-primary btn-sm">
                                {b.paymentStatus === "paid" ? "Ticket" : "Pay now"}
                              </Link>
                              <button className="btn btn-outline-danger btn-sm" onClick={() => cancel(b._id)}>
                                Cancel
                              </button>
                            </>
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
