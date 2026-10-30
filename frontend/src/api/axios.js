import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const isAuthCall = error.config?.url?.startsWith("/auth/");

    // Token expire/invalid: saaf session hatao aur login pe bhejo (login/google ke apne 401 chhod ke)
    if (status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }

    if (code === "RECRUITER_NOT_VERIFIED" && window.location.pathname !== "/recruiter/verification") {
      window.location.assign("/recruiter/verification");
    }
    return Promise.reject(error);
  }
);

export default api;