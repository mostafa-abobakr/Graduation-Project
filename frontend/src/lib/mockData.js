// Menu items
export const menuItems = [
  { id: 1, name: "Chicken Burger", cost: 3.5, price: 9.99, category: "Burgers", image: "🍔" },
  { id: 2, name: "Pizza Margherita", cost: 4.0, price: 12.99, category: "Pizza", image: "🍕" },
  { id: 3, name: "Shawarma Wrap", cost: 3.0, price: 8.99, category: "Wraps", image: "🌯" },
  { id: 4, name: "French Fries", cost: 1.2, price: 4.99, category: "Sides", image: "🍟" },
  { id: 5, name: "Chicken Nuggets", cost: 2.5, price: 7.99, category: "Sides", image: "🍗" },
  { id: 6, name: "Caesar Salad", cost: 2.0, price: 8.49, category: "Salads", image: "🥗" },
  { id: 7, name: "Grilled Salmon", cost: 7.0, price: 18.99, category: "Mains", image: "🐟" },
  { id: 8, name: "Pasta Carbonara", cost: 3.5, price: 11.99, category: "Pasta", image: "🍝" },
];

const generateDailyData = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseVisitors = isWeekend ? 280 : 180;
    const visitors = baseVisitors + Math.floor(Math.random() * 80 - 20);
    const avgSpend = 14 + Math.random() * 4;
    const revenue = Math.round(visitors * avgSpend);
    const waste = isWeekend ? 4 + Math.random() * 3 : 6 + Math.random() * 4;
    data.push({
      date: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visitors,
      revenue,
      waste: Math.round(waste * 10) / 10,
      orders: Math.floor(visitors * 0.85),
      predictedVisitors: visitors + Math.floor(Math.random() * 20 - 10),
    });
  }
  return data;
};

export const dailyData = generateDailyData();

export const hourlyDemand = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 9;
  const isPeak = (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21);
  const base = isPeak ? 35 : 12;
  return { hour: `${hour}:00`, actual: base + Math.floor(Math.random() * 10), predicted: base + Math.floor(Math.random() * 8) };
});

export const menuAnalytics = menuItems.map(item => ({
  ...item,
  ordersToday: Math.floor(Math.random() * 50 + 10),
  predictedDemand: Math.floor(Math.random() * 55 + 15),
  wastePercent: Math.round((Math.random() * 12 + 2) * 10) / 10,
  trend: Math.random() > 0.5 ? "up" : "down",
  trendValue: Math.round(Math.random() * 20),
}));

export const wasteByItem = menuItems.map(item => ({
  name: item.name,
  waste: Math.round(Math.random() * 8 + 1),
  cost: Math.round((Math.random() * 30 + 5) * 100) / 100,
}));

export const revenueByItem = menuItems.map(item => ({
  name: item.name,
  revenue: Math.round(item.price * (Math.random() * 40 + 15)),
  profit: Math.round((item.price - item.cost) * (Math.random() * 40 + 15)),
  margin: Math.round(((item.price - item.cost) / item.price) * 100),
}));

export const aiInsights = [
  { id: 1, type: "demand", title: "Weekend Demand Spike", description: "Chicken Burger demand increases by 35% on weekends. Consider preparing 40 extra units on Saturdays.", impact: "+$420/week", confidence: 94, priority: "high" },
  { id: 2, type: "preparation", title: "Evening Fries Rush", description: "Prepare 20% more French Fries between 7PM and 9PM to avoid stockouts during peak dinner hours.", impact: "+$180/week", confidence: 89, priority: "high" },
  { id: 3, type: "waste", title: "Pizza Waste Reduction", description: "Pizza Margherita waste decreased by 18% after implementing AI prediction. Continue current strategy.", impact: "-$95/week saved", confidence: 92, priority: "medium" },
  { id: 4, type: "demand", title: "Salad Seasonal Trend", description: "Caesar Salad orders expected to increase 25% in the next 2 weeks due to seasonal patterns.", impact: "+$210/week", confidence: 78, priority: "medium" },
  { id: 5, type: "waste", title: "Nuggets Overproduction", description: "Chicken Nuggets are being overproduced by 15% on weekdays. Reduce preparation by 8 units.", impact: "-$65/week saved", confidence: 86, priority: "low" },
  { id: 6, type: "preparation", title: "Lunch Rush Optimization", description: "Start Shawarma prep 30 minutes earlier to handle the 12:30 PM surge efficiently.", impact: "+$150/week", confidence: 91, priority: "high" },
];

