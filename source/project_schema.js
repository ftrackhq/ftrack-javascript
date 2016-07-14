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
export function getStatuses(session, projectSchemaId, entityType, typeId = null) {
    let response;

    const select = [
        '_task_workflow.statuses.name',
        '_task_workflow.statuses.color',
        '_task_workflow.statuses.sort',
        '_version_workflow.statuses.name',
        '_version_workflow.statuses.color',
        '_version_workflow.statuses.sort',
        '_overrides.type_id',
        '_overrides.workflow_schema.statuses.name',
        '_overrides.workflow_schema.statuses.sort',
        '_overrides.workflow_schema.statuses.color',
        '_overrides.workflow_schema.statuses.sort',
        '_schemas.type_id',
        '_schemas.statuses.task_status.name',
        '_schemas.statuses.task_status.color',
        '_schemas.statuses.task_status.sort',
    ];

    response = session.query(
        `select ${select.join(', ')} from ProjectSchema where id is ${projectSchemaId}`
    );
    response = response.then(
        (result) => {
            const data = result.data[0];
            let statuses = [];
            if (entityType === 'Task') {
                statuses = null;

                if (typeId !== null && data._overrides.length > 0) {
                    for (const index in data._overrides) {
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
                const schema = session.getSchema(entityType);

                if (schema && schema.alias_for && schema.alias_for.id === 'Task') {
                    const objectTypeId = schema.alias_for.classifiers.object_typeid;

                    for (const index in data._schemas) {
                        if (data._schemas[index].type_id === objectTypeId) {
                            statuses = data._schemas[index].statuses.map(
                                (status) => status.task_status
                            );
                        }
                    }
                }
            }

            return Promise.resolve(statuses);
        }
    );

    return response;
}

export default {
    getStatuses,
};
