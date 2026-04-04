export default function LoadingSpinner({ size = "md", text = "" }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-4 border-sky-100 border-t-sky-600 dark:border-slate-800 dark:border-t-sky-400`}
      />
      {text ? <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p> : null}
    </div>
  );
}
