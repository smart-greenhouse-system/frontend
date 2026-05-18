import axios from "axios";

export const STORAGE_KEYS = {
  token: "token",
  type: "type",
};

// Legacy keys for backward compatibility
const LEGACY_TOKEN_KEYS = ["access_token", "refresh_token", "auth_token", "operator_token"];

export function getStoredAccessToken() {
  return (
    localStorage.getItem(STORAGE_KEYS.token) ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("operator_token") ||
    ""
  );
}

export function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.type);
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.removeItem(key);
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && !error.config?.skipAuthRedirect) {
      clearAuthStorage();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
