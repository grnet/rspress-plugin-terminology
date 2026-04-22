/**
 * Unit Tests for init-terminology
 *
 * Tests client-side terminology initialization logic
 */

import type { TermMetadata } from "../../types";
import { initTerminology } from "../init-terminology";

// Mock fetch globally
global.fetch = jest.fn();

describe("initTerminology", () => {
  const mockTermData: Record<string, TermMetadata> = {
    "/terms/test": {
      id: "test",
      title: "Test Term",
      hoverText: "Test description",
      content: "Full content",
      filePath: "/docs/terms/test.md",
      routePath: "/terms/test",
    },
  };

  beforeEach(() => {
    // Clear window mocks
    delete (window as any).__RSPRESS_TERMINOLOGY__;
    delete (window as any).__pageData;
    jest.clearAllMocks();
  });

  describe("initialization from pageData", () => {
    it("should initialize from window.__pageData if available", () => {
      (window as any).__pageData = {
        page: {
          terminology: {
            terms: mockTermData,
          },
        },
      };

      initTerminology();

      expect((window as any).__RSPRESS_TERMINOLOGY__).toBeDefined();
      expect((window as any).__RSPRESS_TERMINOLOGY__.terms).toEqual(
        mockTermData,
      );
    });

    it("should not reinitialize if already exists", () => {
      (window as any).__RSPRESS_TERMINOLOGY__ = {
        terms: mockTermData,
      };

      const initialTerms = (window as any).__RSPRESS_TERMINOLOGY__.terms;

      initTerminology();

      // Should be the same reference (not reinitialized)
      expect((window as any).__RSPRESS_TERMINOLOGY__.terms).toBe(initialTerms);
    });

    it("should handle missing page data gracefully", () => {
      (window as any).__pageData = {};

      initTerminology();

      // Should attempt to fetch glossary.json
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should handle null page data", () => {
      (window as any).__pageData = null;

      initTerminology();

      // Should attempt to fetch glossary.json
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should handle errors when accessing page data", () => {
      // Make pageData throw an error when accessed
      Object.defineProperty(window, "__pageData", {
        get: () => {
          throw new Error("Access denied");
        },
        configurable: true,
      });

      initTerminology();

      // Should attempt to fetch glossary.json as fallback
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("fallback to fetch glossary.json", () => {
    it("should try /static/glossary.json first", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/json" : null,
        },
        json: async () => mockTermData,
      });

      initTerminology();

      // Wait for async fetch to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith("/static/glossary.json");
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect((window as any).__RSPRESS_TERMINOLOGY__).toBeDefined();
    });

    it("should try multiple paths in order", async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"))
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "application/json" : null,
          },
          json: async () => mockTermData,
        });

      initTerminology();

      // Wait for async fetches
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should have tried multiple paths
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith("/static/glossary.json");
      expect(global.fetch).toHaveBeenCalledWith("/glossary.json");
      expect(global.fetch).toHaveBeenCalledWith("/api/glossary.json");
    });

    it("should skip non-JSON responses", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "text/html" : null,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "application/json" : null,
          },
          json: async () => mockTermData,
        });

      initTerminology();

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should have tried second path since first was not JSON
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should handle all paths failing", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      initTerminology();

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should have tried all paths
      expect(global.fetch).toHaveBeenCalledTimes(3);

      // Should not have initialized
      expect((window as any).__RSPRESS_TERMINOLOGY__).toBeUndefined();
    });

    it("should handle non-ok fetch responses", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      initTerminology();

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should have tried all paths
      expect(global.fetch).toHaveBeenCalledTimes(3);

      // Should not have initialized
      expect((window as any).__RSPRESS_TERMINOLOGY__).toBeUndefined();
    });
  });
});
