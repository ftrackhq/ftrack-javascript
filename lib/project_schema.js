'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getStatuses = getStatuses;

var _operation = require('./operation');

var _operation2 = _interopRequireDefault(_operation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Project schema namespace
 * @namespace project_schema
 */

/**
 * Return statuses from *projectSchemaId* for *entityType* and *typeId*.
 *
 * *entityType* should be a valid ftrack api schema id, .e.g. 'AssetVersion' or
 * 'Task'.
 *
 * *typeId* can be used to get overridden statuses for a certain task type.
 *
 * @memberof project_schema
 */
function getStatuses(session, projectSchemaId, entityType) {
    var typeId = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

    var response = void 0;

    // Load multiple collections in separate queries to work around issue in
    // backend, creating an unnecessary complex query when selecting multiple,
    // unrelated things.
    var taskWorkflowAttributes = ['_task_workflow.statuses.name', '_task_workflow.statuses.color', '_task_workflow.statuses.sort'];
    var versionWorkflowAttributes = ['_version_workflow.statuses.name', '_version_workflow.statuses.color', '_version_workflow.statuses.sort'];
    var overridesAttributes = ['_overrides.type_id', '_overrides.workflow_schema.statuses.name', '_overrides.workflow_schema.statuses.sort', '_overrides.workflow_schema.statuses.color'];
    var schemasAttributes = ['_schemas.type_id', '_schemas.statuses.task_status.name', '_schemas.statuses.task_status.color', '_schemas.statuses.task_status.sort'];

    var groupedAttributes = void 0;
    if (entityType === 'Task' && typeId !== null) {
        groupedAttributes = [taskWorkflowAttributes, overridesAttributes];
    } else if (entityType === 'Task') {
        groupedAttributes = [taskWorkflowAttributes];
    } else if (entityType === 'AssetVersion') {
        groupedAttributes = [versionWorkflowAttributes];
    } else {
        groupedAttributes = [schemasAttributes];
    }

    var operations = groupedAttributes.map(function (select) {
        return _operation2.default.query('select ' + select.join(', ') + ' from ProjectSchema where id is ' + projectSchemaId);
    });

    response = session.call(operations);
    response = response.then(function (results) {
        // Since the operations where performed in one batched call,
        // the result will be merged into a single entity.
        var data = results[0].data[0];

        var statuses = [];
        if (entityType === 'Task') {
            statuses = null;

            if (typeId !== null && data._overrides.length > 0) {
                for (var index in data._overrides) {
                    if (data._overrides[index].type_id === typeId) {
                        statuses = data._overrides[index].workflow_schema.statuses;
                        break;
                    }
                }
            }

            if (statuses === null) {
                statuses = data._task_workflow.statuses;
            }
        } else if (entityType === 'AssetVersion') {
            statuses = data._version_workflow.statuses;
        } else {
            var schema = session.getSchema(entityType);

            if (schema && schema.alias_for && schema.alias_for.id === 'Task') {
                var objectTypeId = schema.alias_for.classifiers.object_typeid;

                for (var _index in data._schemas) {
                    if (data._schemas[_index].type_id === objectTypeId) {
                        statuses = data._schemas[_index].statuses.map(function (status) {
                            return status.task_status;
                        });
                    }
                }
            }
        }

        return Promise.resolve(statuses);
    });

    return response;
} // :copyright: Copyright (c) 2016 ftrack

exports.default = {
    getStatuses: getStatuses
};