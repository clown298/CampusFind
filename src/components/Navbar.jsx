import { useContext, useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import BrandMark from "./BrandMark";

function navLinkClass({ isActive }) {
  return [
    "inline-flex min-h-[44px] items-center border-b-2 px-2 text-sm font-medium transition-colors duration-200",
    isActive
      ? "border-primary text-primary font-semibold"
      : "border-transparent text-ink/75 hover:text-ink hover:border-line",
  ].join(" ");
}

function accountLinkClass({ isActive }) {
  return [
    "block min-h-[40px] px-3 py-2 text-sm font-medium transition-colors duration-200",
    isActive ? "bg-paper text-ink font-semibold" : "text-ink hover:bg-paper",
  ].join(" ");
}

function Navbar() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const onLoginPage = location.pathname === "/login";
  const onReportPage = location.pathname === "/report-lost" || location.pathname === "/report-found";

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuId = useId();
  const accountId = useId();
  const reportId = useId();
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const accountRef = useRef(null);
  const reportRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const firstLink = menuRef.current?.querySelector("a");
    firstLink?.focus();
  }, [menuOpen]);

  useEffect(() => {
    if (!accountOpen) {
      return undefined;
    }

    function getItems() {
      const menu = accountRef.current?.querySelector('[role="menu"]');
      return menu ? Array.from(menu.querySelectorAll('[role="menuitem"]')) : [];
    }

    function handlePointerDown(event) {
      if (!accountRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }

      const items = getItems();
      if (items.length === 0) {
        return;
      }

      event.preventDefault();
      const index = items.indexOf(document.activeElement);

      if (event.key === "Home" || index === -1) {
        items[0].focus();
      } else if (event.key === "End") {
        items[items.length - 1].focus();
      } else if (event.key === "ArrowDown") {
        items[(index + 1) % items.length].focus();
      } else {
        items[(index - 1 + items.length) % items.length].focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!reportOpen) {
      return undefined;
    }

    function getItems() {
      const menu = reportRef.current?.querySelector('[role="menu"]');
      return menu ? Array.from(menu.querySelectorAll('[role="menuitem"]')) : [];
    }

    function handlePointerDown(event) {
      if (!reportRef.current?.contains(event.target)) {
        setReportOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setReportOpen(false);
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }

      const items = getItems();
      if (items.length === 0) {
        return;
      }

      event.preventDefault();
      const index = items.indexOf(document.activeElement);

      if (event.key === "Home" || index === -1) {
        items[0].focus();
      } else if (event.key === "End") {
        items[items.length - 1].focus();
      } else if (event.key === "ArrowDown") {
        items[(index + 1) % items.length].focus();
      } else {
        items[(index - 1 + items.length) % items.length].focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [reportOpen]);

  useEffect(() => {
    function handleResize() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
    setReportOpen(false);
    setAccountOpen(false);
  }

  function handleLogout() {
    closeMenu();
    setAccountOpen(false);
    navigate("/");
    logout().catch(() => {});
  }

  const desktopNav = [
    { to: "/", label: "Home", end: true },
    { to: "/lost-items", label: "Lost Items", end: false },
    { to: "/found-items", label: "Found Items", end: false },
  ];

  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur-sm sticky top-0 z-30">
      <nav className="mx-auto w-full max-w-[1440px] px-4 sm:px-8" aria-label="Primary">
        <div className="flex items-center justify-between gap-3 py-2.5">
          <Link
            to="/"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-control pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            onClick={closeMenu}
          >
            <BrandMark
              size={44}
              className="shrink-0 rounded-control shadow-sm shadow-black/5"
            />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold tracking-tight text-ink">
                CampusFind
              </span>
              <span className="mt-1 whitespace-nowrap text-xs font-medium tracking-normal text-mute">
                GCOEC &middot; Chandrapur
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-4 lg:flex xl:gap-5">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <NavLink to="/recovery-requests" className={navLinkClass}>
                Recovery Requests
              </NavLink>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 lg:flex xl:gap-2.5">
            <div className="relative" ref={reportRef}>
              <button
                type="button"
                aria-expanded={reportOpen}
                aria-haspopup="menu"
                aria-controls={reportId}
                onClick={() =>
                  setReportOpen((open) => {
                    const next = !open;
                    if (next) {
                      setAccountOpen(false);
                    }
                    return next;
                  })
                }
                className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-control border px-3.5 text-sm font-semibold transition-[background-color,border-color,transform] duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper xl:px-4 ${
                  onReportPage
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-line bg-surface text-ink hover:bg-frost"
                }`}
              >
                Report
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${
                    reportOpen ? "rotate-180" : ""
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 9 6 6 6-6"
                  />
                </svg>
              </button>
              {reportOpen && (
                <div
                  id={reportId}
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-60 animate-menu-in overflow-hidden rounded-control border border-line bg-surface py-1 shadow-md shadow-black/10"
                >
                  <NavLink
                    to="/report-lost"
                    role="menuitem"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex min-h-[40px] items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive ? "bg-paper text-primary font-semibold" : "text-ink hover:bg-paper"
                      }`
                    }
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-lost"
                      aria-hidden="true"
                    />
                    Report a lost item
                  </NavLink>
                  <NavLink
                    to="/report-found"
                    role="menuitem"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex min-h-[40px] items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive ? "bg-paper text-found font-semibold" : "text-ink hover:bg-paper"
                      }`
                    }
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-found"
                      aria-hidden="true"
                    />
                    Report a found item
                  </NavLink>
                </div>
              )}
            </div>
            {isAuthenticated ? (
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  aria-controls={accountId}
                  onClick={() =>
                    setAccountOpen((open) => {
                      const next = !open;
                      if (next) {
                        setReportOpen(false);
                      }
                      return next;
                    })
                  }
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 justify-center rounded-control border border-line bg-surface px-3.5 text-sm font-semibold text-ink transition-[background-color,transform] duration-200 hover:bg-frost active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  My Account
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${
                      accountOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </button>
                {accountOpen && (
                  <div
                    id={accountId}
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-52 animate-menu-in overflow-hidden rounded-control border border-line bg-surface py-1 shadow-md shadow-black/10"
                  >
                    <NavLink
                      to="/my-reports"
                      role="menuitem"
                      onClick={() => {
                        setAccountOpen(false);
                        closeMenu();
                      }}
                      className={accountLinkClass}
                    >
                      My Reports
                    </NavLink>
                    <NavLink
                      to="/recovery-requests"
                      role="menuitem"
                      onClick={() => {
                        setAccountOpen(false);
                        closeMenu();
                      }}
                      className={accountLinkClass}
                    >
                      Recovery Requests
                    </NavLink>
                    <div className="my-1 border-t border-line" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full min-h-[40px] px-3 py-2 text-left text-sm font-medium text-lost hover:bg-lost-tint"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={onLoginPage ? "/register" : "/login"}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-control border border-line bg-surface px-3.5 text-sm font-semibold text-ink transition-[background-color,transform] duration-200 hover:bg-frost active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper xl:px-4"
              >
                {onLoginPage ? "Sign up" : "Login"}
              </Link>
            )}
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-control border border-line bg-surface text-ink transition-[background-color,transform] duration-150 hover:bg-frost active:scale-95 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => {
              setMenuOpen((open) => {
                const next = !open;
                if (next) {
                  setReportOpen(false);
                  setAccountOpen(false);
                }
                return next;
              });
            }}
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-[65px] bg-ink/25 backdrop-blur-[2px] z-20 lg:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />
            <div
              id={menuId}
              ref={menuRef}
              className="relative z-30 border-t border-line bg-paper pb-5 pt-3 animate-menu-in lg:hidden shadow-lg shadow-black/5"
            >
              <div className="flex flex-col gap-1">
                <NavLink
                  to="/"
                  end
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    [
                      "flex min-h-[44px] items-center rounded-control px-3 text-base font-medium",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-ink/75 hover:bg-surface hover:text-ink",
                    ].join(" ")
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/lost-items"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    [
                      "flex min-h-[44px] items-center rounded-control px-3 text-base font-medium",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-ink/75 hover:bg-surface hover:text-ink",
                    ].join(" ")
                  }
                >
                  Lost Items
                </NavLink>
                <NavLink
                  to="/found-items"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    [
                      "flex min-h-[44px] items-center rounded-control px-3 text-base font-medium",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-ink/75 hover:bg-surface hover:text-ink",
                    ].join(" ")
                  }
                >
                  Found Items
                </NavLink>
                {isAuthenticated ? (
                  <>
                    <NavLink
                      to="/recovery-requests"
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        [
                          "flex min-h-[44px] items-center rounded-control px-3 text-base font-medium",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-ink/75 hover:bg-surface hover:text-ink",
                        ].join(" ")
                      }
                    >
                      Recovery Requests
                    </NavLink>
                    <NavLink
                      to="/my-reports"
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        [
                          "flex min-h-[44px] items-center rounded-control px-3 text-base font-medium",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-ink/75 hover:bg-surface hover:text-ink",
                        ].join(" ")
                      }
                    >
                      My Reports
                    </NavLink>
                  </>
                ) : (
                  <NavLink
                    to={onLoginPage ? "/register" : "/login"}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      [
                        "flex min-h-[44px] items-center rounded-control px-3 text-base font-medium",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-ink/75 hover:bg-surface hover:text-ink",
                      ].join(" ")
                    }
                  >
                    {onLoginPage ? "Sign up" : "Login"}
                  </NavLink>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-line/60 pt-3">
                <NavLink
                  to="/report-lost"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-control bg-lost px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-lost-dark active:scale-[0.97] ${
                      isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-paper" : ""
                    }`
                  }
                >
                  Report Lost
                </NavLink>
                <NavLink
                  to="/report-found"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-control bg-found px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-found-dark active:scale-[0.97] ${
                      isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-paper" : ""
                    }`
                  }
                >
                  Report Found
                </NavLink>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-[44px] cursor-pointer items-center rounded-control px-3 text-base font-medium text-lost hover:bg-lost-tint"
                  >
                    Logout
                  </button>
                ) : null}
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;