type StringBuilder = {
  build(): string;
};

interface EntityTypeMap {
  Foo: Foo;
  Bar: Bar;
}

interface Foo {
  stringFoo: string;
  numberFoo: number;
  booleanFoo: boolean;
  dateFoo: Date;
  objectFoo: Bar;
}

interface Bar {
  stringBar: string;
  numberBar: number;
  booleanBar: boolean;
  dateBar: Date;
  objectBar: Foo;
}

export class QueryBuilder<TEntity extends object> implements StringBuilder {
  private projectionsBuilder?: ProjectionsBuilder<TEntity>;
  private criteriaBuilder?: CriteriaBuilder<TEntity>;

  public constructor(
    private readonly typeSelector: (entityTypeMap: EntityTypeMap) => TEntity
  ) {}

  public select(
    callback: (
      builder: ProjectionsBuilder<TEntity>
    ) => ProjectionsBuilder<TEntity>
  ) {
    if (this.projectionsBuilder) throw new Error("Can't call select twice.");

    const builder = new ProjectionsBuilder<TEntity>();
    callback(builder);

    this.projectionsBuilder = builder;

    return this;
  }

  public where(
    callback: (builder: Omit<CriteriaBuilder<TEntity>, "property">) => void
  ) {
    if (this.criteriaBuilder) throw new Error("Can't call where twice.");

    const builder = new CriteriaBuilder<TEntity>();
    callback(builder);

    this.criteriaBuilder = builder;

    return this;
  }

  public build() {
    let query = "";
    if (this.projectionsBuilder) {
      query += `select ${this.projectionsBuilder.build()} from `;
    }

    query += getPropertyName(this.typeSelector);

    if (this.criteriaBuilder) {
      query += ` where ${this.criteriaBuilder.build()}`;
    }

    return query;
  }
}

class CriteriaBuilder<TEntity> implements StringBuilder {
  private type?: "and" | "or";
  private criteriaBuilders: Array<CriteriaBuilder<TEntity>>;

  public constructor() {
    this.criteriaBuilders = [];
  }

  public and(
    ...expressions: Array<
      (builder: CriteriaBuilder<TEntity>) => CriteriaBuilder<TEntity>
    >
  ) {
    if (this.type) {
      throw new Error(
        "'and' or 'or' can only be called once per projections builder."
      );
    }

    this.type = "and";
    this.criteriaBuilders = expressions.map((callback) => {
      const builder = new CriteriaBuilder<TEntity>();
      return callback(builder);
    });
  }

  public or(
    ...expressions: Array<
      (builder: CriteriaBuilder<TEntity>) => CriteriaBuilder<TEntity>
    >
  ) {
    if (this.type) {
      throw new Error(
        "'and' or 'or' can only be called once per projections builder."
      );
    }

    this.type = "or";
    this.criteriaBuilders = expressions.map((callback) => {
      const builder = new CriteriaBuilder<TEntity>();
      return callback(builder);
    });
  }

  public property<TProperty>(
    expression: (entity: TEntity) => TProperty
  ): TypedPropertyNameCriteriaBuilder<TEntity, TProperty> {
    if (this.type) {
      throw new Error(
        "You can't mix 'and'/'or' and general properties in the same level of a query."
      );
    }

    const builder = new PropertyNameCriteriaBuilder(expression, this) as any;
    this.criteriaBuilders.push(builder);

    return builder;
  }

  public build(): string {
    return this.criteriaBuilders
      .map((builder) => builder.build())
      .join(` ${this.type ?? "and"} `);
  }
}

type TypedPropertyNameCriteriaBuilder<TEntity, TProperty> = StringBuilder &
  (TProperty extends TEntity
    ? never
    : TProperty extends string
    ? Pick<
        PropertyNameCriteriaBuilder<TEntity, TProperty>,
        "is" | "isNot" | "in" | "notIn" | "like" | "notLike"
      >
    : TProperty extends number
    ? Pick<
        PropertyNameCriteriaBuilder<TEntity, TProperty>,
        | "is"
        | "isNot"
        | "in"
        | "notIn"
        | "greaterThan"
        | "lessThan"
        | "greaterThanOrEqual"
        | "lessThanOrEqual"
      >
    : TProperty extends boolean
    ? Pick<
        PropertyNameCriteriaBuilder<TEntity, TProperty>,
        "is" | "isNot" | "in" | "notIn"
      >
    : TProperty extends Date
    ? Pick<
        PropertyNameCriteriaBuilder<TEntity, TProperty>,
        | "is"
        | "isNot"
        | "in"
        | "notIn"
        | "after"
        | "before"
        | "afterOrEqual"
        | "beforeOrEqual"
      >
    : TProperty extends object
    ? Pick<PropertyNameCriteriaBuilder<TEntity, TProperty>, "has" | "any">
    : never);

type IsOperatorFunction<TEntity, TValue> = (
  value: TValue
) => CriteriaBuilder<TEntity>;

