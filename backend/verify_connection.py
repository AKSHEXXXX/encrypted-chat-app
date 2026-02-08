import asyncio
import websockets
import sys
import argparse

async def test_websocket(url, origin, token, room="general"):
    # Construct full URL
    if not url.endswith('/'):
        url += '/'
    
    ws_url = f"{url}ws/{room}?token={token}"
    ws_url = ws_url.replace("http://", "ws://").replace("https://", "wss://")
    
    print(f"Testing connection to: {ws_url}")
    print(f"Using Origin header: {origin}")
    
    headers = {
        "Origin": origin
    }
    
    try:
        async with websockets.connect(ws_url, extra_headers=headers) as websocket:
            print("Successfully connected!")
            # Wait for any potential server message (broadcast of arrival?)
            # or just send a test ping
            await websocket.send("ping")
            print("Successfully sent 'ping'")
            
            # Close gracefully
            await websocket.close()
            print("Connection closed gracefully.")
            return True
    except Exception as e:
        print(f"ERROR: Failed to connect.")
        print(f"Exception details: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test WebSocket connection to backend.")
    parser.add_argument("--url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--origin", default="http://localhost:5173", help="Origin header to send")
    parser.add_argument("--token", required=True, help="JWT token for authentication")
    parser.add_argument("--room", default="general", help="Chat room to join")
    
    args = parser.parse_args()
    
    if not args.token:
        print("Error: --token is required. Login first to get a token.")
        sys.exit(1)
        
    success = asyncio.run(test_websocket(args.url, args.origin, args.token, args.room))
    sys.exit(0 if success else 1)
