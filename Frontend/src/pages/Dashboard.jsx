import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Trophy, 
  Activity, 
  Plus, 
  FileText, 
  Calendar,
  ArrowUpRight,
  Zap
} from 'lucide-react';

// --- HELPER: Clean Markdown for Preview ---
const stripMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/#{1,6}\s?/g, "") 
    .replace(/\*\*/g, "")      
    .replace(/\*/g, "")        
    .replace(/`/g, "")         
    .replace(/\[.*?\]/g, "")   
    .trim();
};

const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const { loading, apiCall } = useApi();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/sign-in');
    } else if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const [notesRes, attemptsRes] = await Promise.all([
        apiCall('get', 'notes/history'),
        apiCall('get', 'notes/quiz-attempts')
      ]);
      setNotes(notesRes.notes || []);
      setQuizAttempts(attemptsRes.attempts || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setNotes([]);
      setQuizAttempts([]);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-gray-50 dark:bg-black" />;
  if (!isAuthenticated) return null;

  // --- DYNAMIC CALCULATIONS (THE FIX) ---

  // 1. Calculate Average Score
  const avgScore = quizAttempts.length > 0
    ? Math.round((quizAttempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / quizAttempts.length))
    : 0;

  // 2. Calculate Notes added this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const notesThisWeek = notes.filter(n => new Date(n.createdAt) > oneWeekAgo).length;

  // 3. Determine Score Trend Text & Color
  let scoreTrendText = "No quizzes yet";
  let scoreTrendColor = "text-gray-500";

  if (quizAttempts.length > 0) {
    if (avgScore >= 80) {
      scoreTrendText = "Excellent work!";
      scoreTrendColor = "text-green-600";
    } else if (avgScore >= 50) {
      scoreTrendText = "Good progress";
      scoreTrendColor = "text-blue-600";
    } else {
      scoreTrendText = "Keep pushing";
      scoreTrendColor = "text-orange-600";
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans pt-24 px-4 md:px-8 pb-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{today}</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Hello, <span className="text-indigo-600 dark:text-indigo-400">{user?.name?.split(' ')[0] || 'Student'}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/upload-notes')}
              className="group flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
          </div>
        </header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {/* LEFT COLUMN - Stats & Main Content (Span 8) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard 
                label="Total Notes" 
                value={notes.length} 
                icon={<BookOpen className="w-5 h-5" />}
                // FIX: Dynamic note count
                trend={notes.length === 0 ? "Start uploading" : `+${notesThisWeek} this week`}
              />
              <KpiCard 
                label="Avg. Score" 
                value={`${avgScore}%`} 
                icon={<Activity className="w-5 h-5" />} 
                // FIX: Dynamic score text and color
                trend={scoreTrendText}
                trendColor={scoreTrendColor}
              />
              <KpiCard 
                label="Quizzes" 
                value={quizAttempts.length} 
                icon={<Trophy className="w-5 h-5" />}
                trend="Lifetime total"
              />
            </div>

            {/* Recent Notes Area */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  Recent Materials
                </h2>
                <button 
                  onClick={() => navigate('/notes')}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  View All <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="animate-pulse w-8 h-8 bg-gray-200 rounded-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                       <p className="text-gray-500">No notes found. Upload your first one!</p>
                    </div>
                  ) : (
                    notes.slice(0, 4).map((note) => (
                      <NoteRow key={note._id} note={note} navigate={navigate} />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Actions & Activity (Span 4) */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-indigo-600 dark:bg-indigo-900 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Quick Actions
              </h3>
              <p className="text-indigo-100 text-sm mb-6 opacity-80">Jump straight into productivity.</p>
              
              <div className="space-y-2">
                <QuickAction 
                  onClick={() => navigate('/upload-notes')} 
                  label="Upload & Analyze" 
                />
                <QuickAction 
                  onClick={() => navigate('/notes')} 
                  label="Review Library" 
                />
              </div>
            </div>

            {/* Recent Activity / Quiz Scores */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="font-semibold mb-4 text-sm uppercase text-gray-500 tracking-wider">Recent Performance</h3>
              <div className="space-y-4">
                {quizAttempts.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No quizzes taken yet.</p>
                ) : (
                  quizAttempts.slice(0, 3).map((attempt, i) => (
                    <ScoreRow key={i} attempt={attempt} />
                  ))
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const KpiCard = ({ label, value, icon, trend, trendColor = "text-gray-500" }) => (
  <motion.div 
    variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
    className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start mb-2">
      <span className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
        {icon}
      </span>
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
    <div className="flex justify-between items-end">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className={`text-xs ${trendColor} font-medium`}>{trend}</p>
    </div>
  </motion.div>
);

const NoteRow = ({ note, navigate }) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    onClick={() => navigate(`/notes/${note._id}`)}
    className="group flex items-center p-4 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer transition-colors hover:border-indigo-200 dark:hover:border-indigo-800"
  >
    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-4">
      {note.fileType && note.fileType.includes('pdf') ? 'PDF' : 'DOC'}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">{note.fileName}</h4>
      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> 
          {new Date(note.createdAt).toLocaleDateString()}
        </span>
        <span className="w-1 h-1 bg-gray-300 rounded-full" />
        <span className="truncate max-w-[200px]">
          {note.summary ? stripMarkdown(note.summary).substring(0, 40) + '...' : 'No summary'}
        </span>
      </div>
    </div>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      <ArrowUpRight className="w-5 h-5 text-gray-400" />
    </div>
  </motion.div>
);

const QuickAction = ({ onClick, label }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium"
  >
    {label}
    <ArrowUpRight className="w-4 h-4" />
  </button>
);

const ScoreRow = ({ attempt }) => {
  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const dateStr = attempt.completedAt || attempt.createdAt;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : 'Recent';

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Quiz Result</p>
        <p className="text-xs text-gray-500">{formattedDate}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-bold">{percentage}%</span>
      </div>
    </div>
  );
};

export default Dashboard;