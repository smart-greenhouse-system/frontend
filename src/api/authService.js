import { authApi, STORAGE_KEYS, clearAuthStorage } from "./api.js";

export function persistAuthSession({ accessToken, tokenType }) {
  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.token, accessToken);
  }
  if (tokenType) {
    localStorage.setItem(STORAGE_KEYS.type, tokenType);
  }
}

export async function login(credentials) {
  const { data } = await authApi.post("/auth/login", credentials);
  return data;
}

export async function register(payload) {
  const { data } = await authApi.post("/auth/register", payload);
  return data;
}

export function logout() {
  clearAuthStorage();
  window.location.assign("/login");
}