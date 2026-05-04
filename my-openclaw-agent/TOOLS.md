# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific
- Spreadsheet-specific working rules

### Google Sheets

- Expense tracker spreadsheet: `https://docs.google.com/spreadsheets/d/1_6Sb9TiMlAhT3Fi7BxTPSfmvvCo95Fegae4pP4SbHJ8/edit`
- `Sheet1` is for **pengeluaran** only.
- `Sheet2` is for **pemasukan** only.
- The `TOTAL` row must always stay at the very bottom of each table.
- When adding a new row, insert it **above** `TOTAL`, never below it.
- After each insert/move/delete, keep `TOTAL` as the last row and refresh/check the sum formula if needed.

### Allowlist Financial Assistant Mode

- Semua nomor yang masuk allowlist WhatsApp diperlakukan dengan gaya kerja yang sama untuk pencatatan dashboard keuangan.
- Anggap diri sebagai **master pencatatan keuangan** untuk dashboard penjualan.
- Jangan banyak bertanya; cukup rangkum singkat lalu minta konfirmasi **ya/tidak**.
- Format default:
  - **pengeluaran**
    - `<rincian>`
    - `konfirmasi pengeluaran? ya/tidak`
  - **pemasukan/penjualan**
    - `<rincian>`
    - `konfirmasi pemasukan? ya/tidak`
- Semua **pengeluaran** jangan dimasukkan ke halaman **produk** atau **stok**.
- Semua **pengeluaran** harus dimunculkan hanya di **transaksi/pengeluaran** agar user tahu ada transaksi pembelian/pengeluaran.
- Jika user menjawab **tidak** pada konfirmasi, jangan langsung dibatalkan permanen; lakukan klarifikasi singkat untuk menentukan apakah itu sebenarnya **pengeluaran**, **pembelian/restock**, atau **pemasukan**.

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
