# Security Policy

## XSS Prevention in @grnet/rspress-plugin-terminology

This project takes security seriously, particularly Cross-Site Scripting (XSS) prevention when rendering HTML content.

### Overview

The @grnet/rspress-plugin-terminology plugin renders user-provided HTML content in tooltips and glossary definitions. To prevent XSS attacks, all HTML content is sanitized using **DOMPurify** before rendering.

### Security Architecture

```
User Content (Markdown) → HTML Conversion → DOMPurify Sanitization → Safe Rendering
```

### Implementation

#### Sanitization Utilities

All HTML sanitization is handled by the `sanitize.ts` module:

- **`sanitizeHTML(html)`**: General-purpose sanitization for glossary definitions
- **`sanitizeHoverText(html)`**: Stricter sanitization for tooltip content
- **`safeHTML(html)`**: Type-safe wrapper that validates input before sanitization

#### Security Configuration

DOMPurify is configured with strict security rules:

```typescript
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'code', 'pre', 'blockquote',
    'sub', 'sup', 'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'target'],
  FORCE_HTTPS: true,
  REMOVE_COMMENTS: true
};
```

#### What Gets Blocked

- Script tags and inline JavaScript
- Event handlers (onclick, onerror, onload, etc.)
- javascript: and data: URLs
- iframes, embeds, and objects
- Style tags with potentially malicious content
- HTML comments
- All SVG-based XSS vectors

### Usage in Components

#### TermComponent (Tooltips)

```tsx
import { sanitizeHoverText } from './sanitize';

<div
  className="term-hover-text"
  dangerouslySetInnerHTML={{ __html: sanitizeHoverText(metadata.hoverText) }}
/>
```

#### GlossaryComponent (Definitions)

```tsx
import { sanitizeHTML } from './sanitize';

<div
  className="glossary-definition"
  dangerouslySetInnerHTML={{ __html: sanitizeHTML(metadata.hoverText) }}
/>
```

### Security Best Practices

#### For Content Authors

1. **Keep it simple**: Use basic markdown formatting when possible
2. **Avoid scripts**: Never include JavaScript in term definitions
3. **Link safely**: Use https:// URLs for external links
4. **Validate sources**: Only import content from trusted sources

#### For Developers

1. **Never bypass sanitization**: Always use the sanitize utilities
2. **Use type-safe functions**: Prefer `safeHTML()` for untrusted input
3. **Review configuration**: Check `sanitize.ts` before modifying ALLOWED_TAGS/ATTR
4. **Run security tests**: Execute `npm test` before deployment

### Testing

The project includes comprehensive security tests covering:

- Script tag removal
- Event handler stripping
- Dangerous URL filtering (javascript:, data:)
- iframe/embed/object blocking
- SVG-based XSS prevention
- Real-world XSS attack vectors

Run security tests:

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

### Reporting Vulnerabilities

If you discover a security vulnerability, please:

1. **Do not** create a public issue
2. **Do** send an email to: devs@lists.grnet.gr
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

Security reports will be investigated promptly, and patches will be released as soon as possible.

### Security Updates

Security updates will be:

1. Released as patch version updates (e.g., 1.0.0 → 1.0.1)
2. Announced in the release notes
3. Tagged with the `security` label in issues

### Dependencies

This project uses DOMPurify for HTML sanitization:

- **Package**: dompurify
- **Version**: ^3.0.0
- **Purpose**: XSS prevention through HTML sanitization
- **Updates**: Monitor for security updates and upgrade promptly

### Compliance

This security policy aims to comply with:

- **OWASP Top 10**: XSS protection (A03:2021 – Injection)
- **CWE-79**: Cross-site Scripting
- **Security Best Practices**: Defense in depth through sanitization

## License

Copyright © 2024 GRNET

This project is licensed under the BSD-2-Clause License.
