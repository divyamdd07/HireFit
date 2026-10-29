import axios from "axios";

// Local mein localhost, deploy pe Vercel ke environment variable se
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
    const code = error.response?.data?.code;
    if (code === "RECRUITER_NOT_VERIFIED" && window.location.pathname !== "/recruiter/verification") {
      window.location.assign("/recruiter/verification");
    }
    return Promise.reject(error);
  }
);


export default api;