"""
OpenClaw Gateway Service — WebSocket Protocol (Verified Working)
Auth: password mode → dikirim di params.auth.password pada connect request

Protokol yang sudah diverifikasi:
1. Connect ke ws://localhost:18789
2. Gateway kirim {type:"event", event:"connect.challenge", payload:{nonce,ts}}
3. Client kirim {type:"req", id:"conn-1", method:"connect", params:{...auth.password...}}
4. Gateway balas {type:"res", id:"conn-1", ok:true, payload:{type:"hello-ok",...}}
5. Client kirim {type:"req", id:"chat-1", method:"chat.send", params:{message,...}}
6. Gateway kirim events (health, presence, dll) + akhirnya session.message dari agent
"""

import os
import json
import asyncio
import uuid
import httpx
import websockets
from websockets.exceptions import InvalidStatus, ConnectionClosed
from dotenv import load_dotenv

load_dotenv()

OPENCLAW_URL    = os.getenv("OPENCLAW_GATEWAY_URL", "http://localhost:18789")
OPENCLAW_PASS   = os.getenv("OPENCLAW_API_TOKEN", "")
OPENCLAW_WS_URL = OPENCLAW_URL.replace("http://", "ws://").replace("https://", "wss://")


# ════════════════════════════════════════════════════════════
# Format connect request yang SUDAH DIVERIFIKASI BENAR
# ════════════════════════════════════════════════════════════

def _make_connect_req(req_id: str = "conn-1") -> dict:
    """
    Buat connect request sesuai protokol OpenClaw (verified dari probe).
    Scopes yang dibutuhkan untuk chat.send: operator.read + operator.write + operator.admin
    """
    return {
        "type": "req",
        "id": req_id,
        "method": "connect",
        "params": {
            "minProtocol": 3,
            "maxProtocol": 3,
            "client": {
                "id": "gateway-client",
                "version": "1.0.0",
                "platform": "server",
                "mode": "backend",
            },
            "role": "operator",
            "scopes": [
                "operator.read",
                "operator.write",
                "operator.admin",
            ],
            "caps": [],
            "commands": [],
            "permissions": {},
            "auth": {"password": OPENCLAW_PASS},
            "locale": "id-ID",
            "userAgent": "bizdashdashboard/1.0.0",
        },
    }


# ════════════════════════════════════════════════════════════
# WebSocket — kirim pesan ke agent
# ════════════════════════════════════════════════════════════

async def _ws_chat(message: str, session_id: str = "default") -> dict | None:
    """
    Kirim pesan ke OpenClaw agent via WebSocket.
    Returns dict dengan reply & success, atau None jika koneksi gagal.
    """
    req_id = f"chat-{uuid.uuid4().hex[:8]}"

    try:
        async with websockets.connect(
            OPENCLAW_WS_URL,
            open_timeout=8,
            ping_interval=20,
            ping_timeout=10,
        ) as ws:

            # ── Langkah 1: Baca connect.challenge dari gateway ──
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=8)
                frame = json.loads(raw)
                if frame.get("event") != "connect.challenge":
                    return None
            except asyncio.TimeoutError:
                return {"success": False, "reply": "__ws_timeout_challenge__"}

            # ── Langkah 2: Kirim connect request (format verified) ──
            await ws.send(json.dumps(_make_connect_req("conn-1")))

            # ── Langkah 3: Tunggu hello-ok ──
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=8)
                res = json.loads(raw)
                if not (res.get("type") == "res" and res.get("ok")):
                    err = res.get("error", {})
                    return {"success": False, "reply": f"__connect_failed__: {err.get('message', '')}"}
                payload = res.get("payload", {})
                if payload.get("type") != "hello-ok":
                    return None
            except asyncio.TimeoutError:
                return {"success": False, "reply": "__ws_timeout_hello__"}

            # ── Langkah 4: Kirim chat.send ──
            chat_req = {
                "type": "req",
                "id": req_id,
                "method": "chat.send",
                "params": {
                    "message": message,
                    "sessionKey": session_id,
                },
            }
            await ws.send(json.dumps(chat_req))

            # ── Langkah 5: Kumpulkan respons agent ──
            reply_parts: list[str] = []
            deadline = asyncio.get_event_loop().time() + 120  # 2 menit timeout

            while asyncio.get_event_loop().time() < deadline:
                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=8)
                    evt = json.loads(raw)
                except asyncio.TimeoutError:
                    if reply_parts:
                        break
                    continue
                except ConnectionClosed:
                    break

                etype = evt.get("type", "")
                eevent = evt.get("event", "")

                # ── Pesan dari agent (event session.message) ──
                if eevent == "session.message":
                    payload_data = evt.get("payload", {})
                    role = payload_data.get("role", "")
                    if role == "assistant":
                        content = payload_data.get("content", "")
                        if isinstance(content, str) and content.strip():
                            reply_parts.append(content.strip())
                            break
                        elif isinstance(content, list):
                            for c in content:
                                if isinstance(c, dict) and c.get("text"):
                                    reply_parts.append(c["text"])
                            if reply_parts:
                                break

                # ── Ack dari chat.send ──
                elif etype == "res" and evt.get("id") == req_id:
                    ok = evt.get("ok", True)
                    if not ok:
                        err_msg = evt.get("error", {}).get("message", "unknown")
                        return {"success": False, "reply": f"__chat_error__: {err_msg}"}
                    # ok=True → agent accepted, tunggu session.message

                # ── Streaming chunks ──
                elif eevent in ("agent.delta", "agent.stream", "chat.stream"):
                    chunk = evt.get("payload", {}).get("content", "")
                    if isinstance(chunk, str) and chunk:
                        reply_parts.append(chunk)

                # ── Agent selesai ──
                elif eevent in ("agent.done", "chat.done", "session.done"):
                    break

                # Abaikan: health, presence, tick, heartbeat, dll

            if reply_parts:
                return {"success": True, "reply": "".join(reply_parts).strip()}

    except (OSError, ConnectionRefusedError):
        return {"success": False, "reply": "__tunnel_down__"}
    except InvalidStatus as e:
        code = getattr(e.response, "status_code", 0)
        return {"success": False, "reply": f"__ws_status_{code}__"}
    except Exception as e:
        return {"success": False, "reply": f"__ws_exception__: {str(e)[:100]}"}

    return None


