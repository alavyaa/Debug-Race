import { createContext, useContext, useEffect, useState } from "react";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "./features.authAPI";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {

      // CHECK TOKEN BEFORE CALLING PROFILE
      const token = localStorage.getItem("debugrace_token");
      console.log("TOKEN FOUND:", token);

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await getCurrentUser();

      console.log("PROFILE RESPONSE:", res.data);

      // if backend sends { user: {...} }
      setUser(res.data.user || res.data);

    } catch (err) {
      console.log("PROFILE ERROR:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const register = async (data) => {
    const res = await registerUser(data);

    // SAVE TOKEN
    if (res?.data?.token) {
      localStorage.setItem("debugrace_token", res.data.token);
    }

    await fetchUser();
  };

  const login = async (data) => {
    const res = await loginUser(data);

    // SAVE TOKEN
    if (res?.data?.token) {
      localStorage.setItem("debugrace_token", res.data.token);
      console.log("TOKEN SAVED:", res.data.token);
    }

    await fetchUser();
  };

  const logout = async () => {
    await logoutUser();

    // REMOVE TOKEN
    localStorage.removeItem("debugrace_token");

    setUser(null);
  };

  const profile = async () => {
    await getCurrentUser();
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, profile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
