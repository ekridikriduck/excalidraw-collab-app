import { Excalidraw } from "@excalidraw/excalidraw";
import styled from "styled-components";
import { io as socketIOClient } from "socket.io-client";
import { useState, useEffect, useCallback } from "react";
import SocketWrapper from "../../SocketWrapper";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { EMIT_EVENT_MAP, SOCKET_URL } from "../../constants";

const ExcalidrawWrapper = styled.div`
  flex: 1;
  padding: 10px;
  overflow: hidden;
`;
const ShareLink = styled.button`
  background: #fff;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
  &:hover {
    background: #ddd;
  }
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 75vh;
  overflow: hidden;
  border: 1px solid #ddd;
  border-radius: 15px;
  padding: 20px;
`;

const useCallbackRefState = () => {
  const [refVal, setRefVal] = useState(null);
  const refCallback = useCallback((node) => {
    setRefVal(node);
  }, []);
  return [refVal, refCallback];
};

export const Whiteboard = () => {
  const { isConnected, address } = useAccount();

  const [excalidrawApi, excalidrawRefCallback] = useCallbackRefState();
  const [socketWrapper, setSocketWrapper] = useState(null);
  const { connectModalOpen, openConnectModal } = useConnectModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!excalidrawApi || !address) return;
    const { search } = location;
    if (!search) navigate("/");
    const searchParams = new URLSearchParams(search);

    const roomId = searchParams.get("room");

    if (!roomId) navigate("/");

    const socket = socketIOClient(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.emit(EMIT_EVENT_MAP.JOIN_ROOM, roomId);
    const sw = new SocketWrapper(excalidrawApi);
    sw.openSocket(socket, roomId, address);
    setSocketWrapper(sw);
    return () => {
      socket.disconnect();
    };
  }, [address, excalidrawApi, location, navigate]);

  useEffect(() => {
    if (!isConnected && !connectModalOpen) {
      openConnectModal();
    }
  }, [connectModalOpen, isConnected, openConnectModal]);

  useEffect(() => {
    return () => {
      let lastScene = null;
      if (excalidrawApi) {
        lastScene = excalidrawApi.getSceneElementsIncludingDeleted();
      }
      if (socketWrapper) {
        if (lastScene) socketWrapper.saveSceneOnServer(lastScene);
        socketWrapper.disconnect();
      }
    };
  }, [excalidrawApi, socketWrapper]);

  const onCopyShareLink = () => {
    const origin = window.location.origin;
    const { pathname, search } = location;
    const url = origin + "/#" + pathname + search;
    navigator.clipboard.writeText(url);
    setLinkCopied(() => {
      setTimeout(() => {
        setLinkCopied(false);
      }, 3000);
      return true;
    });
  };

  const onExcalidrawSceneChange = (scene = []) => {
    if (scene.length === 0 || !socketWrapper) return;
    socketWrapper.emitSceneUpdate(scene);
  };

  const onPointerUpdate = (payload) => {
    if (!socketWrapper) return;
    socketWrapper?.emitPointerUpdate(payload);
  };

  return (
    <ExcalidrawWrapper>
      <h1 style={{ textAlign: "center" }}>Excalidraw Collaborate</h1>
      <ShareLink onClick={onCopyShareLink}>
        {linkCopied ? "Copied" : "Copy Share Link"}
      </ShareLink>
      <CanvasContainer>
        <Excalidraw
          ref={excalidrawRefCallback}
          onChange={onExcalidrawSceneChange}
          onPointerUpdate={onPointerUpdate}
          isCollaborating={true}
        />
      </CanvasContainer>
    </ExcalidrawWrapper>
  );
};
