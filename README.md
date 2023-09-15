# ftrack Javascript API Client

The Javascript API Client is a JavaScript Library to help developing integrations that communicate with the ftrack API and Event server.

This documentation focuses on the client. More information about the API and its concepts can be found at our [general API documentation](https://help.ftrack.com/en/collections/133732-developing-with-ftrack-studio). You may also find it useful to look at the documentation for the [Python client](https://github.com/ftrackhq/ftrack-python).

  * [Installation](#installation)
  * [Tutorial](#tutorial)
    + [Query projects](#query-projects)
    + [Uploading files](#uploading-files)
  * [Handling Events](#handling-events)
    + [Connecting to event hub](#connecting-to-event-hub)
    + [Error handling](#error-handling)
    + [Subscribing to events](#subscribing-to-events)
    + [Subscriber information](#subscriber-information)
    + [Sending replies](#sending-replies)
    + [Publishing events](#publishing-events)
    + [Handling replies](#handling-replies)
    + [Limitations](#limitations)
    + [Methods](#methods)
    + [Further documentation](#further-documentation)

      
## Installation

npm:

```bash
npm install @ftrack/api
```

yarn:

```bash
yarn add @ftrack/api
```

## Tutorial

The API uses sessions to manage communication with an ftrack server. Create a session that connects to your ftrack server (changing the passed values as appropriate):

```javascript
const session = new ftrack.Session(
  "https://my-company.ftrackapp.com",
  "john.doe@example.com",
  "7545344e-a653-11e1-a82c-f22c11dd25eq"
);

await session.initializing;

console.info("API session initialized successfully.");
```

If everything works as expected, you should see the console message appear in the JavaScript console. If not, double check that the credentials you specified are correct.

The communication with the ftrack server in the JavaScript API is asynchronous, often returning Promises. When the session is constructed, the instance is returned immediately, while the API is being initialized in the background. Once the API has been initialized, the session.initializing promise will be resolved.

### Query projects

Now, let’s start using the API with an example. Let’s list the names of all projects.

```javascript
const response = await session.query("select name from Project");

const projects = response.data;
console.info("Listing " + projects.length + " projects");

console.log(projects.map((project) => project.name));
```

Each project returned will be a plain JavaScript object and contain the selected attributes.

The session contains a few other methods besides `query()`, such as `create()`, `update()` and `delete()`. Next up, let’s take a look at combining the query call with an update operation. Since the method return promises, we can chain various asynchronous operations one after the other.

In the example below a specific project is retrieved, and then its status is set to hidden, hiding the project from the UI.

```javascript
const projectName = "my_project";
const response = await session.query(
  "select id from Project where name is " + projectName
);
const projectId = response.data[0].id;
const response = await session.update("Project", [projectId], {
  status: "hidden",
});

console.info("Project hidden", response);
```

### Uploading files

Files are stored as components in ftrack. Here is an example on how to create a component from a file in ftrack and upload it to the `ftrack.server` location.

```javascript
const data = { foo: "bar" };
const file = new File([JSON.stringify(data)], "data.json");

const response = await session.createComponent(file);
const component = response[0].data;
console.debug("Component", component);
console.debug("ComponentLocation", response[1].data);

console.debug("Component URL: " + session.getComponentUrl(component.id));
console.debug("Component thumbnail URL: " + session.thumbnailUrl(component.id));
```

## Handling Events

The `EventHub` is a class that provides functionality to interact with an ftrack event server. It allows you to connect to the event server, subscribe to specific events, publish events, and handle event responses.

Events are generated in ftrack when things happen such as a task being updated or a new version being published. Each Session can optionally connect to the event server and can be used to subscribe to specific events and perform an action as a result. That action could be updating another related entity based on a status change or generating folders when a new shot is created for example.

The `EventHub` for each Session is accessible via `session.eventHub`.

### Connecting to event hub

To connect to the event hub, run `session.eventHub.connect()`. You can also automatically connect the event hub when it is instantiated by providing the option `autoConnectEventHub` when constructing the Session instance:

```javascript
session = new ftrack.Session(..., { autoConnectEventHub: true });
session.eventHub.isConnected();
```

### Error handling

A lot of the methods involve promises that might not always be resolved for various reasons. The examples will not have any error handling to keep them short, but make sure you have proper error handling when using the `EventHub`.

### Subscribing to events

To listen to events, you register a function against a subscription using Session.event_hub.subscribe. The subscription uses the expression syntax and will filter against each Event instance to determine if the registered function should receive that event. If the subscription matches, the registered function will be called with the Event instance as its sole argument. The Event instance is a mapping like structure and can be used like a normal dictionary.

The following example subscribes a function to receive all ‘ftrack.update’ events and then print out the entities that were updated:

```javascript
import { Session } from "@ftrack/api";

// Define a function to handle the received event
function myCallback(event) {
  // Iterate through the updated entities and print their data
  event.data.entities.forEach((entity) => {
    // Print data for the entity
    console.log(entity);
  });
}

// Create a session and automatically connect to the event hub
const session = new Session({ autoConnectEventHub: true });

// Subscribe to events with the 'ftrack.update' topic
session.eventHub.subscribe('topic=ftrack.update', myCallback);
```

### Subscriber information

When subscribing, you can also specify additional information about your subscriber. This contextual information can be useful when routing events, particularly when targeting events. By default, the event hub will set some default information, but it can be useful to enhance this. To do so, simply pass in *subscriber* as a object of data to the
`subscribe()` method:

```javascript
session.eventHub.subscribe(
    'topic=ftrack.update',
    myCallback,
    {
        id: 'my-unique-subscriber-id',
        applicationId: 'maya'
    }
)
```

### Sending replies

When handling an event it is sometimes useful to be able to send information back to the source of the event. For example, `ftrack.location.request-resolve` would expect a resolved path to be sent back.

You can craft a custom reply event if you want, but an easier way is just to return the appropriate data from your handler. Any value different from *null* or *undefined* will be automatically sent as a reply:
``` javascript
function onEvent(event) {
    // Send following data in automatic reply
    return { success: true, message: 'Cool!' };
}

session.eventHub.subscribe('topic=test-reply', onEvent)
```


### Publishing events

So far we have looked at listening to events coming from ftrack. However, you are also free to publish your own events (or even publish relevant ftrack events).

To do this, simply construct an instance of `Event` and pass it to `EventHub.publish()` via the session:

``` javascript
import { Event } from "@ftrack/api";

event = new Event(
    topic='my-company.some-topic',
    data={'key': 'value'}
);
session.eventHub.publish(event);
```

The event hub will automatically add some information to your event before it gets published, including the source of the event. By default the event source is just the event hub, but you can customise this to provide more relevant information if you want. 

### Handling replies

When publishing an event, you can specify `onReply` as a function which will be invoked whenever a reply event is received:

```javascript
function onReply(event) {
    console.info('Reply received', event.data)
}
session.eventHub.publish(event, { onReply: onReply });
```
It is often the case that you want to wait for a single reply. In this case, you can use the convenience method `publishAndWaitForReply()`. It will return a promise which will be resolved with the response. You can test this using two browser tabs. In the first, run the following to listen for event and reply:

```javascript
// Listen for events and reply
function onEvent(event) {
    console.info('Event received', event.data);
    return { message: 'Event acknowledged' };
}
session.eventHub.subscribe('topic=my-company.some-topic', onEvent);
```

In the second environment we will publish an event, wait for and log the response: 

```javascript
// Publish event and wait for reply
function onReply(event) {
    console.info('Promise resolved with reply', event.data)
}
function onError(error) {
    console.error('Reply not received', error)
}
var event = new ftrack.Event('my-company.some-topic', { message: 'Hello world!' });
session.eventHub.publishAndWaitForReply(event, { timeout: 5 }).then(onReply, onError);
```

### Limitations

The event hub in the JavaScript API has some minor differences and lacks some
of the features available in the [python counterpart](https://ftrack-python-api.rtd.ftrack.com/en/latest/handling_events.html).

#### Subscription expressions

The JavaScript API currently only support expressions on the format `topic=value` including wildcard support `topic=ftrack.*`, and more complex expressions such as filtering based on event source or data are not supported.

#### Target expression

Targeted events will invoke all subscribers of the topic, not just those
matching the target expression-

#### Stopping events

Subscription callback priorities and the ability to stop events is not
supported at this point.

### Methods

#### `connect()`

Connects to the event server.

```javascript
session.eventHub.connect();
```

#### `isConnected(): boolean`

Checks if the `EventHub` is connected to the event server.

```javascript
const isConnected = session.eventHub.isConnected(); // Returns true if connected, false otherwise
```

#### `publish(event: Event, options?: { onReply?: EventCallback, timeout?: number }): Promise<string>`

Publishes an event to the event server and returns a promise resolved with the event ID when the event is sent.

- `event` (Event): An instance of the `Event` class to publish.
- `options.onReply` (EventCallback, optional): A function to be invoked when a reply is received.
- `options.timeout` (number, optional): Timeout in seconds (default is 30 seconds).

Example:

```javascript
const event = new Event(/* ... */);
session.eventHub.publish(event, {
  onReply: (reply) => {
    // Handle the reply event
  },
  timeout: 60, 
})
```

#### `publishAndWaitForReply(event: Event, options: { timeout: number }): Promise<unknown>`

Publishes an event and waits for a single reply event.

- `event` (Event): An instance of the `Event` class to publish.
- `options.timeout` (number): Timeout in seconds for waiting for a reply event.

Returns a promise resolved with the reply event payload when received or rejects if no reply event is received within the specified timeout.

Example:

```javascript
const event = new EventEvent(
    topic='my-company.some-topic',
    data={'key': 'value'}
);
session.eventHub.publishAndWaitForReply(event, { timeout: 60 })
  .then((replyEvent) => {
    // Handle the reply event
  })
```

#### `subscribe(subscription: string, callback: EventCallback, metadata?: SubscriberMetadata): string`

Subscribes to events matching a specified subscription expression.

- `subscription` (string): The subscription expression in the format "topic=value" or with wildcards like "topic=ftrack.*".
- `callback` (EventCallback): A function to be called when an event matching the subscription is received. Callbacks can either be synchronous or asynchronous function. 
- `metadata` (SubscriberMetadata, optional): Optional metadata about the subscriber.

Returns a subscriber ID, which can be used to unsubscribe from events later.

Example:

```javascript
const subscriberId = session.eventHub.subscribe("topic=ftrack.action.launch", (eventPayload) => {
  // Handle the received event
});
```

#### `unsubscribe(identifier: string): boolean`

Unsubscribes from events based on a subscriber ID returned from the `subscribe` method.

- `identifier` (string): The subscriber ID to unsubscribe.

Returns `true` if a subscriber was removed, `false` otherwise.

Example:

```javascript
const subscriberId = session.eventHub.subscribe(/* ... */);
const unsubscribed = session.eventHub.unsubscribe(subscriberId);
if (unsubscribed) {
  console.log(`Unsubscribed subscriber with ID: ${subscriberId}`);
} else {
  console.log(`Subscriber with ID ${subscriberId} not found.`);
}
```

#### `getSubscriberByIdentifier(identifier: string): Subscriber | null`

Returns information about a subscriber based on its identifier.

- `identifier` (string): The subscriber identifier.

Returns a `Subscriber` object if found, or `null` if no subscriber with the specified identifier exists.

Example:

```javascript
const subscriberId = session.eventHub.subscribe(/* ... */);
const subscriber = session.eventHub.getSubscriberByIdentifier(subscriberId);
if (subscriber) {
  console.log("Subscriber information:", subscriber);
} else {
  console.log(`Subscriber with ID ${subscriberId} not found.`);
}
```

### Further documentation

We are currently overhauling our documentation. The old documentation is still available in the [doc/old](/doc/old) folder in the repository while we are adding new documentation files in the doc folder. If there's any part of the client that is confusing and that you would like us to expand the documentation for, please add a GitHub issue and we'll try to get to it as soon as possible.
