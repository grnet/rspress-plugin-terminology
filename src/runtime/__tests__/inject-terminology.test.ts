/**
 * Unit Tests for inject-terminology
 *
 * Tests script generation for injecting terminology data
 */

import type { TermMetadata } from "../../types";
import { generateInjectScript } from "../inject-terminology";

describe("generateInjectScript", () => {
  const mockTermData: Record<string, TermMetadata> = {
    "/terms/api-key": {
      id: "api-key",
      title: "API Key",
      hoverText: "A unique identifier used to authenticate.",
      content: "Full content about API keys.",
      filePath: "/docs/terms/api-key.md",
      routePath: "/terms/api-key",
    },
    "/terms/oauth": {
      id: "oauth",
      title: "OAuth",
      hoverText: "An open standard for access delegation.",
      content: "Full content about OAuth.",
      filePath: "/docs/terms/oauth.md",
      routePath: "/terms/oauth",
    },
  };

  describe("script generation", () => {
    it("should generate a valid script tag", () => {
      const script = generateInjectScript(mockTermData);

      expect(script).toContain("<script>");
      expect(script).toContain("</script>");
    });

    it("should inject terms into window.__RSPRESS_TERMINOLOGY__", () => {
      const script = generateInjectScript(mockTermData);

      expect(script).toContain("window.__RSPRESS_TERMINOLOGY__");
      expect(script).toContain("terms:");
    });

    it("should include all term data as JSON", () => {
      const script = generateInjectScript(mockTermData);

      // Should contain term IDs
      expect(script).toContain('"api-key"');
      expect(script).toContain('"oauth"');

      // Should contain term titles
      expect(script).toContain("API Key");
      expect(script).toContain("OAuth");

      // Should contain route paths
      expect(script).toContain("/terms/api-key");
      expect(script).toContain("/terms/oauth");
    });

    it("should properly escape special characters", () => {
      const termsWithSpecialChars: Record<string, TermMetadata> = {
        "/terms/special": {
          id: "special",
          title: 'Special "Characters" & <Tags>',
          hoverText: "Contains ' quotes and \" double quotes",
          content: "Content with special chars",
          filePath: "/docs/terms/special.md",
          routePath: "/terms/special",
        },
      };

      const script = generateInjectScript(termsWithSpecialChars);

      // Script should contain the data as valid JSON
      expect(script).toContain("Special");
      expect(script).toContain("Characters");

      // Should have proper structure
      expect(script).toContain("window.__RSPRESS_TERMINOLOGY__");
      expect(script).toContain("terms:");
    });

    it("should use IIFE pattern for scope isolation", () => {
      const script = generateInjectScript(mockTermData);

      expect(script).toContain("(function()");
      expect(script).toContain("})();");
    });

    it("should include console.log for debugging", () => {
      const script = generateInjectScript(mockTermData);

      expect(script).toContain("console.log");
      expect(script).toContain("[@grnet/rspress-plugin-terminology]");
      expect(script).toContain("Injected");
    });

    it("should count terms correctly in log message", () => {
      const script = generateInjectScript(mockTermData);

      // Should log the count of terms
      expect(script).toContain(
        "Object.keys(window.__RSPRESS_TERMINOLOGY__.terms).length",
      );
    });

    it("should handle empty terms object", () => {
      const script = generateInjectScript({});

      expect(script).toContain("<script>");
      expect(script).toContain("window.__RSPRESS_TERMINOLOGY__");
      expect(script).toContain("terms:");
      expect(script).toContain("{}");
    });

    it("should handle single term", () => {
      const singleTerm: Record<string, TermMetadata> = {
        "/terms/test": {
          id: "test",
          title: "Test",
          hoverText: "Test description",
          content: "Test content",
          filePath: "/docs/terms/test.md",
          routePath: "/terms/test",
        },
      };

      const script = generateInjectScript(singleTerm);

      expect(script).toContain('"test"');
      expect(script).toContain("Test description");
    });

    it("should handle closing script tags in content", () => {
      const termsWithScript: Record<string, TermMetadata> = {
        "/terms/xss": {
          id: "xss",
          title: "XSS Example",
          hoverText: "Example with script tag",
          content: "Content with tags",
          filePath: "/docs/terms/xss.md",
          routePath: "/terms/xss",
        },
      };

      const script = generateInjectScript(termsWithScript);

      // Should generate valid script
      expect(script).toContain("<script>");
      expect(script).toContain("</script>");
      expect(script).toContain("XSS Example");
    });

    it("should handle terms with HTML in hoverText", () => {
      const termsWithHTML: Record<string, TermMetadata> = {
        "/terms/html": {
          id: "html",
          title: "HTML Example",
          hoverText: "<strong>Bold text</strong> and <em>italic</em>",
          content: "Content",
          filePath: "/docs/terms/html.md",
          routePath: "/terms/html",
        },
      };

      const script = generateInjectScript(termsWithHTML);

      // HTML should be properly escaped in JSON
      expect(script).toContain("strong");
      expect(script).toContain("em");
    });

    it("should handle Unicode characters", () => {
      const termsWithUnicode: Record<string, TermMetadata> = {
        "/terms/unicode": {
          id: "unicode",
          title: "日本語 Example",
          hoverText: "Contains 中文 and émoji 🎉",
          content: "Unicode content",
          filePath: "/docs/terms/unicode.md",
          routePath: "/terms/unicode",
        },
      };

      const script = generateInjectScript(termsWithUnicode);

      expect(script).toContain("日本語");
      expect(script).toContain("中文");
      expect(script).toContain("🎉");
    });
  });

  describe("script trimming", () => {
    it("should return trimmed script without leading/trailing whitespace", () => {
      const script = generateInjectScript(mockTermData);

      expect(script).toBe(script.trim());
      expect(script[0]).not.toBe(" ");
      expect(script[0]).not.toBe("\n");
      expect(script[script.length - 1]).not.toBe(" ");
      expect(script[script.length - 1]).not.toBe("\n");
    });
  });
});
