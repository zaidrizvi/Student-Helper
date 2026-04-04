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
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const MODES = [
  { label: "Quick Recap", value: "short", desc: "Key takeaways & highlights", icon: Zap },
  { label: "Standard", value: "normal", desc: "Balanced explanation", icon: Layers },
  { label: "Deep Dive", value: "detailed", desc: "In-depth comprehensive study", icon: BookOpen },
  { label: "Exam Prep", value: "ultra", desc: "Questions, answers & tips", icon: Search },
];

const preprocessMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/([^\n])\n(#+)/g, "$1\n\n$2")
    .replace(/([^\n])\n(-|\*|\d+\.) /g, "$1\n\n$2 ")
    .replace(/([a-zA-Z0-9])(\*\*)/g, "$1 $2");
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
    if (!authLoading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }
    if (isAuthenticated) fetchHistory();
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (geminiOutput && summaryRef.current) {
      summaryRef.current.scrollTo({ top: 0, behavior: "smooth" });
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
    } catch {
      setNotesHistory([]);
    }
  };

  const showMsg = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    if (type !== "loading") {
      window.setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleStartQuiz = () => {
    const noteId = activeNote?.id;
    if (!noteId) {
      showMsg("Please generate notes first", "error");
      return;
    }
    clearActiveQuiz();
    navigate("/quiz");
  };

  const handleFile = (e) => {
    let f = null;
    if (e.dataTransfer?.files?.length > 0) f = e.dataTransfer.files[0];
    else if (e.target?.files?.length > 0) f = e.target.files[0];

    if (!f) return;

    if (!ALLOWED_TYPES.includes(f.type)) {
      showMsg("Unsupported file type. Please use PDF, DOCX, TXT, or image files.", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

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

        const upRes = await apiCall("post", "notes/upload", formData);
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
      const genRes = await apiCall("post", "notes/summarize", {
        notesId: currentNotesId,
        prompt: customPrompt,
        mode,
      });

      if (!genRes || !genRes.summary) {
        throw new Error("Analysis generated empty result. Please try again.");
      }

      const summaryText = typeof genRes.summary === "string" ? genRes.summary : JSON.stringify(genRes.summary);
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
        window.setTimeout(() => {
          document.getElementById("output-panel")?.scrollIntoView({ behavior: "smooth" });
        }, 400);
      }
    } catch (err) {
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(geminiOutput);
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
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] pt-22 text-slate-800 dark:bg-[#0B0F17] dark:text-slate-100">
      <div className="mx-auto flex max-w-[1420px] flex-col gap-5 px-4 pb-5 md:px-6">
        <div className=" px-5 py-3.5 shadow-sm md:px-6 md:py-4">
          

            
        </div>

        <main className="flex min-h-[calc(100vh-10rem)] flex-col gap-5 lg:flex-row">
          <motion.div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[24px] border border-slate-200 bg-white shadow-sm custom-scrollbar dark:border-slate-800 dark:bg-[#0D1320] lg:max-w-[365px] xl:max-w-[390px] ${
              isFocused ? "pointer-events-none opacity-0 lg:-ml-[480px]" : "opacity-100"
            }`}
          >
            <div className="space-y-5 p-4 lg:p-5">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Analysis</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure your study material below.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] dark:bg-slate-800">1</span>
                    Upload Material
                  </label>
                  {file ? (
                    <button onClick={removeFile} className="text-xs font-medium text-rose-500 hover:underline">
                      Remove file
                    </button>
                  ) : null}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e);
                  }}
                  className={`group relative min-h-[118px] rounded-[24px] border-2 border-dashed p-3.5 text-center transition-all ${
                    isDragging
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-950/20"
                      : file
                        ? "border-sky-400 bg-sky-50/70 dark:bg-sky-950/10"
                        : "border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFile}
                    accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                    className="absolute inset-0 z-20 cursor-pointer opacity-0"
                  />

                  {file ? (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full items-center gap-3 rounded-2xl bg-white/70 p-3 dark:bg-slate-950/40">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
                        {file.type.startsWith("image/") ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{file.name}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                        </p>
                      </div>
                      <Check className="h-5 w-5 text-sky-500" />
                    </motion.div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sky-400 transition-transform group-hover:scale-105 dark:bg-slate-800">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                        Drop your file here or click to browse
                      </p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                        PDF, DOCX, TXT, JPG, PNG, and WEBP up to 15MB.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] dark:bg-slate-800">2</span>
                  Learning Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`rounded-[20px] border p-3 text-left transition-all ${
                        mode === m.value
                          ? "border-sky-500 bg-slate-900 text-white dark:bg-sky-600 dark:border-sky-500"
                          : "border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <m.icon className={`h-4 w-4 ${mode === m.value ? "text-sky-200" : "text-slate-400"}`} />
                        {mode === m.value ? <div className="h-2 w-2 rounded-full bg-emerald-400" /> : null}
                      </div>
                      <div className={`text-sm font-semibold ${mode === m.value ? "text-white" : "text-slate-900 dark:text-slate-200"}`}>{m.label}</div>
                      <div className={`mt-1 text-xs leading-5 ${mode === m.value ? "text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] dark:bg-slate-800">3</span>
                  Specific Instructions
                </label>
                <div className="relative">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="E.g. Explain the formulas step by step, focus on likely exam questions..."
                    className="min-h-[96px] w-full resize-none rounded-[26px] border border-slate-200 bg-slate-50 p-4 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-600 dark:focus:bg-slate-900"
                  />
                  <Settings2 className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 text-slate-300 dark:text-slate-600" />
                </div>
              </div>

              <div className="sticky bottom-0 space-y-3 border-t border-slate-100 bg-white pt-5 dark:border-slate-800 dark:bg-[#0D1320]">
                <button
                  onClick={handleSubmit}
                  disabled={loading || (!file && !customPrompt.trim() && !activeNote?.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Analyzing..." : "Generate Analysis"}
                </button>

                <AnimatePresence mode="wait">
                  {message ? (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-xs font-medium ${
                        messageType === "error"
                          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                          : messageType === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
                      }`}
                    >
                      {messageType === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : messageType === "error" ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      {message}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <motion.div
            id="output-panel"
            layout
            className={`flex min-h-0 flex-1 flex-col rounded-[26px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0D1320] ${
              isFocused ? "fixed inset-x-4 bottom-4 top-24 z-40 md:inset-x-6" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 md:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  
                  <h2 className="mt-2 text-[1.7rem] font-bold tracking-tight text-slate-900 dark:text-white">Analysis workspace</h2>
                 
                </div>
              </div>

              <div className="flex items-center gap-2">
                {geminiOutput && !loading ? (
                  <>
                    <button onClick={handleCopy} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200" title="Copy">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {isDownloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      PDF
                    </button>
                    <button
                      onClick={handleStartQuiz}
                      className="flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-sky-700"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Quiz
                    </button>
                  </>
                ) : null}
                <button
                  onClick={() => setIsFocused(!isFocused)}
                  className="hidden rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:block"
                >
                  {isFocused ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div ref={summaryRef} className="custom-scrollbar flex-1 overflow-y-auto p-5 md:p-8">
              {!hasStarted && !loading && !geminiOutput ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-300 dark:bg-slate-900 dark:text-slate-600">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white">Your study guide will appear here</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-500 dark:text-slate-400 md:text-base">
                    Upload a file, choose a learning depth, and generate a structured study guide with clear next steps.
                  </p>
                </div>
              ) : null}

              {loading ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-sky-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Analyzing your content...</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This usually takes a few moments.</p>
                </div>
              ) : null}

              {!loading && geminiOutput ? (
                <>
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-sky-600 prose-img:rounded-xl">
                    <Markdown
                      options={{
                        forceBlock: true,
                        overrides: {
                          h1: { component: ({ children }) => <h1 className="mb-6 mt-8 border-b border-slate-100 pb-2 text-3xl font-bold text-slate-900 first:mt-0 dark:border-slate-800 dark:text-white">{children}</h1> },
                          h2: { component: ({ children }) => <h2 className="mb-4 mt-8 text-xl font-bold text-slate-900 dark:text-sky-300">{children}</h2> },
                          h3: { component: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-semibold text-slate-800 dark:text-sky-100">{children}</h3> },
                          li: { component: ({ children }) => <li className="mb-1 ml-4">{children}</li> },
                          p: { component: ({ children }) => <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">{children}</p> },
                          strong: { component: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong> },
                          blockquote: {
                            component: ({ children }) => (
                              <div className="my-4 rounded-r-xl border-l-4 border-sky-500 bg-slate-50 py-2 pl-4 italic dark:bg-slate-900/50">
                                {children}
                              </div>
                            ),
                          },
                        },
                      }}
                    >
                      {preprocessMarkdown(String(geminiOutput))}
                    </Markdown>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mt-12 rounded-3xl bg-gradient-to-r from-sky-600 to-cyan-600 p-6 text-white shadow-lg"
                  >
                    <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold">
                          <Sparkles className="h-5 w-5" />
                          Master this topic
                        </h3>
                        <p className="mt-1 text-sm text-sky-50">Test your understanding with a personalized AI quiz.</p>
                      </div>
                      <button
                        onClick={handleStartQuiz}
                        className="rounded-2xl bg-white px-6 py-2.5 text-sm font-bold text-sky-700 transition-colors hover:bg-sky-50"
                      >
                        Start Quiz
                      </button>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </div>
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {showHistory ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 z-[60] bg-slate-900/45 backdrop-blur-sm" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[370px] flex-col border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0D1320]"
            >
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">History</h3>
                <button onClick={() => setShowHistory(false)} className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2">
                {notesHistory.length === 0 ? <p className="mt-10 text-center text-sm text-slate-500">No history found</p> : null}
                {notesHistory.map((note) => (
                  <button
                    key={note._id}
                    onClick={() => loadHistoryItem(note)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left transition-all hover:border-sky-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-sky-700 dark:hover:bg-slate-900"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{note.fileName || "Untitled Note"}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-950 dark:text-slate-500">
                        {note.fileType?.includes("pdf") ? "PDF" : "DOC"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
