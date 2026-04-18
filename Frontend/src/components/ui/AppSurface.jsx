import { motion } from "framer-motion";
import { cn } from "../../utils/ui";

export function PageShell({ children, className, contentClassName = "" }) {
  return (
    <div className={cn("relative min-h-screen overflow-x-clip bg-[var(--app-bg)] text-slate-900 dark:bg-[var(--app-bg-dark)] dark:text-slate-50", className)}>
      <div className="pointer-events-none absolute inset-0 opacity-60 sm:opacity-80">
        <div className="absolute inset-x-0 top-0 hidden h-[34rem] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_50%)] sm:block" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35),rgba(255,255,255,0.96)_54%,rgba(255,255,255,1))] dark:bg-[linear-gradient(to_bottom,rgba(2,6,23,0.28),rgba(2,6,23,0.9)_54%,rgba(2,6,23,1))]" />
      </div>
      <div className={cn("relative z-10 mx-auto w-full max-w-7xl px-3 pb-24 pt-20 sm:px-6 sm:pb-12 sm:pt-24 lg:px-8", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, className, as: Component = motion.div, ...props }) {
  return (
    <Component
      className={cn(
        "rounded-[18px] border border-white/80 bg-white/92 shadow-[0_18px_44px_-32px_rgba(15,23,42,0.3)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/88 dark:shadow-[0_24px_56px_-38px_rgba(15,23,42,0.75)] sm:rounded-[28px]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  align = "left",
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className
      )}
    >
      <div className="max-w-3xl space-y-2.5 sm:space-y-3">
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300 sm:px-3 sm:text-xs sm:tracking-[0.22em]">
            {eyebrow}
          </span>
        ) : null}
        <div className="space-y-2">
          <h1 className="font-display break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-7">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function StatPill({ icon: Icon, label, value, className }) {
  return (
    <div
      className={cn(
        "inline-flex w-full items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/86 px-3 py-2.5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/76 sm:w-auto sm:gap-3 sm:px-4 sm:py-3",
        className
      )}
    >
      {Icon ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 sm:h-10 sm:w-10 sm:rounded-2xl">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      ) : null}
      <span className="space-y-0.5">
        <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:text-xs sm:tracking-[0.18em]">
          {label}
        </span>
        <span className="block font-semibold text-slate-900 dark:text-white">{value}</span>
      </span>
    </div>
  );
}

export function SectionLabel({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-900 dark:text-slate-300",
        className
      )}
    >
      {children}
    </span>
  );
}
