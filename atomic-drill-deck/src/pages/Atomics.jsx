import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, ShieldAlert, Github, X, LayoutGrid, Table } from "lucide-react";
import { fetchTechniques, REPO_URL } from "@/lib/atomicApi";
import TechniqueCard from "@/components/TechniqueCard";
import AtomicTable from "@/components/AtomicTable";

export default function Atomics() {
  const [techniques, setTechniques] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [tactic, setTactic] = useState("all");
  const [view, setView] = useState("grid");

  useEffect(() => {
    fetchTechniques()
      .then(setTechniques)
      .catch(e => setError(e.message || "Failed to load techniques."));
  }, []);

  const tactics = useMemo(() => {
    if (!techniques) return [];
    return ["all", ...Array.from(new Set(techniques.flatMap(t => t.tactics))).sort()];
  }, [techniques]);

  const filtered = useMemo(() => {
    if (!techniques) return [];
    const q = query.trim().toLowerCase();
    return techniques.filter(t => {
      if (tactic !== "all" && !t.tactics.includes(tactic)) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.tactics.some(x => x.toLowerCase().includes(q))
      );
    });
  }, [techniques, query, tactic]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <ShieldAlert className="h-4 w-4" />
            Atomic Red Team
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Atomics Library
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every Atomic Red Team test, mapped to the MITRE ATT&CK® framework.
            Browse techniques, read the test notes, and copy any command with one click.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            redcanaryco/atomic-red-team
          </a>
        </div>
      </header>

      {/* Controls */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by technique ID or name…"
                className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {tactics.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {tactics.map(t => (
                  <button
                    key={t}
                    onClick={() => setTactic(t)}
                    className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      tactic === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setView("grid")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </button>
              <button
                onClick={() => setView("table")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Table view"
              >
                <Table className="h-3.5 w-3.5" /> Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!techniques && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="mt-3 text-sm">Loading techniques…</p>
          </div>
        )}

        {techniques && (
          <>
            <p className="mb-4 text-xs text-muted-foreground">
              {filtered.length} of {techniques.length} techniques
            </p>
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                No techniques match “{query}”.
              </div>
            ) : view === "table" ? (
              <AtomicTable techniques={filtered} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(t => (
                  <TechniqueCard key={t.id} technique={t} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}