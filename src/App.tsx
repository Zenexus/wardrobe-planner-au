import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Summary from "./pages/Summary";
import AddOnOrganisors from "./pages/AddOnOrganisors";

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/addon-organisors" element={<AddOnOrganisors />} />
          <Route path="/summary" element={<Summary />} />
        </Routes>
      </Router>
    </DndProvider>
  );
}
