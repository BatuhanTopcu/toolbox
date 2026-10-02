import { parse } from "@babel/parser";

const packages = new Set(["react", "recharts"]);
const local = new Set(["@/report", "@/lib/utils", "@/components/ui/card", "@/components/ui/chart", "@/components/ui/table"]);

// Parse before compilation: import attributes can execute Bun macros.
export function validateSource(source: string) {
  const ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"], createImportExpressions: true });
  if (!ast.program.body.some(node => node.type === "ExportDefaultDeclaration")) throw new Error("Export a default React report component.");
  if (ast.comments?.some(comment => /@jsx\w*\b/.test(comment.value))) throw new Error("Use the supplied React JSX runtime.");
  function visit(value: unknown): void {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const node = value as Record<string, any>;
    if (node.type === "ImportDeclaration") {
      if (node.attributes?.length || node.assertions?.length || node.phase) throw new Error("Import attributes/macros are unsupported.");
      if (!packages.has(node.source.value) && !local.has(node.source.value)) throw new Error(`Unsupported report import: ${node.source.value}`);
    }
    if (node.type === "ImportExpression" || node.type === "TSImportEqualsDeclaration" ||
        ((node.type === "CallExpression" || node.type === "OptionalCallExpression") && node.callee?.name === "require") ||
        node.type === "ExportAllDeclaration" || (node.type === "ExportNamedDeclaration" && node.source)) {
      throw new Error("Keep the report in one TSX file with static supported imports.");
    }
    for (const [key, child] of Object.entries(node)) if (!["loc", "comments", "tokens"].includes(key)) visit(child);
  }
  visit(ast.program);
}
