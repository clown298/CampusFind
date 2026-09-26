import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import "@fontsource-variable/geist";

import LostItemProvider from "./context/LostItemContext";
import FoundItemProvider from "./context/FoundItemContext";
import RecoveryRequestProvider from "./context/RecoveryRequestContext";
import AuthProvider from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LostItemProvider>
          <FoundItemProvider>
            <RecoveryRequestProvider>

              <App />

            </RecoveryRequestProvider>
          </FoundItemProvider>
        </LostItemProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);