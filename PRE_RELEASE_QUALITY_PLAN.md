# Pre-Release Quality Improvement Plan
## @grnet/rspress-plugin-terminology

**Release Target**: Next week (7 days)
**Type**: Low-risk public release of internal tool
**Working Mode**: Solo developer, quality-first approach
**Current State**: 23.1% test coverage, 3 failing tests, 1 positioning bug

---

## 🎯 Project Context

### Core Features (Critical)
1. **Glossary generation** - Auto-generated glossary page with all terms
2. **Term pages** - Individual term definition pages in doc site
3. **Tooltip preview** - Popup term tooltip on hover (CRITICAL UX feature)

### Known Issues
- ❌ Tooltip positioning bug: tooltips open to the right instead of on top of links
- ❌ 3 failing GlossaryComponent tests
- ❌ Test coverage at 23.1% (target: 75%+ with high-quality tests)
- ❌ No linting/formatting tools configured

### Package Renaming Required
- **Old**: `rspress-terminology`
- **New**: `@grnet/rspress-plugin-terminology`
- **Scope**: All references in code, docs, examples, configs

---

## 📋 Quality Standards & Success Criteria

### Test Coverage Philosophy
- **Target**: 75%+ coverage with meaningful, deep tests
- **Priority**: Quality over numbers - prefer 75% high-value tests over 80% shallow tests
- **Focus**: Critical user paths (Tooltip, remark-plugin, server-impl) tested deeply

### Code Quality Standards
- **Linting**: Biome with strict configuration
- **Formatting**: Biome formatter (2 spaces, consistent style)
- **TypeScript**: Strict mode already enabled ✅
- **Pre-commit Hooks**: Biome lint + tests must pass

### Security Requirements
- **Dependency Scanning**: `npm audit` with critical vulnerabilities fixed
- **XSS Protection**: Validate DOMPurify sanitization in tests
- **Known Vulnerabilities**: Zero high/critical npm audit issues

### Performance Benchmarks
- **Build Time**: Measure and establish baseline
- **Runtime Overhead**: Minimal impact on Rspress build
- **Bundle Size**: Track client-side bundle impact

---

## 🗓️ 7-Day Execution Plan

### **Day 1: Foundation - Renaming & Biome Setup**

#### Morning: Package Renaming (3 hours)
```bash
# Create feature branch
git checkout -b feat/rename-and-quality-improvements

# Files to update:
- package.json (name, repo URL, keywords, description)
- README.md (all installation/usage examples)
- example/package.json (dependency reference)
- example/rspress.config.ts (plugin import)
- src/ code (search for string references)
- Test files (descriptions, expectations)
- Any .github/ workflows

# Verification:
npm run build  # Must succeed
npm run test   # Expect existing 3 failures, no NEW ones
```

#### Afternoon: Biome Setup (4 hours)
```bash
# Install
npm install --save-dev @biomejs/biome

# Create biome.json with strict config
# Run initial scan
biome check src

# Fix all Biome issues systematically
# Add npm scripts: lint, format, lint:fix
```

**Exit Criteria**:
- ✅ Package renamed, builds successfully
- ✅ Biome configured and all issues fixed
- ✅ No new test failures introduced

---

### **Day 2: Critical Bug Fixes**

#### Morning: Tooltip Positioning Fix (4 hours)
- Investigate positioning logic in Tooltip.tsx (currently 0% tested)
- Fix bug: tooltips should appear on top, not to the right
- Add focused unit test for positioning calculation
- Manual browser testing (Chrome, Firefox, Safari)

#### Afternoon: Failing Tests (3 hours)
- Fix 3 GlossaryComponent test failures
- Root cause: `Cannot read properties of undefined (reading 'get')`
- Ensure zero test failures

**Exit Criteria**:
- ✅ Tooltip positions correctly (verified in browser)
- ✅ All tests pass: `npm run test`
- ✅ Code passes Biome checks

---

### **Day 3: Critical Path Test Coverage**

#### Tooltip.tsx (4 hours) - 0% → 80%+
**Deep, meaningful tests:**
```typescript
// Focus areas:
✓ Positioning logic (top/right/bottom/left + viewport overflow)
✓ Hover interactions (show/hide/timing)
✓ Content sanitization (XSS prevention with DOMPurify)
✓ Accessibility (ARIA attributes, keyboard navigation)
✓ Edge cases (long content, rapid hover/unhover, viewport edges)
```

