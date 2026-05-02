import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CalendarIcon, Save, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function MatchedItemsTable({ mappedItems, setMappedItems }) {
  const avgConfidence =
    mappedItems.length > 0
      ? (mappedItems.reduce((acc, curr) => acc + (curr.confidence_score || 0), 0) /
          mappedItems.length) *
        100
      : 0;

  const toggleEditMapped = (idx) => {
    setMappedItems((prev) => {
      const newArr = [...prev];
      newArr[idx].isEditing = !newArr[idx].isEditing;
      return newArr;
    });
  };

  const removeMapped = (idx) => {
    setMappedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Matched Items ({mappedItems.length})
        </span>
        {mappedItems.length > 0 && (
          <Badge className="bg-primary/20 text-primary">
            Avg Confidence: {avgConfidence.toFixed(0)}%
          </Badge>
        )}
      </h3>
      {mappedItems.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No items automatically matched.
        </p>
      ) : (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-2 px-3 text-left font-medium text-muted-foreground">Original Text</th>
                <th className="py-2 px-3 text-center font-medium text-muted-foreground">Matched Item</th>
                <th className="py-2 px-3 text-center font-medium text-muted-foreground w-16">Qty</th>
                <th className="py-2 px-3 text-center font-medium text-muted-foreground w-20">Price</th>
                <th className="py-2 px-3 text-center font-medium text-muted-foreground w-36">Prod. Date</th>
                <th className="py-2 px-3 text-center font-medium text-muted-foreground w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {mappedItems.map((item, idx) => (
                <tr key={idx} className="border-t border-border/30 hover:bg-muted/10 transition-colors">
                  <td className="py-2 px-3 text-muted-foreground truncate max-w-[100px]" title={item.original_invoice_name}>
                    {item.original_invoice_name}
                  </td>
                  <td className="py-2 px-3 font-medium text-center">{item.item_name}</td>
                  <td className="py-2 px-2">
                    {item.isEditing ? (
                      <Input
                        type="number"
                        value={item.quantity_to_add}
                        onChange={(e) => {
                          const newArr = [...mappedItems];
                          newArr[idx].quantity_to_add = e.target.value;
                          setMappedItems(newArr);
                        }}
                        className="h-8 px-2"
                      />
                    ) : (
                      <div className="text-center w-full">{item.quantity_to_add}</div>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {item.isEditing ? (
                      <Input
                        type="number"
                        value={item.total_price}
                        onChange={(e) => {
                          const newArr = [...mappedItems];
                          newArr[idx].total_price = e.target.value;
                          setMappedItems(newArr);
                        }}
                        className="h-8 px-2"
                      />
                    ) : (
                      <div className="text-center w-full">${parseFloat(item.total_price).toFixed(2)}</div>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {item.isEditing ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-8 w-full justify-start text-left font-normal px-2 bg-background",
                              !item.productionDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            {item.productionDate ? format(new Date(item.productionDate), "PPP") : <span className="truncate">Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={item.productionDate ? new Date(item.productionDate) : undefined}
                            onSelect={(date) => {
                              const newArr = [...mappedItems];
                              newArr[idx].productionDate = date ? format(date, "yyyy-MM-dd") : "";
                              setMappedItems(newArr);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="text-center w-full text-muted-foreground">{item.productionDate || "None"}</div>
                    )}
                  </td>
                  <td className="py-2 px-2 flex justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-500/10" onClick={() => toggleEditMapped(idx)}>
                      {item.isEditing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeMapped(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
