"""
inventory/invoice_scanner.py
Invoice scanner with dual modes:
  1. LOCAL MODE (default): Tesseract OCR + fuzzy string matching. No API keys needed.
  2. AI MODE (fallback):   Gemini / OpenRouter cloud vision. Requires API keys.
"""
import os
import re
import json
import base64
import typing
import urllib.request
import urllib.error
from difflib import SequenceMatcher
from pydantic import BaseModel, ValidationError
from PIL import Image
import io

from database.connection import get_engine
from sqlalchemy.orm import Session
from database.models import Inventory
from inventory.service import restock_inventory


class ScannedItem(BaseModel):
    inventory_id: typing.Optional[int] = None
    quantity_to_add: float
    confidence_score: float
    original_invoice_name: str
    unit_price: typing.Optional[float] = None
    total_price: typing.Optional[float] = None

class ScannedInvoiceResult(BaseModel):
    items: typing.List[ScannedItem]


def _get_inventory_list(restaurant_id: str) -> list:
    """Returns list of dicts: [{id, name, unit}, ...]"""
    engine = get_engine()
    with Session(engine) as session:
        inv_list = session.query(Inventory).filter(
            Inventory.RestID == restaurant_id
        ).all()
        return [{"id": inv.InventoryID, "name": inv.ItemName, "unit": inv.Unit} for inv in inv_list]


def _fuzzy_match(text: str, inventory: list, threshold: float = 0.45) -> tuple:
    """
    Finds the best fuzzy match for a text string against inventory item names.
    Returns (inventory_item_dict, confidence_score) or (None, 0.0).
    """
    best_match = None
    best_score = 0.0
    text_lower = text.lower().strip()

    for inv in inventory:
        inv_name_lower = inv["name"].lower()
        # Try multiple matching strategies
        score = SequenceMatcher(None, text_lower, inv_name_lower).ratio()

        # Boost score if inventory name is contained within the OCR text
        if inv_name_lower in text_lower:
            score = max(score, 0.85)
        # Boost if any word in inv name appears in OCR text
        inv_words = inv_name_lower.split()
        matching_words = sum(1 for w in inv_words if w in text_lower)
        if inv_words and matching_words / len(inv_words) >= 0.5:
            score = max(score, 0.6 + 0.2 * (matching_words / len(inv_words)))

        if score > best_score:
            best_score = score
            best_match = inv

    if best_score >= threshold:
        return best_match, round(best_score, 2)
    return None, 0.0


def _extract_quantity(line: str) -> float:
    """
    Extracts a numeric quantity from an invoice line.
    Looks for patterns like '10 kg', '5.5', '200 units', etc.
    """
    # Ignore lines that are clearly headers or metadata (like dates or invoice numbers)
    if re.search(r'\b(?:date|time|invoice|tax id|zip code|phone|tel)\b', line, re.IGNORECASE):
        return 0.0

    # Try common invoice patterns: "10 x", "qty: 10", "10 kg", standalone numbers
    patterns = [
        r'(\d+\.?\d*)\s*(?:kg|kgs|kilogram)',
        r'(\d+\.?\d*)\s*(?:liter|liters|lt|ltr)',
        r'(\d+\.?\d*)\s*(?:unit|units|pcs|pieces|pc)',
        r'(?:qty|quantity|x)\s*[:\-]?\s*(\d+\.?\d*)',
        r'(\d+\.?\d*)\s*(?:x|×)',
        r'^\s*(\d+\.?\d*)\s',          # Leading number
        r'\s(\d+\.?\d*)\s*$',           # Trailing number
    ]
    for pattern in patterns:
        match = re.search(pattern, line, re.IGNORECASE)
        if match:
            val = float(match.group(1))
            if 0 < val < 100000:  # Sanity check
                return val
    return 0.0


def _extract_prices(line: str) -> tuple:
    """
    Extracts unit price and total price from an invoice line.
    Finds monetary values like '12.00', '$12.00', expects rightmost values.
    """
    matches = re.findall(r'(?:[\$\£\€]?\s*)(\d+\.\d{2})', line)
    if len(matches) >= 2:
        return float(matches[-2]), float(matches[-1])
    elif len(matches) == 1:
        return None, float(matches[0])
    return None, None


