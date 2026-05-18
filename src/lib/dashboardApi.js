import api from "../api/api.js";

/**
 * GET /api/dashboard
 * Obtiene datos consolidados del dashboard
 * Response: { kpis: {...}, alerts: [...], recent_activities: [...] }
 */
export async function getDashboardData() {
  const res = await api.get("/api/dashboard");
  return res.data;
}
