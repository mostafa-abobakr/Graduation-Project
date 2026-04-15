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
    inventory_id: int
    quantity_to_add: float
    confidence_score: float
    original_invoice_name: str

class ScannedInvoiceResult(BaseModel):
    items: typing.List[ScannedItem]


def _get_inventory_list(restaurant_id: str) -> list:
    """Returns list of dicts: [{id, name, unit}, ...]"""
    engine = get_engine()
    with Session(engine) as session:
        inv_list = session.query(Inventory).filter(
            Inventory.RestID == restaurant_id,
            Inventory.Status == 'Active'
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

    matched_items = []
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]

    for line in lines:
        best_inv, confidence = _fuzzy_match(line, inventory)
        if best_inv is None:
            continue

        quantity = _extract_quantity(line)
        if quantity <= 0:
            continue

        # Avoid duplicates (take the higher confidence one)
        existing = next((m for m in matched_items if m["inventory_id"] == best_inv["id"]), None)
        if existing:
            existing["quantity_to_add"] += quantity
        else:
            matched_items.append({
                "inventory_id": best_inv["id"],
                "quantity_to_add": quantity,
                "confidence_score": confidence,
                "original_invoice_name": line[:80]
            })

    return matched_items


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

CRITICAL: If an item DOES NOT match any item in the list, DISCARD IT completely.

{context}

Return ONLY a valid JSON array. No markdown, no explanation.
Format:
[
  {{"inventory_id": 5, "quantity_to_add": 10.5, "confidence_score": 0.95, "original_invoice_name": "Premium Red Onions"}}
]
If no items match, return: []"""


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


def _cloud_ai_scan(image_bytes: bytes, inventory: list) -> list:
    """Tries Gemini models then OpenRouter. Returns parsed items list."""
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


def _parse_ai_json(raw_text: str) -> list:
    """Cleans and parses AI response into list of dicts."""
    raw = raw_text.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return json.loads(raw.strip())


# ===========================================================================
# Main Entry Point
# ===========================================================================
def analyze_invoice_and_restock(restaurant_id: str, image_bytes: bytes, mode: str = "auto") -> dict:
    """
    Scans an invoice image, maps items to inventory, and restocks.
    mode: "local" (Tesseract OCR), "cloud" (Gemini/OpenRouter), "auto" (try local first, fallback to cloud)
    """
    inventory = _get_inventory_list(restaurant_id)
    if not inventory:
        raise ValueError(f"Restaurant {restaurant_id} has no inventory items. Seed inventory first.")

    matched_items = []

    if mode == "local":
        matched_items = _local_ocr_scan(image_bytes, inventory)
    elif mode == "cloud":
        raw_items = _cloud_ai_scan(image_bytes, inventory)
        validated = ScannedInvoiceResult(items=raw_items)
        matched_items = [item.model_dump() for item in validated.items]
    else:  # auto
        try:
            matched_items = _local_ocr_scan(image_bytes, inventory)
        except Exception:
            pass

        if not matched_items:
            try:
                raw_items = _cloud_ai_scan(image_bytes, inventory)
                validated = ScannedInvoiceResult(items=raw_items)
                matched_items = [item.model_dump() for item in validated.items]
            except Exception as e:
                raise RuntimeError(f"Both local OCR and cloud AI failed: {str(e)}")

    if not matched_items:
        return {"status": "no_matches", "restocked_items": [], "failed_matches": [],
                "message": "No invoice items could be mapped to your inventory."}

    # Execute Restocks
    restocked_items = []
    errors = []
    for item in matched_items:
        try:
            restock_inventory(restaurant_id, item["inventory_id"], item["quantity_to_add"])
            restocked_items.append({
                "inventory_id": item["inventory_id"],
                "original_invoice_name": item["original_invoice_name"],
                "quantity_added": item["quantity_to_add"],
                "confidence": item["confidence_score"]
            })
        except Exception as e:
            errors.append({"inventory_id": item["inventory_id"], "error": str(e)})

    return {
        "status": "success" if not errors else "partial_success",
        "restocked_items": restocked_items,
        "failed_matches": errors
    }
