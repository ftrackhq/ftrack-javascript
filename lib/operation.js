'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createOperation = createOperation;
exports.queryOperation = queryOperation;
exports.updateOperation = updateOperation;
exports.deleteOperation = deleteOperation;
// :copyright: Copyright (c) 2016 ftrack
/**
 * Operations module
 * @namespace operation
 */

/** 
 * Return create operation object for entity *type* and *data*.
 *
 * @function operation.create
 * @memberof operation
 * @param  {string} type Entity type
 * @param  {Object} data Entity data to use for creation
 * @return {Object}      API operation
 */
function createOperation(type, data) {
    var operation = { action: 'create', entity_type: type };
    operation.entity_data = Object.assign({}, data, { __entity_type__: type });
    return operation;
}

/** 
 * Return query operation object for *expression*.
 *
 * @function operation.query
 * @memberof operation
 * @param  {string} expression API query expression
 * @return {Object}            API operation
 */
function queryOperation(expression) {
    return { action: 'query', expression: expression };
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
function updateOperation(type, keys, data) {
    var operation = {
        action: 'update',
        entity_type: type,
        entity_key: keys
    };
    operation.entity_data = Object.assign({}, data, { __entity_type__: type });
    return operation;
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
function deleteOperation(type, keys) {
    var operation = {
        action: 'delete',
        entity_type: type,
        entity_key: keys
    };
    return operation;
}

exports.default = {
    query: queryOperation,
    create: createOperation,
    update: updateOperation,
    delete: deleteOperation
};