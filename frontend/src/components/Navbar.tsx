import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Files from "./components/Files";
import TextEditor from "./components/TextEditor";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import { WebSocketProvider, useWebSocket } from "./api"; // WebSocket Context
import { AuthProvider } from "./authContext";

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/files" element={<Files />} />
            <Route path="/text" element={<TextEditor />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
