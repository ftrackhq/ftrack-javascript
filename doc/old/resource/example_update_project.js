var projectName = "my_project";
var request = session.query(
  "select id from Project where name is " + projectName
);

request
  .then(function (response) {
    return response.data[0].id;
  })
  .then(function (projectId) {
    return session.update("Project", [projectId], {
      status: "hidden",
    });
  })
  .then(function (response) {
    console.info("Project hidden", response);
  });
