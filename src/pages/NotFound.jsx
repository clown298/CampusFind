import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import Button from "../components/Button";

function NotFound() {
  return (
    <PageShell title="Page Not Found" badgeText="404 Error">
      <div className="mx-auto w-full max-w-2xl py-8 text-center sm:py-12">
        <p className="type-display text-7xl font-bold leading-none tracking-tight text-primary/20 sm:text-8xl">
          404
        </p>
        <h2 className="type-title -mt-6 text-3xl font-semibold text-ink sm:-mt-8 sm:text-4xl">
          This page does not exist
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-mute">
          The page you are looking for was removed, renamed, or never existed.
          Check the address or head back to the CampusFind home page.
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Button to="/" variant="primary" className="w-full sm:w-auto">
            Back to Home
          </Button>
          <Button to="/lost-items" variant="secondary" className="w-full sm:w-auto">
            Browse Lost Items
          </Button>
        </div>
        <p className="mt-8 text-sm text-mute">
          Or{" "}
          <Link
            to="/report-lost"
            className="font-semibold text-primary underline underline-offset-4 hover:text-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            report a lost item
          </Link>{" "}
          so the campus community can help.
        </p>
      </div>
    </PageShell>
  );
}

export default NotFound;
