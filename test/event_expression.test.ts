// :copyright: Copyright (c) 2023 ftrack
import { describe, it, expect } from "vitest";
import { ASTKinds, Condition, parse } from "../source/event_expression";

describe("parse", () => {
  it("should be able to parse simple ID expression", async () => {
    const expression = parse("id=foobar").ast as Condition;
    expect(expression.kind).toBe(ASTKinds.Condition);
    expect(expression.field).toBe("id");
    expect(expression.operator).toBe("=");
    expect(expression.value).toBe("foobar");
  });

  it("should be able to parse simple negated ID expression", async () => {
    const expression = parse("id!=foobar").ast as Condition;
    expect(expression.kind).toBe(ASTKinds.Condition);
    expect(expression.field).toBe("id");
    expect(expression.operator).toBe("!=");
    expect(expression.value).toBe("foobar");
  });
});
