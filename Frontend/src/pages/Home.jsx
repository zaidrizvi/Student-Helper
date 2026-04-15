import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Globe,
  LayoutPanelTop,
  Sparkles,
  Target,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PageShell, PageHeader, Panel, SectionLabel, StatPill } from "../components/ui/AppSurface";
import Button from "../components/ui/Button";

const featureCards = [
  {
    title: "Guided study guides",
    description:
      "Turn dense notes into structured explanations with clear sections, better hierarchy, and exam-ready summaries.",
    icon: BrainCircuit,
  },
  {
    title: "Quiz and weak-topic feedback",
    description:
      "Move straight from learning to recall practice, then review the exact areas that need another pass.",
    icon: Target,
  },
  {
    title: "History and share pages",
    description:
      "Reopen previous analyses, export polished PDFs, and send clean public study guides without exposing raw source text.",
    icon: Globe,
  },
];

const workflow = [
  { step: "01", title: "Upload material", description: "PDFs, lecture notes, typed files, or snapshots from class." },
  { step: "02", title: "Choose the learning depth", description: "Quick recap, standard review, or deeper exam-focused analysis." },
  { step: "03", title: "Study with momentum", description: "Read the guide, start a quiz, revisit history, and export when ready." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <PageShell contentClassName="pt-24 pb-16 sm:pt-28 sm:pb-20">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <PageHeader
          
            title={
              <>
                Study materials become
                <span className="text-gradient-sky"> a clear, teachable system.</span>
              </>
            }
            description="StudyAI helps students upload notes, generate structured explanations, build quizzes, revisit saved history, and share polished study guides without the mess of scattered tools."
            actions={
              <>
                <Link to="/sign-up">
                  <Button size="lg">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/sign-in">
                  <Button size="lg" variant="secondary">
                    Open demo workspace
                  </Button>
                </Link>
              </>
            }
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <StatPill icon={FileText} label="Input types" value="PDF, DOCX, TXT, images" />
            <StatPill icon={LayoutPanelTop} label="Output" value="Study guides, quizzes, share pages" />
            <StatPill icon={BookOpenText} label="Audience" value="Students who need clarity fast" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          className="relative"
        >
          <Panel className="overflow-hidden p-4 sm:p-6">
            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-sky-600 text-white">
                    <BrainCircuit className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold text-slate-900 dark:text-white">StudyAI workspace</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Upload. Understand. Practice.</p>
                  </div>
                </div>
                <SectionLabel>Live flow</SectionLabel>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Molecular biology lecture.pdf</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Uploaded
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900">Mode: Exam prep</div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900">Prompt: Focus on pathways likely to appear in finals.</div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
                    <Sparkles className="h-4 w-4" />
                    Generated study guide
                  </div>
                  <div className="space-y-3">
                    {["Core concepts summarized first", "Important pathways separated into sections", "Quiz and weak-topic review ready"].map((line) => (
                      <div key={line} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </motion.div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3 sm:mt-16">
        {featureCards.map(({ title, description, icon: Icon }, index) => (
          <Panel
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.08 }}
            className="p-6"
          >
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          </Panel>
        ))}
      </section>

      <section className="mt-12 sm:mt-16">
        <Panel className="overflow-hidden p-5 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-4">
              <SectionLabel>How students use it</SectionLabel>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                A clean study loop, not a one-off AI prompt box.
              </h2>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                The product is designed around a real revision cycle: upload material, read the study guide, test recall, revisit weak areas, and keep a useful history.
              </p>
            </div>

            <div className="grid gap-4">
              {workflow.map(({ step, title, description }, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="font-display text-2xl font-bold text-sky-600 dark:text-sky-300">{step}</div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}
