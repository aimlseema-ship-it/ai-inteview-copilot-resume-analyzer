import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Brain,
  FileText,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  Target,
  Zap,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Award,
  Briefcase,
} from "lucide-react";
import { analyzeResume, interviewChat, type AnalysisResult } from "@/lib/ai.functions";


export const Route = createFileRoute("/")({
  component: Home,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <main id="tools" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-8 md:grid-cols-2">
          <ResumeAnalyzer />
          <InterviewCopilot />
        </div>
        <Features />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-hero shadow-glow">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-semibold">AceIntern</span>
      </div>
      <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
        <a href="#tools" className="hover:text-foreground">Tools</a>
        <a href="#features" className="hover:text-foreground">Features</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Powered by ML & Large Language Models
      </div>
      <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-bold leading-tight md:text-6xl">
        Your <span className="text-gradient">AI Interview Copilot</span>
        <br />& Smart Resume Analyzer
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
        Practice interviews with real-time AI coaching and get instant, ML-powered feedback on
        your resume — all in one place.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="#tools"
          className="inline-flex items-center gap-2 rounded-xl bg-hero px-6 py-3 font-medium text-primary-foreground shadow-glow transition hover:-translate-y-0.5"
        >
          <Zap className="h-4 w-4" />
          Try it free
        </a>
        <a
          href="#features"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium hover:border-primary"
        >
          How it works
        </a>
      </div>
    </section>
  );
}

function ResumeAnalyzer() {
  const analyze = useServerFn(analyzeResume);
  const [resume, setResume] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fileToBase64(f: File): Promise<string> {
    const buf = await f.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function onAnalyze() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const payload: {
        resume: string;
        jobRole: string;
        file?: { data: string; mime: string; name: string };
      } = { resume, jobRole };

      if (file) {
        const data = await fileToBase64(file);
        payload.file = { data, mime: file.type || "application/pdf", name: file.name };
      }
      const res = await analyze({ data: payload });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && (file !== null || resume.length >= 30);

  return (
    <section className="card-surface p-6">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <h2 className="font-display text-xl font-semibold">Resume Analyzer</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your resume (PDF/image) or paste it as text. Get skills, experience, and an ATS score.
      </p>

      <input
        value={jobRole}
        onChange={(e) => setJobRole(e.target.value)}
        placeholder="Target role (e.g. Frontend Engineer)"
        className="mt-4 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
      />

      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-background/40 px-3 py-3 text-sm hover:border-primary">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Upload className="h-4 w-4 text-primary" />
          {file ? (
            <span className="truncate text-foreground">{file.name}</span>
          ) : (
            <span>Upload resume — PDF, PNG, JPG</span>
          )}
        </div>
        {file ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setFile(null);
            }}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">Choose file</span>
        )}
        <input
          type="file"
          className="hidden"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="relative mt-3">
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder={file ? "Optional: extra context…" : "…or paste your resume text here"}
          rows={5}
          className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <button
        onClick={onAnalyze}
        disabled={!canSubmit}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-hero px-4 py-2.5 font-medium text-primary-foreground shadow-glow transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
        {loading ? "Analyzing…" : "Analyze Resume"}
      </button>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {result && <AnalysisReport result={result} />}
    </section>
  );
}

