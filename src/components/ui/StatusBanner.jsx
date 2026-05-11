import { CheckCircle, TriangleAlert, XCircle } from "lucide-react";

/**
 * @param {object} props
 * @param {number} props.alerts — alertas activas (número entero ≥ 0)
 * @param {number} props.lowStock — insumos con stock bajo (número entero ≥ 0)
 */
function StatusBanner({ alerts = 0, lowStock = 0 }) {
  const a = Math.max(0, Number(alerts) || 0);
  const l = Math.max(0, Number(lowStock) || 0);

  let variant = "ok";
  if (a > 3) {
    variant = "critical";
  } else if (a >= 1 || l >= 1) {
    variant = "alert";
  }

  const styles = {
    ok: {
      wrap: "border-farm-green/25 bg-farm-green-light",
      icon: CheckCircle,
      iconClass: "text-farm-green-dark shrink-0",
      title: "Todo en orden",
      subtitle: "Sin alertas ni insumos críticos.",
    },
    alert: {
      wrap: "border-amber-200 bg-amber-50",
      icon: TriangleAlert,
      iconClass: "text-amber-700 shrink-0",
      title: "Revisar",
      subtitle: a >= 1 && l >= 1 ? `${a} alerta(s) · ${l} insumo(s) bajo(s)` : a >= 1 ? `${a} alerta(s) activa(s)` : `${l} insumo(s) con stock bajo`,
    },
    critical: {
      wrap: "border-red-200 bg-red-50",
      icon: XCircle,
      iconClass: "text-red-600 shrink-0",
      title: "Crítico",
      subtitle: `${a} alertas activas — intervención urgente`,
    },
  };

  const cfg = styles[variant];
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-sm sm:px-4 sm:py-3 ${cfg.wrap}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${cfg.iconClass}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-gray-900 sm:text-base">{cfg.title}</p>
        <p className="mt-0.5 truncate text-xs text-gray-700 sm:text-sm">{cfg.subtitle}</p>
      </div>
    </div>
  );
}

export default StatusBanner;
