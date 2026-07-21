## WebSocket Authentication

আগের chapter গুলোতে আমরা WebSocket server বানালাম, ConnectionManager যোগ করলাম, broadcasting করলাম। কিন্তু একটা গুরুত্বপূর্ণ জিনিস এখনো বাদ ছিল — যে যে খুশি সে connect করতে পারছে! কোনো authentication নেই, কোনো authorization নেই। Real application এ এটা চলবে না। তোমার chat app এ শুধু authenticated user গুলোই connect করতে পারবে, আর তাদের identity জানা থাকবে।

কিন্তু এখানে একটা মজার সমস্যা আছে। HTTP API তে তুমি `Authorization: Bearer <token>` header পাঠাও — সোজা কাজ। কিন্তু WebSocket এ? Browser এর `WebSocket` API তে কোনো custom header পাঠানোর সুযোগ নেই! তাহলে কীভাবে authentication করবে?

এই chapter এ আমরা দেখবো — WebSocket authentication এর তিনটা পদ্ধতি, কোনটা কখন use করবে, আর কীভাবে production-ready auth বানাবো।

## সমস্যা: Browser WebSocket API তে Custom Header নেই

চলো আগে সমস্যাটা পরিষ্কার করি। সাধারণ HTTP request এ তুমি যেভাবে token পাঠাও:

```javascript
// HTTP request with auth header — easy!
fetch("/api/messages", {
    headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
    }
});
```

এখন একই কাজ WebSocket এ করতে চাও:

```javascript
// This does NOT work — browser WebSocket API has no headers option
const ws = new WebSocket("ws://localhost:8000/ws", {
    headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
    }
});
// Error: WebSocket constructor does not accept headers
```

কিন্তু এটা কাজ করবে না। Browser এর `WebSocket` API তে দ্বিতীয় argument হলো subprotocols, সেটা header না। কোনো custom header পাঠানোর কোনো উপায় নেই।

> [!note] Server-side WebSocket client এ header পাঠানো যায়
> এই limitation শুধু browser এর জন্য। যদি তোমার server থেকে অন্য server এ WebSocket connect করো (যেমন Python এর `websockets` বা `httpx`), সেখানে custom header পাঠানো যায়। Browser এর `WebSocket` API ই শুধু এই restriction দেয়।

মোটামুটি এই সমস্যা সমাধানের জন্য তিনটা প্রধান পদ্ধতি আছে। চলো এক এক করে দেখি।

## পদ্ধতি ১: Query Parameter Token

সবচেয়ে সহজ উপায় — token টা URL এর query parameter হিসেবে পাঠানো।

```javascript
// Client side: token in query param
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);
```

Server পাশে সেই token টা পড়ে validate করা হয়:

```python
# Server side: read token from query param
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import jwt

app = FastAPI()
SECRET_KEY = "your-secret-key"

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Extract token from query parameter
    token = websocket.query_params.get("token")
    
    if not token:
        # No token — reject immediately
        await websocket.close(code=4401)
        return
    
    try:
        # Verify JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        # Invalid token — reject
        await websocket.close(code=4401)
        return
    
    # Token valid — accept the connection
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Hello {user_id}, you said: {data}")
    except WebSocketDisconnect:
        print(f"User {user_id} disconnected")
```

উপরের কোডে কী হচ্ছে সেটা একটু খেয়াল করো। Client যখন `ws://localhost:8000/ws?token=eyJ...` দিয়ে connect করে, তখন FastAPI `query_params` থেকে token টা read করে। Token না থাকলে বা invalid হলে — `close(code=4401)` দিয়ে connection বন্ধ করে দেয়, `accept()` হয়ই না। আর token valid হলে `accept()` করে সাধারণ WebSocket communication শুরু হয়।

> [!warn] Token query param-এ দিলে server logs-এ দেখা যায়, production-এ wss:// (TLS) use করুন
> Query param token এর সবচেয়ে বড় ঝুঁকি হলো — token টা URL এ থাকে। যে কোনো server access log, proxy log, এমনকি browser history তেও token দেখা যেতে পারে। তাই production-এ অবশ্যই `wss://` (WebSocket over TLS) use করুন, যাতে URL encrypted থাকে। আর server log এ query param লেখা বন্ধ করুন।

