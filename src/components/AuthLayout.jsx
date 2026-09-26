import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

function AuthLayout({
  eyebrow = "GCOEC • Campus Lost & Found",
  description,
  footer,
  children,
}) {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col bg-ink">
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-control pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-white text-ink">
                <BrandMark size={24} />
              </span>
              <span className="font-display text-lg font-bold text-white">
                CampusFind
              </span>
            </Link>

            <p className="type-eyebrow mt-3.5 text-white/60">{eyebrow}</p>

            {description ? (
              <p className="mt-2 text-sm leading-6 text-white/60">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-7 overflow-hidden rounded-card border border-line bg-surface">
            <div className="p-6 sm:p-8">
              {children}

              {footer ? (
                <p className="mt-6 border-t border-line pt-5 text-center text-sm text-mute">
                  {footer}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;