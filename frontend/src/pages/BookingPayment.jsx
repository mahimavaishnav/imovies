import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import { useAuth } from "../context/AuthContext";

/** Payment & booking confirmation page (mock card gateway — SkillWallet workflow 4) */
export default function BookingPayment() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const [booking, setBooking] = useState(null);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (user) {
      api.get(`/bookings/${id}`)
        .then(({ data }) => setBooking(data))
        .catch((e) => toast.error(e.response?.data?.message || "Booking not found"));
    }
  }, [user, id]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!booking) return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;

  const st = booking.showtime || {};
  const pay = async (e) => {
    e.preventDefault();
    if (card.number.replace(/\s/g, "").length < 12)
      return toast.error("Enter a valid card number (any digits work in demo mode)");
    setPaying(true);
    // simulate gateway latency
    setTimeout(async () => {
      try {
        const { data } = await api.post(`/bookings/${id}/pay`, { cardHolder: card.name });
        setBooking(data.booking);
        toast.success(`Payment successful! Txn: ${data.transactionId}`);
      } catch (err) {
        toast.error(err.response?.data?.message || "Payment failed");
      } finally {
        setPaying(false);
      }
    }, 1500);
  };

  const paid = booking.paymentStatus === "paid";

  return (
    <div className="row justify-content-center g-4">
      <div className="col-lg-5">
        <div className="card shadow-sm" style={{ border: 0 }}>
          <div className="card-body p-4">
            <h4 className="mb-3">{paid ? "🎟 Booking Confirmed" : "💳 Complete your payment"}</h4>
            <div className="d-flex gap-3 align-items-center mb-3">
              <img src={st.movie?.poster} alt="" style={{ width: 70, borderRadius: 8 }} />
              <div>
                <h6 className="mb-0">{st.movie?.title}</h6>
                <small className="text-secondary">
                  {new Date(st.date)?.toDateString()} · {st.time}
                </small>
                <div className="small text-secondary">{st.theatre?.name}, {st.theatre?.city}</div>
              </div>
            </div>
            <table className="table table-sm">
              <tbody>
                <tr><td>Booking ref</td><td className="text-end fw-semibold">{booking.bookingRef}</td></tr>
                <tr><td>Seats</td><td className="text-end">{booking.seats.join(", ")}</td></tr>
                <tr><td>Amount</td><td className="text-end fw-bold">₹{booking.totalAmount}</td></tr>
                <tr>
                  <td>Status</td>
                  <td className="text-end">
                    <span className={`badge ${paid ? "bg-success" : "bg-warning text-dark"}`}>
                      {paid ? `PAID · ${booking.payment?.transactionId}` : "PENDING PAYMENT"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {paid ? (
              <>
                <div className="alert alert-success mb-3">
                  ✅ Payment of <strong>₹{booking.totalAmount}</strong> received via {booking.payment?.method}.
                </div>
                <div className="d-flex gap-2">
                  <Link to="/my-bookings" className="btn btn-danger">My Bookings</Link>
                  <Link to="/" className="btn btn-outline-secondary">Book another movie</Link>
                </div>
              </>
            ) : booking.status === "cancelled" ? (
              <div className="alert alert-danger">This booking was cancelled.</div>
            ) : (
              <form onSubmit={pay}>
                <div className="mb-2">
                  <label className="form-label small">Name on card</label>
                  <input className="form-control" required value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Card number</label>
                  <input className="form-control" placeholder="4242 4242 4242 4242" required
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d]/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") })} />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label small">Expiry (MM/YY)</label>
                    <input className="form-control" placeholder="12/29" required value={card.expiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                        setCard({ ...card, expiry: v });
                      }} />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label small">CVV</label>
                    <input className="form-control" type="password" maxLength={4} required value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })} />
                  </div>
                </div>
                <button className="btn btn-danger w-100" disabled={paying}>
                  {paying ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Processing payment…</>
                  ) : (
                    <>Pay ₹{booking.totalAmount}</>
                  )}
                </button>
                <p className="text-center text-secondary small mt-2 mb-0">
                  🔒 Demo gateway — no real charge. <code>4242</code> cards always succeed.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
