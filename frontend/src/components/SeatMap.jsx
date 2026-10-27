const LETTERS = "ABCDEFGH";

/**
 * Interactive seat picker.
 * rows/seatsPerRow come from the API's seatLayout object.
 */
export default function SeatMap({ bookedSeats, selected, onSelect, rowsCount = 6, seatsPerRow = 10 }) {
  const seats = [];
  for (let r = 0; r < rowsCount; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      const id = `${LETTERS[r]}${s}`;
      seats.push({ id, taken: bookedSeats.includes(id) });
    }
  }

  return (
    <div className="d-flex flex-column align-items-center gap-4">
      <div>
        <div className="screen-bar" />
        <p className="text-center text-secondary small mb-3">Screen this side</p>
      </div>
      <div
        className="d-grid gap-2"
        style={{ gridTemplateColumns: `repeat(${seatsPerRow}, auto)`, overflowX: "auto" }}
      >
        {seats.map((s) => (
          <button
            key={s.id}
            className={`seat ${s.taken ? "taken" : ""} ${selected.includes(s.id) ? "selected" : ""}`}
            disabled={s.taken}
            title={s.taken ? `${s.id} — already booked` : s.id}
            onClick={() => !s.taken && onSelect(s.id)}
          >
            {s.id}
          </button>
        ))}
      </div>
      <div className="d-flex gap-4 seat-legend small text-secondary">
        <span><span style={{ background: "#fff", border: "1px solid #adb5bd" }} /> Available</span>
        <span><span style={{ background: "#e50914" }} /> Selected</span>
        <span><span style={{ background: "#6c757d" }} /> Booked</span>
      </div>
    </div>
  );
}
