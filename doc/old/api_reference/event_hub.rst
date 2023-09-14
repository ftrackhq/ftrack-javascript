===================
Class: ``EventHub``
===================


.. contents:: Local Navigation
   :local:

Constructor
===========

Construct EventHub instance with API credentials.

.. js:function:: method(serverUrl, apiUser, apiKey[, options.applicationId])

    
    :param String serverUrl: Server URL
    :param String apiUser: API user
    :param String apiKey: API key
    :param String options.applicationId: Application identifier, added to event source.


.. _EventHub.connect:


Function: ``connect``
=====================

Connect to the event server.

.. js:function:: connect()

    
    
.. _EventHub.isConnected:


Function: ``isConnected``
=========================

Return true if connected to event server.

.. js:function:: isConnected()

    
    :return Boolean: Return true if connected to event server.
    


.. _EventHub.publish:


Function: ``publish``
=====================

Publish event and return promise resolved with event id when event has
been sent.

If *onReply* is specified, it will be invoked when any replies are
received.

If timeout is non-zero, the promise will be rejected if the event is not
sent before the timeout is reached. Should be specified as seconds and
will default to 10.

.. js:function:: publish(event[, options.onReply][, options.timeout])

    
    :param Event event: Event instance to publish
    :param function options.onReply: Function to be invoked when a reply
                                         is received.
    :param Number options.timeout: Timeout in seconds
    :return Promise:
    

.. _EventHub.publishAndWaitForReply:


Function: ``publishAndWaitForReply``
====================================

Publish event and wait for a single reply.

Returns promise resolved with reply event if received within timeout.

.. js:function:: publishAndWaitForReply(event[, options.timeout])

    
    :param Event event: Event instance to publish
    :param Number options.timeout: Timeout in seconds [30]
    :return Promise: Promise resolved with reply event.
    

.. _EventHub.subscribe:


Function: ``subscribe``
=======================

Register to *subscription* events.

.. js:function:: subscribe(subscription, callback[, metadata])

    
    :param String subscription: Expression to subscribe on. Currently,
                                     only "topic=value" expressions are
                                     supported.
    :param function callback: Function to be called when an event
                                     matching the subscription is returned.
    :param Object metadata: Optional information about subscriber.
    :return String: Subscriber ID.
    

    
.. _EventHub.publishReply:


Function: ``publishReply``
==========================

Publish reply event.

.. js:function:: publishReply(sourceEvent, data[, source])

    
    :param Object sourceEvent: Source event payload
    :param Object data: Response event data
    :param Object source: Response event source information
    
