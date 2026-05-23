import { authApi, clearAuthStorage } from "./api.js";

export function persistAuthSession(session) {
  if (!session) return;
  const { accessToken } = session;
  if (accessToken) {
    localStorage.setItem("token", accessToken);
  }
}

export async function login(credentials) {
  const res = await authApi.post("/auth/login", credentials);
  console.log('📥 [Auth] Respuesta del Servidor:', res.data);
  const tokenValue = res.data.token ?? res.data.accessToken;
  console.log('🔑 [Auth] Token extraído para persistAuthSession:', tokenValue);
  persistAuthSession({ accessToken: tokenValue });
  return res.data;
}

export async function register(payload) {
  const { data } = await authApi.post("/auth/register", payload);
  return data;
}

export function logout() {
  clearAuthStorage();
  window.location.assign("/login");
}