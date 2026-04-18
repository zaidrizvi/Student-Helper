import { motion } from "framer-motion";
import { cn } from "../../utils/ui";

const variants = {
  primary:
    "bg-sky-600 text-white shadow-[0_18px_40px_-18px_rgba(2,132,199,0.6)] hover:bg-sky-500 focus-visible:ring-sky-500",
  secondary:
    "bg-white/90 text-slate-900 ring-1 ring-slate-200 hover:bg-white focus-visible:ring-sky-500 dark:bg-slate-950/80 dark:text-slate-100 dark:ring-slate-800 dark:hover:bg-slate-900",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:bg-slate-900/80",
  subtle:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-sky-500 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500",
};

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "min-h-11 px-4 text-sm sm:px-5",
  lg: "min-h-11 px-5 text-sm sm:min-h-12 sm:px-6 md:text-base",
  icon: "h-11 w-11",
};

export default function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  whileHover,
  whileTap = { scale: 0.98 },
  ...props
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : whileHover || { y: -1 }}
      whileTap={disabled ? undefined : whileTap}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
