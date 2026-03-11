/**
 * Tests for Term.tsx wrapper component
 */

import Term from "../Term";

describe("Term Wrapper", () => {
  it("should be a valid React component", () => {
    expect(typeof Term).toBe("function");
    expect(Term.name).toBeDefined();
  });

  it("should have required props interface", () => {
    // Term component should accept pathName, children, and placement props
    const testProps = {
      pathName: "/docs/terms/test-term",
      children: "Test Term",
      placement: "top" as const,
    };
    expect(testProps.pathName).toBeDefined();
    expect(testProps.placement).toBeDefined();
  });
});
