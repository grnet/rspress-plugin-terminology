/**
 * Unit Tests for GlossaryComponent
 *
 * Tests the glossary page component that displays all terms
 */

import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { TermMetadata } from "../../types";
import GlossaryComponent from "../GlossaryComponent";

// Mock window._cachedGlossary and window.__RSPRESS_TERMINOLOGY__
declare global {
  interface Window {
    _cachedGlossary?: Record<string, TermMetadata>;
    __RSPRESS_TERMINOLOGY__?: {
      terms?: Record<string, TermMetadata>;
    };
  }
}

// Mock usePageData
const mockUsePageData = jest.fn();

globalThis.usePageData = mockUsePageData;

// Mock fetch
global.fetch = jest.fn();

const mockGlossaryData: Record<string, TermMetadata> = {
  "/terms/api-key": {
    id: "api-key",
    title: "API Key",
    hoverText: "A unique identifier used to authenticate.",
    content: "Full API key content.",
    filePath: "/docs/terms/api-key.md",
    routePath: "/terms/api-key",
  },
  "/terms/oauth": {
    id: "oauth",
    title: "OAuth",
    hoverText: "An open standard for access delegation.",
    content: "Full OAuth content.",
    filePath: "/docs/terms/oauth.md",
    routePath: "/terms/oauth",
  },
  "/terms/rate-limiting": {
    id: "rate-limiting",
    title: "Rate Limiting",
    hoverText: "Limiting the number of requests.",
    content: "Full rate limiting content.",
    filePath: "/docs/terms/rate-limiting.md",
    routePath: "/terms/rate-limiting",
  },
};

