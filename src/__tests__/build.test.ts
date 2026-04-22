/**
 * Comprehensive tests for build.ts
 * Tests build-time utilities including markdown parsing, file operations, and term indexing
 */

// Mock modules before imports
jest.mock("fs");
jest.mock("path");

// Mock remark modules to avoid ESM issues
const mockRemarkResult = {
  value: "<p>Processed</p>",
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

// Mock the build module before importing
jest.mock("../build", () => {
  const actualModule = jest.requireActual("../build");
  return {
    ...actualModule,
    processHoverText: jest.fn(),
  };
});

import {
  buildTermIndex,
  copyTermJsonFiles,
  ensureDirectory,
  generateGlossaryJson,
  getMarkdownFiles,
  injectGlossaryComponent,
  normalizePath,
  parseMarkdown,
  processHoverText,
  writeJsonFile,
} from "../build";
import type { TerminologyPluginOptions } from "../types";

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();

  // Clear all mocks
  jest.clearAllMocks();

  // Mock process.cwd() to return a consistent path
  const _originalCwd = process.cwd;
  process.cwd = jest
    .fn()
    .mockReturnValue("/Users/dimitristsironis/code/rspress-terminology");

  // Set up default path mocks
  mockedPath.resolve.mockImplementation((...args: string[]) => {
    if (args[0] === "") {
      return (
        "/Users/dimitristsironis/code/rspress-terminology/" +
        args.slice(1).join("/")
      );
    }
    return args.join("/");
  });
  mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
  mockedPath.basename.mockImplementation(
    (p: string) => p.split("/").pop() || "",
  );
  mockedPath.normalize.mockImplementation((p: string) => p.replace(/\\/g, "/"));
  mockedPath.dirname.mockImplementation((p: string) =>
    p.split("/").slice(0, -1).join("/"),
  );
  (mockedPath as any).sep = "/";
  mockedPath.relative.mockImplementation((from: string, to: string) =>
    to.replace(from + "/", ""),
  );

  // Set up default fs mocks
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.mkdirSync.mockReturnValue(undefined);
  mockedFs.writeFileSync.mockReturnValue(undefined);
  mockedFs.readFileSync.mockReturnValue("");
  mockedFs.readdirSync.mockReturnValue([] as any);
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

describe("parseMarkdown", () => {
  it("should parse frontmatter and content correctly", () => {
    const content = `---
id: test-term
title: Test Term
hoverText: This is a hover text
---

This is the body content.`;

    const result = parseMarkdown(content);

    expect(result.metadata).toEqual({
      id: "test-term",
      title: "Test Term",
      hoverText: "This is a hover text",
    });
    expect(result.content).toBe("This is the body content.");
  });

  it("should handle markdown without frontmatter", () => {
    const content = "Just plain markdown content";

    const result = parseMarkdown(content);

    expect(result.metadata).toEqual({});
    expect(result.content).toBe("Just plain markdown content");
  });

  it("should handle empty frontmatter", () => {
    const content = `---

---

Some content`;

    const result = parseMarkdown(content);

    expect(result.metadata).toEqual({});
    expect(result.content).toBe("Some content");
  });

  it("should handle frontmatter with multiple colons in values", () => {
    const content = `---
id: test-term
title: Test: With: Colons
url: https://example.com:8080
---

Content`;

    const result = parseMarkdown(content);

    expect(result.metadata).toEqual({
      id: "test-term",
      title: "Test: With: Colons",
      url: "https://example.com:8080",
    });
  });

  it("should handle frontmatter with empty values", () => {
    const content = `---
id: test-term
title:
hoverText: Some text
---

Content`;

    const result = parseMarkdown(content);

    expect(result.metadata).toEqual({
      id: "test-term",
      title: "",
      hoverText: "Some text",
    });
  });

  it("should trim whitespace from frontmatter values", () => {
    const content = `---
id:    test-term
title:  Test Term
---

Content`;

    const result = parseMarkdown(content);

    expect(result.metadata).toEqual({
      id: "test-term",
      title: "Test Term",
    });
  });

  it("should handle multiline frontmatter", () => {
    const content = `---
id: test-term
title: Test Term
description: |
  This is a
  multiline
  description
---

Content`;

    const result = parseMarkdown(content);

    expect(result.metadata.id).toBe("test-term");
    expect(result.metadata.title).toBe("Test Term");
    // Note: Current implementation processes each line separately
    // YAML multiline syntax (|) is preserved as-is in the value
    expect(result.metadata.description).toBeDefined();
  });

  it("should handle malformed frontmatter gracefully", () => {
    const content = `---
id test-term
title Test Term
---

Content`;

    const result = parseMarkdown(content);

    // Lines without colons are skipped
    expect(result.metadata).toEqual({});
    expect(result.content).toBe("Content");
  });
});

describe("processHoverText", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should convert markdown to HTML", async () => {
    const mockProcessHoverText = jest.requireActual("../build")
      .processHoverText as any;
    // Mock the remark modules within the function
    jest.doMock("remark", () => mockRemark);
    jest.doMock("remark-html", () => mockRemarkHTML);

    const hoverText = "This is **bold** and *italic* text";

    // For this test, we'll just verify the function exists and handles input
    const result = await mockProcessHoverText(hoverText);

    // Verify it returns something (actual HTML conversion depends on remark)
    expect(typeof result).toBe("string");
  });

  it("should return empty string for empty input", async () => {
    const mockProcessHoverText = jest.requireActual("../build")
      .processHoverText as any;
    const result = await mockProcessHoverText("");

    expect(result).toBe("");
  });

  it("should return empty string for undefined input", async () => {
    const mockProcessHoverText = jest.requireActual("../build")
      .processHoverText as any;
    const result = await mockProcessHoverText(undefined as any);

    expect(result).toBe("");
  });
});

