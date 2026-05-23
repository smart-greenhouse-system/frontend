import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export const STORAGE_KEYS = {
  token: "token",
};

export function getStoredAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.token) ?? "";
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Instancia principal para endpoints bajo /api/*
const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : "/api",
  headers: { "Content-Type": "application/json" },
});

// Instancia para endpoints de autenticación (también bajo /api/)
const authApi = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : "/api",
  headers: { "Content-Type": "application/json" },
});

function attachTokenInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

function attachUnauthorizedInterceptor(instance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearAuthStorage();
        window.location.assign("/login");
      }
      return Promise.reject(normalizeError(error));
    }
  );
}

function normalizeError(error) {
  if (error.response?.data) {
    const body = error.response.data;
    return {
      timestamp: body.timestamp ?? new Date().toISOString(),
      status: body.status ?? error.response.status,
      error: body.error ?? "Error",
      message: body.message ?? error.message,
      path: body.path ?? error.config?.url ?? "",
    };
  }
  return {
    timestamp: new Date().toISOString(),
    status: 0,
    error: "Network Error",
    message: error.message ?? "No se pudo conectar con el servidor",
    path: error.config?.url ?? "",
  };
}

attachTokenInterceptor(api);
attachUnauthorizedInterceptor(api);

attachTokenInterceptor(authApi);
attachUnauthorizedInterceptor(authApi);

export { authApi, normalizeError };
export default api;
