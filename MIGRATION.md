# Rspress Terminology Plugin - Migration Summary

## 📦 Project Structure

```
rspress-terminology/
├── src/
│   ├── index.ts                      # Main plugin entry point
│   ├── types.ts                      # TypeScript type definitions
│   ├── utils.ts                      # Utility functions
│   ├── term-indexer.ts               # Term scanning and parsing
│   ├── glossary-generator.ts         # Glossary JSON generation
│   ├── remark-plugin.ts              # Link transformation plugin
│   └── runtime/
│       ├── Tooltip.tsx               # Reusable tooltip component
│       ├── TermComponent.tsx         # Term link with tooltip
│       ├── GlossaryComponent.tsx     # Glossary list view
│       └── styles.css                # Component styles
├── dist/                             # Build output (generated)
├── package.json                      # Package configuration
├── tsconfig.json                     # TypeScript configuration
├── README.md                         # User documentation
├── .gitignore                        # Git ignore rules
└── MIGRATION.md                      # This file
```

## 🔑 Key Architecture Differences

### Docusaurus (Original)

```
┌─────────────────────────────────────────────────────────────┐
│ Docusaurus Plugin                                           │
├─────────────────────────────────────────────────────────────┤
│ Entry: configureWebpack() → Webpack loaders                 │
│                                                              │
│ Loaders:                                                     │
│  ├─ webpack-glossary-loader → Process glossary.md           │
│  ├─ webpack-terms-loader → Parse term files                 │
│  └─ webpack-terms-replace-loader → Transform links          │
│                                                              │
│ State: terminology-store (singleton module)                 │
│ UI: @docusaurus/* components                                │
└─────────────────────────────────────────────────────────────┘
```

### Rspress (Ported)

```
┌─────────────────────────────────────────────────────────────┐
│ Rspress Plugin                                              │
├─────────────────────────────────────────────────────────────┤
│ Entry: terminologyPlugin() → RspressPlugin                 │
│                                                              │
│ Hooks:                                                      │
│  ├─ beforeBuild() → Scan and index terms                   │
│  ├─ extendPageData() → Attach data to pages                │
│  └─ markdown.remarkPlugins → Transform links               │
│                                                              │
│ State: Module-level variable (shared between hooks)         │
│ UI: React components (no Docusaurus deps)                   │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Component Mapping

| Docusaurus | Rspress | Notes |
|------------|---------|-------|
| `configureWebpack()` | `beforeBuild()` + `markdown` config | Build-time hooks |
| Webpack loaders | Remark plugin | Content transformation |
| `terminology-store` singleton | `sharedTermIndex` variable | State management |
| String replacement in loaders | AST transformation in remark | More reliable |
| `@docusaurus/BrowserOnly` | Client-side fetch + check | Not needed in Rspress |
| `@docusaurus/useBaseUrl` | `usePageData()` | Runtime data access |
| `@docusaurus/Link` | `<a>` tags | Rspress handles routing |

## 🔄 Data Flow Comparison

### Docusaurus

```
Build:
1. Webpack processes .md files
2. webpack-terms-loader parses terms → terminology-store
3. webpack-terms-replace-loader transforms links
4. webpack-glossary-loader injects Glossary component
5. Generates .json files alongside .md files

Runtime:
1. Term component fetches .json files
2. Uses window._cachedTerms for caching
```

### Rspress

```
Build:
1. beforeBuild() scans terms directory
2. Parses frontmatter → sharedTermIndex
3. Generates glossary.json
4. Generates individual term .json files
5. extendPageData() attaches index to page data
6. Remark plugin transforms links via AST

Runtime:
1. Check page.terminology.terms (pre-loaded)
2. Fallback to fetch .json files
3. Uses window._cachedTerms for caching
```

## 🚀 Usage Comparison

### Configuration

**Docusaurus:**
```javascript
// docusaurus.config.js
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
// rspress.config.ts
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

### Term Files (Same for Both)

```markdown
---
id: api-key
title: API Key
hoverText: A unique identifier used to authenticate.
---

Full explanation here...
```

### Usage in Documentation (Same for Both)

```markdown
Use your [API Key](./terms/api-key) to access the API.
```

## 🎯 Next Steps

### To Build and Test

1. **Install dependencies:**
   ```bash
   cd rspress-terminology
   npm install
   ```

2. **Build the plugin:**
   ```bash
   npm run build
   ```

3. **Link for local testing:**
   ```bash
   npm link
   ```

4. **In your Rspress project:**
   ```bash
   npm link rspress-terminology
   ```

5. **Add to rspress.config.ts:**
   ```typescript
   import { terminologyPlugin } from 'rspress-terminology';

   export default defineConfig({
     plugins: [terminologyPlugin({...})]
   });
   ```

### To Publish

1. Update version in `package.json`
2. Build: `npm run build`
3. Publish: `npm publish`

## 📝 Implementation Notes

### Key Design Decisions

1. **No Webpack Dependency** - Uses Rspress's plugin API instead of webpack loaders
2. **Remark Plugin** - Uses AST transformation for reliable link conversion
3. **Pre-loaded Data** - Uses `extendPageData()` to avoid unnecessary fetches
4. **Fallback Fetch** - Still supports runtime loading for flexibility
5. **No Docusaurus Imports** - Pure React components for portability

### Potential Enhancements

1. **HMR Support** - Add hot module replacement for term editing
2. **i18n** - Add internationalization support
3. **Search Integration** - Integrate with Rspress's search
4. **Caching** - Improve caching strategy
5. **Type Safety** - Stricter TypeScript types

---

**Status:** ✅ Complete - Ready for testing and usage

**Compatibility:** Rspress 1.0+, Node 16+, React 16.8+
