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
  SAVE_SCENE: "save-scene",
  SCENE_UPDATE: "SCENE_UPDATE",
};

const app = express();
const port = process.env.PORT || 8080;

const server = createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// This can be reconciled on backend as we do on frontend
// that will require saving states by roomID and socketID
// and then we can reconcile elements and send the latest state to the client
// also could be a better implementation of saved states
const INTERNAL_SCENE_MAP_BY_ROOM_ID = {};

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
      const savedRoomState = INTERNAL_SCENE_MAP_BY_ROOM_ID[roomID];
      if (savedRoomState) {
        io.to(`${socket.id}`).emit(EVENT_MAP.CLIENT_BROADCAST, {
          type: EVENT_MAP.SCENE_UPDATE,
          payload: savedRoomState,
        });
      }

      io.in(roomID).emit(
        EVENT_MAP.ROOM_USER_CHANGE,
        sockets.map((socket) => socket.id)
      );
    });

    // on save scene
    socket.on(EVENT_MAP.SAVE_SCENE, (roomID, data) => {
      console.log("save scene - room ID", roomID, new Date().getTime());
      INTERNAL_SCENE_MAP_BY_ROOM_ID[roomID] = data;
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