function AnalysisReport({ result }: { result: AnalysisResult }) {
  const score = result.atsScore;
  const scoreColor =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400";
  const ring =
    score >= 80 ? "ring-emerald-400/40" : score >= 60 ? "ring-amber-400/40" : "ring-rose-400/40";

  return (
    <div className="mt-5 space-y-5">
      <div className={`flex items-center gap-4 rounded-xl border border-border bg-background/50 p-4 ring-1 ${ring}`}>
        <div className="relative grid h-20 w-20 place-items-center rounded-full bg-card">
          <span className={`font-display text-2xl font-bold ${scoreColor}`}>{score}</span>
          <span className="absolute bottom-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            ATS
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">ATS-ready score</p>
          <p className="mt-1 text-sm">{result.verdict}</p>
        </div>
      </div>

      {result.summary && (
        <p className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
          {result.summary}
        </p>
      )}

      {result.skills.length > 0 && (
        <Section icon={<Award className="h-4 w-4" />} title="Skills detected">
          <div className="flex flex-wrap gap-1.5">
            {result.skills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {result.experience.length > 0 && (
        <Section icon={<Briefcase className="h-4 w-4" />} title="Experience & projects">
          <ul className="space-y-3">
            {result.experience.map((x, i) => (
              <li key={i} className="rounded-lg border border-border bg-card/50 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {x.role}
                    {x.company ? <span className="text-muted-foreground"> — {x.company}</span> : null}
                  </p>
                  {x.duration && (
                    <span className="text-xs text-muted-foreground">{x.duration}</span>
                  )}
                </div>
                {x.highlights?.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                    {x.highlights.map((h, j) => (
                      <li key={j}>{h}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {result.strengths.length > 0 && (
          <Section icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} title="Strengths">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.strengths.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </Section>
        )}
        {result.weaknesses.length > 0 && (
          <Section icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} title="Gaps">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.weaknesses.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {(result.matchedKeywords.length > 0 || result.missingKeywords.length > 0) && (
        <Section icon={<Target className="h-4 w-4" />} title="ATS keywords">
          {result.matchedKeywords.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Matched</p>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.missingKeywords.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-300"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {result.improvements.length > 0 && (
        <Section icon={<Sparkles className="h-4 w-4 text-primary" />} title="Suggested improvements">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {result.improvements.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </Section>
      )}

      {result.suggestedRoles.length > 0 && (
        <Section icon={<Briefcase className="h-4 w-4" />} title="Recommended roles">
          <div className="flex flex-wrap gap-1.5">
            {result.suggestedRoles.map((r) => (
              <span
                key={r}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs"
              >
                {r}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function InterviewCopilot() {
  const chat = useServerFn(interviewChat);

  const [role, setRole] = useState("Software Engineer");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI Interview Copilot. Tell me the role you're preparing for, or paste an interview question and I'll suggest a strong answer. Say **\"start practice\"** to run a mock interview.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: { messages: next, role } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "failed"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card-surface flex flex-col p-6">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/20 text-accent">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h2 className="font-display text-xl font-semibold">Interview Copilot</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Live AI coaching. Paste questions or practice a mock interview.
      </p>

      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Role you're preparing for"
        className="mt-4 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
      />

      <div
        ref={scrollRef}
        className="mt-3 h-80 space-y-3 overflow-y-auto rounded-lg border border-border bg-background/40 p-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "mr-auto max-w-[90%] rounded-xl border border-border bg-card px-3 py-2 text-sm"
            }
          >
            {m.role === "assistant" ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              m.content
            )}
          </div>
        ))}
        {loading && (
          <div className="mr-auto inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question or paste an interview prompt…"
          className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-hero px-4 py-2 font-medium text-primary-foreground shadow-glow disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Brain,
      title: "ML-powered analysis",
      desc: "Advanced language models extract skills, match ATS keywords and score your resume.",
    },
    {
      icon: MessageSquare,
      title: "Real-time coaching",
      desc: "Get structured STAR-format answers and instant feedback during practice.",
    },
    {
      icon: Target,
      title: "Role-aware suggestions",
      desc: "Recommendations tailored to your target job and industry standards.",
    },
  ];
  return (
    <section id="features" className="mt-20">
      <h2 className="text-center font-display text-3xl font-bold">Everything you need to interview smarter</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="card-surface p-6">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} AceIntern. All rights reserved.</p>
        <p>
          Built with <span className="text-primary">♥</span> by{" "}
          <span className="font-medium text-foreground">Shaik Seema</span>
        </p>
      </div>
    </footer>
  );
}
