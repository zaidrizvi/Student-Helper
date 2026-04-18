import { cn } from "../../utils/ui";

function SharedFieldShell({ label, hint, error, children, labelRight }) {
  return (
    <label className="block space-y-2">
      {(label || labelRight) && (
        <span className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          {labelRight ? (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {labelRight}
            </span>
          ) : null}
        </span>
      )}
      {children}
      {(hint || error) && (
        <span className={cn("block text-xs", error ? "text-rose-600" : "text-slate-500 dark:text-slate-400")}>
          {error || hint}
        </span>
      )}
    </label>
  );
}

export function InputField({
  label,
  hint,
  error,
  icon: Icon,
  className,
  inputClassName,
  labelRight,
  ...props
}) {
  return (
    <SharedFieldShell label={label} hint={hint} error={error} labelRight={labelRight}>
      <div
        className={cn(
          "group relative rounded-xl border border-slate-200 bg-white transition-all focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:border-sky-500 dark:focus-within:ring-sky-500/10 sm:rounded-2xl",
          error && "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-100 dark:border-rose-800 dark:focus-within:border-rose-500 dark:focus-within:ring-rose-500/10",
          className
        )}
      >
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-sky-600 dark:group-focus-within:text-sky-400" />
        ) : null}
        <input
          className={cn(
            "h-11 w-full rounded-xl bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 sm:h-12 sm:rounded-2xl sm:px-4",
            Icon && "pl-12 sm:pl-12",
            inputClassName
          )}
          {...props}
        />
      </div>
    </SharedFieldShell>
  );
}

export function TextareaField({
  label,
  hint,
  error,
  icon: Icon,
  className,
  inputClassName,
  labelRight,
  rows = 5,
  ...props
}) {
  return (
    <SharedFieldShell label={label} hint={hint} error={error} labelRight={labelRight}>
      <div
        className={cn(
          "group relative rounded-2xl border border-slate-200 bg-white transition-all focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:border-sky-500 dark:focus-within:ring-sky-500/10 sm:rounded-3xl",
          error && "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-100 dark:border-rose-800 dark:focus-within:border-rose-500 dark:focus-within:ring-rose-500/10",
          className
        )}
      >
        {Icon ? (
          <Icon className="pointer-events-none absolute right-4 top-4 h-5 w-5 text-slate-300 dark:text-slate-600" />
        ) : null}
        <textarea
          rows={rows}
          className={cn(
            "w-full resize-none rounded-2xl bg-transparent px-3 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 sm:rounded-3xl sm:px-4 sm:py-4",
            Icon && "pr-12",
            inputClassName
          )}
          {...props}
        />
      </div>
    </SharedFieldShell>
  );
}
