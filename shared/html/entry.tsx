import { hydrateRoot } from "react-dom/client";
import { ReportApp } from "./app";

hydrateRoot(document.getElementById("root")!, <ReportApp />);
