import { useEffect } from "react";

/**
 * Custom hook to dynamically update document title per route.
 * Reverts to base collegiate title on unmount.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title
      ? `${title} — CampusFind GCOEC`
      : "CampusFind — GCOEC Campus Lost & Found";
    return () => {
      document.title = previous;
    };
  }, [title]);
}
