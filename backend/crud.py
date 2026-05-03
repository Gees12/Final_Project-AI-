"""
CRUD Operations — Dashboard Bisnis
Semua operasi database menggunakan SQLAlchemy session.
"""

import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Product, Transaction, ChatHistory


# ════════════════════════════════════════════════════════════
# Products
# ════════════════════════════════════════════════════════════

def get_products(db: Session) -> list[dict]:
    rows = db.query(Product).order_by(Product.created_at.asc()).all()
    return [r.to_dict() for r in rows]


def get_product(db: Session, product_id: str) -> Product | None:
    return db.query(Product).filter(Product.id == product_id).first()


def create_product(
    db: Session,
    name: str,
    sku: str = "",
    stock: int = 0,
    price: float = 0,
    category: str = "Umum",
) -> dict:
    p = Product(
        id=f"p{uuid.uuid4().hex[:8]}",
        name=name,
        sku=sku,
        stock=stock,
        price=price,
        category=category,
        created_at=datetime.now(),
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p.to_dict()


def update_product(db: Session, product_id: str, **kwargs) -> dict | None:
    p = get_product(db, product_id)
    if not p:
        return None
    allowed = {"name", "sku", "stock", "price", "category"}
    for key, val in kwargs.items():
        if key in allowed and val is not None:
            setattr(p, key, val)
    db.commit()
    db.refresh(p)
    return p.to_dict()


def delete_product(db: Session, product_id: str) -> None:
    p = get_product(db, product_id)
    if p:
        db.delete(p)
        db.commit()


# ════════════════════════════════════════════════════════════
# Transactions
# ════════════════════════════════════════════════════════════

def get_transactions(db: Session) -> list[dict]:
    rows = db.query(Transaction).order_by(Transaction.created_at.asc()).all()
    return [r.to_dict() for r in rows]


def create_transaction(
    db: Session,
    product_id: str,
    quantity: int,
    type_: str = "sale",
    note: str = "",
) -> dict | None:
    p = get_product(db, product_id)
    if not p:
        return None

    total = p.price * quantity

    # Update stok produk
    if type_ == "sale":
        p.stock = max(0, p.stock - quantity)
    elif type_ == "purchase":
        p.stock += quantity

    tx = Transaction(
        id=f"t{uuid.uuid4().hex[:8]}",
        product_id=product_id,
        product_name=p.name,
        quantity=quantity,
        total_price=total,
        type=type_,
        note=note,
        created_at=datetime.now(),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx.to_dict()


def delete_transaction(db: Session, tx_id: str) -> None:
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if tx:
        db.delete(tx)
        db.commit()


# ════════════════════════════════════════════════════════════
# Dashboard Summary
# ════════════════════════════════════════════════════════════

def _get_period_range(period: str) -> tuple[datetime, datetime]:
    now = datetime.now()

    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
    elif period == "year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(year=start.year + 1)
    else:
        # Default minggu berjalan: Senin 00:00 sampai Senin berikutnya.
        start = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = start + timedelta(days=7)

    return start, end


def _build_chart_data(transactions: list[Transaction], period: str, start: datetime) -> list[dict]:
    sales_transactions = [t for t in transactions if t.type == "sale" and t.created_at]

    if period == "day":
        buckets = [0.0] * 24
        for t in sales_transactions:
            buckets[t.created_at.hour] += t.total_price
        return [{"date": f"{hour:02d}:00", "total": total} for hour, total in enumerate(buckets)]

    if period == "month":
        if start.month == 12:
            next_month = start.replace(year=start.year + 1, month=1)
        else:
            next_month = start.replace(month=start.month + 1)
        num_days = (next_month - start).days
        buckets = [0.0] * num_days
        for t in sales_transactions:
            buckets[t.created_at.day - 1] += t.total_price
        return [
            {"date": f"{start.year}-{start.month:02d}-{day:02d}", "total": total}
            for day, total in enumerate(buckets, start=1)
        ]

    if period == "year":
        buckets = [0.0] * 12
        for t in sales_transactions:
            buckets[t.created_at.month - 1] += t.total_price
        return [
            {"date": datetime(start.year, month, 1).strftime("%b"), "total": total}
            for month, total in enumerate(buckets, start=1)
        ]

    # week (default)
    buckets = [0.0] * 7
    for t in sales_transactions:
        buckets[t.created_at.weekday()] += t.total_price
    return [
        {"date": (start + timedelta(days=offset)).strftime("%Y-%m-%d"), "total": total}
        for offset, total in enumerate(buckets)
    ]


def get_summary(db: Session, period: str = "week") -> dict:
    products = db.query(Product).all()
    start, end = _get_period_range(period)
    transactions = (
        db.query(Transaction)
        .filter(Transaction.created_at >= start, Transaction.created_at < end)
        .all()
    )

    total_sales = sum(t.total_price for t in transactions if t.type == "sale")
    total_purchases = sum(t.total_price for t in transactions if t.type == "purchase")
    low_stock = [p.to_dict() for p in products if p.stock <= 5]

    chart_data = _build_chart_data(transactions, period, start)

    return {
        "total_sales": total_sales,
        "total_purchases": total_purchases,
        "net_income": total_sales - total_purchases,
        "total_products": len(products),
        "total_transactions": len(transactions),
        "low_stock_count": len(low_stock),
        "low_stock_items": low_stock,
        "chart_data": chart_data,
    }


# ════════════════════════════════════════════════════════════
# Chat History
# ════════════════════════════════════════════════════════════

def add_chat(db: Session, role: str, content: str) -> dict:
    msg = ChatHistory(
        id=f"c{uuid.uuid4().hex[:8]}",
        role=role,
        content=content,
        timestamp=datetime.now(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg.to_dict()


def get_chat_history(db: Session) -> list[dict]:
    rows = db.query(ChatHistory).order_by(ChatHistory.timestamp.asc()).all()
    return [r.to_dict() for r in rows]


def clear_chat(db: Session) -> None:
    db.query(ChatHistory).delete()
    db.commit()


def clear_all_data(db: Session) -> dict:
    """Hapus semua data utama aplikasi (produk, transaksi, chat)."""
    deleted_transactions = db.query(Transaction).delete()
    deleted_products = db.query(Product).delete()
    deleted_chat = db.query(ChatHistory).delete()
    db.commit()
    return {
        "deleted_products": deleted_products,
        "deleted_transactions": deleted_transactions,
        "deleted_chat_messages": deleted_chat,
    }


# ════════════════════════════════════════════════════════════
# Seed Data Default (jika DB kosong)
# ════════════════════════════════════════════════════════════

def seed_default_data(db: Session) -> None:
    """Isi data awal jika database kosong."""
    if db.query(Product).count() > 0:
        return  # Sudah ada data, skip

    default_products = [
        Product(id="p1", name="Laptop Asus ROG", sku="LAP-001", stock=15, price=15000000, category="Elektronik",
                created_at=datetime(2026, 4, 1, 10, 0)),
        Product(id="p2", name="Mouse Logitech MX", sku="MOU-002", stock=50, price=850000, category="Aksesoris",
                created_at=datetime(2026, 4, 1, 10, 0)),
        Product(id="p3", name="Keyboard Mechanical", sku="KEY-003", stock=30, price=1200000, category="Aksesoris",
                created_at=datetime(2026, 4, 2, 10, 0)),
        Product(id="p4", name='Monitor Samsung 27"', sku="MON-004", stock=8, price=4500000, category="Elektronik",
                created_at=datetime(2026, 4, 3, 10, 0)),
        Product(id="p5", name="Headset Sony WH-1000", sku="AUD-005", stock=3, price=3200000, category="Audio",
                created_at=datetime(2026, 4, 5, 10, 0)),
    ]

    default_transactions = [
        Transaction(id="t1", product_id="p1", product_name="Laptop Asus ROG", quantity=2, total_price=30000000,
                    type="sale", note="Penjualan ke PT ABC", created_at=datetime(2026, 4, 10, 14, 30)),
        Transaction(id="t2", product_id="p2", product_name="Mouse Logitech MX", quantity=10, total_price=8500000,
                    type="sale", note="Order bulk kantor", created_at=datetime(2026, 4, 12, 9, 15)),
        Transaction(id="t3", product_id="p3", product_name="Keyboard Mechanical", quantity=5, total_price=6000000,
                    type="sale", note="Penjualan online", created_at=datetime(2026, 4, 15, 11, 0)),
        Transaction(id="t4", product_id="p4", product_name='Monitor Samsung 27"', quantity=3, total_price=13500000,
                    type="sale", note="Order dari Tokopedia", created_at=datetime(2026, 4, 18, 16, 45)),
        Transaction(id="t5", product_id="p1", product_name="Laptop Asus ROG", quantity=5, total_price=60000000,
                    type="purchase", note="Restock dari supplier", created_at=datetime(2026, 4, 20, 8, 0)),
    ]

    db.bulk_save_objects(default_products)
    db.bulk_save_objects(default_transactions)
    db.commit()
