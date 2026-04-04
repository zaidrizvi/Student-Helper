import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Library,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import { formatDate, getFileBadgeLabel, stripMarkdown } from "../utils/formatters";
import { EmptyState } from "../components/ui/StateBlock";
import { InputField } from "../components/ui/Field";
import { PageHeader, PageShell, Panel, SectionLabel } from "../components/ui/AppSurface";
import Button from "../components/ui/Button";

export default function NotesLibrary() {
  const { apiCall, loading } = useApi();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    fetchNotes();
  }, [authLoading, isAuthenticated, navigate]);

  const fetchNotes = async () => {
    try {
      const response = await apiCall("get", "notes/history");
      setNotes(response.notes || []);
    } catch (err) {
      setNotes([]);
    }
  };

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => note.fileName.toLowerCase().includes(searchTerm.trim().toLowerCase())),
    [notes, searchTerm]
  );

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) return null;

  return (
    <PageShell>
      <section className="space-y-6">
        <PageHeader
          eyebrow="Saved material"
          title="Your note library"
          description="Review previously uploaded files, reopen AI study guides, and pick up where you left off without losing context."
          actions={
            <Button onClick={() => navigate("/upload-notes")} size="lg">
              <Plus className="h-4 w-4" />
              Upload new note
            </Button>
          }
        />

        <Panel className="p-4 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <SectionLabel>Browse and filter</SectionLabel>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Search by file name, then reopen the study guide or continue into quiz mode from the note detail page.
              </p>
            </div>
            <div className="w-full lg:max-w-md">
              <InputField
                icon={Search}
                placeholder="Search your uploaded notes"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-6">
        {loading ? (
          <Panel className="flex min-h-[18rem] items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading your study library...</p>
            </div>
          </Panel>
        ) : filteredNotes.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map((note, index) => (
              <motion.button
                key={note._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/notes/${note._id}`)}
                className="text-left"
              >
                <Panel className="flex h-full flex-col p-4 sm:p-6 transition-colors hover:border-sky-300 dark:hover:border-sky-700">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      {getFileBadgeLabel(note.fileType, note.fileName)}
                    </span>
                  </div>

                  <div className="mt-5 flex-1">
                    <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                      {note.fileName}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {note.summary
                        ? stripMarkdown(note.summary).slice(0, 150)
                        : "No AI summary has been generated for this note yet. Open it to continue the analysis flow."}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(note.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
                      Open note
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Panel>
              </motion.button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={searchTerm ? Search : Library}
            title={searchTerm ? "No notes match that search" : "Your library is still empty"}
            description={
              searchTerm
                ? "Try another keyword or clear the search to see all of your uploaded material."
                : "Upload your first file to build a reusable study library with summaries, quiz history, and downloadable guides."
            }
            action={
              <Button onClick={() => navigate("/upload-notes")}>
                <Plus className="h-4 w-4" />
                Upload a note
              </Button>
            }
          />
        )}
      </section>
    </PageShell>
  );
}
