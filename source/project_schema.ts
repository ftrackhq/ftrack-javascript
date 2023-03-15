// :copyright: Copyright (c) 2016 ftrack

import * as operation from "./operation";
import { Session } from "./session";
import { Data, QueryResponse } from "./types";
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
export function getStatuses(
  session: Session,
  projectSchemaId: string,
  entityType: string,
  typeId: string | null = null
) {
  let response;

  // Load multiple collections in separate queries to work around issue in
  // backend, creating an unnecessary complex query when selecting multiple,
  // unrelated things.
  const taskWorkflowAttributes = [
    "_task_workflow.statuses.name",
    "_task_workflow.statuses.color",
    "_task_workflow.statuses.sort",
  ];
  const versionWorkflowAttributes = [
    "_version_workflow.statuses.name",
    "_version_workflow.statuses.color",
    "_version_workflow.statuses.sort",
  ];
  const overridesAttributes = [
    "_overrides.type_id",
    "_overrides.workflow_schema.statuses.name",
    "_overrides.workflow_schema.statuses.sort",
    "_overrides.workflow_schema.statuses.color",
  ];
  const schemasAttributes = [
    "_schemas.type_id",
    "_schemas.statuses.task_status.name",
    "_schemas.statuses.task_status.color",
    "_schemas.statuses.task_status.sort",
  ];

  let groupedAttributes;
  if (entityType === "Task" && typeId !== null) {
    groupedAttributes = [taskWorkflowAttributes, overridesAttributes];
  } else if (entityType === "Task") {
    groupedAttributes = [taskWorkflowAttributes];
  } else if (entityType === "AssetVersion") {
    groupedAttributes = [versionWorkflowAttributes];
  } else {
    groupedAttributes = [schemasAttributes];
  }

  const operations = groupedAttributes.map((select) =>
    operation.query(
      `select ${select.join(
        ", "
      )} from ProjectSchema where id is ${projectSchemaId}`
    )
  );

  response = session.call<QueryResponse<Data>>(operations);
  response = response.then((results) => {
    // Since the operations where performed in one batched call,
    // the result will be merged into a single entity.
    const data = results[0].data[0];

    let statuses = [];
    if (entityType === "Task") {
      let useTaskworkflowStatuses = true;

      if (typeId !== null && data._overrides.length > 0) {
        for (const index in data._overrides) {
          if (data._overrides[index].type_id === typeId) {
            statuses = data._overrides[index].workflow_schema.statuses;
            useTaskworkflowStatuses = false;
            break;
          }
        }
      }

      if (useTaskworkflowStatuses) {
        statuses = data._task_workflow.statuses;
      }
    } else if (entityType === "AssetVersion") {
      statuses = data._version_workflow.statuses;
    } else {
      const schema = session.getSchema(entityType);

      if (
        typeof schema?.alias_for === "object" &&
        schema.alias_for.id === "Task"
      ) {
        const objectTypeId = schema.alias_for.classifiers.object_typeid;

        for (const index in data._schemas) {
          if (data._schemas[index].type_id === objectTypeId) {
            statuses = data._schemas[index].statuses.map(
              (status: any) => status.task_status
            );
          }
        }
      }
    }

    return Promise.resolve(statuses);
  });

  return response;
}
