import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import Generate from "./pages/Generate";
import Dashboard from "./pages/Dashboard";
import { useSelector } from "react-redux";
import WebsiteEditor from "./pages/Editor";
import LiveSite from "./pages/LiveSite";
import Pricing from "./pages/Pricing";
export const serverUrl = import.meta.env.VITE_API_URL;
function App() {
  useGetCurrentUser();
  const { userData } = useSelector((state) => state.user);
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={userData ? <Dashboard /> : <Home />}
          />
          <Route
            path="/generate"
            element={userData ? <Generate /> : <Home />}
          />
          <Route
            path="/editor/:id"
            element={userData ? <WebsiteEditor /> : <Home />}
          />
          <Route path="/site/:id" element={<LiveSite />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
