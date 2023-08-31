import { getSceneVersion } from "@excalidraw/excalidraw";
import { reconcileElements } from "./utils";
import {
  EMIT_EVENT_MAP,
  EVENT_TYPE_MAP,
  SOCKET_ON_EVENT_MAP,
} from "./constants";

class SocketWrapper {
  excalidrawApi = null;
  socketClient = null;
  socketRoomId = null;
  collaborators = null;
  address = null;
  lastOrLatestSceneVersion = -1;
  constructor(excalidrawApi) {
    this.excalidrawApi = excalidrawApi;
  }

  setLastOrLatestSceneVersion(version) {
    this.lastOrLatestSceneVersion = version;
  }

  openSocket(socket, roomId, address) {
    this.socketClient = socket;
    this.socketRoomId = roomId;
    this.address = address;
    this.socketClient.on(SOCKET_ON_EVENT_MAP.ROOM_USER_CHANGE, (data = []) => {
      const collaborators = new Map();
      data.forEach((d) => {
        if (!collaborators.has(d)) collaborators.set(d, { username: address });
      });

      this.excalidrawApi.updateScene({
        collaborators,
      });
      this.collaborators = collaborators;
    });

    this.socketClient.on(SOCKET_ON_EVENT_MAP.CLIENT_BROADCAST, async (data) => {
      const { type, socketId, pointer, button, selectedElementIds, payload } =
        data;
      switch (type) {
        case EVENT_TYPE_MAP.MOUSE_LOCATION:
          if (!socketId) return;
          const collaborators = this.collaborators || new Map();
          const user = collaborators.get(socketId) || {};
          user.pointer = pointer;
          user.button = button;
          user.selectedElementIds = selectedElementIds;
          user.username = this.address;
          collaborators.set(socketId, user);
          this.excalidrawApi.updateScene({
            collaborators,
          });

          this.collaborators = collaborators;
          break;
        case EVENT_TYPE_MAP.SCENE_UPDATE:
          const localElements =
            this.excalidrawApi.getSceneElementsIncludingDeleted();
          const appState = this.excalidrawApi.getAppState();
          const reconciledElements = reconcileElements(
            localElements,
            payload?.elements || [],
            appState
          );
          this.setLastOrLatestSceneVersion(getSceneVersion(reconciledElements));
          this.excalidrawApi.updateScene({
            elements: reconciledElements,
            commitToHistory: false,
          });
          break;
        default:
          break;
      }
    });
  }
  emitPointerUpdate(payload) {
    if (!this.socketClient || !this.socketRoomId) return;
    this.socketClient.emit(
      EMIT_EVENT_MAP.SERVER_VOLATILE_BROADCAST,
      this.socketRoomId,
      {
        type: EVENT_TYPE_MAP.MOUSE_LOCATION,
        socketId: this.socketClient.id,
        pointer: payload.pointer,
        button: payload.button || "up",
        selectedElementIds: this.excalidrawApi.getAppState().selectedElementIds,
      }
    );
  }

  emitSceneUpdate(scene) {
    if (!this.socketClient || !this.socketRoomId) return;
    const currentSceneVersion = getSceneVersion(scene);
    if (currentSceneVersion <= this.lastOrLatestSceneVersion) return;
    this.socketClient.emit(EMIT_EVENT_MAP.SERVER_BROADCAST, this.socketRoomId, {
      type: EVENT_TYPE_MAP.SCENE_UPDATE,
      payload: {
        elements: scene,
      },
    });
  }
}

export default SocketWrapper;
