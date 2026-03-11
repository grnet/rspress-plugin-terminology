/**
 * Security Tests for HTML Sanitization
 *
 * Tests to verify XSS attack prevention through DOMPurify sanitization
 */

import { sanitizeHTML, sanitizeHoverText, safeHTML } from '../sanitize';

describe('HTML Sanitization Security', () => {
  describe('sanitizeHoverText', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("XSS")</script>Hello';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('should remove inline event handlers', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('onclick');
    });

    it('should remove javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove data: URLs with script content', () => {
      const malicious = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('data:');
    });

    it('should remove iframe and embed tags', () => {
      const malicious = '<iframe src="evil.com"></iframe><embed src="evil.swf"/>';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<embed');
    });

    it('should allow safe formatting tags', () => {
      const safe = '<p>Hello <strong>world</strong> and <em>emphasis</em></p>';
      const sanitized = sanitizeHoverText(safe);
      expect(sanitized).toContain('<strong>world</strong>');
      expect(sanitized).toContain('<em>emphasis</em>');
    });

    it('should allow safe links with https', () => {
      const safe = '<a href="https://example.com">Safe link</a>';
      const sanitized = sanitizeHoverText(safe);
      expect(sanitized).toContain('href="https://example.com"');
    });

    it('should allow http links but preserve security attributes', () => {
      const httpLink = '<a href="http://example.com">Link</a>';
      const sanitized = sanitizeHoverText(httpLink);
      expect(sanitized).toContain('href="http://example.com"');
      expect(sanitized).toContain('<a');
      expect(sanitized).toContain('>Link<');
    });

    it('should remove HTML comments', () => {
      const withComment = '<p>Hello</p><!-- malicious comment --><p>World</p>';
      const sanitized = sanitizeHoverText(withComment);
      expect(sanitized).not.toContain('<!--');
      expect(sanitized).not.toContain('-->');
    });

    it('should handle empty or null input', () => {
      expect(sanitizeHoverText('')).toBe('');
      expect(sanitizeHoverText(null as any)).toBe('');
      expect(sanitizeHoverText(undefined as any)).toBe('');
      expect(sanitizeHoverText(123 as any)).toBe('');
    });

    it('should prevent XSS via img onerror', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')">';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('onerror');
    });

    it('should prevent XSS via SVG script', () => {
      const malicious = '<svg><script>alert(\'XSS\')</script></svg>';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('<script>');
    });

    it('should allow code tags for terminology', () => {
      const safe = '<code>function foo() {}</code>';
      const sanitized = sanitizeHoverText(safe);
      expect(sanitized).toContain('<code>');
    });
  });

  describe('sanitizeHTML', () => {
    it('should allow more HTML elements than sanitizeHoverText', () => {
      const html = '<h1>Title</h1><ul><li>Item 1</li><li>Item 2</li></ul>';
      const sanitized = sanitizeHTML(html);
      expect(sanitized).toContain('<h1>Title</h1>');
      expect(sanitized).toContain('<li>Item 1</li>');
    });

    it('should still remove dangerous elements', () => {
      const malicious = '<script>alert("XSS")</script><h1>Title</h1>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<h1>Title</h1>');
    });

    it('should remove style tags with potential XSS', () => {
      const malicious = '<style>body { background: url("javascript:alert(\'XSS\')") }</style>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('<style>');
    });
  });

  describe('safeHTML', () => {
    it('should return empty string for null/undefined', () => {
      expect(safeHTML(null)).toBe('');
      expect(safeHTML(undefined)).toBe('');
    });

    it('should return empty string for non-string values', () => {
      expect(safeHTML(123)).toBe('');
      expect(safeHTML({})).toBe('');
      expect(safeHTML([])).toBe('');
    });

    it('should sanitize valid string input', () => {
      const html = '<p>Hello <script>alert("XSS")</script></p>';
      const result = safeHTML(html);
      expect(result).toContain('Hello');
      expect(result).not.toContain('<script>');
    });
  });

  describe('Real-world XSS attack vectors', () => {
    it('should prevent XSS via img src with javascript', () => {
      const malicious = '<img src="javascript:alert(\'XSS\')">';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should prevent XSS via formaction attribute', () => {
      const malicious = '<form><button formaction="javascript:alert(\'XSS\')">Click</button></form>';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('formaction');
    });

    it('should prevent XSS via autofocus', () => {
      const malicious = '<input autofocus onfocus="alert(\'XSS\')">';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('onfocus');
    });

    it('should prevent XSS via details element', () => {
      const malicious = '<details open ontoggle="alert(\'XSS\')">Summary</details>';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('ontoggle');
    });

    it('should prevent XSS via object tag', () => {
      const malicious = '<object data="javascript:alert(\'XSS\')"></object>';
      const sanitized = sanitizeHoverText(malicious);
      expect(sanitized).not.toContain('<object');
    });
  });
});
