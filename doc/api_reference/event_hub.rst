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

Publish event and return promise.

If *reply* is true, the promise will wait for a response and resolve
with the reply event. Otherwise, the promise will be resolved once the
event has been sent.

If timeout is non-zero, the promise will be rejected if the timeout is
reached before it is resolved. Should be specified as seconds and will
default to 10.

.. js:function:: publish(event[, options.reply][, options.timeout])

    
    :param Event event: Event instance to publish
    :param Boolean options.reply: Publish event and return promise.
    
    If *reply* is true, the promise will wait for a response and resolve
    with the reply event. Otherwise, the promise will be resolved once the
    event has been sent.
    
    If timeout is non-zero, the promise will be rejected if the timeout is
    reached before it is resolved. Should be specified as seconds and will
    default to 10.
    :param Number options.timeout: Timeout in seconds
    :return Promise: Publish event and return promise.
    
    If *reply* is true, the promise will wait for a response and resolve
    with the reply event. Otherwise, the promise will be resolved once the
    event has been sent.
    
    If timeout is non-zero, the promise will be rejected if the timeout is
    reached before it is resolved. Should be specified as seconds and will
    default to 10.
    

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
    
