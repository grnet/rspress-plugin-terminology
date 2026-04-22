/**
 * Server-side Rspress Terminology Plugin Entry Point
 *
 * This file provides a clean entry point that uses conditional loading
 * to prevent bundling Node.js modules into the client bundle.
 */

import type { RspressPlugin } from "@rspress/core";
import { configureDebug, createDebugLogger, type DebugOptions } from "./debug";
import { terminologyRemarkPlugin } from "./remark-plugin";
import type { TerminologyPluginOptions } from "./types";

/**
 * Load term index from glossary.json if it exists (synchronously)
 * This ensures the termIndex is available immediately for dev mode
 */
function loadGlossaryJsonSync(glossaryPath: string): Map<string, any> {
  const debug = createDebugLogger("plugin:load");
  try {
    // Use require for synchronous imports (only during build/init)
    const fs = require("fs");
    const path = require("path");

    // Derive JSON path from MD path (e.g., glossary.md -> glossary.json)
    let jsonPath = glossaryPath;
    if (glossaryPath.endsWith(".md")) {
      jsonPath = glossaryPath.replace(/\.md$/, ".json");
    }

    // Handle both absolute and relative paths
    let fullPath = jsonPath;
    if (!path.isAbsolute(jsonPath)) {
      // If relative, resolve from current working directory
      fullPath = path.resolve(process.cwd(), jsonPath);
    }

    debug(`Looking for glossary JSON at: ${fullPath}`);

    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      debug(`Glossary JSON file size: ${content.length} bytes`);
      const glossaryData = JSON.parse(content);
      const termIndex = new Map(Object.entries(glossaryData));
      debug(`Loaded ${termIndex.size} terms from glossary.json`);
      return termIndex;
    } else {
      debug.warn(`Glossary file not found: ${fullPath}`);
    }
  } catch (error) {
    debug.warn("Could not load glossary.json:", error);
  }
  return new Map();
}

/**
 * Terminology Plugin
 *
 * This function creates the plugin with lazy loading of Node.js dependencies
 * to prevent bundlers from including them in the client bundle.
 */
export function terminologyPlugin(
  options: TerminologyPluginOptions,
): RspressPlugin {
  // Configure debug logging from plugin options
  const debugConfig: DebugOptions =
    typeof options.debug === "boolean"
      ? { enabled: options.debug }
      : options.debug || {};
  configureDebug(debugConfig);

  const debug = createDebugLogger("plugin");
  const debugBuild = debug.extend("build");
  const debugInject = debug.extend("inject");

  debug("Plugin initialized with config:", debugConfig);

  // Validate options immediately
  if (!options.termsDir || !options.docsDir || !options.glossaryFilepath) {
    throw new Error(
      "[rspress-terminology] Missing required options: termsDir, docsDir, and glossaryFilepath are required",
    );
  }

  const hasCustomGlossaryComponent = !!options.glossaryComponentPath;

  // Get runtime directory - resolve absolute path from current file location
  const getRuntimeDir = () => {
    const path = require("path");
    const fs = require("fs");

    // Get the directory containing this file (server.js or server.ts)
    const currentDir = __dirname || path.resolve(__dirname, "../dist");

    // The runtime directory should be at currentDir/runtime
    const runtimePath = path.join(currentDir, "runtime");

    // Check if runtime directory exists in currentDir
    if (fs.existsSync(runtimePath)) {
      return runtimePath;
    }

    // Fallback: try dist/runtime
    const distRuntimePath = path.join(currentDir, "dist", "runtime");
    if (fs.existsSync(distRuntimePath)) {
      return distRuntimePath;
    }

    // Final fallback: return the runtime path anyway
    return runtimePath;
  };
  const runtimeDir = getRuntimeDir();

  // Shared term index (module-level state)
  // Try to load from glossary.json first for immediate availability in dev mode
  let sharedTermIndex = loadGlossaryJsonSync(options.glossaryFilepath);

  return {
    name: "rspress-terminology",

    async beforeBuild() {
      debugBuild("Starting term indexing...");

      try {
        // Validate Node.js environment
        if (typeof process === "undefined" || !process.versions?.node) {
          throw new Error(
            "[rspress-terminology] Plugin must run in Node.js environment",
          );
        }

        // Dynamic import to avoid bundling Node.js modules
        const impl = await import("./server-impl");

        // Build term index (rebuild to ensure fresh data)
        sharedTermIndex = await impl.buildTermIndex(options);
        await impl.generateGlossaryJson(sharedTermIndex, options.docsDir);
        // Note: copyTermJsonFiles moved to afterBuild to avoid Rspress cleaning the output directory
        await impl.injectGlossaryComponent(
          options.glossaryFilepath,
          hasCustomGlossaryComponent,
        );

        debugBuild("Term indexing complete!");
      } catch (error) {
        debugBuild("Error during build:", error);
        throw error;
      }
    },

    extendPageData(pageData) {
      const debugPage = debug.extend("page");
      debugPage("extendPageData called, termIndex size:", sharedTermIndex.size);
      (pageData as any).terminology = {
        terms: Object.fromEntries(sharedTermIndex),
        termsDir: options.termsDir,
        docsDir: options.docsDir,
      };
      debugPage(
        "set terminology keys:",
        Object.keys((pageData as any).terminology.terms || {}),
      );
    },

    async afterBuild(_config: any, _isProd: boolean) {
      debugInject("Post-build tasks...");

      try {
        // Dynamic import to avoid bundling Node.js modules
        const impl = await import("./server-impl");

        // Copy glossary.json to static directory after Rspress has finished building
        await impl.copyTermJsonFiles(sharedTermIndex);

        // Dynamic import of inject script generator
        const { generateInjectScript } = await import(
          "./runtime/inject-terminology"
        );

        // Generate the injection script
        const injectScript = generateInjectScript(
          Object.fromEntries(sharedTermIndex),
        );

        // Dynamic import of fs and path
        const fs = require("fs");
        const path = require("path");

        // Find all HTML files in the output directory
        const outDir = path.join(process.cwd(), "doc_build");

        function findAllHtmlFiles(dirPath: string): string[] {
          const htmlFiles: string[] = [];

          function traverseDir(currentPath: string) {
            if (!fs.existsSync(currentPath)) {
              return;
            }

            const entries = fs.readdirSync(currentPath, {
              withFileTypes: true,
            });

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

        const htmlFiles = findAllHtmlFiles(outDir);

        // Inject script into each HTML file
        for (const htmlFile of htmlFiles) {
          let content = fs.readFileSync(htmlFile, "utf-8");

          // Only inject if not already present
          if (!content.includes("__RSPRESS_TERMINOLOGY__")) {
            // Insert script after <head> tag
            content = content.replace("<head>", `<head>${injectScript}`);
            fs.writeFileSync(htmlFile, content, "utf-8");
            debugInject(
              `Injected script into: ${path.relative(outDir, htmlFile)}`,
            );
          }
        }

        debugInject(
          `Injected terminology script into ${htmlFiles.length} HTML files`,
        );
      } catch (error) {
        debugInject("Error in afterBuild:", error);
        // Don't throw - this is not critical
      }
    },

    markdown: {
      ...({
        mdxRs: false,
      } as any),

      remarkPlugins: [
        // Pass the plugin with configuration via closure
        [
          terminologyRemarkPlugin,
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
}

export default terminologyPlugin;

// Re-export types for TypeScript users
export type { TerminologyPluginOptions, TermMetadata } from "./types";
