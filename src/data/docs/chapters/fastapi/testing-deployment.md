## Testing ও Production Deployment

API বানালেই শেষ না — সেটা ঠিকমতো কাজ করছে কি না সেটা test করতে হবে। আর test পাশ করলে production-এ deploy করতে হবে। এই দুটোই একটা serious project এর জন্য অপরিহার্য।

এই chapter এ আমরা শিখবো pytest দিয়ে FastAPI test করা, dependency override করা, Docker দিয়ে deploy করা, আর CI/CD pipeline বানানো।

## Testing — TestClient

FastAPI তে সবচেয়ে সহজ test করার উপায় হলো `TestClient`। এটা Starlette এর একটা utility — যেটা আসলে একটা fake HTTP client বানায়, কোনো real server ছাড়াই।

```python
# Basic test with TestClient
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.get("/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id}

# Tests
client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}

def test_read_item():
    response = client.get("/items/42")
    assert response.status_code == 200
    assert response.json() == {"item_id": 42}

def test_read_item_not_found():
    # String passed where int expected
    response = client.get("/items/notanumber")
    assert response.status_code == 422
```

এই কোডে `TestClient(app)` দিয়ে একটা test client বানানো হয়েছে। এরপর `client.get("/")` দিয়ে যেন একটা real HTTP request পাঠানো হচ্ছে — কিন্তু আসলে কোনো server চালানো লাগে না।

প্রতিটা test function এ:
- একটা request পাঠানো হয়
- `response.status_code` দিয়ে status check করা হয়
- `response.json()` দিয়ে response body check করা হয়

তিনটা test আছে — root endpoint, item endpoint, আর validation error test। শেষেরটা খেয়াল করো — string পাঠানো হয়েছে যেখানে int দরকার, তাই 422 (Validation Error) আসবে।

## Testing with pytest + httpx.AsyncClient

`TestClient` sync — এটা সহজ কিন্তু async endpoint গুলো ঠিকমতো test করতে পারে না। সেজন্য `httpx.AsyncClient` ব্যবহার করা ভালো।

```python
# Async testing with httpx.AsyncClient
import pytest
from httpx import AsyncClient, ASGITransport
from myapp.main import app

@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

@pytest.mark.asyncio
async def test_read_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}

@pytest.mark.asyncio
async def test_create_item(client):
    response = await client.post(
        "/items",
        json={"name": "Laptop", "price": 999.99}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Laptop"
    assert data["price"] == 999.99
    assert "id" in data
```

এই কোডে:

- `@pytest.fixture` দিয়ে একটা `client` fixture বানানো হয়েছে — প্রতিটা test এর আগে একটা নতুন client তৈরি হবে
- `ASGITransport(app=app)` দিয়ে FastAPI app টাকে directly connect করা হয়েছে — কোনো real port লাগে না
- `@pytest.mark.asyncio` দিয়ে test গুলো async হিসেবে চলবে
- `await client.get()` আর `await client.post()` দিয়ে async request পাঠানো হয়

এটা `TestClient` এর চেয়ে ভালো কারণ — async endpoint, async database, async external API — সব ঠিকমতো test হয়।

## Dependency Override

Test এর সময় অনেক সময় real dependency use করা যায় না। যেমন — real database এ data রাখতে চাই না, real email পাঠাতে চাই না। এই সময় dependency override করা হয়।

```python
# Override dependencies for testing
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient

app = FastAPI()

# Real dependency - connects to real database
def get_db_session():
    db = connect_to_real_database()
    try:
        yield db
    finally:
        db.close()

# Real dependency - sends real email
def get_email_service():
    return RealEmailService()

@app.post("/users")
def create_user(
    user: UserCreate,
    db = Depends(get_db_session),
    email_service = Depends(get_email_service)
):
    db_user = db.create(user)
    email_service.send_welcome(db_user.email)
    return db_user

# --- Tests ---

# Fake database
class FakeDB:
    def __init__(self):
        self.users = []

    def create(self, user):
        user.id = len(self.users) + 1
        self.users.append(user)
        return user

# Fake email service
class FakeEmailService:
    def __init__(self):
        self.sent_emails = []

    def send_welcome(self, email):
        self.sent_emails.append(email)

# Override dependencies
def override_get_db():
    fake_db = FakeDB()
    yield fake_db

def override_get_email():
    return FakeEmailService()

app.dependency_overrides[get_db_session] = override_get_db
app.dependency_overrides[get_email_service] = override_get_email

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/users",
        json={"email": "test@example.com", "name": "Test User"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

# Clean up after tests
def teardown_module():
    app.dependency_overrides.clear()
```

