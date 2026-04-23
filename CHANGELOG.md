# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1-alpha.1](https://github.com/grnet/rspress-plugin-terminology/compare/rspress-plugin-terminology-v1.1.0-alpha.1...rspress-plugin-terminology-v1.1.1-alpha.1) (2026-04-23)


### Bug Fixes

* auto-detect basePath from rspress config for subpath deployments ([627e4c7](https://github.com/grnet/rspress-plugin-terminology/commit/627e4c77383a67ca4c5346a41c364f3247e57592))
* auto-detect basePath from rspress config for subpath deployments ([3a1a932](https://github.com/grnet/rspress-plugin-terminology/commit/3a1a9323edf1ae68338055971c745ac7e371d241))


### Miscellaneous

* remove NPM_TOKEN, use OIDC trusted publishing for provenance ([89b47b1](https://github.com/grnet/rspress-plugin-terminology/commit/89b47b1631f1ee0e501a892167635acba33bfc95))

## [1.1.0-alpha.1](https://github.com/grnet/rspress-plugin-terminology/compare/rspress-plugin-terminology-v1.0.0-alpha.1...rspress-plugin-terminology-v1.1.0-alpha.1) (2026-04-22)


### Features

* add release-please automation and OIDC provenance publishing ([01f20d6](https://github.com/grnet/rspress-plugin-terminology/commit/01f20d659651266136d53abb63b4bc406656d782))
* Add security testing, debug logging, and open source readiness ([8be0ad3](https://github.com/grnet/rspress-plugin-terminology/commit/8be0ad3f259aeb6b2ae1f8c5e4324859b040790a))
* Comprehensive quality improvements, CI/CD, and v1.0.0 preparation ([0a4ea36](https://github.com/grnet/rspress-plugin-terminology/commit/0a4ea36d2eac6bd622b8d3be2d3ede0d53ee1aa2))


### Bug Fixes

* remove no-op replace in getRuntimeDir ([2dad51c](https://github.com/grnet/rspress-plugin-terminology/commit/2dad51cfd0701da0a0bd0259bade2d2653b04f02))
* resolve e2e test failures across all browsers ([a341ac9](https://github.com/grnet/rspress-plugin-terminology/commit/a341ac9d7bb5a35d3bf17776de129c3c3a4e774e))


### Miscellaneous

* improve code and fix bugs ([a104ab2](https://github.com/grnet/rspress-plugin-terminology/commit/a104ab241bdeaef1e502e6c904f7ab92d282dd9f))
* prepare for v1.0.0 release ([a104ab2](https://github.com/grnet/rspress-plugin-terminology/commit/a104ab241bdeaef1e502e6c904f7ab92d282dd9f))
* raise coverage thresholds to 80% ([0baef0e](https://github.com/grnet/rspress-plugin-terminology/commit/0baef0ea6cbd5bf04b39a000419164d4a208067d))

## [1.0.0-alpha.1] - 2026-04-22

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

[1.0.0-alpha.1]: https://github.com/grnet/rspress-plugin-terminology/releases/tag/v1.0.0-alpha.1
