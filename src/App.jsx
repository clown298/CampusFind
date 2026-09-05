import { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import LostItemsPage from "./pages/LostItemsPage";
import FoundItemsPage from "./pages/FoundItemsPage";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import ItemDetails from "./pages/ItemDetails";

import { LostItemContext } from "./context/LostItemContext";
import { FoundItemContext } from "./context/FoundItemContext";

function StorageAlert({ title, message, onDismiss }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="border-b border-lost bg-lost/5"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-lost">{title}</p>
            <p className="mt-0.5 text-sm leading-6 text-ink">
              {message}
            </p>
          </div>
          <div className="shrink-0 sm:ml-4">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-[32px] items-center justify-center rounded-[4px] border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors duration-150 hover:border-mute/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              aria-label="Dismiss storage alert"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const lostCtx = useContext(LostItemContext);
  const foundCtx = useContext(FoundItemContext);

  const lostErr = lostCtx && lostCtx.persistenceError;
  const foundErr = foundCtx && foundCtx.persistenceError;
  const showStorageAlert = !!(lostErr || foundErr);

  function handleDismiss() {
    if (lostCtx && typeof lostCtx.dismissPersistenceError === "function") {
      lostCtx.dismissPersistenceError();
    }
    if (foundCtx && typeof foundCtx.dismissPersistenceError === "function") {
      foundCtx.dismissPersistenceError();
    }
  }

  let alertTitle;
  let alertMessage;
  if (lostErr && foundErr) {
    alertTitle = "Changes may not be saved — browser storage is full";
    alertMessage = `${lostErr} ${foundErr}`;
  } else if (lostErr) {
    alertTitle = "Lost items — browser storage is full";
    alertMessage = lostErr;
  } else {
    alertTitle = "Found items — browser storage is full";
    alertMessage = foundErr;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[6px] focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Skip to main content
      </a>

      <Navbar />

      {showStorageAlert ? (
        <StorageAlert
          title={alertTitle}
          message={alertMessage}
          onDismiss={handleDismiss}
        />
      ) : null}

      <main id="main-content" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lost-items" element={<LostItemsPage />} />
          <Route path="/lost-items/:id" element={<ItemDetails type="lost" />} />
          <Route path="/found-items" element={<FoundItemsPage />} />
          <Route path="/found-items/:id" element={<ItemDetails type="found" />} />
          <Route path="/report-lost" element={<ReportLost />} />
          <Route path="/report-found" element={<ReportFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
