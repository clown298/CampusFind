import { createContext, useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

export const FoundItemContext = createContext();

function FoundItemProvider({ children }) {
  const [foundItems, setFoundItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  function dismissLoadError() {
    setLoadError(null);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest("/api/found-items");
        if (cancelled) return;
        const items = data && Array.isArray(data.items) ? data.items : [];
        setFoundItems(items);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("[FoundItemContext] Failed to load found items from API:", err);
        setLoadError(
          "Could not load found items. Please check your connection and try again."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addFoundItem(itemData) {
    const data = await apiRequest("/api/found-items", {
      method: "POST",
      body: itemData,
    });
    const savedItem = data && data.item;
    if (!savedItem) {
      const err = new Error("Failed to save found item.");
      err.code = "API_ERROR";
      throw err;
    }
    setFoundItems((prev) => [...prev, savedItem]);
    return savedItem;
  }

  async function updateFoundItem(updatedItem) {
    const data = await apiRequest(`/api/found-items/${updatedItem.id}`, {
      method: "PUT",
      body: updatedItem,
    });
    const savedItem = data && data.item;
    if (!savedItem) {
      const err = new Error("Failed to update found item.");
      err.code = "API_ERROR";
      throw err;
    }
    setFoundItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(savedItem.id) ? savedItem : item
      )
    );
    return savedItem;
  }

  async function deleteFoundItem(id) {
    await apiRequest(`/api/found-items/${id}`, { method: "DELETE" });
    setFoundItems((prev) =>
      prev.filter((item) => String(item.id) !== String(id))
    );
  }

  return (
    <FoundItemContext.Provider
      value={{
        foundItems,
        setFoundItems,
        addFoundItem,
        updateFoundItem,
        deleteFoundItem,
        isLoading,
        loadError,
        dismissLoadError,
      }}
    >
      {children}
    </FoundItemContext.Provider>
  );
}

export default FoundItemProvider;