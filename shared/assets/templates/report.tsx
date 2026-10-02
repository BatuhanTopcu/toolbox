import { ReportSection } from "@/report";
import { Card, CardContent } from "@/components/ui/card";

export default function Report() {
  return <>
    <ReportSection id="summary" title="Summary"><Card><CardContent><p>{"{{SUMMARY}}"}</p></CardContent></Card></ReportSection>
    <ReportSection id="context" title="Context"><p>{"{{CONTEXT}}"}</p></ReportSection>
    <ReportSection id="findings" title="Walkthrough and findings"><p>{"{{FINDINGS}}"}</p></ReportSection>
    <ReportSection id="direction" title="What this means"><p>{"{{DIRECTION}}"}</p></ReportSection>
    <ReportSection id="limits" title="Limits and caveats"><p>{"{{LIMITS}}"}</p></ReportSection>
    <ReportSection id="sources" title="Sources"><ul><li>{"{{SOURCES}}"}</li></ul></ReportSection>
  </>;
}