### Query param এর সুবিধা ও অসুবিধা

সুবিধা হলো — implement করা সহজ, client পাশে এক লাইন change। যেকোনো browser এ কাজ করে। কিন্তু অসুবিধাও কম না — token URL এ থাকে যা log এ leak হতে পারে, আর token বড় হলে URL এর length limit এ গিয়ে পড়তে পারে।

## পদ্ধতি ২: Cookie-Based Authentication

দ্বিতীয় পদ্ধতি হলো — cookie use করা। Browser যখন `new WebSocket("ws://localhost:8000/ws")` call করে, তখন automatically সেই domain এর cookies WebSocket handshake request এর সাথে যায়। মানে আলাদা করে token পাঠাতে হয় না।

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as Server
    Note over B: User logs in via HTTP
    B->>S: POST /login (credentials)
    S-->>B: Set-Cookie: session=abc123, HttpOnly, Secure
    Note over B: Cookie stored automatically
    Note over B: Later: open WebSocket
    B->>S: GET /ws (Upgrade: websocket) — cookie sent automatically
    Note over S: Read cookie from handshake headers
    S-->>B: 101 Switching Protocols (if cookie valid)
```

মানে user প্রথমে HTTP দিয়ে login করে, server session cookie set করে। তারপর যখন WebSocket connect করে, সেই cookie automatically handshake এর সাথে যায়। Server সেই cookie read করে user কে identify করে।

```python
# Server side: cookie-based WebSocket auth
from fastapi import FastAPI, WebSocket
from itsdangerous import URLSafeTimedSerializer

app = FastAPI()
serializer = URLSafeTimedSerializer("secret-key", salt="cookie-auth")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Cookie is automatically sent with WebSocket handshake
    cookie_header = websocket.headers.get("cookie")
    
    if not cookie_header:
        await websocket.close(code=4401)
        return
    
    # Parse the cookie string to find session cookie
    session_token = None
    for cookie in cookie_header.split(";"):
        name, _, value = cookie.strip().partition("=")
        if name == "session":
            session_token = value
            break
    
    if not session_token:
        await websocket.close(code=4401)
        return
    
    try:
        # Verify session token, max age 1 hour
        user_id = serializer.loads(session_token, max_age=3600)
    except Exception:
        await websocket.close(code=4401)
        return
    
    await websocket.accept()
    await websocket.send_text(f"Welcome back, user {user_id}!")
```

এই approach এ cookie header টা `websocket.headers.get("cookie")` দিয়ে read করা হয়। কোনো আলাদা token পাঠানো লাগে না। Server সেই cookie parse করে session token বের করে, verify করে, আর user কে identify করে।

cookie approach এর বড় সুবিধা হলো — যদি তোমার app এ আগে থেকেই session-based auth চলছে (যেমন Django, Flask login), তাহলে WebSocket এ আলাদা auth বানাতে হবে না। একই cookie use করবে। আর `HttpOnly; Secure` cookie হলে JavaScript দিয়ে access করা যায় না, তাই XSS attack এ token চুরি হওয়ার ঝুঁকি কম।

কিন্তু একটা বিষয় খেয়াল রাখতে হবে — WebSocket handshake এর সময় `Origin` header check করা, নাহলে CSRF attack হতে পারে। সেটা পরের section এ দেখবো।

## পদ্ধতি ৩: First Message Authentication

তৃতীয় পদ্ধতি টা একটু আলাদা। এখানে connection প্রথমে accept করা হয়, তারপর client এর প্রথম message টাই authentication token হিসেবে ধরা হয়।

```javascript
// Client side: connect first, then send auth as first message
const ws = new WebSocket("ws://localhost:8000/ws");

ws.onopen = () => {
    // First message — authentication
    ws.send(JSON.stringify({
        type: "auth",
        token: "eyJhbGciOiJIUzI1NiIs..."
    }));
    
    // Subsequent messages — normal chat
    ws.send(JSON.stringify({
        type: "message",
        content: "Hello everyone!"
    }));
};
```

```python
# Server side: first message authentication
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
import jwt

