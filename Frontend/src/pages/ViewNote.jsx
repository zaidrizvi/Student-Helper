import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Check,
  Copy,
  Download,
  FileText,
  Globe,
  Loader2,
  Search,
  Share2,
  ShieldOff,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import { useNotes } from "../contexts/NotesContext";
import { downloadNotePdf } from "../services/noteDownloads";
import { formatDate, formatDateTime, getFileBadgeLabel } from "../utils/formatters";
import { EmptyState, InlineMessage, LoadingState } from "../components/ui/StateBlock";
import { PageHeader, PageShell, Panel, SectionLabel } from "../components/ui/AppSurface";
import Button from "../components/ui/Button";
import MarkdownRenderer from "../components/ui/MarkdownRenderer";

export default function ViewNote() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { apiCall, loading } = useApi();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { setActiveNote, clearActiveQuiz } = useNotes();

  const [note, setNote] = useState(null);
  const [pageError, setPageError] = useState("");
  const [activeTab, setActiveTab] = useState("ai");
  const [copiedId, setCopiedId] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [isRevokingShare, setIsRevokingShare] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return navigate("/sign-in");
    fetchNote();
  }, [noteId, authLoading, isAuthenticated, navigate]);

  const fetchNote = async () => {
    try {
      const response = await apiCall("get", `notes/${noteId}`);
      const resolvedNote =
        response?.note ??
        response?.data?.note ??
        response?.data ??
        (response?._id ? response : null);

      if (!resolvedNote) {
        setNote(null);
        setPageError("This note could not be opened.");
        return;
      }

      setNote(resolvedNote);
      setActiveNote(resolvedNote);
      setPageError("");
    } catch (err) {
      setPageError(err.message || "Failed to load note.");
    }
  };

  const handleCopy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const handleStartQuiz = () => {
    if (!note) return;
    setActiveNote(note);
    clearActiveQuiz();
    navigate("/quiz");
  };

  const handleDownloadPdf = async () => {
    if (!note) return;
    setIsDownloadingPdf(true);
    try {
      await downloadNotePdf({ noteId: note._id, fileName: note.fileName });
    } catch (err) {
      setPageError(err.message || "PDF download failed.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleShare = async () => {
    setIsShareModalOpen(true);
    if (shareUrl) return;
    setIsSharing(true);
    setShareError("");
    try {
      const response = await apiCall("post", "notes/share", { noteId, expiresInDays: 7 });
      setShareUrl(`${window.location.origin}/shared/${response.shareToken}`);
      setNote((current) => current ? { ...current, share: { ...(current.share || {}), expiresAt: response.expiresAt, isActive: true } } : current);
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
      await apiCall("post", "notes/share/revoke", { noteId });
      setShareUrl("");
      setNote((current) => current ? { ...current, share: { ...(current.share || {}), isActive: false, revokedAt: new Date().toISOString() } } : current);
    } catch (err) {
      setShareError(err.message || "Failed to revoke share link.");
    } finally {
      setIsRevokingShare(false);
    }
  };

  if (authLoading || (loading && !note)) {
    return <LoadingState title="Opening note" description="Loading your study guide, history, and actions." />;
  }

  if (!isAuthenticated) return null;

  if (pageError && !note) {
    return (
      <PageShell>
        <EmptyState title="Could not load this note" description={pageError} action={<Button onClick={() => navigate("/notes")}>Back to library</Button>} />
      </PageShell>
    );
  }

  if (!note) {
    return (
      <PageShell>
        <EmptyState
          title="This note is not available"
          description="We couldn't find a valid note payload for this page."
          action={<Button onClick={() => navigate("/notes")}>Back to library</Button>}
        />
      </PageShell>
    );
  }

  const noteHistory = Array.isArray(note.history) ? note.history : [];
  const historyCount = noteHistory.length;
  const latestEntry = historyCount ? noteHistory[historyCount - 1] : null;

  return (
    <PageShell>
      <section className="space-y-6">
        <PageHeader
          eyebrow="Saved note"
          title={note.fileName}
          description="Review previous AI outputs, switch to the extracted source text, start a quiz, or create a public study guide link."
          actions={
            <>
              <Button variant="ghost" onClick={() => navigate("/notes")}><ArrowLeft className="h-4 w-4" />Library</Button>
              <Button variant="secondary" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>{isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download PDF</Button>
              <Button onClick={handleStartQuiz}><Target className="h-4 w-4" />Start quiz</Button>
            </>
          }
        />

        <div className="flex flex-wrap gap-2.5">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">{getFileBadgeLabel(note.fileType, note.fileName)}</div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">{formatDate(note.createdAt)}</div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">{historyCount} saved AI responses</div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel className="p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              {[{ id: "ai", label: "AI history", icon: Bot }, { id: "original", label: "Extracted text", icon: Search }].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${active ? "bg-sky-600 text-white shadow-[0_18px_34px_-20px_rgba(14,165,233,0.55)]" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}><Icon className="h-4 w-4" />{tab.label}</button>;
              })}
            </div>
          </Panel>

          <AnimatePresence mode="wait">
            {activeTab === "ai" ? (
              <motion.div key="ai" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
                {historyCount ? [...noteHistory].reverse().map((entry, index) => <Panel key={`${entry.createdAt}-${index}`} className="overflow-hidden"><div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-start sm:justify-between sm:px-5"><div><SectionLabel>AI response {historyCount - index}</SectionLabel><p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{!entry.prompt || entry.prompt === "(No custom prompt)" ? "Standard summary" : entry.prompt}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(entry.createdAt)}</p></div><button onClick={() => handleCopy(entry.answer, index)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{copiedId === index ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}</button></div><div className="p-4 sm:p-7"><MarkdownRenderer content={entry.answer} variant="study" />{index === 0 ? <div className="mt-8 rounded-[28px] bg-[linear-gradient(135deg,#0ea5e9,#0284c7)] p-5 text-white shadow-[0_28px_70px_-44px_rgba(14,165,233,0.85)] sm:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="font-display text-lg font-bold sm:text-xl">Turn this guide into recall practice</p><p className="mt-1 text-sm leading-7 text-sky-50/90">Start a quiz from the latest analysis and review weak topics once you finish.</p></div><Button variant="secondary" onClick={handleStartQuiz} className="w-full bg-white text-sky-700 hover:bg-sky-50 sm:w-auto"><Target className="h-4 w-4" />Start quiz</Button></div></div> : null}</div></Panel>) : <EmptyState icon={Bot} title="No AI summaries saved yet" description="Run an analysis from the upload workspace to build a note history here." action={<Button onClick={() => navigate("/upload-notes")}>Open upload workspace</Button>} />}
              </motion.div>
            ) : (
              <motion.div key="original" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <Panel className="p-4 sm:p-7">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><SectionLabel>Extracted source text</SectionLabel><p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">This is the raw text extracted from the uploaded material. The public share page does not expose this content.</p></div>
                    <Button variant="secondary" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>{isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}PDF</Button>
                  </div>
                  <div className="rounded-[28px] bg-slate-50 p-5 text-sm leading-7 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <p className="whitespace-pre-wrap">{note.extractedText || "No text extracted from this file."}</p>
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <Panel className="p-4 sm:p-6">
            <SectionLabel>Share and export</SectionLabel>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950 dark:text-white">Public study guide link</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">Share the AI study guide without exposing the extracted raw source text.</p>
            <div className="mt-5 grid gap-3">
              <Button onClick={handleShare}><Share2 className="h-4 w-4" />Create share link</Button>
              <Button variant="secondary" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>{isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download PDF</Button>
            </div>
            {note.share?.expiresAt ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Current share link expires on {formatDateTime(note.share.expiresAt)}.</p> : null}
          </Panel>

          <Panel className="p-4 sm:p-6">
            <SectionLabel>Latest snapshot</SectionLabel>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950 dark:text-white">Most recent AI output</h2>
            {latestEntry ? <div className="mt-4 space-y-3"><div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Created</p><p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatDate(latestEntry.createdAt)}</p></div><div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Prompt</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{!latestEntry.prompt || latestEntry.prompt === "(No custom prompt)" ? "Standard summary" : latestEntry.prompt}</p></div></div> : <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No AI output saved yet.</p>}
          </Panel>
        </div>
      </section>

      <AnimatePresence>
        {pageError && note ? <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm sm:bottom-6 sm:right-6"><InlineMessage message={pageError} tone="error" /></motion.div> : null}
      </AnimatePresence>

      <AnimatePresence>
        {isShareModalOpen ? <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2"><Panel className="p-6 sm:p-7"><div className="flex items-center justify-between gap-4"><div><SectionLabel>Share note</SectionLabel><h2 className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">Public study guide link</h2></div><button onClick={() => setIsShareModalOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">Anyone with this link can read the AI study guide and download its PDF, but they will not see the raw extracted source text.</p><div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">{isSharing ? "Generating link" : "Share URL"}</p><p className="mt-2 break-all text-sm text-slate-600 dark:text-slate-300">{isSharing ? "Please wait while the link is created..." : shareUrl || "No link generated yet."}</p></div>{!isSharing && shareUrl ? <button onClick={() => handleCopy(shareUrl, "share")} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{copiedId === "share" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}</button> : null}</div></div>{note?.share?.expiresAt ? <div className="mt-4 rounded-[24px] bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400"><div className="flex items-center gap-2"><Globe className="h-4 w-4 text-sky-600 dark:text-sky-300" />Link expires {formatDateTime(note.share.expiresAt)}</div></div> : null}<AnimatePresence>{shareError ? <div className="mt-4"><InlineMessage message={shareError} tone="error" /></div> : null}</AnimatePresence><div className="mt-6 flex flex-wrap gap-3"><Button variant="secondary" onClick={handleShare} disabled={isSharing}>{isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{shareUrl ? "Refresh link" : "Generate link"}</Button><Button variant="ghost" onClick={handleRevokeShare} disabled={isRevokingShare || !note?.share?.isActive}>{isRevokingShare ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}Revoke link</Button></div></Panel></motion.div>
        </> : null}
      </AnimatePresence>
    </PageShell>
  );
}
