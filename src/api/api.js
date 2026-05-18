export const STORAGE_KEYS = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
};

const LEGACY_TOKEN_KEYS = ["token", "auth_token", "operator_token"];

export function getStoredAccessToken() {
  return (
    localStorage.getItem(STORAGE_KEYS.accessToken) ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("operator_token") ||
    ""
  );
}

export function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.removeItem(key);
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(method, path, body, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
  };

  const token = getStoredAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const error = new Error(data?.message || response.statusText || "Request failed");
    error.response = {
      status: response.status,
      data,
    };

    if (response.status === 401 && !options.skipAuthRedirect) {
      clearAuthStorage();
      window.location.assign("/login");
    }

    throw error;
  }

  return {
    data,
    status: response.status,
    headers: response.headers,
  };
}

const api = {
  get(path, options) {
    return request("GET", path, undefined, options);
  },
  post(path, body, options) {
    return request("POST", path, body, options);
  },
  patch(path, body, options) {
    return request("PATCH", path, body, options);
  },
  put(path, body, options) {
    return request("PUT", path, body, options);
  },
  delete(path, options) {
    return request("DELETE", path, undefined, options);
  },
};

export default api;
