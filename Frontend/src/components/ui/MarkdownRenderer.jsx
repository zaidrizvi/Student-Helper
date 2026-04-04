import Markdown from "markdown-to-jsx";
import { cn } from "../../utils/ui";

export function preprocessMarkdown(text) {
  if (!text) return "";

  return String(text)
    .replace(/([^\n])\n(#+)/g, "$1\n\n$2")
    .replace(/([^\n])\n(-|\*|\d+\.) /g, "$1\n\n$2 ")
    .replace(/([a-zA-Z0-9])(\*\*)/g, "$1 $2");
}

const baseOverrides = {
  h1: {
    component: ({ children }) => (
      <h1 className="font-display mt-10 border-b border-slate-200 pb-4 text-3xl font-bold tracking-tight text-slate-950 first:mt-0 dark:border-slate-800 dark:text-white">
        {children}
      </h1>
    ),
  },
  h2: {
    component: ({ children }) => (
      <h2 className="mt-10 text-2xl font-bold tracking-tight text-slate-900 dark:text-sky-300">
        {children}
      </h2>
    ),
  },
  h3: {
    component: ({ children }) => (
      <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-100">{children}</h3>
    ),
  },
  p: {
    component: ({ children }) => (
      <p className="mb-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
        {children}
      </p>
    ),
  },
  ul: {
    component: ({ children }) => (
      <ul className="mb-5 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
        {children}
      </ul>
    ),
  },
  ol: {
    component: ({ children }) => (
      <ol className="mb-5 list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
        {children}
      </ol>
    ),
  },
  li: {
    component: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  },
  strong: {
    component: ({ children }) => (
      <strong className="font-semibold text-slate-950 dark:text-white">{children}</strong>
    ),
  },
  blockquote: {
    component: ({ children }) => (
      <blockquote className="my-6 rounded-3xl border border-sky-100 bg-sky-50 px-5 py-4 text-sm italic text-slate-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-slate-200">
        {children}
      </blockquote>
    ),
  },
  code: {
    component: ({ children }) => (
      <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-sky-700 dark:bg-slate-900 dark:text-sky-300">
        {children}
      </code>
    ),
  },
  a: {
    component: ({ children, href }) => (
      <a
        href={href}
        className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-600 dark:text-sky-300 dark:decoration-sky-700"
      >
        {children}
      </a>
    ),
  },
};

export default function MarkdownRenderer({
  content,
  className,
  variant = "study",
}) {
  const variantClasses = {
    study: "max-w-none",
    public: "max-w-none text-[15px]",
    compact: "max-w-none text-sm",
  };

  return (
    <div className={cn("prose prose-slate dark:prose-invert", variantClasses[variant], className)}>
      <Markdown options={{ forceBlock: true, overrides: baseOverrides }}>
        {preprocessMarkdown(content)}
      </Markdown>
    </div>
  );
}
