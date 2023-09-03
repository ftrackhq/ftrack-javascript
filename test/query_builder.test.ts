import { QueryBuilder } from "../source/query_builder";
import { vi, describe, expect, afterEach, test } from "vitest";

describe("QueryBuilder", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should support no projections", () => {
    const query = new QueryBuilder((x) => x.Bar)
      .select((x) => x.property((x) => x.booleanBar).property((x) => x.dateBar))
      .where((x) =>
        x.and(
          (x) => x.property((p) => p.numberBar).is(42),
          (x) =>
            x
              .property((p) => p.objectBar)
              .has((x) => x.property((x) => x.stringFoo).is("stuff"))
        )
      )
      .build();

    expect(query).toBe(
      "select booleanBar, dateBar from Bar where numberBar is 42 and objectBar has (stringFoo is 'stuff')"
    );
  });
});
