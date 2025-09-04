import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Summary from "./pages/Summary";
import AddOnOrganisors from "./pages/AddOnOrganisors";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/addon-organisors" element={<AddOnOrganisors />} />
        <Route path="/summary" element={<Summary />} />
      </Routes>
    </Router>
  );
}
