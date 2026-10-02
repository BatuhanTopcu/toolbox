import { useEffect, useState } from "react";
import Report from "toolbox:report";
import metadata from "toolbox:metadata";

export function ReportApp() {
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const preference = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && preference.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply(); preference.addEventListener("change", apply);
    return () => preference.removeEventListener("change", apply);
  }, [theme]);
  return <>
    <a href="#report" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-4">Skip to report</a>
    <header className="mx-auto max-w-5xl px-5 pt-8 sm:px-10 sm:pt-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>Toolbox · {metadata.kind} · {metadata.depth}</span>
        <label className="flex items-center gap-2 print:hidden">Theme
          <span className="relative">
            <select aria-label="Theme" value={theme} onChange={event => setTheme(event.target.value)} className="h-10 w-28 cursor-pointer appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-9 text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </label>
      </div>
      <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">{metadata.title}</h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{metadata.intent}</p>
      <p className="mt-4 break-words text-xs leading-5 text-muted-foreground">Updated {metadata.updated_at}{metadata.repository ? ` · Revision ${metadata.repository.revision}${metadata.repository.dirty ? " (working changes)" : ""}` : ""}</p>
      <nav aria-label="Report sections" className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-b border-border pb-6 text-sm">
        {["summary", "context", "findings", "direction", "limits", "sources"].map(id => <a key={id} href={`#${id}`} className="capitalize underline-offset-4 hover:underline">{id}</a>)}
      </nav>
    </header>
    <main id="report" data-slot="reader-report" tabIndex={-1} className="mx-auto max-w-5xl px-5 pb-12 outline-none sm:px-10"><Report /></main>
    <footer className="mx-auto max-w-5xl border-t border-border px-5 py-6 text-xs text-muted-foreground sm:px-10">Self-contained report · Content and charts are rendered before JavaScript · Sources and limitations are included above.</footer>
  </>;
}
