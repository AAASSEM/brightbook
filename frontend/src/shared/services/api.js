import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Debug logging for admin login
  if (config.url.includes("admin/login")) {
    console.log("🔐 Admin Login Request:", {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
      hasToken: !!token
    });
  }

  return config;
});

// On 401 — attempt token refresh, then retry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    // Debug logging for admin login errors
    if (original.url.includes("admin/login")) {
      console.log("❌ Admin Login Error:", {
        url: original.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        isAuthRequest: original.url.includes("/api/auth/login") ||
                      original.url.includes("/api/auth/register") ||
                      original.url.includes("/api/auth/admin/login") ||
                      original.url.includes("auth/login") ||
                      original.url.includes("auth/admin/login")
      });
    }

    const isAuthRequest = original.url.includes("/api/auth/login") ||
                         original.url.includes("/api/auth/register") ||
                         original.url.includes("/api/auth/admin/login") ||
                         original.url.includes("auth/login") ||
                         original.url.includes("auth/admin/login");

    if (error.response?.status === 401 && !original._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      if (!refreshToken) {
        logout();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
          { refresh_token: refreshToken }
        );
        const { access_token, refresh_token } = res.data;
        setTokens(access_token, refresh_token);
        processQueue(null, access_token);
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        logout();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