type InOperatorFunction<TEntity, TValue> = (
  ...values: TValue[]
) => CriteriaBuilder<TEntity>;

type LikeOperatorFunction<TEntity, TValue> = (
  value: TValue
) => CriteriaBuilder<TEntity>;

type GreaterLesserThanOperatorFunction<TEntity, TValue> = (
  value: TValue
) => CriteriaBuilder<TEntity>;

type HasAnyOperatorFunction<TEntity, TValue> = (
  expression: (builder: CriteriaBuilder<TValue>) => CriteriaBuilder<TValue>
) => CriteriaBuilder<TEntity>;

type Operator = {
  name: string;
  getQueryValue: () => string;
};

class PropertyNameCriteriaBuilder<TEntity, TProperty> {
  public constructor(
    private readonly expression: (entity: TEntity) => TProperty,
    private readonly criteriaBuilder: CriteriaBuilder<TEntity>
  ) {}

  private operator?: Operator;

  public is: IsOperatorFunction<TEntity, TProperty> = (value) => {
    this.operator = {
      name: "is",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public isNot: IsOperatorFunction<TEntity, TProperty> = (value) => {
    this.operator = {
      name: "is_not",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public in: InOperatorFunction<TEntity, TProperty> = (value) => {
    this.operator = {
      name: "in",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public notIn: InOperatorFunction<TEntity, TProperty> = (value) => {
    this.operator = {
      name: "not_in",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public has: HasAnyOperatorFunction<TEntity, TProperty> = (expression) => {
    const builder = new CriteriaBuilder<TProperty>();
    expression(builder);

    this.operator = {
      name: "has",
      getQueryValue: () => `(${builder.build()})`,
    };

    return this.criteriaBuilder;
  };

  public any: HasAnyOperatorFunction<TEntity, TProperty> = (expression) => {
    const builder = new CriteriaBuilder<TProperty>();
    expression(builder);

    this.operator = {
      name: "any",
      getQueryValue: () => `(${builder.build()})`,
    };

    return this.criteriaBuilder;
  };

  public like: LikeOperatorFunction<TEntity, TProperty> = (value) => {
    this.operator = {
      name: "like",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public notLike: LikeOperatorFunction<TEntity, TProperty> = (value) => {
    this.operator = {
      name: "not_like",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public greaterThan: GreaterLesserThanOperatorFunction<TEntity, TProperty> = (
    value
  ) => {
    this.operator = {
      name: "greater_than",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public lessThan: GreaterLesserThanOperatorFunction<TEntity, TProperty> = (
    value
  ) => {
    this.operator = {
      name: "less_than",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public after: GreaterLesserThanOperatorFunction<TEntity, TProperty> = (
    value
  ) => {
    return this.greaterThan(value);
  };

  public before: GreaterLesserThanOperatorFunction<TEntity, TProperty> = (
    value
  ) => {
    return this.lessThan(value);
  };

  public greaterThanOrEqual: GreaterLesserThanOperatorFunction<
    TEntity,
    TProperty
  > = (value) => {
    this.operator = {
      name: ">=",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public lessThanOrEqual: GreaterLesserThanOperatorFunction<
    TEntity,
    TProperty
  > = (value) => {
    this.operator = {
      name: "<=",
      getQueryValue: () => this.prepare(value),
    };

    return this.criteriaBuilder;
  };

  public afterOrEqual: GreaterLesserThanOperatorFunction<TEntity, TProperty> = (
    value
  ) => {
    return this.greaterThanOrEqual(value);
  };

  public beforeOrEqual: GreaterLesserThanOperatorFunction<TEntity, TProperty> =
    (value) => {
      return this.lessThanOrEqual(value);
    };

  public build() {
    if (!this.operator) throw new Error("No operator specified on property.");

    const propertyName = getPropertyName(this.expression);
    return `${propertyName} ${
      this.operator.name
    } ${this.operator.getQueryValue()}`;
  }

  /**
   * Prepares a value so it is protected against injection attacks.
   */
  private prepare(value: any) {
    if (typeof value === "string") {
      return `'${value.replace(/'/g, "'")}'`;
    } else if (value instanceof Date) {
      return value.toISOString();
    }

    return value;
  }
}

class ProjectionsBuilder<TEntity extends object> {
  private readonly propertyNames: string[];

  public constructor() {
    this.propertyNames = [];
  }

  public property<TProperty>(expression: (entity: TEntity) => TProperty) {
    this.propertyNames.push(getPropertyName(expression));
    return this;
  }

  public build() {
    return this.propertyNames.join(", ");
  }
}

function getPropertyName<T = never>(expression: (instance: T) => any) {
  let propertyThatWasAccessed = "";
  var proxy: any = new Proxy({} as any, {
    get: function (_: any, prop: any) {
      if (propertyThatWasAccessed) propertyThatWasAccessed += ".";

      propertyThatWasAccessed += prop;
      return proxy;
    },
  });
  expression(proxy);

  return propertyThatWasAccessed;
}
