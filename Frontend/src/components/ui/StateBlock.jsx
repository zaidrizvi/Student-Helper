import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "../../utils/ui";
import { Panel } from "./AppSurface";

const toneMap = {
  info: {
    icon: Info,
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  },
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  error: {
    icon: AlertCircle,
    className:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  },
  loading: {
    icon: Loader2,
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
  },
};

export function InlineMessage({ message, tone = "info", className }) {
  if (!message) return null;

  const { icon: Icon, className: toneClassName } = toneMap[tone] || toneMap.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium",
        toneClassName,
        className
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "loading" && "animate-spin")} />
      <span>{message}</span>
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  return (
    <Panel
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border-dashed px-6 py-10 text-center",
        compact ? "rounded-3xl" : "px-8 py-14",
        className
      )}
    >
      {Icon ? (
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          <Icon className="h-8 w-8" />
        </div>
      ) : null}
      <div className="space-y-2">
        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Panel>
  );
}

export function LoadingState({ title = "Loading", description = "Please wait while we prepare your workspace.", className }) {
  return (
    <div className={cn("flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-[0_18px_45px_-20px_rgba(2,132,199,0.7)]"
      >
        <Loader2 className="h-7 w-7" />
      </motion.div>
      <div className="space-y-1.5">
        <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}
