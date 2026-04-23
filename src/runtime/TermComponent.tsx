/**
 * Term Component
 *
 * Renders a term link with hover tooltip showing term definition
 * Fetches term data from JSON file or uses pre-loaded data from pageData
 */

import { useEffect, useMemo, useState } from "react";
import type { TermMetadata } from "../types";
import { initTerminology } from "./init-terminology";
import { sanitizeHoverText } from "./sanitize";
import Tooltip from "./Tooltip";

// Initialize terminology data on module load
if (typeof window !== "undefined") {
  initTerminology();
}

export interface TermComponentProps {
  /** Path/URL of the term (e.g., '/docs/terms/example-term') */
  pathName: string;
  /** Link text (optional, defaults to term title) */
  children?: React.ReactNode;
  /** Tooltip placement */
  placement?: "top" | "bottom" | "left" | "right";
}

/**
 * Content displayed inside the tooltip
 */
function TooltipContent({ metadata }: { metadata: TermMetadata }) {
  if (!metadata) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="term-tooltip-content">
      <h4 className="term-title">{metadata.title}</h4>
      <div
        className="term-hover-text"
        dangerouslySetInnerHTML={{
          __html: sanitizeHoverText(metadata.hoverText),
        }}
      />
    </div>
  );
}

/**
 * Main Term component
 */
export function Term({ pathName, children, placement }: TermComponentProps) {
  const [content, setContent] = useState<TermMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to get term from window.__RSPRESS_TERMINOLOGY__ (pre-loaded)
  const preloadedTerm = useMemo(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).__RSPRESS_TERMINOLOGY__
    ) {
      const terms = (window as any).__RSPRESS_TERMINOLOGY__.terms;

      if (terms) {
        // Check both with and without leading slash
        const key1 = pathName.startsWith("/") ? pathName : `/${pathName}`;
        const key2 = pathName.startsWith("/") ? pathName.slice(1) : pathName;
        const result = terms[key1] || terms[key2];
        return result;
      }
    }
    return null;
  }, [pathName]);

  useEffect(() => {
    if (preloadedTerm) {
      setContent(preloadedTerm);
      return;
    }

    // Try to fetch from glossary.json first, then individual term JSON
    const fetchTerm = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, try to fetch from glossary.json (using a path that won't be routed)
        // Try multiple possible paths where the JSON might be served
        const base =
          typeof window !== "undefined"
            ? (window as any).__RSPRESS_TERMINOLOGY__?.basePath || ""
            : "";
        const possiblePaths = [
          `${base}/static/glossary.json`,
          `${base}/api/glossary.json`,
          `${base}/glossary.json`,
          `${base}/docs/glossary.json`,
        ];

        let termData = null;

        for (const glossaryUrl of possiblePaths) {
          try {
            const glossaryResponse = await fetch(glossaryUrl);
            if (glossaryResponse.ok) {
              const contentType = glossaryResponse.headers.get("content-type");
              // Make sure we got JSON, not HTML
              if (contentType && contentType.includes("application/json")) {
                const glossary = await glossaryResponse.json();
                // Check both with and without leading slash
                const key1 = pathName.startsWith("/")
                  ? pathName
                  : `/${pathName}`;
                const key2 = pathName.startsWith("/")
                  ? pathName.slice(1)
                  : pathName;
                termData = glossary[key1] || glossary[key2];
                if (termData) {
                  break;
                }
              }
            }
          } catch (_pathError) {}
        }

        // If not found in glossary, try individual term JSON
        if (!termData) {
          const cleanPath = pathName.replace(/\/$/, "");
          const jsonUrl = `${cleanPath}.json`;

          // Check cache first
          if (typeof window !== "undefined" && (window as any)._cachedTerms) {
            const cached = (window as any)._cachedTerms[jsonUrl];
            if (cached) {
              setContent(cached);
              setLoading(false);
              return;
            }
          }

          const response = await fetch(jsonUrl);
          if (!response.ok) {
            throw new Error(`Failed to load term: ${response.statusText}`);
          }

          termData = await response.json();

          // Cache for future requests
          if (typeof window !== "undefined") {
            if (!(window as any)._cachedTerms) {
              (window as any)._cachedTerms = {};
            }
            (window as any)._cachedTerms[jsonUrl] = termData;
          }
        }

        setContent(termData);
      } catch (err) {
        console.error(
          `[@grnet/rspress-plugin-terminology] Error loading term ${pathName}:`,
          err,
        );
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTerm();
  }, [pathName, preloadedTerm]);

  // If still loading and no preloaded data, show link without tooltip
  if (loading && !content) {
    return (
      <a href={pathName} className="term-link term-link-loading">
        {children || pathName}
      </a>
    );
  }

  // If error, show link without tooltip
  if (error) {
    console.warn(`[@grnet/rspress-plugin-terminology] ${error}`);
    return (
      <a href={pathName} className="term-link term-link-error">
        {children || pathName}
      </a>
    );
  }

  // Render link with tooltip
  return (
    <Tooltip
      overlay={content ? <TooltipContent metadata={content} /> : null}
      placement={placement}
    >
      <a href={pathName} className="term-link">
        {children || content?.title || pathName}
      </a>
    </Tooltip>
  );
}

/**
 * Declare window cache interface
 */
declare global {
  interface Window {
    _cachedTerms?: Record<string, TermMetadata>;
  }
}

// Default export for backwards compatibility
export default Term;
