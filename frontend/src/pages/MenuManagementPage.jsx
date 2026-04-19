
import { Card } from "@/components/ui/card";
import { menuItems } from "@/lib/mockData";
import { useState } from "react";
import { ChefHat } from "lucide-react";

export default function MenuManagementPage() {
  const [items, setItems] = useState(menuItems);

  return (
    <div className="space-y-5 animate-fade-in py-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ChefHat className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground text-sm">Add and edit your restaurant menu items</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className="p-6 bg-card border-border/60 hover:border-primary/30 transition-all premium-shadow"
          >
            <div className="mb-4 text-4xl">{item.image}</div>
            <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {item.category}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Cost: ${item.cost.toFixed(2)}
              </span>
              <span className="text-primary font-semibold">
                ${item.price.toFixed(2)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
