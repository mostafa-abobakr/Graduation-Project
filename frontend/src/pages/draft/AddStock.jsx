import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, CheckCircle2, Scan, Save } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AddStock() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("manual");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState(null);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    toast.success("Item added successfully");
    navigate('/dashboard/inventory/list');
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    // Simulate OCR processing time
    setTimeout(() => {
      setIsScanning(false);
      setScannedItems([
        { name: "Chicken Breast", quantity: 20, unit: "kg", price: 120.00 },
        { name: "Basmati Rice", quantity: 50, unit: "kg", price: 65.00 },
        { name: "Olive Oil", quantity: 10, unit: "liter", price: 85.00 },
      ]);
      toast.success("Invoice scanned successfully");
    }, 2000);
  };

  const handleSaveScanned = () => {
    toast.success("3 items added from invoice");
    navigate('/dashboard/inventory/list');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-xl">Add New Stock</CardTitle>
          <CardDescription>Enter inventory details manually or use AI to extract from an invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="smart" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Smart Invoice Input <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">AI</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={handleManualSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Name</label>
                    <Input placeholder="e.g., Fresh Atlantic Salmon" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <option>Meat & Seafood</option>
                      <option>Vegetables</option>
                      <option>Dairy</option>
                      <option>Pantry</option>
                      <option>Drinks</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" placeholder="0" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <option>kg</option>
                      <option>liter</option>
                      <option>piece</option>
                      <option>box</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expiry Date</label>
                    <Input type="date" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Supplier (Optional)</label>
                    <Input placeholder="e.g., Ocean Foods Inc." />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" type="button">Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Item</Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="smart" className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
              {!scannedItems ? (
                <div 
                  className="border-2 border-dashed border-border/60 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={handleSimulateScan}
                >
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <UploadCloud className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Upload Invoice</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
                    Drag and drop your PDF or image invoice here, or click to browse. We'll automatically extract the items.
                  </p>
                  <Button 
                    variant="secondary" 
                    className="gap-2" 
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                        Scanning Document...
                      </>
                    ) : (
                      <>Select File</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium text-sm">Successfully extracted 3 items from "invoice_INV-2026.pdf"</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-8 hover:bg-primary/20" onClick={() => setScannedItems(null)}>
                      Scan Another
                    </Button>
                  </div>

                  <div className="border border-border/50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="py-2 px-3 text-left font-medium text-muted-foreground">Extracted Item</th>
                          <th className="py-2 px-3 text-right font-medium text-muted-foreground">Qty</th>
                          <th className="py-2 px-3 text-left font-medium text-muted-foreground">Unit</th>
                          <th className="py-2 px-3 text-right font-medium text-muted-foreground">Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scannedItems.map((item, idx) => (
                          <tr key={idx} className="border-t border-border/30">
                            <td className="py-2 px-3"><Input defaultValue={item.name} className="h-8" /></td>
                            <td className="py-2 px-3"><Input type="number" defaultValue={item.quantity} className="h-8 text-right" /></td>
                            <td className="py-2 px-3"><Input defaultValue={item.unit} className="h-8" /></td>
                            <td className="py-2 px-3"><Input defaultValue={`$${item.price.toFixed(2)}`} className="h-8 text-right" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setScannedItems(null)}>Discard</Button>
                    <Button onClick={handleSaveScanned} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save All to Inventory
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
