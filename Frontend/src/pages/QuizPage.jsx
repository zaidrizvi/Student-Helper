import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Markdown from "markdown-to-jsx";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Loader2,
  RefreshCcw,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotes } from "../contexts/NotesContext";
import { useApi } from "../hooks/useApi";
import Button from "../components/ui/Button";
import { EmptyState, InlineMessage, LoadingState } from "../components/ui/StateBlock";
import { PageShell, Panel, SectionLabel } from "../components/ui/AppSurface";

export default function QuizPage() {
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [direction, setDirection] = useState(1);
  const [pageError, setPageError] = useState("");

  const { isAuthenticated, loading: authLoading } = useAuth();
  const { activeNote, activeQuiz, setActiveQuiz, clearActiveQuiz } = useNotes();
  const { apiCall, loading: submittingQuiz } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/sign-in");
    else if (isAuthenticated) loadQuiz();
  }, [isAuthenticated, authLoading, navigate, activeNote]);

  const loadQuiz = async () => {
    setIsLoadingQuiz(true);
    setPageError("");
    try {
      const notesId = activeNote?.id;
      if (!notesId) {
        navigate("/upload-notes");
        return;
      }

      if (activeQuiz && activeQuiz.noteId === notesId && Date.now() - activeQuiz.cachedAt < 300000) {
        setQuizData(activeQuiz.payload);
        setUserAnswers(new Array(activeQuiz.payload.questions.length).fill(null));
        setIsLoadingQuiz(false);
        return;
      }

      const response = await apiCall("post", "notes/generate-quiz", { notesId, numQuestions: 5 });
      setQuizData(response);
      setUserAnswers(new Array(response.questions.length).fill(null));
      setActiveQuiz({ noteId: notesId, cachedAt: Date.now(), payload: response });
    } catch (err) {
      setPageError(err.message || "Failed to load quiz.");
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    const nextAnswers = [...userAnswers];
    nextAnswers[currentQuestion] = answer;
    setUserAnswers(nextAnswers);
  };

  const paginate = (nextDirection) => {
    setDirection(nextDirection);
    if (nextDirection === 1 && currentQuestion < quizData.questions.length - 1) setCurrentQuestion((value) => value + 1);
    if (nextDirection === -1 && currentQuestion > 0) setCurrentQuestion((value) => value - 1);
  };

  const handleSubmit = async () => {
    if (userAnswers.includes(null)) return;
    try {
      const formattedAnswers = userAnswers.map((selectedAnswer, index) => ({ questionIndex: index, selectedAnswer }));
      const response = await apiCall("post", "notes/submit-quiz", { quizId: quizData.quizId, userAnswers: formattedAnswers });
      setQuizResults(response);
      setShowResults(true);
    } catch (err) {
      setPageError(err.message || "Failed to submit quiz.");
    }
  };

  if (authLoading || isLoadingQuiz) {
    return <LoadingState title="Preparing your quiz" description="Generating questions from the active note." />;
  }

  if (!isAuthenticated) return null;

  if (!quizData?.questions?.length) {
    return (
      <PageShell contentClassName="pt-28">
        <EmptyState title="Quiz unavailable" description={pageError || "We could not prepare a quiz for this note."} action={<Button onClick={() => navigate("/upload-notes")}>Back to upload</Button>} />
      </PageShell>
    );
  }

  if (showResults && quizResults) {
    return <ResultsView quizResults={quizResults} onRetake={() => { setShowResults(false); setCurrentQuestion(0); setUserAnswers(new Array(quizData.questions.length).fill(null)); clearActiveQuiz(); loadQuiz(); }} onExit={() => navigate("/dashboard")} notesId={activeNote?.id} />;
  }

  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const question = quizData.questions[currentQuestion];
  const answeredCount = userAnswers.filter((value) => value !== null).length;

  return (
    <div className="min-h-screen bg-[#0b1628] px-3 pb-6 pt-20 text-slate-100 md:px-5 md:pt-24 lg:px-6">
      <div className="mx-auto max-w-[1440px]">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[24px] border border-slate-700/70 bg-[#142238] p-3.5 shadow-[0_30px_80px_-44px_rgba(2,12,27,0.95)] sm:rounded-[28px] md:p-5">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-sky-200">Question {currentQuestion + 1} of {quizData.questions.length}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#213654]">
                  <motion.div className="h-full rounded-full bg-[#20b7ff]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block sm:shrink-0 sm:text-right sm:text-sm">
                <p>{answeredCount}/{quizData.questions.length} answered</p>
                <button onClick={() => navigate("/dashboard")} className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-[#132238] text-slate-300 transition-colors hover:bg-[#1a2c47] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-700/70 bg-[#1b2d47] p-3.5 sm:rounded-[24px] md:p-5">
              <SectionLabel className="bg-[#22395a] text-sky-200">Question {currentQuestion + 1}</SectionLabel>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: direction > 0 ? 18 : -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -18 : 18 }}
                >
                  <h2 className="mt-4 text-[1.2rem] font-bold leading-tight text-white sm:text-[1.45rem] md:text-[1.9rem]">
                    {question.question}
                  </h2>

                  <div className="mt-5 grid gap-2.5">
                    {question.options.map((option, index) => {
                      const selected = userAnswers[currentQuestion] === option;
                      return (
                        <motion.button
                          key={option}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleAnswerSelect(option)}
                          className={`flex items-start gap-3 rounded-[16px] border px-3 py-3 text-left transition-all sm:rounded-[18px] sm:px-4 ${
                            selected
                              ? "border-sky-500 bg-[#18314e] shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
                              : "border-slate-700 bg-[#132238] hover:border-slate-500 hover:bg-[#162844]"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              selected ? "bg-[#20b7ff] text-[#0b1628]" : "bg-[#22395a] text-sky-200"
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="flex-1 pt-0.5 text-sm leading-6 text-sky-50 sm:text-[15px]">{option}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => paginate(-1)}
                disabled={currentQuestion === 0}
                className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-700 bg-[#132238] px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-[#1a2c47] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              {currentQuestion === quizData.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={userAnswers.includes(null) || submittingQuiz}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#20b7ff] px-6 py-3 text-sm font-bold text-[#0b1628] transition-colors hover:bg-[#4ec7ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => paginate(1)}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#20b7ff] px-6 py-3 text-sm font-bold text-[#0b1628] transition-colors hover:bg-[#4ec7ff]"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <AnimatePresence>{pageError ? <div className="mt-4"><InlineMessage message={pageError} tone="error" /></div> : null}</AnimatePresence>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-slate-700/70 bg-[#142238] p-4 shadow-[0_30px_80px_-44px_rgba(2,12,27,0.95)] sm:rounded-[28px]">
              <SectionLabel className="bg-[#22395a] text-sky-200">Quiz Status</SectionLabel>
              <div className="mt-4 rounded-[22px] border border-slate-700 bg-[#1b2d47] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Progress</p>
                  <p className="text-sm font-semibold text-sky-200">{Math.round(progress)}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#213654]">
                  <motion.div className="h-full rounded-full bg-[#20b7ff]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] bg-[#132238] p-3">
                    <p className="text-sm text-slate-400">Answered</p>
                    <p className="mt-1 text-xl font-bold text-white">{answeredCount}</p>
                  </div>
                  <div className="rounded-[16px] bg-[#132238] p-3">
                    <p className="text-sm text-slate-400">Remaining</p>
                    <p className="mt-1 text-xl font-bold text-white">{quizData.questions.length - answeredCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-700/70 bg-[#142238] p-4 shadow-[0_30px_80px_-44px_rgba(2,12,27,0.95)] sm:rounded-[28px]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <SectionLabel className="bg-[#22395a] text-sky-200">Questions</SectionLabel>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{answeredCount}/{quizData.questions.length} answered</p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {quizData.questions.map((_, index) => {
                  const active = currentQuestion === index;
                  const answered = userAnswers[index] !== null;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setDirection(index > currentQuestion ? 1 : -1);
                        setCurrentQuestion(index);
                      }}
                      className={`rounded-[12px] px-0 py-2.5 text-sm font-bold transition-all sm:rounded-[14px] sm:py-3 ${
                        active
                          ? "bg-[#20b7ff] text-[#0b1628]"
                          : answered
                            ? "bg-[#22395a] text-sky-200"
                            : "bg-[#132238] text-slate-400 hover:bg-[#1a2c47] hover:text-white"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmit}
                disabled={userAnswers.includes(null) || submittingQuiz}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-[18px] bg-emerald-500 px-5 py-3.5 text-sm font-bold text-[#07211a] transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingQuiz ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Submit Exam
              </button>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function ResultsView({ quizResults, onRetake, onExit, notesId }) {
  const percentage = Math.round(quizResults.percentage);
  const passing = percentage >= 70;

  return (
    <div className="min-h-screen bg-[#0b1628] px-3 pb-8 pt-20 text-slate-100 md:px-5 md:pt-24 lg:px-6">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-3">
        <Panel className="shrink-0 p-3 text-center sm:p-4">
        
          <h1 className="mt-2 font-display text-[1.7rem] font-bold text-slate-950 dark:text-white sm:text-[2rem] md:text-[2.3rem]">
            {passing ? "Great work" : "Keep building this topic"}
          </h1>
          <p className="mx-auto mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {passing
              ? "You showed solid understanding of the current material."
              : "Use the weak-topic explanations below to tighten understanding before the next attempt."}
          </p>
        </Panel>

        <div className="grid shrink-0 gap-2.5 md:grid-cols-3">
          <ResultStat icon={Target} label="Score" value={`${percentage}%`} sub={`${quizResults.score} / ${quizResults.totalQuestions} correct`} />
          <ResultStat icon={BarChart3} label="Accuracy" value={percentage >= 80 ? "High" : percentage >= 60 ? "Building" : "Low"} sub="Relative to submitted answers" />
          <ResultStat icon={Trophy} label="Status" value={passing ? "Passed" : "Review needed"} sub="Based on a 70% target" />
        </div>

        {quizResults.weakTopics?.length ? (
          <Panel className="p-3 sm:p-4">
            <div className="mb-3 shrink-0">
              <SectionLabel>Weak topics</SectionLabel>
              <h2 className="mt-2 font-display text-[1.45rem] font-bold text-slate-950 dark:text-white sm:text-[1.9rem]">
                Targeted review suggestions
              </h2>
            </div>
            <ExplainWeakTopicsReview notesId={notesId} weakTopics={quizResults.weakTopics} />
          </Panel>
        ) : null}

        <div className="flex shrink-0 flex-col gap-2.5 pb-1 sm:flex-row sm:justify-center">
          <Button variant="secondary" onClick={onExit} size="md">Back to dashboard</Button>
          <Button onClick={onRetake} size="md"><RefreshCcw className="h-4 w-4" />Retake quiz</Button>
        </div>
      </div>
    </div>
  );
}

function ResultStat({ icon: Icon, label, value, sub }) {
  return (
    <Panel className="p-3.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2.5 font-display text-[1.8rem] font-bold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{sub}</p>
    </Panel>
  );
}

function ExplainWeakTopicsReview({ notesId, weakTopics }) {
  const [explanations, setExplanations] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const { apiCall } = useApi();

  useEffect(() => {
    async function fetchExplanations() {
      if (!notesId || !weakTopics?.length) return;
      setLoading(true);
      try {
        const data = await apiCall("post", "notes/explain-weak-topics", { notesId, weakTopics });
        setExplanations(data.explanations || {});
      } finally {
        setLoading(false);
      }
    }
    fetchExplanations();
  }, [notesId, weakTopics]);

  return (
    <div className="grid gap-2.5">
      {weakTopics.map((topic, index) => <div key={topic} className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"><button onClick={() => setExpanded(expanded === index ? null : index)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Lightbulb className="h-4 w-4" /></span><span className="font-semibold text-slate-900 dark:text-white">{topic}</span></div><ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${expanded === index ? "rotate-90" : ""}`} /></button><AnimatePresence>{expanded === index ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-200 dark:border-slate-800"><div className="p-3.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{loading ? <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300"><Loader2 className="h-4 w-4 animate-spin" />Preparing explanation...</div> : <Markdown>{explanations[topic] || "A more detailed explanation is still being prepared for this topic."}</Markdown>}</div></motion.div> : null}</AnimatePresence></div>)}
      {loading && !weakTopics.length ? <InlineMessage message="Loading weak-topic explanations..." tone="loading" /> : null}
      {!loading && !weakTopics.length ? <EmptyState icon={AlertCircle} compact title="No weak topics detected" description="This attempt did not flag any specific weak areas." /> : null}
    </div>
  );
}
