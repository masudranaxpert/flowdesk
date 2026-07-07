## Authentication ও Security

তুমি একটা API বানালে — কিন্তু সবাই কি সব data access করতে পারবে? অবশ্যই না। User A এর data User B দেখতে পারবে না। Admin যা করতে পারবে, normal user পারবে না। এই সব control করার জন্য দরকার authentication আর authorization।

এই chapter এ আমরা শিখবো — password কীভাবে securely store করতে হয়, JWT token কীভাবে বানাতে হয়, protected route কীভাবে বানাতে হয়, আর role-based access control কীভাবে implement করতে হয়।

## Auth Basics — Session vs Token

Web এ authentication মূলত দুই ভাবে হয় — Session-based আর Token-based। চলো দুটোর পার্থক্য বুঝি।

### Session-based Auth

Session-based auth এ user login করলে server একটা session create করে, আর একটা session ID cookie তে পাঠায়। এরপর প্রতিটা request এ এই cookie টা আসে, আর server session ID দিয়ে user কে identify করে।

```mermaid
flowchart LR
    U[User] -->|1. Login| S[Server]
    S -->|2. Create session, store in memory/DB| DB[(Session Store)]
    S -->|3. Set session ID cookie| U
    U -->|4. Request with cookie| S
    S -->|5. Look up session| DB
    S -->|6. Response| U
```

Session এর সমস্যা — server এ session store করতে হয়। যদি multiple server হয়, তাহলে সবাইকে একই session store access করতে হবে (যেমন Redis)। Scale করা একটু কঠিন।

### Token-based Auth (JWT)

Token-based auth এ user login করলে server একটা token (JWT) দেয়। এই token টাতে user এর info encoded থাকে। এরপর প্রতিটা request এ এই token টা `Authorization: Bearer <token>` header এ পাঠাতে হয়।

```mermaid
flowchart LR
    U[User] -->|1. Login email+password| S[Server]
    S -->|2. Verify password, generate JWT| JWT[JWT Token]
    JWT -->|3. Return token| U
    U -->|4. Request with Bearer token| S
    S -->|5. Verify token signature| S
    S -->|6. Response| U
```

JWT এর সুবিধা — server এ কিছু store করতে হয় না। Token নিজেই self-contained — এর ভেতরে user info আছে, expiry আছে, signature আছে। তাই scale করা সহজ।

> [!tip] কখন কোনটা use করবে?
> যদি traditional web app হয় (server-rendered, cookie-based), session ভালো। যদি API বা SPA (React, Vue) হয়, JWT ভালো। FastAPI তে সাধারণত JWT ব্যবহার করা হয়।

## Password Hashing — passlib

User এর password কখনো plain text এ store করা যাবে না। যদি database leak হয়, সব password পাবলিক হয়ে যাবে। তাই password কে hash করে store করতে হয়।

Hashing হলো একমুখী — password থেকে hash বানানো যায়, কিন্তু hash থেকে password ফেরানো যায় না। সবচেয়ে জনপ্রিয় hashing algorithm হলো **bcrypt** আর **argon2**।

```python
# Password hashing with passlib
from passlib.context import CryptContext

# Use bcrypt for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Example usage
hashed = hash_password("mypassword123")
print(hashed)
# Output: $2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

print(verify_password("mypassword123", hashed))   # True
print(verify_password("wrongpassword", hashed))    # False
```

এই কোডে `passlib` এর `CryptContext` ব্যবহার করা হয়েছে। `hash_password` function টা password নিয়ে bcrypt hash return করে। `verify_password` function টা plain password আর hash তুলনা করে — মিললে True, না মিললে False।

bcrypt প্রতিবার hash করার সময় একটা random "salt" যোগ করে। তাই একই password দুইবার hash করলে দুটো আলাদা hash আসবে — এটা security এর জন্য ভালো।

## OAuth2PasswordBearer — FastAPI এর Built-in Flow

