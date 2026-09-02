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

  localStorage.setItem("lostItems", JSON.stringify(DEMO_LOST_ITEMS));
  return DEMO_LOST_ITEMS;
}

function LostItemProvider({ children }) {

  const [lostItems, setLostItems] = useState(() => {
    return ensureLostItemsSeeded();
  });

  useEffect(() => {
    localStorage.setItem("lostItems", JSON.stringify(lostItems));
    if (!localStorage.getItem(SEED_FLAG)) {
      localStorage.setItem(SEED_FLAG, "1");
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
      }}
    >
      {children}
    </LostItemContext.Provider>
  );
}

export default LostItemProvider;