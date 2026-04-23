import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import { parseInvoiceText } from "./InventoryUtils";
import { toast } from "sonner";

export function SmartInvoiceDialog({ open, setOpen, onImport }) {
  const [invoiceText, setInvoiceText] = useState("");
  const [aiPreview, setAiPreview] = useState([]);

  const runAiParse = () => {
    const parsed = parseInvoiceText(invoiceText);
    if (!parsed.length) {
      toast.error("Couldn't detect items. Try: 'Tomato 10 kg 2.50 GreenFarm'");
      return;
    }
    setAiPreview(parsed);
    toast.success(`Detected ${parsed.length} item(s)`);
  };

  const handleImport = () => {
    onImport(aiPreview);
    setOpen(false);
    setInvoiceText("");
    setAiPreview([]);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setInvoiceText("");
        setAiPreview([]);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Smart invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart invoice import
          </DialogTitle>
          <DialogDescription>
            Paste invoice text. Format:{" "}
            <span className="font-mono">Item qty unit cost supplier</span>
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={invoiceText}
          onChange={(e) => setInvoiceText(e.target.value)}
          rows={6}
          placeholder={"Tomato 10 kg 2.50 GreenFarm\nOlive Oil 5 L 15.00 Mediterranean"}
          className="font-mono text-xs"
        />
        <div className="flex justify-end">
          <Button onClick={runAiParse} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Detect
          </Button>
        </div>
        {aiPreview.length > 0 && (
          <div className="border border-border/60 rounded-md max-h-60 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Cost</th>
                  <th className="text-left p-2">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {aiPreview.map((p, i) => (
                  <tr key={i} className="border-t border-border/40">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2 text-right font-mono">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="p-2 text-right font-mono">
                      ${p.cost.toFixed(2)}
                    </td>
                    <td className="p-2 text-muted-foreground">{p.supplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!aiPreview.length}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
