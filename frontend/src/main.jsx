import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./features/auth/features.authContext";
import { GameProvider } from "./context/GameContext";
import { SocketProvider } from "./context/SocketContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <GameProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </GameProvider>
    </AuthProvider>
  </BrowserRouter>
);

// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import './index.css';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );