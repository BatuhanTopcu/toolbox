import { prerender } from "react-dom/static";
import { ReportApp } from "./app";

let failed = false;
const { prelude, postponed } = await prerender(<ReportApp />, {
  signal: AbortSignal.timeout(8_000),
  onError(error) { failed = true; console.error(error); },
});
if (failed || postponed) throw new Error("The complete report must finish server rendering.");
await Bun.write(Bun.argv[2]!, await new Response(prelude).text());
