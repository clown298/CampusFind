import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import LostItemsPage from "./pages/LostItemsPage";
import FoundItemsPage from "./pages/FoundItemsPage";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import ItemDetails from "./pages/ItemDetails";
import RecoveryRequestsPage from "./pages/RecoveryRequestsPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyReportsPage from "./pages/MyReportsPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[6px] focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lost-items" element={<LostItemsPage />} />
          <Route path="/lost-items/:id" element={<ItemDetails type="lost" />} />
          <Route path="/found-items" element={<FoundItemsPage />} />
          <Route path="/found-items/:id" element={<ItemDetails type="found" />} />
          <Route path="/report-lost" element={<ReportLost />} />
          <Route path="/report-found" element={<ReportFound />} />
          <Route
            path="/recovery-requests"
            element={<RecoveryRequestsPage />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <MyReportsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;