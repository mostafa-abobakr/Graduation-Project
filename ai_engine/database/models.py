"""
database/models.py
SQLAlchemy ORM models that mirror the production SQL Server schema.

Tables:
    Orders      – one row per order placed at a restaurant
    MenuItems   – master catalogue of items for each restaurant
    OrderItems  – junction between Orders and MenuItems (normalised line items)

These models are used for schema documentation and type safety.
The actual database already exists — DO NOT call Base.metadata.create_all().
"""
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Order(Base):
    """
    Fact table.  One row per order transaction.
    """
    __tablename__ = "Orders"

    OrderId             = Column(Integer, primary_key=True)
    RestaurantId        = Column(String(50), nullable=False, index=True)
    OrderTimestamp      = Column(DateTime, nullable=False, index=True)
    TemperatureCelsius  = Column(Float, nullable=True)
    EventDay            = Column(Integer, nullable=True, default=0)   # 0 or 1
    ItemCount           = Column(Integer, nullable=True)
    TotalOrderValue     = Column(Float, nullable=True)

    # Relationship
    line_items = relationship("OrderItem", back_populates="order")


class MenuItem(Base):
    """
    Dimension table.  Master catalogue of menu items per restaurant.
    Schema: (MenuItemId, RestaurantId, ItemName, Price, Cost, ImageUrl,
             Category, Description)
    """
    __tablename__ = "MenuItems"

    MenuItemId    = Column(Integer, primary_key=True)
    RestaurantId  = Column(String(50), nullable=False, index=True)
    ItemName      = Column(String(200), nullable=False)
    Price         = Column(Float, nullable=True)
    Cost          = Column(Float, nullable=True)
    ImageUrl      = Column(String(500), nullable=True)
    Category      = Column(String(100), nullable=True)
    Description   = Column(String(500), nullable=True)

    # Relationship
    line_items = relationship("OrderItem", back_populates="menu_item")


class OrderItem(Base):
    """
    Junction / fact table.  One row per item per order.
    """
    __tablename__ = "OrderItems"

    OrderItemId   = Column(Integer, primary_key=True)
    OrderId       = Column(Integer, ForeignKey("Orders.OrderId"), nullable=False, index=True)
    MenuItemId    = Column(Integer, ForeignKey("MenuItems.MenuItemId"), nullable=False, index=True)
    Quantity      = Column(Integer, nullable=False, default=1)
    UnitPrice     = Column(Float, nullable=True)
    LineTotal     = Column(Float, nullable=True)

    # Relationships
    order     = relationship("Order", back_populates="line_items")
    menu_item = relationship("MenuItem", back_populates="line_items")


class Inventory(Base):
    """
    Tracks inventory items / raw ingredients.
    Schema: (InventoryID, RestID, ItemName, Unit, ReorderLevel, LastUpdated,
             Description, ImageUrl, Category, CostPerUnit, Stock, Supplier,
             ReorderQuantity, ExpiryDate, ProductionDate, ShelfLife)
    """
    __tablename__ = "Inventories"

    InventoryID     = Column(Integer, primary_key=True)
    RestID          = Column(String(50), nullable=False, index=True)
    ItemName        = Column(String(200), nullable=False)
    Unit            = Column(String(50), nullable=True)
    ReorderLevel    = Column(Float, nullable=True)
    LastUpdated     = Column(DateTime, nullable=True)
    Description     = Column(String(500), nullable=True)
    ImageUrl        = Column(String(500), nullable=True)
    Category        = Column(String(100), nullable=True)
    CostPerUnit     = Column(Float, nullable=True)
    Stock           = Column(Float, nullable=True)
    Supplier        = Column(String(200), nullable=True)
    ReorderQuantity = Column(Float, nullable=True)
    ExpiryDate      = Column(DateTime, nullable=True)
    ProductionDate  = Column(DateTime, nullable=True)
    ShelfLife       = Column(Integer, nullable=True)


class InventoryBatch(Base):
    """
    Batch-level inventory quantities consumed before aggregate stock is synced.
    Schema: (BatchID, InventoryID, Quantity, ExpiryDate, ReceivedDate,
             ProductionDate, UnitCost)
    """
    __tablename__ = "InventoryBatches"

    BatchID        = Column(Integer, primary_key=True, autoincrement=True)
    InventoryID    = Column(Integer, ForeignKey("Inventories.InventoryID"), nullable=False, index=True)
    Quantity       = Column(Float, nullable=False)
    ExpiryDate     = Column(DateTime, nullable=True)
    ReceivedDate   = Column(DateTime, nullable=True)
    ProductionDate = Column(DateTime, nullable=True)
    UnitCost       = Column(Float, nullable=True)


class MenuItemIngredient(Base):
    """
    Junction mapping MenuItems to Inventories for BOM (Bill of Materials).
    Schema: (MenuItemId, InventoryID, QuantityUsedPerItem)
    """
    __tablename__ = "MenuItemIngredients"

    MenuItemId          = Column(Integer, ForeignKey("MenuItems.MenuItemId"), primary_key=True)
    InventoryID         = Column(Integer, ForeignKey("Inventories.InventoryID"), primary_key=True)
    QuantityUsedPerItem = Column(Float, nullable=False)


class InventoryTransaction(Base):
    """
    Audit log of inventory changes.
    Schema: (TransactionId, RestId, InventoryId, BatchId, Type, Quantity,
             Price, TransactionDate, Notes)
    """
    __tablename__ = "InventoryTransactions"

    TransactionId   = Column(Integer, primary_key=True, autoincrement=True)
    RestId          = Column(String(50), nullable=False, index=True)
    InventoryId     = Column(Integer, ForeignKey("Inventories.InventoryID"), nullable=False, index=True)
    BatchId         = Column(Integer, ForeignKey("InventoryBatches.BatchID"), nullable=True, index=True)
    Type            = Column(Integer, nullable=False)
    Quantity        = Column(Float, nullable=False)
    Price           = Column(Float, nullable=True)
    TransactionDate = Column(DateTime, nullable=True)
    Notes           = Column(String(500), nullable=True)


class Forecast(Base):
    """
    Stores generated machine learning forecasts.
    """
    __tablename__ = "Forecasts"

    ForecastId      = Column(Integer, primary_key=True, autoincrement=True)
    RestaurantId    = Column(String(50), nullable=False, index=True)
    ItemName        = Column(String(200), nullable=False, index=True)
    RecordDate      = Column(DateTime, nullable=False, index=True)
    ExpectedOrders  = Column(Float, nullable=False)
