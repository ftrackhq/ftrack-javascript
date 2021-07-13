..
    :copyright: Copyright (c) 2017 ftrack

.. _handling_events:

***************
Handling events
***************

Events are generated in ftrack when things happen such as a task being updated
or an action is launched.

Each API session has an event hub instance which you can access via the
property `eventHub`. It allows you to subscribe to events and invoke a callback
when something happens or publish new events.


Connecting to event hub
=======================

To connect to the event hub, run `session.eventHub.connect()`. You can also
automatically connect the event hub when it is instantiated by providing the
option `autoConnectEventHub` when constructing the Session instance::

    session = new ftrack.Session(..., { autoConnectEventHub: true });
    session.eventHub.isConnected();

.. note::

    If you running the API on a web page hosted on a port different from the
    port ftrack is running on, you will need to include the port
    (typically 443 or 80) in the server url when constructing the session, or
    the event hub will fail to connect.

.. _handling_events/subscribing:

Subscribing to events
=====================

To listen to events, you register a function against a subscription using
:ref:`Session.eventHub.subscribe <EventHub.subscribe>`. The subscription
expression should be on the format `topic=<topic value>` and will filter
incoming events to determine if the registered function should receive that
event. If the subscription matches, the registered function will be called with
the event object as its sole argument.

The following example subscribes a function to receive all 'ftrack.update'
events and then print out the entities that were updated::

    function myCallback(event) {
        var entities = event.data.entities || [];
        entities.forEach(function (entity) {
            console.log('Entity updated', entity);
        });
    }

    session = new ftrack.Session(..., { autoConnectEventHub: true });
    session.eventHub.subscribe('topic=ftrack.update', myCallback)

The event hub will receive events and call your callback when matching events
are received asynchronously.

.. _handling_events/subscribing/subscriber_information:

Subscriber information
----------------------

When subscribing, you can also specify additional information about your
subscriber. This contextual information can be useful when routing events,
particularly when targeting events. By default, the event hub will set some
default information, but it can be useful to enhance this. To do so, simply
pass in *subscriber* as a object of data to the
:ref:`EventHub.subscribe <EventHub.subscribe>` method::

    session.eventHub.subscribe(
        'topic=ftrack.update',
        myCallback,
        {
            id: 'my-unique-subscriber-id',
            applicationId: 'maya'
        }
    )


.. _handling_events/subscribing/sending_replies:

Sending replies
---------------

When handling an event it is sometimes useful to be able to send information
back to the source of the event. For example,
:ref:`ftrack:developing/events/list/ftrack.location.request-resolve` would
expect a resolved path to be sent back.

You can craft a custom reply event if you want, but an easier way is just to
return the appropriate data from your handler. Any value different from *null*
or *undefined* will be automatically sent as a reply::

    function onEvent(event) {
        // Send following data in automatic reply
        return { success: true, message: 'Cool!' };
    }

    session.eventHub.subscribe('topic=test-reply', onEvent)

.. seealso::

    :ref:`handling_events/publishing/handling_replies`


.. _handling_events/publishing:

Publishing events
=================

So far we have looked at listening to events coming from ftrack. However, you
are also free to publish your own events (or even publish relevant ftrack
events).

To do this, simply construct an instance of :js:class:`ftrack.Event`
and pass it to :ref:`EventHub.publish <EventHub.publish>` via the session::

    var event = new ftrack.Event('my-company.some-topic', {
        foo: 'bar',
        xyz: true
    })
    session.eventHub.publish(event)

:ref:`EventHub.publish <EventHub.publish>` will return a :term:`promise`
object, which will be resolved when the event has been published. If the event
hub is not connected, the event will be queued until a connection can be
established.

.. _handling_events/publishing/handling_replies:

Handling replies
----------------

When publishing an event, you can specify `onReply` as a function which will
be invoked whenever a reply event is received::

    function onReply(event) {
        console.info('Reply received', event.data)
    }
    session.eventHub.publish(event, { onReply: onReply });

It is often the case that you want to wait for a single reply. In this case,
you can use the convenience method
:ref:`EventHub.publishAndWaitForReply <EventHub.publishAndWaitForReply>`.
It will return a promise which will be resolved with the response. You can test
this using two browser tabs. In the first, run the following to listen for
event and reply::

    // Listen for events and reply
    function onEvent(event) {
        console.info('Event received', event.data);
        return { message: 'Event acknowledged' };
    }
    session.eventHub.subscribe('topic=my-company.some-topic', onEvent);

In the second environment we will publish an event, wait for and log the
response::

    // Publish event and wait for reply
    function onReply(event) {
        console.info('Promise resolved with reply', event.data)
    }
    function onError(error) {
        console.error('Reply not received', error)
    }
    var event = new ftrack.Event('my-company.some-topic', { message: 'Hello world!' });
    session.eventHub.publishAndWaitForReply(event, { timeout: 5 }).then(onReply, onError);

.. _handling_events/limitations:

Limitations
===========

The event hub in the JavaScript API has some minor differences and lacks some
of the features available in the 
:ref:`python counterpart <ftrack-python-api:handling_events>`.

Subscription expressions
------------------------

The JavaScript API currently only support expressions on the format
"topic=value", and more complex expressions such as filtering based on event
source or data are not supported.

Target expression
-----------------

Targeted events will invoke all subscribers of the topic, not just those
matching the target expression-

Stopping events
---------------

Subscription callback priorities and the ability to stop events is not
supported at this point.

Node support
------------

The event hub currently is dependent on browser APIs and will not work when
run from Node.