FastAPI তে OAuth2 password flow বানানোর জন্য `OAuth2PasswordBearer` দেওয়া আছে। এটা Swagger UI তে একটা "Authorize" button যোগ করে, যেখানে user username/password দিয়ে login করতে পারে।

```python
# OAuth2 password bearer setup
from fastapi.security import OAuth2PasswordBearer

# tokenUrl is the endpoint where user sends username+password to get token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@app.get("/users/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    # token is automatically extracted from Authorization: Bearer <token>
    return {"token": token}
```

`OAuth2PasswordBearer` একটা dependency হিসেবে কাজ করে। যেখানে এটা use করা হবে, সেখানে request এ `Authorization: Bearer <token>` header থাকতে হবে। না থাকলে FastAPI automatically 401 error দেয়।

`tokenUrl="auth/login"` বলে যে — token পাওয়ার জন্য user `/auth/login` endpoint এ username আর password পাঠাবে।

## JWT Token Create ও Validate

এখন চলো দেখি JWT token কীভাবে create আর validate করতে হয়। এর জন্য `python-jose` বা `PyJWT` library লাগবে।

```python
# JWT token creation and validation
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext

# Configuration
SECRET_KEY = "your-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Create a token
token = create_access_token({"sub": "user@example.com", "role": "admin"})
print(token)
# Output: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIi4...

# Decode it
payload = decode_token(token)
print(payload)
# Output: {'sub': 'user@example.com', 'role': 'admin', 'exp': 1719876543}
```

এই কোডে দুটা main function আছে:

- `create_access_token` — user এর info (যেমন email, role) নিয়ে একটা JWT বানায়। `exp` (expiry) field যোগ করে, যাতে ৩০ মিনিট পর token expire হয়।
- `decode_token` — token টা decode করে। যদি signature ভুল হয় বা token expire হয়ে থাকে, তাহলে `None` return করে।

JWT এর তিনটা অংশ থাকে — header, payload, signature। সবাই `.` দিয়ে আলাদা থাকে। Payload টা base64 encoded — কেউ decode করে দেখতে পারে। তাই password এর মতো sensitive data কখনো JWT এর ভেতরে রাখা যাবে না।

> [!warn] Secret Key management
> `SECRET_KEY` কখনো code এর ভেতর hardcode করবেন না। Production-এ environment variable থেকে পড়ো। যদি secret key leak হয়, যে কেউ fake JWT বানিয়ে যেকোনো user হিসেবে login করতে পারবে। Secret key generate করতে `python -c "import secrets; print(secrets.token_urlsafe(32))"` চালাও।

## HTTPBearer Security Scheme

`OAuth2PasswordBearer` ছাড়াও FastAPI তে `HTTPBearer` আছে। এটা আরও simple — শুধু Bearer token check করে, Swagger UI তে একটা simple token input field দেয়।

```python
# HTTPBearer for simpler token-based auth
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

@app.get("/protected")
async def protected(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials  # The token from Authorization header
    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"user": user}
```

`HTTPBearer` use করলে `credentials.credentials` থেকে token টা পাওয়া যায়। এটা `OAuth2PasswordBearer` এর চেয়ে simple, কিন্তু Swagger UI তে username/password login form থাকে না।

## Protected Routes — Depends(get_current_user)

এখন চলো একটা সম্পূর্ণ auth system বানাই। প্রথমে একটা `get_current_user` dependency বানাবো, যেটা token verify করে user কে return করবে। তারপর সেটা যেকোনো protected route এ use করতে পারবো।

```python
# get_current_user dependency
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Fake user database (in real app, use a real database)
fake_users_db = {
    "user@example.com": {
        "email": "user@example.com",
        "hashed_password": pwd_context.hash("password123"),
        "role": "user",
        "active": True,
    }
}

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    # Decode the token
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user = fake_users_db.get(email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user["active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return user

# Protected route
@app.get("/users/me")
async def read_current_user(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "role": current_user["role"],
    }
```

এই কোডে `get_current_user` হলো একটা dependency যেটা:
1. Token টা `Authorization` header থেকে নেয়
2. Token decode আর verify করে
3. User কে database থেকে খোঁজে
4. User active কি না check করে
5. সব ঠিক থাকলে user object return করে

