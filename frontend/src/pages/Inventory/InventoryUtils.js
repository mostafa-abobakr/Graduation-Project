export const CATEGORIES = [
  "Meat",
  "Seafood",
  "Vegetables",
  "Dairy",
  "Bakery",
  "Pantry",
  "Drinks",
  "Other",
];

export const UNITS = ["kg", "g", "L", "ml", "piece", "box"];

export const emptyForm = {
  name: "",
  category: "Other",
  quantity: "",
  unit: "kg",
  reorderLevel: "",
  shelfLifeDays: "",
  isNonPerishable: false,
  cost: "",
  supplier: "",
};

export const parseInvoiceText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const units = ["kg", "g", "l", "ml", "pcs", "pc", "piece", "box"];
  const items = [];
  for (const raw of lines) {
    const tokens = raw
      .replace(/\s*[,|;]\s*/g, " ")
      .replace(/\s+/g, " ")
      .split(" ");
    if (tokens.length < 3) continue;
    let qtyIdx = -1,
      qty = 0,
      unit = "piece";
    for (let i = 0; i < tokens.length; i++) {
      const n = parseFloat(tokens[i]);
      if (!isNaN(n) && n > 0) {
        const next = (tokens[i + 1] || "").toLowerCase();
        if (units.includes(next)) {
          qtyIdx = i;
          qty = n;
          unit =
            next === "pcs" || next === "pc"
              ? "piece"
              : next === "l"
                ? "L"
                : next;
          break;
        }
        if (qtyIdx === -1) {
          qtyIdx = i;
          qty = n;
        }
      }
    }
    if (qtyIdx === -1) continue;
    let costIdx = -1,
      cost = 0;
    for (let i = tokens.length - 1; i > qtyIdx; i--) {
      const n = parseFloat(tokens[i].replace(/[$£€,]|EGP|LE|ج\.م\.?|ج م/gi, ""));
      if (!isNaN(n)) {
        costIdx = i;
        cost = n;
        break;
      }
    }
    const hasUnit = units.includes((tokens[qtyIdx + 1] || "").toLowerCase());
    const supplierStart = qtyIdx + (hasUnit ? 2 : 1);
    const supplierTokens =
      costIdx > supplierStart ? tokens.slice(supplierStart, costIdx) : [];
    const name = tokens.slice(0, qtyIdx).join(" ").trim();
    if (!name) continue;
    items.push({
      name,
      category: "Other",
      quantity: qty,
      unit,
      reorderLevel: Math.max(1, Math.round(qty * 0.3)),
      expiryDate: "",
      cost: cost || 0,
      supplier: supplierTokens.join(" ").trim() || "Unknown",
    });
  }
  return items;
};

export const OCR_PROMPT = `You are an advanced OCR and data extraction system specialized in inventory invoices.

Your task is to extract structured data from a supplier invoice image or text.

Instructions:
- Carefully read the invoice content.
- Identify all listed items (products/materials).
- For each item, extract the following fields:
  - item_name (string)
  - quantity (number)
  - unit (string, e.g., kg, pcs, box, liter)
  - unit_price (number)
  - total_price (number, if available)
  - expiry_date (string, if available, format YYYY-MM-DD)
  - production_date (string, if available)
  - batch_number (string, if available)

- Also extract general invoice information:
  - invoice_number
  - supplier_name
  - invoice_date

Rules:
- If a field is missing, return null.
- Do not guess values.
- Normalize numbers (no currency symbols).
- Output ONLY valid JSON (no explanations).

Output format:

{
  "invoice_number": "",
  "supplier_name": "",
  "invoice_date": "",
  "items": [
    {
      "item_name": "",
      "quantity": 0,
      "unit": "",
      "unit_price": 0,
      "total_price": 0,
      "expiry_date": null,
      "production_date": null,
      "batch_number": null
    }
  ]
}`;
