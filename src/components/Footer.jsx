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
    <footer className="border-t border-white/10 bg-ink text-frost">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-control pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-white text-ink">
                <BrandMark size={24} />
              </span>
              <span className="font-display text-lg font-bold leading-none text-white">
                CampusFind
              </span>
            </Link>

            <p className="mt-4 text-sm font-semibold text-white">
              Campus Lost &amp; Found
            </p>

            <p className="mt-1 text-[clamp(0.75rem,3.6vw,0.875rem)] text-white/65">
              Government College of Engineering, Chandrapur
            </p>

            <address className="mt-1.5 max-w-sm text-sm not-italic leading-6 text-white/55">
              Ballarshah Bypass Road, Babupeth,
              <br />
              Chandrapur, Maharashtra – 442403, India
            </address>

            <a
              href="mailto:gcoec@campusfind.com"
              className="mt-4 inline-flex min-h-[40px] items-center text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              gcoec@campusfind.com
            </a>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/50">
              A campus registry for reporting, matching, and recovering lost and
              found items across GCOEC.
            </p>
          </div>

          <nav
            className="lg:col-span-3"
            aria-label="Items"
          >
            <h2 className="type-eyebrow text-white/60">
              Items
            </h2>

            <ul className="mt-3 space-y-1">
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

          <nav
            className="lg:col-span-3"
            aria-label="Account"
          >
            <h2 className="type-eyebrow text-white/60">
              Account
            </h2>

            <ul className="mt-3 space-y-1">
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

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} CampusFind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;