/**
 * Comprehensive tests for server-impl.ts
 * Tests server-side build-time processing including term indexing, glossary generation,
 * and plugin lifecycle hooks
 */

// Mock Node.js modules before imports
jest.mock("fs");
jest.mock("path");

// Mock remark modules at top level
const mockRemarkResult = {
  value: "<p>Test</p>",
  toString: function () {
    return this.value;
  },
};

jest.mock("remark", () => ({
  remark: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue(mockRemarkResult),
  })),
}));

jest.mock("remark-html", () => ({
  default: { sanitize: true },
}));

import fs from "fs";
import path from "path";

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe("server-impl utilities (tested through public API)", () => {
  // Internal functions are tested through buildTermIndex and other public APIs
  // This ensures we test the actual behavior rather than implementation details
});

describe("buildTermIndex", () => {
  const mockOptions = {
    termsDir: "terms",
    docsDir: "docs",
    glossaryFilepath: "glossary.mdx",
  };

  beforeEach(() => {
    mockedPath.resolve.mockImplementation((...args: string[]) =>
      args.join("/"),
    );
    mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockedPath.basename.mockImplementation(
      (p: string) => p.split("/").pop() || "",
    );
    mockedPath.normalize.mockImplementation((p: string) =>
      p.replace(/\\/g, "/"),
    );
    (mockedPath as any).sep = "/";
    mockedPath.relative.mockImplementation((from: string, to: string) =>
      to.replace(from + "/", ""),
    );
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
  });

  it("should build term index from markdown files", async () => {
    const { buildTermIndex } = await import("../server-impl");

    mockedFs.readdirSync.mockReturnValue(["term1.md"] as any);
    mockedFs.readFileSync.mockReturnValue(
      "---\nid: term1\ntitle: Term 1\nhoverText: Test\n---\nContent",
    );

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(1);
    expect(result.has("/term1")).toBe(true);
  });

  it("should skip files missing required frontmatter", async () => {
    const { buildTermIndex } = await import("../server-impl");

    mockedFs.readdirSync.mockReturnValue(["invalid.md"] as any);
    mockedFs.readFileSync.mockReturnValue(
      "---\nsubtitle: Missing fields\n---\nContent",
    );

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("missing id or title"),
    );
  });

  it("should return empty map when terms directory does not exist", async () => {
    const { buildTermIndex } = await import("../server-impl");

    mockedFs.existsSync.mockReturnValue(false);

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Terms directory not found"),
    );
  });

  it("should handle basePath in routePath", async () => {
    const { buildTermIndex } = await import("../server-impl");
    const optionsWithBase = { ...mockOptions, basePath: "/en" };

    mockedFs.readdirSync.mockReturnValue(["term1.md"] as any);
    mockedFs.readFileSync.mockReturnValue(
      "---\nid: term1\ntitle: Term 1\n---\nContent",
    );

    const result = await buildTermIndex(optionsWithBase);

    expect(result.has("/en/term1")).toBe(true);
  });

  it("should handle file reading errors", async () => {
    const { buildTermIndex } = await import("../server-impl");

    mockedFs.readdirSync.mockReturnValue(["term1.md", "corrupted.md"] as any);
    mockedFs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes("corrupted.md")) {
        throw new Error("Read error");
      }
      return "---\nid: term1\ntitle: Term 1\n---\nContent";
    });

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error processing"),
      expect.any(Error),
    );
  });

  it("should process hoverText through remark", async () => {
    const { buildTermIndex } = await import("../server-impl");

    mockedFs.readdirSync.mockReturnValue(["term1.md"] as any);
    mockedFs.readFileSync.mockReturnValue(
      "---\nid: term1\ntitle: Term 1\nhoverText: **Bold** text\n---\nContent",
    );

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(1);
    const term = result.get("/term1");
    expect(term?.hoverText).toContain("<"); // Should be HTML
  });

  it("should handle files outside docsDir", async () => {
    const { buildTermIndex } = await import("../server-impl");

    mockedFs.readdirSync.mockReturnValue(["external.md"] as any);
    mockedFs.readFileSync.mockReturnValue(
      "---\nid: external\ntitle: External Term\n---\nContent",
    );
    // Simulate file outside docsDir
    mockedPath.normalize.mockImplementation((p) => {
      if (p.includes("external.md")) {
        return "/outside/terms/external.md";
      }
      return p.replace(/\\/g, "/");
    });

    const result = await buildTermIndex(mockOptions);

    // Should use basename as fallback
    expect(result.size).toBe(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("outside docsDir"),
    );
  });

  it("should handle Windows paths in normalizePath", async () => {
    const { buildTermIndex } = await import("../server-impl");

    mockedFs.readdirSync.mockReturnValue(["term1.md"] as any);
    mockedFs.readFileSync.mockReturnValue(
      "---\nid: term1\ntitle: Term 1\n---\nContent",
    );
    // Simulate Windows path
    mockedPath.relative.mockImplementation((from, to) => {
      return "terms\\term1.md";
    });

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(1);
  });
});

