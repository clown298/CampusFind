import { createContext, useEffect, useState } from "react";

export const FoundItemContext = createContext();

const SEED_FLAG = "campusfind:seed:v20260903";

const DEMO_FOUND_ITEMS = [
  {
    id: 7,
    itemName: "Red Water Bottle",
    category: "Other",
    description:
      "Stainless steel insulated water bottle, glossy red with a grey flip-top cap. Small dented ring near the bottom.",
    location: "Auditorium",
    dateFound: "2026-08-25",
    contact: "Facility Desk — auditorium@gcoec.edu",
  },
  {
    id: 8,
    itemName: "Black USB Flash Drive",
    category: "Electronics",
    description:
      "Compact black 32GB USB stick. A white paper label with 'Sem 5 Notes' written on it in blue ink is taped to the body.",
    location: "Mechanical Department",
    dateFound: "2026-08-09",
    contact: "Prof. D. Kale — dkale@campus.edu",
  },
  {
    id: 9,
    itemName: "Brown Notebook",
    category: "Books",
    description:
      "A5-sized brown spiral-bound notebook. The first few pages have handwritten Thermodynamics notes and a stamped library barcode inside.",
    location: "Library",
    dateFound: "2026-07-22",
    contact: "Library Helpdesk — lib@gcoec.edu",
  },
  {
    id: 10,
    itemName: "Silver Keychain with Two Keys",
    category: "Keys",
    description:
      "Simple silver metal keyring holding two brass keys and a small rubber keychain charm of a football.",
    location: "Canteen",
    dateFound: "2026-06-18",
    contact: "Canteen Counter — 07172 123456",
  },
];

function ensureFoundItemsSeeded() {
  if (localStorage.getItem(SEED_FLAG)) {
    const savedItems = localStorage.getItem("foundItems");
    return savedItems ? JSON.parse(savedItems) : [];
  }

  try {
    localStorage.setItem("foundItems", JSON.stringify(DEMO_FOUND_ITEMS));
  } catch (_) {}
  return DEMO_FOUND_ITEMS;
}

function isQuotaError(err) {
  if (!err) return false;
  if (typeof err === "object" && typeof err.name === "string") {
    if (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      return true;
    }
  }
  const msg = String(err && err.message ? err.message : err);
  return /quota|quota exceeded|storage full|not enough space|NS_ERROR_DOM_QUOTA/i.test(
    msg
  );
}

function FoundItemProvider({ children }) {

  const [foundItems, setFoundItems] = useState(() => {
    return ensureFoundItemsSeeded();
  });

  const [persistenceError, setPersistenceError] = useState(null);

  function dismissPersistenceError() {
    setPersistenceError(null);
  }

  useEffect(() => {
    let serialized;
    try {
      serialized = JSON.stringify(foundItems);
    } catch (err) {
      console.error(
        "[FoundItemContext] Failed to serialize foundItems for persistence:",
        err
      );
      setPersistenceError(
        "Found items could not be prepared for permanent storage. " +
          "Your changes are visible for this session but may be lost if you refresh. " +
          "Please try again or remove very large images from your reports."
      );
      return;
    }

    const approxKB = Math.ceil(serialized.length / 1024);

    try {
      localStorage.setItem("foundItems", serialized);

      if (!localStorage.getItem(SEED_FLAG)) {
        try {
          localStorage.setItem(SEED_FLAG, "1");
        } catch (seedErr) {
          console.error(
            "[FoundItemContext] Failed to write seed flag after data persisted:",
            seedErr
          );
        }
      }

      setPersistenceError(null);
    } catch (err) {
      console.error(
        "[FoundItemContext] LocalStorage persistence failed for foundItems:",
        err
      );

      if (isQuotaError(err)) {
        setPersistenceError(
          `Browser storage is full (~${approxKB} KB needed for found items). ` +
            "Your found-item reports and photos are shown now but WILL BE LOST if you refresh this page. " +
            "To fix: delete old found items or remove large attached photos, then try again."
        );
      } else {
        setPersistenceError(
          "Found items could not be saved to permanent browser storage. " +
            "Your changes are visible for this session only. " +
            "Please try again — if this keeps happening, private/incognito or blocked storage may be the cause."
        );
      }
    }
  }, [foundItems]);

  function deleteFoundItem(id) {
    setFoundItems(
      foundItems.filter((item) => item.id !== id)
    );
  }

  function updateFoundItem(updatedItem) {
    setFoundItems(
      foundItems.map((item) =>
        item.id === updatedItem.id
          ? updatedItem
          : item
      )
    );
  }

  return (
    <FoundItemContext.Provider
      value={{
        foundItems,
        setFoundItems,
        deleteFoundItem,
        updateFoundItem,
        persistenceError,
        dismissPersistenceError,
      }}
    >
      {children}
    </FoundItemContext.Provider>
  );
}

export default FoundItemProvider;