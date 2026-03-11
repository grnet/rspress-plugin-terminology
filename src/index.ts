/**
 * Rspress Terminology Plugin - Client-Side Exports
 *
 * This file contains only browser-safe exports.
 * For the server-side plugin with build functionality, import from './server'.
 */

export { default as GlossaryComponent } from "./runtime/GlossaryComponent";

// Export runtime components for direct use
export { default as TermComponent, Term } from "./runtime/TermComponent";
// Re-export types for client-side use
export type { TerminologyPluginOptions, TermMetadata } from "./types";
