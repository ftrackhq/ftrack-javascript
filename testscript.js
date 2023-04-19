import { Session } from "@ftrack/api";
const client = new Session(
  process.env.FTRACK_SERVER,
  process.env.FTRACK_API_USER,
  process.env.FTRACK_API_KEY
);

//this works.
client.query("select id from Project").then(console.log);

//this gets connection timeout.
client.eventHub.connect();

client.eventHub.subscribe("topic=*", (x) => {
  //this is never called due to the above timeout.
  console.log(x);
});
