import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

function AuthMotif({ away = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 224 150"
      className="motif-settle mt-9 h-auto w-44 lg:w-56"
      aria-hidden="true"
      focusable="false"
    >
      {/* Notice pinned to the campus board */}
      <rect
        x="14"
        y="12"
        width="128"
        height="104"
        rx="10"
        fill="#FFFFFF"
        stroke="#E4DCD3"
        strokeWidth="2"
      />
      <circle cx="36" cy="34" r="5" fill="#B85437" />
      <path
        d="M34 56h90M34 72h74M34 88h52"
        stroke="#E4DCD3"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Magnifier — the finding half of the brand mark. It looks away while a
          password is being typed, then settles back. */}
      <g
        style={{
          transform: away ? "translate(6px, 10px)" : "translate(0, 0)",
          transformOrigin: "158px 84px",
          transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <circle
          cx="158"
          cy="84"
          r="28"
          fill="#FAF7F2"
          stroke="#B85437"
          strokeWidth="4"
        />
        <path
          d="m178 104 20 20"
          stroke="#B85437"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Recovered tick inside the lens */}
        <path
          d="m147 84 8 8 16-16"
          fill="none"
          stroke="#43684B"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function AuthLayout({
  badgeText = "GCOEC Campus",
  // description is accepted for API compatibility; the editorial column uses fixed copy
  // eslint-disable-next-line no-unused-vars
  description,
  footer,
  motifAway = false,
  children,
}) {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col bg-paper">
      <div className="mx-auto grid w-full min-w-0 max-w-[1440px] flex-1 grid-cols-1 items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:py-16">
        {/* Editorial column — warm paper, brand story, finding motif */}
        <div className="min-w-0 lg:col-span-7 lg:pr-10">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-control pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary">
              <BrandMark size={22} tone="inverse" />
            </span>
            <span>
              <span className="block font-display text-xl font-bold tracking-tight text-ink">
                CampusFind
              </span>
              <span className="type-eyebrow-plain block text-mute">
                GCOEC · Chandrapur
              </span>
            </span>
          </Link>

          <p className="type-display mt-7 max-w-lg text-[2rem] leading-[1.12] text-ink sm:text-[2.5rem] xl:text-[3rem]">
            Lost belongings find their way back.
          </p>

          <p className="mt-4 max-w-md text-[15px] leading-7 text-mute">
            Every report is tied to a verified GCOEC student account, so
            hand-backs stay genuine and every recovery is documented.
          </p>

          <AuthMotif away={motifAway} />

          <ul className="mt-7 hidden max-w-md space-y-3 lg:block">
            <li className="flex items-center gap-3 text-sm text-mute">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-primary/70"
                aria-hidden="true"
              />
              Report lost or found items with photos and location
            </li>
            <li className="flex items-center gap-3 text-sm text-mute">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-primary/70"
                aria-hidden="true"
              />
              Rule-based matching highlights possible pairs
            </li>
            <li className="flex items-center gap-3 text-sm text-mute">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-primary/70"
                aria-hidden="true"
              />
              Admin-verified recovery requests before hand-back
            </li>
          </ul>
        </div>

        {/* Form column — offset right, working surface of the page */}
        <div className="w-full min-w-0 lg:col-span-5">
          <div className="w-full max-w-md overflow-hidden rounded-card border border-line bg-surface shadow-sm shadow-black/5 lg:ml-auto">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-frost px-6 py-3.5">
              <span className="inline-flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary">
                  <BrandMark size={18} tone="inverse" />
                </span>
                <span className="type-card text-sm text-ink">CampusFind</span>
              </span>
              <span className="type-eyebrow-plain text-mute">{badgeText}</span>
            </div>

            <div className="p-6 sm:p-7">
              {children}

              {footer ? (
                <div className="mt-5 border-t border-line/60 pt-4 text-center text-[13px] text-mute">
                  {footer}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