`/users/me` endpoint এ `Depends(get_current_user)` দেওয়া আছে। তাই এই endpoint এ access করতে হলে valid token লাগবে। যদি token না থাকে বা invalid হয়, 401 error আসবে।

## Role-Based Access Control (RBAC)

শুধু authenticated হলেই হয় না — কেউ admin কি না, সেটাও check করতে হবে। এটাকে authorization বলে। FastAPI তে scopes ব্যবহার করে RBAC করা যায়।

```python
# Role-based access control with scopes
from fastapi import Security

# Define scopes
oauth2_scheme_scopes = OAuth2PasswordBearer(
    tokenUrl="auth/login",
    scopes={
        "admin": "Full access - admin operations",
        "user": "Read access - normal user operations",
        "write": "Write access - create and modify data",
    },
)

async def get_current_user_with_scopes(
    token: str = Security(oauth2_scheme_scopes, scopes=["user"])
) -> dict:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_scopes = payload.get("scopes", [])
    email = payload.get("sub")
    user = fake_users_db.get(email)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user["scopes"] = user_scopes
    return user

async def require_admin(
    current_user: dict = Security(get_current_user_with_scopes, scopes=["admin"])
):
    return current_user

# Normal user route
@app.get("/items")
async def list_items(user: dict = Depends(get_current_user_with_scopes)):
    return {"items": ["item1", "item2"], "requested_by": user["email"]}

# Admin only route
@app.delete("/items/{item_id}")
async def delete_item(item_id: str, admin: dict = Depends(require_admin)):
    return {"deleted": item_id, "by_admin": admin["email"]}
```

এই কোডে:

- `oauth2_scheme_scopes` এ তিনটা scope define করা — `admin`, `user`, `write`
- `get_current_user_with_scopes` minimum `user` scope চায়
- `require_admin` একটা wrapper যেটা `admin` scope চায়
- `/items` endpoint এ normal user access করতে পারবে (user scope লাগবে)
- `/items/{item_id}` DELETE শুধু admin পারবে (admin scope লাগবে)

Token create করার সময় user এর role অনুযায়ী scopes add করতে হবে:

```python
# Create token with scopes
def create_token_with_scopes(email: str, scopes: list[str]) -> str:
    return create_access_token({
        "sub": email,
        "scopes": scopes,
    })

# Admin login
admin_token = create_token_with_scopes("admin@example.com", ["user", "admin", "write"])
```

## Full Working Example — Register + Login + Protected

এখন চলো সব একসাথে যোগ করে একটা সম্পূর্ণ auth system বানাই।

```python
# Complete auth system: register + login + protected endpoint
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Annotated

app = FastAPI(title="Auth Demo API")

# Config
SECRET_KEY = "your-secret-key-here"  # Use env var in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Database (use real DB in production)
users_db: dict[str, dict] = {}

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    email: str
    full_name: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Token functions
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

# Auth dependencies
async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    email = payload.get("sub")
    if email is None or email not in users_db:
        raise credentials_exception

    user = users_db[email]
    if not user["active"]:
        raise HTTPException(status_code=403, detail="Inactive user")

    return user

# Routes
@app.post("/auth/register", response_model=UserResponse, status_code=201)
async def register(user: UserRegister):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    users_db[user.email] = {
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": pwd_context.hash(user.password),
        "role": "user",
        "active": True,
    }
    return users_db[user.email]

@app.post("/auth/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = users_db.get(form_data.username)
    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(data={
        "sub": user["email"],
        "role": user["role"],
    })
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: Annotated[dict, Depends(get_current_user)]):
    return current_user

@app.delete("/admin/users/{email}")
async def delete_user(
    email: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    del users_db[email]
    return {"deleted": email}
```

এই সম্পূর্ণ auth system এ ৪টা endpoint আছে:

