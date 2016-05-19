// :copyright: Copyright (c) 2016 ftrack

/** Return create operation object for entity *type* and *data*. */
export function createOperation(type, data) {
    const operation = { action: 'create', entity_type: type };
    operation.entity_data = Object.assign({}, data, { __entity_type__: type });
    return operation;
}


/** Return query operation object for *expression*. */
export function queryOperation(expression) {
    return { action: 'query', expression };
}

/**
 * Return update operation object for entity *type* identified by *keys*.
 *
 * *data* should be an object of values to update.
 */
export function updateOperation(type, keys, data) {
    const operation = {
        action: 'update',
        entity_type: type,
        entity_key: keys,
    };
    operation.entity_data = Object.assign({}, data, { __entity_type__: type });
    return operation;
}

/** Return delete operation object for entity *type* identified by *keys*. */
export function deleteOperation(type, keys) {
    const operation = {
        action: 'delete',
        entity_type: type,
        entity_key: keys,
    };
    return operation;
}
