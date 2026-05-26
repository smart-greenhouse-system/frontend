import { Thermometer, Droplets, Wind, Sun, Activity } from "lucide-react";

function smartLabel(rawKey) {
  if (!rawKey) return "Sensor";
  return rawKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const FALLBACK_CONFIG = {
  label: "Sensor",
  unit: "",
  Icon: Activity,
  gradient: "from-slate-400 to-slate-500",
  bgGlow: "bg-slate-400/10",
  iconBg: "bg-gradient-to-br from-slate-400 to-slate-500",
  format: (v) => String(v),
  min: 0,
  max: 100,
};

const SENSOR_CONFIG = {
  temperatura: {
    label: "Temperatura",
    unit: "°C",
    Icon: Thermometer,
    gradient: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/10",
    iconBg: "bg-gradient-to-br from-orange-400 to-red-500",
    format: (v) => v.toFixed(1),
    min: 5,
    max: 45,
  },
  humedad_suelo: {
    label: "Humedad del Suelo",
    unit: "%",
    Icon: Droplets,
    gradient: "from-cyan-500 to-blue-600",
    bgGlow: "bg-cyan-500/10",
    iconBg: "bg-gradient-to-br from-cyan-400 to-blue-600",
    format: (v) => String(v),
    min: 0,
    max: 100,
  },
  humedad_relativa: {
    label: "Humedad Relativa",
    unit: "%",
    Icon: Wind,
    gradient: "from-teal-500 to-emerald-600",
    bgGlow: "bg-teal-500/10",
    iconBg: "bg-gradient-to-br from-teal-400 to-emerald-600",
    format: (v) => String(v),
    min: 0,
    max: 100,
  },
  iluminacion: {
    label: "Iluminación",
    unit: "lux",
    Icon: Sun,
    gradient: "from-amber-400 to-yellow-500",
    bgGlow: "bg-amber-500/10",
    iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500",
    format: (v) => v.toLocaleString("es-ES"),
    min: 0,
    max: 5000,
  },
  altura_agua: {
    label: "Altura Agua",
    unit: "cm",
    Icon: Droplets,
    gradient: "from-blue-600 to-blue-800",
    bgGlow: "bg-blue-600/10",
    iconBg: "bg-gradient-to-br from-blue-600 to-blue-800",
    format: (v) => String(v),
    min: 0,
    max: 100,
  },
};

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export default function SensorCard({ sensorKey, value }) {
  const baseCfg = SENSOR_CONFIG[sensorKey];
  const cfg = baseCfg ?? {
    ...FALLBACK_CONFIG,
    label: smartLabel(sensorKey),
  };

  const { label, unit, Icon, gradient, bgGlow, iconBg, format, min, max } = cfg;
  const display = format(value);
  const pct = ((clamp(value, min, max) - min) / (max - min)) * 100;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:p-6">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${bgGlow} blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-gray-800 sm:text-4xl">
            {display}
            {unit && (
              <span className="ml-1 text-base font-medium text-gray-400 sm:text-lg">
                {unit}
              </span>
            )}
          </p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} text-white shadow-md`}>
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-gray-400">
          <span>Nivel</span>
          <span className="font-semibold text-gray-600">
            {Math.round(pct)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-[width] duration-700 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export { SENSOR_CONFIG };
