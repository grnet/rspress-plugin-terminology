/**
 * Inject terminology data into window object
 * This script is injected into the page to provide term data to Term components
 */

export function generateInjectScript(
  terms: Record<string, any>,
  basePath?: string,
): string {
  const termsJson = JSON.stringify(terms);
  const basePathJson = JSON.stringify(basePath || "");
  return `
<script>
  (function() {
    window.__RSPRESS_TERMINOLOGY__ = {
      terms: ${termsJson},
      basePath: ${basePathJson}
    };
    console.log('[@grnet/rspress-plugin-terminology] Injected', Object.keys(window.__RSPRESS_TERMINOLOGY__.terms).length, 'terms into window');
  })();
</script>
  `.trim();
}
