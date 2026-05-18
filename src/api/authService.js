import api, { STORAGE_KEYS } from "./api.js";

/** Guarda token y type según contrato del backend */
export function persistAuthSession({ token, type }) {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
  }
  if (type) {
    localStorage.setItem(STORAGE_KEYS.type, type);
  }
}

/**
 * RF-02: POST /api/auth/login
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
      token: "fake-jwt-token-santiago-lider",
      type: "Bearer",
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
    "/api/auth/login",
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
  localStorage.removeItem('token');
  localStorage.removeItem('type');
  localStorage.removeItem('access_token'); // legacy
  localStorage.removeItem('refresh_token'); // legacy
  localStorage.removeItem('auth_token'); // legacy
  localStorage.removeItem('operator_token'); // legacy

  // 2. Redirigimos al login
  window.location.assign('/login');
}