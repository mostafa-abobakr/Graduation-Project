export const mockInventoryItems = [
  {
    id: "1",
    itemName: "Fresh Atlantic Salmon",
    category: "Meat & Seafood",
    quantity: 15,
    unit: "kg",
    expiryDate: "2026-05-10",
    status: "In Stock",
    supplier: "Ocean Foods Inc.",
    costPerUnit: 25.5,
    reorderLevel: 10,
    history: [
      { date: "2026-04-10", type: "add", amount: 20 },
      { date: "2026-04-15", type: "use", amount: 5 },
    ]
  },
  {
    id: "2",
    itemName: "Organic Tomatoes",
    category: "Vegetables",
    quantity: 4,
    unit: "kg",
    expiryDate: "2026-04-20",
    status: "Low Stock",
    supplier: "Green Valley Farms",
    costPerUnit: 3.2,
    reorderLevel: 5,
    history: [
      { date: "2026-04-12", type: "add", amount: 15 },
      { date: "2026-04-16", type: "use", amount: 11 },
    ]
  },
  {
    id: "3",
    itemName: "Whole Milk",
    category: "Dairy",
    quantity: 2,
    unit: "liter",
    expiryDate: "2026-04-19",
    status: "Expiring",
    supplier: "Dairy Co.",
    costPerUnit: 1.5,
    reorderLevel: 10,
    history: [
      { date: "2026-04-05", type: "add", amount: 20 },
      { date: "2026-04-17", type: "use", amount: 18 },
    ]
  },
  {
    id: "4",
    itemName: "Avocados",
    category: "Vegetables",
    quantity: 0,
    unit: "kg",
    expiryDate: "2026-04-25",
    status: "Out of Stock",
    supplier: "Green Valley Farms",
    costPerUnit: 8.0,
    reorderLevel: 5,
    history: [
      { date: "2026-04-01", type: "add", amount: 10 },
      { date: "2026-04-18", type: "use", amount: 10 },
    ]
  },
  {
    id: "5",
    itemName: "Olive Oil",
    category: "Pantry",
    quantity: 25,
    unit: "liter",
    expiryDate: "2027-01-10",
    status: "In Stock",
    supplier: "Mediterranean Imports",
    costPerUnit: 15.0,
    reorderLevel: 5,
    history: [
      { date: "2026-01-10", type: "add", amount: 30 },
      { date: "2026-03-15", type: "use", amount: 5 },
    ]
  }
];

export const mockUsageData = [
  { name: 'Jan', usage: 400 },
  { name: 'Feb', usage: 300 },
  { name: 'Mar', usage: 550 },
  { name: 'Apr', usage: 480 },
  { name: 'May', usage: 600 },
  { name: 'Jun', usage: 700 },
];

export const mockTopConsumed = [
  { name: 'Chicken Breast', value: 400 },
  { name: 'Tomatoes', value: 300 },
  { name: 'Onions', value: 300 },
  { name: 'Rice', value: 200 },
];

export const mockAlerts = [
  { id: 1, type: "low_stock", item: "Organic Tomatoes", currentQuantity: "4 kg", message: "Below reorder level of 5 kg", action: "Reorder", resolved: false },
  { id: 2, type: "expiring", item: "Whole Milk", currentQuantity: "2 liter", message: "Expires in 1 day", action: "Use Today", resolved: false },
  { id: 3, type: "out_of_stock", item: "Avocados", currentQuantity: "0 kg", message: "Item completely depleted", action: "Reorder immediately", resolved: false },
];
