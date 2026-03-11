/**
 * Type definitions for rspress-terminology plugin
 */

export interface TermMetadata {
  id: string;
  title: string;
  hoverText: string;
  content: string;
  filePath: string;
  routePath: string;
}

export interface TerminologyPluginOptions {
  termsDir: string;
  docsDir: string;
  glossaryFilepath: string;
  basePath?: string;
  termPreviewComponentPath?: string;
  glossaryComponentPath?: string;
  /** Debug logging configuration */
  debug?: boolean | {
    /** Enable debug logging (default: false) */
    enabled?: boolean;
    /** Include timestamps in debug output (default: false) */
    timestamps?: boolean;
    /** Specific namespace patterns to enable (e.g., ['build:*', 'inject']) */
    namespaces?: string[];
  };
}

export interface RemarkPluginOptions {
  options: TerminologyPluginOptions;
  termIndex: Map<string, TermMetadata>;
}
