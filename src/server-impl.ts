/**
 * Server-side Rspress Terminology Plugin
 * This module ONLY runs on the server during build
 * All Node.js built-in modules are lazily imported
 */

import type { RspressPlugin } from "@rspress/core";
import { generateInjectScript } from "./runtime/inject-terminology";
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
 * Find all HTML files in a directory recursively
 */
async function findAllHtmlFiles(dirPath: string): Promise<string[]> {
  const fs = await getFs();
  const path = await getPath();
  const htmlFiles: string[] = [];

  function traverseDir(currentPath: string) {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        traverseDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        htmlFiles.push(fullPath);
      }
    }
  }

  traverseDir(dirPath);
  return htmlFiles;
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

let sharedTermIndex: Map<string, any> = new Map();

function getRuntimeDir() {
  const baseDir = typeof __dirname !== "undefined" ? __dirname : "/dist";
  return `${baseDir}/runtime`;
}

/**
 * Dynamic import of remark plugin at runtime (avoids bundling into client)
 */
async function getRemarkPlugin() {
  const { terminologyRemarkPlugin } = await import("./remark-plugin");
  return terminologyRemarkPlugin;
}

/**
 * Rspress Terminology Plugin (Server-Side)
 *
 * This plugin MUST be imported only in server-side code (rspress.config.ts)
 * It will NOT work in client-side code due to Node.js dependencies
 */
export function terminologyPlugin(
  options: TerminologyPluginOptions,
): RspressPlugin {
  if (!options.termsDir || !options.docsDir || !options.glossaryFilepath) {
    throw new Error(
      "[rspress-terminology] Missing required options: termsDir, docsDir, and glossaryFilepath are required",
    );
  }

  const hasCustomGlossaryComponent = !!options.glossaryComponentPath;
  const runtimeDir = getRuntimeDir();

  console.log("[rspress-terminology] Plugin loaded with options:", {
    termsDir: options.termsDir,
    docsDir: options.docsDir,
    glossaryFilepath: options.glossaryFilepath,
  });

  const plugin: RspressPlugin = {
    name: "rspress-terminology",

    async beforeBuild() {
      console.log("[rspress-terminology] Starting term indexing...");

      try {
        // Validate Node.js environment
        if (typeof process === "undefined" || !process.versions?.node) {
          throw new Error(
            "[rspress-terminology] Plugin must run in Node.js environment",
          );
        }

        // Build term index
        sharedTermIndex = await buildTermIndex(options);
        await generateGlossaryJson(sharedTermIndex, options.docsDir);
        // Note: copyTermJsonFiles moved to afterBuild to avoid Rspress cleaning the output directory
        await injectGlossaryComponent(
          options.glossaryFilepath,
          hasCustomGlossaryComponent,
        );

        console.log("[rspress-terminology] Term indexing complete!");
      } catch (error) {
        console.error("[rspress-terminology] Error during build:", error);
        throw error;
      }
    },

    extendPageData(pageData) {
      (pageData as any).terminology = {
        terms: Object.fromEntries(sharedTermIndex),
        termsDir: options.termsDir,
        docsDir: options.docsDir,
      };
    },

    async afterBuild(_config: any, _isProd: boolean) {
      console.log("[rspress-terminology] Post-build tasks...");

      try {
        // Copy glossary.json to static directory after Rspress has finished building
        await copyTermJsonFiles(sharedTermIndex);

        const fs = await getFs();
        const path = await getPath();

        // Generate the injection script
        const injectScript = generateInjectScript(
          Object.fromEntries(sharedTermIndex),
        );

        // Find all HTML files in the output directory
        const outDir = path.join(process.cwd(), "doc_build");
        const htmlFiles = await findAllHtmlFiles(outDir);

        // Inject script into each HTML file
        for (const htmlFile of htmlFiles) {
          let content = fs.readFileSync(htmlFile, "utf-8");

          // Only inject if not already present
          if (!content.includes("__RSPRESS_TERMINOLOGY__")) {
            // Insert script after <head> tag
            content = content.replace("<head>", `<head>${injectScript}`);
            fs.writeFileSync(htmlFile, content, "utf-8");
            console.log(
              `[rspress-terminology] Injected script into: ${path.relative(outDir, htmlFile)}`,
            );
          }
        }

        console.log(
          `[rspress-terminology] Injected terminology script into ${htmlFiles.length} HTML files`,
        );
      } catch (error) {
        console.error("[rspress-terminology] Error in afterBuild:", error);
        // Don't throw - this is not critical
      }
    },

    markdown: {
      ...({
        mdxRs: false,
      } as any),

      remarkPlugins: [
        [
          async () => {
            const plugin = await getRemarkPlugin();
            return plugin({
              options,
              termIndex: sharedTermIndex,
            });
          },
          {
            options,
            termIndex: sharedTermIndex,
          },
        ],
      ],

      globalComponents: [
        options.termPreviewComponentPath || `${runtimeDir}/Term.js`,
        // Use Glossary.js wrapper so that the component name matches <Glossary /> in MDX
        // Rspress derives component name from filename: Glossary.js -> <Glossary />
        options.glossaryComponentPath || `${runtimeDir}/Glossary.js`,
      ],
    },
  };

  console.log("[rspress-terminology] Plugin created, checking hooks:", {
    hasBeforeBuild: typeof plugin.beforeBuild,
    hasAfterBuild: typeof plugin.afterBuild,
    hasExtendPageData: typeof plugin.extendPageData,
  });

  return plugin;
}

export default terminologyPlugin;

/**
 * Get the shared term index (for external access)
 */
export function getSharedIndex(): Map<string, any> {
  return sharedTermIndex;
}

// Re-export types for TypeScript users
export type { TerminologyPluginOptions, TermMetadata } from "./types";
/**
 * Create server plugin (alias for terminologyPlugin)
 */
export { terminologyPlugin as createServerPlugin };
