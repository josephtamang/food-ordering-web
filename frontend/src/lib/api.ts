import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  // add a reasonable timeout so requests don't hang indefinitely if the
  // backend isn't reachable. 10s is plenty for typical use and will trigger
  // the catch block so we can report an error to the user.
  timeout: 10000,
});

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    // network errors won't have a response object – provide a clearer message
    if (!error.response) {
      error.message =
        "Network error: unable to reach server. Is the backend running?";
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
export const FALLBACK_IMAGE = "https://www.realsimple.com/thmb/z3cQCYXTyDQS9ddsqqlTVE8fnpc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/real-simple-mushroom-black-bean-burgers-recipe-0c365277d4294e6db2daa3353d6ff605.jpg";

export function getImageUrl(path?: string): string {
  if (!path) return FALLBACK_IMAGE;
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
}
