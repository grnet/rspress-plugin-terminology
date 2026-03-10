/**
 * Inject terminology data into window object
 * This script is injected into the page to provide term data to Term components
 */

export function generateInjectScript(terms: Record<string, any>): string {
  const termsJson = JSON.stringify(terms);
  return `
<script>
  (function() {
    window.__RSPRESS_TERMINOLOGY__ = {
      terms: ${termsJson}
    };
    console.log('[rspress-terminology] Injected', Object.keys(window.__RSPRESS_TERMINOLOGY__.terms).length, 'terms into window');
  })();
<\/script>
  `.trim();
}
