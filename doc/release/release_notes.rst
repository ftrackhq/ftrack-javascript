..
    :copyright: Copyright (c) 2016 ftrack

.. _release/release_notes:

*************
Release Notes
*************

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
