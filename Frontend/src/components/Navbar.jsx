import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  Sun,
  MoonStar,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Library,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../utils/ui";

const publicLinks = [
  { label: "Product", to: "/" },
  { label: "Sign In", to: "/sign-in" },
];

const privateLinks = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Library", to: "/notes", icon: Library },
  { label: "Upload", to: "/upload-notes", icon: PlusCircle },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", isDark);
    window.localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const firstName = useMemo(() => user?.name?.trim()?.split(" ")?.[0] || "Student", [user?.name]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/75 bg-white/78 px-3 py-2.5 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/80 sm:px-6 sm:py-3 lg:px-8">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-0 sm:h-16">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-[0_16px_34px_-18px_rgba(2,132,199,0.7)] sm:h-11 sm:w-11">
              <BrainCircuit className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="font-display block truncate text-base font-bold tracking-tight text-slate-950 dark:text-white sm:text-lg">
                StudyAI
              </span>
              <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                Study smarter, not louder
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {isAuthenticated
              ? privateLinks.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all",
                        isActive
                          ? "bg-sky-50 text-sky-700 shadow-sm dark:bg-sky-950/40 dark:text-sky-300"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))
              : publicLinks.map(({ label, to }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
                        isActive
                          ? "text-slate-950 dark:text-white"
                          : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                      )
                    }
                  >
                    {label}
                  </NavLink>
                ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => setIsDark((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <MoonStar className="h-5 w-5 text-sky-600" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/85">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-sm font-bold text-white">
                  {firstName.charAt(0)}
                </div>
                <div className="max-w-[9rem]">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{firstName}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/sign-up"
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(2,132,199,0.6)] transition-all hover:bg-sky-500"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <button
              onClick={() => setIsDark((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-500 dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-300"
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <MoonStar className="h-5 w-5 text-sky-600" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-700 dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-100"
              aria-label="Open navigation"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed inset-x-3 top-20 z-50 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-[28px] border border-white/80 bg-white/94 p-4 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/96 md:hidden sm:inset-x-4 sm:top-24 sm:p-5"
            >
              {isAuthenticated ? (
                <div className="mb-5 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                {(isAuthenticated ? privateLinks : publicLinks).map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                      )
                    }
                  >
                    <span className="flex items-center gap-3">
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      {label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </NavLink>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    <span className="flex items-center gap-3">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    to="/sign-up"
                    className="flex items-center justify-between rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Create free account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
