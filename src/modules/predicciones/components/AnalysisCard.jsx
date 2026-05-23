import { Sprout, Crosshair, Calendar, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const ESTADO_PLANTA_MAP = {
  healthy: "Saludable",
  saludable: "Saludable",
  diseased: "Enferma",
  enfermedad: "Enferma",
  stressed: "Estresada",
  estresada: "Estresada",
  deficient: "Deficiente",
  deficiente: "Deficiente",
  pest: "Plaga",
  plaga: "Plaga",
};

const ESTADO_STYLING = {
  Saludable: { bg: "bg-green-100", text: "text-green-800", ring: "ring-green-300", icon: CheckCircle2 },
  Enferma: { bg: "bg-red-100", text: "text-red-800", ring: "ring-red-300", icon: XCircle },
  Estresada: { bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-300", icon: AlertTriangle },
  Deficiente: { bg: "bg-orange-100", text: "text-orange-800", ring: "ring-orange-300", icon: AlertTriangle },
  Plaga: { bg: "bg-purple-100", text: "text-purple-800", ring: "ring-purple-300", icon: AlertTriangle },
  Desconocido: { bg: "bg-gray-100", text: "text-gray-700", ring: "ring-gray-300", icon: AlertTriangle },
};

function formatConfianza(val) {
  if (val == null || typeof val !== "number") return "—";
  return `${Math.round(val * 100)}%`;
}

function mapEstado(estado) {
  if (!estado) return { label: "Desconocido", style: { bg: "bg-gray-100", text: "text-gray-700", ring: "ring-gray-300", icon: AlertTriangle } };
  const key = estado.toLowerCase();
  const label = ESTADO_PLANTA_MAP[key] ?? estado;
  const style = ESTADO_STYLING[label] ?? ESTADO_STYLING.Desconocido;
  return { label, style };
}

export default function AnalysisCard({ analysis, featured = false }) {
  if (!analysis) return null;

  const { id, tipo, device_id, cultivo, success, estado_planta, confianza, tiempo_cosecha_dias, created_at } = analysis;
  const { label: estadoLabel, style: estadoStyle } = mapEstado(estado_planta);
  const EstadoIcon = estadoStyle.icon;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
        featured ? "border-farm-green-dark/30 sm:col-span-2 lg:col-span-3" : "border-gray-200"
      }`}
    >
      <div className={`p-5 ${featured ? "sm:p-6" : ""}`}>
        {featured && (
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-farm-green-dark/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-farm-green-dark">
              <Crosshair className="h-3 w-3" strokeWidth={2.5} />
              Último análisis
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {cultivo && (
              <p className={`font-bold text-gray-800 truncate ${featured ? "text-lg" : "text-sm"}`}>
                {cultivo}
              </p>
            )}
            {device_id && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">{device_id}</p>
            )}
          </div>

          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 shrink-0 ${estadoStyle.bg} ${estadoStyle.text} ${estadoStyle.ring}`}>
            <EstadoIcon className="h-3 w-3" strokeWidth={2.5} />
            {estadoLabel}
          </span>
        </div>

        <div className={`mt-4 grid grid-cols-2 gap-4 ${featured ? "sm:grid-cols-4" : ""}`}>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Confianza</p>
            <p className="mt-0.5 text-sm font-bold text-gray-800">{formatConfianza(confianza)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Cosecha</p>
            <p className="mt-0.5 text-sm font-bold text-gray-800">
              {tiempo_cosecha_dias != null ? `${tiempo_cosecha_dias} días` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Tipo</p>
            <p className="mt-0.5 text-sm font-bold text-gray-800">{tipo || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Success</p>
            <p className="mt-0.5 text-sm font-bold text-gray-800">{success ? "Sí" : "No"}</p>
          </div>
        </div>

        {created_at && (
          <p className={`flex items-center gap-1 mt-4 text-[11px] text-gray-400 ${featured ? "" : "border-t border-gray-100 pt-3"}`}>
            <Calendar className="h-3 w-3" strokeWidth={1.5} />
            {new Date(created_at).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "medium" })}
          </p>
        )}
      </div>
    </div>
  );
}
