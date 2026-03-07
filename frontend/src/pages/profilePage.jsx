// import { useAuth } from "../features/auth/features.authContext";
// import { useNavigate } from "react-router-dom";
// import { F1Avatar } from "../components/AvatarComponent"; // Import the avatar component
// import "../styles/lobby.css";

// const Profile = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     await logout();
//     navigate("/login");
//   };

//   return (
//     <div className="home-container">
//       {/* Top Bar */}
//       <div className="top-bar">
//         <div 
//           className="logo"
//           style={{ cursor: "pointer" }}
//           onClick={() => navigate("/lobby")}
//         >
//           DEBUG RACE
//         </div>
//       </div>

//       {/* Center Section */}
//       <div className="hero-section">
//         <h1 className="main-title">PROFILE</h1>

//         <p className="subtitle">
//           RACER TELEMETRY DATA
//         </p>

//         {/* Profile Card */}
//         <div
//           style={{
//             width: "420px",
//             border: "2px solid #ff6a00",
//             padding: "40px",
//             display: "flex",
//             flexDirection: "column",
//             gap: "25px",
//             background: "rgba(0,0,0,0.6)",
//           }}
//         >
//          {/* Avatar Section */}
// <div style={{ textAlign: "center" }}>
//   <F1Avatar
//     userId={user?.id || "UNKNOWN"}
//     username={user?.username || "RACER"}
//     lobbyPosition={playerIndex}   // IMPORTANT
//     size="large"
//   />
// </div>

// {/* Name */}
// <div>
//   <p style={{ color: "#ffd700", letterSpacing: "2px" }}>NAME</p>
//   <h3 style={{ marginTop: "5px" }}>
//     {user?.username || "UNKNOWN RACER"}
//   </h3>
// </div>
//           {/* Email */}
//           <div>
//             <p style={{ color: "#ffd700", letterSpacing: "2px" }}>EMAIL</p>
//             <h3 style={{ marginTop: "5px" }}>
//               {user?.email || "NOT AVAILABLE"}
//             </h3>
//           </div>

//           {/* Logout Button */}
//           <button className="primary-action" onClick={handleLogout}>
//             LOG OUT
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;
