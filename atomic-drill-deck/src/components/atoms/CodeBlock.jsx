import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CodeBlock({ code = "", language = "", className }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className={cn("group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950", className)}>
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          {language || "shell"}
        </span>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            copied ? "text-emerald-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          )}
          aria-label="Copy command"
        >
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-zinc-200 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}