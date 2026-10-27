import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-5">
      <h1 className="display-1">404</h1>
      <p className="text-secondary">This page is not showing in any theater.</p>
      <Link to="/" className="btn btn-danger">Back to Movies</Link>
    </div>
  );
}
