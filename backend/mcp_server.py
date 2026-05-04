import os
import json
from mcp.server.fastmcp import FastMCP
from fastapi import FastAPI
from dotenv import load_dotenv

import crud
from database import get_db

load_dotenv()

# Create FastMCP server instance
mcp = FastMCP("business-dashboard")

@mcp.tool()
def get_dashboard_summary() -> str:
    """Get a summary of the business dashboard including total sales, net income, total products, and low stock count."""
    db = next(get_db())
    try:
        summary = crud.get_summary(db)
        return json.dumps(summary, indent=2)
    finally:
        db.close()

@mcp.tool()
def list_products() -> str:
    """Get the list of all products in the inventory with their current stock and price."""
    db = next(get_db())
    try:
        products = crud.get_products(db)
        products_data = [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock": p.stock,
                "price": p.price,
                "category": p.category
            } for p in products
        ]
        return json.dumps(products_data, indent=2)
    finally:
        db.close()

@mcp.tool()
def create_transaction(product_id: str, quantity: int, type: str, note: str = "") -> str:
    """Create a new transaction (sale or purchase) for a specific product. This will automatically update the product's stock.
    Args:
        product_id: The unique ID of the product.
        quantity: Number of items (e.g., 5).
        type: Type of transaction ('sale' or 'purchase').
        note: Optional note for the transaction.
    """
    db = next(get_db())
    try:
        tx = crud.create_transaction(
            db,
            product_id=product_id,
            quantity=quantity,
            type_=type,
            note=note
        )
        if not tx:
            return f"Error: Product with ID {product_id} not found or insufficient stock."
            
        return f"Transaction created successfully. ID: {tx.id}, Type: {tx.type}, Quantity: {tx.quantity}"
    finally:
        db.close()

@mcp.tool()
def list_expenses() -> str:
    """Get the list of all operational expenses (pengeluaran)."""
    db = next(get_db())
    try:
        expenses = crud.get_expenses(db)
        return json.dumps(expenses, indent=2)
    finally:
        db.close()

@mcp.tool()
def create_expense(name: str, amount: float, note: str = "") -> str:
    """Record a new operational expense (pengeluaran). DO NOT use this for purchasing product restocks.
    Args:
        name: Name or description of the expense (e.g., 'Bayar Listrik', 'Gaji Pegawai').
        amount: The total amount of the expense.
        note: Optional additional notes.
    """
    db = next(get_db())
    try:
        e = crud.create_expense(
            db,
            name=name,
            amount=amount,
            note=note
        )
        return f"Expense created successfully. ID: {e['id']}, Name: {e['name']}, Amount: {e['amount']}"
    finally:
        db.close()

# FastMCP handles SSE natively.
if __name__ == "__main__":
    # If run standalone, run the FastMCP server directly
    mcp.settings.port = 8001
    mcp.settings.host = "0.0.0.0"
    mcp.run(transport="sse")