# ════════════════════════════════════════════════════════════
# Fungsi Utama
# ════════════════════════════════════════════════════════════

async def send_message_to_agent(message: str, session_id: str = "default") -> dict:
    """Kirim pesan ke OpenClaw agent via SSH tunnel (port 18789)."""
    result = await _ws_chat(message, session_id)

    if result is None:
        return {
            "success": False,
            "reply": (
                "⚠️ **Tidak dapat terhubung ke OpenClaw.**\n\n"
                "Pastikan SSH tunnel aktif:\n"
                "```\nssh -N -L 18789:127.0.0.1:18789 kelompok2ai@40.82.128.139\n```"
            ),
        }

    reply = result.get("reply", "")

    # ── Error mapping ──
    if reply == "__tunnel_down__":
        return {
            "success": False,
            "reply": (
                "❌ **SSH Tunnel tidak aktif!**\n\n"
                "Jalankan di terminal:\n"
                "```\nssh -N -L 18789:127.0.0.1:18789 kelompok2ai@40.82.128.139\n```"
            ),
        }

    if "__chat_error__" in reply:
        detail = reply.replace("__chat_error__: ", "")
        return {
            "success": False,
            "reply": (
                f"⚠️ **Agent menolak pesan:** `{detail}`\n\n"
                "Kemungkinan skill `business-dashboard` belum dimuat di OpenClaw.\n"
                "Pastikan folder `openclaw-skills/business-dashboard/` sudah tersalin ke VPS."
            ),
        }

    if "__connect_failed__" in reply:
        detail = reply.replace("__connect_failed__: ", "")
        return {
            "success": False,
            "reply": f"🔐 **Koneksi gateway gagal:** `{detail}`\n\nCek password di `.env`.",
        }

    if result.get("success"):
        return {"reply": reply, "success": True}

    # Fallback generic
    return {
        "success": False,
        "reply": (
            "⚠️ **OpenClaw agent tidak merespons.**\n\n"
            "Tunnel SSH aktif, namun agent belum mengembalikan balasan.\n\n"
            "**Cek di VPS:**\n"
            "```bash\n"
            "openclaw status\n"
            "openclaw logs --follow\n"
            "```\n\n"
            f"*Diagnostic: `{reply}`*"
        ),
    }


# ════════════════════════════════════════════════════════════
# Health Check
# ════════════════════════════════════════════════════════════

async def check_agent_health() -> dict:
    """Cek status OpenClaw dengan WebSocket handshake."""
    try:
        async with websockets.connect(OPENCLAW_WS_URL, open_timeout=5) as ws:
            # Baca challenge
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=5)
                frame = json.loads(raw)
                if frame.get("event") != "connect.challenge":
                    return {"status": "online", "note": "unexpected_frame", "tunnel_port": 18789}
            except asyncio.TimeoutError:
                return {"status": "online_no_challenge", "tunnel_port": 18789}

            # Kirim connect
            await ws.send(json.dumps(_make_connect_req("health-check")))

            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=5)
                res = json.loads(raw)
                if res.get("ok") and res.get("payload", {}).get("type") == "hello-ok":
                    payload = res["payload"]
                    server  = payload.get("server", {})
                    return {
                        "status": "online",
                        "auth": "ok",
                        "version": server.get("version"),
                        "protocol": payload.get("protocol"),
                        "tunnel_port": 18789,
                    }
                else:
                    return {"status": "online_auth_error", "error": res.get("error", {})}
            except asyncio.TimeoutError:
                return {"status": "online_slow", "tunnel_port": 18789}

    except (OSError, ConnectionRefusedError):
        return {
            "status": "tunnel_down",
            "message": "Tunnel tidak aktif. Jalankan: ssh -N -L 18789:127.0.0.1:18789 kelompok2ai@40.82.128.139",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)[:100]}