export const todaySummary = {
  predictedVisitors: 245, expectedRevenue: 4280, wasteReduction: 23, ordersToday: 198,
  visitorsChange: 12, revenueChange: 8.5, wasteChange: -15, ordersChange: 5.2,
};

export const weeklyHeatmap = (() => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 14 }, (_, i) => `${i + 9}:00`);
  return days.flatMap((day, di) =>
    hours.map((hour, hi) => {
      const isWeekend = di >= 5;
      const hourNum = hi + 9;
      const isPeak = (hourNum >= 12 && hourNum <= 14) || (hourNum >= 18 && hourNum <= 21);
      const base = (isWeekend ? 30 : 20) + (isPeak ? 25 : 0);
      return { day, hour, value: base + Math.floor(Math.random() * 15) };
    })
  );
})();

export const prepRecommendations = menuItems.map(item => ({
  item: item.name, emoji: item.image,
  currentPrep: Math.floor(Math.random() * 40 + 20),
  recommendedPrep: Math.floor(Math.random() * 45 + 25),
  confidence: Math.floor(Math.random() * 15 + 80),
  peakHour: `${Math.floor(Math.random() * 4 + 18)}:00`,
}));

export const staffMembers = [
  { id: 1, name: "Maria Garcia", role: "Head Chef", shift: "Morning", status: "active", hours: 42, rating: 4.9, avatar: "MG" },
  { id: 2, name: "James Wilson", role: "Sous Chef", shift: "Morning", status: "active", hours: 38, rating: 4.7, avatar: "JW" },
  { id: 3, name: "Aisha Patel", role: "Line Cook", shift: "Evening", status: "active", hours: 36, rating: 4.5, avatar: "AP" },
  { id: 4, name: "Carlos Rodriguez", role: "Server", shift: "Morning", status: "active", hours: 32, rating: 4.8, avatar: "CR" },
  { id: 5, name: "Emma Thompson", role: "Server", shift: "Evening", status: "on-leave", hours: 0, rating: 4.6, avatar: "ET" },
  { id: 6, name: "David Kim", role: "Bartender", shift: "Evening", status: "active", hours: 35, rating: 4.4, avatar: "DK" },
  { id: 7, name: "Sophie Brown", role: "Host", shift: "Morning", status: "active", hours: 28, rating: 4.9, avatar: "SB" },
  { id: 8, name: "Omar Hassan", role: "Dishwasher", shift: "Evening", status: "active", hours: 40, rating: 4.3, avatar: "OH" },
];

export const inventoryItems = [
  { id: 1, name: "Chicken Breast", category: "Meat", stock: 45, unit: "kg", reorderLevel: 20, cost: 8.50, supplier: "FreshMeats Co", lastOrder: "2026-03-06", status: "good" },
  { id: 2, name: "Pizza Dough", category: "Bakery", stock: 12, unit: "kg", reorderLevel: 15, cost: 3.20, supplier: "Baker's Best", lastOrder: "2026-03-05", status: "low" },
  { id: 3, name: "Lettuce", category: "Produce", stock: 8, unit: "kg", reorderLevel: 10, cost: 2.80, supplier: "Green Valley", lastOrder: "2026-03-07", status: "low" },
  { id: 4, name: "Mozzarella", category: "Dairy", stock: 25, unit: "kg", reorderLevel: 10, cost: 12.00, supplier: "DairyFresh", lastOrder: "2026-03-06", status: "good" },
  { id: 5, name: "French Fry Potatoes", category: "Produce", stock: 60, unit: "kg", reorderLevel: 30, cost: 1.50, supplier: "Green Valley", lastOrder: "2026-03-04", status: "good" },
  { id: 6, name: "Olive Oil", category: "Pantry", stock: 5, unit: "L", reorderLevel: 8, cost: 15.00, supplier: "MediterraneanGoods", lastOrder: "2026-03-01", status: "critical" },
  { id: 7, name: "Shawarma Spice Mix", category: "Pantry", stock: 3, unit: "kg", reorderLevel: 2, cost: 22.00, supplier: "SpiceWorld", lastOrder: "2026-03-03", status: "good" },
  { id: 8, name: "Salmon Fillet", category: "Seafood", stock: 18, unit: "kg", reorderLevel: 8, cost: 24.00, supplier: "OceanFresh", lastOrder: "2026-03-07", status: "good" },
];

