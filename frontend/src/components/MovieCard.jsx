import { useNavigate } from "react-router-dom";

export default function MovieCard({ movie }) {
  const navigate = useNavigate();
  return (
    <div className="card movie-card h-100" onClick={() => navigate(`/movies/${movie._id}`)}>
      <img
        src={movie.poster}
        alt={movie.title}
        className="card-img-top"
        onError={(e) => (e.target.src = "https://via.placeholder.com/300x450?text=No+Poster")}
      />
      <div className="card-body">
        <h6 className="card-title mb-1">{movie.title}</h6>
        <p className="text-secondary small mb-2">
          {movie.genre.join(" · ")} · {movie.duration} min
        </p>
        <div className="d-flex gap-1 flex-wrap">
          {movie.genre.map((g) => (
            <span key={g} className="badge bg-danger bg-opacity-75">{g}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