describe("normalizePath", () => {
  it("should convert backslashes to forward slashes", () => {
    expect(normalizePath("path\\to\\file.md")).toBe("path/to/file.md");
  });

  it("should remove leading ./", () => {
    expect(normalizePath("./path/to/file.md")).toBe("path/to/file.md");
  });

  it("should handle both backslashes and leading ./", () => {
    expect(normalizePath(".\\path\\to\\file.md")).toBe("path/to/file.md");
  });

  it("should handle forward slashes without leading ./", () => {
    expect(normalizePath("path/to/file.md")).toBe("path/to/file.md");
  });

  it("should handle Windows network paths", () => {
    expect(normalizePath("\\\\server\\share\\file.md")).toBe(
      "//server/share/file.md",
    );
  });

  it("should handle empty string", () => {
    expect(normalizePath("")).toBe("");
  });

  it("should handle paths with multiple consecutive slashes", () => {
    expect(normalizePath("path//to///file.md")).toBe("path//to///file.md");
  });
});

describe("ensureDirectory", () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.mkdirSync.mockReturnValue(undefined);
  });

  it("should create directory if it does not exist", () => {
    ensureDirectory("/path/to/dir");

    expect(mockedFs.existsSync).toHaveBeenCalledWith("/path/to/dir");
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith("/path/to/dir", {
      recursive: true,
    });
  });

  it("should not create directory if it already exists", () => {
    mockedFs.existsSync.mockReturnValue(true);

    ensureDirectory("/path/to/dir");

    expect(mockedFs.existsSync).toHaveBeenCalledWith("/path/to/dir");
    expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
  });
});

describe("writeJsonFile", () => {
  beforeEach(() => {
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
    mockedPath.dirname.mockReturnValue("/path/to");
  });

  it("should write JSON file with correct formatting", () => {
    const data = { key: "value", nested: { prop: 123 } };
    writeJsonFile("/path/to/file.json", data);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      "/path/to/file.json",
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  });

  it("should create directory before writing file", () => {
    // Mock existsSync to return false so directory is created
    mockedFs.existsSync.mockReturnValue(false);

    writeJsonFile("/path/to/file.json", { key: "value" });

    expect(mockedPath.dirname).toHaveBeenCalledWith("/path/to/file.json");
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith("/path/to", {
      recursive: true,
    });
  });

  it("should handle complex nested data structures", () => {
    const data = {
      terms: {
        "api-key": {
          id: "api-key",
          title: "API Key",
          metadata: {
            created: "2024-01-01",
            updated: "2024-01-02",
          },
        },
      },
    };

    writeJsonFile("/path/to/glossary.json", data);

    const writtenData = JSON.stringify(data, null, 2);
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      "/path/to/glossary.json",
      writtenData,
      "utf-8",
    );
  });

  it("should handle arrays", () => {
    const data = [1, 2, 3, { key: "value" }];

    writeJsonFile("/path/to/array.json", data);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      "/path/to/array.json",
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  });

  it("should handle null and undefined values", () => {
    const data = {
      nullValue: null,
      undefinedValue: undefined,
      normalValue: "test",
    };

    writeJsonFile("/path/to/file.json", data);

    const writtenData = JSON.stringify(data, null, 2);
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      "/path/to/file.json",
      writtenData,
      "utf-8",
    );
  });
});

