// :copyright: Copyright (c) 2023 ftrack

import type { Schema } from "../types.js";

export default function getSchemaMappingFromSchemas<TEntityTypeMap>(
  schemas: Schema<TEntityTypeMap>[],
): {
  [TEntityType in keyof TEntityTypeMap]: Schema<TEntityTypeMap, TEntityType>;
} {
  const schemaMapping = {} as {
    [TEntityType in keyof TEntityTypeMap]: Schema<TEntityTypeMap, TEntityType>;
  };
  for (const schema of schemas) {
    schemaMapping[schema.id] = schema;
  }
  return schemaMapping;
}
