/**
 * Client-side terminology initialization
 * This script runs in the browser to populate window.__RSPRESS_TERMINOLOGY__
 * from the page data passed by Rspress
 */

import type { TermMetadata } from "../types";

declare global {
  interface Window {
    __RSPRESS_TERMINOLOGY__?: {
      terms: Record<string, TermMetadata>;
    };
    __pageData?: any;
  }
}

/**
 * Initialize terminology data from page data
 * This is called once when the page loads
 */
export function initTerminology() {
  // Check if we already have terminology data
  if (typeof window !== "undefined" && !window.__RSPRESS_TERMINOLOGY__) {
    // Try to get terminology from page data
    // Rspress stores page data in a global variable
    try {
      // Access page data from Rspress's global storage
      const pageData = (window as any).__pageData;

      if (pageData?.page?.terminology?.terms) {
        window.__RSPRESS_TERMINOLOGY__ = {
          terms: pageData.page.terminology.terms,
        };
        console.log(
          "[@grnet/rspress-plugin-terminology] Initialized with",
          Object.keys(window.__RSPRESS_TERMINOLOGY__.terms).length,
          "terms from page data",
        );
        return;
      }
    } catch (error) {
      console.warn(
        "[@grnet/rspress-plugin-terminology] Could not access page data:",
        error,
      );
    }

    // If no page data, try fetching from glossary.json
    fetchGlossaryJson();
  }
}

/**
 * Fallback: Fetch glossary.json from server
 */
async function fetchGlossaryJson() {
  const possiblePaths = [
    "/static/glossary.json",
    "/glossary.json",
    "/api/glossary.json",
  ];

  for (const path of possiblePaths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const glossary = await response.json();
          window.__RSPRESS_TERMINOLOGY__ = { terms: glossary };
          console.log(
            "[@grnet/rspress-plugin-terminology] Loaded",
            Object.keys(glossary).length,
            "terms from",
            path,
          );
          return;
        }
      }
    } catch (_error) {}
  }

  console.warn(
    "[@grnet/rspress-plugin-terminology] Could not load glossary from any path",
  );
}

// Auto-initialize when module loads
if (typeof window !== "undefined") {
  initTerminology();
}
