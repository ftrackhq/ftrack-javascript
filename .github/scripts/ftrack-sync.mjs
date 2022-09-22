import { v5 as uuid } from "uuid";

if (!process.env.FTRACK_API_KEY || !process.env.PR_JSON) {
  console.error(`This script is intended to be run in CI only. To run locally for development, use:
FTRACK_API_KEY="[dev api key]" PR_JSON='{"url":"https://github.com/ftrackhq/frontend/pull/120","body":"Resolves FTRACK-c018c026-3599-11ed-8012-aab5768efa1e"}' node ftrack-sync.mjs
`);
  process.exit(1);
}

const UUID_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

const requestHeaders = {
  "ftrack-api-key": process.env.FTRACK_API_KEY,
  "Content-Type": "application/json",
  "Response-Type": "application/json",
  "ftrack-user": "github_bot@ftrack.com",
  "ftrack-bulk": "true",
};

function getTaskIdsAndNoteIdsFromBody(body, prUrl) {
  const taskIds = Array.from(body.matchAll(/FTRACK-([\w\d-]+)/g)).map(
    (match) => match[1]
  );
  // generate a unique id for each note based on PR.html_url and taskId
  const uuids = taskIds.map((taskId) => ({
    noteId: uuid(prUrl + taskId, UUID_NAMESPACE),
    taskId,
  }));

  return uuids;
}

async function groupIntoExistingAndNewNoteIds(noteIds) {
  const response = await (
    await fetch("https://dev.ftrackapp.com/api", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify([
        {
          action: "query",
          expression: `select id, parent_id from Note where id in (${noteIds
            .map(({ noteId }) => noteId)
            .join(",")})`,
        },
      ]),
    })
  ).json();

  try {
    const existingIds = response[0].data.map((note) => ({
      noteId: note.id,
      taskId: note.parent_id,
    }));
    const newIds = noteIds.filter(
      ({ noteId }) =>
        !existingIds
          .map(({ noteId: existingNoteId }) => existingNoteId)
          .includes(noteId)
    );
    return { existingIds, newIds };
  } catch (error) {
    console.error("Error fetching existing notes - response:", response);
    throw error;
  }
}

function getNoteRequestBody(action, prUrl, { noteId, taskId }) {
  const linkDescription = prUrl.match(/\.com\/(.+)/)[1];

  const content = `PR opened: [${linkDescription}](${prUrl})

Last change: ${new Date().toISOString().replace("T", " ").slice(0, -8)} GMT`;

  return {
    action,
    entity_key: noteId,
    entity_type: "Note",
    entity_data: {
      id: noteId,
      parent_id: taskId,
      content,
      parent_type: "TypedContext",
      user_id: "76a40852-359d-11ed-8012-aab5768efa1e",
    },
  };
}

export async function getNotesRequestBody(PR) {
  if (!PR.body) return [];
  const taskIds = getTaskIdsAndNoteIdsFromBody(PR.body, PR.html_url);
  if (taskIds.length === 0) return [];
  const { existingIds, newIds } = await groupIntoExistingAndNewNoteIds(taskIds);
  return [
    ...newIds.map(getNoteRequestBody.bind(this, "create", PR.html_url)),
    ...existingIds.map(getNoteRequestBody.bind(this, "update", PR.html_url)),
  ];
}

const PR_JSON = JSON.parse(process.env.PR_JSON);
console.log("Input:", PR_JSON);
const notes = await getNotesRequestBody(PR_JSON);

if (notes.length === 0) {
  console.log("Couldn't find any notes to update, exiting...");
  process.exit(0);
}

console.log("Creating notes:", notes);

try {
  const response = await (
    await fetch("https://dev.ftrackapp.com/api", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(notes),
    })
  ).json();
  console.log("Response: ", response);
} catch (err) {
  console.error(err);
}
