..
    :copyright: Copyright (c) 2016 ftrack

.. _release/migration:

***************
Migration notes
***************

.. _release/migration/0.4.0:

Migrate to 0.4.0
================

Changes to session encoding
---------------------------

Previously all server dates were decoded and converted to the local
:term:`momentjs` objects in the local timezone. Now :term:`momentjs` objects
are in local timezone or UTC depending on the time zone setting on the ftrack
server.

To garantuee that a :term:`momentjs` objects are in your local timezone when
displaying or operating on them you can call local::

    myDate.local()

.. _release/migration/0.3.0:

Migrate to 0.3.0
================

Changes to event hub
--------------------

:ref:`EventHub.publish <EventHub.publish>` has changed to support multiple
replies. See
:ref:`EventHub.publishAndWaitForReply <EventHub.publishAndWaitForReply>` for
previous logic when reply=true.

`ftrack._Event` and `ftrack._EventHub` now exposed without underscore prefix.