export const customerFeedback = [
  { id: 1, customer: "Alex M.", rating: 5, comment: "The chicken burger was perfectly cooked. Best I've had in the area!", date: "2026-03-07", category: "food", sentiment: "positive" },
  { id: 2, customer: "Rebecca L.", rating: 4, comment: "Great ambiance and friendly staff. Fries were a bit cold though.", date: "2026-03-07", category: "mixed", sentiment: "positive" },
  { id: 3, customer: "Tom H.", rating: 2, comment: "Waited 40 minutes for our food. Kitchen seemed understaffed.", date: "2026-03-06", category: "service", sentiment: "negative" },
  { id: 4, customer: "Priya S.", rating: 5, comment: "The grilled salmon is outstanding. Fresh and seasoned beautifully.", date: "2026-03-06", category: "food", sentiment: "positive" },
  { id: 5, customer: "Michael R.", rating: 3, comment: "Food was okay but nothing special. Portions could be larger for the price.", date: "2026-03-05", category: "food", sentiment: "neutral" },
  { id: 6, customer: "Sarah K.", rating: 5, comment: "Love the sustainability focus! Great to see a restaurant reducing waste.", date: "2026-03-05", category: "general", sentiment: "positive" },
  { id: 7, customer: "Daniel W.", rating: 4, comment: "Pizza was delicious. Would love more vegetarian options on the menu.", date: "2026-03-04", category: "food", sentiment: "positive" },
  { id: 8, customer: "Lisa C.", rating: 1, comment: "Found a hair in my salad. Very disappointing experience.", date: "2026-03-04", category: "food", sentiment: "negative" },
];

export const feedbackSummary = {
  averageRating: 3.6, totalReviews: 847, positivePercent: 72, negativePercent: 12, neutralPercent: 16, weeklyTrend: +0.3,
};

export const restaurants = [
  { id: 1, name: "ZeroWaste Downtown", city: "Cairo", manager: "Ahmed Hassan", status: "active" },
  { id: 2, name: "ZeroWaste Marina", city: "Alexandria", manager: "Fatima Ali", status: "active" },
  { id: 3, name: "ZeroWaste Mall", city: "Giza", manager: "Omar Khalil", status: "active" },
  { id: 4, name: "ZeroWaste Airport", city: "Cairo", manager: "Sara Mohamed", status: "inactive" },
];

export const restaurantStats = restaurants.map(r => ({
  ...r,
  visitors: Math.floor(Math.random() * 200 + 120),
  revenue: Math.floor(Math.random() * 5000 + 2000),
  waste: Math.round((Math.random() * 8 + 3) * 10) / 10,
  orders: Math.floor(Math.random() * 180 + 80),
  staff: Math.floor(Math.random() * 10 + 5),
  rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
}));

export const platformSummary = {
  totalRestaurants: restaurants.length,
  activeRestaurants: restaurants.filter(r => r.status === "active").length,
  totalRevenue: restaurantStats.reduce((s, r) => s + r.revenue, 0),
  totalVisitors: restaurantStats.reduce((s, r) => s + r.visitors, 0),
  totalOrders: restaurantStats.reduce((s, r) => s + r.orders, 0),
  avgWaste: Math.round(restaurantStats.reduce((s, r) => s + r.waste, 0) / restaurantStats.length * 10) / 10,
  totalStaff: restaurantStats.reduce((s, r) => s + r.staff, 0),
  revenueChange: 14.2, visitorsChange: 9.8, wasteChange: -18.5,
};
