import { useState, useEffect, useRef } from "react";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import { useNotes } from "../contexts/NotesContext";
import { useNavigate } from "react-router-dom";
import Markdown from "markdown-to-jsx";
import { motion, AnimatePresence } from "framer-motion";
import { downloadNotePdf } from "../services/noteDownloads";
import {
  UploadCloud,
  FileText,
  Sparkles,
  X,
  History,
  Check,
  Loader2,
  Maximize2,
  Minimize2,
  Zap,
  BookOpen,
  Search,
  Layers,
  Copy,
  BrainCircuit,
  Settings2,
  Download,
  Image as ImageIcon
} from "lucide-react";

// --- UPDATED LIMITS (15MB & Image Support) ---
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
];

const MODES = [
  { label: "Quick Recap", value: "short", desc: "Key takeaways & highlights", icon: Zap },
  { label: "Standard", value: "normal", desc: "Balanced explanation", icon: Layers },
  { label: "Deep Dive", value: "detailed", desc: "In-depth comprehensive study", icon: BookOpen },
  { label: "Exam Prep", value: "ultra", desc: "Questions, answers & tips", icon: Search }
];

// --- HELPER: Clean Markdown & Fix Spacing ---
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

export default function UploadNotes() {
  const [file, setFile] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [mode, setMode] = useState("normal");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [geminiOutput, setGeminiOutput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [notesHistory, setNotesHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeNoteMeta, setActiveNoteMeta] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  
  const { loading, apiCall } = useApi();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { activeNote, setActiveNote, clearActiveNote, clearActiveQuiz } = useNotes();
  const navigate = useNavigate();
  const summaryRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) fetchHistory();
  }, [isAuthenticated]);

  useEffect(() => {
    if (geminiOutput && summaryRef.current) {
      summaryRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [geminiOutput]);

  useEffect(() => {
    if (!activeNote?.id || notesHistory.length === 0) return;

    const matchedNote = notesHistory.find((note) => note._id === activeNote.id);
    if (matchedNote) {
      setActiveNoteMeta({ _id: matchedNote._id, fileName: matchedNote.fileName });
    }
  }, [activeNote, notesHistory]);

  const fetchHistory = async () => {
    try {
      const res = await apiCall("get", "notes/history");
      setNotesHistory(Array.isArray(res?.notes) ? res.notes : []);
    } catch (e) { console.error("History fetch failed:", e); }
  };

  const showMsg = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    if (type !== 'loading') {
        setTimeout(() => setMessage(""), 5000);
    }
  };

  // --- NEW: Handle Quiz Navigation ---
  const handleStartQuiz = () => {
    const noteId = activeNote?.id;
    if(!noteId) {
        showMsg("Please generate notes first", "error");
        return;
    }
    clearActiveQuiz();
    navigate('/quiz');
  };

  const handleFile = (e) => {
    let f = null;
    if (e.dataTransfer && e.dataTransfer.files?.length > 0) {
      f = e.dataTransfer.files[0];
    } else if (e.target && e.target.files?.length > 0) {
      f = e.target.files[0];
    }

    if (!f) return;

    // --- CHECK FILE SIZE ---
    if (f.size > MAX_FILE_SIZE) {
        showMsg("File is too large. Max limit is 15MB.", "error");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
    }

    setFile(f);
    setMessage(""); 
    setHasStarted(false); 
    setGeminiOutput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let currentNotesId = activeNote?.id;

    if (!file && !customPrompt && !currentNotesId) {
        return showMsg("Please upload a file to start.", "error");
    }

    setHasStarted(true); 
    setGeminiOutput(""); 
    
    try {
      if (file) {
        showMsg("Uploading document...", "loading");
        const formData = new FormData();
        formData.append("file", file);
        
        const upRes = await apiCall('post', 'notes/upload', formData);
        
        if (!upRes || !upRes.notesId) throw new Error("Upload failed: No ID returned");
        
        currentNotesId = upRes.notesId;
        setActiveNote({ id: upRes.notesId, fileName: upRes.fileName || file.name });
        setActiveNoteMeta({ _id: upRes.notesId, fileName: upRes.fileName || file.name });
        clearActiveQuiz();
      }

      if (!currentNotesId && !file) {
          throw new Error("Please upload a document first.");
      }

      showMsg("AI is analyzing...", "loading");
      
      const genRes = await apiCall('post', 'notes/summarize', {
        notesId: currentNotesId, 
        prompt: customPrompt,
        mode
      });

      if (!genRes || !genRes.summary) {
          throw new Error("Analysis generated empty result. Please try again.");
      }

      const summaryText = typeof genRes.summary === 'string' 
        ? genRes.summary 
        : JSON.stringify(genRes.summary);

      setGeminiOutput(summaryText);
      
      if (genRes.notesId) {
        setActiveNote({ id: genRes.notesId, fileName: activeNoteMeta?.fileName || file?.name || "note" });
        if (!activeNoteMeta?._id) {
          setActiveNoteMeta({ _id: genRes.notesId, fileName: file?.name || "note" });
        }
        clearActiveQuiz();
      }

      showMsg("Analysis complete!", "success");
      fetchHistory();
      
      if (window.innerWidth < 1024) {
        setTimeout(() => {
            document.getElementById('output-panel')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }

    } catch (err) {
      console.error("Processing Error:", err);
      
      if (err.status === 404 || err.message?.toLowerCase().includes("found")) {
         clearActiveNote();
      }

      showMsg(err.message || "An error occurred processing your request.", "error");
      setHasStarted(false);
    }
  };

  const loadHistoryItem = (note) => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    setGeminiOutput(note.summary || "No summary available for this item.");
    setActiveNote(note);
    clearActiveQuiz();
    setActiveNoteMeta({ _id: note._id, fileName: note.fileName });

    setShowHistory(false);
    setHasStarted(true); 
    setMessage("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(geminiOutput);
    showMsg("Copied to clipboard", "success");
  };

  const handleDownloadPdf = async () => {
    const noteId = activeNoteMeta?._id || activeNote?.id;
    if (!noteId) {
      showMsg("Generate or open a note first.", "error");
      return;
    }

    setIsDownloadingPdf(true);
    try {
      await downloadNotePdf({
        noteId,
        fileName: activeNoteMeta?.fileName || file?.name || "note",
      });
      showMsg("PDF download started.", "success");
    } catch (err) {
      showMsg(err.message || "Could not download PDF.", "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (authLoading) return null;

  return (
    <div className="h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 font-sans flex flex-col overflow-hidden">
      <header className="flex-none h-16 z-30 px-4 md:px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">StudyBot</span>
        </div>

        <button 
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-slate-600"
        >
          <History className="w-4 h-4" />
          <span className="text-xs font-medium">History</span>
        </button>
      </header>

      <main className="flex-1 relative z-10 flex flex-col lg:flex-row gap-0 overflow-hidden">
        
        <motion.div 
          className={`
            flex-1 flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17]
            lg:max-w-[450px] xl:max-w-[480px] relative z-20
            transition-all duration-500 ease-in-out
            ${isFocused ? '-ml-[480px] opacity-0 pointer-events-none' : 'ml-0 opacity-100'}
          `}
        >
          <div className="p-6 lg:p-8 space-y-8">
            <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Analysis</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure your study material below.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">1</span>
                    Upload Material
                </label>
                {file && (
                   <button onClick={removeFile} className="text-[10px] text-red-500 hover:underline font-medium">Remove file</button>
                )}
              </div>
              
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e); }}
                className={`
                  relative group min-h-[110px] rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center p-1 cursor-pointer
                  ${isDragging 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : file 
                      ? 'border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/10' 
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    onChange={handleFile} 
                    accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                    className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                />
                {file ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex items-center gap-3 p-1">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left overflow-hidden">
                        <h3 className="font-medium text-sm text-slate-900 dark:text-white truncate w-full">{file.name}</h3>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                    </div>
                    <div className="ml-auto"><Check className="w-5 h-5 text-indigo-500" /></div>
                  </motion.div>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-200">Click to upload or drag file</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT, Images (Max 15MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">2</span>
                Learning Mode
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`
                      p-5 rounded-lg border text-left transition-all duration-200 flex flex-col gap-1.5 relative overflow-hidden
                      ${mode === m.value 
                        ? 'bg-slate-900 dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 text-white shadow-lg' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between w-full">
                      <m.icon className={`w-4 h-4 ${mode === m.value ? 'text-indigo-300 dark:text-indigo-200' : 'text-slate-400'}`} />
                      {mode === m.value && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />}
                    </div>
                    <div>
                      <div className={`font-semibold text-xs ${mode === m.value ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{m.label}</div>
                      <div className={`text-[10px] leading-tight mt-0.5 ${mode === m.value ? 'text-slate-300 dark:text-indigo-100' : 'text-slate-500'}`}>{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">3</span>
                Specific Instructions
              </label>
              <div className="relative h-full">
                <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g. 'Explain the formulas step-by-step'..."
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none min-h-[100px] transition-all placeholder:text-slate-400"
                />
                <Settings2 className="absolute bottom-3 right-3 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>
            
            <div className="pt-2 sticky bottom-0 pb-4 bg-white dark:bg-[#0B0F17] z-10">
              <button 
                onClick={handleSubmit}
                disabled={loading || (!file && !customPrompt.trim() && !activeNote?.id)} 
                className="
                  w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm 
                  shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none 
                  transition-all hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2
                "
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Analyzing..." : "Generate Analysis"}
              </button>

              <AnimatePresence mode="wait">
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-3 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      messageType === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                      messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                      'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}
                  >
                    <span className="shrink-0">
                      {messageType === 'loading' ? <Loader2 className="w-3 h-3 animate-spin"/> : 
                       messageType === 'error' ? <X className="w-3 h-3" /> :
                       <Check className="w-3 h-3"/>}
                    </span>
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div 
          id="output-panel"
          layout
          className={`
            flex-1 h-full min-h-0 bg-slate-50/50 dark:bg-[#0F141E] p-4 lg:p-6 relative
            flex flex-col
            ${isFocused ? 'fixed inset-0 z-40 w-full bg-slate-100 dark:bg-[#0B0F17]' : ''}
          `}
        >
           <div className="bg-white dark:bg-[#0B0F17] w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden relative">
              
              <div className="flex-none h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0B0F17]">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                       <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">AI Analysis</span>
                 </div>

                 <div className="flex items-center gap-2">
                    {geminiOutput && !loading && (
                       <>
                         <button onClick={handleCopy} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Copy">
                           <Copy className="w-4 h-4" />
                         </button>
                         <button
                           onClick={handleDownloadPdf}
                           disabled={isDownloadingPdf}
                           className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-60"
                           title="Download extracted notes as PDF"
                         >
                           {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                           <span>PDF</span>
                         </button>
                         <button onClick={() => navigate('/quiz')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all ml-2">
                           <Zap className="w-3.5 h-3.5 fill-current" /> 
                           <span>Quiz</span>
                         </button>
                       </>
                    )}
                    <button onClick={() => setIsFocused(!isFocused)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden lg:block">
                      {isFocused ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                 </div>
              </div>

              <div ref={summaryRef} className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar scroll-smooth">
                  
                  {!hasStarted && !loading && !geminiOutput && (
                    <div className="h-full flex flex-col items-center justify-center text-center select-none pb-10">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ready to Start</h3>
                      <p className="text-slate-400 text-sm mt-1">Upload a document to begin analysis</p>
                    </div>
                  )}

                  {loading && (
                    <div className="h-full flex flex-col items-center justify-center pb-10">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                      <h3 className="text-slate-900 dark:text-white font-medium">Analyzing your content...</h3>
                    </div>
                  )}

                  {!loading && geminiOutput && (
                    <>
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
                            {preprocessMarkdown(String(geminiOutput))}
                          </Markdown>
                      </div>
                      
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
                    </>
                  )}
              </div>
           </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full max-w-[350px] bg-white dark:bg-[#0B0F17] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[70] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8 flex-none">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">History</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {notesHistory.length === 0 && (
                    <p className="text-sm text-slate-500 text-center mt-10">No history found</p>
                )}
                {notesHistory.map((note) => (
                    <button key={note._id} onClick={() => loadHistoryItem(note)} className="w-full text-left group p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white hover:shadow-md transition-all">
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">{note.fileName || "Untitled Note"}</div>
                      <span className="text-[10px] text-slate-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
