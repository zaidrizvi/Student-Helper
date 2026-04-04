import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/ui";

const previewCards = [
  "Upload lecture slides, PDFs, screenshots, or typed notes.",
  "Get structured explanations, quizzes, and weak-topic support.",
  "Return later to a clean history with shareable study guides.",
];

export default function AuthShell({
  title,
  description,
  footer,
  children,
  badge = "Student Workspace",
  className,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] px-4 py-24 dark:bg-[var(--app-bg-dark)] sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-sky-200/45 blur-[120px] dark:bg-sky-500/12" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-cyan-100/50 blur-[110px] dark:bg-cyan-400/10" />
      </div>
      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <div className="space-y-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-[0_18px_45px_-18px_rgba(2,132,199,0.65)]">
                <BrainCircuit className="h-6 w-6" />
              </span>
              <span>
                <span className="font-display block text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  ScholarAI
                </span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  Focused study workflows for serious students
                </span>
              </span>
            </Link>

            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                <Sparkles className="h-4 w-4" />
                {badge}
              </span>
              <h1 className="font-display max-w-xl text-5xl font-bold tracking-tight text-slate-950 dark:text-white">
                Study materials become a guided learning system.
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Less clutter, clearer next steps, and fast AI support when you need explanations, quizzes, or revision guidance.
              </p>
            </div>

            <div className="grid gap-4">
              {previewCards.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * (index + 1) }}
                  className="flex items-start gap-4 rounded-[26px] border border-white/80 bg-white/80 px-5 py-5 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-slate-950/78"
                >
                  <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-[32px] border border-white/80 bg-white/92 p-6 shadow-[0_38px_90px_-54px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:p-8",
            className
          )}
        >
          <div className="mb-8 space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-900 dark:text-slate-300 lg:hidden">
              <BrainCircuit className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              ScholarAI
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {title}
            </h2>
            <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">{description}</p>
          </div>

          {children}

          {footer ? <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">{footer}</div> : null}
        </motion.div>
      </div>
    </div>
  );
}
