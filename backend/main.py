"""
FastAPI Main Application — Dashboard Bisnis
Backend menggunakan SQLite database via SQLAlchemy.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import os

load_dotenv()

from database import engine, get_db, Base
from models import Product, Transaction, ChatHistory
import crud
from services.openclaw_service import send_message_to_agent, check_agent_health
from services.excel_service import export_transactions, export_products

# Buat semua tabel jika belum ada
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dashboard Bisnis API",
    description="API untuk dashboard penjualan, stok, dan pemasukan — SQLite Database",
    version="2.0.0",
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Seed data default saat pertama kali app dijalankan."""
    db = next(get_db())
    try:
        crud.seed_default_data(db)
    finally:
        db.close()


# ════════════════════════════════════════════════════════════
# Pydantic Schemas
# ════════════════════════════════════════════════════════════

class ProductCreate(BaseModel):
    name: str
    sku: str = ""
    stock: int = 0
    price: float = 0
    category: str = "Umum"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    stock: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None


class TransactionCreate(BaseModel):
    product_id: str
    quantity: int
    type: str = "sale"   # "sale" atau "purchase"
    note: str = ""


class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"


# ════════════════════════════════════════════════════════════
# Dashboard
# ════════════════════════════════════════════════════════════

@app.get("/api/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """Ringkasan dashboard: total penjualan, stok rendah, chart."""
    return crud.get_summary(db)


# ════════════════════════════════════════════════════════════
# Products
# ════════════════════════════════════════════════════════════

@app.get("/api/products")
async def list_products(db: Session = Depends(get_db)):
    """Daftar semua produk."""
    return crud.get_products(db)


@app.post("/api/products")
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Tambah produk baru."""
    return crud.create_product(
        db,
        name=product.name,
        sku=product.sku,
        stock=product.stock,
        price=product.price,
        category=product.category,
    )


@app.put("/api/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, db: Session = Depends(get_db)):
    """Update produk yang ada."""
    p = crud.update_product(db, product_id, **product.model_dump(exclude_none=True))
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, db: Session = Depends(get_db)):
    """Hapus produk."""
    crud.delete_product(db, product_id)
    return {"message": "Product deleted"}


# ════════════════════════════════════════════════════════════
# Transactions
# ════════════════════════════════════════════════════════════

@app.get("/api/transactions")
async def list_transactions(db: Session = Depends(get_db)):
    """Daftar semua transaksi."""
    return crud.get_transactions(db)


@app.post("/api/transactions")
async def create_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):
    """Buat transaksi baru (otomatis update stok)."""
    t = crud.create_transaction(
        db,
        product_id=tx.product_id,
        quantity=tx.quantity,
        type_=tx.type,
        note=tx.note,
    )
    if not t:
        raise HTTPException(status_code=404, detail="Product not found")
    return t


@app.delete("/api/transactions/{tx_id}")
async def delete_transaction(tx_id: str, db: Session = Depends(get_db)):
    """Hapus transaksi."""
    crud.delete_transaction(db, tx_id)
    return {"message": "Transaction deleted"}


# ════════════════════════════════════════════════════════════
# Chat — OpenClaw Agent via SSH Tunnel
# ════════════════════════════════════════════════════════════

@app.post("/api/chat")
async def chat_with_agent(msg: ChatMessage, db: Session = Depends(get_db)):
    """Kirim pesan ke OpenClaw agent via SSH tunnel dan kembalikan respons."""
    # Simpan pesan user ke database
    crud.add_chat(db, "user", msg.message)

    # Forward ke OpenClaw via tunnel
    result = await send_message_to_agent(msg.message, msg.session_id)

    # Simpan balasan agent ke database
    crud.add_chat(db, "assistant", result["reply"])

    return {
        "reply": result["reply"],
        "success": result["success"],
    }


@app.get("/api/chat/history")
async def get_chat_history(db: Session = Depends(get_db)):
    """Ambil riwayat chat dari database."""
    return crud.get_chat_history(db)


@app.delete("/api/chat/history")
async def clear_chat_history(db: Session = Depends(get_db)):
    """Hapus semua riwayat chat."""
    crud.clear_chat(db)
    return {"message": "Chat history cleared"}


@app.get("/api/chat/status")
async def agent_status():
    """Cek apakah OpenClaw agent online via SSH tunnel."""
    return await check_agent_health()


# ════════════════════════════════════════════════════════════
# Excel Export
# ════════════════════════════════════════════════════════════

@app.get("/api/export/transactions")
async def export_transactions_excel(db: Session = Depends(get_db)):
    """Download transaksi sebagai file Excel."""
    data = crud.get_transactions(db)
    output = export_transactions(data)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=transaksi.xlsx"},
    )


@app.get("/api/export/products")
async def export_products_excel(db: Session = Depends(get_db)):
    """Download produk sebagai file Excel."""
    data = crud.get_products(db)
    output = export_products(data)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=produk.xlsx"},
    )


# ════════════════════════════════════════════════════════════
# Health
# ════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "database": "SQLite"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