এই কোডে `app.dependency_overrides` দিয়ে real dependency গুলোকে fake version দিয়ে replace করা হয়েছে:

- `get_db_session` → `FakeDB` (in-memory list, real database নয়)
- `get_email_service` → `FakeEmailService` (real email পাঠায় না, শুধু list এ store করে)

এভাবে test গুলো isolated হয় — real database বা external service এর উপর depend করে না। Test শেষ হলে `dependency_overrides.clear()` দিয়ে override গুলো পরিষ্কার করা হয়।

## Testing Auth

Authentication যুক্ত endpoint test করার জন্য valid token দিয়ে request পাঠাতে হবে। নিচের কোডে সেটা দেখানো হলো।

```python
# Testing authenticated endpoints
from fastapi.testclient import TestClient
from myapp.main import app, create_access_token

client = TestClient(app)

def get_auth_headers(email: str = "test@example.com") -> dict:
    token = create_access_token({"sub": email, "role": "user"})
    return {"Authorization": f"Bearer {token}"}

def test_protected_endpoint_without_token():
    response = client.get("/users/me")
    assert response.status_code == 401

def test_protected_endpoint_with_token():
    headers = get_auth_headers("alice@example.com")
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"

def test_admin_endpoint_as_normal_user():
    headers = get_auth_headers("bob@example.com")
    response = client.delete("/admin/users/someone", headers=headers)
    assert response.status_code == 403

def test_admin_endpoint_as_admin():
    token = create_access_token({"sub": "admin@example.com", "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}
    response = client.delete("/admin/users/someone", headers=headers)
    assert response.status_code in [200, 404]  # 404 if user doesn't exist
```

এই কোডে চারটা test আছে:

1. Token ছাড়া protected endpoint এ গেলে 401
2. Valid token দিয়ে গেলে 200 আর user data
3. Normal user admin endpoint এ access করলে 403
4. Admin user admin endpoint এ access করলে success (বা 404)

`get_auth_headers` helper function টা একটা token বানিয়ে `Authorization` header তৈরি করে — যাতে প্রতিটা test এ বারবার না লিখতে হয়।

## Testing Database

Database যুক্ত endpoint test করার জন্য একটা separate test database ব্যবহার করা উচিত। নিচের pattern টা common।

```python
# Testing with a test database
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient, ASGITransport
from myapp.main import app, get_session, Base

# Test database URL (separate from production!)
TEST_DATABASE_URL = "postgresql+asyncpg://user:pass@localhost:5432/test_db"

# Create test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

# Override the database session dependency
async def override_get_session():
    async with test_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

app.dependency_overrides[get_session] = override_get_session

@pytest_asyncio.fixture
async def setup_db():
    # Create tables before tests
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield  # Tests run here

    # Drop tables after tests
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def client(setup_db):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

@pytest.mark.asyncio
async def test_create_and_get_todo(client):
    # Create a todo
    response = await client.post(
        "/todos",
        json={"title": "Buy groceries", "user_id": 1}
    )
    assert response.status_code == 201
    todo_id = response.json()["id"]

    # Get the todo
    response = await client.get(f"/todos")
    assert response.status_code == 200
    todos = response.json()
    assert len(todos) == 1
    assert todos[0]["title"] == "Buy groceries"
```

এই কোডে:

- `TEST_DATABASE_URL` — একটা আলাদা test database, production database নয়
- `override_get_session` — real session এর জায়গায় test session use করা হয়
- `setup_db` fixture — test এর আগে table তৈরি করে, পরে drop করে (clean slate)
- `client` fixture — `setup_db` এর উপর depend করে, তাই প্রতিটা test এ clean database থাকে

## Fixture Patterns for FastAPI

নিচে কিছু common fixture pattern দেখানো হলো যেগুলো প্রায় প্রতিটা FastAPI project এ দরকার হয়।

```python
# conftest.py - shared fixtures
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from myapp.main import app

@pytest_asyncio.fixture
async def client():
    """Provides an async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

@pytest.fixture
def auth_headers():
    """Provides auth headers for a regular user."""
    from myapp.auth import create_access_token
    token = create_access_token({"sub": "user@test.com", "role": "user"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers():
    """Provides auth headers for an admin."""
    from myapp.auth import create_access_token
    token = create_access_token({"sub": "admin@test.com", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_todo():
    """Sample todo data for tests."""
    return {"title": "Test Todo", "description": "A test item"}

@pytest.fixture
def created_todo(client, auth_headers, sample_todo):
    """Creates a todo and returns it. Sync fixture calling async."""
    import asyncio
    async def _create():
        response = await client.post(
            "/todos",
            json=sample_todo,
            headers=auth_headers
        )
        return response.json()
    return asyncio.get_event_loop().run_until_complete(_create())
```

