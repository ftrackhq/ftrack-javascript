import { Server } from "mock-socket";

const HEARTBEAT_INTERVAL = 2000; // 2 seconds

export const mockedServer = new Server(
  "ws://ftrack.test/socket.io/1/websocket/1234567890"
);

mockedServer.on("connection", (socket) => {
  let heartbeatTimer;

  // Handle 'message' events
  socket.on("message", (message) => {
    // Parse incoming message
    const [type, id, endpoint, data] = message.split(":");

    // Check for protocol version compatibility
    if (type === "0") {
      const [version] = data.split("|");
      if (version !== "0.9") {
        socket.close();
        return;
      }
    }

    // Handle different message types
    switch (type) {
      case "1": // Connect
        // Send acknowledgement message back
        socket.send(`1::${endpoint}`);
        // Start sending heartbeat messages
        startHeartbeat(socket);
        break;
      case "2": // Heartbeat
        // Do nothing, just reset the heartbeat timer
        resetHeartbeat(socket);
        break;
      case "3": // Message
        // Broadcast message to all connected sockets
        mockedServer.clients.forEach((client) => {
          if (client !== socket) {
            client.send(`3:${id}:${endpoint}:${data}`);
          }
        });
        break;
      case "4": // JSON Message
        // Broadcast JSON message to all connected sockets
        mockedServer.clients.forEach((client) => {
          if (client !== socket) {
            client.send(`4:${id}:${endpoint}:${data}`);
          }
        });
        break;
      case "5": // Event
        // Broadcast event to all connected sockets
        mockedServer.clients.forEach((client) => {
          if (client !== socket) {
            client.send(`5:${id}:${endpoint}:${data}`);
          }
        });
        break;
      case "6": // Acknowledge
        // Do nothing, just a confirmation from the client
        break;
      case "7": // Error
        // Send error message back to client
        socket.send(`7::${endpoint}:${data}`);
        break;
      case "8": // No Operation (noop)
        // Do nothing
        break;
      case "0": // Disconnect
        socket.close();
        break;
      default:
        console.log(`Unknown message type: ${type}`);
    }
  });

  // Handle 'close' events
  socket.on("close", () => {
    console.log(`Socket ${socket.id} disconnected`);
    // Stop sending heartbeat messages
    stopHeartbeat(socket);
  });

  // Helper functions

  function startHeartbeat(socket) {
    heartbeatTimer = setInterval(() => {
      socket.send("2::");
    }, HEARTBEAT_INTERVAL);
  }

  function resetHeartbeat(socket) {
    clearInterval(heartbeatTimer);
    startHeartbeat(socket);
  }

  function stopHeartbeat() {
    clearInterval(heartbeatTimer);
  }
  // New functions to send messages
  function sendEvent(event, data, targetSocket = null) {
    const eventData = JSON.stringify({ name: event, args: [data] });
    const message = `5:::${eventData}`;
    if (targetSocket) {
      targetSocket.send(message);
    } else {
      mockedServer.clients.forEach((client) => {
        client.send(message);
      });
    }
  }

  function sendHeartbeat(targetSocket) {
    targetSocket.send("2::");
  }

  function sendConnect(targetSocket) {
    targetSocket.send("1::");
  }

  function sendError(errorData, targetSocket = null) {
    const message = `7:::${JSON.stringify(errorData)}`;
    if (targetSocket) {
      targetSocket.send(message);
    } else {
      mockedServer.clients.forEach((client) => {
        client.send(message);
      });
    }
  }
  // Exported functions
  socket.sendEvent = (event, data) => sendEvent(event, data, socket);
  socket.sendHeartbeat = () => sendHeartbeat(socket);
  socket.sendConnect = () => sendConnect(socket);
  socket.sendError = (errorData) => sendError(errorData, socket);
});
export function closeServer() {
  mockedServer.close();
}
