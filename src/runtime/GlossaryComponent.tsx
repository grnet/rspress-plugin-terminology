/**
 * Glossary Component
 *
 * Displays a list of all terms with their definitions
 * Loads glossary data from JSON or uses pre-loaded data from pageData
 */

import { useEffect, useMemo, useState } from "react";
import type { TermMetadata } from "../types";
import { sanitizeHTML } from "./sanitize";

// usePageData will be available at runtime from rspress
declare const usePageData: () => { page: any };

/**
 * Single glossary entry
 */
function GlossaryItem({
  path,
  metadata,
}: {
  path: string;
  metadata: TermMetadata;
}) {
  return (
    <div className="glossary-item">
      <h3 className="glossary-term">
        <a href={path}>{metadata.title}</a>
      </h3>
      <div
        className="glossary-definition"
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(metadata.hoverText) }}
      />
    </div>
  );
}

/**
 * Main Glossary component
 */
export default function GlossaryComponent() {
  const [glossaryData, setGlossaryData] = useState<Record<
    string,
    TermMetadata
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get page data safely - usePageData may not be available in all contexts
  // We need to access it conditionally, so we'll use a try-catch approach
  let page = {};
  try {
    if ((globalThis as any).usePageData) {
      // @ts-ignore - usePageData is available at runtime from rspress
      const pageData = (globalThis as any).usePageData();
      page = pageData?.page || {};
    }
  } catch {
    // usePageData not available, use empty page object
  }

  // Try to get glossary from multiple sources
  const preloadedGlossary = useMemo(() => {
    // 1. Check injected window data (from afterBuild hook)
    if (
      typeof window !== "undefined" &&
      (window as any).__RSPRESS_TERMINOLOGY__?.terms
    ) {
      return (window as any).__RSPRESS_TERMINOLOGY__.terms;
    }
    // 2. Check page data
    const terms = (page as any).terminology?.terms;
    return terms || null;
  }, [page]);

  useEffect(() => {
    if (preloadedGlossary) {
      setGlossaryData(preloadedGlossary);
      setLoading(false);
      return;
    }

    // Fetch glossary.json
    const fetchGlossary = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        if (typeof window !== "undefined" && (window as any)._cachedGlossary) {
          setGlossaryData((window as any)._cachedGlossary);
          setLoading(false);
          return;
        }

        // Try multiple paths for the glossary.json file
        // Order: static path (production), docs path (dev), fallback
        const base =
          typeof window !== "undefined"
            ? (window as any).__RSPRESS_TERMINOLOGY__?.basePath || ""
            : "";
        const possiblePaths = [
          `${base}/static/glossary.json`,
          `${base}/docs/glossary.json`,
          `${base}/glossary.json`,
        ];

        let data: Record<string, TermMetadata> | null = null;
        let lastError: Error | null = null;

        for (const path of possiblePaths) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              const contentType = response.headers.get("content-type");
              // Make sure we're getting JSON, not HTML
              if (contentType && contentType.includes("application/json")) {
                data = await response.json();
                break;
              }
            }
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            // Continue to next path
          }
        }

        if (data) {
          setGlossaryData(data);
          // Cache for future requests
          if (typeof window !== "undefined") {
            (window as any)._cachedGlossary = data;
          }
        } else {
          throw (
            lastError || new Error("Failed to load glossary from all paths")
          );
        }
      } catch (err) {
        console.error(
          "[@grnet/rspress-plugin-terminology] Error loading glossary:",
          err,
        );
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchGlossary();
  }, [preloadedGlossary]);

  if (loading) {
    return <div className="glossary-loading">Loading glossary...</div>;
  }

  if (error) {
    return (
      <div className="glossary-error">Error loading glossary: {error}</div>
    );
  }

  if (!glossaryData || Object.keys(glossaryData).length === 0) {
    return <div className="glossary-empty">No terms found.</div>;
  }

  // Sort terms alphabetically by title
  const sortedTerms = Object.entries(glossaryData).sort((a, b) =>
    a[1].title.localeCompare(b[1].title),
  );

  return (
    <div className="glossary-container">
      <div className="glossary-list">
        {sortedTerms.map(([path, metadata]) => (
          <GlossaryItem key={path} path={path} metadata={metadata} />
        ))}
      </div>
    </div>
  );
}

/**
 * Declare window cache interface
 */
declare global {
  interface Window {
    _cachedGlossary?: Record<string, TermMetadata>;
  }
}
