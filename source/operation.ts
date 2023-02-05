// :copyright: Copyright (c) 2016 ftrack
/**
 * Operations module
 * @namespace operation
 */

export interface Operation {}

/**
 * Return create operation object for entity *type* and *data*.
 *
 * @function operation.create
 * @memberof operation
 * @param  {string} type Entity type
 * @param  {Object} data Entity data to use for creation
 * @return {Object}      API operation
 */
export function createOperation(type: string, data: any) {
  return {
    action: "create",
    entity_type: type,
    entity_data: { ...data, __entity_type__: type },
  };
}

/**
 * Return query operation object for *expression*.
 *
 * @function operation.query
 * @memberof operation
 * @param  {string} expression API query expression
 * @return {Object}            API operation
 */
export function queryOperation(expression: string) {
  return { action: "query", expression };
}

export interface SearchOperationOptions {
  expression?: string;
  entityType?: string;
  terms?: string[];
  contextId?: string;
  objectTypeIds?: string[];
}

/**
 * Return search operation object for *expression*.
 *
 * @function operation.query
 * @memberof operation
 * @param  {string} expression API query expression
 * @return {Object}            API operation
 */
export function searchOperation({
  expression,
  entityType,
  terms,
  contextId,
  objectTypeIds,
}: SearchOperationOptions) {
  return {
    action: "search",
    expression,
    entity_type: entityType,
    terms,
    context_id: contextId,
    object_type_ids: objectTypeIds,
  };
}

/**
 * Return update operation object for entity *type* identified by *keys*.
 *
 * @function operation.update
 * @memberof operation
 * @param  {string} type Entity type
 * @param  {Array} keys Identifying keys, typically [<entity id>]
 * @param  {Object} data values to update
 * @return {Object}      API operation
 */
export function updateOperation(type: string, keys: string[], data: any) {
  return {
    action: "update",
    entity_type: type,
    entity_key: keys,
    entity_data: { ...data, __entity_type__: type },
  };
}

/**
 * Return delete operation object for entity *type* identified by *keys*.
 *
 * @function operation.delete
 * @memberof operation
 * @param  {string} type Entity type
 * @param  {Array} keys Identifying keys, typically [<entity id>]
 * @return {Object}      API operation
 */
export function deleteOperation(type: string, keys: string[]) {
  return {
    action: "delete",
    entity_type: type,
    entity_key: keys,
  };
}

const exports = {
  query: queryOperation,
  create: createOperation,
  update: updateOperation,
  delete: deleteOperation,
  search: searchOperation,
};

export default exports;