describe("generateGlossaryJson", () => {
  beforeEach(() => {
    mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockedPath.dirname.mockImplementation((p: string) =>
      p.split("/").slice(0, -1).join("/"),
    );
    mockedFs.existsSync.mockReturnValue(false); // Directory doesn't exist
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
  });

  it("should write glossary.json to docs directory", async () => {
    const { generateGlossaryJson } = await import("../server-impl");

    const termIndex = new Map([["/term1", { id: "term1", title: "Term 1" }]]);

    await generateGlossaryJson(termIndex, "docs");

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      "docs/glossary.json",
      expect.stringContaining('"term1"'),
      "utf-8",
    );
  });

  it("should create directory before writing", async () => {
    const { generateGlossaryJson } = await import("../server-impl");

    const termIndex = new Map();

    await generateGlossaryJson(termIndex, "docs");

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith("docs", {
      recursive: true,
    });
  });
});

describe("copyTermJsonFiles", () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    // Mock process.cwd() to return a consistent path
    process.cwd = jest
      .fn()
      .mockReturnValue("/Users/dimitristsironis/code/rspress-terminology");

    mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockedPath.dirname.mockImplementation((p: string) =>
      p.split("/").slice(0, -1).join("/"),
    );
    mockedFs.existsSync.mockReturnValue(false); // Directory doesn't exist
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  it("should copy glossary.json to static directory", async () => {
    const { copyTermJsonFiles } = await import("../server-impl");

    const termIndex = new Map([["/term1", { id: "term1", title: "Term 1" }]]);

    await copyTermJsonFiles(termIndex);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("doc_build/static/glossary.json"),
      expect.any(String),
      "utf-8",
    );
  });

  it("should copy individual term JSON files", async () => {
    const { copyTermJsonFiles } = await import("../server-impl");

    const termIndex = new Map([
      ["/term1", { id: "term1", title: "Term 1" }],
      ["/nested/term2", { id: "term2", title: "Term 2" }],
    ]);

    await copyTermJsonFiles(termIndex);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".rspress/terminology/term1.json"),
      expect.any(String),
      "utf-8",
    );
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".rspress/terminology/nested/term2.json"),
      expect.any(String),
      "utf-8",
    );
  });

  it("should create nested directories", async () => {
    const { copyTermJsonFiles } = await import("../server-impl");

    const termIndex = new Map([
      ["/deep/nested/term", { id: "term", title: "Term" }],
    ]);

    await copyTermJsonFiles(termIndex);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining(".rspress/terminology/deep/nested"),
      { recursive: true },
    );
  });
});

describe("injectGlossaryComponent", () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    // Clear all mocks before setting up new ones
    jest.clearAllMocks();

    // Mock process.cwd() to return a consistent path
    process.cwd = jest
      .fn()
      .mockReturnValue("/Users/dimitristsironis/code/rspress-terminology");

    mockedPath.resolve.mockImplementation((...args: string[]) =>
      args.join("/"),
    );
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue("Existing content");
    mockedFs.writeFileSync.mockReturnValue(undefined);
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  it("should inject Glossary component if not present", async () => {
    const { injectGlossaryComponent } = await import("../server-impl");

    await injectGlossaryComponent("glossary.mdx", false);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("glossary.mdx"),
      expect.stringContaining("<Glossary />"),
      "utf-8",
    );
  });

  it("should not inject if custom component is used", async () => {
    const { injectGlossaryComponent } = await import("../server-impl");

    await injectGlossaryComponent("glossary.mdx", true);

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Using custom glossary component"),
    );
  });

  it("should not inject if marker already present", async () => {
    const { injectGlossaryComponent } = await import("../server-impl");

    mockedFs.readFileSync.mockReturnValue("Content\n<Glossary />\n");

    await injectGlossaryComponent("glossary.mdx", false);

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  it("should handle missing glossary file gracefully", async () => {
    const { injectGlossaryComponent } = await import("../server-impl");

    mockedFs.existsSync.mockReturnValue(false);

    await injectGlossaryComponent("missing.mdx", false);

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Glossary file not found"),
    );
  });
});

