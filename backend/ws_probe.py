"""OpenClaw Probe — tanpa device identity (dangerouslyDisableDeviceAuth=true)."""
import asyncio
import json
import sys

print(f"Python: {sys.version}")

PASSWORD = "uaiuai"
GATEWAY_WS = "ws://localhost:18789"


async def check_tunnel():
    print("=" * 50)
    print("STEP 1: Cek tunnel")
    print("=" * 50)
    try:
        r, w = await asyncio.wait_for(
            asyncio.open_connection("127.0.0.1", 18789), timeout=3
        )
        w.close()
        await w.wait_closed()
        print("  ✅ Port 18789 TERBUKA")
        return True
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")
        return False


async def check_websocket():
    print()
    print("=" * 50)
    print("STEP 2: WebSocket (password only, NO device)")
    print("=" * 50)

    import websockets

    try:
        ws = await websockets.connect(GATEWAY_WS)
        try:
            # 1. Baca connect.challenge
            raw = await asyncio.wait_for(ws.recv(), timeout=5)
            frame = json.loads(raw)
            print(f"  Challenge: event={frame.get('event')}")

            # 2. Kirim connect TANPA device field
            connect_req = {
                "type": "req",
                "id": "c1",
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
                    "auth": {"password": PASSWORD},
                    "locale": "id-ID",
                    "userAgent": "dashboard/1.0.0",
                },
            }
            await ws.send(json.dumps(connect_req))
            print("  Connect sent (password only, no device)...")

            # 3. Baca response
            raw = await asyncio.wait_for(ws.recv(), timeout=8)
            res = json.loads(raw)
            ok = res.get("ok", False)

            if ok:
                payload = res.get("payload", {})
                if payload.get("type") == "hello-ok":
                    auth_info = payload.get("auth", {})
                    scopes = auth_info.get("scopes", [])
                    role = auth_info.get("role", "?")
                    ver = payload.get("server", {}).get("version", "?")
                    print(f"  ✅ hello-ok! Server v{ver}")
                    print(f"     Role: {role}")
                    print(f"     Scopes: {scopes}")

                    if "operator.write" not in scopes:
                        print("  ⚠️ operator.write TIDAK diberikan!")
                        return False

                    # Test chat.send
                    print()
                    print("  🚀 Testing chat.send...")
                    chat_req = {
                        "type": "req",
                        "id": "chat-1",
                        "method": "chat.send",
                        "params": {"message": "halo, siapa kamu?"},
                    }
                    await ws.send(json.dumps(chat_req))

                    for i in range(25):
                        try:
                            raw = await asyncio.wait_for(ws.recv(), timeout=8)
                            evt = json.loads(raw)
                            et = evt.get("type", "")
                            ee = evt.get("event", "")

                            if et == "res" and evt.get("id") == "chat-1":
                                if evt.get("ok"):
                                    print("  ✅ chat.send ACCEPTED!")
                                else:
                                    err = evt.get("error", {})
                                    print(f"  ❌ chat.send REJECTED: {err.get('message')}")
                                    return False

                            if ee == "session.message":
                                p = evt.get("payload", {})
                                if p.get("role") == "assistant":
                                    content = p.get("content", "")
                                    print(f"  🤖 AGENT: {str(content)[:400]}")
                                    return True
                        except asyncio.TimeoutError:
                            continue

                    print("  ⚠️ Timeout — agent tidak merespons")
                    return False
            else:
                err = res.get("error", {})
                print(f"  ❌ [{err.get('code')}] {err.get('message')}")
                print(f"     Details: {err.get('details', {})}")
                return False

        finally:
            await ws.close()

    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    ok = await check_tunnel()
    if not ok:
        return
    result = await check_websocket()
    print()
    if result:
        print("🎉 SEMUA BERHASIL! Dashboard siap digunakan!")
    else:
        print("❌ Ada masalah. Lihat detail di atas.")


asyncio.run(main())