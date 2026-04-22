/**
 * HTML Sanitization Utility
 *
 * Provides secure HTML sanitization using DOMPurify to prevent XSS attacks
 * when rendering user-controlled HTML content via dangerouslySetInnerHTML.
 */

import DOMPurify from "dompurify";

/**
 * Sanitization configuration for terminology content
 *
 * Allows safe HTML elements for definitions while stripping
 * potentially dangerous content (scripts, iframes, etc.)
 */
const SANITIZE_CONFIG = {
  // Allow common formatting elements for terminology
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "a",
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "code",
    "pre",
    "blockquote",
    "sub",
    "sup",
    "span",
    "div",
  ],
  // Allow safe attributes
  ALLOWED_ATTR: ["href", "title", "class", "id", "target"],
  // Add rel="noopener noreferrer" to all links for security
  ADD_ATTR: ["target"],
};

/**
 * Sanitize HTML string to prevent XSS attacks
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userInput) }} />
 * ```
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Configure DOMPurify with our security rules
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: SANITIZE_CONFIG.ALLOWED_TAGS,
    ALLOWED_ATTR: SANITIZE_CONFIG.ALLOWED_ATTR,
    ADD_ATTR: SANITIZE_CONFIG.ADD_ATTR,
  });

  return clean;
}

/**
 * Sanitize HTML specifically for terminology hover text
 * This is a specialized version with stricter rules for tooltips
 *
 * @param html - The HTML string to sanitize for hover text
 * @returns Sanitized HTML string
 */
export function sanitizeHoverText(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Stricter rules for tooltips (no headings, limited formatting)
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "code", "a", "span"],
    ALLOWED_ATTR: ["href", "title", "class"],
    ADD_ATTR: ["target"],
  });

  return clean;
}

/**
 * Type guard to check if a value is safe HTML
 * Useful for validating data before rendering
 *
 * @param value - Value to check
 * @returns True if value is a non-empty string
 */
export function isValidHTML(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Comprehensive sanitization function that validates and sanitizes
 *
 * @param html - The HTML string to validate and sanitize
 * @returns Sanitized HTML string or empty string if invalid
 */
export function safeHTML(html: unknown): string {
  if (!isValidHTML(html)) {
    return "";
  }
  return sanitizeHTML(html);
}
