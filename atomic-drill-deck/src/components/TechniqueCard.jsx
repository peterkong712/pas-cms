import { Link } from "react-router-dom";
import { ChevronRight, FlaskConical } from "lucide-react";

export default function TechniqueCard({ technique }) {
  return (
    <Link
      to={`/technique/${technique.id}`}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-sm font-semibold text-primary">{technique.id}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-foreground">
        {technique.name}
      </h3>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5" />
          {technique.testCount} test{technique.testCount !== 1 ? "s" : ""}
        </span>
        {technique.tactics?.[0] && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {technique.tactics[0]}
          </span>
        )}
      </div>
    </Link>
  );
}