/**
 * Server-side Rspress Terminology Plugin Entry Point
 *
 * This file provides a clean entry point that uses conditional loading
 * to prevent bundling Node.js modules into the client bundle.
 */

import { RspressPlugin } from '@rspress/core';
import { TerminologyPluginOptions } from './types';
import { terminologyRemarkPlugin } from './remark-plugin';

/**
 * Load term index from glossary.json if it exists (synchronously)
 * This ensures the termIndex is available immediately for dev mode
 */
function loadGlossaryJsonSync(glossaryPath: string): Map<string, any> {
  try {
    // Use require for synchronous imports (only during build/init)
    const fs = require('fs');
    const path = require('path');

    // Derive JSON path from MD path (e.g., glossary.md -> glossary.json)
    let jsonPath = glossaryPath;
    if (glossaryPath.endsWith('.md')) {
      jsonPath = glossaryPath.replace(/\.md$/, '.json');
    }

    // Handle both absolute and relative paths
    let fullPath = jsonPath;
    if (!path.isAbsolute(jsonPath)) {
      // If relative, resolve from current working directory
      fullPath = path.resolve(process.cwd(), jsonPath);
    }

    console.log(`[rspress-terminology] Looking for glossary JSON at: ${fullPath}`);

    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      console.log(`[rspress-terminology] Glossary JSON file size: ${content.length} bytes`);
      const glossaryData = JSON.parse(content);
      const termIndex = new Map(Object.entries(glossaryData));
      console.log(`[rspress-terminology] Loaded ${termIndex.size} terms from glossary.json`);
      return termIndex;
    } else {
      console.warn(`[rspress-terminology] Glossary file not found: ${fullPath}`);
    }
  } catch (error) {
    console.warn('[rspress-terminology] Could not load glossary.json:', error);
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
  options: TerminologyPluginOptions
): RspressPlugin {
  // Validate options immediately
  if (!options.termsDir || !options.docsDir || !options.glossaryFilepath) {
    throw new Error(
      '[rspress-terminology] Missing required options: termsDir, docsDir, and glossaryFilepath are required'
    );
  }

  const hasCustomGlossaryComponent = !!options.glossaryComponentPath;

  // Get runtime directory
  const getRuntimeDir = () => {
    const baseDir = typeof __dirname !== 'undefined' ? __dirname : '/dist';
    return `${baseDir}/runtime`.replace(/^\/dist\//, '/dist/');
  };
  const runtimeDir = getRuntimeDir();

  // Shared term index (module-level state)
  // Try to load from glossary.json first for immediate availability in dev mode
  let sharedTermIndex = loadGlossaryJsonSync(options.glossaryFilepath);

  return {
    name: 'rspress-terminology',

    async beforeBuild() {
      console.log('[rspress-terminology] Starting term indexing...');

      try {
        // Validate Node.js environment
        if (typeof process === 'undefined' || !process.versions?.node) {
          throw new Error('[rspress-terminology] Plugin must run in Node.js environment');
        }

        // Dynamic import to avoid bundling Node.js modules
        const impl = await import('./server-impl');

        // Build term index (rebuild to ensure fresh data)
        sharedTermIndex = await impl.buildTermIndex(options);
        await impl.generateGlossaryJson(sharedTermIndex, options.docsDir);
        await impl.copyTermJsonFiles(sharedTermIndex);
        await impl.injectGlossaryComponent(options.glossaryFilepath, hasCustomGlossaryComponent);

        console.log('[rspress-terminology] Term indexing complete!');
      } catch (error) {
        console.error('[rspress-terminology] Error during build:', error);
        throw error;
      }
    },

    extendPageData(pageData) {
      console.log('[rspress-terminology] extendPageData called, termIndex size:', sharedTermIndex.size);
      (pageData as any).terminology = {
        terms: Object.fromEntries(sharedTermIndex),
        termsDir: options.termsDir,
        docsDir: options.docsDir
      };
      console.log('[rspress-terminology] extendPageData: set terminology keys:', Object.keys((pageData as any).terminology.terms || {}));
    },

    async afterBuild() {
      console.log('[rspress-terminology] Injecting terminology data into HTML files...');

      try {
        // Dynamic import to avoid bundling Node.js modules
        const { generateInjectScript } = await import('./runtime/inject-terminology');

        // Generate the injection script
        const injectScript = generateInjectScript(Object.fromEntries(sharedTermIndex));

        // Dynamic import of fs and path
        const fs = require('fs');
        const path = require('path');

        // Find all HTML files in the output directory
        const outDir = path.join(process.cwd(), 'doc_build');

        function findAllHtmlFiles(dirPath: string): string[] {
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
              } else if (entry.isFile() && entry.name.endsWith('.html')) {
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
          let content = fs.readFileSync(htmlFile, 'utf-8');

          // Only inject if not already present
          if (!content.includes('__RSPRESS_TERMINOLOGY__')) {
            // Insert script after <head> tag
            content = content.replace('<head>', `<head>${injectScript}`);
            fs.writeFileSync(htmlFile, content, 'utf-8');
            console.log(`[rspress-terminology] Injected script into: ${path.relative(outDir, htmlFile)}`);
          }
        }

        console.log(`[rspress-terminology] Injected terminology script into ${htmlFiles.length} HTML files`);
      } catch (error) {
        console.error('[rspress-terminology] Error injecting script:', error);
        // Don't throw - this is not critical
      }
    },

    markdown: {
      ...(({
        mdxRs: false,
      } as any)),

      remarkPlugins: [
        // Pass the plugin with configuration via closure
        [
          terminologyRemarkPlugin,
          {
            options,
            termIndex: sharedTermIndex
          }
        ]
      ],

      globalComponents: [
        options.termPreviewComponentPath || `${runtimeDir}/Term.js`,
        options.glossaryComponentPath || `${runtimeDir}/GlossaryComponent.js`
      ]
    }
  };
}

export default terminologyPlugin;

// Re-export types for TypeScript users
export type { TermMetadata, TerminologyPluginOptions } from './types';
