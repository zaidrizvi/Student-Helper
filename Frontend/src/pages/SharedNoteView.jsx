import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Markdown from 'markdown-to-jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config/apiBase';
import { downloadSharedNotePdf } from '../services/noteDownloads';
import { 
  FileText, 
  Calendar, 
  BrainCircuit, 
  Lock, 
  Bot, 
  Search, 
  Lightbulb, 
  Sparkles,
  Download,
  Loader2
} from 'lucide-react';

export default function SharedNoteView() {
  const { shareToken } = useParams();
  const [note, setNote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'original'
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        // Public endpoint: use the configured API base so shared links work in production.
        const response = await fetch(`${API_BASE}/notes/shared/${shareToken}`);
        
        if (!response.ok) {
          throw new Error("Failed to load note");
        }

        const res = await response.json();
        setNote(res.note);
      } catch (err) {
        setError("This link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [shareToken]);

  const handleDownloadPdf = async () => {
    if (!note) return;

    setIsDownloadingPdf(true);
    try {
      await downloadSharedNotePdf({
        shareToken,
        fileName: note.fileName,
      });
    } catch (err) {
      setError(err.message || "Failed to download PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center flex-col gap-4 text-center p-6">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
        <Lock className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
      <p className="text-gray-600 dark:text-gray-400 font-medium">{error}</p>
    </div>
  );

  if (loading || !note) return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Fallback: If main summary is empty, try to grab the latest AI answer from history
  const displaySummary = note.summary || (note.history && note.history.length > 0 ? note.history[note.history.length - 1].answer : null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
      
      {/* Public Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-1.5 bg-indigo-600 rounded-lg">
               <BrainCircuit className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
               StudyBot <span className="text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full ml-2">Shared</span>
             </span>
           </div>
           <a href="/" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
             Try StudyBot Free &rarr;
           </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        
        {/* Note Title Card */}
        <div className="mb-10 text-center md:text-left">
           <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
             {note.fileName}
           </h1>
           <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
             <div className="flex items-center gap-1.5">
               <Calendar className="w-4 h-4" />
               {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
             <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
             <span className="uppercase font-semibold tracking-wide text-xs">
               {note.fileType?.split('/')[1] || 'DOC'}
             </span>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 mb-8">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ai' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Bot className="w-4 h-4" /> AI Summary
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'original' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" /> Original Text
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 disabled:opacity-60"
          >
            {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'ai' ? (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {!displaySummary ? (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No AI summary available for this note.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-10 shadow-sm">
                   <div className="prose-lg dark:prose-invert max-w-none">
                      <Markdown options={{
                         forceBlock: true,
                         overrides: {
                            h1: {
                                component: ({ children, ...props }) => (
                                    <h1 {...props} className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                                        {children}
                                    </h1>
                                ),
                            },
                            h2: {
                                component: ({ children, ...props }) => (
                                    <h2 {...props} className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                        {children}
                                    </h2>
                                ),
                            },
                            strong: {
                                component: ({ children, ...props }) => (
                                    <strong {...props} className="font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/40 px-1 rounded">
                                        {children}
                                    </strong>
                                ),
                            },
                            blockquote: {
                                component: ({ children, ...props }) => (
                                    <div {...props} className="my-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-l-4 border-indigo-500 flex gap-4">
                                        <Lightbulb className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                                        <div className="italic text-gray-700 dark:text-gray-300 text-lg">
                                            {children}
                                        </div>
                                    </div>
                                ),
                            },
                            code: {
                                component: ({ children, ...props }) => (
                                    <code {...props} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400 border border-gray-200 dark:border-gray-700">
                                        {children}
                                    </code>
                                )
                            }
                         }
                      }}>
                         {displaySummary}
                      </Markdown>
                   </div>
                   
                   {/* Footer Promo */}
                   <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
                      <p className="text-gray-500 text-sm mb-4">Want to generate quizzes from this note?</p>
                      <a 
                        href="/sign-up"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-lg transition-all hover:scale-105"
                      >
                        <Sparkles className="w-4 h-4" />
                        Create Your Free Account
                      </a>
                   </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="original"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4" /> Original Content
                </h3>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                   <p className="whitespace-pre-wrap leading-relaxed">
                     {note.extractedText || "No text available."}
                   </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