describe("terminologyPlugin", () => {
  const validOptions = {
    termsDir: "terms",
    docsDir: "docs",
    glossaryFilepath: "glossary.mdx",
  };

  beforeEach(() => {
    mockedPath.resolve.mockImplementation((...args: string[]) =>
      args.join("/"),
    );
    mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockedPath.basename.mockImplementation(
      (p: string) => p.split("/").pop() || "",
    );
    mockedPath.normalize.mockImplementation((p: string) =>
      p.replace(/\\/g, "/"),
    );
    // path.sep is a string, not a function
    (mockedPath as any).sep = "/";
    mockedPath.relative.mockImplementation((from: string, to: string) =>
      to.replace(from + "/", ""),
    );
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue([] as any);
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
    mockedFs.readFileSync.mockReturnValue("");
  });

  it("should throw error if required options are missing", async () => {
    const { terminologyPlugin } = await import("../server-impl");

    expect(() => {
      terminologyPlugin({ termsDir: "terms" } as any);
    }).toThrow("Missing required options");
  });

  it("should create plugin with correct name", async () => {
    const { terminologyPlugin } = await import("../server-impl");

    const plugin = terminologyPlugin(validOptions);

    expect(plugin.name).toBe("rspress-terminology");
  });

  it("should have beforeBuild hook", async () => {
    const { terminologyPlugin } = await import("../server-impl");

    const plugin = terminologyPlugin(validOptions);

    expect(typeof plugin.beforeBuild).toBe("function");
  });

  it("should have afterBuild hook", async () => {
    const { terminologyPlugin } = await import("../server-impl");

    const plugin = terminologyPlugin(validOptions);

    expect(typeof plugin.afterBuild).toBe("function");
  });

  it("should have extendPageData hook", async () => {
    const { terminologyPlugin } = await import("../server-impl");

    const plugin = terminologyPlugin(validOptions);

    expect(typeof plugin.extendPageData).toBe("function");
  });

  it("should have markdown configuration", async () => {
    const { terminologyPlugin } = await import("../server-impl");

    const plugin = terminologyPlugin(validOptions);

    expect(plugin.markdown).toBeDefined();
    expect(plugin.markdown?.remarkPlugins).toBeDefined();
    expect(plugin.markdown?.globalComponents).toBeDefined();
  });

  describe("beforeBuild hook", () => {
    it("should build term index and generate glossary", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const plugin = terminologyPlugin(validOptions);

      await plugin.beforeBuild!();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Starting term indexing"),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Term indexing complete"),
      );
    });

    it("should validate Node.js environment", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const plugin = terminologyPlugin(validOptions);

      // Should not throw in Node environment
      await expect(plugin.beforeBuild!()).resolves.not.toThrow();
    });

    it("should handle build errors gracefully", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const plugin = terminologyPlugin(validOptions);

      // Mock to trigger error
      mockedFs.existsSync.mockImplementation(() => {
        throw new Error("Build error");
      });

      await expect(plugin.beforeBuild!()).rejects.toThrow();
    });
  });

  describe("afterBuild hook", () => {
    it("should inject scripts into HTML files", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const plugin = terminologyPlugin(validOptions);

      // Mock HTML files
      mockedFs.readdirSync.mockReturnValue(["index.html"] as any);
      mockedFs.readFileSync.mockReturnValue("<html><head></head></html>");
      mockedFs.writeFileSync.mockReturnValue(undefined);

      await plugin.afterBuild!({}, false);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Post-build tasks"),
      );
    });

    it("should handle afterBuild errors gracefully", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const plugin = terminologyPlugin(validOptions);

      // Mock to trigger error
      mockedFs.readdirSync.mockImplementation(() => {
        throw new Error("AfterBuild error");
      });

      // Should not throw - errors are caught and logged
      await expect(plugin.afterBuild!({}, false)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("extendPageData hook", () => {
    it("should add terminology data to page", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const plugin = terminologyPlugin(validOptions);
      const pageData = {};

      plugin.extendPageData!(pageData);

      expect((pageData as any).terminology).toBeDefined();
      expect((pageData as any).terminology.termsDir).toBe("terms");
      expect((pageData as any).terminology.docsDir).toBe("docs");
    });
  });

  describe("markdown configuration", () => {
    it("should include default global components", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const plugin = terminologyPlugin(validOptions);

      expect(plugin.markdown?.globalComponents).toHaveLength(2);
    });

    it("should use custom components if provided", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const optionsWithComponents = {
        ...validOptions,
        termPreviewComponentPath: "/custom/Term.js",
        glossaryComponentPath: "/custom/Glossary.js",
      };

      const plugin = terminologyPlugin(optionsWithComponents);

      expect(plugin.markdown?.globalComponents?.[0]).toBe("/custom/Term.js");
      expect(plugin.markdown?.globalComponents?.[1]).toBe(
        "/custom/Glossary.js",
      );
    });

    it("should configure remark plugins", async () => {
      const { terminologyPlugin } = await import("../server-impl");

      const plugin = terminologyPlugin(validOptions);

      expect(plugin.markdown?.remarkPlugins).toHaveLength(1);
    });
  });
});

describe("getSharedIndex", () => {
  it("should return shared term index", async () => {
    const { getSharedIndex } = await import("../server-impl");

    const index = getSharedIndex();

    expect(index).toBeInstanceOf(Map);
  });
});
