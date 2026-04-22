/**
 * Unit Tests for TermComponent
 *
 * Tests the interactive term link with hover tooltip functionality
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import type { TermMetadata } from "../../types";
import { Term } from "../TermComponent";

// Mock the Tooltip component
jest.mock("../Tooltip", () => ({
  __esModule: true,
  default: ({ overlay, children, placement }: any) => (
    <div data-testid="tooltip-wrapper" data-placement={placement}>
      {children}
      {overlay && <div data-testid="tooltip-content">{overlay}</div>}
    </div>
  ),
}));

// Mock initTerminology
jest.mock("../init-terminology", () => ({
  initTerminology: jest.fn(),
}));

// Mock window.__RSPRESS_TERMINOLOGY__
declare global {
  interface Window {
    __RSPRESS_TERMINOLOGY__?: {
      terms: Record<string, TermMetadata>;
    };
    _cachedTerms?: Record<string, TermMetadata>;
  }
}

const mockTermData: TermMetadata = {
  id: "test-term",
  title: "Test Term",
  hoverText: "This is a test term with **markdown** formatting.",
  content: "Full content of the test term.",
  filePath: "/docs/terms/test-term.md",
  routePath: "/terms/test-term",
};

describe("TermComponent", () => {
  beforeEach(() => {
    // Clear window mocks
    delete (window as any).__RSPRESS_TERMINOLOGY__;
    delete (window as any)._cachedTerms;

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("with pre-loaded terminology data", () => {
    beforeEach(() => {
      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: {
          "/terms/test-term": mockTermData,
          "terms/test-term": mockTermData,
        },
      };
    });

    it("should render with pre-loaded term data", async () => {
      render(<Term pathName="/terms/test-term">Test Link Text</Term>);

      // Should render the link with provided text
      const link = screen.getByText("Test Link Text");
      expect(link).toBeInTheDocument();
      expect(link).toHaveClass("term-link");
      expect(link).toHaveAttribute("href", "/terms/test-term");
    });

    it("should use term title as fallback text", async () => {
      render(<Term pathName="/terms/test-term" />);

      const link = screen.getByRole("link", { name: "Test Term" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveClass("term-link");
    });

    it("should find term with leading slash", async () => {
      render(<Term pathName="/terms/test-term" />);

      await waitFor(() => {
        const tooltipContent = screen.queryByTestId("tooltip-content");
        expect(tooltipContent).toBeInTheDocument();
      });
    });

    it("should find term without leading slash", async () => {
      render(<Term pathName="terms/test-term" />);

      await waitFor(() => {
        const tooltipContent = screen.queryByTestId("tooltip-content");
        expect(tooltipContent).toBeInTheDocument();
      });
    });

    it("should pass placement prop to Tooltip", async () => {
      render(
        <Term pathName="/terms/test-term" placement="top">
          Test Term
        </Term>,
      );

      await waitFor(() => {
        const tooltipWrapper = screen.getByTestId("tooltip-wrapper");
        expect(tooltipWrapper).toHaveAttribute("data-placement", "top");
      });
    });
  });

  describe("with fetch fallback", () => {
    beforeEach(() => {
      // No pre-loaded data
      delete (window as any).__RSPRESS_TERMINOLOGY__;
    });

    it("should fetch term data from glossary.json", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => ({
          "/terms/test-term": mockTermData,
        }),
      });

      render(<Term pathName="/terms/test-term">Test Term</Term>);

      // Initially should show link
      const link = screen.getByRole("link", { name: "Test Term" });
      expect(link).toBeInTheDocument();

      // Should load term data and show tooltip
      await waitFor(() => {
        const tooltipContent = screen.queryByTestId("tooltip-content");
        expect(tooltipContent).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith("/static/glossary.json");
    });

    it("should try multiple glossary.json paths", async () => {
      const mockFetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"))
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "application/json" : null,
          },
          json: async () => ({
            "/terms/test-term": mockTermData,
          }),
        });

      global.fetch = mockFetch;

      render(<Term pathName="/terms/test-term">Test Term</Term>);

      await waitFor(() => {
        const tooltipContent = screen.queryByTestId("tooltip-content");
        expect(tooltipContent).toBeInTheDocument();
      });

      // Should have tried multiple paths
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("should cache fetched term data when loading individual JSON", async () => {
      // Mock glossary fetch to fail, forcing individual JSON fetch
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTermData,
        });

      render(<Term pathName="/terms/test-term">Test Term</Term>);

      await waitFor(() => {
        const tooltipContent = screen.queryByTestId("tooltip-content");
        expect(tooltipContent).toBeInTheDocument();
      });

      // Check cache - individual term JSON should be cached
      expect((window as any)._cachedTerms).toBeDefined();
      expect((window as any)._cachedTerms["/terms/test-term.json"]).toEqual(
        mockTermData,
      );
    });

    it("should handle fetch errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(<Term pathName="/terms/test-term">Test Term</Term>);

      // Should still render link without tooltip
      const link = screen.getByText("Test Term");
      expect(link).toBeInTheDocument();
      expect(link).toHaveClass("term-link");

      // Should show error state class
      await waitFor(() => {
        expect(link).toHaveClass("term-link-error");
      });
    });
  });

  describe("tooltip content", () => {
    beforeEach(() => {
      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: {
          "/terms/test-term": mockTermData,
        },
      };
    });

    it("should display term title in tooltip", async () => {
      render(<Term pathName="/terms/test-term">Test Term</Term>);

      await waitFor(() => {
        const tooltipContent = screen.getByTestId("tooltip-content");
        expect(tooltipContent).toBeInTheDocument();

        const title = tooltipContent.querySelector(".term-title");
        expect(title).toBeInTheDocument();
        expect(title).toHaveTextContent("Test Term");
      });
    });

    it("should sanitize hover text in tooltip", async () => {
      const maliciousTerm: TermMetadata = {
        ...mockTermData,
        hoverText: '<script>alert("xss")</script>Safe content',
      };

      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: {
          "/terms/test-term": maliciousTerm,
        },
      };

      render(<Term pathName="/terms/test-term">Test Term</Term>);

      await waitFor(() => {
        const tooltipContent = screen.getByTestId("tooltip-content");
        expect(tooltipContent).toBeInTheDocument();
        expect(tooltipContent).not.toContainHTML("<script>");
      });
    });

    it("should allow safe HTML in hover text", async () => {
      const safeTerm: TermMetadata = {
        ...mockTermData,
        hoverText: "This has <strong>bold</strong> and <em>italic</em> text.",
      };

      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: {
          "/terms/test-term": safeTerm,
        },
      };

      render(<Term pathName="/terms/test-term">Test Term</Term>);

      await waitFor(() => {
        const tooltipContent = screen.getByTestId("tooltip-content");
        expect(tooltipContent).toBeInTheDocument();
        expect(tooltipContent.innerHTML).toContain("<strong>");
        expect(tooltipContent.innerHTML).toContain("<em>");
      });
    });
  });

  describe("loading and error states", () => {
    it("should show loading state when fetching", async () => {
      let resolveFetch: (value: any) => void;
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      );

      render(<Term pathName="/terms/test-term">Test Term</Term>);

      // Should show loading class initially
      const link = screen.getByRole("link", { name: "Test Term" });
      expect(link).toHaveClass("term-link-loading");

      // Resolve fetch after a brief delay to simulate async loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        resolveFetch!({
          ok: true,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "application/json" : null,
          },
          json: async () => ({
            "/terms/test-term": mockTermData,
          }),
        });
      });

      // Wait for loading to complete - tooltip content should appear
      await waitFor(
        () => {
          const tooltipContent = screen.queryByTestId("tooltip-content");
          expect(tooltipContent).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Get fresh reference to link after content is loaded
      const loadedLink = screen.getByRole("link", { name: "Test Term" });
      // Loading class should be gone once content is loaded
      expect(loadedLink).not.toHaveClass("term-link-loading");
    });

    it("should show error state on fetch failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Failed to fetch"),
      );

      render(<Term pathName="/terms/test-term">Test Term</Term>);

      await waitFor(() => {
        const link = screen.getByText("Test Term");
        expect(link).toHaveClass("term-link-error");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty pathName", () => {
      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: {},
      };

      render(<Term pathName="">Test Term</Term>);

      const link = screen.getByText("Test Term");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "");
    });

    it("should handle missing term data", async () => {
      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: {},
      };

      (global.fetch as jest.Mock).mockRejectedValue(new Error("Not found"));

      render(<Term pathName="/terms/non-existent">Test Term</Term>);

      await waitFor(() => {
        const link = screen.getByText("Test Term");
        expect(link).toHaveClass("term-link-error");
      });
    });

    it("should handle special characters in pathName", () => {
      render(<Term pathName="/terms/test-term?query=1">Test Term</Term>);

      const link = screen.getByText("Test Term");
      expect(link).toHaveAttribute("href", "/terms/test-term?query=1");
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: {
          "/terms/test-term": mockTermData,
        },
      };
    });

    it("should render accessible link element", () => {
      render(<Term pathName="/terms/test-term">Test Term</Term>);

      const link = screen.getByRole("link", { name: "Test Term" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/terms/test-term");
    });

    it("should provide descriptive link text", () => {
      render(<Term pathName="/terms/test-term">Accessible Term Link</Term>);

      const link = screen.getByRole("link", { name: "Accessible Term Link" });
      expect(link).toBeInTheDocument();
    });
  });
});