def _extract_date(text: str) -> typing.Optional[str]:
    """
    Extracts the invoice date from raw OCR text.
    Tries common date formats and returns ISO format (YYYY-MM-DD) or None.
    """
    from datetime import datetime

    # Patterns ordered from most specific to least specific
    date_patterns = [
        # 2025-04-24, 2025/04/24
        (r'(\d{4})[\-/](\d{1,2})[\-/](\d{1,2})', '%Y-%m-%d'),
        # 05/16/2024, 16/05/2024
        (r'(\d{1,2})[\-/](\d{1,2})[\-/](\d{4})', 'ambiguous'),
        # 24 Apr 2025, 24 April 2025
        (r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})', None),
        # Apr 24, 2025
        (r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})', None),
    ]

    month_map = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }

    for pattern, fmt in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                groups = match.groups()
                if fmt == '%Y-%m-%d':
                    dt = datetime(int(groups[0]), int(groups[1]), int(groups[2]))
                elif fmt == 'ambiguous':
                    g1, g2, g3 = int(groups[0]), int(groups[1]), int(groups[2])
                    if g1 > 12 and g2 <= 12:
                        dt = datetime(g3, g2, g1)  # DD-MM-YYYY
                    elif g2 > 12 and g1 <= 12:
                        dt = datetime(g3, g1, g2)  # MM-DD-YYYY
                    elif g1 <= 12 and g2 <= 12:
                        # Default to MM-DD-YYYY if ambiguous
                        dt = datetime(g3, g1, g2)
                    else:
                        continue
                elif len(groups) == 3 and groups[1].lower()[:3] in month_map:
                    # "24 Apr 2025" pattern
                    day = int(groups[0])
                    month = month_map[groups[1].lower()[:3]]
                    year = int(groups[2])
                    dt = datetime(year, month, day)
                elif len(groups) == 3 and groups[0].lower()[:3] in month_map:
                    # "Apr 24, 2025" pattern
                    month = month_map[groups[0].lower()[:3]]
                    day = int(groups[1])
                    year = int(groups[2])
                    dt = datetime(year, month, day)
                else:
                    continue
                return dt.strftime('%Y-%m-%d')
            except (ValueError, IndexError):
                continue

    return None


# ===========================================================================
# Mode 1: LOCAL OCR (Tesseract)
# ===========================================================================
def _local_ocr_scan(image_bytes: bytes, inventory: list) -> list:
    """
    Uses Tesseract OCR to extract text, then fuzzy-matches against inventory.
    """
    try:
        import pytesseract
    except ImportError:
        raise RuntimeError(
            "Tesseract OCR is not installed. Install it with: pip install pytesseract\n"
            "And install Tesseract itself: https://github.com/tesseract-ocr/tesseract"
        )

    # Auto-detect Tesseract path on Windows
    import platform
    if platform.system() == "Windows":
        win_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
        ]
        for p in win_paths:
            if os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                break

    image = Image.open(io.BytesIO(image_bytes))
    raw_text = pytesseract.image_to_string(image)

    # Extract invoice date from full OCR text
    invoice_date = _extract_date(raw_text)

    matched_items = []
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]

    for line in lines:
        quantity = _extract_quantity(line)
        if quantity <= 0:
            continue

        unit_price, total_price = _extract_prices(line)
        best_inv, confidence = _fuzzy_match(line, inventory)

        if best_inv is None:
            # Unmapped new item
            matched_items.append({
                "inventory_id": None,
                "quantity_to_add": quantity,
                "unit_price": unit_price,
                "total_price": total_price,
                "confidence_score": 0.0,
                "original_invoice_name": line[:80].strip()
            })
        else:
            # Avoid duplicates (take the higher confidence one)
            existing = next((m for m in matched_items if m["inventory_id"] == best_inv["id"]), None)
            if existing:
                existing["quantity_to_add"] += quantity
                if existing.get("total_price") and total_price:
                    existing["total_price"] += total_price
                elif total_price:
                    existing["total_price"] = total_price
            else:
                matched_items.append({
                    "inventory_id": best_inv["id"],
                    "quantity_to_add": quantity,
                    "unit_price": unit_price,
                    "total_price": total_price,
                    "confidence_score": confidence,
                    "original_invoice_name": line[:80].strip()
                })

    return matched_items, invoice_date


