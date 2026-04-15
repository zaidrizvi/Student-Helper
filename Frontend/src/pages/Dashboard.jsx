import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Trophy,
  Activity,
  Plus,
  FileText,
  Calendar,
  ArrowUpRight,
  Zap,
  Library,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";

const stripMarkdown = (text) => {
  if (!text) return "";
  return text.replace(/#{1,6}\s?/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "").trim();
};

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { loading, apiCall } = useApi();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/sign-in");
    } else if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const [notesRes, attemptsRes] = await Promise.all([
        apiCall("get", "notes/history"),
        apiCall("get", "notes/quiz-attempts"),
      ]);
      setNotes(notesRes.notes || []);
      setQuizAttempts(attemptsRes.attempts || []);
    } catch {
      setNotes([]);
      setQuizAttempts([]);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17]" />;
  if (!isAuthenticated) return null;

  const firstName = user?.name?.split(" ")?.[0] || "Student";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const avgScore = quizAttempts.length
    ? Math.round(
        quizAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.totalQuestions) * 100, 0) /
          quizAttempts.length
      )
    : 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const notesThisWeek = notes.filter((note) => new Date(note.createdAt) > oneWeekAgo).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 pb-6 pt-20 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100 md:px-6 md:pt-22">
      <div className="mx-auto max-w-7xl space-y-3">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              {today}
            </span>
            <h1 className="mt-3 text-[2.35rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.7rem] md:text-[3rem]">
              Welcome back, <span className="text-sky-500">{firstName}</span>
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Your workspace keeps recent material, quiz performance, and next actions in one place so you can move from upload to revision without hunting around.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/upload-notes")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-700 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Upload new note
            </button>
            <button
              onClick={() => navigate("/notes")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
            >
              <Library className="h-4 w-4" />
              Open library
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label="Total notes"
            value={notes.length}
            meta={notes.length ? `${notesThisWeek} added this week` : "Start uploading"}
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Average quiz score"
            value={`${avgScore}%`}
            meta={quizAttempts.length ? "Based on submitted quizzes" : "No quizzes yet"}
          />
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="Quizzes completed"
            value={quizAttempts.length}
            meta={quizAttempts.length ? "Keep the streak moving" : "Take your first quiz"}
          />
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Focus today"
            value={notes.length ? "Revise" : "Upload"}
            meta={notes.length ? "Pick a recent note and test recall" : "Create your first study guide"}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#0D1320]">
            <div className="mb-2.5 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  Recent Materials
                </span>
                <h2 className="mt-2.5 text-[1.2rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[1.4rem]">
                  Continue a note you already studied
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Reopen your latest uploads, revisit generated summaries, or head to the full library for older material.
                </p>
              </div>
              <button
                onClick={() => navigate("/notes")}
                className="hidden items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300 sm:flex"
              >
                View library
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex h-36 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600 dark:border-slate-800 dark:border-t-sky-400" />
              </div>
            ) : notes.length ? (
              <div className="space-y-2">
                {notes.slice(0, 4).map((note) => (
                  <motion.button
                    key={note._id}
                    whileHover={{ y: -2 }}
                    onClick={() => navigate(`/notes/${note._id}`)}
                    className="group flex w-full items-start gap-3 rounded-[16px] border border-slate-200 bg-slate-50 p-2.5 text-left transition-colors hover:border-sky-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700 dark:hover:bg-slate-950"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{note.fileName}</h3>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-950 dark:text-slate-500">
                          {note.fileType?.includes("pdf") ? "PDF" : "DOC"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(note.createdAt).toLocaleDateString()}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {note.summary ? `${stripMarkdown(note.summary).slice(0, 150)}...` : "No summary generated yet."}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-sky-500" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">No notes found. Upload your first one.</p>
              </div>
            )}
          </section>

          <div className="space-y-4">
            <section className="rounded-[18px] bg-sky-600 p-3 text-white shadow-lg shadow-sky-500/20">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white">
                Quick Actions
              </span>
              <h2 className="mt-2.5 text-[1.2rem] font-bold tracking-tight sm:text-[1.4rem]">Stay in revision mode.</h2>
              <p className="mt-1.5 text-sm leading-6 text-sky-50">
                Upload fresh material or revisit your library when you want to turn class notes into something you can actually study from.
              </p>

              <div className="mt-3.5 space-y-2">
                <QuickAction
                  title="Upload and analyze"
                  desc="Start a new study guide from a lecture file or screenshot."
                  onClick={() => navigate("/upload-notes")}
                />
                <QuickAction
                  title="Browse note history"
                  desc="Jump back into previous notes, downloads, and share links."
                  onClick={() => navigate("/notes")}
                />
              </div>
            </section>

            <section className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#0D1320]">
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Recent Performance
              </span>
              <h2 className="mt-2.5 text-[1.2rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[1.4rem]">Quiz feedback at a glance</h2>

              <div className="mt-3.5 space-y-2">
                {quizAttempts.length ? (
                  quizAttempts.slice(0, 3).map((attempt, index) => {
                    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                    return (
                      <motion.div
                        key={`${attempt.completedAt || attempt.createdAt}-${index}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[16px] border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Quiz attempt</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                              {new Date(attempt.completedAt || attempt.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{percentage}%</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {attempt.score}/{attempt.totalQuestions} correct
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className="h-2 rounded-full bg-sky-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="rounded-[22px] border-2 border-dashed border-slate-200 py-10 text-center dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No quizzes taken yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, meta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#0D1320]"
    >
      <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
        {icon}
      </div>
      <div className="text-[1.5rem] font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
      <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
      <p className="mt-0.5 text-sm leading-5 text-slate-500 dark:text-slate-400">{meta}</p>
    </motion.div>
  );
}

function QuickAction({ title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-[16px] border border-white/20 bg-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/15"
    >
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-5 text-sky-50">{desc}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-white" />
    </button>
  );
}