এই fixture গুলো `conftest.py` তে রাখলে সব test file এ automatically available হবে। প্রতিটা fixture একটা নির্দিষ্ট কাজ করে — client তৈরি, auth header তৈরি, sample data তৈরি। এভাবে code reuse বাড়ে আর test গুলো clean থাকে।

## Docker Deployment

Production-এ FastAPI deploy করার সবচেয়ে common উপায় হলো Docker। নিচে একটা multi-stage Dockerfile দেখানো হলো।

```dockerfile
# Multi-stage Dockerfile for FastAPI
# Stage 1: Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production stage
FROM python:3.12-slim AS production

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Set environment variables
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Run as non-root user for security
RUN useradd -m appuser
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run with gunicorn + uvicorn workers
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
```

এই Dockerfile এ দুটা stage আছে:

1. **Build stage** — build dependencies install করে (build-essential, libpq-dev), Python package গুলো install করে। এই stage এ অনেক file থাকে যেগুলো production এ দরকার নেই।
2. **Production stage** — শুধু runtime dependencies (libpq5), build stage থেকে installed package গুলো copy করে। অনেক ছোট image হয়।

গুরুত্বপূর্ণ পয়েন্ট গুলো:
- `useradd appuser` দিয়ে একটা non-root user তৈরি করা হয়েছে — security best practice
- `HEALTHCHECK` দিয়ে container এর health monitor করা হয়
- `gunicorn` দিয়ে ৪টা worker process চালানো হয়

### docker-compose.yml

```yaml
# docker-compose.yml for production
version: "3.9"

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/mydb
      - SECRET_KEY=${SECRET_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: always

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

এই docker-compose এ তিনটা service আছে:

- **api** — FastAPI application, ৪টা worker সহ
- **db** — PostgreSQL database, health check সহ
- **redis** — Redis (caching, rate limiting, task queue এর জন্য)

`depends_on` দিয়ে নিশ্চিত করা হয়েছে যে database ready হওয়ার পরেই API start হবে। `pgdata` volume দিয়ে database data persistent হবে — container মারলেও data থাকবে।

## Gunicorn + Uvicorn Workers

Production-এ `uvicorn` একা চালালে শুধু একটা process থাকে। কিন্তু বাস্তবে multiple process দরকার — যাতে multiple CPU core use হয় আর একটা process crash হলে পুরো app down না হয়।

```bash
# Production command: gunicorn with uvicorn workers
gunicorn main:app \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    -b 0.0.0.0:8000 \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile -
```

এই command এ:

- `-w 4` — ৪টা worker process (সাধারণত CPU core এর ২-৪ গুণ)
- `-k uvicorn.workers.UvicornWorker` — async worker (FastAPI এর জন্য দরকার)
- `-b 0.0.0.0:8000` — port 8000 এ bind
- `--timeout 120` — request timeout ২ মিনিট
- `--keep-alive 5` — keep-alive connection ৫ সেকেন্ড
- `--access-logfile -` আর `--error-logfile -` — log গুলো stdout এ পাঠায়

> [!tip] Production-এ always `--workers 4` বা তার বেশি use করুন
> Single worker দিলে একটা CPU core-ই use হবে। Multiple worker দিলে multiple core use হবে, আর throughput অনেক বেশি হবে। সাধারণ নিয়ম: `(2 × CPU cores) + 1`। যেমন ৪ core CPU তে ৯টা worker। কিন্তু বেশি worker মানে বেশি memory — তাই memory দেখে adjust করো।

## Environment Variables with pydantic-settings

Configuration কখনো code এ hardcode করা যাবে না। Environment variable থেকে পড়তে হয়। এর জন্য `pydantic-settings` খুব ভালো।

```python
# Configuration with pydantic-settings
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://localhost/mydb"

    # Security
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 30

    # Redis
    redis_url: str = "redis://localhost:6379"

    # App
    app_name: str = "My API"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

# Singleton instance
settings = Settings()

# Use in app
app = FastAPI(title=settings.app_name, debug=settings.debug)

