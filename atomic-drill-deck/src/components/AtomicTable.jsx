import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, Download } from "lucide-react";
import AtomicTestCard from "@/components/AtomicTestCard";
import TechniqueContext from "@/components/TechniqueContext";
import { fetchTechniqueMarkdown, parseTechniqueMarkdown } from "@/lib/atomicApi";
import { exportRowsToXlsx } from "@/lib/xlsxExport";

export default function AtomicTable({ techniques }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(new Set());

  const rows = techniques.flatMap(t =>
    (t.tests || []).map(test => ({
      key: `${t.id}-${test.guid || test.num}`,
      tid: t.id,
      tname: t.name,
      tactics: t.tactics,
      num: test.num,
      name: test.name,
      guid: test.guid,
      executor: test.executor,
    }))
  );

  async function toggle(tid, key) {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else {
      next.add(key);
      if (!cache[tid] && !loading.has(tid)) {
        const load = new Set(loading); load.add(tid); setLoading(load);
        try {
          const md = await fetchTechniqueMarkdown(tid);
          const parsed = parseTechniqueMarkdown(md);
          setCache(prev => ({ ...prev, [tid]: {
            tests: parsed.tests || [],
            title: parsed.title,
            attackDescription: parsed.attackDescription,
            sourceUrl: parsed.sourceUrl,
            ready: true,
          } }));
        } catch {
          setCache(prev => ({ ...prev, [tid]: { error: true, ready: true } }));
        } finally {
          const done = new Set(loading); done.delete(tid); setLoading(done);
        }
      }
    }
    setExpanded(next);
  }

  function handleExport() {
    const header = ["Tactic", "Technique", "Technique Name", "#", "Test Name", "GUID", "Executor"];
    const body = rows.map(r => [
      r.tactics.join("; "),
      r.tid,
      r.tname,
      r.num,
      r.name,
      r.guid || "",
      r.executor || "",
    ]);
    exportRowsToXlsx([header, ...body], "atomic-red-team-tests.xlsx");
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" /> Export .xlsx
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
            <tr>
              <th className="w-8 px-2 py-3" />
              <th className="px-4 py-3 font-medium">Tactic</th>
              <th className="px-4 py-3 font-medium">Technique</th>
              <th className="px-4 py-3 font-medium">Technique Name</th>
              <th className="px-4 py-3 font-medium w-12">#</th>
              <th className="px-4 py-3 font-medium">Test Name</th>
              <th className="px-4 py-3 font-medium">GUID</th>
              <th className="px-4 py-3 font-medium">Executor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(r => {
              const isOpen = expanded.has(r.key);
              const cached = cache[r.tid];
              const isLoading = loading.has(r.tid);
              const test = cached?.tests?.find(x => x.num === r.num);
              return [
                <tr
                  key={r.key}
                  className="cursor-pointer align-top transition-colors hover:bg-muted/40"
                  onClick={() => toggle(r.tid, r.key)}
                >
                  <td className="px-2 py-3 text-muted-foreground">
                    <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex flex-wrap gap-1">
                      {r.tactics?.map(t => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/technique/${r.tid}`} onClick={e => e.stopPropagation()} className="font-mono text-xs font-semibold text-primary hover:underline">
                      {r.tid}
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-[16rem]">
                    <span className="block truncate text-xs text-foreground/80" title={r.tname}>{r.tname}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.num}</td>
                  <td className="px-4 py-3 max-w-[18rem]">
                    <span className="block truncate text-xs text-foreground/80" title={r.name}>{r.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.guid ? (
                      <span className="font-mono text-[11px] text-muted-foreground">{r.guid}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.executor && (
                      <span className="inline-flex items-center rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                        {r.executor}
                      </span>
                    )}
                  </td>
                </tr>,
                isOpen && (
                  <tr key={`${r.key}-detail`}>
                    <td colSpan={8} className="bg-muted/20 px-4 py-4">
                      {isLoading && (
                        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading test details…
                        </div>
                      )}
                      {!isLoading && cached?.error && (
                        <p className="py-4 text-sm text-destructive">Could not load test details for {r.tid}.</p>
                      )}
                      {!isLoading && cached?.ready && cached?.attackDescription && (
                        <TechniqueContext
                          id={r.tid}
                          title={cached.title}
                          attackDescription={cached.attackDescription}
                          sourceUrl={cached.sourceUrl}
                        />
                      )}
                      {!isLoading && cached?.ready && test && <AtomicTestCard test={test} />}
                      {!isLoading && cached?.ready && !test && (
                        <p className="py-4 text-sm text-muted-foreground">No detailed content available for this test.</p>
                      )}
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}