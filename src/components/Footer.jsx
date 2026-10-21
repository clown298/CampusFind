import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

const itemLinks = [
  { to: "/lost-items", label: "Lost Items" },
  { to: "/found-items", label: "Found Items" },
  { to: "/report-lost", label: "Report Lost" },
  { to: "/report-found", label: "Report Found" },
];

const accountLinks = [
  { to: "/my-reports", label: "My Reports" },
  { to: "/recovery-requests", label: "Recovery Requests" },
  { to: "/login", label: "Login" },
  { to: "/register", label: "Create Account" },
];

function Footer() {
  return (
    <footer className="border-t border-line/30 bg-[#18191B] text-[#E8E4DD]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-control pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <BrandMark size={36} tone="inverse" className="rounded-control" />
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                CampusFind
              </span>
            </Link>

            <p className="mt-4 text-sm font-semibold text-white">
              Campus Lost &amp; Found
            </p>

            <p className="mt-1 text-sm text-white/70">
              Government College of Engineering, Chandrapur
            </p>

            <address className="mt-2 max-w-sm text-sm not-italic leading-relaxed text-white/70">
              Ballarshah Bypass Road, Babupeth,
              <br />
              Chandrapur, Maharashtra – 442403, India
            </address>

            <div className="mt-4">
              <a
                href="mailto:gcoec@campusfind.com"
                className="inline-flex min-h-[40px] items-center text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                gcoec@campusfind.com
              </a>
            </div>

            <p className="mt-5 max-w-md text-xs leading-relaxed text-white/50">
              A campus platform for reporting, matching, and recovering lost and
              found items across GCOEC.
            </p>
          </div>

          <nav className="lg:col-span-1" aria-label="Items">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-light">
              Items
            </h2>

            <ul className="mt-4 space-y-1">
              {itemLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="inline-flex min-h-[40px] items-center text-sm text-white/70 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-1" aria-label="Account">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-light">
              Account
            </h2>

            <ul className="mt-4 space-y-1">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="inline-flex min-h-[40px] items-center text-sm text-white/70 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} CampusFind. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Government College of Engineering, Chandrapur</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