# Use in auth
def create_access_token(data: dict):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    # ...
```

এই কোডে `Settings` class টা environment variable গুলোকে type-safe ভাবে পড়ে। `.env` file থেকেও পড়ে, আর system environment variable থেকেও। প্রতিটা variable এর একটা default value আছে — dev এর জন্য, production এ override করা যায়।

`.env` file টা এমন হবে:

```bash
# .env file
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/mydb
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
REDIS_URL=redis://redis:6379
DEBUG=false
CORS_ORIGINS=["https://app.example.com","https://admin.example.com"]
```

> [!warn] .env file কখনো git এ commit করবেন না
> `.env` file এ secret key, database password এর মতো sensitive data থাকে। `.gitignore` তে `.env` যোগ করো। Production-এ secret গুলো environment variable বা secret manager (AWS Secrets Manager, HashiCorp Vault) থেকে পড়ো।

## CI/CD with GitHub Actions

CI/CD pipeline বানালে প্রতিবার code push করলে automatically test চলে, আর test পাশ করলে deploy হয়। নিচে একটা GitHub Actions workflow দেখানো হলো।

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-asyncio httpx

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          SECRET_KEY: test-secret-key
        run: pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            myorg/myapi:latest
            myorg/myapi:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/myapi
            docker compose pull
            docker compose up -d
            docker image prune -f
```

এই workflow এ তিনটা job আছে:

1. **test** — PostgreSQL আর Redis service container সহ test চালায়। Test পাশ করলেই পরের job চলে।
2. **build-and-push** — Docker image build করে Docker Hub এ push করে (শুধু main branch এ)। দুটা tag দেয় — `latest` আর commit SHA।
3. **deploy** — SSH দিয়ে server এ গিয়ে `docker compose pull` আর `docker compose up -d` চালায়।

`needs` দিয়ে নিশ্চিত করা হয়েছে — test পাশ না করলে build হবে না, build না হলে deploy হবে না।

## Health Check Endpoints

Production-এ একটা health check endpoint থাকা দরকার — Docker, load balancer, monitoring tool সব এটা check করে যে app alive কি না।

```python
# Health check endpoints
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI()

@app.get("/health")
async def health_check():
    """Simple liveness check."""
    return {"status": "healthy"}

@app.get("/health/ready")
async def readiness_check(session: AsyncSession = Depends(get_session)):
    """Readiness check - verifies DB connection."""
    try:
        from sqlalchemy import text
        result = await session.execute(text("SELECT 1"))
        result.scalar()
        return {
            "status": "ready",
            "database": "connected",
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "database": "disconnected",
            "error": str(e),
        }
```

দুই ধরনের health check আছে:

- **`/health`** — liveness check, শুধু দেখে app চলছে কি না। দ্রুত response দেয়। Docker এর `HEALTHCHECK` এর জন্য এটা।
- **`/health/ready`** — readiness check, database সহ সব dependency ঠিক আছে কি না দেখে। Load balancer এটা use করে — যদি "not_ready" আসে, traffic পাঠাবে না।

## CI/CD Pipeline Diagram

নিচের diagram তে সম্পূর্ণ dev → test → Docker → deploy pipeline দেখানো হলো।

```mermaid
flowchart LR
    subgraph Dev
        D[Developer writes code] --> P[git push to main]
    end

    subgraph CI
        P --> T[Run pytest]
        T -->|pass| B[Build Docker image]
        T -->|fail| F[Notify developer]
        B --> PU[Push to Docker Hub]
    end

    subgraph CD
        PU --> SSH[SSH to production server]
        SSH --> PULL[docker compose pull]
        PULL --> UP[docker compose up -d]
        UP --> H[Health check]
        H -->|healthy| DONE[Deployment complete]
        H -->|unhealthy| ROLL[Rollback]
    end
```

পুরো flow টা হলো: developer code লেখে → git push করে → CI তে test চলে → test পাশ করলে Docker image build হয় → Docker Hub এ push হয় → production server এ SSH করে নতুন image pull হয় → container restart হয় → health check হয় → সব ঠিক থাকলে deployment complete।

## Summary

এই chapter এ যা যা শিখলাম:

- **TestClient** — sync test এর জন্য, সহজ কিন্তু limited
- **httpx.AsyncClient** — async test এর জন্য, আরও ভালো
- **Dependency override** — `app.dependency_overrides` দিয়ে real dependency কে fake দিয়ে replace
- **Testing auth** — token বানিয়ে `Authorization` header এ পাঠাও
- **Testing database** — separate test database, table তৈরি আর drop করার fixture
- **Fixture patterns** — `conftest.py` তে shared fixture রাখো
- **Docker** — multi-stage Dockerfile, non-root user, health check
- **docker-compose** — API + PostgreSQL + Redis একসাথে
- **Gunicorn + Uvicorn** — `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker`
- **pydantic-settings** — environment variable থেকে config পড়ো
- **GitHub Actions** — test → build → deploy pipeline
- **Health check** — `/health` (liveness) আর `/health/ready` (readiness)
- **Production-এ** `--workers 4` বা তার বেশি use করো