var request = session.query("select name from Project");
request.then(function (response) {
  var projects = response.data;
  console.info("Listing " + projects.length + " projects");

  projects.forEach(function (project) {
    console.info(project.name);
  });
});
