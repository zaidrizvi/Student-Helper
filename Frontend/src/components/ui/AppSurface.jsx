import { motion } from "framer-motion";
import { cn } from "../../utils/ui";

export function PageShell({ children, className, contentClassName = "" }) {
  return (
    <div className={cn("relative min-h-screen overflow-x-clip bg-[var(--app-bg)] text-slate-900 dark:bg-[var(--app-bg-dark)] dark:text-slate-50", className)}>
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_50%)]" />
        <div className="absolute left-[-8rem] top-32 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-[-6rem] top-56 h-80 w-80 rounded-full bg-cyan-100/45 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0.92)_65%,rgba(255,255,255,1))] dark:bg-[linear-gradient(to_bottom,rgba(2,6,23,0),rgba(2,6,23,0.84)_62%,rgba(2,6,23,1))]" />
      </div>
      <div className={cn("relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, className, as: Component = motion.div, ...props }) {
  return (
    <Component
      className={cn(
        "rounded-[28px] border border-white/80 bg-white/88 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/82 dark:shadow-[0_36px_80px_-44px_rgba(15,23,42,0.75)]",
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
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className
      )}
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
            {eyebrow}
          </span>
        ) : null}
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
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
        "inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/70",
        className
      )}
    >
      {Icon ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <span className="space-y-0.5">
        <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
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
