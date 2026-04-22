/**
 * Build-time utilities for rspress-terminology plugin
 * This module ONLY runs server-side during the build process
 * NOT included in client bundles
 */

import fs from "fs";
import path from "path";
import { remark } from "remark";
import remarkHTML from "remark-html";
import type { TerminologyPluginOptions, TermMetadata } from "./types";

export function parseMarkdown(content: string): {
  metadata: Record<string, string>;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const frontmatter = match[1];
  const body = match[2];

  const metadata: Record<string, string> = {};
  frontmatter.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      metadata[key] = value;
    }
  });

  return {
    metadata,
    content: body.trim(),
  };
}

export async function processHoverText(hoverText: string): Promise<string> {
  if (!hoverText) return "";

  try {
    const result = await remark()
      .use(remarkHTML, { sanitize: true })
      .process(hoverText);
    return String(result);
  } catch (error) {
    console.warn("Failed to process hoverText:", error);
    return hoverText;
  }
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function getMarkdownFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((file) => /\.(md|mdx)$/.test(file))
    .map((file) => path.join(dirPath, file));
}

export async function buildTermIndex(
  options: TerminologyPluginOptions,
): Promise<Map<string, TermMetadata>> {
  const termIndex = new Map<string, TermMetadata>();
  const termsPath = path.resolve(process.cwd(), options.termsDir);
  const docsDir = path.resolve(process.cwd(), options.docsDir);
  const basePath = options.basePath || "";

  console.log(`[rspress-terminology] Scanning terms in: ${termsPath}`);
  console.log(`[rspress-terminology] Docs directory: ${docsDir}`);
  console.log(`[rspress-terminology] Base path: ${basePath || "(none)"}`);

  if (!fs.existsSync(termsPath)) {
    console.warn(
      `[rspress-terminology] Terms directory not found: ${termsPath}`,
    );
    return termIndex;
  }

  const termFiles = getMarkdownFiles(termsPath);

  for (const filePath of termFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const { metadata, content: body } = parseMarkdown(content);

      if (!metadata.id || !metadata.title) {
        console.warn(
          `[rspress-terminology] Skipping ${path.basename(filePath)}: missing id or title`,
        );
        continue;
      }

      const hoverTextHtml = await processHoverText(metadata.hoverText || "");
      const relativeToDocs = path.relative(docsDir, filePath);
      const termPath = normalizePath(relativeToDocs).replace(/\.(md|mdx)$/, "");
      const fullTermPath = `${basePath}/${termPath}`;

      const termMetadata: TermMetadata = {
        id: metadata.id,
        title: metadata.title,
        hoverText: hoverTextHtml,
        content: body,
        filePath: relativeToDocs,
        routePath: fullTermPath,
      };

      termIndex.set(fullTermPath, termMetadata);
      console.log(
        `[rspress-terminology] Indexed term: ${metadata.id} -> ${fullTermPath}`,
      );
    } catch (error) {
      console.error(
        `[rspress-terminology] Error processing ${filePath}:`,
        error,
      );
    }
  }

  console.log(`[rspress-terminology] Indexed ${termIndex.size} terms`);
  return termIndex;
}

export function generateGlossaryJson(
  termIndex: Map<string, TermMetadata>,
  docsDir: string,
): void {
  const glossaryPath = path.join(process.cwd(), docsDir, "glossary.json");
  const glossaryData = Object.fromEntries(termIndex);

  writeJsonFile(glossaryPath, glossaryData);
  console.log(`[rspress-terminology] Generated glossary.json: ${glossaryPath}`);
}

export function injectGlossaryComponent(
  glossaryFilepath: string,
  hasCustomComponent: boolean,
): void {
  const fullPath = path.resolve(process.cwd(), glossaryFilepath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`[rspress-terminology] Glossary file not found: ${fullPath}`);
    return;
  }

  if (hasCustomComponent) {
    console.log("[rspress-terminology] Using custom glossary component");
    return;
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const glossaryComponentMarker = "<Glossary />";

  if (!content.includes(glossaryComponentMarker)) {
    const updatedContent =
      content.trimEnd() + "\n\n" + glossaryComponentMarker + "\n";
    fs.writeFileSync(fullPath, updatedContent, "utf-8");
    console.log(
      `[rspress-terminology] Injected Glossary component into: ${fullPath}`,
    );
  }
}

export function copyTermJsonFiles(termIndex: Map<string, TermMetadata>): void {
  const tempDir = path.join(process.cwd(), ".rspress", "terminology");

  for (const [termPath, metadata] of termIndex.entries()) {
    const jsonPath = path.join(tempDir, `${termPath.replace(/^\//, "")}.json`);
    const jsonDir = path.dirname(jsonPath);

    ensureDirectory(jsonDir);
    writeJsonFile(jsonPath, metadata);
  }

  console.log(
    `[rspress-terminology] Generated ${termIndex.size} term JSON files in: ${tempDir}`,
  );
}
