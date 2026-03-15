import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { menuItems } from "@/lib/mockData";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function MenuManagementPage() {
  const [items, setItems] = useState(menuItems);
  const [editItem, setEditItem] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", cost: "", price: "", category: "", image: "" });

  const openNew = () => { setEditItem(null); setForm({ name: "", cost: "", price: "", category: "", image: "🍽️" }); setIsOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, cost: String(item.cost), price: String(item.price), category: item.category, image: item.image }); setIsOpen(true); };
  const handleSave = () => {
    const newItem = { id: editItem?.id || Date.now(), name: form.name, cost: parseFloat(form.cost), price: parseFloat(form.price), category: form.category, image: form.image };
    if (editItem) setItems(items.map(i => i.id === editItem.id ? newItem : i));
    else setItems([...items, newItem]);
    setIsOpen(false);
  };
  const handleDelete = (id) => setItems(items.filter(i => i.id !== id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Menu Management</h1><p className="text-muted-foreground">Add and edit your restaurant menu items</p></div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Item</Button></DialogTrigger>
          <DialogContent className="bg-card border-border/60">
            <DialogHeader><DialogTitle className="text-foreground">{editItem ? "Edit" : "Add"} Menu Item</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label className="text-foreground">Item Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-foreground">Cost ($)</Label><Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div>
                <div><Label className="text-foreground">Price ($)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div>
              </div>
              <div><Label className="text-foreground">Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div>
              <div><Label className="text-foreground">Emoji Icon</Label><Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="mt-1.5 bg-muted/50 border-border/60" /></div>
              <Button className="w-full" onClick={handleSave}>Save Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="p-6 bg-card border-border/60 hover:border-primary/30 transition-all premium-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{item.image}</div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{item.category}</p>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cost: ${item.cost.toFixed(2)}</span><span className="text-primary font-semibold">${item.price.toFixed(2)}</span></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
