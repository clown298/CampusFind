import { useContext, useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/lost-items", label: "Lost Items" },
  { to: "/found-items", label: "Found Items" },
  { to: "/recovery-requests", label: "Recovery Requests" },
];

function navLinkClass({ isActive }) {
  return [
    "inline-flex min-h-[44px] items-center border-b-2 px-1 text-[0.95rem] font-medium transition-colors duration-200",
    isActive
      ? "border-ink text-ink"
      : "border-transparent text-mute hover:text-ink",
  ].join(" ");
}

function Navbar() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

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
  }

  async function handleLogout() {
    closeMenu();
    try {
      await logout();
    } finally {
      navigate("/");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Primary">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link
            to="/"
            className="min-h-[44px] shrink-0 rounded-[6px] py-1 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            onClick={closeMenu}
          >
            <span className="font-serif text-2xl font-semibold leading-none text-ink">
              CampusFind
            </span>
            <span className="mt-0.5 block text-xs font-medium tracking-wide text-mute">
              GCOEC Chandrapur
            </span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/report-lost"
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] bg-brick px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brick-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Report Lost
            </Link>
            <Link
              to="/report-found"
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] border border-ink bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Report Found
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-reports"
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] px-3 text-sm font-semibold text-ink transition-colors duration-200 hover:text-brick focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  My Reports
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] border border-ink bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                Login
              </Link>
            )}
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[6px] border border-line bg-surface text-ink lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
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
                strokeWidth="2"
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
          <div
            id={menuId}
            ref={menuRef}
            className="border-t border-line pb-4 pt-2 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    [
                      "flex min-h-[44px] items-center rounded-[6px] px-3 text-base font-medium",
                      isActive
                        ? "bg-surface text-ink"
                        : "text-mute hover:bg-surface hover:text-ink",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <NavLink
                  to="/my-reports"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    [
                      "flex min-h-[44px] items-center rounded-[6px] px-3 text-base font-medium",
                      isActive
                        ? "bg-surface text-ink"
                        : "text-mute hover:bg-surface hover:text-ink",
                    ].join(" ")
                  }
                >
                  My Reports
                </NavLink>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/report-lost"
                onClick={closeMenu}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] bg-brick px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brick-hover"
              >
                Report Lost
              </Link>
              <Link
                to="/report-found"
                onClick={closeMenu}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] border border-ink bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper"
              >
                Report Found
              </Link>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] border border-ink bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
