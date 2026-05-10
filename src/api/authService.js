import api, { STORAGE_KEYS } from "./api.js";

/** Guarda access/refresh y alias `token` para módulos legacy (cropApi, etc.). */
export function persistAuthSession({ access_token, refresh_token }) {
  if (access_token) {
    localStorage.setItem(STORAGE_KEYS.accessToken, access_token);
    localStorage.setItem("token", access_token);
  }
  if (refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, refresh_token);
  }
}

/**
 * RF-02: POST /api/v1/auth/login
 * @param {{ email: string; password: string }} credentials
 */
export async function login(credentials) {
  // --- INICIO MODO MOCK (Simulación) ---
  console.log("Intentando login simulado con:", credentials);

  // Definimos credenciales de prueba
  const MOCK_EMAIL = "admin@admin.com";
  const MOCK_PASSWORD = "Admin123*";

  // Simulamos un retraso de red de 1 segundo para que se vea el estado de "Cargando"
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (credentials.email === MOCK_EMAIL && credentials.password === MOCK_PASSWORD) {
    // Si coinciden, devolvemos un objeto de éxito idéntico al del Backend
    return {
      access_token: "fake-jwt-token-santiago-lider",
      refresh_token: "fake-refresh-token-123",
      expires_in: 3600
    };
  } else {
    // Si no coinciden, simulamos un error 401 de credenciales inválidas
    const error = new Error("Credenciales inválidas");
    error.response = {
      status: 401,
      data: { message: "Correo o contraseña incorrectos (Modo Mock)" }
    };
    throw error;
  }

  /* 
  // COMENTADO PARA NO USAR EL BACKEND TODAVÍA:
  const { data } = await api.post(
    "/api/v1/auth/login",
    credentials,
    { skipAuthRedirect: true }
  );
  return data;
  */
  // --- FIN MODO MOCK ---
}

/**
 * RF-01: POST /api/auth/register
 * @param {{ email: string; password: string }} payload
 */
export async function register(payload) {
  // --- MOCK PARA REGISTRO ---
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: "Usuario registrado (Modo Mock)" };

  /*
  const { data } = await api.post("/api/auth/register", payload, {
    skipAuthRedirect: true,
  });
  return data;
  */
}

export function logout() {
  // 1. Limpiamos todo el localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token'); // por si acaso

  // 2. Redirigimos al login
  window.location.assign('/login');
}