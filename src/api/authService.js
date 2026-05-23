import { authApi, clearAuthStorage } from "./api.js";

export function persistAuthSession({ accessToken }) {
  if (accessToken) {
    localStorage.setItem("token", accessToken);
  }
}

export async function login(credentials) {
  const { data } = await authApi.post("/auth/login", credentials);
  persistAuthSession({ accessToken: data.token ?? data.accessToken });
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