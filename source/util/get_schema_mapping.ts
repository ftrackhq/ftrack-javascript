// :copyright: Copyright (c) 2023 ftrack

import type { Schema } from "../types.js";

export default function getSchemaMappingFromSchemas(schemas: Schema[]) {
  const schemaMapping = {} as Record<string, Schema>;
  for (const schema of schemas) {
    schemaMapping[schema.id] = schema;
  }
  return schemaMapping;
}
