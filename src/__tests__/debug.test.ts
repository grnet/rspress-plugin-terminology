/**
 * Tests for debug.ts
 * Tests the conditional, namespace-based debug logging utility.
 */

// Re-require in each test to get a fresh DebugState singleton
type DebugModule = typeof import("../debug");

let mod: DebugModule;

const consoleSpy = {
  log: null as jest.SpyInstance | null,
  warn: null as jest.SpyInstance | null,
  error: null as jest.SpyInstance | null,
};

beforeEach(() => {
  jest.resetModules();
  delete process.env.RSPRESS_TERMINOLOGY_DEBUG;
  mod = require("../debug");
  consoleSpy.log = jest.spyOn(console, "log").mockImplementation();
  consoleSpy.warn = jest.spyOn(console, "warn").mockImplementation();
  consoleSpy.error = jest.spyOn(console, "error").mockImplementation();
});

afterEach(() => {
  delete process.env.RSPRESS_TERMINOLOGY_DEBUG;
  jest.restoreAllMocks();
});

// ─── isDebugEnabled / configureDebug ─────────────────────────────────────────

describe("isDebugEnabled", () => {
  it("is false by default", () => {
    expect(mod.isDebugEnabled()).toBe(false);
  });

  it("becomes true when enabled via options", () => {
    mod.configureDebug({ enabled: true });
    expect(mod.isDebugEnabled()).toBe(true);
  });

  it("becomes false when explicitly disabled", () => {
    mod.configureDebug({ enabled: true });
    mod.configureDebug({ enabled: false });
    expect(mod.isDebugEnabled()).toBe(false);
  });

  it("does not change state when options.enabled is omitted", () => {
    mod.configureDebug({ enabled: true });
    mod.configureDebug({ timestamps: true }); // no enabled field
    expect(mod.isDebugEnabled()).toBe(true);
  });
});

describe("configureDebug – env var takes precedence", () => {
  it('enables when env var is "1"', () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = "1";
    mod.configureDebug({});
    expect(mod.isDebugEnabled()).toBe(true);
  });

  it('enables when env var is "true"', () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = "true";
    mod.configureDebug({});
    expect(mod.isDebugEnabled()).toBe(true);
  });

  it('disables when env var is "false"', () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = "false";
    mod.configureDebug({ enabled: true }); // option ignored
    expect(mod.isDebugEnabled()).toBe(false);
  });

  it('disables when env var is "0"', () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = "0";
    mod.configureDebug({});
    expect(mod.isDebugEnabled()).toBe(false);
  });

  it("disables when env var is empty string", () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = "";
    mod.configureDebug({});
    expect(mod.isDebugEnabled()).toBe(false);
  });

  it("enables and parses namespace patterns when env var is a comma list", () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = "build,inject";
    mod.configureDebug({});
    expect(mod.isDebugEnabled()).toBe(true);
    expect(mod.isNamespaceDebugEnabled("build")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("inject")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("other")).toBe(false);
  });

  it("converts glob wildcard patterns from env var", () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = "build:*";
    mod.configureDebug({});
    expect(mod.isNamespaceDebugEnabled("build:index")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("inject")).toBe(false);
  });
});

describe("configureDebug – namespace options", () => {
  it("enables all namespaces when enabled with no patterns", () => {
    mod.configureDebug({ enabled: true });
    expect(mod.isNamespaceDebugEnabled("anything")).toBe(true);
  });

  it("filters to specific namespaces via options.namespaces", () => {
    mod.configureDebug({ enabled: true, namespaces: ["build", "inject"] });
    expect(mod.isNamespaceDebugEnabled("build")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("inject")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("other")).toBe(false);
  });

  it("supports glob wildcard in options.namespaces", () => {
    mod.configureDebug({ enabled: true, namespaces: ["plugin:*"] });
    expect(mod.isNamespaceDebugEnabled("plugin:build")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("plugin:load")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("build")).toBe(false);
  });

  it("returns false for any namespace when disabled", () => {
    mod.configureDebug({ enabled: false, namespaces: ["build"] });
    expect(mod.isNamespaceDebugEnabled("build")).toBe(false);
  });
});

// ─── isNamespaceDebugEnabled ──────────────────────────────────────────────────

describe("isNamespaceDebugEnabled", () => {
  it("returns false when debug is disabled", () => {
    expect(mod.isNamespaceDebugEnabled("build")).toBe(false);
  });

  it("returns true for any namespace when enabled with no patterns", () => {
    mod.configureDebug({ enabled: true });
    expect(mod.isNamespaceDebugEnabled("build")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("foo:bar:baz")).toBe(true);
  });
});

// ─── getDebugConfig ───────────────────────────────────────────────────────────

describe("getDebugConfig", () => {
  it("returns default config", () => {
    const config = mod.getDebugConfig();
    expect(config.enabled).toBe(false);
    expect(config.timestamps).toBe(false);
    expect(config.namespacePatterns).toEqual([]);
  });

  it("reflects enabled + timestamps", () => {
    mod.configureDebug({ enabled: true, timestamps: true });
    const config = mod.getDebugConfig();
    expect(config.enabled).toBe(true);
    expect(config.timestamps).toBe(true);
  });

  it("reflects namespace patterns as regex source strings", () => {
    mod.configureDebug({ enabled: true, namespaces: ["build:*"] });
    const config = mod.getDebugConfig();
    expect(config.namespacePatterns).toHaveLength(1);
    expect(typeof config.namespacePatterns[0]).toBe("string");
    expect(config.namespacePatterns[0]).toContain("build");
  });
});