# ===========================================================================
# Mode 2: CLOUD AI (Gemini / OpenRouter)
# ===========================================================================
def _build_ai_prompt(inventory: list) -> str:
    context = "Restaurant Inventory Database List:\n"
    for inv in inventory:
        context += f"- [ID: {inv['id']}] {inv['name']} (Unit: {inv['unit']})\n"

    return f"""You are an expert supply chain data extraction AI.
Read the provided invoice image carefully.
Extract the items and their quantities. Map each line item to the SINGLE BEST MATCH in the Inventory Database List.
Use logical fuzzy matching (e.g. "Onions Red 10kg" maps to "Onion").
Also extract the invoice date if visible on the document.
Extract the unit_price and total_price for each item if visible.

CRITICAL: If an item DOES NOT match any item in the list, STILL EXTRACT IT but set "inventory_id" to null.

{context}

Return ONLY a valid JSON object. No markdown, no explanation.
Format:
{{{{
  "invoice_date": "2025-04-24",
  "items": [
    {{"inventory_id": 5, "quantity_to_add": 10.5, "unit_price": 12.00, "total_price": 126.00, "confidence_score": 0.95, "original_invoice_name": "Premium Red Onions"}},
    {{"inventory_id": null, "quantity_to_add": 2.0, "unit_price": null, "total_price": 5.00, "confidence_score": 0.0, "original_invoice_name": "Unknown Item X"}}
  ]
}}}}
If no date is found, set invoice_date to null.
If unit_price or total_price is missing, set to null.
If no items are found, set items to []."""


