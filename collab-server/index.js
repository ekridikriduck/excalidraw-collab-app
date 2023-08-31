import express from "express";
import { Server as SocketIO } from "socket.io";
import { createServer } from "http";
const EVENT_MAP = {
  JOIN_ROOM: "join-room",
  SERVER_VOLATILE_BROADCAST: "server-volatile-broadcast",
  SERVER_BROADCAST: "server-broadcast",
  CLIENT_BROADCAST: "client-broadcast",
  ROOM_USER_CHANGE: "room-user-change",
  DISCONNECT: "disconnect",
  CONNECTION: "connection",
  DISCONNECTING: "disconnecting",
};

const app = express();
const port = 8080;

const server = createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

try {
  const io = new SocketIO(server, {
    transports: ["websocket", "polling"],
    cors: {
      allowedHeaders: ["Content-Type", "Authorization"],
      origin: process.env.CORS_ORIGIN || "*",
    },
    allowEIO3: true,
  });

  io.on(EVENT_MAP.CONNECTION, (socket) => {
    io.to(`${socket.id}`).emit("init-room");
    // on join room
    socket.on(EVENT_MAP.JOIN_ROOM, async (roomID) => {
      console.log("join room", roomID);
      await socket.join(roomID);

      const sockets = await io.in(roomID).fetchSockets();
      if (sockets.length <= 1) {
        io.to(`${socket.id}`).emit("first-in-room");
      } else {
        socket.broadcast.to(roomID).emit("new-user", socket.id);
      }

      io.in(roomID).emit(
        EVENT_MAP.ROOM_USER_CHANGE,
        sockets.map((socket) => socket.id)
      );
    });

    // on broadcast
    socket.on(EVENT_MAP.SERVER_BROADCAST, (roomID, data) => {
      socket.broadcast.to(roomID).emit(EVENT_MAP.CLIENT_BROADCAST, data);
    });

    // on volatile broadcast
    socket.on(EVENT_MAP.SERVER_VOLATILE_BROADCAST, (roomID, data) => {
      socket.volatile.broadcast
        .to(roomID)
        .emit(EVENT_MAP.CLIENT_BROADCAST, data);
    });

    // on leave room
    socket.on(EVENT_MAP.DISCONNECTING, async () => {
      console.log("disconnecting");
      for (const roomID in socket.rooms) {
        const otherClients = (await io.in(roomID).fetchSockets()).filter(
          (_socket) => _socket.id !== socket.id
        );

        if (otherClients.length > 0) {
          socket.broadcast.to(roomID).emit(
            EVENT_MAP.ROOM_USER_CHANGE,
            otherClients.map((socket) => socket.id)
          );
        }
      }
    });

    socket.on(EVENT_MAP.DISCONNECT, () => {
      socket.removeAllListeners();
      socket.disconnect();
    });
  });
} catch (error) {
  console.error(error);
}
