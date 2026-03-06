import api from "../../services/api.service";
import Cookies from 'js-cookie';

export const registerUser = (data) =>
  api.post("/auth/register", data);

export const loginUser = (data) =>
  api.post("/auth/login", data);

export const getCurrentUser = () =>
  api.get("/auth/profile");

export const logoutUser = () =>
  api.get("/auth/logout");