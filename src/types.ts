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
}

export interface RemarkPluginOptions {
  options: TerminologyPluginOptions;
  termIndex: Map<string, TermMetadata>;
}
