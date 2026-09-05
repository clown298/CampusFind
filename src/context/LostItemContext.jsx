import { createContext, useEffect, useState } from "react";

export const LostItemContext = createContext();

const SEED_FLAG = "campusfind:seed:v20260903";

const DEMO_LOST_ITEMS = [
  {
    id: 1,
    itemName: "Black Leather Wallet",
    category: "Accessories",
    description:
      "Smooth black leather bifold wallet with initials 'RK' embossed on the front. Contains a few photocopy ID slips but no cash.",
    location: "Library",
    dateLost: "2026-08-29",
    contact: "Rohan K. — 98220 11234",
  },
  {
    id: 2,
    itemName: "Silver Scientific Calculator",
    category: "Electronics",
    description:
      "Casio FX-991ES Plus scientific calculator in silver. Small scratch on the top-right corner. Hinged protective cover included.",
    location: "Mechanical Department",
    dateLost: "2026-08-21",
    contact: "Sneha P. — sneha.p@campus.edu",
  },
  {
    id: 3,
    itemName: "Blue College Backpack",
    category: "Accessories",
    description:
      "Medium-sized navy blue backpack with the GCOEC embroidered logo. Has a side mesh pocket for a water bottle and a front zip pouch.",
    location: "Canteen",
    dateLost: "2026-08-12",
    contact: "Akash M. — 90112 55678",
  },
  {
    id: 4,
    itemName: "Engineering Drawing Kit",
    category: "Other",
    description:
      "Rectangular metal tin containing a compass, two set squares, a protractor, and a mechanical pencil. Engraved 'ED Sem 3' on the lid.",
    location: "Classroom Number 10",
    dateLost: "2026-07-27",
    contact: "Vaishnavi B. — vaishu.b@campus.edu",
  },
  {
    id: 5,
    itemName: "Wireless Earbuds Case",
    category: "Electronics",
    description:
      "Matte white wireless earbuds charging case. The lid has a tiny chip on the back edge and a sticker of a cartoon cat on the front.",
    location: "Mechanical Department",
    dateLost: "2026-07-14",
    contact: "Pranav S. — 86055 44321",
  },
  {
    id: 6,
    itemName: "GCOEC Student ID Card",
    category: "Documents",
    description:
      "Plastic student ID card for GCOEC Chandrapur. Laminated and printed with a photograph, roll number, and the institute seal.",
    location: "Library",
    dateLost: "2026-06-30",
    contact: "Ishwari T. — ishwari.t@campus.edu",
  },
];

function ensureLostItemsSeeded() {
  if (localStorage.getItem(SEED_FLAG)) {
    const savedItems = localStorage.getItem("lostItems");
    return savedItems ? JSON.parse(savedItems) : [];
  }

  try {
    localStorage.setItem("lostItems", JSON.stringify(DEMO_LOST_ITEMS));
  } catch (_) {}
  return DEMO_LOST_ITEMS;
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

function LostItemProvider({ children }) {

  const [lostItems, setLostItems] = useState(() => {
    return ensureLostItemsSeeded();
  });

  const [persistenceError, setPersistenceError] = useState(null);

  function dismissPersistenceError() {
    setPersistenceError(null);
  }

  useEffect(() => {
    let serialized;
    try {
      serialized = JSON.stringify(lostItems);
    } catch (err) {
      console.error(
        "[LostItemContext] Failed to serialize lostItems for persistence:",
        err
      );
      setPersistenceError(
        "Lost items could not be prepared for permanent storage. " +
          "Your changes are visible for this session but may be lost if you refresh. " +
          "Please try again or remove very large images from your reports."
      );
      return;
    }

    const approxKB = Math.ceil(serialized.length / 1024);

    try {
      localStorage.setItem("lostItems", serialized);

      if (!localStorage.getItem(SEED_FLAG)) {
        try {
          localStorage.setItem(SEED_FLAG, "1");
        } catch (seedErr) {
          console.error(
            "[LostItemContext] Failed to write seed flag after data persisted:",
            seedErr
          );
        }
      }

      setPersistenceError(null);
    } catch (err) {
      console.error(
        "[LostItemContext] LocalStorage persistence failed for lostItems:",
        err
      );

      if (isQuotaError(err)) {
        setPersistenceError(
          `Browser storage is full (~${approxKB} KB needed for lost items). ` +
            "Your lost-item reports and photos are shown now but WILL BE LOST if you refresh this page. " +
            "To fix: delete old lost items or remove large attached photos, then try again."
        );
      } else {
        setPersistenceError(
          "Lost items could not be saved to permanent browser storage. " +
            "Your changes are visible for this session only. " +
            "Please try again — if this keeps happening, private/incognito or blocked storage may be the cause."
        );
      }
    }
  }, [lostItems]);

  function deleteLostItem(id) {
    setLostItems(
      lostItems.filter((item) => item.id !== id)
    );
  }

  function updateLostItem(updatedItem) {
    setLostItems(
      lostItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  }

  return (
    <LostItemContext.Provider
      value={{
        lostItems,
        setLostItems,
        deleteLostItem,
        updateLostItem,
        persistenceError,
        dismissPersistenceError,
      }}
    >
      {children}
    </LostItemContext.Provider>
  );
}

export default LostItemProvider;