1. **`POST /auth/register`** — user একটা email, password, আর full name দিয়ে register করে। Password hash হয়ে database এ save হয়।
2. **`POST /auth/login`** — user username (email) আর password দেয়। সব ঠিক থাকলে একটা JWT token পায়। এখানে `OAuth2PasswordRequestForm` use করা হয়েছে, যেটা standard OAuth2 form (username/password fields)।
3. **`GET /users/me`** — protected endpoint। Valid token লাগবে। Token থেকে user info return করে।
4. **`DELETE /admin/users/{email}`** — admin only endpoint। `get_current_user` দিয়ে user verify করে, তারপর check করে role admin কি না।

চলো দেখি এটা কীভাবে test করবো:

```bash
# 1. Register a new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123","full_name":"John Doe"}'
```

```json
{
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "user"
}
```

```bash
# 2. Login to get token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john@example.com&password=secret123"
```

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

```bash
# 3. Access protected endpoint with token
curl http://localhost:8000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```json
{
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "user"
}
```

## Refresh Tokens

Access token এর expiry ছোট রাখা উচিত (৩০ মিনিট)। কিন্তু user কে বারবার login করতে দিলে খারাপ experience হবে। সেজন্য refresh token ব্যবহার করা হয়।

Refresh token এর expiry বেশি (৭ দিন), আর এটা দিয়ে নতুন access token বানানো যায়।

```python
# Refresh token implementation
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/auth/refresh")
async def refresh_access_token(refresh_token: str):
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    email = payload.get("sub")
    user = users_db.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = create_access_token(data={
        "sub": user["email"],
        "role": user["role"],
    })
    return {"access_token": new_access_token, "token_type": "bearer"}
```

এই কোডে `create_refresh_token` একটা long-lived token বানায় (৭ দিন)। `/auth/refresh` endpoint এ এই refresh token পাঠালে নতুন access token পাওয়া যায়।

Flow টা হলো: user login করে → access token (৩০ min) + refresh token (৭ day) পায় → access token expire হলে refresh token দিয়ে নতুন access token নেয় → refresh token expire হলে আবার login করতে হবে।

> [!tip] Refresh token store করা
> Refresh token সাধারণত একটা database বা Redis এ store করা হয়, যাতে user logout করলে সেটা revoke করা যায়। শুধু JWT ভিত্তিক হলে revoke করা কঠিন — কারণ JWT self-contained, server এ কিছু store করা থাকে না।

## JWT Auth Flow Diagram

নিচের diagram তে সম্পূর্ণ JWT auth flow টা দেখানো হলো।

```mermaid
sequenceDiagram
    participant U as User/Browser
    participant API as FastAPI
    participant DB as Database

    U->>API: POST /auth/register {email, password}
    API->>DB: Store hashed password
    API-->>U: 201 Created

    U->>API: POST /auth/login {email, password}
    API->>DB: Verify password
    API-->>U: {access_token, refresh_token}

    Note over U: Token stored in localStorage/cookie

    U->>API: GET /users/me (Authorization: Bearer <token>)
    API->>API: Verify JWT signature + expiry
    API-->>U: User data

    Note over U: 30 min later, token expired

    U->>API: POST /auth/refresh {refresh_token}
    API->>API: Verify refresh token
    API-->>U: New access_token
```

## Summary

এই chapter এ যা যা শিখলাম:

- **Session vs Token** — Session server-এ store করতে হয়, JWT self-contained আর stateless
- **Password hashing** — `passlib` দিয়ে bcrypt/argon2 hash করা, plain text কখনো store করা যাবে না
- **OAuth2PasswordBearer** — FastAPI এর built-in OAuth2 flow, Swagger UI তে login form দেয়
- **JWT token** — `python-jose` বা `PyJWT` দিয়ে create আর validate করা
- **Protected routes** — `Depends(get_current_user)` দিয়ে যেকোনো route protect করা
- **RBAC** — scopes দিয়ে role-based access control
- **Refresh tokens** — long-lived token দিয়ে নতুন access token বানানো
- **Secret key** — কখনো hardcode করবেন না, environment variable থেকে পড়ো