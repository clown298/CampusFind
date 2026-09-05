import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import LostItemProvider from "./context/LostItemContext";
import FoundItemProvider from "./context/FoundItemContext";
import RecoveryRequestProvider from "./context/RecoveryRequestContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>

      <LostItemProvider>
        <FoundItemProvider>
          <RecoveryRequestProvider>

            <App />

          </RecoveryRequestProvider>
        </FoundItemProvider>
      </LostItemProvider>

    </BrowserRouter>
  </React.StrictMode>
);