/**
 * Server-side Rspress Terminology Plugin
 * This module ONLY runs on the server during build
 * All Node.js built-in modules are lazily imported
 */

import type { TerminologyPluginOptions } from "./types";

/**
 * Lazy import helpers for Node.js modules
 * These are only called during the build process, never in the browser
 */
async function getFs() {
  return import("fs");
}

async function getPath() {
  return import("path");
}

/**
 * Simple frontmatter parser (minimal implementation)
 */
function parseMarkdown(content: string): {
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

/**
 * Process hoverText through remark to convert markdown to HTML
 */
async function processHoverText(hoverText: string): Promise<string> {
  if (!hoverText) return "";

  try {
    const { remark } = await import("remark");
    const remarkHTML = await import("remark-html");
    const result = await remark()
      .use(remarkHTML.default || remarkHTML, { sanitize: true })
      .process(hoverText);
    return String(result);
  } catch (error) {
    console.warn("Failed to process hoverText:", error);
    return hoverText;
  }
}

/**
 * Normalize file path for cross-platform compatibility
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * Ensure directory exists, create if not
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  const fs = await getFs();
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write JSON file safely
 */
async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const fs = await getFs();
  const path = await getPath();
  await ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Read all markdown files from a directory
 */
async function getMarkdownFiles(dirPath: string): Promise<string[]> {
  const fs = await getFs();
  const path = await getPath();

  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((file) => /\.(md|mdx)$/.test(file))
    .map((file) => path.join(dirPath, file));
}

/**
 * Build an index of all terms from the terms directory
 */
export async function buildTermIndex(
  options: TerminologyPluginOptions,
): Promise<Map<string, any>> {
  const termIndex = new Map<string, any>();
  const path = await getPath();
  const termsPath = path.resolve(process.cwd(), options.termsDir);
  const docsDir = path.resolve(process.cwd(), options.docsDir);
  const basePath = options.basePath || "";

  console.log(`[rspress-terminology] Scanning terms in: ${termsPath}`);
  console.log(`[rspress-terminology] Docs directory: ${docsDir}`);
  console.log(`[rspress-terminology] Base path: ${basePath || "(none)"}`);

  const fs = await getFs();
  if (!fs.existsSync(termsPath)) {
    console.warn(
      `[rspress-terminology] Terms directory not found: ${termsPath}`,
    );
    return termIndex;
  }

  const termFiles = await getMarkdownFiles(termsPath);

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

      // Safety check: ensure filePath is within docsDir to prevent problematic relative paths
      let relativeToDocs: string;
      const normalizedFilePath = path.normalize(filePath);
      const normalizedDocsDir = path.normalize(docsDir);

      if (
        normalizedFilePath.startsWith(normalizedDocsDir + path.sep) ||
        normalizedFilePath === normalizedDocsDir
      ) {
        // Normal case: file is within docsDir
        relativeToDocs = path.relative(docsDir, filePath);
      } else {
        // Edge case: file is outside docsDir, use basename only
        console.warn(
          `[rspress-terminology] Warning: ${path.basename(filePath)} is outside docsDir (${docsDir}), using basename only`,
        );
        relativeToDocs = path.basename(filePath);
      }

      const termPath = normalizePath(relativeToDocs).replace(/\.(md|mdx)$/, "");
      const fullTermPath = `${basePath}/${termPath}`;

      const termMetadata = {
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

/**
 * Generate glossary.json file containing all terms
 */
export async function generateGlossaryJson(
  termIndex: Map<string, any>,
  docsDir: string,
): Promise<void> {
  const path = await getPath();
  // docsDir is already an absolute path, so just join with filename
  const glossaryPath = path.join(docsDir, "glossary.json");
  const glossaryData = Object.fromEntries(termIndex);

  await writeJsonFile(glossaryPath, glossaryData);
  console.log(`[rspress-terminology] Generated glossary.json: ${glossaryPath}`);
}

/**
 * Copy all term JSON files to the output directory
 */
export async function copyTermJsonFiles(
  termIndex: Map<string, any>,
): Promise<void> {
  const path = await getPath();

  // Copy to .rspress/terminology (for build)
  const tempDir = path.join(process.cwd(), ".rspress", "terminology");

  // Copy to doc_build/static (for serving)
  const staticDir = path.join(process.cwd(), "doc_build", "static");

  // Create the glossary.json in static directory
  const glossaryData = Object.fromEntries(termIndex);
  await ensureDirectory(staticDir);
  await writeJsonFile(path.join(staticDir, "glossary.json"), glossaryData);
  console.log(
    `[rspress-terminology] Copied glossary.json to: ${staticDir}/glossary.json`,
  );

  // Also copy individual term JSON files to .rspress/terminology
  for (const [termPath, metadata] of termIndex.entries()) {
    const jsonPath = path.join(tempDir, `${termPath.replace(/^\//, "")}.json`);
    const jsonDir = path.dirname(jsonPath);

    await ensureDirectory(jsonDir);
    await writeJsonFile(jsonPath, metadata);
  }

  console.log(
    `[rspress-terminology] Generated ${termIndex.size} term JSON files in: ${tempDir}`,
  );
}

/**
 * Inject Glossary component into glossary.md file
 */
export async function injectGlossaryComponent(
  glossaryFilepath: string,
  hasCustomComponent: boolean,
): Promise<void> {
  const path = await getPath();
  const fs = await getFs();
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

// Re-export types for convenience
export type { TerminologyPluginOptions, TermMetadata } from "./types";

/**
 * Module-level shared state for tests that import from server-impl
 * The canonical plugin is in server.ts which uses these same utility functions
 */
let _sharedTermIndex: Map<string, any> = new Map();

/**
 * Get the shared term index (for testing)
 */
export function getSharedIndex(): Map<string, any> {
  return _sharedTermIndex;
}

/**
 * Terminology plugin re-export for backward compatibility with tests.
 * The canonical implementation lives in server.ts.
 * This thin wrapper delegates to the utility functions in this module.
 */
export function terminologyPlugin(
  options: TerminologyPluginOptions,
): import("@rspress/core").RspressPlugin {
  if (!options.termsDir || !options.docsDir || !options.glossaryFilepath) {
    throw new Error(
      "[rspress-terminology] Missing required options: termsDir, docsDir, and glossaryFilepath are required",
    );
  }

  const hasCustomGlossaryComponent = !!options.glossaryComponentPath;

  const getRuntimeDir = () => {
    const baseDir = typeof __dirname !== "undefined" ? __dirname : "/dist";
    return `${baseDir}/runtime`;
  };
  const runtimeDir = getRuntimeDir();

  const plugin: import("@rspress/core").RspressPlugin = {
    name: "rspress-terminology",

    async beforeBuild() {
      _sharedTermIndex = await buildTermIndex(options);
      await generateGlossaryJson(_sharedTermIndex, options.docsDir);
      await injectGlossaryComponent(
        options.glossaryFilepath,
        hasCustomGlossaryComponent,
      );
    },

    extendPageData(pageData: any) {
      pageData.terminology = {
        terms: Object.fromEntries(_sharedTermIndex),
        termsDir: options.termsDir,
        docsDir: options.docsDir,
      };
    },

    async afterBuild(_config: any, _isProd: boolean) {
      try {
        await copyTermJsonFiles(_sharedTermIndex);
      } catch {
        // Non-critical
      }
    },

    markdown: {
      ...({ mdxRs: false } as any),
      remarkPlugins: [],
      globalComponents: [
        options.termPreviewComponentPath || `${runtimeDir}/Term.js`,
        options.glossaryComponentPath || `${runtimeDir}/Glossary.js`,
      ],
    },
  };

  return plugin;
}
