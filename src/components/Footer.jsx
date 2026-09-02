import { Link } from "react-router-dom";

const footerLinks = [
  { to: "/", label: "Home" },
  { to: "/lost-items", label: "Lost Items" },
  { to: "/found-items", label: "Found Items" },
  { to: "/report-lost", label: "Report Lost" },
  { to: "/report-found", label: "Report Found" },
];

const linkClassName =
  "inline-flex min-h-[44px] items-center text-[0.95rem] text-ink underline-offset-4 transition-colors duration-200 hover:text-brick hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

function Footer() {
  return (
    <footer className="border-t border-line bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <section className="border-b border-line py-10 md:border-b-0 md:border-r md:py-12 md:pr-10">
            <p className="font-serif text-3xl font-semibold leading-tight text-ink">
              CampusFind
            </p>
            <p className="mt-2 text-sm font-semibold text-canopy">
              GCOEC Chandrapur
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-mute">
              Campus lost & found
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-mute">
              Helping students find lost belongings and return found items
              across campus.
            </p>
          </section>

          <nav
            className="border-b border-line py-10 md:border-b-0 md:border-r md:py-12 md:px-10"
            aria-label="Footer"
          >
            <h2 className="font-serif text-lg font-semibold text-ink">
              Quick Links
            </h2>
            <div className="mt-2 h-px w-10 bg-brick" aria-hidden="true" />
            <ul className="mt-4">
              {footerLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClassName}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className="py-10 md:py-12 md:pl-10">
            <h2 className="font-serif text-lg font-semibold text-ink">
              Contact Us
            </h2>
            <div className="mt-2 h-px w-10 bg-brick" aria-hidden="true" />
            <address className="mt-4 not-italic text-sm leading-6 text-mute">
              Government College of Engineering,
              <br />
              Chandrapur, Maharashtra - 442403
            </address>
            <p className="mt-5 text-sm leading-6">
              <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-mute">
                Email
              </span>
              <a
                href="mailto:campusfind@gcoec.ac.in"
                className="mt-1 inline-flex min-h-[44px] items-center break-all text-[0.95rem] text-ink underline-offset-4 transition-colors duration-200 hover:text-brick hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                campusfind@gcoec.ac.in
              </a>
            </p>
          </section>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-sm text-mute sm:px-6 md:text-left">
          © 2026 CampusFind. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
