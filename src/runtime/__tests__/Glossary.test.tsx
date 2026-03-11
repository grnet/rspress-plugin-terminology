/**
 * Tests for Glossary.tsx wrapper component
 */

import Glossary from "../Glossary";
import GlossaryComponent from "../GlossaryComponent";

describe("Glossary Wrapper", () => {
  it("should export GlossaryComponent as default", () => {
    expect(Glossary).toBe(GlossaryComponent);
  });

  it("should be a valid React component", () => {
    expect(typeof Glossary).toBe("function");
    expect(Glossary.name).toBeDefined();
  });
});
