import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

const typeStyles = {
  success: {
    shell:
      "border-emerald-200 bg-white text-emerald-800 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  error: {
    shell:
      "border-rose-200 bg-white text-rose-800 dark:border-rose-900 dark:bg-slate-950 dark:text-rose-200",
    icon: AlertCircle,
  },
  info: {
    shell:
      "border-sky-200 bg-white text-sky-800 dark:border-sky-900 dark:bg-slate-950 dark:text-sky-200",
    icon: Info,
  },
  warning: {
    shell:
      "border-amber-200 bg-white text-amber-800 dark:border-amber-900 dark:bg-slate-950 dark:text-amber-200",
    icon: TriangleAlert,
  },
};

export default function Toast({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = typeStyles[type] || typeStyles.info;
  const Icon = config.icon;

  return (
    <div
      className={`fixed right-4 top-4 z-50 rounded-2xl border px-4 py-3 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.5)] backdrop-blur-xl ${config.shell}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="rounded-xl p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
