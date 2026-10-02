import type { ReactNode } from "react";
import type { SECTION_IDS } from "./contract";

export function ReportSection({ id, title, children }: { id: typeof SECTION_IDS[number]; title: string; children: ReactNode }) {
  return <section id={id} data-report-section className="scroll-mt-8 border-t border-border py-8 first:border-t-0">
    <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>
    <div data-slot="section-content" className="report-content space-y-4 leading-7 text-foreground/90">{children}</div>
  </section>;
}
