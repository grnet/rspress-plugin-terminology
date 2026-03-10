/**
 * Rspress Terminology Plugin - Client-Side Exports
 *
 * This file contains only browser-safe exports.
 * For the server-side plugin with build functionality, import from './server'.
 */

// Re-export types for client-side use
export type { TermMetadata, TerminologyPluginOptions } from './types';

// Export runtime components for direct use
export { default as TermComponent, Term } from './runtime/TermComponent';
export { default as GlossaryComponent } from './runtime/GlossaryComponent';
