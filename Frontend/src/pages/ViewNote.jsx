import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../contexts/NotesContext';
import Markdown from 'markdown-to-jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadNotePdf } from '../services/noteDownloads';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Bot, 
  Share2, 
  Target, 
  Search, 
  Copy, 
  Check,
  X,
  Globe,
  Sparkles,
  Lightbulb,
  Minimize2,
  Maximize2,
  Download,
  Loader2,
  Zap,
  ShieldOff
} from 'lucide-react';

/**
 * Helper: Clean Markdown & Fix Spacing
 * (Copied from UploadNotes.jsx to keep markdown rendering consistent)
 */
const preprocessMarkdown = (text) => {
  if (!text) return "";
  return text
    // 1. Ensure headings have a blank line before them
    .replace(/([^\n])\n(#+)/g, '$1\n\n$2')
    // 2. Ensure lists have a blank line before them
    .replace(/([^\n])\n(-|\*|\d+\.) /g, '$1\n\n$2 ')
    // 3. Ensure bold text has a space before it if it's stuck to a word
    .replace(/([a-zA-Z0-9])(\*\*)/g, '$1 $2');
};

export default function ViewNote() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { apiCall, loading } = useApi();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { setActiveNote, clearActiveQuiz } = useNotes();
  const [note, setNote] = useState(null);
  const [pageError, setPageError] = useState("");
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'original'
  const [copiedId, setCopiedId] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  
  // Share State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [isRevokingShare, setIsRevokingShare] = useState(false);

  // Focus Mode
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }

    fetchNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, authLoading, isAuthenticated, navigate]);

  const fetchNote = async () => {
    try {
      const res = await apiCall('get', `notes/${noteId}`);
      setNote(res.note);
      setActiveNote(res.note);
      setPageError("");
    } catch (err) {
      setPageError(err.message || "Failed to load note.");
    }
  };

  // --- SHARE FUNCTION ---
  const handleShare = async () => {
    setIsShareModalOpen(true);
    if (shareUrl) return; // Don't regenerate if we already have it in state

    setIsSharing(true);
    setShareError("");
    try {
      const res = await apiCall('post', 'notes/share', { noteId, expiresInDays: 7 });
      // Construct full URL using the current website origin
      const url = `${window.location.origin}/shared/${res.shareToken}`;
      setShareUrl(url);
      setNote((current) =>
        current
          ? { ...current, share: { ...(current.share || {}), expiresAt: res.expiresAt, isActive: true } }
          : current
      );
    } catch (err) {
      setShareError(err.message || "Share failed.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async () => {
    setIsRevokingShare(true);
    setShareError("");
    try {
      await apiCall('post', 'notes/share/revoke', { noteId });
      setShareUrl("");
      setNote((current) =>
        current
          ? { ...current, share: { ...(current.share || {}), revokedAt: new Date().toISOString(), isActive: false } }
          : current
      );
    } catch (err) {
      setShareError(err.message || "Failed to revoke share link.");
    } finally {
      setIsRevokingShare(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartQuiz = () => {
    if (!note) return;
    setActiveNote(note);
    clearActiveQuiz();
    navigate('/quiz');
  };

  const handleDownloadPdf = async () => {
    if (!note) return;

    setIsDownloadingPdf(true);
    try {
      await downloadNotePdf({
        noteId: note._id,
        fileName: note.fileName,
      });
    } catch (err) {
      setPageError(err.message || "PDF download failed.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (pageError && !note) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Could not load this note</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{pageError}</p>
        </div>
      </div>
    );
  }

  if (loading || !note) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans ${isFocused ? 'pt-4 px-4' : 'pt-20 px-4 md:px-8'} pb-12 transition-all duration-300`}>
      
      <div className={`mx-auto ${isFocused ? 'max-w-6xl' : 'max-w-5xl'}`}>
        
        {/* Header / Navigation */}
        {!isFocused && (
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors group"
              >
                <ArrowLeft className="w-6 h-6 text-gray-500 group-hover:text-black dark:group-hover:text-white" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate max-w-md md:max-w-xl">
                    {note.fileName}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {note.fileType?.split('/')[1]?.toUpperCase() || 'DOC'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleStartQuiz}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all active:scale-95"
              >
                <Target className="w-4 h-4" />
                Generate Quiz
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-60"
              >
                {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2 hidden sm:block" />
              
              {/* SHARE BUTTON */}
              <button 
                 onClick={handleShare}
                 className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                 title="Share Note"
               >
                 <Share2 className="w-5 h-5" />
               </button>

               <button 
                 onClick={() => setIsFocused(true)}
                 className="p-2 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                 title="Focus Mode"
               >
                 <Maximize2 className="w-5 h-5" />
               </button>
            </div>
          </header>
        )}

        {/* Focus Mode Header (Only visible when focused) */}
        {isFocused && (
          <div className="flex justify-between items-center mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
             <h2 className="font-bold text-lg truncate">{note.fileName}</h2>
             <button 
               onClick={() => setIsFocused(false)}
               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
             >
               <Minimize2 className="w-5 h-5 text-gray-500" />
             </button>
          </div>
        )}

        {/* Tabs */}
        {!isFocused && (
          <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 mb-8">
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'ai' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Bot className="w-4 h-4" /> AI Insights & History
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'original' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" /> Extracted Text
            </button>
          </div>
        )}

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'ai' ? (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {!note.history || note.history.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No AI summaries generated yet.</p>
                </div>
              ) : (
                // Render history reversed (latest first)
                [...note.history].reverse().map((entry, idx) => (
                  <div key={idx} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* History Entry Header */}
                    <div className="bg-gray-50/50 dark:bg-gray-800/30 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">#{note.history.length - idx}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prompt</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                             {!entry.prompt || entry.prompt === "(No custom prompt)" ? "Standard Summary" : entry.prompt}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                         {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Rich Content Body - STYLED to match UploadNotes AI UI */}
                    <div className="p-6 md:p-10 relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleCopy(entry.answer, idx)}
                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            {copiedId === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* This markdown rendering uses the same overrides and classes as UploadNotes */}
                        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-xl">
                          <Markdown options={{
                            forceBlock: true,
                            overrides: {
                              h1: { component: ({ children }) => <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800 mt-8 first:mt-0">{children}</h1> },
                              h2: { component: ({ children }) => <h2 className="text-xl font-bold text-slate-900 dark:text-indigo-400 mt-8 mb-4">{children}</h2> },
                              h3: { component: ({ children }) => <h3 className="text-lg font-semibold text-slate-800 dark:text-indigo-200 mt-6 mb-2">{children}</h3> },
                              li: { component: ({ children }) => <li className="mb-1 ml-4">{children}</li> },
                              p: { component: ({ children }) => <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">{children}</p> },
                              strong: { component: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong> },
                              blockquote: { component: ({ children }) => <div className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-slate-50 dark:bg-slate-900/50 rounded-r italic">{children}</div> }
                            }
                          }}>
                            {preprocessMarkdown(String(entry.answer))}
                          </Markdown>
                        </div>

                        {/* Bottom CTA for latest entry (same gradient CTA from UploadNotes) */}
                        {idx === 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
                          >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                              <div>
                                <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5" /> Master this topic</h3>
                                <p className="text-indigo-100 text-sm mt-1">Test your understanding with a personalized AI quiz.</p>
                              </div>
                              <button 
                                onClick={handleStartQuiz}
                                className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-50 transition-colors whitespace-nowrap"
                              >
                                Start Quiz
                              </button>
                            </div>
                          </motion.div>
                        )}
                    </div>
                  </div>
                ))
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
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Search className="w-4 h-4" /> Raw Content
                  </h3>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
                  >
                    {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download PDF
                  </button>
                </div>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                   <p className="whitespace-pre-wrap leading-relaxed">
                     {note.extractedText || "No text extracted from this file."}
                   </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* --- SHARE MODAL --- */}
        <AnimatePresence>
          {isShareModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsShareModalOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-[70]"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Globe className="w-5 h-5 text-indigo-500" /> Share Note
                  </h3>
                  <button onClick={() => setIsShareModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Shared links expose only the AI study guide summary, not the full extracted source text.
                </p>

                {note?.share?.expiresAt && (
                  <p className="text-xs text-gray-500 mb-4">
                    Expires on {new Date(note.share.expiresAt).toLocaleString()}.
                  </p>
                )}

                <div className="relative">
                  <div className="w-full p-3 pr-12 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-mono text-gray-600 dark:text-gray-300 truncate border border-gray-200 dark:border-gray-700">
                    {isSharing ? "Generating link..." : shareUrl}
                  </div>
                  {!isSharing && (
                    <button 
                      onClick={() => handleCopy(shareUrl, 'share')}
                      className="absolute right-2 top-2 p-1.5 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:scale-105 transition-transform border border-gray-200 dark:border-gray-600"
                    >
                      {copiedId === 'share' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-indigo-500" />}
                    </button>
                  )}
                </div>

                {shareError && (
                  <p className="text-sm text-red-500 mt-3">{shareError}</p>
                )}

                <button
                  onClick={handleRevokeShare}
                  disabled={isRevokingShare || !note?.share?.isActive}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {isRevokingShare ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                  Revoke Link
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
