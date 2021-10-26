"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.getStatuses = getStatuses;
exports["default"] = void 0;

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _operation = _interopRequireDefault(require("./operation"));

// :copyright: Copyright (c) 2016 ftrack

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
  var typeId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  var response; // Load multiple collections in separate queries to work around issue in
  // backend, creating an unnecessary complex query when selecting multiple,
  // unrelated things.

  var taskWorkflowAttributes = ["_task_workflow.statuses.name", "_task_workflow.statuses.color", "_task_workflow.statuses.sort"];
  var versionWorkflowAttributes = ["_version_workflow.statuses.name", "_version_workflow.statuses.color", "_version_workflow.statuses.sort"];
  var overridesAttributes = ["_overrides.type_id", "_overrides.workflow_schema.statuses.name", "_overrides.workflow_schema.statuses.sort", "_overrides.workflow_schema.statuses.color"];
  var schemasAttributes = ["_schemas.type_id", "_schemas.statuses.task_status.name", "_schemas.statuses.task_status.color", "_schemas.statuses.task_status.sort"];
  var groupedAttributes;

  if (entityType === "Task" && typeId !== null) {
    groupedAttributes = [taskWorkflowAttributes, overridesAttributes];
  } else if (entityType === "Task") {
    groupedAttributes = [taskWorkflowAttributes];
  } else if (entityType === "AssetVersion") {
    groupedAttributes = [versionWorkflowAttributes];
  } else {
    groupedAttributes = [schemasAttributes];
  }

  var operations = (0, _map["default"])(groupedAttributes).call(groupedAttributes, function (select) {
    var _context;

    return _operation["default"].query((0, _concat["default"])(_context = "select ".concat(select.join(", "), " from ProjectSchema where id is ")).call(_context, projectSchemaId));
  });
  response = session.call(operations);
  response = response.then(function (results) {
    // Since the operations where performed in one batched call,
    // the result will be merged into a single entity.
    var data = results[0].data[0];
    var statuses = [];

    if (entityType === "Task") {
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
    } else if (entityType === "AssetVersion") {
      statuses = data._version_workflow.statuses;
    } else {
      var schema = session.getSchema(entityType);

      if (schema && schema.alias_for && schema.alias_for.id === "Task") {
        var objectTypeId = schema.alias_for.classifiers.object_typeid;

        for (var _index in data._schemas) {
          if (data._schemas[_index].type_id === objectTypeId) {
            var _context2;

            statuses = (0, _map["default"])(_context2 = data._schemas[_index].statuses).call(_context2, function (status) {
              return status.task_status;
            });
          }
        }
      }
    }

    return _promise["default"].resolve(statuses);
  });
  return response;
}

var _exports = {
  getStatuses: getStatuses
};
var _default = _exports;
exports["default"] = _default;