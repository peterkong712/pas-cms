import CommandSection from "@/components/CommandSection";
import { parseCommandHeading } from "@/lib/atomicApi";
import { Hash, Layers, ListChecks, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PLATFORM_STYLES = {
  windows: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  linux: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  macos: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  azure_ad: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  containers: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  iaas: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  office_365: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  google_workspace: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  esxi: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

function PlatformBadge({ name }) {
  const key = (name || "").toLowerCase().replace(/[\s-]/g, "_");
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${PLATFORM_STYLES[key] || "bg-muted text-muted-foreground"}`}>
      {name}
    </span>
  );
}

export default function AtomicTestCard({ test }) {
  const attack = test.attack
    ? { ...parseCommandHeading(test.attack.raw || ""), code: test.attack.code, language: test.attack.language }
    : null;
  const cleanup = test.cleanup;

  return (
    <article
      id={`test-${test.num}`}
      className="scroll-mt-24 rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Hash className="h-3.5 w-3.5" />
            Atomic Test #{test.num}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug text-foreground sm:text-lg">
            {test.name}
          </h3>
        </div>
        <div className="flex flex-shrink-0 flex-wrap justify-end gap-1.5">
          {test.platforms?.map(p => <PlatformBadge key={p} name={p} />)}
        </div>
      </div>

      {test.description && (
        <div className="mt-4 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
          <ReactMarkdown>{test.description}</ReactMarkdown>
        </div>
      )}

      {test.inputs?.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5" /> Inputs
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {test.inputs.map((inp, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-2 font-mono text-foreground">{inp.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{inp.description}</td>
                    <td className="px-3 py-2 text-muted-foreground">{inp.type}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{inp.default}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {attack ? (
          <CommandSection
            title="Attack Commands"
            code={attack.code}
            language={attack.language || attack.executor}
            executor={attack.executor}
            elevation={attack.elevation}
          />
        ) : (
          <p className="text-xs text-muted-foreground italic">No automated attack command (manual test).</p>
        )}

        {cleanup && (
          <CommandSection
            title="Cleanup Commands"
            code={cleanup.code}
            language={cleanup.language}
          />
        )}

        {test.dependencies?.length > 0 && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Download className="h-3.5 w-3.5" /> Dependencies
            </div>
            {test.dependencies.map((dep, i) => (
              <div key={i} className="space-y-3 rounded-lg bg-muted/30 p-3">
                {dep.description && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ListChecks className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span className="whitespace-pre-line">{dep.description}</span>
                  </p>
                )}
                {dep.check && (
                  <CommandSection title="Check Prereq" code={dep.check.code} language={dep.check.language} />
                )}
                {dep.get && (
                  <CommandSection title="Get Prereq" code={dep.get.code} language={dep.get.language} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}