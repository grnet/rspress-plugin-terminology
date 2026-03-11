/**
 * Build-time utilities for rspress-terminology plugin
 * This module ONLY runs server-side during the build process
 * All Node.js built-in module imports are isolated here
 */

import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import remarkHTML from 'remark-html';
import { TermMetadata, TerminologyPluginOptions } from './types';
import { createDebugLogger } from './debug';

/**
 * Simple frontmatter parser (minimal implementation)
 */
export function parseMarkdown(content: string): { metadata: Record<string, string>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const frontmatter = match[1];
  const body = match[2];

  const metadata: Record<string, string> = {};
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      metadata[key] = value;
    }
  });

  return {
    metadata,
    content: body.trim()
  };
}

/**
 * Process hoverText through remark to convert markdown to HTML
 */
export async function processHoverText(hoverText: string): Promise<string> {
  if (!hoverText) return '';

  try {
    const result = await remark()
      .use(remarkHTML, { sanitize: true })
      .process(hoverText);
    return String(result);
  } catch (error) {
    console.warn('Failed to process hoverText:', error);
    return hoverText;
  }
}

/**
 * Normalize file path for cross-platform compatibility
 * Browser-safe - doesn't use Node.js modules
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Ensure directory exists, create if not
 */
export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write JSON file safely
 */
export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Read all markdown files from a directory
 */
export function getMarkdownFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath)
    .filter(file => /\.(md|mdx)$/.test(file))
    .map(file => path.join(dirPath, file));
}

/**
 * Build an index of all terms from the terms directory
 */
export async function buildTermIndex(
  options: TerminologyPluginOptions
): Promise<Map<string, TermMetadata>> {
  const debug = createDebugLogger('build:index');
  const termIndex = new Map<string, TermMetadata>();
  const termsPath = path.resolve(process.cwd(), options.termsDir);
  const docsDir = path.resolve(process.cwd(), options.docsDir);
  const basePath = options.basePath || '';

  debug(`Scanning terms in: ${termsPath}`);
  debug(`Docs directory: ${docsDir}`);
  debug(`Base path: ${basePath || '(none)'}`);

  if (!fs.existsSync(termsPath)) {
    debug.warn(`Terms directory not found: ${termsPath}`);
    return termIndex;
  }

  const termFiles = getMarkdownFiles(termsPath);

  for (const filePath of termFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { metadata, content: body } = parseMarkdown(content);

      if (!metadata.id || !metadata.title) {
        debug.warn(`Skipping ${path.basename(filePath)}: missing id or title`);
        continue;
      }

      const hoverTextHtml = await processHoverText(metadata.hoverText || '');
      const relativeToDocs = path.relative(docsDir, filePath);
      const termPath = normalizePath(relativeToDocs).replace(/\.(md|mdx)$/, '');
      const fullTermPath = `${basePath}/${termPath}`;

      const termMetadata: TermMetadata = {
        id: metadata.id,
        title: metadata.title,
        hoverText: hoverTextHtml,
        content: body,
        filePath: relativeToDocs,
        routePath: fullTermPath
      };

      termIndex.set(fullTermPath, termMetadata);
      debug(`Indexed term: ${metadata.id} -> ${fullTermPath}`);
    } catch (error) {
      debug.error(`Error processing ${filePath}:`, error);
    }
  }

  debug(`Indexed ${termIndex.size} terms`);
  return termIndex;
}

/**
 * Generate glossary.json file containing all terms
 */
export function generateGlossaryJson(
  termIndex: Map<string, TermMetadata>,
  docsDir: string
): void {
  const debug = createDebugLogger('build:glossary');
  const glossaryPath = path.join(process.cwd(), docsDir, 'glossary.json');
  const glossaryData = Object.fromEntries(termIndex);

  writeJsonFile(glossaryPath, glossaryData);
  debug(`Generated glossary.json: ${glossaryPath}`);
}

/**
 * Inject Glossary component into glossary.md file
 */
export function injectGlossaryComponent(
  glossaryFilepath: string,
  hasCustomComponent: boolean
): void {
  const debug = createDebugLogger('build:inject');
  const fullPath = path.resolve(process.cwd(), glossaryFilepath);

  if (!fs.existsSync(fullPath)) {
    debug.warn(`Glossary file not found: ${fullPath}`);
    return;
  }

  if (hasCustomComponent) {
    debug('Using custom glossary component');
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const glossaryComponentMarker = '<Glossary />';

  if (!content.includes(glossaryComponentMarker)) {
    const updatedContent = content.trimEnd() + '\n\n' + glossaryComponentMarker + '\n';
    fs.writeFileSync(fullPath, updatedContent, 'utf-8');
    debug(`Injected Glossary component into: ${fullPath}`);
  }
}

/**
 * Copy all term JSON files to the output directory
 */
export function copyTermJsonFiles(
  termIndex: Map<string, TermMetadata>
): void {
  const debug = createDebugLogger('build:copy');
  const tempDir = path.join(process.cwd(), '.rspress', 'terminology');

  for (const [termPath, metadata] of termIndex.entries()) {
    const jsonPath = path.join(tempDir, `${termPath.replace(/^\//, '')}.json`);
    const jsonDir = path.dirname(jsonPath);

    ensureDirectory(jsonDir);
    writeJsonFile(jsonPath, metadata);
  }

  debug(`Generated ${termIndex.size} term JSON files in: ${tempDir}`);
}
