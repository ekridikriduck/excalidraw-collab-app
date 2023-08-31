import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect } from "react";
import styled from "styled-components";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { v4 } from "uuid";

const HomeWrapper = styled.div`
  flex: 1;
  padding: 75px;
`;
const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  border: 1px solid #ddd;
  border-radius: 15px;
`;
const PageTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;
export const Home = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected) return;
    const roomId = v4();
    navigate(`/whiteboard#room=${roomId}`);
  }, [isConnected, navigate]);

  return (
    <HomeWrapper>
      <HomeContainer>
        <PageTitle>Excalidraw Collaboration</PageTitle>
        <ConnectButton />
      </HomeContainer>
    </HomeWrapper>
  );
};
