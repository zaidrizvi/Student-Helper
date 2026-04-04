import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  CalendarDays,
  Download,
  Globe,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { API_BASE } from "../config/apiBase";
import { downloadSharedNotePdf } from "../services/noteDownloads";
import { formatDate, formatDateTime, getFileBadgeLabel } from "../utils/formatters";
import { EmptyState, LoadingState } from "../components/ui/StateBlock";
import { PageHeader, PageShell, Panel, SectionLabel } from "../components/ui/AppSurface";
import Button from "../components/ui/Button";
import MarkdownRenderer from "../components/ui/MarkdownRenderer";

export default function SharedNoteView() {
  const { shareToken } = useParams();
  const [note, setNote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const response = await fetch(`${API_BASE}/notes/shared/${shareToken}`);
        if (!response.ok) throw new Error("Failed to load note");
        const data = await response.json();
        setNote(data.note);
      } catch {
        setError("This share link is invalid, private, or has expired.");
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
      await downloadSharedNotePdf({ shareToken, fileName: note.fileName });
    } catch (err) {
      setError(err.message || "Failed to download PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (loading) return <LoadingState title="Opening shared study guide" description="Loading the public note view." />;

  if (error) {
    return (
      <PageShell contentClassName="pt-28">
        <EmptyState icon={Lock} title="Shared note unavailable" description={error} action={<Link to="/"><Button>Open ScholarAI</Button></Link>} />
      </PageShell>
    );
  }

  return (
    <PageShell contentClassName="pt-10 pb-16">
      <section className="mb-8 flex flex-col gap-4 rounded-[30px] border border-white/80 bg-white/78 p-4 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-[0_18px_36px_-18px_rgba(14,165,233,0.6)]">
            <BrainCircuit className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold text-slate-950 dark:text-white">ScholarAI shared guide</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Public study guide view with source text hidden.</p>
          </div>
        </div>
        <Link to="/sign-up">
          <Button>
            <Sparkles className="h-4 w-4" />
            Create your own workspace
          </Button>
        </Link>
      </section>

      <section className="space-y-8">
        <PageHeader
          eyebrow="Shared note"
          title={note.fileName}
          description="This page shows the AI-generated study guide only. The original extracted source text remains private to the owner."
          actions={<Button variant="secondary" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>{isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download PDF</Button>}
        />

        <div className="flex flex-wrap gap-3">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">{getFileBadgeLabel(note.fileType, note.fileName)}</div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">{formatDate(note.createdAt)}</div>
          {note.share?.expiresAt ? <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">Expires {formatDateTime(note.share.expiresAt)}</div> : null}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="p-5 sm:p-7">
          <div className="mb-5 rounded-[24px] border border-sky-100 bg-sky-50 p-4 text-sm text-slate-600 dark:border-sky-900 dark:bg-sky-950/25 dark:text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-sky-700 dark:text-sky-300">
              <Globe className="h-4 w-4" />
              Public-safe study guide
            </div>
            <p className="mt-2 leading-7">Only the AI summary is visible here. Raw extracted source text and account-only actions remain private.</p>
          </div>

          {note.summary ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <MarkdownRenderer content={note.summary} variant="public" />
            </motion.div>
          ) : (
            <EmptyState title="No AI summary available" description="This note does not currently have a shared study guide to display." compact />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5 sm:p-6">
            <SectionLabel>Trust and clarity</SectionLabel>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950 dark:text-white">What this page includes</h2>
            <div className="mt-4 space-y-3">
              {["AI-generated study guide content", "Downloadable shared PDF version", "Expiry information for the public link"].map((item) => (
                <div key={item} className="rounded-[22px] bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">{item}</div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <SectionLabel>Privacy</SectionLabel>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950 dark:text-white">Protected by design</h2>
            <div className="mt-4 rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Source text stays hidden
              </div>
              <p className="mt-2">Shared note pages are designed for trust: they communicate what is public, what remains private, and when access expires.</p>
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <SectionLabel>Want your own?</SectionLabel>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950 dark:text-white">Upload your own study material</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">Generate private study guides, quizzes, weak-topic help, and downloadable PDFs from your own notes.</p>
            <div className="mt-5"><Link to="/sign-up"><Button className="w-full"><Sparkles className="h-4 w-4" />Create free account</Button></Link></div>
          </Panel>
        </div>
      </section>
    </PageShell>
  );
}
