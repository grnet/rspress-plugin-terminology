# Rspress Terminology Example

An example project demonstrating the `rspress-terminology` plugin.

## Running the Example

1. **Install dependencies:**
   ```bash
   cd example
   npm install
   ```

2. **Build the plugin:**
   ```bash
   cd ..
   npm run build
   ```

3. **Start the dev server:**
   ```bash
   cd example
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## What to Look For

1. **Hover Tooltips** - Hover over any linked term (like "API Key") to see a tooltip with the definition
2. **Glossary Page** - Visit `/glossary` to see all terms listed with their definitions
3. **Source Code** - Check `docs/terms/` to see how terms are defined

## Example Terms Defined

- [API Key](./docs/terms/api-key) - Authentication tokens
- [Rate Limiting](./docs/terms/rate-limiting) - Request throttling
- [Webhook](./docs/terms/webhook) - HTTP callbacks
- [OAuth](./docs/terms/oauth) - Authorization standard

## Project Structure

```
example/
├── docs/
│   ├── index.md           # Home page with term examples
│   ├── glossary.md        # Auto-generated glossary
│   ├── api-guide.md       # More term usage examples
│   ├── nav.en.md          # Navigation configuration
│   └── terms/             # Term definitions
│       ├── api-key.md
│       ├── rate-limiting.md
│       ├── webhook.md
│       └── oauth.md
├── rspress.config.ts      # Plugin configuration
└── package.json
```
