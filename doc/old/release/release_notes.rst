..
    :copyright: Copyright (c) 2016 ftrack

.. _release/release_notes:

*************
Release Notes
*************

.. release:: upcoming
    .. change:: new
        :tags: Event hub, Dependencies

        Added unsubscribe function to event hub.
        Bumped dependencies

.. release:: 0.9.1
    :date: 2021-11-03

    .. change:: new
        :tags: Dependencies

        Bumped uuid to 8.3.2.
        Bumped lodash to 4.17.21.


.. release:: 0.9.0
    :date: 2021-11-03

    .. change:: new
        :tags: Babel, ESM

        Bumped Babel to version 7.16.

        Bumped core-js to version 3.

        ESM support.



.. release:: 0.8.2
    :date: 2021-11-03

    .. change:: new
        :tags: TypeScript

        TypeScript Declaration file added.

.. release:: 0.8.1
    :date: 2021-11-03

    .. change:: fixed
        :tags: Session

        Uncaught exception is thrown when aborting file uploads.

    .. change:: fixed
        :tags: Session

        Components are not registered before files are uploaded.

.. release:: 0.8.0
    :date: 2021-10-15

    .. change:: new
        :tags: Session

        Add support for Session.search.

        .. seealso::

            :ref:`api_reference/session/search`

.. release:: 0.7.3
    :date: 2021-05-18

    .. change:: fixed
        :tags: documentation

        Added requirements file to docs folder.

.. release:: 0.7.2
    :date: 2020-02-13

    .. change:: changed
        :tags: dependencies

        Update `uuid` dependency to version 3.4.0.

.. release:: 0.7.1
    :date: 2019-06-12

    .. change:: changed
        :tags: Session

        Session.createComponent tries to normalize unicode file names using the
        NFC form to avoid using e.g. combining diaeresis in component names.

.. release:: 0.7.0
    :date: 2019-02-08

    .. change:: changed
        :tags: Session

        Update Session.createComponent with optional parameters, onProgress, xhr and onAbort.

.. release:: 0.6.0
    :date: 2018-11-29

    .. change:: changed
        :tags: Session

        Added support for overriding the API endpoint.

    .. change:: fixed
        :tags: Session

        The methods `getComponentUrl` and `thumbnailUrl` return an invalid URL
        when the API user contains characters that need to be encoded in URIs.

    .. change:: fixed
        :tags: Event hub

        The event hub is not able to connect when the API user contains
        characters that need to be encoded in URIs.

.. release:: 0.5.0
    :date: 2018-07-23

    .. change:: new
        :tags: Session

        Session now supports an `ensure` method that will if necessary update or
        create an entity with the given data.

        .. seealso::

            :ref:`api_reference/session/ensure`

    .. change:: fixed
        :tags: Event Hub

        Not able to connect to event hub when using the API in a web page
        hosted on a different port than the ftrack server, unless server URL
        is specified with a port.

.. release:: 0.4.5
    :date: 2017-11-22

    .. change:: fixed
        :tags: Project Schema

        `projectSchema.getStatuses()` may take a very long time to load for
        complex project schemas.

.. release:: 0.4.4
    :date: 2017-10-17

    .. change:: fixed
        :tags: Event Hub

        Unable to publish events after event hub socket has been disconnected
        and not automatically reconnected.

.. release:: 0.4.3
    :date: 2017-03-29

    .. change:: changed
        :tags: Session, Encoding

        Multiple occurrences of an entity within the same payload are now
        merged for all operation types and batched query operations.

.. release:: 0.4.2
    :date: 2017-03-27

    .. change:: changed
        :tags: Error

        The CustomError class now handles server error codes.

    .. change:: fixed
        :tags: Event Hub

        Flash plug-in notification appears when loading the API in Google
        Chrome.


.. release:: 0.4.1
    :date: 2017-02-14

    .. change:: fixed
        :tags: Session

        Session incorrectly raises ServerError instead of more specific
        ServerPermissionError

.. release:: 0.4.0
    :date: 2017-02-09

    .. change:: new
        :tags: Session, Encoding

        :term:`momentjs` dates are now automatically encoded and converted to
        the server timezone in all outgoing server operations.

    .. change:: changed
        :tags: Session

        :term:`momentjs` dates are no longer automatically cast converted to
        the local timezone but remains in the timezone of the ftrack server
        instance.

        .. seealso::

            :ref:`release/migration/0.4.0`

.. release:: 0.3.0
    :date: 2017-01-30

    .. change:: new
        :tags: Event hub

        Added the possibility to subscribe to events.

        .. seealso::

            :ref:`handling_events`

    .. change:: changed
        :tags: Event hub, backwards-incompatible

        :ref:`EventHub.publish <EventHub.publish>` has changed to
        support multiple replies. See :ref:`EventHub.publishAndWaitForReply <EventHub.publishAndWaitForReply>` for previous logic when reply=true.

    .. change:: changed
        :tags: Event, backwards-incompatible

        `ftrack._Event` and `ftrack._EventHub` now exposed without underscore
        prefix.

.. release:: 0.2.0
    :date: 2016-11-18

    .. change:: new
        :tags: Webpack, Node

        Include a compiled lib folder, so that the package can be imported in
        a webpack or node project.

        .. seealso::

            :ref:`installing`

    .. change:: new

        Added helper method on session for creating and uploading a component
        from a file.

        .. seealso::

            :ref:`Uploading files <tutorial/create_component>`

.. release:: 0.1.0
    :date: 2016-06-13

    .. change:: new

        Initial release with support for query, create, update and delete
        operations.
