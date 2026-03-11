# Contributing to @grnet/rspress-plugin-terminology

Thank you for your interest in contributing to `@grnet/rspress-plugin-terminology`! This document provides everything you need to know to contribute effectively.

## Table of Contents

- [Overview](#overview)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)
- [Debugging](#debugging)
- [Release Process](#release-process)
- [Getting Help](#getting-help)

## Overview

`@grnet/rspress-plugin-terminology` is a plugin for [Rspres](https://rspress.dev/) that provides:

- **Term definitions** with frontmatter-based metadata
- **Hover tooltips** for interactive term explanations
- **Auto-generated glossary** pages
- **Link transformation** from markdown to interactive components

### Tech Stack

- **Runtime**: Node.js (see `.nvmrc` or package.json `engines`)
- **Language**: TypeScript (strict mode)
- **Build Tool**: TypeScript compiler
- **Framework**: Rspres plugin API
- **Dependencies**: `@rspress/core`, `react`, `remark` ecosystem

## Development Setup

### Prerequisites

- **Node.js**: v18.x or higher (check `.nvmrc` if present)
- **npm**: v8.x or higher
- **Git**: Latest stable version

### Installation

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/grnet/rspress-plugin-terminology.git
   cd rspress-plugin-terminology
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the plugin**:
   ```bash
   npm run build
   ```

4. **Verify the build**:
   ```bash
   ls -la dist/
   ```
   You should see compiled `.js` and `.d.ts` files.

### Linking for Local Development

To test changes in another local Rspres project:

1. **In rspress-plugin-terminology**:
   ```bash
   npm link
   ```

2. **In your Rspres project**:
   ```bash
   npm link @grnet/rspress-plugin-terminology
   ```

3. **Use in your Rspres config**:
   ```typescript
   import { terminologyPlugin } from '@grnet/rspress-plugin-terminology';
   ```

## Project Structure

```
rspress-plugin-terminology/
├── src/                      # TypeScript source code
│   ├── index.ts              # Client-side exports
│   ├── server.ts             # Main plugin entry point
│   ├── server-impl.ts        # Plugin implementation
│   ├── types.ts              # TypeScript definitions
│   ├── debug.ts              # Debug utilities
│   ├── remark-plugin.ts      # Markdown transformation
│   └── runtime/              # Client-side runtime
│       ├── init-terminology.ts
│       ├── inject-terminology.ts
│       └── styles.css
├── dist/                     # Compiled output (generated)
├── example/                  # Example Rspres project
│   ├── docs/                 # Example documentation
│   │   ├── terms/            # Term definitions
│   │   ├── glossary.md       # Auto-generated glossary
│   │   └── ...
│   ├── rspress.config.ts     # Plugin configuration
│   └── package.json
├── package.json              # Project metadata
├── tsconfig.json             # TypeScript configuration
├── README.md                 # User documentation
└── CONTRIBUTING.md           # This file
```

### Architecture Overview

**Server-Side** (`server.ts`, `server-impl.ts`):
- Build-time term indexing
- Glossary page generation
- Markdown transformation setup

**Client-Side** (`runtime/`):
- Tooltip component rendering
- Glossary display logic
- CSS injection for styling

**Plugin Hooks**:
- `beforeBuild` - Collect and index terms
- `extendPageData` - Transform markdown content
- `afterBuild` - Generate glossary page

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Edit TypeScript files in `src/`
   - Update example docs if testing features
   - Update types if changing APIs

3. **Watch for changes** during development:
   ```bash
   npm run dev
   ```
   This compiles TypeScript on file changes.

4. **Test your changes**:
   ```bash
   cd example
   npm run dev
   ```
   Open `http://localhost:3000` to see changes.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run dev` | Watch mode for development |
| `npm run build:watch` | Alias for `dev` |
| `npm run clean` | Remove `dist/` directory |
| `npm run prepublishOnly` | Build before publishing |

## Testing

### Current Testing Approach

This project uses the `example/` directory for integration testing:

1. **Manual Testing**:
   ```bash
   cd example
   npm install
   npm run dev
   ```

2. **Test Scenarios**:
   - Hover over term links to verify tooltips
   - Navigate to glossary page
   - Check term definitions render correctly
   - Test custom components if applicable

### Adding Test Cases

To add new test scenarios:

1. Create term definitions in `example/docs/terms/`:
   ```markdown
   ---
   id: your-term
   title: Your Term
   ---

   Definition of your term.
   ```

2. Reference terms in example docs:
   ```markdown
   See [your term](terms/your-term) for details.
   ```

3. Test the example project to verify behavior.

### Future Testing

Formal unit tests are planned. Contributions to add:
- Jest or Vitest setup
- Unit tests for core functions
- Integration tests for plugin hooks
- E2E tests with Playwright

are welcome!

## Code Style

### TypeScript Configuration

This project uses **strict TypeScript** mode:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### Coding Conventions

1. **Naming**:
   - **Components**: PascalCase (`TermComponent`)
   - **Functions**: camelCase (`processTerms`)
   - **Constants**: UPPER_SNAKE_CASE (`MAX_TERMS`)
   - **Types/Interfaces**: PascalCase (`TermData`)

2. **File Organization**:
   - One export per file when possible
   - Group related functions together
   - Add JSDoc comments for public APIs

3. **Error Handling**:
   - Use descriptive error messages
   - Log warnings with the debug system
   - Graceful degradation for missing data

4. **Comments**:
   - JSDoc for exported functions/types
   - Inline comments for complex logic
   - TODO comments for temporary workarounds

## Git Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding/updating tests
- `chore/` - Maintenance tasks

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(plugin): add custom term component option

fix(tooltip): prevent tooltip overflow on small screens

docs(readme): update installation instructions

refactor(runtime): extract tooltip rendering logic
```

### Pull Request Process

1. **Update your branch**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```

3. **Create a PR**:
   - Provide a clear title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Document any breaking changes

4. **PR Checklist**:
   - [ ] Code follows project conventions
   - [ ] Changes are tested in example project
   - [ ] Commit messages follow conventions
   - [ ] Documentation updated if needed
   - [ ] No TypeScript errors

## Debugging

### Built-in Debug System

The plugin includes a namespace-based debug system:

```typescript
import { createDebug } from './debug';

const debug = createDebug('terminology:plugin');
debug('Processing terms: %O', terms);
```

### Enabling Debug Logs

In your Rspres config:

```typescript
terminologyPlugin({
  debug: {
    enabled: true,
    namespaces: ['terminology:*'] // or specific: ['terminology:plugin']
  }
})
```

### Common Issues

**Issue**: Terms not linking correctly
- **Debug**: Enable `terminology:remark` namespace
- **Check**: Term IDs in frontmatter match link references

**Issue**: Glossary page not generating
- **Debug**: Enable `terminology:glossary` namespace
- **Check**: `glossaryFilepath` configuration

**Issue**: Tooltips not appearing
- **Debug**: Enable `terminology:runtime` namespace
- **Check**: Browser console for JavaScript errors
- **Verify**: CSS is being injected

## Release Process

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Publishing

1. **Update version** in `package.json`:
   ```bash
   npm version patch|minor|major
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Publish to npm**:
   ```bash
   npm publish
   ```

4. **Create a GitHub release** with changelog

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version number updated
- [ ] Changelog updated
- [ ] Example project tested

## Getting Help

### Resources

- **Rspres Docs**: https://rspress.dev/
- **Remark Docs**: https://github.com/remarkjs/remark
- **TypeScript Docs**: https://www.typescriptlang.org/docs/

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and ideas
- **Code Reviews**: Feedback on PRs

### Good First Issues

Look for issues labeled `good first issue` for starter tasks.

## License

By contributing, you agree that your contributions will be licensed under the **BSD-2-Clause License**.

---

**Thank you for contributing to @grnet/rspress-plugin-terminology!** 🎉
