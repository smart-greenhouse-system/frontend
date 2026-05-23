import api from "../api/api.js";

export async function getLatestImageAnalysis() {
  const res = await api.get("/predictions/latest-image-analysis");
  return res.data;
}

export async function getImageAnalysisHistory() {
  const res = await api.get("/predictions/image-analysis");
  return res.data;
}
