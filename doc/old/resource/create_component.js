// Create a fake file. In real world this would come from a file dropped in the
// browser. Please note that the File constructor is not supported in all browsers.
var data = { foo: "bar" };
var file = new File([JSON.stringify(data)], "data.json");

var promise = session.createComponent(file);

promise.then((response) => {
  var component = response[0].data;
  console.debug("Component", component);
  console.debug("ComponentLocation", response[1].data);

  console.debug("Component URL: " + session.getComponentUrl(component.id));
  console.debug(
    "Component thumbnail URL: " + session.thumbnailUrl(component.id)
  );
});
