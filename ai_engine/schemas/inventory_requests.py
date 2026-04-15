from pydantic import BaseModel
from typing import List, Optional

class RecipeIngredientRequest(BaseModel):
    menu_item_id: int
    quantity_used: float
    # If mapping an existing inventory item
    inventory_id: Optional[int] = None
    # If creating a new ingredient from scratch
    new_ingredient_name: Optional[str] = None
    new_ingredient_unit: Optional[str] = None

class RestockRequest(BaseModel):
    inventory_id: int
    quantity: float

class ForecastInventoryItem(BaseModel):
    item_name: str
    expected_orders: float

class ForecastInventoryCheckRequest(BaseModel):
    forecast_output: List[ForecastInventoryItem]
