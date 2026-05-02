"""
SQLAlchemy ORM Models — Dashboard Bisnis
Tabel: products, transactions, chat_history
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime
from database import Base


def _gen_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:8]}"


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: _gen_id("p"))
    name = Column(String(200), nullable=False)
    sku = Column(String(50), default="")
    stock = Column(Integer, default=0)
    price = Column(Float, default=0)
    category = Column(String(100), default="Umum")
    created_at = Column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "sku": self.sku,
            "stock": self.stock,
            "price": self.price,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: _gen_id("t"))
    product_id = Column(String, nullable=False)
    product_name = Column(String(200), default="")
    quantity = Column(Integer, default=0)
    total_price = Column(Float, default=0)
    type = Column(String(20), default="sale")   # "sale" atau "purchase"
    note = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "quantity": self.quantity,
            "total_price": self.total_price,
            "type": self.type,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(String, primary_key=True, default=lambda: _gen_id("c"))
    role = Column(String(20), nullable=False)   # "user" atau "assistant"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
