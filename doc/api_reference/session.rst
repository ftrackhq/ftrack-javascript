.. _Session:

==================
Class: ``Session``
==================


.. contents:: Local Navigation
   :local:

Constructor
===========

Construct Session instance with API credentials.

.. js:class:: Session(serverUrl, apiUser, apiKey, [options])

    :param string serverUrl: ftrack server URL
    :param string apiUser: ftrack username for API user.
    :param string apiKey: User API Key
    :param Object options: options
    :param Boolean [options.autoConnectEventHub=false]: Automatically connect to event hub.
    :param Array [options.serverInformationValues=[]]: Optional list of server information values to retrieve.
    :param Object [options.eventHubOptions={}]: Options to configure event hub with.
    :param string [options.clientToken=null]: Client identifier included in update events caused by operations performed by this session.
    :param Object [options.headers]: Additional headers to send with the request
    :param Object [options.strictApi]: Turn on strict API mode

Function ``call``
=================

Call API with array of operation objects in *operations*.

Returns promise which will be resolved with an array of decoded
responses.

The return promise may be rejected with one of several errors:

ServerValidationError
    Validation errors
ServerPermissionDeniedError
    Permission defined errors
ServerError
    Generic server errors or network issues

.. js:function:: call(operations)

    
    :param Array operations: API operations.
    :param Object [options]: options
    :param Object [options.abortController]: - Deprecated in favour of options.signal
    :param Object [options.signal]: - Abort signal user for aborting requests prematurely
    :param Object [options.headers]: - Additional headers to send with the request
    
    :return Promise: Promise which will be resolved with an array of decoded responses.

Function ``getSchema``
======================

Return schema with id or null if not existing.

.. js:function:: getSchema(schemaId)

    
    :param string schemaId: Id of schema model, e.g. `AssetVersion`.
    :return Object|null: Schema definition
    


Function ``query``
==================

Perform a single query operation with *expression*.

.. js:function:: query(expression)

    
    :param string expression: API query expression.
    :return Promise: Promise which will be resolved with an object containing
                     data and metadata.


Function ``search``
==================

Perform a single search operation with *expression*.

.. js:function:: search(options, fetchOptions)

    :param Object   options:
    :param String   options.expression:     API query expression
    :param String   options.entityType:     Entity type to search for
    :param Array options.terms:          Search terms
    :param String   [options.contextId]:    Context id to limit the search result to
    :param Array [options.objectTypeIds]: Object type ids to limit the search result to
    :return Promise: Promise which will be resolved with an object containing data and metadata

Function ``create``
===================

Perform a single create operation with *type* and *data*.

.. js:function:: create(type, data)

    
    :param string type: entity type name.
    :param Object data: data which should be used to populate attributes on the entity.
    :return Promise: Promise which will be resolved with the response.
    


Function ``update``
===================

Perform a single update operation on *type* with *keys* and *data*.

.. js:function:: update(type, keys, data)

    
    :param string type: Entity type
    :param Array keys: Identifying keys, typically [<entity id>]
    :param Object data: Perform a single update operation on *type* with *keys* and *data*.
    :return Promise: Promise resolved with the response.
    


Function ``delete``
===================

Perform a single delete operation.

.. js:function:: delete(type, keys)

    
    :param string type: Entity type
    :param Array keys: Identifying keys, typically [<entity id>]
    :return Promise: Promise resolved with the response.

.. _api_reference/session/ensure:

Function: ``ensure``
====================

Return promise of *entityType* with *data*, create or update if necessary.

  *data* should be a dictionary of the same form passed to `create`
  method.

  By default, check for an entity that has matching *data*. If
  *identifyingKeys* is specified as a list of keys then only consider the
  values from *data* for those keys when searching for existing entity.

  If no *identifyingKeys* specified then use all of the keys from the
  passed *data*.

  Raise an Error if no *identifyingKeys* can be determined.

  If no matching entity found then create entity using supplied *data*.

  If a matching entity is found, then update it if necessary with *data*.

  Return update or create promise.

.. js:function:: ensureensure(entityType, data, identifyingKeys)

    :param string entityType: Entity type
    :param Object data: Entity data to create or update
    :param Array identifyingKeys: Optional list of keys to consider when
      checking for existing entities.
    :return Promise: Promise resolved with the create or update response.

Function ``getComponentUrl``
============================

Return an URL where *componentId* can be downloaded.

.. js:function:: getComponentUrl(componentId)

    
    :param string componentId: Is assumed to be present in the
                     ftrack.server location.
    :return String|null: URL where *componentId* can be downloaded, null
                          if component id is not specified.
    


Function ``thumbnailUrl``
=========================

Return an URL where a thumbnail for *componentId* can be downloaded.

.. js:function:: thumbnailUrl(componentId, options)


    :param string componentId: Is assumed to be present in the
                     ftrack.server location and be of a valid image file type.
    :param Object options: optional parameters: size. The size of the thumbnail.
                     The image will be resized to
                     fit within size x size pixels. Defaults to 300.
    :return string: URL where *componentId* can be downloaded. Returns the
                     URL to a default thumbnail if component id is not
                     specified.



Function ``createComponent``
============================

Create component from *file* and add to server location.

.. js:function:: createComponent(file, options)


    :param Object file: the file object to upload.
    :param Object options: optional parameters: onProgress, xhr, onAborted.
    :return Promise: Promise resolved with the response when creating
                    Component and ComponentLocation.
