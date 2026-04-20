import React, { createContext, useContext, useState } from "react";
import {
  inventoryItems as initialInventory,
  menuItems as initialMenuCards,
} from "@/lib/mockData";

export const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};

// Generate some basic mock recipes for the existing menu items so we can test the editing workflow right away.
const generateMockRecipes = (menuItems, inventoryList) => {
  return menuItems.map((item) => {
    // Just grab 2-3 random ingredients for each item
    const recipeIngredients = [];
    const numIngredients = Math.floor(Math.random() * 2) + 2; // 2 to 3
    for (let i = 0; i < numIngredients; i++) {
      const randomInv =
        inventoryList[Math.floor(Math.random() * inventoryList.length)];
      const alreadyAdded = recipeIngredients.find(
        (r) => r.ingredientId === randomInv.id,
      );
      if (!alreadyAdded) {
        recipeIngredients.push({
          ingredientId: randomInv.id,
          quantity: parseFloat((Math.random() * 2 + 0.1).toFixed(2)), // random qty between 0.1 and 2.1
        });
      }
    }
    return {
      ...item,
      recipe: recipeIngredients,
    };
  });
};

export const InventoryProvider = ({ children }) => {
  // Enhance initial inventory with the newly requested fields if missing.
  // The mockData `inventoryItems` already has name, unit, cost, supplier, category, stock, reorderLevel.
  // We need to add shelfLife handling (duration + isNonPerishable mapping).
  const enhancedInventory = initialInventory.map((item) => ({
    ...item,
    shelfLifeDays: Math.floor(Math.random() * 20) + 5, // random duration in days
    isNonPerishable: false,
  }));

  const enhancedMenuItems = generateMockRecipes(
    initialMenuCards,
    enhancedInventory,
  );

  const [inventory, setInventory] = useState(enhancedInventory);
  const [menuItems, setMenuItems] = useState(enhancedMenuItems);

  const addInventoryItem = (newItem) => {
    const id = Math.max(0, ...inventory.map((i) => i.id)) + 1;
    setInventory((prev) => [...prev, { ...newItem, id }]);
  };

  const updateInventoryItem = (id, updatedFields) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updatedFields } : item,
      ),
    );
  };

  const deleteInventoryItem = (id) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const updateMenuItemRecipe = (menuItemId, newRecipe) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === menuItemId ? { ...item, recipe: newRecipe } : item,
      ),
    );
  };

  const updateMenuItem = (menuItemId, updatedFields) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === menuItemId ? { ...item, ...updatedFields } : item,
      ),
    );
  };

  // Alert tracking for InventoryAlertsPage
  const [resolvedAlertKeys, setResolvedAlertKeys] = useState([]);
  const resolveAlert = (key) => setResolvedAlertKeys((prev) => [...prev, key]);
  const unresolveAll = () => setResolvedAlertKeys([]);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        menuItems,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        updateMenuItemRecipe,
        updateMenuItem,
        resolvedAlertKeys,
        resolveAlert,
        unresolveAll,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
