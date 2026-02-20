import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/clinic/Dashboard";
import Map from "./pages/clinic/Map";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/clinic/dashboard" replace />} />

        <Route path="/clinic/dashboard" element={<Dashboard />} />
        <Route path="/clinic/map" element={<Map />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;