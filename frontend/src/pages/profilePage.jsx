import { useAuth } from "../features/auth/features.authContext";
import { useNavigate } from "react-router-dom";
import "../styles/lobby.css";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="home-container">

      {/* Top Bar */}
      <div className="top-bar">
        <div 
          className="logo"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/lobby")}
        >
          DEBUG RACE
        </div>

        
      </div>

      {/* Center Section */}
      <div className="hero-section">

        <h1 className="main-title">PROFILE</h1>

        <p className="subtitle">
          RACER TELEMETRY DATA
        </p>

        {/* Profile Card */}
        <div
          style={{
            width: "420px",
            border: "2px solid #ff6a00",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "25px",
            background: "rgba(0,0,0,0.6)"
          }}
        >

          {/* Avatar */}
      <div style={{ textAlign: "center" }}>
  <img
    src={
      user?.avatar ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || "racer"}`
    }
    alt="avatar"
    onError={(e) => {
      console.error('Avatar failed to load:', e);
      e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=racer`;
    }}
    style={{
      width: "100px",
      height: "100px",
      borderRadius: "50%",
      border: "2px solid #ffd700",
      objectFit: "cover",
      backgroundColor: "#f0f0f0"
    }}
  />
</div>

          {/* Name */}
          <div>
            <p style={{ color: "#ffd700", letterSpacing: "2px" }}>NAME</p>
            <h3 style={{ marginTop: "5px" }}>
              {user?.username || "UNKNOWN RACER"}
            </h3>
          </div>

          {/* Email */}
          <div>
            <p style={{ color: "#ffd700", letterSpacing: "2px" }}>EMAIL</p>
            <h3 style={{ marginTop: "5px" }}>
              {user?.email || "NOT AVAILABLE"}
            </h3>
          </div>

          {/* Logout Button */}
          <button className="primary-action" onClick={handleLogout}>
              LOG OUT
          </button>

        </div>

      </div>
    </div>
  );
};

export default Profile;
