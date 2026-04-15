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
    """
    __tablename__ = "MenuItems"

    MenuItemId    = Column(Integer, primary_key=True)
    RestaurantId  = Column(String(50), nullable=False, index=True)
    ItemName      = Column(String(200), nullable=False)
    Price         = Column(Float, nullable=True)

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
    """
    __tablename__ = "Inventories"

    InventoryID     = Column(Integer, primary_key=True)
    RestID          = Column(String(50), nullable=False, index=True)
    ItemName        = Column(String(200), nullable=False)
    Unit            = Column(String(50), nullable=True)
    ReorderLevel    = Column(Float, nullable=True)
    ReorderQuantity = Column(Float, nullable=True)
    Stock           = Column(Float, nullable=True)
    CostPerUnit     = Column(Float, nullable=True)
    Category        = Column(String(100), nullable=True)
    Status          = Column(String(50), nullable=True)


class MenuItemIngredient(Base):
    """
    Junction mapping MenuItems to Inventories for BOM (Bill of Materials).
    """
    __tablename__ = "MenuItemIngredients"

    MenuItemId          = Column(Integer, ForeignKey("MenuItems.MenuItemId"), primary_key=True)
    InventoryID         = Column(Integer, ForeignKey("Inventories.InventoryID"), primary_key=True)
    QuantityUsedPerItem = Column(Float, nullable=False)


class InventoryTransaction(Base):
    """
    Audit log of inventory changes.
    """
    __tablename__ = "InventoryTransactions"

    TransactionID   = Column(Integer, primary_key=True, autoincrement=True)
    InventoryID     = Column(Integer, ForeignKey("Inventories.InventoryID"), nullable=False, index=True)
    RestID          = Column(String(50), nullable=False, index=True)
    ChangeType      = Column(String(50), nullable=False)
    QuantityChange  = Column(Float, nullable=False)
    ReferenceID     = Column(Integer, nullable=True)
    ReferenceType   = Column(String(50), nullable=True)
    CreatedAt       = Column(DateTime, nullable=True)