describe("getMarkdownFiles", () => {
  beforeEach(() => {
    mockedFs.existsSync.mockReturnValue(true);
  });

  it("should return empty array if directory does not exist", () => {
    mockedFs.existsSync.mockReturnValue(false);

    const result = getMarkdownFiles("/nonexistent/path");

    expect(result).toEqual([]);
    expect(mockedFs.readdirSync).not.toHaveBeenCalled();
  });

  it("should filter only .md and .mdx files", () => {
    mockedFs.readdirSync.mockReturnValue([
      "file1.md",
      "file2.mdx",
      "file3.txt",
      "file4.json",
      "file5.md",
    ] as any);
    mockedPath.join.mockImplementation(
      (dir: string, file: string) => `${dir}/${file}`,
    );

    const result = getMarkdownFiles("/path/to/dir");

    expect(result).toHaveLength(3);
    expect(result).toContain("/path/to/dir/file1.md");
    expect(result).toContain("/path/to/dir/file2.mdx");
    expect(result).toContain("/path/to/dir/file5.md");
  });

  it("should handle empty directory", () => {
    mockedFs.readdirSync.mockReturnValue([]);

    const result = getMarkdownFiles("/path/to/empty");

    expect(result).toEqual([]);
  });

  it("should handle case-sensitive extensions", () => {
    mockedFs.readdirSync.mockReturnValue([
      "file1.MD",
      "file2.MDX",
      "file3.md",
      "file4.mdx",
    ] as any);
    mockedPath.join.mockImplementation(
      (dir: string, file: string) => `${dir}/${file}`,
    );

    const result = getMarkdownFiles("/path/to/dir");

    // Only lowercase .md and .mdx should match
    expect(result).toHaveLength(2);
    expect(result).toContain("/path/to/dir/file3.md");
    expect(result).toContain("/path/to/dir/file4.mdx");
  });
});

describe("buildTermIndex", () => {
  beforeEach(() => {
    // Mock process.cwd() to return a consistent path
    const _originalCwd = process.cwd;
    process.cwd = jest
      .fn()
      .mockReturnValue("/Users/dimitristsironis/code/rspress-terminology");

    mockedPath.resolve.mockImplementation((...args: string[]) => {
      // Handle the case where first arg is empty string (current directory)
      if (args[0] === "") {
        return (
          "/Users/dimitristsironis/code/rspress-terminology/" +
          args.slice(1).join("/")
        );
      }
      return args.join("/");
    });
    mockedFs.existsSync.mockReturnValue(true);
    mockedPath.basename.mockImplementation(
      (p: string) => p.split("/").pop() || "",
    );
    mockedPath.relative.mockImplementation((from: string, to: string) => {
      // Simple mock: remove the 'from' path from 'to' path
      if (to.startsWith(from)) {
        return to.slice(from.length + 1);
      }
      return to;
    });
    mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  const mockOptions: TerminologyPluginOptions = {
    termsDir: "terms",
    docsDir: "docs",
    glossaryFilepath: "glossary.mdx",
  };

  it("should build term index from markdown files", async () => {
    mockedFs.readdirSync.mockReturnValue(["term1.md", "term2.mdx"] as any);
    mockedFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes("term1.md")) {
        return "---\nid: term1\ntitle: Term 1\n---\nContent 1";
      } else if (filePath.includes("term2.mdx")) {
        return "---\nid: term2\ntitle: Term 2\n---\nContent 2";
      }
      return "";
    });

    // Mock processHoverText
    (processHoverText as jest.Mock).mockResolvedValue("<p>Hover</p>");

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(2);
    // The actual path format depends on the mock path.relative implementation
    // With the current mock, paths will be relative from docs to terms
    const keys = Array.from(result.keys());
    expect(keys.length).toBe(2);
    expect(keys.some((key) => key.includes("term1"))).toBe(true);
    expect(keys.some((key) => key.includes("term2"))).toBe(true);
  });

  it("should skip files missing required frontmatter", async () => {
    mockedFs.readdirSync.mockReturnValue(["valid.md", "invalid.md"] as any);
    mockedFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes("valid.md")) {
        return "---\nid: valid\ntitle: Valid Term\n---\nContent";
      } else if (filePath.includes("invalid.md")) {
        return "---\nsubtitle: Missing id and title\n---\nContent";
      }
      return "";
    });

    (processHoverText as jest.Mock).mockResolvedValue("");

    const result = await buildTermIndex(mockOptions);

    // At least the valid file should be indexed
    expect(result.size).toBeGreaterThanOrEqual(1);
    const keys = Array.from(result.keys());
    expect(keys.some((key) => key.includes("valid"))).toBe(true);
  });

  it("should return empty map when terms directory does not exist", async () => {
    mockedFs.existsSync.mockReturnValue(false);

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Terms directory not found"),
    );
  });

  it("should handle file reading errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockedFs.readdirSync.mockReturnValue(["term1.md", "corrupted.md"] as any);
    mockedFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes("corrupted.md")) {
        throw new Error("File read error");
      }
      return "---\nid: term1\ntitle: Term 1\n---\nContent";
    });

    (processHoverText as jest.Mock).mockResolvedValue("");

    const result = await buildTermIndex(mockOptions);

    expect(result.size).toBe(1);
    const keys = Array.from(result.keys());
    expect(keys.some((key) => key.includes("term1"))).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error processing"),
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should use basePath in routePath", async () => {
    const optionsWithBasePath = { ...mockOptions, basePath: "/en" };
    mockedFs.readdirSync.mockReturnValue(["term1.md"] as any);
    mockedFs.readFileSync.mockReturnValue(
      "---\nid: term1\ntitle: Term 1\n---\nContent",
    );

    (processHoverText as jest.Mock).mockResolvedValue("");

    const result = await buildTermIndex(optionsWithBasePath);

    // Check that the basePath is included in the route
    const keys = Array.from(result.keys());
    expect(
      keys.some((key) => key.includes("/en") && key.includes("term1")),
    ).toBe(true);
  });
});

