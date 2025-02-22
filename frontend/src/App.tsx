// import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Storage from "./components/Storage";
import TextEditor from "./components/TextEditor"; // Journal
import Todos from "./components/Todos";
// import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import ChatInterface from "./components/chat";
import { WebSocketProvider } from "./api";
// import { AuthProvider } from "./authContext";
import { ThemeProvider } from "@/components/theme-provider";
import "./styles.css";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <WebSocketProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="/journal" element={<TextEditor />} />
            <Route path="/todos" element={<Todos />} />
            {/* <Route path="/auth" element={<Auth />} /> */}
          </Routes>
        </Router>
        <ChatInterface />
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;
