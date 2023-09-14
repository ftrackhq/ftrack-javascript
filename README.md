# ftrack Javascript API Client

The Javascript API Client is a JavaScript Library to help developing integrations that communicate with the ftrack API and Event server.

This documentation focuses on the client. More information about the API and its concepts can be found at our [general API documentation](https://help.ftrack.com/en/collections/133732-developing-with-ftrack-studio). You may also find it useful to look at the documentation for the [Python client](https://github.com/ftrackhq/ftrack-python).

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

### Further documentation

We are currently overhauling our documentation. The old documentation is still available in the [doc](/doc) folder in the repository. If there's any part of the client that is confusing and that you would like us to expand the documentation for, please add a GitHub issue and we'll try to get to it as soon as possible.
