import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'markdown-to-jsx';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  Target,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  AlertCircle,
  Lightbulb,
  GraduationCap,
  Clock
} from "lucide-react";

export default function QuizPage() {
  // --- LOGIC START (Unchanged) ---
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [direction, setDirection] = useState(1);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const { apiCall, loading: submittingQuiz } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/sign-in');
    } else if (isAuthenticated) {
      loadQuiz();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const loadQuiz = async () => {
    setIsLoadingQuiz(true);
    try {
      const notesId = localStorage.getItem('currentNotesId');
      if (!notesId) {
        navigate('/upload-notes');
        return;
      }
      
      const cachedQuiz = localStorage.getItem('cachedQuiz');
      const cacheTime = localStorage.getItem('quizCacheTime');
      if (cachedQuiz && cacheTime && Date.now() - parseInt(cacheTime) < 300000) {
        const cached = JSON.parse(cachedQuiz);
        setQuizData(cached);
        setUserAnswers(new Array(cached.questions.length).fill(null));
        setIsLoadingQuiz(false);
        return;
      }

      const response = await apiCall('post', 'notes/generate-quiz', {
        notesId,
        numQuestions: 5,
      });
      
      setQuizData(response);
      setUserAnswers(new Array(response.questions.length).fill(null));
      localStorage.setItem('cachedQuiz', JSON.stringify(response));
      localStorage.setItem('quizCacheTime', Date.now().toString());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answer;
    setUserAnswers(newAnswers);
  };

  const paginate = (newDirection) => {
    setDirection(newDirection);
    if (newDirection === 1 && currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else if (newDirection === -1 && currentQuestion > 0) {
      setCurrentQuestion(c => c - 1);
    }
  };

  const jumpToQuestion = (index) => {
    setDirection(index > currentQuestion ? 1 : -1);
    setCurrentQuestion(index);
  };

  const handleSubmit = async () => {
    if (userAnswers.includes(null)) return; 
    
    try {
      const formattedAnswers = userAnswers.map((answer, index) => ({
        questionIndex: index,
        selectedAnswer: answer,
      }));
      
      const response = await apiCall('post', 'notes/submit-quiz', {
        quizId: quizData.quizId,
        userAnswers: formattedAnswers,
      });
      
      setQuizResults(response);
      setShowResults(true);
    } catch (err) {
      console.error("Submission error", err);
    }
  };
  // --- LOGIC END ---

  // --- UI: LOADING STATE ---
  if (authLoading || isLoadingQuiz) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent dark:from-indigo-900/20" />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 relative z-10"
        >
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
             <BrainCircuit className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">Preparing Your Exam</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10">Curating questions...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // --- UI: RESULTS STATE ---
  if (showResults && quizResults) {
    return (
      <ResultsView 
        quizResults={quizResults} 
        navigate={navigate} 
        onRetake={() => {
          setShowResults(false);
          setCurrentQuestion(0);
          setUserAnswers(new Array(quizData.questions.length).fill(null));
          loadQuiz();
        }}
        notesId={localStorage.getItem('currentNotesId')}
      />
    );
  }

  // --- UI: ACTIVE QUIZ STATE ---
  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      scale: 0.98
    })
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </div>

      {/* COMPACT HEADER (h-14 instead of h-20) */}
      <header className="flex-none h-14 px-4 flex items-center justify-between relative z-40 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        
        {/* Number Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mask-linear-fade">
            {quizData.questions.map((_, index) => {
              const isCompleted = userAnswers[index] !== null;
              const isActive = currentQuestion === index;
              
              return (
                <button
                  key={index}
                  onClick={() => jumpToQuestion(index)}
                  className={`
                    relative w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-100' 
                      : isCompleted
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <span className="relative z-10">
                    {isCompleted && !isActive ? (
                       <CheckCircle2 className="w-4 h-4" />
                    ) : (
                       index + 1
                    )}
                  </span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
        </div>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="ml-2 w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 transition-all shadow-sm flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* COMPACT MAIN CONTENT */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-20 pt-4 flex flex-col justify-center">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentQuestion}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            className="w-full"
          >
             {/* Question Card (Smaller padding, smaller text) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-800 p-5 mb-4">
              <div className="flex items-start gap-3">
                 <div className="flex-none mt-0.5">
                   <span className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                     Q{currentQuestion + 1}
                   </span>
                 </div>
                 <h2 className="text-lg md:text-xl font-bold leading-snug text-slate-900 dark:text-white">
                   {question.question}
                 </h2>
              </div>
            </div>

            {/* Options Grid (Smaller gap, slimmer buttons) */}
            <div className="grid grid-cols-1 gap-2">
              {question.options.map((option, index) => {
                const isSelected = userAnswers[currentQuestion] === option;
                const letter = String.fromCharCode(65 + index);

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    whileHover={{ scale: 1.002 }}
                    whileTap={{ scale: 0.99 }}
                    className={`
                      group relative w-full p-3 md:p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3
                      ${isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    {/* Label */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors
                      ${isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 group-hover:border-indigo-400 group-hover:text-indigo-600'
                      }
                    `}>
                      {letter}
                    </div>

                    {/* Text (Smaller font) */}
                    <span className={`flex-1 text-sm md:text-base font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                      {option}
                    </span>

                    {/* Checkmark */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 scale-100 opacity-100' : 'border-transparent scale-0 opacity-0'
                    }`}>
                        <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* COMPACT BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-3 md:p-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-40">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-3">
          <button
            onClick={() => paginate(-1)}
            disabled={currentQuestion === 0}
            className="px-4 py-2.5 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <span className="md:hidden text-xs font-bold text-slate-400">
            {currentQuestion + 1} / {quizData.questions.length}
          </span>

          {currentQuestion === quizData.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={userAnswers.includes(null) || submittingQuiz}
              className="
                flex-1 max-w-xs px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 
                text-white rounded-lg font-bold text-sm shadow-md 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all 
                flex items-center justify-center gap-2 transform active:scale-95
              "
            >
              {submittingQuiz ? (
                <> <Loader2 className="w-4 h-4 animate-spin" /> ... </>
              ) : (
                <> Finish <Target className="w-4 h-4" /> </>
              )}
            </button>
          ) : (
            <button
              onClick={() => paginate(1)}
              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS (No major layout changes needed here, just simple props pass) ---
function ResultsView({ quizResults, navigate, onRetake, notesId }) {
  const percentage = Math.round(quizResults.percentage);
  const isPassing = percentage >= 70;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-12 pt-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wider uppercase mb-6">
            <Target className="w-3 h-3" /> Assessment Complete
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
            {isPassing ? "Excellent Work!" : "Keep Practicing"}
          </h1>

          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base">
            {isPassing
              ? "You've demonstrated a strong understanding of the material."
              : "You've grasped the basics, but reviewing the weak areas below will help you master this topic."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <StatCard
            label="Final Score"
            value={`${percentage}%`}
            sub={`${quizResults.score} out of ${quizResults.totalQuestions}`}
            icon={<Target className="w-6 h-6" />}
            color={isPassing ? "text-green-600" : "text-orange-600"}
          />

          <StatCard
            label="Accuracy"
            value={percentage > 80 ? "High" : "Average"}
            sub="Based on difficulty"
            icon={<BarChart3 className="w-6 h-6" />}
            color="text-blue-600"
          />

          <StatCard
            label="Status"
            value={isPassing ? "Passed" : "Review Needed"}
            sub="Completion status"
            icon={<CheckCircle2 className="w-6 h-6" />}
            color={isPassing ? "text-indigo-600" : "text-gray-500"}
          />
        </div>

        {quizResults.weakTopics && quizResults.weakTopics.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Areas for Improvement
              </h3>
            </div>

            <ExplainWeakTopicsReview
              notesId={notesId}
              weakTopics={quizResults.weakTopics}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>

          <button
            onClick={onRetake}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
          >
            Retake Quiz <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <div className={`mb-2 ${color}`}>{icon}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{label}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</div>
    </motion.div>
  );
}

function ExplainWeakTopicsReview({ notesId, weakTopics }) {
  const [explanations, setExplanations] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const { apiCall } = useApi();

  useEffect(() => {
    async function fetchExplanations() {
      if (!notesId || !weakTopics || weakTopics.length === 0) return;
      setLoading(true);

      try {
        const data = await apiCall('post', 'notes/explain-weak-topics', {
          notesId,
          weakTopics
        });

        setExplanations(data.explanations || {});
      } catch (error) {
        console.error("Failed to fetch explanations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchExplanations();
  }, [notesId, weakTopics]);

  if (!weakTopics || weakTopics.length === 0) return null;

  return (
    <div className="grid gap-2">
      {weakTopics.map((topic, index) => (
        <div
          key={topic}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <button
            onClick={() => setExpanded(expanded === index ? null : index)}
            className="w-full flex items-center justify-between p-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                <Lightbulb className="w-4 h-4" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{topic}</span>
            </div>

            <ChevronRight
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expanded === index ? 'rotate-90' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {expanded === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <div className="p-5 pt-2 prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                  {loading ? (
                    <div className="flex items-center gap-2 text-indigo-600 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                    </div>
                  ) : (
                    <Markdown>
                      {explanations[topic]  ||
                        'Our AI is generating a detailed breakdown for this topic...'}
                    </Markdown>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}