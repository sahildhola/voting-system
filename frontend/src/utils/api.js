import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("vc_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
