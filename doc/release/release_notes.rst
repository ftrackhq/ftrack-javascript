..
    :copyright: Copyright (c) 2016 ftrack

.. _release/release_notes:

*************
Release Notes
*************

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
