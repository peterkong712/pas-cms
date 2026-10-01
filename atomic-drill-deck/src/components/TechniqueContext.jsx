import ReactMarkdown from "react-markdown";
import { ExternalLink, FlaskConical } from "lucide-react";

// Technique-level context (MITRE ATT&CK description + source) shown above
// an individual atomic test in the table's expanded row, so the expand is a
// complete, self-contained view of the technique and its test.
export default function TechniqueContext({ id, title, attackDescription, sourceUrl }) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-5">
      <div className="font-mono text-xs font-semibold text-primary">{id}</div>
      <h3 className="mt-1 text-base font-bold tracking-tight text-foreground sm:text-lg">
        {title}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5" />
          {attackDescription ? "MITRE ATT&CK description" : "Technique"}
        </span>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> MITRE ATT&CK
          </a>
        )}
      </div>
      {attackDescription && (
        <div className="mt-3 text-sm leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
          <ReactMarkdown>{attackDescription}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}