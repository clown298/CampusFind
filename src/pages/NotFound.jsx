import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";

function NotFound() {
  return (
    <PageShell title="Page not found">
      <EmptyState
        title="This page does not exist"
        description="The page you are looking for was removed, renamed, or never existed. Check the address or head back to the CampusFind home page."
        actionLabel="Back to Home"
        actionTo="/"
      />
    </PageShell>
  );
}

export default NotFound;