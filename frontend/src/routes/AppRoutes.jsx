import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/RegisterPage";
import Lobby from "../pages/LobbyPage";
import Profile from "../pages/profilePage";
import RoomPage from "../pages/Roompage";
import { useAuth } from "../features/auth/features.authContext";
import ProtectedRoute from "./ProtectedRoute";
import Loader from "../pages/LoaderPage";
import RacePage from "../components/Race/RacePage";

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Loader />} />

      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/lobby" />}
      />

      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/lobby" />}
      />

      <Route
        path="/lobby"
        element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        }
      />

      <Route
        path="/room/:code"
        element={
          <ProtectedRoute>
            <RoomPage />
          </ProtectedRoute>
        }
      />

      {/* ADD THIS */}
      <Route
        path="/race/:raceId"
        element={
          <ProtectedRoute>
            <RacePage />
          </ProtectedRoute>
       }
    />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
