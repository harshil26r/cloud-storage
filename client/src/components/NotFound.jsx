import { useNavigate } from "react-router";
import "../styles/notfound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-message">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="notfound-buttons">
          <button
            className="notfound-btn primary"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
          <button
            className="notfound-btn secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
