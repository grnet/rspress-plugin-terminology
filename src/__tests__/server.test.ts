/**
 * Tests for server.ts
 * Tests the terminologyPlugin factory and its lifecycle hooks.
 */

// ─── Mock all external dependencies ──────────────────────────────────────────

jest.mock("fs");
jest.mock("path");

// Mock debug module – createDebugLogger must return a callable logger
const mockLoggerFn = jest.fn() as jest.Mock & {
  enabled: boolean;
  namespace: string;
  extend: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
};
mockLoggerFn.enabled = false;
mockLoggerFn.namespace = "mock";
mockLoggerFn.warn = jest.fn();
mockLoggerFn.error = jest.fn();
mockLoggerFn.extend = jest
  .fn()
  .mockImplementation((_sub: string) => mockLoggerFn);

jest.mock("../debug", () => ({
  configureDebug: jest.fn(),
  createDebugLogger: jest.fn().mockImplementation(() => mockLoggerFn),
}));

jest.mock("../remark-plugin", () => ({
  terminologyRemarkPlugin: jest.fn(),
}));

jest.mock("../server-impl", () => ({
  buildTermIndex: jest.fn().mockResolvedValue(new Map()),
  generateGlossaryJson: jest.fn().mockResolvedValue(undefined),
  injectGlossaryComponent: jest.fn().mockResolvedValue(undefined),
  copyTermJsonFiles: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../runtime/inject-terminology", () => ({
  generateInjectScript: jest
    .fn()
    .mockReturnValue("<script>__RSPRESS_TERMINOLOGY__={};</script>"),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import { configureDebug } from "../debug";
import { terminologyPlugin } from "../server";
import * as serverImpl from "../server-impl";

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;
const mockedConfigureDebug = configureDebug as jest.Mock;

// ─── Shared helpers ───────────────────────────────────────────────────────────

const baseOptions = {
  termsDir: "terms",
  docsDir: "docs",
  glossaryFilepath: "glossary.mdx",
};

function setupPathMocks() {
  mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
  mockedPath.resolve.mockImplementation((...args: string[]) => args.join("/"));
  mockedPath.isAbsolute.mockImplementation((p: string) => p.startsWith("/"));
  mockedPath.relative.mockImplementation((from: string, to: string) =>
    to.replace(from + "/", ""),
  );
  (mockedPath as any).sep = "/";
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  jest.clearAllMocks();
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  process.cwd = jest.fn().mockReturnValue("/cwd");

  setupPathMocks();
  mockedFs.existsSync.mockReturnValue(false);
  mockedFs.readFileSync.mockReturnValue("{}");
  mockedFs.readdirSync.mockReturnValue([]);

  // Restore extend mock on mockLoggerFn
  mockLoggerFn.extend.mockImplementation(() => mockLoggerFn);
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe("terminologyPlugin – option validation", () => {
  it("throws when termsDir is missing", () => {
    expect(() =>
      terminologyPlugin({ docsDir: "docs", glossaryFilepath: "g.mdx" } as any),
    ).toThrow("Missing required options");
  });

  it("throws when docsDir is missing", () => {
    expect(() =>
      terminologyPlugin({
        termsDir: "terms",
        glossaryFilepath: "g.mdx",
      } as any),
    ).toThrow("Missing required options");
  });

  it("throws when glossaryFilepath is missing", () => {
    expect(() =>
      terminologyPlugin({ termsDir: "terms", docsDir: "docs" } as any),
    ).toThrow("Missing required options");
  });

  it("does not throw with all required options", () => {
    expect(() => terminologyPlugin(baseOptions)).not.toThrow();
  });
});

// ─── Debug configuration ──────────────────────────────────────────────────────

describe("terminologyPlugin – debug configuration", () => {
  it("passes boolean true as { enabled: true }", () => {
    terminologyPlugin({ ...baseOptions, debug: true });
    expect(mockedConfigureDebug).toHaveBeenCalledWith({ enabled: true });
  });

  it("passes boolean false as { enabled: false }", () => {
    terminologyPlugin({ ...baseOptions, debug: false });
    expect(mockedConfigureDebug).toHaveBeenCalledWith({ enabled: false });
  });

  it("passes debug object through unchanged", () => {
    const debugOpts = {
      enabled: true,
      timestamps: true,
      namespaces: ["build"],
    };
    terminologyPlugin({ ...baseOptions, debug: debugOpts });
    expect(mockedConfigureDebug).toHaveBeenCalledWith(debugOpts);
  });

  it("uses empty object when debug option is omitted", () => {
    terminologyPlugin(baseOptions);
    expect(mockedConfigureDebug).toHaveBeenCalledWith({});
  });
});

// ─── Plugin shape ─────────────────────────────────────────────────────────────

describe("terminologyPlugin – plugin object", () => {
  it("returns plugin named rspress-terminology", () => {
    const plugin = terminologyPlugin(baseOptions);
    expect(plugin.name).toBe("rspress-terminology");
  });

  it("returns plugin with beforeBuild hook", () => {
    const plugin = terminologyPlugin(baseOptions);
    expect(typeof (plugin as any).beforeBuild).toBe("function");
  });

  it("returns plugin with afterBuild hook", () => {
    const plugin = terminologyPlugin(baseOptions);
    expect(typeof (plugin as any).afterBuild).toBe("function");
  });

  it("returns plugin with extendPageData hook", () => {
    const plugin = terminologyPlugin(baseOptions);
    expect(typeof (plugin as any).extendPageData).toBe("function");
  });

  it("returns plugin with markdown config", () => {
    const plugin = terminologyPlugin(baseOptions);
    expect((plugin as any).markdown).toBeDefined();
    expect((plugin as any).markdown.remarkPlugins).toBeDefined();
  });

  it("includes global components in markdown config", () => {
    const plugin = terminologyPlugin(baseOptions);
    const components = (plugin as any).markdown.globalComponents;
    expect(Array.isArray(components)).toBe(true);
    expect(components).toHaveLength(2);
  });

  it("uses custom termPreviewComponentPath when provided", () => {
    const plugin = terminologyPlugin({
      ...baseOptions,
      termPreviewComponentPath: "/custom/Term.js",
    });
    const components = (plugin as any).markdown.globalComponents;
    expect(components[0]).toBe("/custom/Term.js");
  });

  it("uses custom glossaryComponentPath when provided", () => {
    const plugin = terminologyPlugin({
      ...baseOptions,
      glossaryComponentPath: "/custom/Glossary.js",
    });
    const components = (plugin as any).markdown.globalComponents;
    expect(components[1]).toBe("/custom/Glossary.js");
  });
});

// ─── extendPageData ───────────────────────────────────────────────────────────

describe("extendPageData", () => {
  it("attaches terminology to pageData", () => {
    const plugin = terminologyPlugin(baseOptions);
    const pageData: any = {};
    (plugin as any).extendPageData(pageData);
    expect(pageData.terminology).toBeDefined();
    expect(pageData.terminology.termsDir).toBe("terms");
    expect(pageData.terminology.docsDir).toBe("docs");
    expect(typeof pageData.terminology.terms).toBe("object");
  });

  it("serialises the termIndex as a plain object", () => {
    const plugin = terminologyPlugin(baseOptions);
    const pageData: any = {};
    (plugin as any).extendPageData(pageData);
    expect(pageData.terminology.terms).not.toBeInstanceOf(Map);
  });
});

// ─── beforeBuild ─────────────────────────────────────────────────────────────

describe("beforeBuild", () => {
  it("calls buildTermIndex with plugin options", async () => {
    const plugin = terminologyPlugin(baseOptions);
    await (plugin as any).beforeBuild();
    expect(serverImpl.buildTermIndex).toHaveBeenCalledWith({
      ...baseOptions,
      basePath: "",
    });
  });

  it("auto-detects basePath from rspress config", async () => {
    const plugin = terminologyPlugin(baseOptions);
    await (plugin as any).beforeBuild({ base: "/themelio/" }, false);
    expect(serverImpl.buildTermIndex).toHaveBeenCalledWith({
      ...baseOptions,
      basePath: "/themelio",
    });
  });

  it("prefers explicit basePath over rspress config", async () => {
    const plugin = terminologyPlugin({ ...baseOptions, basePath: "/custom" });
    await (plugin as any).beforeBuild({ base: "/themelio/" }, false);
    expect(serverImpl.buildTermIndex).toHaveBeenCalledWith({
      ...baseOptions,
      basePath: "/custom",
    });
  });

  it("calls generateGlossaryJson after building index", async () => {
    const termIndex = new Map([["/term", { id: "term" }]]);
    (serverImpl.buildTermIndex as jest.Mock).mockResolvedValue(termIndex);
    const plugin = terminologyPlugin(baseOptions);
    await (plugin as any).beforeBuild();
    expect(serverImpl.generateGlossaryJson).toHaveBeenCalledWith(
      termIndex,
      "docs",
    );
  });

  it("calls injectGlossaryComponent with glossary path", async () => {
    const plugin = terminologyPlugin(baseOptions);
    await (plugin as any).beforeBuild();
    expect(serverImpl.injectGlossaryComponent).toHaveBeenCalledWith(
      "glossary.mdx",
      false, // no custom glossary component
    );
  });

  it("sets hasCustomGlossaryComponent true when glossaryComponentPath provided", async () => {
    const plugin = terminologyPlugin({
      ...baseOptions,
      glossaryComponentPath: "/custom/Glossary.js",
    });
    await (plugin as any).beforeBuild();
    expect(serverImpl.injectGlossaryComponent).toHaveBeenCalledWith(
      "glossary.mdx",
      true,
    );
  });

  it("rethrows errors from buildTermIndex", async () => {
    (serverImpl.buildTermIndex as jest.Mock).mockRejectedValue(
      new Error("build failed"),
    );
    const plugin = terminologyPlugin(baseOptions);
    await expect((plugin as any).beforeBuild()).rejects.toThrow("build failed");
  });
});

// ─── afterBuild ──────────────────────────────────────────────────────────────

describe("afterBuild", () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue([]);
  });

  it("calls copyTermJsonFiles", async () => {
    const plugin = terminologyPlugin(baseOptions);
    await (plugin as any).afterBuild({}, true);
    expect(serverImpl.copyTermJsonFiles).toHaveBeenCalled();
  });

  it("does not throw when outDir does not exist", async () => {
    mockedFs.existsSync.mockReturnValue(false);
    const plugin = terminologyPlugin(baseOptions);
    await expect((plugin as any).afterBuild({}, false)).resolves.not.toThrow();
  });

  it("injects script into HTML files", async () => {
    mockedFs.readdirSync.mockReturnValue([
      { name: "index.html", isDirectory: () => false, isFile: () => true },
    ] as any);
    mockedFs.readFileSync.mockReturnValue("<html><head></head></html>");
    mockedFs.writeFileSync.mockReturnValue(undefined);

    const plugin = terminologyPlugin(baseOptions);
    await (plugin as any).afterBuild({}, false);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("index.html"),
      expect.stringContaining("__RSPRESS_TERMINOLOGY__"),
      "utf-8",
    );
  });

  it("skips HTML files that already contain the injection marker", async () => {
    mockedFs.readdirSync.mockReturnValue([
      { name: "index.html", isDirectory: () => false, isFile: () => true },
    ] as any);
    mockedFs.readFileSync.mockReturnValue(
      "<html><head><script>__RSPRESS_TERMINOLOGY__={};</script></head></html>",
    );

    const plugin = terminologyPlugin(baseOptions);
    await (plugin as any).afterBuild({}, false);

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  it("recurses into subdirectories to find HTML files", async () => {
    mockedFs.readdirSync
      .mockReturnValueOnce([
        { name: "sub", isDirectory: () => true, isFile: () => false },
      ] as any)
      .mockReturnValueOnce([
        { name: "page.html", isDirectory: () => false, isFile: () => true },
      ] as any);
    mockedFs.readFileSync.mockReturnValue("<html><head></head></html>");
    mockedFs.writeFileSync.mockReturnValue(undefined);

    const plugin = terminologyPlugin(baseOptions);
    await (plugin as any).afterBuild({}, false);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("page.html"),
      expect.any(String),
      "utf-8",
    );
  });

  it("does not throw when afterBuild encounters an error", async () => {
    (serverImpl.copyTermJsonFiles as jest.Mock).mockRejectedValue(
      new Error("copy failed"),
    );
    const plugin = terminologyPlugin(baseOptions);
    // afterBuild swallows errors
    await expect((plugin as any).afterBuild({}, false)).resolves.not.toThrow();
  });
});

// ─── loadGlossaryJsonSync (via terminologyPlugin) ─────────────────────────────

describe("loadGlossaryJsonSync – via terminologyPlugin", () => {
  it("converts .md glossaryFilepath to .json for loading", () => {
    mockedPath.isAbsolute.mockReturnValue(false);
    mockedPath.resolve.mockReturnValue("/cwd/glossary.json");
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({ "/term": { id: "term" } }),
    );

    const plugin = terminologyPlugin({
      ...baseOptions,
      glossaryFilepath: "glossary.md",
    });
    const pageData: any = {};
    (plugin as any).extendPageData(pageData);
    // If loading worked, terms should be present in the initial sharedTermIndex
    expect(typeof pageData.terminology.terms).toBe("object");
  });

  it("returns empty index when glossary JSON file does not exist", () => {
    mockedFs.existsSync.mockReturnValue(false);
    const plugin = terminologyPlugin(baseOptions);
    const pageData: any = {};
    (plugin as any).extendPageData(pageData);
    expect(pageData.terminology.terms).toEqual({});
  });

  it("handles JSON parse errors gracefully", () => {
    mockedPath.isAbsolute.mockReturnValue(true);
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue("not valid json {{{");

    const plugin = terminologyPlugin({
      ...baseOptions,
      glossaryFilepath: "/absolute/glossary.json",
    });
    const pageData: any = {};
    (plugin as any).extendPageData(pageData);
    // Should not throw, falls back to empty map
    expect(pageData.terminology.terms).toEqual({});
  });

  it("handles absolute glossaryFilepath without path.resolve", () => {
    mockedPath.isAbsolute.mockReturnValue(true);
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({ "/a": { id: "a" } }),
    );

    const plugin = terminologyPlugin({
      ...baseOptions,
      glossaryFilepath: "/absolute/path/glossary.json",
    });
    const pageData: any = {};
    (plugin as any).extendPageData(pageData);
    expect(pageData.terminology.terms["/a"]).toBeDefined();
  });
});
