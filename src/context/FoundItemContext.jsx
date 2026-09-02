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

  localStorage.setItem("foundItems", JSON.stringify(DEMO_FOUND_ITEMS));
  return DEMO_FOUND_ITEMS;
}

function FoundItemProvider({ children }) {

  const [foundItems, setFoundItems] = useState(() => {
    return ensureFoundItemsSeeded();
  });

  useEffect(() => {
    localStorage.setItem("foundItems", JSON.stringify(foundItems));
    if (!localStorage.getItem(SEED_FLAG)) {
      localStorage.setItem(SEED_FLAG, "1");
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
      }}
    >
      {children}
    </FoundItemContext.Provider>
  );
}

export default FoundItemProvider;