def _call_gemini(api_key, model, b64_image, mime_type, prompt):
    payload = {
        "contents": [{"parts": [
            {"text": prompt},
            {"inline_data": {"mime_type": mime_type, "data": b64_image}}
        ]}],
        "generationConfig": {"temperature": 0.0}
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
    return result["candidates"][0]["content"]["parts"][0]["text"]


def _call_openrouter(api_key, b64_image, mime_type, prompt):
    payload = {
        "model": "google/gemini-2.0-flash-exp:free",
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_image}"}}
        ]}],
        "temperature": 0.0
    }
    url = "https://openrouter.ai/api/v1/chat/completions"
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                headers={"Content-Type": "application/json",
                                         "Authorization": f"Bearer {api_key}"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
    return result["choices"][0]["message"]["content"]


def _cloud_ai_scan(image_bytes: bytes, inventory: list) -> tuple:
    """Tries Gemini models then OpenRouter. Returns (parsed items list, invoice_date)."""
    img = Image.open(io.BytesIO(image_bytes))
    fmt = img.format or "PNG"
    mime_map = {"JPEG": "image/jpeg", "JPG": "image/jpeg", "PNG": "image/png",
                "WEBP": "image/webp", "GIF": "image/gif"}
    mime_type = mime_map.get(fmt.upper(), "image/png")
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    prompt = _build_ai_prompt(inventory)
    errors = []

    # Try Gemini models
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        for model in ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash-lite"]:
            try:
                raw = _call_gemini(gemini_key, model, b64_image, mime_type, prompt)
                return _parse_ai_json(raw)
            except urllib.error.HTTPError as e:
                errors.append(f"Gemini({model}): {e.code}")
                if e.code != 429:
                    break
            except Exception as e:
                errors.append(f"Gemini({model}): {str(e)}")

    # Try OpenRouter
    or_key = os.getenv("OPENROUTER_API_KEY")
    if or_key:
        try:
            raw = _call_openrouter(or_key, b64_image, mime_type, prompt)
            return _parse_ai_json(raw)
        except Exception as e:
            errors.append(f"OpenRouter: {str(e)}")

    raise RuntimeError(f"All cloud AI providers failed: {'; '.join(errors)}. Wait 1 min and retry.")


def _parse_ai_json(raw_text: str) -> tuple:
    """Cleans and parses AI response into (items list, invoice_date)."""
    raw = raw_text.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    parsed = json.loads(raw.strip())

    # Handle both object format {items, invoice_date} and legacy array format
    if isinstance(parsed, dict):
        items = parsed.get("items", [])
        invoice_date = parsed.get("invoice_date", None)
    else:
        items = parsed
        invoice_date = None

    return items, invoice_date


# ===========================================================================
# Main Entry Points
# ===========================================================================
def scan_invoice(restaurant_id: str, image_bytes: bytes, mode: str = "auto") -> dict:
    """
    Scans an invoice image and maps items to inventory.
    Returns matched items for user review — does NOT modify the database.
    mode: "local" (Tesseract OCR), "cloud" (Gemini/OpenRouter), "auto" (try local first, fallback to cloud)
    """
    inventory = _get_inventory_list(restaurant_id)
    if not inventory:
        raise ValueError(f"Restaurant {restaurant_id} has no inventory items. Seed inventory first.")

    # Build a quick lookup for enrichment
    inv_lookup = {inv["id"]: inv for inv in inventory}

    matched_items = []
    invoice_date = None

    if mode == "local":
        matched_items, invoice_date = _local_ocr_scan(image_bytes, inventory)
    elif mode == "cloud":
        raw_items, invoice_date = _cloud_ai_scan(image_bytes, inventory)
        validated = ScannedInvoiceResult(items=raw_items)
        matched_items = [item.model_dump() for item in validated.items]
    else:  # auto
        try:
            matched_items, invoice_date = _local_ocr_scan(image_bytes, inventory)
        except Exception:
            pass

        if not matched_items:
            try:
                raw_items, invoice_date = _cloud_ai_scan(image_bytes, inventory)
                validated = ScannedInvoiceResult(items=raw_items)
                matched_items = [item.model_dump() for item in validated.items]
            except Exception as e:
                raise RuntimeError(f"Both local OCR and cloud AI failed: {str(e)}")

    if not matched_items:
        return {"status": "no_matches", "invoice_date": invoice_date, "mapped_items": [], "new_items": [],
                "message": "No invoice items could be mapped to your inventory."}

    mapped_items = []
    new_items = []

    for item in matched_items:
        inv_id = item.get("inventory_id")
        if inv_id is not None:
            inv_info = inv_lookup.get(inv_id, {})
            current_stock = _get_current_stock(inv_id)

            mapped_items.append({
                "inventory_id": inv_id,
                "item_name": inv_info.get("name", "Unknown"),
                "unit": inv_info.get("unit", ""),
                "current_stock": current_stock,
                "quantity_to_add": item.get("quantity_to_add", 0),
                "unit_price": item.get("unit_price"),
                "total_price": item.get("total_price"),
                "confidence_score": item.get("confidence_score", 0),
                "original_invoice_name": item.get("original_invoice_name", ""),
            })
        else:
            new_items.append({
                "inventory_id": None,
                "quantity_to_add": item.get("quantity_to_add", 0),
                "unit_price": item.get("unit_price"),
                "total_price": item.get("total_price"),
                "original_invoice_name": item.get("original_invoice_name", ""),
            })

    return {
        "status": "pending_confirmation",
        "invoice_date": invoice_date,
        "mapped_items": mapped_items,
        "new_items": new_items,
    }


def _get_current_stock(inventory_id: int) -> float:
    """Fetches the current stock for a single inventory item."""
    engine = get_engine()
    with Session(engine) as session:
        inv = session.query(Inventory).filter(Inventory.InventoryID == inventory_id).first()
        return float(inv.Stock or 0) if inv else 0.0


def confirm_invoice_restock(restaurant_id: str, items: list) -> dict:
    """
    Applies restocking for a list of confirmed (and possibly user-edited) items.
    Each item dict must have: inventory_id, quantity_to_add.
    """
    if not items:
        raise ValueError("No items provided to confirm.")

    restocked = []
    errors = []

    for item in items:
        inv_id = item.get("inventory_id")
        qty = item.get("quantity_to_add", 0)
        if not inv_id or qty <= 0:
            errors.append({"inventory_id": inv_id, "error": "Invalid inventory_id or quantity"})
            continue

        try:
            result = restock_inventory(restaurant_id, inv_id, qty)
            restocked.append({
                "inventory_id": inv_id,
                "quantity_added": qty,
                "new_stock": result["new_stock"],
            })
        except Exception as e:
            errors.append({"inventory_id": inv_id, "error": str(e)})

    return {
        "status": "success" if not errors else "partial_success",
        "restocked_items": restocked,
        "failed_items": errors,
    }

