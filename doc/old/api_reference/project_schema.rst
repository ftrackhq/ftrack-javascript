.. _project_schema:

=============================
Namespace: ``project_schema``
=============================


.. contents:: Local Navigation
   :local:

Description
===========

Project schema



Function ``getStatuses``
========================

Return statuses from *projectSchemaId* for *entityType* and *typeId*.

*entityType* should be a valid ftrack api schema id, .e.g. 'AssetVersion' or
'Task'.

*typeId* can be used to get overridden statuses for a certain task type.

.. js:function:: getStatuses(session, projectSchemaId, entityType, typeId = null)
