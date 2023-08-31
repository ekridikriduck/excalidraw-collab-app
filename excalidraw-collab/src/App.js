import { Routes, Route } from "react-router-dom";
import { Home, Whiteboard } from "./containers";

function App() {
  return (
    <div className="main-wrapper">
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/whiteboard" element={<Whiteboard />} />
      </Routes>
    </div>
  );
}

export default App;
