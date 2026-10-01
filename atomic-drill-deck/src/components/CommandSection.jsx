import CodeBlock from "@/components/atoms/CodeBlock";
import { ShieldAlert, Terminal } from "lucide-react";

export default function CommandSection({ title, code, language, executor, elevation }) {
  if (!code) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        {executor && (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
            <Terminal className="h-3 w-3" />{executor}
          </span>
        )}
        {elevation && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-3 w-3" />Elevation required
          </span>
        )}
      </div>
      <CodeBlock code={code} language={language || executor} />
    </div>
  );
}