describe("GlossaryComponent", () => {
  beforeEach(() => {
    // Clear mocks
    delete (window as any)._cachedGlossary;
    delete (window as any).__RSPRESS_TERMINOLOGY__;
    jest.clearAllMocks();

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("with pre-loaded page data", () => {
    beforeEach(() => {
      mockUsePageData.mockReturnValue({
        page: {
          terminology: {
            terms: mockGlossaryData,
          },
        },
      });
    });

    it("should render glossary with pre-loaded data", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const container = document.querySelector(".glossary-container");
        expect(container).toBeInTheDocument();
      });
    });

    it("should display glossary container and list", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const container = document.querySelector(".glossary-container");
        expect(container).toBeInTheDocument();

        const list = container?.querySelector(".glossary-list");
        expect(list).toBeInTheDocument();
      });
    });

    it("should display all glossary items", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const items = document.querySelectorAll(".glossary-item");
        expect(items).toHaveLength(3);
      });
    });

    it("should display terms in alphabetical order", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const titles = document.querySelectorAll(".glossary-term");
        expect(titles[0]).toHaveTextContent("API Key");
        expect(titles[1]).toHaveTextContent("OAuth");
        expect(titles[2]).toHaveTextContent("Rate Limiting");
      });
    });

    it("should display term titles as links", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const links = screen.getAllByRole("link");
        expect(links.length).toBeGreaterThan(0);

        // First link should be API Key
        expect(links[0]).toHaveAttribute("href", "/terms/api-key");
        expect(links[0]).toHaveTextContent("API Key");
      });
    });

    it("should display term definitions", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const definitions = document.querySelectorAll(".glossary-definition");
        expect(definitions.length).toBe(3);

        expect(definitions[0]).toHaveTextContent(
          "A unique identifier used to authenticate.",
        );
      });
    });

    it("should sanitize HTML in definitions", async () => {
      const maliciousData: Record<string, TermMetadata> = {
        "/terms/malicious": {
          id: "malicious",
          title: "Malicious",
          hoverText: '<script>alert("xss")</script>Safe content',
          content: "Full content",
          filePath: "/docs/terms/malicious.md",
          routePath: "/terms/malicious",
        },
      };

      mockUsePageData.mockReturnValue({
        page: {
          terminology: {
            terms: maliciousData,
          },
        },
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        const definition = screen
          .getByText("Safe content")
          .closest(".glossary-definition");
        expect(definition).toBeInTheDocument();
        expect(definition?.innerHTML).not.toContain("<script>");
      });
    });

    it("should allow safe HTML in definitions", async () => {
      const safeData: Record<string, TermMetadata> = {
        "/terms/safe": {
          id: "safe",
          title: "Safe Term",
          hoverText: "This has <strong>bold</strong> and <em>italic</em> text.",
          content: "Full content",
          filePath: "/docs/terms/safe.md",
          routePath: "/terms/safe",
        },
      };

      mockUsePageData.mockReturnValue({
        page: {
          terminology: {
            terms: safeData,
          },
        },
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        const definition = screen
          .getByText(/This has/)
          .closest(".glossary-definition");
        expect(definition).toBeInTheDocument();
        expect(definition?.innerHTML).toContain("<strong>");
        expect(definition?.innerHTML).toContain("<em>");
      });
    });
  });

  describe("with window.__RSPRESS_TERMINOLOGY__ data", () => {
    it("should use window.__RSPRESS_TERMINOLOGY__.terms when available", async () => {
      // Set up window data
      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: mockGlossaryData,
      };

      // No page data
      mockUsePageData.mockReturnValue({
        page: {},
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        const container = document.querySelector(".glossary-container");
        expect(container).toBeInTheDocument();

        const items = document.querySelectorAll(".glossary-item");
        expect(items).toHaveLength(3);
      });

      // Should not fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should prioritize window.__RSPRESS_TERMINOLOGY__ over page data", async () => {
      // Set up window data
      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: mockGlossaryData,
      };

      // Different page data
      mockUsePageData.mockReturnValue({
        page: {
          terminology: {
            terms: {
              "/terms/different": {
                id: "different",
                title: "Different Term",
                hoverText: "Different definition",
                content: "Full content",
                filePath: "/docs/terms/different.md",
                routePath: "/terms/different",
              },
            },
          },
        },
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        // Should use window data (3 items) not page data (1 item)
        const items = document.querySelectorAll(".glossary-item");
        expect(items).toHaveLength(3);
      });
    });
  });

  describe("with fetch fallback", () => {
    beforeEach(() => {
      // No pre-loaded data
      mockUsePageData.mockReturnValue({
        page: {},
      });
    });

    it("should fetch glossary from /docs/glossary.json", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => mockGlossaryData,
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/static/glossary.json");
      });

      await waitFor(() => {
        const container = document.querySelector(".glossary-container");
        expect(container).toBeInTheDocument();
        // Verify at least one glossary item is rendered
        const items = document.querySelectorAll(".glossary-item");
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it("should cache fetched glossary data", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => mockGlossaryData,
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        const container = document.querySelector(".glossary-container");
        expect(container).toBeInTheDocument();
      });

      // Check cache
      expect((window as any)._cachedGlossary).toEqual(mockGlossaryData);
    });

    it("should use cached glossary on subsequent renders", async () => {
      (window as any)._cachedGlossary = mockGlossaryData;

      render(<GlossaryComponent />);

      // Should not fetch
      expect(global.fetch).not.toHaveBeenCalled();

      await waitFor(() => {
        const container = document.querySelector(".glossary-container");
        expect(container).toBeInTheDocument();
      });
    });

    it("should handle fetch errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(<GlossaryComponent />);

      await waitFor(() => {
        const errorMessage = screen.getByText(/Error loading glossary/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass("glossary-error");
      });
    });

    it("should handle non-OK response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        const errorMessage = screen.getByText(/Error loading glossary/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe("loading state", () => {
    beforeEach(() => {
      mockUsePageData.mockReturnValue({
        page: {},
      });

      let _resolveFetch: (value: any) => void;
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            _resolveFetch = resolve;
          }),
      );
    });

    it("should show loading indicator while fetching", async () => {
      render(<GlossaryComponent />);

      const loading = screen.getByText("Loading glossary...");
      expect(loading).toBeInTheDocument();
      expect(loading).toHaveClass("glossary-loading");
    });
  });

  describe("empty state", () => {
    it("should show empty state when no terms exist", async () => {
      mockUsePageData.mockReturnValue({
        page: {
          terminology: {
            terms: {},
          },
        },
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        const empty = screen.getByText("No terms found.");
        expect(empty).toBeInTheDocument();
        expect(empty.className).toContain("glossary-empty");
      });
    });

    it("should show empty state when glossary data is null", async () => {
      mockUsePageData.mockReturnValue({
        page: {
          terminology: {
            terms: null,
          },
        },
      });

      // Mock successful fetch that returns empty data
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => ({}),
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        const empty = screen.getByText("No terms found.");
        expect(empty).toBeInTheDocument();
        expect(empty.className).toContain("glossary-empty");
      });
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      mockUsePageData.mockReturnValue({
        page: {
          terminology: {
            terms: mockGlossaryData,
          },
        },
      });
    });

    it("should have semantic heading structure for terms", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const headings = screen.getAllByRole("heading", { level: 3 });
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    it("should have accessible term links", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const apiLink = screen.getByRole("link", { name: "API Key" });
        expect(apiLink).toBeInTheDocument();
        expect(apiLink).toHaveAttribute("href", "/terms/api-key");
      });
    });

    it("should group terms in list container", async () => {
      render(<GlossaryComponent />);

      await waitFor(() => {
        const glossaryList = document.querySelector(".glossary-list");
        expect(glossaryList).toBeInTheDocument();

        const items = glossaryList?.querySelectorAll(".glossary-item");
        expect(items?.length).toBeGreaterThan(0);
      });
    });
  });

  describe("GlossaryItem sub-component", () => {
    it("should render item with correct structure", async () => {
      mockUsePageData.mockReturnValue({
        page: {
          terminology: {
            terms: {
              "/terms/test": {
                id: "test",
                title: "Test Term",
                hoverText: "Test definition",
                content: "Full content",
                filePath: "/docs/terms/test.md",
                routePath: "/terms/test",
              },
            },
          },
        },
      });

      render(<GlossaryComponent />);

      await waitFor(() => {
        const item = document.querySelector(".glossary-item");
        expect(item).toBeInTheDocument();

        const termTitle = document.querySelector(".glossary-term");
        expect(termTitle).toBeInTheDocument();

        const definition = document.querySelector(".glossary-definition");
        expect(definition).toBeInTheDocument();
      });
    });
  });
});
