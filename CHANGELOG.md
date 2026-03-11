# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-24

### Added
- Initial release of `@grnet/rspress-plugin-terminology`
- **Term Definitions** - Define terms in markdown files with frontmatter (id, title, hoverText)
- **Hover Tooltips** - Interactive term tooltips that appear on hover over term links
- **Auto-Generated Glossary** - Automatically inject glossary component with all terms sorted alphabetically
- **Custom Components Support** - Provide custom Term and Glossary components via configuration
- **Base Path Support** - Configure base path for sites hosted in subdirectories
- **Debug Logging** - Comprehensive debug logging with namespace filtering
- **XSS Protection** - Built-in DOMPurify sanitization for all user-generated content
- **TypeScript Support** - Full TypeScript definitions included
- **React 18+ Support** - Compatible with React 18 and above
- **Rspress 2.0+ Integration** - Built for Rspress 2.0 static site generator

### Features
- **Build-time Processing** - Scans term files and generates JSON data during build
- **Remark Plugin Integration** - Transforms markdown links into interactive Term components
- **Multi-source Glossary Loading** - Fetches glossary data from multiple fallback paths
- **Error Handling** - Graceful fallbacks when terms or glossary cannot be loaded
- **CSS Styling** - Default styles included with full customization support
- **Pre-commit Hooks** - Automatic linting and testing before commits

### Configuration Options
- `termsDir` - Directory containing term definition files
- `docsDir` - Root documentation directory
- `glossaryFilepath` - Path to glossary markdown file
- `basePath` - Base path for sites in subdirectories
- `termPreviewComponentPath` - Custom Term component path
- `glossaryComponentPath` - Custom Glossary component path
- `debug` - Enable debug logging (boolean or object with namespaces)

### Development Tools
- **Biome** - Fast linter and formatter configured
- **Jest** - Unit testing framework with 221 tests
- **Playwright** - End-to-end testing
- **GitHub Actions** - CI/CD pipelines for testing and releases
- **Pre-commit Hooks** - simple-git-hooks for quality checks

### Security
- DOMPurify sanitization for all HTML content
- XSS prevention tests included
- Dependency review automation
- Security-focused development practices

### Documentation
- Comprehensive README with quick start guide
- Debug examples and configuration guide
- Security documentation (SECURITY.md)
- Contributing guidelines (CONTRIBUTING.md)
- Example project included

### Migration Notes
- Ported from `@grnet/docusaurus-terminology` for Rspress
- Configuration format adapted for Rspress plugin system
- Component API updated for React 18+ and Rspress runtime

[1.0.0]: https://github.com/grnet/rspress-plugin-terminology/releases/tag/v1.0.0
