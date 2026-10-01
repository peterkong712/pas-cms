import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, AlertCircle, BookOpen, FlaskConical } from "lucide-react";
import { fetchTechniqueMarkdown, parseTechniqueMarkdown } from "@/lib/atomicApi";
import AtomicTestCard from "@/components/AtomicTestCard";
import ReactMarkdown from "react-markdown";

export default function TechniqueDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    fetchTechniqueMarkdown(id)
      .then(md => setData(parseTechniqueMarkdown(md)))
      .catch(e => setError(e.message || "Failed to load technique."));
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All techniques
          </Link>

          {data && (
            <>
              <div className="mt-4 font-mono text-sm font-semibold text-primary">{data.id}</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {data.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5" />
                  {data.tests.length} atomic test{data.tests.length !== 1 ? "s" : ""}
                </span>
                {data.sourceUrl && (
                  <a
                    href={data.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    MITRE ATT&CK
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="mt-3 text-sm">Loading {id}…</p>
          </div>
        )}

        {data && (
          <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
            {/* TOC */}
            {data.tests.length > 1 && (
              <aside className="mb-6 lg:mb-0 lg:sticky lg:top-4 lg:self-start">
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" /> Tests
                  </div>
                  <ol className="space-y-0.5">
                    {data.tests.map(t => (
                      <li key={t.num}>
                        <a
                          href={`#test-${t.num}`}
                          className="block truncate rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title={t.name}
                        >
                          <span className="font-mono text-primary">#{t.num}</span>{" "}
                          {t.name}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </aside>
            )}

            <div className="min-w-0 space-y-4">
              {data.attackDescription && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description from ATT&CK
                  </h2>
                  <div className="mt-2 prose-sm text-sm leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                    <ReactMarkdown>{data.attackDescription}</ReactMarkdown>
                  </div>
                </div>
              )}

              {data.tests.map(test => (
                <AtomicTestCard key={test.num} test={test} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}