app = FastAPI()
SECRET_KEY = "your-secret-key"

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Accept connection first — auth comes later
    await websocket.accept()
    
    # Wait for the first message — this must be the auth token
    try:
        auth_message = await asyncio.wait_for(
            websocket.receive_text(),
            timeout=10  # Must authenticate within 10 seconds
        )
        data = json.loads(auth_message)
        
        if data.get("type") != "auth" or "token" not in data:
            await websocket.close(code=4401)
            return
        
        # Verify token
        payload = jwt.decode(data["token"], SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except (asyncio.TimeoutError, json.JSONDecodeError, jwt.PyJWTError):
        await websocket.close(code=4401)
        return
    
    # Authenticated — now handle normal messages
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"{user_id}: {data}")
    except WebSocketDisconnect:
        print(f"User {user_id} disconnected")
```

এখানে একটা জিনিস খেয়াল করো — connection আগে accept হয়ে যায়, কিন্তু authenticated হয় না। তাই একটা timeout দেওয়া হয়েছে — ১০ সেকেন্ডের মধ্যে auth message না পাঠালে connection বন্ধ। নাহলে কেউ connect করে বসে থাকবে আর resource খাবে। এটা খুব important, নাহলে unauthenticated connection গুলো memory leak হবে।

এই approach এর সুবিধা হলো token কখনো URL বা log এ যায় না। আর token বড় হলেও কোনো সমস্যা নেই। কিন্তু অসুবিধা হলো — connection টা কিছুক্ষণ unauthenticated থাকে, যদিক আংশিক। আর client পাশে logic একটু বেশি জটিল হয়।

## Origin Checking — CSRF প্রতিরোধ

যেকোনো auth পদ্ধতিই use করো, একটা জিনিস অবশ্যই করতে হবে — Origin header check করা। নাহলে একটা malicious website তোমার WebSocket এ connect করে দুষ্টু কাজ করতে পারে।

ধরো user তোমার site এ logged in (cookie-based auth)। এখন user একটা খারাপ site এ যায়। সেই খারাপ site এর JavaScript যদি তোমার WebSocket এ connect করার চেষ্টা করে — browser automatic cookie পাঠিয়ে দেবে! এটাই CSRF attack।

```python
# Origin checking to prevent CSRF
ALLOWED_ORIGINS = {
    "https://myapp.com",
    "https://www.myapp.com",
    "http://localhost:5173",  # dev environment
}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Check Origin header
    origin = websocket.headers.get("origin")
    
    if origin not in ALLOWED_ORIGINS:
        # Reject — this connection is from a different site
        await websocket.close(code=4403)
        return
    
    # Origin is fine — proceed with normal auth
    # ... rest of authentication logic
```

origin check করা খুবই simple — `websocket.headers.get("origin")` দিয়ে origin পড়ো, আর একটা whitelist এর সাথে compare করো। যদি origin whitelist এ না থাকে, সাথে সাথে connection reject করো। এটা CSRF প্রতিরোধের সবচেয়ে কার্যকর উপায়।

> [!tip] Development vs Production origin
> Development এ `http://localhost:5173` (Vite) বা `http://localhost:3000` (Next.js) origin allow করতে পারো। কিন্তু production-এ শুধু তোমার actual domain allow করো। Wildcard (`*`) কখনোই use করবে না।

## accept() Phase এ Validation

একটা গুরুত্বপূর্ণ বিষয় — validation কখন করবে? আগে নাকি পরে? সবসময় **accept করার আগে** validate করবে। যদি accept করে ফেলো, তারপর reject করো — client side এ কনফিউশন হয়, আর resource কিছুক্ষণ নষ্ট হয়।

```python
# Correct: validate BEFORE accept
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    
    if not token:
        await websocket.close(code=4401)  # close without accepting
        return
    
    user = verify_token(token)
    if not user:
        await websocket.close(code=4401)
        return
    
    # Everything checks out — now accept
    await websocket.accept()
    await websocket.send_text(f"Welcome, {user.name}!")
```

