import { readFile } from "node:fs/promises";
import vm from "node:vm";

const htmlFiles = [
  "index.html",
  "surfing/index.html",
];
const scriptTagRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const srcAttrRegex = /\bsrc\s*=/i;
const typeAttrRegex = /\btype\s*=\s*["']?([^"'\s>]+)/i;
const allowedTypes = new Set(["", "text/javascript", "application/javascript", "module"]);

let hasFailure = false;

for (const file of htmlFiles) {
  const content = await readFile(file, "utf8");
  let checkedCount = 0;
  let match;

  while ((match = scriptTagRegex.exec(content)) !== null) {
    const attrs = match[1] || "";
    const source = match[2] || "";
    if (srcAttrRegex.test(attrs)) continue;

    const typeMatch = attrs.match(typeAttrRegex);
    const scriptType = (typeMatch?.[1] || "").toLowerCase();
    if (!allowedTypes.has(scriptType)) continue;

    if (!source.trim()) continue;

    checkedCount += 1;

    try {
      new vm.Script(source, { filename: `${file}#inline-${checkedCount}` });
    } catch (error) {
      hasFailure = true;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[FAIL] ${file} inline script #${checkedCount}`);
      console.error(message);
    }
  }

  console.log(`[OK] ${file}: ${checkedCount} inline scripts validated`);
}

if (hasFailure) process.exit(1);
