/**
 * Glossary Component
 *
 * Displays a list of all terms with their definitions
 * Loads glossary data from JSON or uses pre-loaded data from pageData
 */

import { useState, useEffect, useMemo } from 'react';
import type { TermMetadata } from '../types';
import { sanitizeHTML } from './sanitize';

// usePageData will be available at runtime from rspress
declare const usePageData: () => { page: any };

/**
 * Single glossary entry
 */
function GlossaryItem({
  path,
  metadata
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
  const [glossaryData, setGlossaryData] = useState<Record<string, TermMetadata> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { page } = (globalThis as any).usePageData ? (globalThis as any).usePageData() : { page: {} };

  // Try to get glossary from page data first
  const preloadedGlossary = useMemo(() => {
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
        if (typeof window !== 'undefined' && (window as any)._cachedGlossary) {
          setGlossaryData((window as any)._cachedGlossary);
          setLoading(false);
          return;
        }

        const response = await fetch('/docs/glossary.json');
        if (!response.ok) {
          throw new Error(`Failed to load glossary: ${response.statusText}`);
        }

        const data = await response.json();
        setGlossaryData(data);

        // Cache for future requests
        if (typeof window !== 'undefined') {
          (window as any)._cachedGlossary = data;
        }
      } catch (err) {
        console.error('[rspress-terminology] Error loading glossary:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
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
    return <div className="glossary-error">Error loading glossary: {error}</div>;
  }

  if (!glossaryData || Object.keys(glossaryData).length === 0) {
    return <div className="glossary-empty">No terms found.</div>;
  }

  // Sort terms alphabetically by title
  const sortedTerms = Object.entries(glossaryData).sort((a, b) =>
    a[1].title.localeCompare(b[1].title)
  );

  return (
    <div className="glossary-container">
      <h2>Glossary</h2>
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
