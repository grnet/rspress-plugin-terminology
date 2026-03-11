# rspress-terminology

> A plugin for Rspress that enables terminology management with hover tooltips and auto-generated glossaries.

This plugin is a port of [@grnet/docusaurus-terminology](https://github.com/grnet/docusaurus-terminology) for the Rspress static site generator.

## Features

- 🔤 **Term Definitions** - Define terms in markdown files with frontmatter
- 🎯 **Hover Tooltips** - Display term definitions when hovering over links
- 📚 **Auto-Generated Glossary** - Automatically create a glossary page with all terms
- 🔗 **Link Transformation** - Automatically transform markdown links to interactive components
- 🎨 **Customizable Components** - Use built-in components or provide your own
- ⚡ **Fast & Efficient** - Pre-loads data during build, minimal runtime overhead
- 🐛 **Debug Logging** - Built-in debug utility with namespace-based logging for troubleshooting
- 🛡️ **Security** - Built-in XSS protection using DOMPurify sanitization

## Installation

```bash
npm install rspress-terminology --save
# or
yarn add rspress-terminology
# or
pnpm add rspress-terminology
```

## Quick Start

### Try the Example First!

The easiest way to see the plugin in action is to run the included example:

```bash
cd rspress-terminology

# Build the plugin
npm run build

# Install example dependencies
cd example
npm install

# Start the dev server
npm run dev
```

Then open `http://localhost:3000` and:
- Hover over linked terms to see tooltips
- Visit the Glossary page
- Explore the source code in `docs/terms/`

### Using in Your Project

### 1. Configure the Plugin

Add the plugin to your `rspress.config.ts`:

```typescript
import { defineConfig } from '@rspress/core';
import { terminologyPlugin } from 'rspress-terminology';

export default defineConfig({
  // ... other config
  plugins: [
    terminologyPlugin({
      termsDir: './docs/terms',           // Directory containing term definitions
      docsDir: './docs/',                  // Root documentation directory
      glossaryFilepath: './docs/glossary.md'  // Path to glossary page
    })
  ]
});
```

### 2. Create Term Definitions

Create markdown files in your `docs/terms/` directory:

```markdown
---
id: api-key
title: API Key
hoverText: A unique identifier used to authenticate a user or application.
---

An API key is a secret token that identifies the calling application or user. API keys are used to track and control how the API is being used, prevent malicious use, and calculate usage fees.
```

### 3. Create Glossary Page

Create `docs/glossary.md`:

```markdown
---
title: Glossary
---

# Glossary

Welcome to the glossary. All terms from the documentation are listed below.

```

The plugin will automatically inject the `<Glossary />` component into this file.

### 4. Use Terms in Your Documentation

Reference terms using standard markdown link syntax:

```markdown
To use the API, you need an [API Key](./terms/api-key).
```

This will automatically be transformed into an interactive link with a hover tooltip.

## Configuration

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `termsDir` | `string` | Yes | Directory containing term definition files (e.g., `'./docs/terms'`) |
| `docsDir` | `string` | Yes | Root documentation directory (e.g., `'./docs/'`) |
| `glossaryFilepath` | `string` | Yes | Path to glossary markdown file (e.g., `'./docs/glossary.md'`) |
| `basePath` | `string` | No | Base path for the site (e.g., `'/my-site'`). Useful when hosting in a subdirectory. |
| `termPreviewComponentPath` | `string` | No | Custom path to Term preview component |
| `glossaryComponentPath` | `string` | No | Custom path to Glossary view component |
| `debug` | `boolean \| object` | No | Enable debug logging. See [Debug Configuration](#debug-configuration) below. |

### Example with Custom Components

```typescript
terminologyPlugin({
  termsDir: './docs/terms',
  docsDir: './docs/',
  glossaryFilepath: './docs/glossary.md',
  termPreviewComponentPath: './components/CustomTerm.tsx',
  glossaryComponentPath: './components/CustomGlossary.tsx'
})
```

### Example with Base Path

If your site is hosted in a subdirectory (e.g., `https://example.com/docs/`), use `basePath`:

```typescript
terminologyPlugin({
  termsDir: './docs/terms',
  docsDir: './docs/',
  glossaryFilepath: './docs/glossary.md',
  basePath: '/docs'  // Links will be /docs/terms/term instead of /terms/term
})
```

### Debug Configuration

The plugin includes a built-in debug logging utility to help troubleshoot issues.

#### Enable All Debug Logs

```typescript
terminologyPlugin({
  termsDir: './docs/terms',
  docsDir: './docs/',
  glossaryFilepath: './docs/glossary.md',
  debug: true  // Enable all debug logs
})
```

#### Advanced Debug Configuration

```typescript
terminologyPlugin({
  termsDir: './docs/terms',
  docsDir: './docs/',
  glossaryFilepath: './docs/glossary.md',
  debug: {
    enabled: true,
    timestamps: true,  // Include timestamps in logs
    namespaces: [      // Only log specific namespaces
      'build:*',       // All build operations
      'plugin:load'    // Plugin loading
    ]
  }
})
```

#### Using Environment Variables

You can also control debug logging via environment variable:

```bash
# Enable all debug logs
RSPRESS_TERMINOLOGY_DEBUG=1 npm run build

# Enable specific namespaces
RSPRESS_TERMINOLOGY_DEBUG=build:* npm run build

# Enable multiple namespaces (comma-separated)
RSPRESS_TERMINOLOGY_DEBUG=plugin:load,build:index npm run build
```

#### Available Namespaces

- **`plugin`** - Main plugin lifecycle events
  - `plugin:load` - Loading glossary JSON
  - `plugin:build` - Build phase events
  - `plugin:page` - Page data extension
  - `plugin:inject` - HTML injection events
- **`build`** - Build-time operations
  - `build:index` - Term indexing operations
  - `build:glossary` - Glossary JSON generation
  - `build:inject` - Component injection
  - `build:copy` - File copying operations

For more examples and detailed usage, see [DEBUG_EXAMPLES.md](DEBUG_EXAMPLES.md).

## Term Definition Format

Each term file should include:

```markdown
---
id: unique-term-id        # Required: Unique identifier
title: Term Title          # Required: Display title
hoverText: Short definition shown on hover  # Optional: Hover text
---

Full term explanation and details here...
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the term |
| `title` | `string` | Yes | Display title of the term |
| `hoverText` | `string` | No | Short description shown on hover (supports markdown) |

## Custom Components

### Custom Term Component

Create a custom term preview component:

```typescript
// components/CustomTerm.tsx
import React from 'react';
import type { TermMetadata } from 'rspress-terminology';

interface CustomTermProps {
  pathName: string;
  children?: React.ReactNode;
}

export default function CustomTerm({ pathName, children }: CustomTermProps) {
  const [term, setTerm] = React.useState<TermMetadata | null>(null);

  React.useEffect(() => {
    fetch(`${pathName}.json`)
      .then(res => res.json())
      .then(setTerm);
  }, [pathName]);

  return (
    <span className="custom-term">
      <a href={pathName}>{children || term?.title}</a>
      {/* Custom tooltip implementation */}
    </span>
  );
}
```

### Custom Glossary Component

```typescript
// components/CustomGlossary.tsx
import React from 'react';
import type { TermMetadata } from 'rspress-terminology';

export default function CustomGlossary() {
  const [terms, setTerms] = React.useState<Record<string, TermMetadata>>({});

  React.useEffect(() => {
    fetch('/docs/glossary.json')
      .then(res => res.json())
      .then(setTerms);
  }, []);

  return (
    <div className="custom-glossary">
      <h1>Glossary</h1>
      {Object.entries(terms).map(([path, term]) => (
        <div key={path}>
          <a href={path}>{term.title}</a>
        </div>
      ))}
    </div>
  );
}
```

## Styling

The plugin includes default styles. To customize, override these CSS classes:

### Term Link Classes

- `.term-link` - Base term link style
- `.term-link:hover` - Hover state
- `.term-link-loading` - Loading state
- `.term-link-error` - Error state

### Tooltip Classes

- `.rspress-terminology-tooltip` - Tooltip container
- `.term-tooltip-content` - Tooltip content wrapper
- `.term-title` - Term title in tooltip
- `.term-hover-text` - Hover text content

### Glossary Classes

- `.glossary-container` - Glossary wrapper
- `.glossary-item` - Individual glossary entry
- `.glossary-term` - Term title
- `.glossary-definition` - Term definition

### Custom Styles

Add custom styles in your Rspress theme:

```css
/* src/styles/custom.css */
.term-link {
  text-decoration-style: dotted;
  color: #3b82f6;
}

.rspress-terminology-tooltip {
  max-width: 400px;
  padding: 16px;
}
```

## How It Works

### Build Process

1. **beforeBuild Hook**
   - Scans `termsDir` for markdown files
   - Parses frontmatter from each term file
   - Builds term index
   - Generates `glossary.json`
   - Creates individual `.json` files for each term

2. **extendPageData Hook**
   - Attaches term index to page data
   - Makes terms available via `usePageData()`

3. **Remark Plugin**
   - Transforms `[term](path/to/term.md)` links
   - Converts to `<Term pathName="...">text</Term>` components
   - Uses AST transformation for reliability

### Runtime

- **Term Component** - Fetches term data from JSON or uses pre-loaded data
- **Glossary Component** - Displays all terms in a sorted list
- **Tooltip** - Shows hover text using `rc-tooltip`

## Migration from Docusaurus

If you're migrating from `@grnet/docusaurus-terminology`:

### Configuration Changes

**Docusaurus:**
```javascript
module.exports = {
  plugins: [
    ['@grnet/docusaurus-terminology', {
      termsDir: './docs/terms',
      docsDir: './docs/',
      glossaryFilepath: './docs/glossary.md'
    }]
  ]
};
```

**Rspress:**
```typescript
import { terminologyPlugin } from 'rspress-terminology';

export default defineConfig({
  plugins: [
    terminologyPlugin({
      termsDir: './docs/terms',
      docsDir: './docs/',
      glossaryFilepath: './docs/glossary.md'
    })
  ]
});
```

### Component Changes

- `@docusaurus/BrowserOnly` → No longer needed (client-side fetching handled internally)
- `@docusaurus/useBaseUrl` → `usePageData()` from `rspress/runtime`
- `@docusaurus/Link` → Standard `<a>` tags (Rspress handles routing)

## Development

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Testing

The project includes comprehensive security tests to verify XSS prevention:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

See [SECURITY.md](SECURITY.md) for detailed security information.

### Testing Locally

```bash
# Link your local version
npm link

# In your rspress project
npm link rspress-terminology
```

## Troubleshooting

### Terms Not Showing

1. Check that term files are in the correct directory (`termsDir`)
2. Verify each term has required frontmatter (`id`, `title`)
3. Check browser console for fetch errors
4. Ensure `glossary.json` is generated in your output

### Tooltips Not Appearing

1. Check that `mdxRs: false` is set (required for remark plugins)
2. Verify links use correct relative paths
3. Check browser console for JavaScript errors

### Glossary Empty

1. Ensure `glossary.md` exists at specified path
2. Check that `<Glossary />` component is injected
3. Verify `glossary.json` is generated during build

## License

BSD-2-Clause

## Credits

Ported from [@grnet/docusaurus-terminology](https://github.com/grnet/docusaurus-terminology)

Original implementation for Docusaurus by GRNET Developers.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**Note:** This is the Rspress version of the terminology plugin. For Docusaurus, see [@grnet/docusaurus-terminology](https://github.com/grnet/docusaurus-terminology).
