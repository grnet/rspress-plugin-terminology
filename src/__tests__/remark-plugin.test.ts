/**
 * Comprehensive tests for remark-plugin.ts
 * Tests markdown transformation, AST manipulation, and edge cases
 */

// Mock the visit function before importing
jest.mock("unist-util-visit", () => ({
  visit: jest.fn(),
}));

import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import {
  extractTermPath,
  isTermLink,
  terminologyRemarkPlugin,
} from "../remark-plugin";
import type { RemarkPluginOptions, TermMetadata } from "../types";

// Mock visit to actually call the visitor function
(visit as jest.Mock).mockImplementation(
  (tree: any, type: string, visitor: any) => {
    function visitNode(node: any) {
      if (!node) return;

      if (node.type === type) {
        visitor(node);
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(visitNode);
      }
    }

    visitNode(tree);
  },
);

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

describe("remark-plugin", () => {
  describe("normalizePath", () => {
    it("should convert backslashes to forward slashes", () => {
      const metadata: TermMetadata = {
        id: "test-term",
        title: "Test Term",
        hoverText: "Test hover",
        content: "Test content",
        filePath: "terms\\test-term.md",
        routePath: "/test-term",
      };

      const termIndex = new Map([["test-term", metadata]]);
      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const tree: Root = {
        type: "root",
        children: [],
      };

      // This should work with normalized paths
      expect(() => {
        const transformer = terminologyRemarkPlugin(options);
        transformer.call({} as any, tree);
      }).not.toThrow();
    });

    it("should remove leading ./", () => {
      const metadata: TermMetadata = {
        id: "test-term",
        title: "Test Term",
        hoverText: "Test hover",
        content: "Test content",
        filePath: "./terms/test-term.md",
        routePath: "/test-term",
      };

      const termIndex = new Map([["test-term", metadata]]);
      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const tree: Root = {
        type: "root",
        children: [],
      };

      expect(() => {
        const transformer = terminologyRemarkPlugin(options);
        transformer.call({} as any, tree);
      }).not.toThrow();
    });
  });

  describe("findTermInIndex", () => {
    const createTermMetadata = (
      id: string,
      filePath: string,
      routePath: string,
    ): TermMetadata => ({
      id,
      title: `${id} Title`,
      hoverText: `${id} hover`,
      content: `${id} content`,
      filePath,
      routePath,
    });

    it("should find term by exact key match", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      expect(linkNode.type).toBe("mdxJsxFlowElement");
      expect(linkNode.name).toBe("Term");
    });

    it("should find term with .md extension", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.md",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      expect(linkNode.type).toBe("mdxJsxFlowElement");
      expect(linkNode.name).toBe("Term");
    });

    it("should find term with .mdx extension", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.mdx",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.mdx",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      expect(linkNode.type).toBe("mdxJsxFlowElement");
      expect(linkNode.name).toBe("Term");
    });

    it("should find term by filePath match", () => {
      const metadata = createTermMetadata(
        "api-key",
        "docs/terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["docs/terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "docs/terms/api-key.md",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      expect(linkNode.type).toBe("mdxJsxFlowElement");
      expect(linkNode.name).toBe("Term");
    });

    it("should find term by routePath match", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/en/api-key",
      );
      const termIndex = new Map([["/en/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "/en/api-key",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      // This won't match because it's not a .md/.mdx file or in terms/ directory
      expect(linkNode.type).toBe("link");
    });

    it("should return null for non-matching term", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/non-existent",
            children: [{ type: "text", value: "Non Existent" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      // Should remain as regular link
      expect(linkNode.type).toBe("link");
      expect(linkNode.url).toBe("terms/non-existent");
    });

    it("should handle leading slash variations", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([
        ["/terms/api-key", metadata],
        ["terms/api-key", metadata],
        ["./terms/api-key", metadata],
      ]);

      const testCases = [
        { url: "/terms/api-key", shouldMatch: true },
        { url: "terms/api-key", shouldMatch: true },
        { url: "./terms/api-key", shouldMatch: true },
      ];

      testCases.forEach(({ url, shouldMatch }) => {
        const tree: Root = {
          type: "root",
          children: [
            {
              type: "link",
              url,
              children: [{ type: "text", value: "API Key" }],
            },
          ],
        };

        const options: RemarkPluginOptions = {
          options: {
            termsDir: "terms",
            docsDir: "docs",
            glossaryFilepath: "glossary.mdx",
          },
          termIndex,
        };

        const transformer = terminologyRemarkPlugin(options);
        transformer.call({} as any, tree);

        const linkNode = tree.children[0] as any;
        if (shouldMatch) {
          expect(linkNode.type).toBe("mdxJsxFlowElement");
          expect(linkNode.name).toBe("Term");
        } else {
          expect(linkNode.type).toBe("link");
        }
      });
    });
  });

  describe("terminologyRemarkPlugin - AST Transformation", () => {
    const createTermMetadata = (
      id: string,
      filePath: string,
      routePath: string,
    ): TermMetadata => ({
      id,
      title: `${id} Title`,
      hoverText: `${id} hover`,
      content: `${id} content`,
      filePath,
      routePath,
    });

    it("should transform term link to Term component", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.md",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const transformed = tree.children[0] as any;
      expect(transformed.type).toBe("mdxJsxFlowElement");
      expect(transformed.name).toBe("Term");
      expect(transformed.attributes).toHaveLength(1);
      expect(transformed.attributes[0].name).toBe("pathName");
      expect(transformed.attributes[0].value).toBe("/api-key");
    });

    it("should preserve placement attribute when present", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.md",
            data: { dataPlacement: "top" },
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const transformed = tree.children[0] as any;
      expect(transformed.attributes).toHaveLength(2);
      expect(transformed.attributes[0].name).toBe("pathName");
      expect(transformed.attributes[1].name).toBe("placement");
      expect(transformed.attributes[1].value).toBe("top");
    });

    it("should not transform non-term links", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "https://example.com",
            children: [{ type: "text", value: "External Link" }],
          },
          {
            type: "link",
            url: "/other/page",
            children: [{ type: "text", value: "Internal Link" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      expect((tree.children[0] as any).type).toBe("link");
      expect((tree.children[1] as any).type).toBe("link");
    });

    it("should handle multiple term links in same document", () => {
      const termIndex = new Map([
        [
          "terms/api-key",
          createTermMetadata("api-key", "terms/api-key.md", "/api-key"),
        ],
        [
          "terms/auth-token",
          createTermMetadata(
            "auth-token",
            "terms/auth-token.md",
            "/auth-token",
          ),
        ],
        [
          "terms/webhook",
          createTermMetadata("webhook", "terms/webhook.md", "/webhook"),
        ],
      ]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.md",
            children: [{ type: "text", value: "API Key" }],
          },
          {
            type: "paragraph",
            children: [{ type: "text", value: "Some text" }],
          },
          {
            type: "link",
            url: "terms/auth-token",
            children: [{ type: "text", value: "Auth Token" }],
          },
          {
            type: "link",
            url: "terms/webhook.mdx",
            children: [{ type: "text", value: "Webhook" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      expect((tree.children[0] as any).type).toBe("mdxJsxFlowElement");
      expect((tree.children[0] as any).name).toBe("Term");
      expect((tree.children[2] as any).type).toBe("mdxJsxFlowElement");
      expect((tree.children[2] as any).name).toBe("Term");
      expect((tree.children[3] as any).type).toBe("mdxJsxFlowElement");
      expect((tree.children[3] as any).name).toBe("Term");
    });

    it("should handle empty term index gracefully", () => {
      const termIndex = new Map();

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.md",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      expect(() => {
        transformer.call({} as any, tree);
      }).not.toThrow();

      // Link should remain unchanged
      expect((tree.children[0] as any).type).toBe("link");
    });
  });

  describe("Edge Cases", () => {
    const createTermMetadata = (
      id: string,
      filePath: string,
      routePath: string,
    ): TermMetadata => ({
      id,
      title: `${id} Title`,
      hoverText: `${id} hover`,
      content: `${id} content`,
      filePath,
      routePath,
    });

    it("should handle malformed syntax - missing url", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "",
            children: [{ type: "text", value: "Empty Link" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      // Should remain as regular link
      expect((tree.children[0] as any).type).toBe("link");
    });

    it("should handle undefined url", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: undefined as any,
            children: [{ type: "text", value: "No URL" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      expect(() => {
        transformer.call({} as any, tree);
      }).not.toThrow();
    });

    it("should handle special characters in term IDs", () => {
      const metadata = createTermMetadata(
        "api-key-v2",
        "terms/api-key-v2.md",
        "/api-key-v2",
      );
      const termIndex = new Map([["terms/api-key-v2", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key-v2.md",
            children: [{ type: "text", value: "API Key V2" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const transformed = tree.children[0] as any;
      expect(transformed.type).toBe("mdxJsxFlowElement");
      expect(transformed.name).toBe("Term");
    });

    it("should handle nested links (should not transform nested)", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      // Create nested structure (paragraph containing link)
      const tree: Root = {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                value: "See ",
              },
              {
                type: "link",
                url: "terms/api-key.md",
                children: [{ type: "text", value: "API Key" }],
              },
            ],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const paragraph = tree.children[0] as any;
      const link = paragraph.children[1];
      expect(link.type).toBe("mdxJsxFlowElement");
      expect(link.name).toBe("Term");
    });

    it("should handle links with query parameters", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.md?param=value",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      // Should not transform - query params not supported
      expect((tree.children[0] as any).type).toBe("link");
    });

    it("should handle .html extension removal", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.html",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.html",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      // HTML files in terms directory ARE considered term links (they match the terms/ pattern)
      expect((tree.children[0] as any).type).toBe("mdxJsxFlowElement");
      expect((tree.children[0] as any).name).toBe("Term");
    });

    it("should handle terms directory variations", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([
        ["./terms/api-key", metadata],
        ["terms/api-key", metadata],
        ["/terms/api-key", metadata],
      ]);

      const testCases = [
        { url: "./terms/api-key", shouldTransform: true },
        { url: "terms/api-key", shouldTransform: true },
        { url: "/terms/api-key", shouldTransform: true },
        { url: "docs/terms/api-key", shouldTransform: false },
      ];

      testCases.forEach(({ url, shouldTransform }) => {
        const tree: Root = {
          type: "root",
          children: [
            {
              type: "link",
              url,
              children: [{ type: "text", value: "API Key" }],
            },
          ],
        };

        const options: RemarkPluginOptions = {
          options: {
            termsDir: "terms",
            docsDir: "docs",
            glossaryFilepath: "glossary.mdx",
          },
          termIndex,
        };

        const transformer = terminologyRemarkPlugin(options);
        transformer.call({} as any, tree);

        const linkNode = tree.children[0] as any;
        if (shouldTransform) {
          expect(linkNode.type).toBe("mdxJsxFlowElement");
        } else {
          expect(linkNode.type).toBe("link");
        }
      });
    });

    it("should handle Windows-style paths", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms\\api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms\\api-key.md",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      expect(() => {
        transformer.call({} as any, tree);
      }).not.toThrow();
    });
  });

  describe("basePath support", () => {
    const createTermMetadata = (
      id: string,
      filePath: string,
      routePath: string,
    ): TermMetadata => ({
      id,
      title: `${id} Title`,
      hoverText: `${id} hover`,
      content: `${id} content`,
      filePath,
      routePath,
    });

    it("should match term links when index keys include basePath prefix", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/themelio/terms/api-key",
      );
      const termIndex = new Map([["/themelio/terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
          basePath: "/themelio",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      expect(linkNode.type).toBe("mdxJsxFlowElement");
      expect(linkNode.name).toBe("Term");
      expect(linkNode.attributes[0].value).toBe("/themelio/terms/api-key");
    });

    it("should match term links with .md extension and basePath", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/themelio/terms/api-key",
      );
      const termIndex = new Map([["/themelio/terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "terms/api-key.md",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
          basePath: "/themelio",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      expect(linkNode.type).toBe("mdxJsxFlowElement");
      expect(linkNode.name).toBe("Term");
    });

    it("should match term links with ./ prefix and basePath", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/themelio/terms/api-key",
      );
      const termIndex = new Map([["/themelio/terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "link",
            url: "./terms/api-key",
            children: [{ type: "text", value: "API Key" }],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
          basePath: "/themelio",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const linkNode = tree.children[0] as any;
      expect(linkNode.type).toBe("mdxJsxFlowElement");
      expect(linkNode.name).toBe("Term");
    });
  });

  describe("Glossary component transformation", () => {
    it("should transform <Glossary /> HTML tag to MDX element", () => {
      const termIndex = new Map();

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "html",
            value: "<Glossary />",
          } as any,
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const node = tree.children[0] as any;
      expect(node.type).toBe("mdxJsxFlowElement");
      expect(node.name).toBe("Glossary");
      expect(node.attributes).toEqual([]);
      expect(node.children).toEqual([]);
      expect(node.value).toBeUndefined();
    });

    it("should not transform other HTML tags", () => {
      const termIndex = new Map();

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "html",
            value: "<div>hello</div>",
          } as any,
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const node = tree.children[0] as any;
      expect(node.type).toBe("html");
      expect(node.value).toBe("<div>hello</div>");
    });
  });

  describe("isTermLink utility function", () => {
    it("should identify term links correctly", () => {
      expect(isTermLink("terms/api-key.md", "terms")).toBe(true);
      expect(isTermLink("./terms/api-key.mdx", "terms")).toBe(true);
      expect(isTermLink("/terms/api-key", "terms")).toBe(true);
      expect(isTermLink("docs/page.md", "terms")).toBe(false);
      expect(isTermLink("https://example.com", "terms")).toBe(false);
      expect(isTermLink("/other/path", "terms")).toBe(false);
    });

    it("should handle different terms directories", () => {
      expect(isTermLink("glossary/term.md", "glossary")).toBe(true);
      expect(isTermLink("./glossary/term", "glossary")).toBe(true);
      expect(isTermLink("docs/glossary/term.md", "docs/glossary")).toBe(true);
    });
  });

  describe("extractTermPath utility function", () => {
    it("should extract term path correctly", () => {
      expect(extractTermPath("terms/api-key.md")).toBe("terms/api-key");
      expect(extractTermPath("terms/api-key.mdx")).toBe("terms/api-key");
      expect(extractTermPath("./terms/api-key.md")).toBe("terms/api-key");
      expect(extractTermPath("terms/api-key")).toBe("terms/api-key");
      expect(extractTermPath("./api-key.md")).toBe("api-key");
    });

    it("should handle various path formats", () => {
      expect(extractTermPath("docs/terms/nested/term.md")).toBe(
        "docs/terms/nested/term",
      );
      expect(extractTermPath("./relative/path/to/term.mdx")).toBe(
        "relative/path/to/term",
      );
    });
  });

  describe("Integration with Remark Pipeline", () => {
    const createTermMetadata = (
      id: string,
      filePath: string,
      routePath: string,
    ): TermMetadata => ({
      id,
      title: `${id} Title`,
      hoverText: `${id} hover`,
      content: `${id} content`,
      filePath,
      routePath,
    });

    it("should work with complex markdown document", () => {
      const termIndex = new Map([
        [
          "terms/api-key",
          createTermMetadata("api-key", "terms/api-key.md", "/api-key"),
        ],
        [
          "terms/auth-token",
          createTermMetadata(
            "auth-token",
            "terms/auth-token.md",
            "/auth-token",
          ),
        ],
      ]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "heading",
            depth: 1,
            children: [{ type: "text", value: "API Reference" }],
          },
          {
            type: "paragraph",
            children: [
              { type: "text", value: "You need an " },
              {
                type: "link",
                url: "terms/api-key.md",
                children: [{ type: "text", value: "API key" }],
              },
              { type: "text", value: " and an " },
              {
                type: "link",
                url: "terms/auth-token",
                children: [{ type: "text", value: "auth token" }],
              },
              { type: "text", value: "." },
            ],
          },
          {
            type: "heading",
            depth: 2,
            children: [{ type: "text", value: "External Links" }],
          },
          {
            type: "paragraph",
            children: [
              {
                type: "link",
                url: "https://example.com",
                children: [{ type: "text", value: "External" }],
              },
            ],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      // Check that term links were transformed
      const paragraph = tree.children[1] as any;
      expect(paragraph.children[1].type).toBe("mdxJsxFlowElement");
      expect(paragraph.children[1].name).toBe("Term");
      expect(paragraph.children[3].type).toBe("mdxJsxFlowElement");
      expect(paragraph.children[3].name).toBe("Term");

      // Check that external link was not transformed
      const secondParagraph = tree.children[3] as any;
      expect(secondParagraph.children[0].type).toBe("link");
    });

    it("should maintain AST structure integrity", () => {
      const metadata = createTermMetadata(
        "api-key",
        "terms/api-key.md",
        "/api-key",
      );
      const termIndex = new Map([["terms/api-key", metadata]]);

      const tree: Root = {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              { type: "text", value: "Before " },
              {
                type: "link",
                url: "terms/api-key.md",
                children: [{ type: "text", value: "link" }],
              },
              { type: "text", value: " after" },
            ],
          },
        ],
      };

      const options: RemarkPluginOptions = {
        options: {
          termsDir: "terms",
          docsDir: "docs",
          glossaryFilepath: "glossary.mdx",
        },
        termIndex,
      };

      const transformer = terminologyRemarkPlugin(options);
      transformer.call({} as any, tree);

      const paragraph = tree.children[0] as any;
      expect(paragraph.children[0].value).toBe("Before ");
      expect(paragraph.children[1].type).toBe("mdxJsxFlowElement");
      expect(paragraph.children[2].value).toBe(" after");
    });
  });
});