#### remark-plugin.ts (3 hours) - 0% → 75%+
**Markdown transformation critical path:**
```typescript
✓ Term link detection and parsing [[term-id]]
✓ AST transformation correctness
✓ Edge cases (malformed syntax, nested links, special characters)
✓ Integration with Remark pipeline
```

**Exit Criteria**:
- ✅ User-facing tooltip fully tested
- ✅ Markdown processing has solid test foundation

---

### **Day 4: Server-Side Test Coverage**

#### server-impl.ts (5 hours) - 0% → 70%+
**Build-time processing:**
```typescript
✓ Term data loading from filesystem
✓ Glossary generation logic
✓ Data structure validation
✓ Error handling (missing files, malformed frontmatter)
✓ Build output correctness
```

#### build.ts (2 hours) - 0% → 60%+
**Build orchestration:**
```typescript
✓ Happy path: successful build
✓ Error scenarios: missing directories, invalid config
✓ Integration with Rspress lifecycle
```

**Exit Criteria**:
- ✅ Server-side code has solid test coverage
- ✅ Build process tested and reliable

---

### **Day 5: Component Test Completion**

#### Glossary.tsx & Term.tsx (3 hours) - 0% → 80%+
```typescript
✓ Term listing and rendering
✓ Alphabetical sorting
✓ Filtering/search (if applicable)
✓ Empty states
✓ Error states
```

#### GlossaryComponent.tsx (2 hours) - 87% → 95%+
```typescript
✓ Fill coverage gaps: lines 51, 95-97, 107-110
✓ Error boundary scenarios
✓ Loading states
```

#### Coverage Assessment (2 hours)
- Run `npm run test:coverage`
- Identify remaining gaps
- Add targeted tests if needed to reach 75%+

**Exit Criteria**:
- ✅ All React components tested
- ✅ Coverage ≥75% with high-quality tests

---

### **Day 6: E2E, Security & Performance**

#### Morning: E2E Validation (3 hours)
```typescript
// tooltip.spec.ts enhancement
✓ Tooltip positioning in real browser (validates bug fix)
✓ Multiple viewport sizes (responsive behavior)
✓ Accessibility with real screen reader testing
✓ User journey: navigate → hover → view glossary
```

#### Afternoon: Security & Performance (4 hours)

**Security Scanning:**
```bash
# Dependency vulnerabilities
npm audit
npm audit fix  # Fix non-breaking updates
# Review and fix critical/high vulnerabilities

# XSS Protection Validation
# Ensure DOMPurify tests cover malicious input
# Test: <script>, <img onerror>, event handlers
```

**Performance Benchmarking:**
```bash
# Build time measurement
time npm run build  # Establish baseline

# Bundle size analysis
# Check dist/ output sizes
# Runtime overhead: measure plugin impact on Rspress build

# Document benchmarks:
- Build time: X seconds
- Client bundle: Y KB
- Server processing: Z ms per term
```

**Exit Criteria**:
- ✅ E2E tests validate critical paths
- ✅ Zero high/critical security vulnerabilities
- ✅ Performance benchmarks documented

---

### **Day 7: Validation & Release Prep**

#### Morning: Pre-Commit Hooks (2 hours)
```bash
# Install simple-git-hooks
npm install --save-dev simple-git-hooks

# Add to package.json:
"simple-git-hooks": {
  "pre-commit": "npm run lint && npm run test"
}

# Install hooks
npx simple-git-hooks
```

#### Afternoon: Final Validation (5 hours)
```bash
# Quality Gates:
✓ npm run lint           # All Biome checks pass
✓ npm run test:coverage  # ≥75% all metrics
✓ npm run test:e2e       # E2E tests pass
✓ npm run build          # Clean build
✓ npm audit              # Zero critical/high vulnerabilities

# Manual Testing:
✓ cd example && npm run dev
✓ Test tooltip positioning (multiple scenarios)
✓ Test glossary page generation
✓ Test term pages rendering
✓ Verify all features work with renamed package
```

**Final Release Checklist:**
- [ ] Package renamed to `@grnet/rspress-plugin-terminology`
- [ ] All tests pass (unit + E2E)
- [ ] Test coverage ≥75% with meaningful tests
- [ ] Biome linting passes (strict mode)
- [ ] Tooltip positioning bug fixed and tested
- [ ] Pre-commit hooks configured
- [ ] Security: zero critical/high vulnerabilities
- [ ] Performance benchmarks documented
- [ ] Example site works correctly
- [ ] README updated with new package name
- [ ] Ready for `npm publish` to @grnet org

