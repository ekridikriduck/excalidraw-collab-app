export const SOCKET_URL = process.env.REACT_APP_SOCKET_BACKEND_URL;
export const WC_PROJECT_ID = process.env.REACT_APP_WC_PROJECT_ID;

export const EMIT_EVENT_MAP = {
  JOIN_ROOM: "join-room",
  SERVER_VOLATILE_BROADCAST: "server-volatile-broadcast",
  SERVER_BROADCAST: "server-broadcast",
  SAVE_SCENE: "save-scene",
};

export const EVENT_TYPE_MAP = {
  MOUSE_LOCATION: "MOUSE_LOCATION",
  SCENE_UPDATE: "SCENE_UPDATE",
};

export const SOCKET_ON_EVENT_MAP = {
  CLIENT_BROADCAST: "client-broadcast",
  ROOM_USER_CHANGE: "room-user-change",
};