// ─── createDebugLogger ────────────────────────────────────────────────────────

describe("createDebugLogger", () => {
  it("returns a callable function", () => {
    const logger = mod.createDebugLogger("test");
    expect(typeof logger).toBe("function");
  });

  it("has correct namespace property", () => {
    const logger = mod.createDebugLogger("my:ns");
    expect(logger.namespace).toBe("my:ns");
  });

  it("has enabled property reflecting current state", () => {
    const logger = mod.createDebugLogger("test");
    expect(logger.enabled).toBe(false);
  });

  it("has warn and error methods", () => {
    const logger = mod.createDebugLogger("test");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("has extend method that creates sub-namespace loggers", () => {
    const logger = mod.createDebugLogger("parent");
    const child = logger.extend("child");
    expect(child.namespace).toBe("parent:child");
    expect(typeof child).toBe("function");
  });

  it("extend creates deeply nested namespaces", () => {
    const logger = mod.createDebugLogger("a");
    const b = logger.extend("b");
    const c = b.extend("c");
    expect(c.namespace).toBe("a:b:c");
  });
});

// ─── Logger logging behaviour ─────────────────────────────────────────────────

describe("logger – logging when disabled", () => {
  it("does not call console.log when disabled", () => {
    const logger = mod.createDebugLogger("test");
    logger("hello");
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  it("does not call console.warn when disabled", () => {
    const logger = mod.createDebugLogger("test");
    logger.warn("warning");
    expect(consoleSpy.warn).not.toHaveBeenCalled();
  });

  it("does not call console.error when disabled", () => {
    const logger = mod.createDebugLogger("test");
    logger.error("error");
    expect(consoleSpy.error).not.toHaveBeenCalled();
  });
});

describe("logger – logging when enabled", () => {
  beforeEach(() => {
    mod.configureDebug({ enabled: true });
  });

  it("calls console.log when enabled", () => {
    const logger = mod.createDebugLogger("test");
    logger("hello");
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it("calls console.warn when enabled", () => {
    const logger = mod.createDebugLogger("test");
    logger.warn("warning");
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it("calls console.error when enabled", () => {
    const logger = mod.createDebugLogger("test");
    logger.error("oops");
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it("passes message args to console.log", () => {
    const logger = mod.createDebugLogger("ns");
    logger("msg", "arg1", 42);
    expect(consoleSpy.log).toHaveBeenCalled();
    const callArgs = consoleSpy.log!.mock.calls[0];
    // Some argument in the call should contain our message
    expect(callArgs.some((a: unknown) => String(a).includes("msg"))).toBe(true);
  });

  it("does not log for namespaces not matching patterns", () => {
    mod.configureDebug({ enabled: true, namespaces: ["allowed"] });
    const logger = mod.createDebugLogger("blocked");
    logger("should not appear");
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  it("logs for namespaces matching patterns", () => {
    mod.configureDebug({ enabled: true, namespaces: ["allowed"] });
    const logger = mod.createDebugLogger("allowed");
    logger("hello");
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it("extended logger inherits enabled state", () => {
    const parent = mod.createDebugLogger("parent");
    const child = parent.extend("child");
    child("from child");
    expect(consoleSpy.log).toHaveBeenCalled();
  });
});

describe("logger – with timestamps", () => {
  it("includes timestamp in output when timestamps enabled", () => {
    mod.configureDebug({ enabled: true, timestamps: true });
    const logger = mod.createDebugLogger("ts-test");
    logger("timestamped message");
    expect(consoleSpy.log).toHaveBeenCalled();
  });
});

// ─── Namespace pattern parsing edge cases ─────────────────────────────────────

describe("namespace pattern parsing", () => {
  it("handles patterns with special regex characters", () => {
    mod.configureDebug({ enabled: true, namespaces: ["plugin.build"] });
    // The dot is escaped, so 'plugin.build' matches exactly
    expect(mod.isNamespaceDebugEnabled("plugin.build")).toBe(true);
    // 'pluginXbuild' should NOT match (dot escaped to literal .)
    expect(mod.isNamespaceDebugEnabled("pluginXbuild")).toBe(false);
  });

  it("handles multiple namespaces", () => {
    mod.configureDebug({ enabled: true, namespaces: ["a", "b", "c"] });
    expect(mod.isNamespaceDebugEnabled("a")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("b")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("c")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("d")).toBe(false);
  });

  it("trims whitespace from namespace patterns", () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = " build , inject ";
    mod.configureDebug({});
    expect(mod.isNamespaceDebugEnabled("build")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("inject")).toBe(true);
  });

  it("filters out empty pattern strings", () => {
    process.env.RSPRESS_TERMINOLOGY_DEBUG = "build,,inject";
    mod.configureDebug({});
    expect(mod.isNamespaceDebugEnabled("build")).toBe(true);
    expect(mod.isNamespaceDebugEnabled("inject")).toBe(true);
  });
});
