..
    :copyright: Copyright (c) 2016 ftrack

.. _release/migration:

***************
Migration notes
***************

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
