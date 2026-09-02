import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import LostItemProvider from "./context/LostItemContext";
import FoundItemProvider from "./context/FoundItemContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>

      <LostItemProvider>
        <FoundItemProvider>

          <App />

        </FoundItemProvider>
      </LostItemProvider>

    </BrowserRouter>
  </React.StrictMode>
);