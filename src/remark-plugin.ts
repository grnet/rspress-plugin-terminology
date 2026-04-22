/**
 * Remark Plugin - Transforms [term](path) links to <Term> components
 */

import type { Root } from "mdast";
import type { Processor } from "unified";
import { visit } from "unist-util-visit";
import type { RemarkPluginOptions, TermMetadata } from "./types";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function findTermInIndex(
  url: string,
  termIndex: Map<string, TermMetadata>,
): { key: string; metadata: TermMetadata } | null {
  // Remove .md, .mdx, or .html extensions for matching
  const normalizedUrl = url.replace(/\.(md|mdx|html)$/, "");

  const possibleKeys = [
    normalizedUrl,
    normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`,
    normalizedUrl.startsWith("/") ? normalizedUrl.slice(1) : normalizedUrl,
  ];

  for (const key of possibleKeys) {
    if (termIndex.has(key)) {
      return { key, metadata: termIndex.get(key)! };
    }
  }

  for (const [indexKey, metadata] of termIndex.entries()) {
    const filePath = normalizePath(metadata.filePath);
    const routePath = normalizePath(metadata.routePath.replace(/^\/+/, ""));

    if (
      normalizedUrl === filePath ||
      normalizedUrl === routePath ||
      `/${normalizedUrl}` === routePath ||
      normalizedUrl === routePath
    ) {
      return { key: indexKey, metadata };
    }
  }

  return null;
}

export function terminologyRemarkPlugin(
  options: RemarkPluginOptions,
): (this: Processor, tree: Root) => void {
  return function transformer(this: Processor, tree: Root) {
    const { termIndex } = options;

    console.log(
      "[remark-plugin] Processing markdown, termIndex size:",
      termIndex.size,
    );

    visit(tree, "link", (node: any) => {
      const url = node.url;

      console.log("[remark-plugin] Found link:", url);

      // Check if it's a term link (either .md/.mdx extension OR in terms directory)
      // Matches: ./terms/api-key, terms/api-key, /terms/api-key, ./terms/api-key.md, etc.
      const isTermLink =
        /\.(md|mdx)$/.test(url) || /(^\.\/|^\/)?terms\/[^/]+$/.test(url);

      if (!url || !isTermLink) {
        return;
      }

      const match = findTermInIndex(url, termIndex);

      if (!match) {
        console.log("[remark-plugin] No match found for:", url);
        return;
      }

      const routePath = match.metadata.routePath;

      console.log(
        "[remark-plugin] Transforming link to Term component:",
        url,
        "->",
        routePath,
      );

      // Build attributes, starting with pathName
      const attributes = [
        {
          type: "mdxJsxAttribute",
          name: "pathName",
          value: routePath,
        },
      ];

      // Check for data-placement attribute in the original link node
      if (node.data && node.data.dataPlacement) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: "placement",
          value: node.data.dataPlacement,
        });
        console.log(
          "[remark-plugin] Found placement:",
          node.data.dataPlacement,
        );
      }

      node.type = "mdxJsxFlowElement";
      node.name = "Term";
      node.attributes = attributes;
    });
  };
}

export function isTermLink(url: string, termsDir: string): boolean {
  const normalizedTermsDir = normalizePath(termsDir).replace(/^\./, "");
  // Check if URL is in terms directory (with or without .md/.mdx extension)
  return url.includes(normalizedTermsDir);
}

export function extractTermPath(url: string): string {
  return url.replace(/\.(md|mdx)$/, "").replace(/^\.\//, "");
}