এখানে close হয় accept এর আগেই। FastAPI তে এটা valid — `websocket.close()` কে accept না করেও call করা যায়। Client পাশে `onclose` event আসবে আর close code দেখে বুঝবে যে auth fail করেছে।

## Unauthenticated Connection Reject করা

যখন কোনো connection reject করো, একটা সঠিক close code use করো। Standard WebSocket close codes (1000-4999) আছে। Custom code ব্যবহার করা যায় 4000-4999 range এ। সাধারণ convention:

```python
# Common WebSocket close codes for auth
# 4401 — Unauthorized (like HTTP 401)
# 4403 — Forbidden (like HTTP 403)
# 4400 — Bad Request (invalid auth message format)

async def reject_unauthorized(websocket: WebSocket, reason: str = "Unauthorized"):
    """Close connection with proper auth error code."""
    # 4401 is a custom code meaning "authentication required"
    await websocket.close(code=4401, reason=reason)
```

Client পাশে এই close code check করা যায়:

```javascript
// Client side: handle auth rejection
ws.onclose = (event) => {
    if (event.code === 4401) {
        // Authentication failed — redirect to login
        console.log("WebSocket authentication failed");
        window.location.href = "/login";
    } else if (event.code === 4403) {
        // Forbidden — no permission
        console.log("Access denied");
    } else {
        // Normal close or other error
        console.log(`Connection closed: ${event.code} ${event.reason}`);
    }
};
```

## Active Connection এ Token Refresh

JWT token গুলো সাধারণত expire হয় — যেমন ১ ঘন্টা পর। HTTP API তে refresh করা সহজ, কিন্তু WebSocket এ যদি connection খোলা থাকে ২ ঘন্টা? তখন token expire হয়ে যাবে। সমাধান হলো — server নিয়মিত token verify করবে, আর expire হলে client কে বলবে নতুন token পাঠাতে।

```python
# Server side: token refresh during active connection
import time
import asyncio

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        exp = payload.get("exp")
    except jwt.PyJWTError:
        await websocket.close(code=4401)
        return
    
    await websocket.accept()
    
    # Background task: check token expiry periodically
    async def check_token_expiry():
        while True:
            await asyncio.sleep(60)  # Check every minute
            current_time = time.time()
            if exp - current_time < 300:  # Less than 5 min left
                # Ask client to refresh token
                await websocket.send_json({
                    "type": "token_refresh_required"
                })
    
    # Run token check as background task
    token_task = asyncio.create_task(check_token_expiry())
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "token_refresh":
                # Client sent a new token
                new_token = message.get("token")
                try:
                    new_payload = jwt.decode(new_token, SECRET_KEY, algorithms=["HS256"])
                    exp = new_payload.get("exp")
                    await websocket.send_json({"type": "token_refreshed"})
                except jwt.PyJWTError:
                    await websocket.close(code=4401)
    except WebSocketDisconnect:
        pass
    finally:
        token_task.cancel()
```

এখানে একটা background task চলে যেটা প্রতি মিনিটে token expiry check করে। যদি ৫ মিনিটের কম বাকি থাকে, client কে `token_refresh_required` message পাঠায়। Client নতুন token পাঠালে সেটা verify করে আপডেট হয়ে যায়। এভাবে connection টা active থাকে, আর token ও fresh থাকে।

## Real Example: JWT-based WebSocket Auth

এবার আসি একটা complete example এ — JWT token দিয়ে query param auth, origin checking, সব মিলিয়ে একটা production-ready setup।

