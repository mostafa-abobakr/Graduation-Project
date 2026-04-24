from pydantic import BaseModel
from typing import List, Optional


class InvoiceConfirmItem(BaseModel):
    inventory_id: int
    quantity_to_add: float


class InvoiceConfirmRequest(BaseModel):
    items: List[InvoiceConfirmItem]