---

## 📊 Success Metrics

### Test Coverage Targets
| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| Tooltip.tsx | 0% | 80%+ | CRITICAL |
| remark-plugin.ts | 0% | 75%+ | CRITICAL |
| server-impl.ts | 0% | 70%+ | HIGH |
| Glossary.tsx | 0% | 80%+ | HIGH |
| Term.tsx | 0% | 80%+ | HIGH |
| GlossaryComponent.tsx | 87% | 95%+ | MEDIUM |
| build.ts | 0% | 60%+ | LOW |
| **OVERALL** | **23.1%** | **75%+** | **REQUIRED** |

### Quality Gates
- ✅ Zero test failures
- ✅ ≥75% test coverage (all metrics: statements, branches, functions, lines)
- ✅ Biome strict mode passes
- ✅ Tooltip bug fixed (verified in browser + E2E)
- ✅ Zero critical/high security vulnerabilities
- ✅ Performance benchmarks documented
- ✅ Pre-commit hooks prevent bad commits

---

## 🔧 Technical Details

### Renaming Scope
**Package name changes:**
- `package.json`: `"name": "@grnet/rspress-plugin-terminology"`
- `package.json`: Update repository URL to GRNET GitHub
- `README.md`: All installation examples
- `example/package.json`: Dependency reference

**Code references:**
```bash
# Search for all occurrences:
grep -r "rspress-terminology" src/
grep -r "rspress-terminology" example/

# Common locations:
- Import statements
- Comments
- Error messages
- Debug output
- Test descriptions
```

### Biome Configuration (biome.json)
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["dist", "node_modules", "**/*.d.ts"]
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

### Testing Strategy

**Unit Tests (Jest + Testing Library):**
- Deep, meaningful tests over shallow coverage
- Focus on critical user paths
- Test behavior, not implementation
- Include edge cases and error scenarios

**E2E Tests (Playwright):**
- Real browser validation
- Critical user journeys
- Accessibility testing
- Visual regression for tooltip positioning

**Security Tests:**
- XSS prevention with malicious HTML input
- DOMPurify sanitization validation
- Dependency vulnerability scanning

**Performance Tests:**
- Build time benchmarking
- Bundle size tracking
- Runtime overhead measurement

---

## 🚨 Risk Mitigation

### Known Risks
1. **Tooltip bug complexity**: Assumed straightforward - buffer time if not
2. **Coverage reaching 75%**: Focus on quality, accept 70% if tests are excellent
3. **Biome refactoring**: Might reveal code quality issues requiring fixes
4. **Time constraints**: 7 days is tight - prioritize ruthlessly

### Mitigation Strategies
- **Day 1 buffer**: If renaming takes longer, compress Biome setup
- **Day 7 buffer**: Reserved for unexpected issues
- **Quality over coverage**: Ship at 70% with great tests vs 75% shallow tests
- **Incremental validation**: Run tests after each major change

---

## 📝 Notes for Execution Agent

### Context
- Solo developer, quality-first mindset
- Low-risk public release (internal tool going public)
- Next week deadline (flexible by 1-2 days if needed for quality)
- Tooltip positioning bug is straightforward to fix
- User wants strict Biome configuration
- Coverage target: 75%+ with meaningful tests

### Priorities (in order)
1. **Rename package** - Foundation for all other work
2. **Fix bugs** - Tooltip positioning + failing tests
3. **Critical path tests** - Tooltip, remark-plugin, server-impl
4. **Component tests** - Complete React component coverage
5. **Security & performance** - Scanning and benchmarking
6. **Quality gates** - Biome, pre-commit hooks, final validation

### Success Definition
A production-ready `@grnet/rspress-plugin-terminology` package with:
- Zero bugs
- 75%+ meaningful test coverage
- Strict code quality enforcement
- Security validated
- Performance benchmarked
- Ready for npm publish to @grnet organization

---

## 📚 Reference Links

- Current repo: `/Users/dimitristsironis/code/rspress-terminology`
- Package manager: npm
- Test framework: Jest (unit) + Playwright (E2E)
- Linter/Formatter: Biome (to be installed)
- Target org: @grnet (GitHub + npm)

**Generated**: 2026-03-14
**For**: Pre-release quality improvements and package rename
**Execution**: Fresh agent context recommended