```python
# Complete JWT WebSocket auth with origin checking
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
import json
from datetime import datetime, timedelta, timezone

app = FastAPI()
SECRET_KEY = "super-secret-key-change-in-production"
ALGORITHM = "HS256"

ALLOWED_ORIGINS = {
    "https://myapp.com",
    "http://localhost:5173",
}

# HTTP login endpoint — returns JWT token
@app.post("/login")
async def login(username: str, password: str):
    # Verify credentials (simplified — use proper hashing in production)
    if username == "admin" and password == "secret":
        token = jwt.encode(
            {
                "sub": username,
                "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# WebSocket endpoint with full auth
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Step 1: Check origin (CSRF protection)
    origin = websocket.headers.get("origin")
    if origin not in ALLOWED_ORIGINS:
        await websocket.close(code=4403, reason="Origin not allowed")
        return
    
    # Step 2: Extract token from query param
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401, reason="Token required")
        return
    
    # Step 3: Verify JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except jwt.ExpiredSignatureError:
        await websocket.close(code=4401, reason="Token expired")
        return
    except jwt.PyJWTError:
        await websocket.close(code=4401, reason="Invalid token")
        return
    
    # Step 4: Accept the connection
    await websocket.accept()
    await websocket.send_text(f"Connected as {username}")
    
    # Step 5: Main message loop
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await websocket.send_text(f"{username}: {message.get('text', '')}")
    except WebSocketDisconnect:
        print(f"{username} disconnected")
    except json.JSONDecodeError:
        await websocket.close(code=4400, reason="Invalid JSON")
```

এই example এ পাঁচটা step আছে — origin check, token extract, JWT verify, accept, আর message loop। প্রতিটা step এ ব্যর্থ হলে সঠিক close code দিয়ে reject করা হয়। Client পাশে এর সাথে মিলিয়ে logic লেখা যায়।

এই পুরো flow টা একটা diagram এ দেখলে আরও পরিষ্কার হবে:

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    Note over C: User logs in via HTTP
    C->>S: POST /login (username, password)
    S-->>C: {access_token: "eyJ..."}
    Note over C: Store token in memory
    Note over C: Open WebSocket with token
    C->>S: ws://host/ws?token=eyJ... (Origin header)
    Note over S: Check Origin header
    alt Origin not allowed
        S-->>C: Close 4403 (Forbidden)
    else Origin OK
        Note over S: Verify JWT token
        alt Token invalid/expired
            S-->>C: Close 4401 (Unauthorized)
        else Token valid
            S-->>C: 101 Switching Protocols (accept)
            S-->>C: "Connected as admin"
            loop Real-time messages
                C->>S: {"text": "Hello!"}
                S-->>C: "admin: Hello!"
            end
        end
    end
```

## তিনটা Auth পদ্ধতির তুলনা

এক নজরে তিনটি পদ্ধতির তুলনা দেখি:

| বিষয় | Query Param Token | Cookie-Based | First Message Auth |
|------|------|------|------|
| Implementation complexity | সহজ | মাঝারি | কিছুটা জটিল |
| Token in URL/logs | হ্যাঁ (ঝুঁকি) | না | না |
| Works with existing session auth | না | হ্যাঁ | না |
| Browser support | সব | সব | সব |
| Token size limit | হ্যাঁ (URL length) | না | না |
| CSRF risk | কম | বেশি (origin check লাগে) | কম |
| Connection unauthenticated period | না | না | হ্যাঁ (short) |
| Best for | Quick prototyping, microservices | Traditional web apps | High-security apps |

> [!example] কোন পদ্ধতি কখন use করবে?
> - তুমি যদি SPA (React, Vue) বানাও আর JWT use করো — **query param** দিয়ে শুরু করো, simple আর কাজ চালে।
> - তুমি যদি traditional web app (Django, Flask with sessions) বানাও — **cookie-based** সবচেয়ে natural।
> - তুমি যদি high-security app বানাও যেখানে token log এ যাওয়া কোনোভাবেই চলবে না — **first message** auth use করো।
> - যেকোনো পদ্ধতিতেই **origin checking** অবশ্যই করবে।

## সারসংক্ষেপ

এই chapter এ আমরা দেখলাম — WebSocket এ browser এর custom header limitation থাকে, তাই authentication করতে হয় query param, cookie, বা first message দিয়ে। প্রতিটি পদ্ধতির নিজস্ব সুবিধা ও অসুবিধা আছে। যেকোনো পদ্ধতি use করো, দুটো জিনিস অবশ্যই করবে — accept করার আগে validate করা, আর origin header check করা। আর active connection এ token expire হলে একটা refresh mechanism রাখবে। এই সব মিলিয়ে একটা secure WebSocket authentication তৈরি হয়।