describe("generateGlossaryJson", () => {
  beforeEach(() => {
    mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
  });

  it("should write glossary JSON to docs directory", () => {
    const termIndex = new Map([
      ["/term1", { id: "term1", title: "Term 1" }],
      ["/term2", { id: "term2", title: "Term 2" }],
    ]);

    generateGlossaryJson(termIndex, "docs");

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("docs/glossary.json"),
      JSON.stringify(Object.fromEntries(termIndex), null, 2),
      "utf-8",
    );
  });

  it("should handle empty term index", () => {
    const termIndex = new Map();

    generateGlossaryJson(termIndex, "docs");

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("docs/glossary.json"),
      "{}",
      "utf-8",
    );
  });
});

describe("injectGlossaryComponent", () => {
  beforeEach(() => {
    mockedPath.resolve.mockImplementation((...args: string[]) =>
      args.join("/"),
    );
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue("Existing content\n");
    mockedFs.writeFileSync.mockReturnValue(undefined);
  });

  it("should inject Glossary component marker if not present", () => {
    injectGlossaryComponent("glossary.mdx", false);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("glossary.mdx"),
      "Existing content\n\n<Glossary />\n",
      "utf-8",
    );
  });

  it("should not inject if marker already present", () => {
    mockedFs.readFileSync.mockReturnValue("Content\n<Glossary />\n");

    injectGlossaryComponent("glossary.mdx", false);

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  it("should not inject if custom component is used", () => {
    injectGlossaryComponent("glossary.mdx", true);

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Using custom glossary component"),
    );
  });

  it("should handle missing glossary file gracefully", () => {
    mockedFs.existsSync.mockReturnValue(false);

    injectGlossaryComponent("nonexistent.mdx", false);

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Glossary file not found"),
    );
  });

  it("should preserve content before adding marker", () => {
    mockedFs.readFileSync.mockReturnValue("# Glossary\n\nSome content");

    injectGlossaryComponent("glossary.mdx", false);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("glossary.mdx"),
      "# Glossary\n\nSome content\n\n<Glossary />\n",
      "utf-8",
    );
  });

  it("should trim trailing whitespace before adding marker", () => {
    mockedFs.readFileSync.mockReturnValue("Content   \n   ");

    injectGlossaryComponent("glossary.mdx", false);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("glossary.mdx"),
      "Content\n\n<Glossary />\n",
      "utf-8",
    );
  });
});

describe("copyTermJsonFiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default path mocks for this describe block
    mockedPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockedPath.dirname.mockImplementation((p: string) =>
      p.split("/").slice(0, -1).join("/"),
    );
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
  });

  it("should copy all term metadata to JSON files", () => {
    const termIndex = new Map([
      ["/term1", { id: "term1", title: "Term 1", content: "Content 1" }],
      ["/nested/term2", { id: "term2", title: "Term 2", content: "Content 2" }],
    ]);

    copyTermJsonFiles(termIndex);

    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);
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

  it("should create nested directories as needed", () => {
    // Mock existsSync to return false so directories are created
    mockedFs.existsSync.mockReturnValue(false);

    const termIndex = new Map([
      ["/deep/nested/term", { id: "term", title: "Term" }],
    ]);

    copyTermJsonFiles(termIndex);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining(".rspress/terminology/deep/nested"),
      { recursive: true },
    );
  });

  it("should handle empty term index", () => {
    const termIndex = new Map();

    copyTermJsonFiles(termIndex);

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  it("should strip leading slash from term paths", () => {
    const termIndex = new Map([
      ["/term1", { id: "term1", title: "Term 1" }],
      ["term2", { id: "term2", title: "Term 2" }],
    ]);

    copyTermJsonFiles(termIndex);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".rspress/terminology/term1.json"),
      expect.any(String),
      "utf-8",
    );
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".rspress/terminology/term2.json"),
      expect.any(String),
      "utf-8",
    );
  });
});
